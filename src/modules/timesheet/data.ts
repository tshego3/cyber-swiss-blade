import type { JsonValue } from '../../../shared/protocol';
import { deleteMeta, getMeta, setMeta } from '../../core/db';
import { addDays, formatHours, roundMoney } from '../../core/format';
import { createRepository, type Entity } from '../../core/repository';
import { matchesShape, type ShapeOf } from '../../core/shape';
import {
  TIMESHEET_COLLECTIONS,
  projectShape,
  timeEntryShape,
  type CurrencyAmount,
  type Project,
  type RunningTimer,
  type TimeEntry,
  type WeekSummary,
} from './types';

const TIMER_KEY = 'timesheet:timer';
const DAYS_IN_WEEK = 7;

const timerShape: ShapeOf<RunningTimer> = { projectId: 'string', description: 'string', startedAt: 'string' };

export const projects = createRepository<Project>(TIMESHEET_COLLECTIONS.projects, projectShape);
export const entries = createRepository<TimeEntry>(TIMESHEET_COLLECTIONS.entries, timeEntryShape);

export async function loadTimer(): Promise<RunningTimer | null> {
  const value: JsonValue | undefined = await getMeta(TIMER_KEY);
  return matchesShape<RunningTimer>(value, timerShape) ? value : null;
}

export async function saveTimer(timer: RunningTimer | null): Promise<void> {
  if (!timer) return deleteMeta(TIMER_KEY);
  return setMeta(TIMER_KEY, { projectId: timer.projectId, description: timer.description, startedAt: timer.startedAt });
}

export function timerMinutes(timer: RunningTimer, now: number): number {
  return Math.max(1, Math.round((now - Date.parse(timer.startedAt)) / 60_000));
}

export function entryAmount(entry: TimeEntry, project: Project | undefined): number {
  if (!entry.billable || !project) return 0;
  return roundMoney((entry.minutes / 60) * project.hourlyRate);
}

export function summarizeWeek(weekStart: string, allEntries: readonly Entity<TimeEntry>[], projectsById: ReadonlyMap<string, Project>): WeekSummary {
  const weekEnd = addDays(weekStart, DAYS_IN_WEEK - 1);
  const inWeek = allEntries.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd);
  const amounts = new Map<string, number>();
  for (const entry of inWeek) {
    const project = projectsById.get(entry.projectId);
    const amount = entryAmount(entry, project);
    if (project && amount > 0) amounts.set(project.currency, roundMoney((amounts.get(project.currency) ?? 0) + amount));
  }
  const days = Array.from({ length: DAYS_IN_WEEK }, (_, offset) => {
    const date = addDays(weekStart, offset);
    const dayEntries = inWeek.filter((entry) => entry.date === date).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    return { date, entries: dayEntries, minutes: sumMinutes(dayEntries) };
  });
  return {
    totalMinutes: sumMinutes(inWeek),
    billableMinutes: sumMinutes(inWeek.filter((entry) => entry.billable)),
    amounts: [...amounts].map(([currency, amount]): CurrencyAmount => ({ currency, amount })),
    days,
  };
}

export function toCsv(rows: readonly TimeEntry[], projectsById: ReadonlyMap<string, Project>): string {
  const header = ['Date', 'Project', 'Client', 'Description', 'Hours', 'Billable', 'Rate', 'Currency', 'Amount'];
  const lines = [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => {
      const project = projectsById.get(entry.projectId);
      return [
        entry.date,
        project?.name ?? 'Unknown project',
        project?.client ?? '',
        entry.description,
        formatHours(entry.minutes),
        entry.billable ? 'Yes' : 'No',
        String(project?.hourlyRate ?? 0),
        project?.currency ?? '',
        entryAmount(entry, project).toFixed(2),
      ];
    });
  return [header, ...lines].map((cells) => cells.map(csvCell).join(',')).join('\r\n');
}

function sumMinutes(list: readonly TimeEntry[]): number {
  return list.reduce((total, entry) => total + entry.minutes, 0);
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
