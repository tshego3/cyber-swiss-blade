import { describe, expect, it } from 'vitest';
import { matchesShape, type ShapeOf } from './shape';

type Line = { readonly label: string; readonly amount: number };
type Sample = { readonly name: string; readonly active: boolean; readonly status: 'open' | 'closed'; readonly lines: readonly Line[] };

const lineShape: ShapeOf<Line> = { label: 'string', amount: 'number' };
const sampleShape: ShapeOf<Sample> = { name: 'string', active: 'boolean', status: ['open', 'closed'], lines: [lineShape] };

describe('matchesShape', () => {
  it('accepts a value that matches every field', () => {
    expect(matchesShape<Sample>({ name: 'a', active: true, status: 'open', lines: [{ label: 'x', amount: 2 }] }, sampleShape)).toBe(true);
  });

  it('rejects wrong primitive types, unknown enum values, and bad nested items', () => {
    expect(matchesShape<Sample>({ name: 1, active: true, status: 'open', lines: [] }, sampleShape)).toBe(false);
    expect(matchesShape<Sample>({ name: 'a', active: true, status: 'pending', lines: [] }, sampleShape)).toBe(false);
    expect(matchesShape<Sample>({ name: 'a', active: true, status: 'open', lines: [{ label: 'x' }] }, sampleShape)).toBe(false);
  });

  it('rejects non-finite numbers and non-objects', () => {
    expect(matchesShape<Line>({ label: 'x', amount: Number.NaN }, lineShape)).toBe(false);
    expect(matchesShape<Line>(null, lineShape)).toBe(false);
    expect(matchesShape<Line>([], lineShape)).toBe(false);
  });
});
