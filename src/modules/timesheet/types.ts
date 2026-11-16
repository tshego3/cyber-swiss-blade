import type { Entity } from '../../core/repository';
import type { ShapeOf } from '../../core/shape';

export const TIMESHEET_COLLECTIONS = {
  projects: 'timesheet_projects',
  entries: 'timesheet_entries',
} as const;

export type Project = {
  readonly name: string;
  readonly client: string;
  readonly hourlyRate: number;
  readonly currency: string;
  readonly archived: boolean;
};

export type TimeEntry = {
  readonly projectId: string;
  readonly date: string;
  readonly minutes: number;
  readonly description: string;
  readonly billable: boolean;
};

export const projectShape: ShapeOf<Project> = {
  name: 'string',
  client: 'string',
  hourlyRate: 'number',
  currency: 'string',
  archived: 'boolean',
};

export const timeEntryShape: ShapeOf<TimeEntry> = {
  projectId: 'string',
  date: 'string',
  minutes: 'number',
  description: 'string',
  billable: 'boolean',
};

export interface RunningTimer {
  readonly projectId: string;
  readonly description: string;
  readonly startedAt: string;
}

export interface DaySummary {
  readonly date: string;
  readonly minutes: number;
  readonly entries: readonly Entity<TimeEntry>[];
}

export interface WeekSummary {
  readonly totalMinutes: number;
  readonly billableMinutes: number;
  readonly amounts: readonly CurrencyAmount[];
  readonly days: readonly DaySummary[];
}

export interface CurrencyAmount {
  readonly currency: string;
  readonly amount: number;
}
