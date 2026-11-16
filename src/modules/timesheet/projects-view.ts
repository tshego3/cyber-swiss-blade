import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { formatMinutes, formatMoney } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, loadingState, toast } from '../../core/ui';
import { entries, projects } from './data';
import { openProjectDialog } from './dialogs';
import { timesheetHeader } from './header';
import { TIMESHEET_COLLECTIONS, type Project, type TimeEntry } from './types';

interface ProjectsState {
  readonly projects: readonly Entity<Project>[];
  readonly entries: readonly Entity<TimeEntry>[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export function mountProjects(root: HTMLElement): Unmount {
  let state: ProjectsState = { projects: [], entries: [], isLoading: true, errorMessage: null };
  const content = el('div');

  const load = async (): Promise<void> => {
    try {
      const [projectList, entryList] = await Promise.all([projects.list(), entries.list()]);
      state = { projects: projectList, entries: entryList, isLoading: false, errorMessage: null };
    } catch (error) {
      console.error('Projects failed to load', error);
      state = { ...state, isLoading: false, errorMessage: 'Unable to load projects.' };
    }
    render();
  };

  const render = (): void => {
    if (state.isLoading) return replaceChildren(content, [loadingState('Loading projects')]);
    if (state.errorMessage) return replaceChildren(content, [errorState(state.errorMessage, () => void load())]);
    if (state.projects.length > 0) {
      const sorted = [...state.projects].sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name));
      return replaceChildren(content, [el('ul', { class: 'card-grid' }, sorted.map((project) => projectCard(project, state.entries)))]);
    }
    replaceChildren(content, [emptyState({ icon: 'folder', title: 'No projects yet', text: 'Projects hold your client, hourly rate, and currency.' })]);
  };

  root.append(timesheetHeader('projects', [button({ label: 'New project', icon: 'plus', variant: 'primary', onClick: () => openProjectDialog() })]), content);
  render();
  void load();
  const stopListening = onDataChange((collection) => {
    if (Object.values<string>(TIMESHEET_COLLECTIONS).includes(collection)) void load();
  });
  return () => {
    stopListening();
    root.replaceChildren();
  };
}

function projectCard(project: Entity<Project>, allEntries: readonly Entity<TimeEntry>[]): HTMLLIElement {
  const logged = allEntries.filter((entry) => entry.projectId === project.id);
  const minutes = logged.reduce((total, entry) => total + entry.minutes, 0);
  return el('li', { class: `card item-card${project.archived ? ' is-archived' : ''}` }, [
    el('div', { class: 'item-head' }, [
      el('div', {}, [el('h2', { class: 'item-name', text: project.name }), el('p', { class: 'muted', text: project.client || 'No client' })]),
      project.archived && el('span', { class: 'tag', text: 'Archived' }),
    ]),
    el('dl', { class: 'stats stats-compact' }, [
      el('div', { class: 'stat' }, [el('dt', { text: 'Rate' }), el('dd', { class: 'mono', text: `${formatMoney(project.hourlyRate, project.currency)}/h` })]),
      el('div', { class: 'stat' }, [el('dt', { text: 'Logged' }), el('dd', { class: 'mono', text: formatMinutes(minutes) })]),
    ]),
    el('div', { class: 'row' }, [
      button({ label: 'Edit', icon: 'edit', variant: 'ghost', onClick: () => openProjectDialog(project) }),
      button({ label: project.archived ? 'Restore' : 'Archive', variant: 'ghost', onClick: () => void projects.save({ ...project, archived: !project.archived }, project.id) }),
      button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void deleteProject(project, logged.length) }),
    ]),
  ]);
}

async function deleteProject(project: Entity<Project>, entryCount: number): Promise<void> {
  if (entryCount > 0) {
    toast(`${project.name} has ${entryCount} time entries. Archive it instead.`, 'error');
    return;
  }
  if (await confirmAction('Delete project', `Delete ${project.name}? This cannot be undone.`, 'Delete')) await projects.remove(project.id);
}
