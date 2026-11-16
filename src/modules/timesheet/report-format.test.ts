import { describe, expect, it } from 'vitest';
import { newLog } from './data';
import { extractRows, mergeDay, parseReportRow, type ReportRow } from './report-format';

const DAY = '2026-06-30';
const codeIds = new Map([
  ['Client Project', 'p1'],
  ['Productive', 'p2'],
]);
const codeNames = new Map([...codeIds].map(([name, id]) => [id, name]));
const reportCodes = [...codeIds.keys()];
const summary = 'I tidied the wizard flow and added tests so that we can ship it safely.';

const row: ReportRow = {
  date: DAY,
  codes: ['Client Project'],
  hours: 8,
  comment: `I updated the tracker. A 0.37-hour Developer stand-up meeting was held. || CR-9001_00012345 - I refined the wizard. [${summary}] Productive - For 0.5 hour, I helped a colleague. 9001_00045678 - For 1 hour, I reviewed a pull request. 9001-000132-000003 (PR-9001_00031112) - For 2 hours, I fixed the build.`,
};

describe('parseReportRow', () => {
  const logs = parseReportRow(row, codeIds, reportCodes);

  it('splits the general part and one work item per billing code', () => {
    expect(logs.map((log) => [log.kind, log.workItem, log.hours])).toEqual([
      ['note', '', 4.5],
      ['work', 'CR-9001_00012345', 0],
      ['work', 'Productive', 0.5],
      ['work', '9001_00045678', 1],
      ['work', '9001-000132-000003 (PR-9001_00031112)', 2],
    ]);
    expect(logs[1]).toMatchObject({ comment: 'I refined the wizard.', summary, codeId: 'p1' });
    expect(logs[2]?.comment).toBe('For 0.5 hour, I helped a colleague.');
    expect(logs[0]?.comment).toBe('I updated the tracker. A 0.37-hour Developer stand-up meeting was held.');
  });

  it('rebuilds the same report row', () => {
    expect(mergeDay(DAY, logs, codeNames)).toEqual({ date: DAY, codes: 'Client Project', hours: 8, comment: row.comment });
  });

  it('keeps short brackets in the text and handles rows without a general part', () => {
    const technical = parseReportRow({ ...row, comment: 'CR-9001_00000001 - I changed items[0] to items[1].' }, codeIds, reportCodes);
    expect(technical.map((log) => [log.kind, log.workItem, log.comment, log.summary])).toEqual([
      ['note', '', '', ''],
      ['work', 'CR-9001_00000001', 'I changed items[0] to items[1].', ''],
    ]);
  });

  it('keeps a plain day as one note with the hours and every code', () => {
    const leave = parseReportRow({ date: DAY, codes: ['Client Project', 'Productive'], hours: 8, comment: 'Leave' }, codeIds, reportCodes);
    expect(leave.map((log) => [log.kind, log.codeId, log.hours, log.comment])).toEqual([
      ['note', 'p1', 8, 'Leave'],
      ['note', 'p2', 0, ''],
    ]);
    expect(mergeDay(DAY, leave, codeNames).codes).toBe('Client Project & Productive');
  });
});

describe('extractRows', () => {
  it('gives one row per billing code, sharing unstated hours, with the summary as the description', () => {
    const logs = parseReportRow(row, codeIds, reportCodes);
    expect(extractRows(DAY, logs, codeNames)).toEqual([
      { date: DAY, billingCode: 'CR-9001_00012345', hours: 4.5, description: summary },
      { date: DAY, billingCode: 'Productive', hours: 0.5, description: 'For 0.5 hour, I helped a colleague.' },
      { date: DAY, billingCode: '9001_00045678', hours: 1, description: 'For 1 hour, I reviewed a pull request.' },
      { date: DAY, billingCode: '9001-000132-000003 (PR-9001_00031112)', hours: 2, description: 'For 2 hours, I fixed the build.' },
    ]);
  });

  it('puts the remaining hours on the project when every item states its hours', () => {
    const logs = [newLog(DAY, 'note', 'p1', 1, { hours: 6, comment: 'Admin.' }), newLog(DAY, 'work', 'p1', 2, { workItem: 'CR-9001_1', hours: 2, comment: 'Fix.' })];
    expect(extractRows(DAY, logs, codeNames)).toEqual([
      { date: DAY, billingCode: 'Client Project', hours: 6, description: 'Admin.' },
      { date: DAY, billingCode: 'CR-9001_1', hours: 2, description: 'Fix.' },
    ]);
  });
});
