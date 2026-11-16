import type { ToolModule } from '../../core/types';
import { TIMESHEET_COLLECTIONS } from './types';

export const timesheetModule: ToolModule = {
  id: 'timesheet',
  title: 'Timesheet',
  summary: 'Weekly Agile Report: work per billing code, meetings, and summaries, merged per day. Export to Excel.',
  icon: 'clock',
  category: 'Productivity',
  access: 'restricted',
  collections: Object.values(TIMESHEET_COLLECTIONS),
  load: () => import('./view'),
};
