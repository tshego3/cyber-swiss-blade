import type { Entity } from '../../core/repository';
import type { ShapeOf } from '../../core/shape';

export const TIMESHEET_COLLECTIONS = {
  codes: 'timesheet_codes',
  logs: 'timesheet_logs',
  prefs: 'timesheet_prefs',
} as const;

export type LogKind = 'work' | 'meeting' | 'note' | 'leave' | 'holiday';

export const LOG_KINDS: readonly LogKind[] = ['work', 'meeting', 'note', 'leave', 'holiday'];

export const KIND_BADGES: Readonly<Record<LogKind, string>> = {
  work: 'Code',
  meeting: 'Meeting',
  note: 'Note',
  leave: 'Leave',
  holiday: 'Holiday',
};

export const KIND_LABELS: Readonly<Record<LogKind, string>> = {
  work: 'Billing code',
  meeting: 'Meeting',
  note: 'Note',
  leave: 'Leave',
  holiday: 'Public holiday',
};

export type BillingCode = {
  readonly name: string;
  readonly archived: boolean;
};

export type TimeLog = {
  readonly date: string;
  readonly kind: LogKind;
  readonly codeId: string;
  readonly workItem: string;
  readonly title: string;
  readonly hours: number;
  readonly comment: string;
  readonly summary: string;
  readonly order: number;
};

export type MeetingRoutine = {
  readonly name: string;
  readonly hours: number;
  readonly weekdays: string;
};

export type TimesheetPrefs = {
  readonly standingNote: string;
  readonly dailyTarget: number;
  readonly defaultCodeId: string;
  readonly meetings: readonly MeetingRoutine[];
  readonly reportTitle: string;
  readonly reportSubtitle: string;
};

export const codeShape: ShapeOf<BillingCode> = { name: 'string', archived: 'boolean' };

export const logShape: ShapeOf<TimeLog> = {
  date: 'string',
  kind: LOG_KINDS,
  codeId: 'string',
  workItem: 'string',
  title: 'string',
  hours: 'number',
  comment: 'string',
  summary: 'string',
  order: 'number',
};

export const meetingShape: ShapeOf<MeetingRoutine> = { name: 'string', hours: 'number', weekdays: 'string' };

export const prefsShape: ShapeOf<TimesheetPrefs> = {
  standingNote: 'string',
  dailyTarget: 'number',
  defaultCodeId: 'string',
  meetings: [meetingShape],
  reportTitle: 'string',
  reportSubtitle: 'string',
};

export type DayStatus = 'empty' | 'planned' | 'under' | 'complete' | 'over' | 'leave' | 'weekend';

export interface MergedDay {
  readonly date: string;
  readonly codes: string;
  readonly hours: number;
  readonly comment: string;
}

export interface DaySheet extends MergedDay {
  readonly logs: readonly Entity<TimeLog>[];
  readonly status: DayStatus;
}
