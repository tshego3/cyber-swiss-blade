import type { LogKind, MergedDay, TimeLog } from './types';

const GENERAL_KINDS: ReadonlySet<LogKind> = new Set(['note', 'leave', 'holiday', 'meeting']);
const KIND_ORDER: Readonly<Record<LogKind, number>> = { leave: 0, holiday: 0, note: 1, meeting: 2, work: 3 };
const FALLBACK_CODES: Readonly<Partial<Record<LogKind, string>>> = { leave: 'Leave', holiday: 'Public Holiday' };
const SECTION = ' || ';
const ITEM_CODE = String.raw`(?:[A-Z]{2}-)?9001[-_][0-9][0-9_-]*[0-9](?:\s*\((?:[A-Z]{2}-)?9001[-_][0-9_-]+[0-9]\))?`;
const HOURS_PREFIX = /^For (\d+(?:\.\d+)?) hours?,\s*/i;
const SUMMARY = /\s*\[([^[\]]{20,})\]\s*$/;
const MIN_SUMMARY = 20;

export interface ReportRow {
  readonly date: string;
  readonly codes: readonly string[];
  readonly hours: number;
  readonly comment: string;
}

export interface ExtractRow {
  readonly date: string;
  readonly billingCode: string;
  readonly hours: number;
  readonly description: string;
}

export function roundHours(hours: number): number {
  return Math.round(hours * 100) / 100;
}

export function formatHourValue(hours: number): string {
  return String(roundHours(hours));
}

export function meetingSentence(title: string, hours: number): string {
  const name = title.trim() || 'team';
  const suffix = /\bmeeting$/i.test(name) ? '' : ' meeting';
  return `A ${hours.toFixed(2)}-hour ${name}${suffix} was held.`;
}

export function sortLogs<T extends TimeLog>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.order - b.order);
}

function generalText(log: TimeLog): string {
  if (log.kind === 'meeting') return [meetingSentence(log.title, log.hours), log.comment.trim()].filter(Boolean).join(' ');
  if (log.kind === 'note') return log.comment.trim();
  return log.comment.trim() || FALLBACK_CODES[log.kind] || '';
}

function workText(log: TimeLog, statesHours: boolean): string {
  const comment = log.comment.trim();
  const prefixed = statesHours && log.hours > 0 && !HOURS_PREFIX.test(comment);
  const body = prefixed ? `For ${formatHourValue(log.hours)} hour${log.hours <= 1 ? '' : 's'}, ${comment}` : comment;
  const summary = log.summary.trim() ? `[${log.summary.trim()}]` : '';
  const text = [body, summary].filter(Boolean).join(' ');
  return [log.workItem.trim(), text].filter(Boolean).join(' - ');
}

export function mergeDay(date: string, dayLogs: readonly TimeLog[], codeNames: ReadonlyMap<string, string>): MergedDay {
  const sorted = sortLogs(dayLogs);
  const names = sorted.map((log) => codeNames.get(log.codeId) ?? FALLBACK_CODES[log.kind] ?? '').filter(Boolean);
  const general = sorted.filter((log) => GENERAL_KINDS.has(log.kind)).map(generalText).filter(Boolean).join(' ');
  const work = sorted.filter((log) => log.kind === 'work');
  const items = work.map((log) => workText(log, work.length > 1)).filter(Boolean).join(' ');
  return {
    date,
    codes: [...new Set(names)].join(' & '),
    hours: roundHours(sorted.reduce((total, log) => total + log.hours, 0)),
    comment: [general, items].filter(Boolean).join(SECTION),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function itemCodes(reportCodes: readonly string[]): string {
  return [ITEM_CODE, ...[...reportCodes].sort((a, b) => b.length - a.length).map(escapeRegExp)].join('|');
}

function splitItem(raw: string): { readonly hours: number; readonly comment: string; readonly summary: string } {
  let body = raw.trim().replace(/\s*\|\|\s*$/, '');
  const summaryMatch = SUMMARY.exec(body);
  const summary = summaryMatch?.[1]?.trim() ?? '';
  if (summary.length >= MIN_SUMMARY) body = body.slice(0, summaryMatch?.index ?? body.length).trim();
  const hoursMatch = HOURS_PREFIX.exec(body);
  return { hours: hoursMatch ? Number(hoursMatch[1]) : 0, comment: body, summary };
}

export function parseReportRow(row: ReportRow, codeIds: ReadonlyMap<string, string>, reportCodes: readonly string[]): TimeLog[] {
  const codes = itemCodes(reportCodes);
  const pattern = new RegExp(`(?:^|\\s)(${codes})\\s+-\\s+`, 'g');
  const sectionAt = row.comment.indexOf(SECTION.trim());
  const startsWithItem = new RegExp(`^(?:${codes})\\s+-\\s+`).test(row.comment);
  const general = sectionAt >= 0 ? row.comment.slice(0, sectionAt).trim() : startsWithItem ? '' : row.comment.trim();
  const rest = sectionAt >= 0 ? row.comment.slice(sectionAt + 2).trim() : startsWithItem ? row.comment.trim() : '';
  const heads = [...rest.matchAll(pattern)];
  const items: { readonly code: string; readonly text: string }[] = [];
  if (rest && (heads.length === 0 || (heads[0]?.index ?? 0) > 0)) items.push({ code: '', text: rest.slice(0, heads[0]?.index ?? rest.length) });
  heads.forEach((head, index) => {
    const start = (head.index ?? 0) + head[0].length;
    items.push({ code: head[1] ?? '', text: rest.slice(start, heads[index + 1]?.index ?? rest.length) });
  });
  const projectId = codeIds.get(row.codes[0] ?? '') ?? '';
  const work = items.map((item, index): TimeLog => ({ ...splitItem(item.text), date: row.date, kind: 'work', codeId: projectId, workItem: item.code.trim(), title: '', order: 100 + index }));
  const stated = roundHours(work.reduce((total, log) => total + log.hours, 0));
  const notes = (row.codes.length > 0 ? row.codes : ['']).map((code, index): TimeLog => ({
    date: row.date,
    kind: 'note',
    codeId: codeIds.get(code) ?? '',
    workItem: '',
    title: '',
    hours: index === 0 ? Math.max(0, roundHours(row.hours - stated)) : 0,
    comment: index === 0 ? general : '',
    summary: '',
    order: index + 1,
  }));
  return [...notes, ...work];
}

export function extractRows(date: string, dayLogs: readonly TimeLog[], codeNames: ReadonlyMap<string, string>): ExtractRow[] {
  const total = roundHours(dayLogs.reduce((sum, log) => sum + log.hours, 0));
  const work = sortLogs(dayLogs.filter((log) => log.kind === 'work'));
  const stated = roundHours(work.reduce((sum, log) => sum + log.hours, 0));
  const unstated = work.filter((log) => log.hours === 0).length;
  const share = unstated > 0 ? roundHours((total - stated) / unstated) : 0;
  const rows: ExtractRow[] = work.map((log) => ({
    date,
    billingCode: log.workItem.trim() || codeNames.get(log.codeId) || '',
    hours: log.hours > 0 ? log.hours : share,
    description: log.summary.trim() || log.comment.trim(),
  }));
  const rest = roundHours(total - rows.reduce((sum, row) => sum + row.hours, 0));
  if (rest > 0 || rows.length === 0) {
    const general = mergeDay(date, dayLogs.filter((log) => log.kind !== 'work'), codeNames);
    if (general.codes || general.comment || rest > 0) rows.unshift({ date, billingCode: general.codes, hours: rest, description: general.comment });
  }
  return rows;
}
