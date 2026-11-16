import { describe, expect, it } from 'vitest';
import { addDays, formatClock, formatMinutes, parseDuration, relativeTime, startOfWeek } from './format';

describe('parseDuration', () => {
  it.each([
    ['1:30', 90],
    ['0:05', 5],
    ['1.5', 90],
    ['2', 120],
    ['90m', 90],
    ['1h 15m', 75],
    ['1h15m', 75],
    ['3h', 180],
  ])('parses %s as %i minutes', (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes);
  });

  it.each(['', 'abc', '1:75', 'h', '-1'])('rejects %s', (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe('dates', () => {
  it('finds the Monday that starts the week', () => {
    expect(startOfWeek('2026-11-16')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-22')).toBe('2026-11-16');
    expect(startOfWeek('2026-11-23')).toBe('2026-11-23');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('formatting', () => {
  it('formats minutes and clocks', () => {
    expect(formatMinutes(125)).toBe('2h 05m');
    expect(formatClock(3725)).toBe('01:02:05');
  });

  it('describes relative times', () => {
    const now = Date.parse('2026-11-16T12:00:00.000Z');
    expect(relativeTime('2026-11-16T11:59:50.000Z', now)).toBe('just now');
    expect(relativeTime('2026-11-16T11:55:00.000Z', now)).toBe('5m ago');
    expect(relativeTime('2026-11-16T09:00:00.000Z', now)).toBe('3h ago');
  });
});
