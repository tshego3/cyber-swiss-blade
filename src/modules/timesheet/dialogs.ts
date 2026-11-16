import { el } from '../../core/dom';
import { formatMinutes, parseDuration, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import { field, formChecked, formValue, openFormDialog, selectControl, toast } from '../../core/ui';
import { entries, projects } from './data';
import type { Project, TimeEntry } from './types';

const DEFAULT_CURRENCY = 'ZAR';

export function openEntryDialog(projectList: readonly Entity<Project>[], entry?: Entity<TimeEntry>): void {
  const options = projectList.filter((project) => !project.archived || project.id === entry?.projectId).map((project) => ({ value: project.id, label: project.name }));
  if (options.length === 0) {
    toast('Create or restore a project first.', 'error');
    return;
  }
  openFormDialog({
    title: entry ? 'Edit entry' : 'Log time',
    submitLabel: entry ? 'Save' : 'Add entry',
    body: [
      field('Project', selectControl('projectId', options, entry?.projectId ?? options[0]?.value ?? '')),
      el('div', { class: 'grid-2' }, [
        field('Date', el('input', { class: 'input', attrs: { name: 'date', type: 'date', required: true, value: entry?.date ?? toIsoDate(new Date()) } })),
        field('Duration', el('input', { class: 'input mono', attrs: { name: 'duration', required: true, placeholder: '1:30', value: entry ? formatMinutes(entry.minutes).replace(/\s/g, '') : '' } }), 'e.g. 1:30, 1.5 or 90m'),
      ]),
      field('Description', el('textarea', { class: 'input', text: entry?.description ?? '', attrs: { name: 'description', rows: 3, placeholder: 'What did you work on?' } })),
      el('label', { class: 'check' }, [el('input', { attrs: { type: 'checkbox', name: 'billable', checked: entry?.billable ?? true } }), el('span', { text: 'Billable' })]),
    ],
    onSubmit: async (form) => {
      const minutes = parseDuration(formValue(form, 'duration'));
      if (!minutes || minutes > 24 * 60) {
        toast('Enter a duration between 1 minute and 24 hours.', 'error');
        return false;
      }
      const data: TimeEntry = {
        projectId: formValue(form, 'projectId'),
        date: formValue(form, 'date'),
        minutes,
        description: formValue(form, 'description'),
        billable: formChecked(form, 'billable'),
      };
      await entries.save(data, entry?.id);
      return true;
    },
  });
}

export function openProjectDialog(project?: Entity<Project>): void {
  openFormDialog({
    title: project ? 'Edit project' : 'New project',
    submitLabel: project ? 'Save' : 'Create project',
    body: [
      field('Name', el('input', { class: 'input', attrs: { name: 'name', required: true, maxlength: 80, value: project?.name ?? '', autocomplete: 'off' } })),
      field('Client', el('input', { class: 'input', attrs: { name: 'client', maxlength: 80, value: project?.client ?? '', autocomplete: 'off' } })),
      el('div', { class: 'grid-2' }, [
        field('Hourly rate', el('input', { class: 'input mono', attrs: { name: 'hourlyRate', type: 'number', min: 0, step: '0.01', required: true, value: project?.hourlyRate ?? 0 } })),
        field('Currency', el('input', { class: 'input mono', attrs: { name: 'currency', required: true, pattern: '[A-Za-z]{3}', maxlength: 3, value: project?.currency ?? DEFAULT_CURRENCY } }), 'ISO code, e.g. ZAR'),
      ]),
    ],
    onSubmit: async (form) => {
      const data: Project = {
        name: formValue(form, 'name'),
        client: formValue(form, 'client'),
        hourlyRate: Number(formValue(form, 'hourlyRate')) || 0,
        currency: formValue(form, 'currency').toUpperCase(),
        archived: project?.archived ?? false,
      };
      await projects.save(data, project?.id);
      return true;
    },
  });
}
