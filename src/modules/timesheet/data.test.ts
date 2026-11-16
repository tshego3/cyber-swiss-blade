import { describe, expect, it } from 'vitest';
import type { Entity } from '../../core/repository';
import { entryAmount, summarizeWeek, timerMinutes, toCsv } from './data';
import type { Project, TimeEntry } from './types';

const project: Project = { name: 'API', client: 'Acme', hourlyRate: 800, currency: 'ZAR', archived: false };
const projects = new Map([['p1', project]]);

function entry(date: string, minutes: number, billable = true, description = 'Work'): Entity<TimeEntry> {
  return { id: `${date}-${minutes}`, updatedAt: '2026-11-16T10:00:00.000Z', projectId: 'p1', date, minutes, description, billable };
}

describe('summarizeWeek', () => {
  it('totals minutes and billable amounts for the selected week only', () => {
    const summary = summarizeWeek('2026-11-16', [entry('2026-11-16', 90), entry('2026-11-18', 30, false), entry('2026-11-23', 60)], projects);
    expect(summary.totalMinutes).toBe(120);
    expect(summary.billableMinutes).toBe(90);
    expect(summary.amounts).toEqual([{ currency: 'ZAR', amount: 1200 }]);
    expect(summary.days).toHaveLength(7);
    expect(summary.days[2]?.minutes).toBe(30);
  });
});

describe('entryAmount', () => {
  it('is zero for non-billable entries and unknown projects', () => {
    expect(entryAmount(entry('2026-11-16', 60, false), project)).toBe(0);
    expect(entryAmount(entry('2026-11-16', 60), undefined)).toBe(0);
    expect(entryAmount(entry('2026-11-16', 45), project)).toBe(600);
  });
});

describe('timerMinutes', () => {
  it('rounds to whole minutes with a minimum of one', () => {
    const startedAt = '2026-11-16T10:00:00.000Z';
    expect(timerMinutes({ projectId: 'p1', description: '', startedAt }, Date.parse('2026-11-16T10:00:10.000Z'))).toBe(1);
    expect(timerMinutes({ projectId: 'p1', description: '', startedAt }, Date.parse('2026-11-16T11:29:40.000Z'))).toBe(90);
  });
});

describe('toCsv', () => {
  it('quotes special characters and neutralises spreadsheet formulas', () => {
    const csv = toCsv([entry('2026-11-16', 60, true, 'Fix "login", deploy'), entry('2026-11-17', 30, true, '=HYPERLINK("x")')], projects);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Date,Project,Client,Description,Hours,Billable,Rate,Currency,Amount');
    expect(lines[1]).toBe('2026-11-16,API,Acme,"Fix ""login"", deploy",1.00,Yes,800,ZAR,800.00');
    expect(lines[2]).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
