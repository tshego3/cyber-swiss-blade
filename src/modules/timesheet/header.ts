import type { Child } from '../../core/dom';
import { moduleHeader } from '../../core/ui';

export type TimesheetTab = 'week' | 'month' | 'settings';

export function timesheetHeader(active: TimesheetTab, actions: readonly Child[]): HTMLElement {
  return moduleHeader({ title: 'Timesheet', subtitle: 'Your weekly Agile Report, one day at a time.', actions }, 'Timesheet sections', [
    { label: 'Week', href: '#/timesheet/week', active: active === 'week' },
    { label: 'Month', href: '#/timesheet/month', active: active === 'month' },
    { label: 'Settings', href: '#/timesheet/settings', active: active === 'settings' },
  ]);
}
