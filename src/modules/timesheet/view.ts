import './timesheet.css';
import type { ModuleContext, Unmount } from '../../core/types';
import { mountMonth } from './month-view';
import { mountTimesheetSettings } from './settings-view';
import { mountWeek } from './week-view';

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const [section, value] = context.path;
  if (section === 'month') return mountMonth(root, context, value);
  if (section === 'settings') return mountTimesheetSettings(root, context);
  return mountWeek(root, context, section === 'week' ? value : undefined);
}
