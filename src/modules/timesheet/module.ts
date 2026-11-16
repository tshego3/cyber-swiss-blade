import type { ToolModule } from '../../core/types';
import { TIMESHEET_COLLECTIONS } from './types';

export const timesheetModule: ToolModule = {
  id: 'timesheet',
  title: 'Timesheet',
  summary: 'Track developer hours per project with a live timer, weekly totals, and CSV export.',
  icon: 'clock',
  category: 'Productivity',
  collections: Object.values(TIMESHEET_COLLECTIONS),
  load: () => import('./view'),
};
