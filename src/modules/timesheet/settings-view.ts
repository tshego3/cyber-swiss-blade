import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, errorState, field, formValue, loadingState, toast } from '../../core/ui';
import { codes, formatHourValue, parseHours, prefs, prefsId } from './data';
import { timesheetHeader } from './header';
import { loadTimesheet, type TimesheetData } from './load';
import { TIMESHEET_COLLECTIONS, type BillingCode, type MeetingRoutine } from './types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function card(title: string, description: string, body: readonly HTMLElement[]): HTMLElement {
  return el('section', { class: 'card settings-section' }, [
    el('div', { class: 'settings-intro' }, [el('h2', { class: 'section-title', text: title }), el('p', { class: 'muted', text: description })]),
    el('div', { class: 'settings-body' }, body),
  ]);
}

export function mountTimesheetSettings(root: HTMLElement, context: ModuleContext): Unmount {
  const userId = context.user?.id ?? '';
  const content = el('div', { class: 'stack-lg' });
  let disposed = false;

  const load = async (): Promise<void> => {
    try {
      const data = await loadTimesheet(userId);
      if (!disposed) render(data);
    } catch (error) {
      console.error('Timesheet settings failed to load', error);
      if (!disposed) replaceChildren(content, [errorState('Unable to load the timesheet settings.', () => void load())]);
    }
  };

  const codeRow = (code: Entity<BillingCode>): HTMLElement => {
    const name = el('input', { class: 'input', attrs: { value: code.name, 'aria-label': 'Project or billing code name', disabled: !context.canEdit } });
    name.addEventListener('change', () => {
      if (name.value.trim()) void codes.save({ name: name.value.trim(), archived: code.archived }, code.id);
    });
    return el('div', { class: `ts-code-row${code.archived ? ' is-archived' : ''}` }, [
      name,
      context.canEdit && button({ label: code.archived ? 'Restore' : 'Archive', variant: 'ghost', onClick: () => void codes.save({ name: code.name, archived: !code.archived }, code.id).then(load) }),
    ]);
  };

  const codesCard = (data: TimesheetData): HTMLElement => {
    const form = el('form', { class: 'row', attrs: { novalidate: true } }, [
      el('input', { class: 'input', attrs: { name: 'name', required: true, placeholder: 'For example: Client Project', 'aria-label': 'New project or billing code' } }),
      button({ label: 'Add', icon: 'plus', type: 'submit' }),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = formValue(form, 'name');
      if (!name) return;
      void codes.save({ name, archived: false }).then(() => {
        toast('Added', 'success');
        return load();
      });
    });
    return card('Projects (column B)', 'Shared by the team. Column B of the Agile Report holds a project, such as a client project, or a billing code, such as Productive. A day shows its entries joined with &.', [
      el('div', { class: 'stack ts-codes-list' }, data.codes.length > 0 ? data.codes.map(codeRow) : [el('p', { class: 'muted', text: 'No projects yet.' })]),
      context.canEdit ? form : el('span'),
    ]);
  };

  const meetingRow = (meeting: MeetingRoutine): HTMLElement =>
    el('fieldset', { class: 'ts-meeting' }, [
      el('legend', { class: 'visually-hidden', text: 'Meeting' }),
      el('input', { class: 'input', attrs: { name: 'meetingName', value: meeting.name, placeholder: 'Developer stand-up', 'aria-label': 'Meeting name' } }),
      el('input', { class: 'input mono ts-hours-input', attrs: { name: 'meetingHours', value: formatHourValue(meeting.hours), inputmode: 'decimal', 'aria-label': 'Default hours' } }),
      el(
        'span',
        { class: 'ts-weekdays' },
        WEEKDAYS.map((day, index) =>
          el('label', { class: 'check' }, [el('input', { attrs: { type: 'checkbox', name: `day${index + 1}`, checked: meeting.weekdays.includes(String(index + 1)) } }), el('span', { text: day })]),
        ),
      ),
      button({ label: 'Remove meeting', icon: 'trash', iconOnly: true, variant: 'ghost', onClick: (event) => (event.currentTarget instanceof HTMLElement ? event.currentTarget.closest('fieldset')?.remove() : undefined) }),
    ]);

  const routineCard = (data: TimesheetData): HTMLElement => {
    const settings = data.prefs;
    const meetings = el('div', { class: 'stack' }, settings.meetings.map(meetingRow));
    const defaultCode = el('select', { class: 'input', attrs: { name: 'defaultCodeId' } }, [
      el('option', { text: 'No project', attrs: { value: '' } }),
      ...data.codes.filter((code) => !code.archived).map((code) => el('option', { text: code.name, attrs: { value: code.id, selected: code.id === settings.defaultCodeId } })),
    ]);
    const form = el('form', { class: 'stack', attrs: { novalidate: true } }, [
      field('Standing note', el('textarea', { class: 'input', text: settings.standingNote, attrs: { name: 'standingNote', rows: 3, placeholder: 'I have updated the timesheet for the current week.' } }), 'Fill week adds this note to every empty workday.'),
      el('div', { class: 'grid-2' }, [
        field('Daily target (hours)', el('input', { class: 'input mono', attrs: { name: 'dailyTarget', value: formatHourValue(settings.dailyTarget), inputmode: 'decimal', required: true } })),
        field('Default project', defaultCode),
      ]),
      el('div', { class: 'stack' }, [el('span', { class: 'field-label', text: 'Regular meetings' }), meetings, button({ label: 'Add meeting', icon: 'plus', variant: 'ghost', onClick: () => meetings.append(meetingRow({ name: '', hours: 0.25, weekdays: '12345' })) })]),
      el('div', { class: 'grid-2' }, [
        field('Report title', el('input', { class: 'input', attrs: { name: 'reportTitle', value: settings.reportTitle } }), 'Row 1 of each month in the Excel file.'),
        field('Report subtitle', el('input', { class: 'input', attrs: { name: 'reportSubtitle', value: settings.reportSubtitle } }), 'Row 2, for example a reminder.'),
      ]),
      el('div', { class: 'row' }, [button({ label: 'Save routine', icon: 'check', variant: 'primary', type: 'submit' })]),
    ]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const target = parseHours(formValue(form, 'dailyTarget'));
      if (target === null || target === 0) {
        toast('Enter a daily target between 0 and 24 hours.', 'error');
        return;
      }
      const routine: MeetingRoutine[] = [...meetings.querySelectorAll('fieldset')].flatMap((row) => {
        const name = row.querySelector<HTMLInputElement>('input[name=meetingName]')?.value.trim() ?? '';
        const hours = parseHours(row.querySelector<HTMLInputElement>('input[name=meetingHours]')?.value ?? '') ?? 0;
        const weekdays = WEEKDAYS.map((_, index) => (row.querySelector<HTMLInputElement>(`input[name=day${index + 1}]`)?.checked ? String(index + 1) : '')).join('');
        return name ? [{ name, hours, weekdays }] : [];
      });
      const next = {
        standingNote: formValue(form, 'standingNote'),
        dailyTarget: target,
        defaultCodeId: formValue(form, 'defaultCodeId'),
        meetings: routine,
        reportTitle: formValue(form, 'reportTitle') || 'Agile Report',
        reportSubtitle: formValue(form, 'reportSubtitle'),
      };
      void prefs.save(next, prefsId(userId)).then(() => toast('Routine saved', 'success'));
    });
    return card('My routine', 'Used by Fill week from routine and by the Excel export. Only you see it.', [form]);
  };

  const render = (data: TimesheetData): void => {
    replaceChildren(content, [codesCard(data), context.canEdit ? routineCard(data) : el('span')]);
  };

  const stopChanges = onDataChange((collection, source) => {
    if (source === 'remote' && collection === TIMESHEET_COLLECTIONS.codes) void load();
  });
  replaceChildren(content, [loadingState('Loading settings')]);
  root.append(timesheetHeader('settings', []), content);
  void load();
  return () => {
    disposed = true;
    stopChanges();
    root.replaceChildren();
  };
}
