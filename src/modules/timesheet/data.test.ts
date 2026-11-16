import { describe, expect, it } from 'vitest';
import { continueFrom, dayStatus, extractTsv, mergeDay, meetingSentence, monthDates, newLog, parseHours, recentWorkItems, routineLogs, toTsv, weekDates } from './data';
import { DEFAULT_PREFS } from './data';
import type { TimeLog } from './types';

const DAY = '2026-11-16';
const codes = new Map([
  ['main', 'Client Support'],
  ['extra', 'Productive'],
]);

describe('mergeDay', () => {
  it('builds one report row like the spreadsheet: codes with &, summed hours, general part, ||, then the work items', () => {
    const day: TimeLog[] = [
      newLog(DAY, 'work', 'main', 3, { workItem: 'CR-1001', hours: 5, comment: 'I fixed the import.' }),
      newLog(DAY, 'meeting', 'main', 2, { title: 'Developer stand-up', hours: 0.4 }),
      newLog(DAY, 'note', 'main', 1, { comment: 'I updated the weekly tracker.' }),
      newLog(DAY, 'work', 'extra', 4, { workItem: 'PR-2002', hours: 2.6, comment: 'I reviewed the release.' }),
    ];
    expect(mergeDay(DAY, day, codes)).toEqual({
      date: DAY,
      codes: 'Client Support & Productive',
      hours: 8,
      comment: 'I updated the weekly tracker. A 0.40-hour Developer stand-up meeting was held. || CR-1001 - For 5 hours, I fixed the import. PR-2002 - For 2.6 hours, I reviewed the release.',
    });
  });

  it('writes one work item without an hours prefix and leave with its own code', () => {
    expect(mergeDay(DAY, [newLog(DAY, 'work', 'main', 1, { workItem: 'CR-1', hours: 8, comment: 'Done.' })], codes).comment).toBe('CR-1 - Done.');
    expect(mergeDay(DAY, [newLog(DAY, 'leave', '', 1)], codes)).toEqual({ date: DAY, codes: 'Leave', hours: 8, comment: 'Leave' });
  });

  it('does not repeat the word meeting', () => {
    expect(meetingSentence('Planning meeting', 1)).toBe('A 1.00-hour Planning meeting was held.');
  });
});

describe('day helpers', () => {
  it('classifies days against the daily target', () => {
    expect(dayStatus('2026-11-21', [], 0, 8)).toBe('weekend');
    expect(dayStatus(DAY, [], 0, 8)).toBe('empty');
    const one = [newLog(DAY, 'note', '', 1)];
    expect(dayStatus(DAY, one, 0, 8)).toBe('planned');
    expect(dayStatus(DAY, one, 6, 8)).toBe('under');
    expect(dayStatus(DAY, one, 8, 8)).toBe('complete');
    expect(dayStatus(DAY, one, 9, 8)).toBe('over');
    expect(dayStatus(DAY, [newLog(DAY, 'holiday', '', 1)], 8, 8)).toBe('leave');
  });

  it('lists weeks from Monday and every day of a month', () => {
    expect(weekDates('2026-11-19')).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    expect(monthDates(2026, 2)).toHaveLength(28);
  });

  it.each([
    ['8', 8],
    ['0.4', 0.4],
    ['1,5', 1.5],
    ['1:30', 1.5],
    ['', 0],
    ['25', null],
    ['abc', null],
  ])('parses hours %j', (input, expected) => {
    expect(parseHours(input)).toBe(expected);
  });
});

describe('routines', () => {
  it('fills empty workdays with the standing note and scheduled meetings at their default hours', () => {
    const settings = { ...DEFAULT_PREFS, standingNote: 'Daily admin.', defaultCodeId: 'main', meetings: [{ name: 'Stand-up', hours: 0.25, weekdays: '135' }] };
    const filled = routineLogs(weekDates(DAY), [newLog('2026-11-17', 'work', 'main', 1)], settings);
    expect(filled.map((log) => [log.date, log.kind, log.hours])).toEqual([
      ['2026-11-16', 'note', 0],
      ['2026-11-16', 'meeting', 0.25],
      ['2026-11-18', 'note', 0],
      ['2026-11-18', 'meeting', 0.25],
      ['2026-11-19', 'note', 0],
      ['2026-11-20', 'note', 0],
      ['2026-11-20', 'meeting', 0.25],
    ]);
  });

  it('continues the last day with work items, skipping the weekend', () => {
    const friday = [newLog('2026-11-13', 'work', 'main', 1, { workItem: 'CR-9', hours: 8, comment: 'Old text' })];
    expect(continueFrom(DAY, friday)).toEqual([newLog(DAY, 'work', 'main', 100, { workItem: 'CR-9' })]);
    expect(continueFrom(DAY, [])).toEqual([]);
  });

  it('lists recent work items, newest first, without duplicates', () => {
    const list = [newLog('2026-11-10', 'work', '', 1, { workItem: 'A' }), newLog('2026-11-12', 'work', '', 1, { workItem: 'B' }), newLog('2026-11-13', 'work', '', 1, { workItem: 'A' })];
    expect(recentWorkItems(list)).toEqual(['A', 'B']);
  });

  it('copies one row per billing code for the timesheet extraction', () => {
    expect(extractTsv([{ date: DAY, billingCode: 'CR-9001_1', hours: 2.5, description: '=Fix' }])).toBe(`${DAY}\tCR-9001_1\t2.5\t'=Fix`);
  });

  it('blocks formula injection when the text is pasted into Excel', () => {
    expect(toTsv([{ date: DAY, codes: '=HYPERLINK("x")', hours: 1, comment: '@SUM(A1)' }])).toBe(`${DAY}\t'=HYPERLINK("x")\t1\t'@SUM(A1)`);
  });

  it('copies days as tab-separated rows for Excel', () => {
    expect(toTsv([{ date: DAY, codes: 'Leave', hours: 8, comment: 'Line\none' }, { date: '2026-11-21', codes: '', hours: 0, comment: '' }])).toBe(`${DAY}\tLeave\t8\tLine one\n2026-11-21\t\t\t`);
  });
});
