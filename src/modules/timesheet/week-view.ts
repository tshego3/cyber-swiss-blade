import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { addDays, formatClock, formatDate, formatMinutes, formatMoney, nowIso, startOfWeek, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { Unmount } from '../../core/types';
import { button, confirmAction, downloadBlob, emptyState, errorState, loadingState, selectControl, toast } from '../../core/ui';
import { entries, loadTimer, projects, saveTimer, summarizeWeek, timerMinutes, toCsv } from './data';
import { openEntryDialog, openProjectDialog } from './dialogs';
import { timesheetHeader } from './header';
import { TIMESHEET_COLLECTIONS, type DaySummary, type Project, type RunningTimer, type TimeEntry, type WeekSummary } from './types';

interface WeekState {
  readonly weekStart: string;
  readonly projects: readonly Entity<Project>[];
  readonly entries: readonly Entity<TimeEntry>[];
  readonly timer: RunningTimer | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export function mountWeek(root: HTMLElement): Unmount {
  let state: WeekState = { weekStart: startOfWeek(toIsoDate(new Date())), projects: [], entries: [], timer: null, isLoading: true, errorMessage: null };
  let elapsed: HTMLElement | null = null;
  let stopping = false;
  const content = el('div', { class: 'stack-lg' });
  const exportButton = button({ label: 'Export CSV', icon: 'download', onClick: () => exportWeek(state) });
  const addButton = button({ label: 'Log time', icon: 'plus', variant: 'primary', onClick: () => openEntryDialog(state.projects) });

  const setState = (patch: Partial<WeekState>): void => {
    state = { ...state, ...patch };
    render();
  };

  let latestLoad = 0;
  const load = async (): Promise<void> => {
    latestLoad += 1;
    const loadId = latestLoad;
    try {
      const [projectList, entryList, timer] = await Promise.all([projects.list(), entries.list(), loadTimer()]);
      if (loadId === latestLoad) setState({ projects: projectList, entries: entryList, timer, errorMessage: null, isLoading: false });
    } catch (error) {
      console.error('Timesheet failed to load', error);
      if (loadId === latestLoad) setState({ errorMessage: 'Unable to load your timesheet.', isLoading: false });
    }
  };

  const setTimer = async (timer: RunningTimer | null): Promise<void> => {
    await saveTimer(timer);
    setState({ timer });
  };

  const stopTimer = async (timer: RunningTimer): Promise<void> => {
    if (stopping) return;
    stopping = true;
    try {
      const minutes = timerMinutes(timer, Date.now());
      await setTimer(null);
      await entries.save({ projectId: timer.projectId, date: toIsoDate(new Date(timer.startedAt)), minutes, description: timer.description, billable: true });
      toast(`Logged ${formatMinutes(minutes)}`, 'success');
    } finally {
      stopping = false;
    }
  };

  const render = (): void => {
    elapsed = null;
    exportButton.disabled = state.isLoading || state.entries.length === 0;
    addButton.disabled = !state.projects.some((project) => !project.archived);
    if (state.isLoading) return replaceChildren(content, [loadingState('Loading timesheet')]);
    if (state.errorMessage) return replaceChildren(content, [errorState(state.errorMessage, () => void load())]);
    if (state.projects.length > 0) return replaceChildren(content, renderWeek());
    replaceChildren(content, [
      emptyState({ icon: 'folder', title: 'No projects yet', text: 'Create a project to start tracking time against it.', action: button({ label: 'New project', icon: 'plus', variant: 'primary', onClick: () => openProjectDialog() }) }),
    ]);
  };

  const renderWeek = (): HTMLElement[] => {
    const projectsById = new Map(state.projects.map((project) => [project.id, project]));
    const summary = summarizeWeek(state.weekStart, state.entries, projectsById);
    return [renderTimer(), renderWeekBar(summary), el('div', { class: 'days' }, summary.days.map((day) => renderDay(day, projectsById)))];
  };

  const renderTimer = (): HTMLElement => {
    const timer = state.timer;
    if (timer) {
      elapsed = el('span', { class: 'timer-clock mono', text: formatClock(Math.floor((Date.now() - Date.parse(timer.startedAt)) / 1000)) });
      const projectName = state.projects.find((project) => project.id === timer.projectId)?.name ?? 'Unknown project';
      return el('section', { class: 'card timer is-running', attrs: { 'aria-label': 'Running timer' } }, [
        el('span', { class: 'pulse', attrs: { 'aria-hidden': 'true' } }),
        el('div', { class: 'timer-info' }, [el('strong', { text: projectName }), el('span', { class: 'muted', text: timer.description || 'No description' })]),
        elapsed,
        button({ label: 'Discard timer', icon: 'trash', iconOnly: true, variant: 'ghost', onClick: () => void setTimer(null) }),
        button({ label: 'Stop', icon: 'stop', variant: 'primary', onClick: () => void stopTimer(timer) }),
      ]);
    }
    const active = state.projects.filter((project) => !project.archived);
    const project = selectControl('projectId', active.map((item) => ({ value: item.id, label: item.name })), active[0]?.id ?? '');
    project.setAttribute('aria-label', 'Project');
    const description = el('input', { class: 'input', attrs: { name: 'description', placeholder: 'What are you working on?', 'aria-label': 'Description', autocomplete: 'off' } });
    const form = el('form', { class: 'card timer', attrs: { 'aria-label': 'Start a timer' } }, [project, description, button({ label: 'Start', icon: 'play', variant: 'primary', type: 'submit', disabled: active.length === 0 })]);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (project.value) void setTimer({ projectId: project.value, description: description.value.trim(), startedAt: nowIso() });
    });
    return form;
  };

  const renderWeekBar = (summary: WeekSummary): HTMLElement => {
    const weekEnd = addDays(state.weekStart, 6);
    const amounts = summary.amounts.length > 0 ? summary.amounts.map((item) => formatMoney(item.amount, item.currency)).join(' · ') : formatMoney(0, state.projects[0]?.currency ?? 'ZAR');
    return el('div', { class: 'week-bar' }, [
      el('div', { class: 'week-nav' }, [
        button({ label: 'Previous week', icon: 'chevron-left', iconOnly: true, onClick: () => setState({ weekStart: addDays(state.weekStart, -7) }) }),
        button({ label: 'This week', variant: 'ghost', onClick: () => setState({ weekStart: startOfWeek(toIsoDate(new Date())) }) }),
        button({ label: 'Next week', icon: 'chevron-right', iconOnly: true, onClick: () => setState({ weekStart: addDays(state.weekStart, 7) }) }),
        el('h2', { class: 'week-label', text: `${formatDate(state.weekStart)} – ${formatDate(weekEnd)}` }),
      ]),
      el('dl', { class: 'stats' }, [stat('Total', formatMinutes(summary.totalMinutes)), stat('Billable', formatMinutes(summary.billableMinutes)), stat('Earned', amounts)]),
    ]);
  };

  const renderDay = (day: DaySummary, projectsById: ReadonlyMap<string, Project>): HTMLElement => {
    const isToday = day.date === toIsoDate(new Date());
    return el('section', { class: `day${isToday ? ' is-today' : ''}${day.entries.length === 0 ? ' is-empty' : ''}` }, [
      el('header', { class: 'day-header' }, [el('h3', { class: 'day-title', text: formatDate(day.date) }), el('span', { class: 'mono muted', text: day.minutes > 0 ? formatMinutes(day.minutes) : '—' })]),
      day.entries.length > 0 && el('ul', { class: 'entries' }, day.entries.map((entry) => renderEntry(entry, projectsById.get(entry.projectId)))),
    ]);
  };

  const renderEntry = (entry: Entity<TimeEntry>, project: Project | undefined): HTMLLIElement =>
    el('li', { class: 'entry' }, [
      el('div', { class: 'entry-main' }, [el('span', { class: 'entry-project', text: project?.name ?? 'Unknown project' }), el('span', { class: 'entry-description', text: entry.description || 'No description' })]),
      !entry.billable && el('span', { class: 'tag', text: 'Non-billable' }),
      el('span', { class: 'entry-duration mono', text: formatMinutes(entry.minutes) }),
      el('div', { class: 'entry-actions' }, [
        button({ label: 'Edit entry', icon: 'edit', iconOnly: true, variant: 'ghost', onClick: () => openEntryDialog(state.projects, entry) }),
        button({ label: 'Delete entry', icon: 'trash', iconOnly: true, variant: 'ghost', onClick: () => void deleteEntry(entry) }),
      ]),
    ]);

  root.append(timesheetHeader('week', [exportButton, addButton]), content);
  render();
  void load();
  const stopListening = onDataChange((collection) => {
    if (Object.values<string>(TIMESHEET_COLLECTIONS).includes(collection)) void load();
  });
  const ticker = setInterval(() => {
    if (elapsed && state.timer) elapsed.textContent = formatClock(Math.floor((Date.now() - Date.parse(state.timer.startedAt)) / 1000));
  }, 1_000);

  return () => {
    clearInterval(ticker);
    stopListening();
    root.replaceChildren();
  };
}

function stat(label: string, value: string): HTMLElement {
  return el('div', { class: 'stat' }, [el('dt', { text: label }), el('dd', { class: 'mono', text: value })]);
}

async function deleteEntry(entry: Entity<TimeEntry>): Promise<void> {
  if (await confirmAction('Delete entry', `Delete ${formatMinutes(entry.minutes)} logged on ${formatDate(entry.date)}?`, 'Delete')) {
    await entries.remove(entry.id);
  }
}

function exportWeek(state: WeekState): void {
  const weekEnd = addDays(state.weekStart, 6);
  const rows = state.entries.filter((entry) => entry.date >= state.weekStart && entry.date <= weekEnd);
  const csv = toCsv(rows, new Map(state.projects.map((project) => [project.id, project])));
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `timesheet-${state.weekStart}.csv`);
}
