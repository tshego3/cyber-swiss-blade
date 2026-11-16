import type { Child } from '../../core/dom';
import { moduleHeader } from '../../core/ui';

export type TimesheetTab = 'week' | 'projects';

export function timesheetHeader(active: TimesheetTab, actions: readonly Child[]): HTMLElement {
  return moduleHeader({ title: 'Timesheet', subtitle: 'Hours, projects, and what they are worth.', actions }, 'Timesheet sections', [
    { label: 'Week', href: '#/timesheet', active: active === 'week' },
    { label: 'Projects', href: '#/timesheet/projects', active: active === 'projects' },
  ]);
}
