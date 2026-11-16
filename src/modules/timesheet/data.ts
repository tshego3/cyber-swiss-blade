import { addDays, fromIsoDate, startOfWeek, toIsoDate } from '../../core/format';
import { createRepository, type Entity } from '../../core/repository';
import { formatHourValue, mergeDay, roundHours, sortLogs, type ExtractRow } from './report-format';
import {
  TIMESHEET_COLLECTIONS,
  codeShape,
  logShape,
  prefsShape,
  type BillingCode,
  type DaySheet,
  type DayStatus,
  type LogKind,
  type MergedDay,
  type TimeLog,
  type TimesheetPrefs,
} from './types';

const DEFAULT_TARGET = 8;
const RECENT_ITEMS = 40;
const LOOKBACK_DAYS = 14;

export const codes = createRepository<BillingCode>(TIMESHEET_COLLECTIONS.codes, codeShape);
export const logs = createRepository<TimeLog>(TIMESHEET_COLLECTIONS.logs, logShape, (data) => ({ summary: '', ...data }));

export { extractRows, formatHourValue, meetingSentence, mergeDay, roundHours, sortLogs } from './report-format';
export const prefs = createRepository<TimesheetPrefs>(TIMESHEET_COLLECTIONS.prefs, prefsShape);

export const DEFAULT_PREFS: TimesheetPrefs = {
  standingNote: '',
  dailyTarget: DEFAULT_TARGET,
  defaultCodeId: '',
  meetings: [],
  reportTitle: 'Agile Report',
  reportSubtitle: '',
};

export function prefsId(userId: string): string {
  return `prefs-${userId}`;
}

export async function loadPrefs(userId: string): Promise<TimesheetPrefs> {
  return (await prefs.get(prefsId(userId))) ?? DEFAULT_PREFS;
}

export function parseHours(text: string): number | null {
  const input = text.trim().replace(',', '.');
  if (!input) return 0;
  const clock = /^(\d{1,2}):([0-5]\d)$/.exec(input);
  if (clock) return roundHours(Number(clock[1]) + Number(clock[2]) / 60);
  const value = Number(input);
  return Number.isFinite(value) && value >= 0 && value <= 24 ? roundHours(value) : null;
}

export function isWeekend(date: string): boolean {
  const day = fromIsoDate(date).getDay();
  return day === 0 || day === 6;
}

export function dayStatus(date: string, dayLogs: readonly TimeLog[], hours: number, target: number): DayStatus {
  if (dayLogs.length === 0) return isWeekend(date) ? 'weekend' : 'empty';
  if (dayLogs.some((log) => log.kind === 'leave' || log.kind === 'holiday')) return 'leave';
  if (hours === 0) return 'planned';
  if (hours < target) return 'under';
  return hours > target ? 'over' : 'complete';
}

export function groupByDate<T extends TimeLog>(list: readonly T[]): Map<string, T[]> {
  const byDate = new Map<string, T[]>();
  for (const log of list) byDate.set(log.date, [...(byDate.get(log.date) ?? []), log]);
  return byDate;
}

export function buildDays(dates: readonly string[], list: readonly Entity<TimeLog>[], codeNames: ReadonlyMap<string, string>, target: number): DaySheet[] {
  const byDate = groupByDate(list);
  return dates.map((date) => {
    const dayLogs = sortLogs(byDate.get(date) ?? []);
    const merged = mergeDay(date, dayLogs, codeNames);
    return { ...merged, logs: dayLogs, status: dayStatus(date, dayLogs, merged.hours, target) };
  });
}

export function weekDates(date: string): string[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function monthDates(year: number, month: number): string[] {
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, index) => toIsoDate(new Date(year, month - 1, index + 1)));
}

export function isoWeekday(date: string): string {
  return String(((fromIsoDate(date).getDay() + 6) % 7) + 1);
}

export function routineLogs(dates: readonly string[], existing: readonly TimeLog[], settings: TimesheetPrefs): TimeLog[] {
  const used = new Set(existing.map((log) => log.date));
  return dates
    .filter((date) => !isWeekend(date) && !used.has(date))
    .flatMap((date) => {
      const day = isoWeekday(date);
      const note: TimeLog[] = settings.standingNote.trim() ? [newLog(date, 'note', settings.defaultCodeId, 0, { comment: settings.standingNote.trim() })] : [];
      const meetings = settings.meetings
        .filter((meeting) => meeting.weekdays.includes(day))
        .map((meeting, index) => newLog(date, 'meeting', settings.defaultCodeId, index + 1, { title: meeting.name, hours: meeting.hours }));
      return [...note, ...meetings];
    });
}

export function continueFrom(date: string, list: readonly TimeLog[]): TimeLog[] {
  const byDate = groupByDate(list.filter((log) => log.kind === 'work'));
  for (let offset = 1; offset <= LOOKBACK_DAYS; offset += 1) {
    const previous = byDate.get(addDays(date, -offset));
    if (previous && previous.length > 0) return sortLogs(previous).map((log, index) => newLog(date, 'work', log.codeId, 100 + index, { workItem: log.workItem }));
  }
  return [];
}

export function newLog(date: string, kind: LogKind, codeId: string, order: number, fields: Partial<Pick<TimeLog, 'workItem' | 'title' | 'hours' | 'comment' | 'summary'>> = {}): TimeLog {
  return { date, kind, codeId, order, workItem: fields.workItem ?? '', title: fields.title ?? '', hours: fields.hours ?? (kind === 'leave' || kind === 'holiday' ? DEFAULT_TARGET : 0), comment: fields.comment ?? '', summary: fields.summary ?? '' };
}

export function recentWorkItems(list: readonly TimeLog[]): string[] {
  const latest = new Map<string, string>();
  for (const log of list) {
    const item = log.workItem.trim();
    if (log.kind === 'work' && item && (latest.get(item) ?? '') < log.date) latest.set(item, log.date);
  }
  return [...latest].sort((a, b) => b[1].localeCompare(a[1])).slice(0, RECENT_ITEMS).map(([item]) => item);
}

export function extractTsv(rows: readonly ExtractRow[]): string {
  return rows.map((row) => [row.date, excelCell(row.billingCode), formatHourValue(row.hours), excelCell(row.description)].join('\t')).join('\n');
}

function excelCell(value: string): string {
  const flat = value.replace(/[\t\r\n]+/g, ' ');
  return /^[=+\-@]/.test(flat) ? `'${flat}` : flat;
}

export function toTsv(days: readonly MergedDay[]): string {
  return days.map((day) => [day.date, excelCell(day.codes), day.codes || day.hours > 0 ? formatHourValue(day.hours) : '', excelCell(day.comment)].join('\t')).join('\n');
}

export function codeNameMap(list: readonly Entity<BillingCode>[]): Map<string, string> {
  return new Map(list.map((code) => [code.id, code.name]));
}

export function ownsRecord(record: { readonly ownerId?: string }, userId: string): boolean {
  return record.ownerId === undefined || record.ownerId === userId;
}
