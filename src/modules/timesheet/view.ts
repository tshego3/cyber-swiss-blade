import './timesheet.css';
import type { ModuleContext, Unmount } from '../../core/types';
import { mountProjects } from './projects-view';
import { mountWeek } from './week-view';

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  return context.path[0] === 'projects' ? mountProjects(root) : mountWeek(root);
}
