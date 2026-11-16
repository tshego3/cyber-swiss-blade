import { ADMINISTRATORS, type SessionUser } from '../../../shared/access';
import { admin } from '../../core/api';
import type { Entity } from '../../core/repository';
import { apiAuth } from '../../core/session';
import { downloadBlob, toast } from '../../core/ui';
import { buildDays, codeNameMap, codes, loadPrefs, logs, monthDates, ownsRecord } from './data';
import type { BillingCode, MergedDay, TimeLog, TimesheetPrefs } from './types';
import { agileReport } from './xlsx';

export interface TimesheetData {
  readonly codes: readonly Entity<BillingCode>[];
  readonly logs: readonly Entity<TimeLog>[];
  readonly prefs: TimesheetPrefs;
}

export interface Owner {
  readonly id: string;
  readonly name: string;
}

export async function loadTimesheet(userId: string): Promise<TimesheetData> {
  const [codeList, logList, settings] = await Promise.all([codes.list(), logs.list(), loadPrefs(userId)]);
  return { codes: codeList.sort((a, b) => a.name.localeCompare(b.name)), logs: logList, prefs: settings };
}

export function logsFor(list: readonly Entity<TimeLog>[], ownerId: string, userId: string): Entity<TimeLog>[] {
  return list.filter((log) => (ownerId === userId ? ownsRecord(log, userId) : log.ownerId === ownerId));
}

let ownerNames: ReadonlyMap<string, string> = new Map();

export async function teamOwners(list: readonly Entity<TimeLog>[], user: SessionUser | null): Promise<Owner[]> {
  if (!user?.roles.includes(ADMINISTRATORS)) return [];
  const ids = [...new Set(list.flatMap((log) => (log.ownerId && log.ownerId !== user.id ? [log.ownerId] : [])))];
  if (ids.length === 0) return [];
  // Each remote change reloads the view, so only ask the server again when an owner is not known yet.
  if (ids.some((id) => !ownerNames.has(id))) {
    ownerNames = await admin
      .users(await apiAuth())
      .then((users) => new Map(users.map((item) => [item.id, item.displayName])))
      .catch(() => ownerNames);
  }
  const names = ownerNames;
  return ids.map((id) => ({ id, name: names.get(id) ?? `User ${id.slice(0, 8)}` })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function exportYear(year: number, data: TimesheetData, ownLogs: readonly Entity<TimeLog>[]): Promise<void> {
  const dates = Array.from({ length: 12 }, (_, index) => monthDates(year, index + 1)).flat();
  const days = buildDays(dates, ownLogs, codeNameMap(data.codes), data.prefs.dailyTarget);
  const merged = new Map<string, MergedDay>(days.filter((day) => day.logs.length > 0).map((day) => [day.date, day]));
  try {
    const blob = await agileReport({ year, title: data.prefs.reportTitle || 'Agile Report', subtitle: data.prefs.reportSubtitle, days: merged });
    downloadBlob(blob, `${year} ${data.prefs.reportTitle || 'Agile Report'}.xlsx`);
  } catch (error) {
    console.error('Excel export failed', error);
    toast('The Excel file could not be created.', 'error');
  }
}
