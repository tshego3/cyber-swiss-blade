import { onDataChange } from '../../core/db';
import { el, replaceChildren, type Child } from '../../core/dom';
import { addDays, formatDate, fromIsoDate, startOfWeek, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, copyToClipboard, errorState, loadingState, toast } from '../../core/ui';
import {
  buildDays,
  codeNameMap,
  continueFrom,
  formatHourValue,
  isWeekend,
  logs,
  monthDates,
  newLog,
  parseHours,
  recentWorkItems,
  routineLogs,
  extractRows,
  extractTsv,
  toTsv,
  weekDates,
} from './data';
import { timesheetHeader } from './header';
import { exportYear, loadTimesheet, logsFor, teamOwners, type Owner, type TimesheetData } from './load';
import { KIND_BADGES, KIND_LABELS, TIMESHEET_COLLECTIONS, type DaySheet, type LogKind, type TimeLog } from './types';

const SAVE_DELAY_MS = 500;
const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const DAY_MONTH = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const ADD_KINDS: readonly LogKind[] = ['work', 'meeting', 'note', 'leave', 'holiday'];
const STATUS_TEXT: Readonly<Record<DaySheet['status'], string>> = {
  empty: 'Nothing logged',
  planned: 'Planned, 0 hours',
  under: 'Under target',
  complete: 'Complete',
  over: 'Over target',
  leave: 'Leave',
  weekend: 'Weekend',
};

interface DayParts {
  readonly article: HTMLElement;
  readonly codes: HTMLElement;
  readonly hours: HTMLElement;
  readonly meter: HTMLElement;
  readonly comment: HTMLElement;
}

