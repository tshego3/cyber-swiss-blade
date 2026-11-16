import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { fromIsoDate, toIsoDate } from '../../core/format';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, copyToClipboard, emptyState, errorState, loadingState } from '../../core/ui';
import { buildDays, codeNameMap, extractRows, extractTsv, formatHourValue, isWeekend, monthDates, toTsv } from './data';
import { timesheetHeader } from './header';
import { exportYear, loadTimesheet, logsFor, type TimesheetData } from './load';
import { TIMESHEET_COLLECTIONS } from './types';

const DATE = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const MONTH = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

function parseMonth(value: string | undefined): { readonly year: number; readonly month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  const now = new Date();
  return match ? { year: Number(match[1]), month: Math.min(12, Math.max(1, Number(match[2]))) } : { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function mountMonth(root: HTMLElement, context: ModuleContext, initial: string | undefined): Unmount {
  const userId = context.user?.id ?? '';
  let { year, month } = parseMonth(initial);
  let data: TimesheetData | null = null;
  let errorMessage: string | null = null;
  let disposed = false;
  const content = el('div', { class: 'stack-lg' });

  const load = async (): Promise<void> => {
    try {
      data = await loadTimesheet(userId);
      errorMessage = null;
    } catch (error) {
      console.error('Timesheet failed to load', error);
      errorMessage = 'Unable to load your timesheet.';
    }
    if (!disposed) render();
  };

  const shift = (delta: number): void => {
    const next = new Date(year, month - 1 + delta, 1);
    year = next.getFullYear();
    month = next.getMonth() + 1;
    history.replaceState(null, '', `#/timesheet/month/${year}-${String(month).padStart(2, '0')}`);
    render();
  };

  const render = (): void => {
    if (errorMessage) return replaceChildren(content, [errorState(errorMessage, () => void load())]);
    if (!data) return replaceChildren(content, [loadingState('Loading your timesheet')]);
    const own = logsFor(data.logs, userId, userId);
    const days = buildDays(monthDates(year, month), own, codeNameMap(data.codes), data.prefs.dailyTarget);
    const total = days.reduce((sum, day) => sum + day.hours, 0);
    const logged = days.filter((day) => day.logs.length > 0).length;
    const today = toIsoDate(new Date());
    const rows = days.map((day) =>
      el('tr', { class: `${isWeekend(day.date) ? 'is-weekend' : ''}${day.date === today ? ' is-today' : ''}`, attrs: { 'data-status': day.status } }, [
        el('td', { class: 'ts-month-date' }, [el('a', { text: DATE.format(fromIsoDate(day.date)), attrs: { href: `#/timesheet/week/${day.date}` } })]),
        el('td', { text: day.codes }),
        el('td', { class: 'mono cell-center', text: day.logs.length > 0 ? formatHourValue(day.hours) : '' }),
        el('td', { class: 'ts-month-comment', text: day.comment }),
      ]),
    );
    replaceChildren(content, [
      el('div', { class: 'week-bar' }, [
        el('div', { class: 'week-head' }, [
          el('div', { class: 'week-nav' }, [
            button({ label: 'Previous month', icon: 'chevron-left', iconOnly: true, variant: 'ghost', onClick: () => shift(-1) }),
            button({ label: 'Next month', icon: 'chevron-right', iconOnly: true, variant: 'ghost', onClick: () => shift(1) }),
          ]),
          el('div', { class: 'week-title' }, [
            el('span', { class: 'week-label', text: MONTH.format(new Date(year, month - 1, 1)) }),
            el('span', { class: 'ts-summary' }, [el('span', { class: 'ts-total mono', text: `${formatHourValue(total)} h` }), el('span', { class: 'muted', text: ` · ${logged} days logged` })]),
          ]),
        ]),
        el('div', { class: 'week-actions' }, [
          button({ label: 'Copy month', icon: 'copy', onClick: () => void copyToClipboard(toTsv(days)) }),
          button({ label: 'Copy by billing code', icon: 'copy', onClick: () => void copyToClipboard(extractTsv(days.flatMap((day) => extractRows(day.date, day.logs, codeNameMap(data?.codes ?? []))))) }),
        ]),
      ]),
      logged === 0
        ? emptyState({ icon: 'clock', title: 'Nothing logged this month', text: 'Open the Week tab to add entries.' })
        : el('div', { class: 'card table-card' }, [
            el('table', { class: 'data-table ts-month' }, [
              el('thead', {}, [el('tr', {}, ['Date', 'IR / Billing code', 'Hours', 'Comments'].map((heading) => el('th', { text: heading, attrs: { scope: 'col' } })))]),
              el('tbody', {}, rows),
            ]),
          ]),
    ]);
  };

  const stopChanges = onDataChange((collection, source) => {
    if (source === 'remote' && Object.values<string>(TIMESHEET_COLLECTIONS).includes(collection)) void load();
  });
  const exportButton = button({ label: 'Export .xlsx', icon: 'download', onClick: () => void (data && exportYear(year, data, logsFor(data.logs, userId, userId))) });
  root.append(timesheetHeader('month', [exportButton]), content);
  render();
  void load();
  return () => {
    disposed = true;
    stopChanges();
    root.replaceChildren();
  };
}