export function mountWeek(root: HTMLElement, context: ModuleContext, initialDate: string | undefined): Unmount {
  const userId = context.user?.id ?? '';
  const today = toIsoDate(new Date());
  let date = initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : today;
  let owner = userId;
  let owners: readonly Owner[] = [];
  let data: TimesheetData | null = null;
  let errorMessage: string | null = null;
  let disposed = false;
  let pendingReload = false;
  const open = new Set<string>([today]);
  const parts = new Map<string, DayParts>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const workItems = el('datalist', { attrs: { id: 'ts-work-items' } });
  const meetingNames = el('datalist', { attrs: { id: 'ts-meetings' } });
  const content = el('div', { class: 'stack-lg' });

  const readOnly = (): boolean => !context.canEdit || owner !== userId;
  const visibleLogs = (): Entity<TimeLog>[] => (data ? logsFor(data.logs, owner, userId) : []);
  const codeNames = (): Map<string, string> => codeNameMap(data?.codes ?? []);
  const target = (): number => data?.prefs.dailyTarget ?? 8;

  const load = async (): Promise<void> => {
    try {
      data = await loadTimesheet(userId);
      owners = await teamOwners(data.logs, context.user);
      errorMessage = null;
    } catch (error) {
      console.error('Timesheet failed to load', error);
      errorMessage = 'Unable to load your timesheet.';
    }
    if (!disposed) render();
  };

  const setDate = (next: string, openDay = false): void => {
    date = next;
    if (openDay) open.add(next);
    history.replaceState(null, '', `#/timesheet/week/${startOfWeek(next)}`);
    render();
  };

  const editing = (): boolean => root.contains(document.activeElement) && document.activeElement instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

  const persist = (log: Entity<TimeLog>): void => {
    clearTimeout(timers.get(log.id));
    timers.set(
      log.id,
      setTimeout(() => {
        timers.delete(log.id);
        logs.save(log, log.id).catch((error: unknown) => {
          console.error('Saving a log failed', error);
          toast('A change could not be saved.', 'error');
        });
      }, SAVE_DELAY_MS),
    );
  };

  const replaceLog = (updated: Entity<TimeLog>): void => {
    if (!data) return;
    data = { ...data, logs: data.logs.map((log) => (log.id === updated.id ? updated : log)) };
    persist(updated);
    refreshDay(updated.date);
  };

  const addLogs = async (list: readonly TimeLog[], focusDate?: string): Promise<void> => {
    if (!data || list.length === 0) return;
    const saved = await Promise.all(list.map((log) => logs.save(log)));
    data = { ...data, logs: [...data.logs, ...saved] };
    if (focusDate) open.add(focusDate);
    render();
    const last = saved.at(-1);
    if (focusDate && last) root.querySelector<HTMLElement>(`[data-log="${last.id}"] input, [data-log="${last.id}"] textarea`)?.focus();
  };

  const removeLog = async (log: Entity<TimeLog>): Promise<void> => {
    if (!data) return;
    clearTimeout(timers.get(log.id));
    timers.delete(log.id);
    await logs.remove(log.id);
    data = { ...data, logs: data.logs.filter((item) => item.id !== log.id) };
    render();
  };

  const days = (): DaySheet[] => buildDays(weekDates(date), visibleLogs(), codeNames(), target());

  const refreshDay = (day: string): void => {
    const sheet = buildDays([day], visibleLogs(), codeNames(), target())[0];
    const view = parts.get(day);
    if (!sheet || !view) return;
    view.article.dataset.status = sheet.status;
    view.codes.textContent = sheet.codes || STATUS_TEXT[sheet.status];
    view.hours.textContent = `${formatHourValue(sheet.hours)} h`;
    view.meter.style.setProperty('--fill', String(Math.min(sheet.hours / target(), 1)));
    view.comment.textContent = sheet.comment;
    renderSummary();
  };

  const summary = el('div', { class: 'ts-summary' });
  const renderSummary = (): void => {
    const week = days();
    const total = week.reduce((sum, day) => sum + day.hours, 0);
    const workdays = week.filter((day) => !isWeekend(day.date)).length;
    replaceChildren(summary, [el('span', { class: 'ts-total mono', text: `${formatHourValue(total)} h` }), el('span', { class: 'muted', text: ` of ${formatHourValue(target() * workdays)} h` })]);
  };

  const fillWeek = async (): Promise<void> => {
    if (!data) return;
    const additions = routineLogs(weekDates(date), visibleLogs(), data.prefs);
    if (additions.length === 0) {
      toast(data.prefs.standingNote || data.prefs.meetings.length > 0 ? 'Every workday already has entries.' : 'Set up your routine on the Settings tab first.');
      return;
    }
    await addLogs(additions);
    toast(`Added ${additions.length} routine entr${additions.length === 1 ? 'y' : 'ies'}`, 'success');
  };

  const logEditor = (log: Entity<TimeLog>): HTMLElement => {
    const disabled = readOnly();
    const update = (patch: Partial<TimeLog>): void => {
      const current = data?.logs.find((item) => item.id === log.id);
      if (current) replaceLog({ ...current, ...patch });
    };
    const codeSelect = el(
      'select',
      { class: 'input', attrs: { 'aria-label': 'Project or billing code (column B)', disabled } },
      [
        el('option', { text: 'No project', attrs: { value: '' } }),
        ...(data?.codes ?? []).filter((code) => !code.archived || code.id === log.codeId).map((code) => el('option', { text: code.name, attrs: { value: code.id, selected: code.id === log.codeId } })),
      ],
    );
    codeSelect.addEventListener('change', () => update({ codeId: codeSelect.value }));
    const hours = el('input', { class: 'input ts-hours-input mono', attrs: { value: formatHourValue(log.hours), inputmode: 'decimal', 'aria-label': 'Hours', disabled } });
    hours.addEventListener('input', () => {
      const value = parseHours(hours.value);
      hours.setAttribute('aria-invalid', String(value === null));
      if (value !== null) update({ hours: value });
    });
    const textField = (field: 'workItem' | 'title', label: string, list: string): HTMLInputElement => {
      const input = el('input', { class: 'input', attrs: { value: log[field], placeholder: label, 'aria-label': label, list, disabled } });
      input.addEventListener('input', () => update(field === 'workItem' ? { workItem: input.value } : { title: input.value }));
      return input;
    };
    const comment = el('textarea', { class: 'input ts-comment-input', text: log.comment, attrs: { rows: 2, placeholder: log.kind === 'work' ? 'What did you do?' : 'Comment (optional)', 'aria-label': 'Comment', disabled } });
    comment.addEventListener('input', () => update({ comment: comment.value }));
    const summary = el('textarea', { class: 'input ts-comment-input', text: log.summary, attrs: { rows: 2, placeholder: 'Summary (optional). Printed in [ ] after the text.', 'aria-label': 'Summary', disabled } });
    summary.addEventListener('input', () => update({ summary: summary.value }));
    const fields: Child[] =
      log.kind === 'work'
        ? [textField('workItem', 'Billing code, for example CR-9001_00012345', 'ts-work-items'), comment, summary]
        : log.kind === 'meeting'
          ? [textField('title', 'Meeting name', 'ts-meetings'), comment]
          : [comment];
    return el('div', { class: 'ts-log', attrs: { 'data-log': log.id, 'data-kind': log.kind } }, [
      el('span', { class: 'tag ts-kind', text: KIND_BADGES[log.kind], attrs: { title: KIND_LABELS[log.kind] } }),
      el('div', { class: 'ts-log-fields' }, [...fields, el('div', { class: 'ts-log-meta' }, [codeSelect, el('label', { class: 'ts-hours-field' }, [hours, el('span', { class: 'muted', text: 'h' })])])]),
      !disabled && button({ label: `Delete ${KIND_LABELS[log.kind].toLowerCase()}`, icon: 'trash', iconOnly: true, variant: 'ghost', onClick: () => void removeLog(log) }),
    ]);
  };

  const dayCard = (day: DaySheet): HTMLElement => {
    const isOpen = open.has(day.date);
    const codes = el('span', { class: 'ts-codes', text: day.codes || STATUS_TEXT[day.status] });
    const hours = el('span', { class: 'ts-hours mono', text: `${formatHourValue(day.hours)} h` });
    const meter = el('span', { class: 'ts-meter', attrs: { 'aria-hidden': 'true' } });
    meter.style.setProperty('--fill', String(Math.min(day.hours / target(), 1)));
    const comment = el('p', { class: 'ts-comment', text: day.comment });
    const head = el(
      'button',
      { class: 'ts-day-head', attrs: { type: 'button', 'aria-expanded': String(isOpen) } },
      [el('span', { class: 'ts-date' }, [el('strong', { text: WEEKDAY.format(fromIsoDate(day.date)) }), el('span', { text: DAY_MONTH.format(fromIsoDate(day.date)) })]), codes, el('span', { class: 'ts-hours-wrap' }, [hours, meter])],
    );
    head.addEventListener('click', () => {
      if (open.has(day.date)) open.delete(day.date);
      else open.add(day.date);
      render();
    });
    const disabled = readOnly();
    const editor =
      isOpen &&
      el('div', { class: 'ts-editor' }, [
        ...day.logs.map(logEditor),
        !disabled &&
          el('div', { class: 'ts-add' }, [
            ...ADD_KINDS.map((kind) =>
              button({ label: KIND_LABELS[kind], icon: 'plus', variant: 'ghost', onClick: () => void addLogs([newLog(day.date, kind, data?.prefs.defaultCodeId ?? '', day.logs.length + 1)], day.date) }),
            ),
            button({ label: 'Continue last day', icon: 'refresh', variant: 'ghost', onClick: () => void continueLastDay(day.date) }),
          ]),
      ]);
    const article = el('article', { class: `card ts-day${isOpen ? ' is-open' : ''}${day.date === today ? ' is-today' : ''}`, attrs: { 'data-status': day.status, 'data-date': day.date } }, [
      head,
      el('div', { class: 'ts-day-body' }, [comment, day.logs.length > 0 && button({ label: `Copy ${formatDate(day.date)} for Excel`, icon: 'copy', iconOnly: true, variant: 'ghost', onClick: () => void copyToClipboard(toTsv([day])) })]),
      editor,
    ]);
    parts.set(day.date, { article, codes, hours, meter, comment });
    return article;
  };

  const continueLastDay = async (day: string): Promise<void> => {
    const additions = continueFrom(day, visibleLogs());
    if (additions.length === 0) toast('No work items in the last two weeks.');
    else await addLogs(additions, day);
  };

  const monthStrip = (): HTMLElement => {
    const anchor = fromIsoDate(date);
    const month = monthDates(anchor.getFullYear(), anchor.getMonth() + 1);
    const sheets = buildDays(month, visibleLogs(), codeNames(), target());
    const week = new Set(weekDates(date));
    return el('nav', { class: 'ts-strip', attrs: { 'aria-label': 'Days this month' } }, [
      el('span', { class: 'ts-strip-month', text: new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(anchor) }),
      el(
        'div',
        { class: 'ts-strip-days' },
        sheets.map((sheet) =>
          el(
            'button',
            {
              class: `ts-strip-day${week.has(sheet.date) ? ' is-week' : ''}${sheet.date === today ? ' is-today' : ''}`,
              attrs: { type: 'button', 'data-status': sheet.status, title: `${formatDate(sheet.date)}: ${STATUS_TEXT[sheet.status]}, ${formatHourValue(sheet.hours)} h` },
              on: { click: () => setDate(sheet.date, true) },
            },
            [el('span', { text: String(fromIsoDate(sheet.date).getDate()) })],
          ),
        ),
      ),
    ]);
  };

  const toolbar = (): HTMLElement => {
    const monday = startOfWeek(date);
    const jump = el('input', { class: 'input ts-jump', attrs: { type: 'date', value: date, 'aria-label': 'Go to date' } });
    jump.addEventListener('change', () => {
      if (jump.value) setDate(jump.value, true);
    });
    const ownerSelect =
      owners.length > 0 &&
      el('select', { class: 'input ts-owner', attrs: { 'aria-label': 'Show the timesheet of' } }, [
        el('option', { text: 'My timesheet', attrs: { value: userId, selected: owner === userId } }),
        ...owners.map((item) => el('option', { text: item.name, attrs: { value: item.id, selected: owner === item.id } })),
      ]);
    if (ownerSelect) {
      ownerSelect.addEventListener('change', () => {
        owner = ownerSelect.value;
        render();
      });
    }
    return el('div', { class: 'week-bar' }, [
      el('div', { class: 'week-head' }, [
        el('div', { class: 'week-nav' }, [
          button({ label: 'Previous week', icon: 'chevron-left', iconOnly: true, variant: 'ghost', onClick: () => setDate(addDays(monday, -7)) }),
          button({ label: 'Today', variant: 'ghost', onClick: () => setDate(today, true) }),
          button({ label: 'Next week', icon: 'chevron-right', iconOnly: true, variant: 'ghost', onClick: () => setDate(addDays(monday, 7)) }),
          jump,
        ]),
        el('div', { class: 'week-title' }, [el('span', { class: 'week-label', text: `${DAY_MONTH.format(fromIsoDate(monday))} – ${formatDate(addDays(monday, 6), 'long')}` }), summary]),
      ]),
      el('div', { class: 'week-actions' }, [
        ownerSelect,
        !readOnly() && button({ label: 'Fill week from routine', icon: 'refresh', onClick: () => void fillWeek() }),
        button({ label: 'Copy week', icon: 'copy', onClick: () => void copyToClipboard(toTsv(days())) }),
        button({ label: 'Copy by billing code', icon: 'copy', onClick: () => void copyToClipboard(extractTsv(days().flatMap((day) => extractRows(day.date, day.logs, codeNames())))) }),
      ]),
    ]);
  };

  const render = (): void => {
    parts.clear();
    if (!data && !errorMessage) {
      replaceChildren(content, [loadingState('Loading your timesheet')]);
      return;
    }
    if (errorMessage || !data) {
      replaceChildren(content, [errorState(errorMessage ?? 'Unable to load your timesheet.', () => void load())]);
      return;
    }
    replaceChildren(workItems, recentWorkItems(visibleLogs()).map((item) => el('option', { attrs: { value: item } })));
    replaceChildren(meetingNames, data.prefs.meetings.map((meeting) => el('option', { attrs: { value: meeting.name } })));
    const notice = readOnly() && el('p', { class: 'tool-status', text: owner === userId ? 'You can view this timesheet but not change it.' : 'You are viewing a team member timesheet. It is read-only.' });
    replaceChildren(content, [toolbar(), monthStrip(), notice, el('div', { class: 'ts-days' }, days().map(dayCard))]);
    renderSummary();
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || editing()) return;
    if (event.target instanceof HTMLElement && event.target.closest('dialog')) return;
    if (event.key === 'ArrowLeft') setDate(addDays(startOfWeek(date), -7));
    else if (event.key === 'ArrowRight') setDate(addDays(startOfWeek(date), 7));
    else if (event.key.toLowerCase() === 't') setDate(today, true);
  };

  const onFocusOut = (): void => {
    setTimeout(() => {
      if (pendingReload && !editing()) {
        pendingReload = false;
        void load();
      }
    }, 0);
  };

  const stopChanges = onDataChange((collection, source) => {
    if (source !== 'remote' || !Object.values<string>(TIMESHEET_COLLECTIONS).includes(collection)) return;
    if (editing()) pendingReload = true;
    else void load();
  });

  const exportButton = button({ label: 'Export .xlsx', icon: 'download', onClick: () => void (data && exportYear(fromIsoDate(date).getFullYear(), data, logsFor(data.logs, owner, userId))) });
  root.append(timesheetHeader('week', [exportButton]), workItems, meetingNames, content);
  document.addEventListener('keydown', onKey);
  root.addEventListener('focusout', onFocusOut);
  render();
  void load();

  return () => {
    disposed = true;
    for (const [id, timer] of timers) {
      clearTimeout(timer);
      const log = data?.logs.find((item) => item.id === id);
      if (log) void logs.save(log, log.id);
    }
    stopChanges();
    document.removeEventListener('keydown', onKey);
    root.replaceChildren();
  };
}
