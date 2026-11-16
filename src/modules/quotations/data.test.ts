import { describe, expect, it } from 'vitest';
import { draftQuote, duplicateQuote, filterQuotes, isExpired, nextQuoteNumber, quoteTotals } from './data';
import type { Quote } from './types';

const base: Quote = {
  number: 'Q-2026-001',
  clientId: 'c1',
  title: 'Website rebuild',
  issueDate: '2026-11-01',
  validUntil: '2026-12-01',
  status: 'sent',
  currency: 'ZAR',
  taxRate: 15,
  lines: [
    { id: 'l1', description: 'Design', quantity: 3, unitPrice: 1000.5 },
    { id: 'l2', description: 'Build', quantity: 1.5, unitPrice: 333.33 },
  ],
  notes: '',
};

describe('quoteTotals', () => {
  it('rounds each line and the tax to cents', () => {
    expect(quoteTotals(base)).toEqual({ subtotal: 3501.5, tax: 525.23, total: 4026.73 });
  });
});

describe('nextQuoteNumber', () => {
  it('continues the sequence for the current year only', () => {
    expect(nextQuoteNumber([base, { ...base, number: 'Q-2026-014' }, { ...base, number: 'Q-2025-099' }], 2026)).toBe('Q-2026-015');
    expect(nextQuoteNumber([base], 2027)).toBe('Q-2027-001');
  });
});

describe('draftQuote and duplicateQuote', () => {
  it('creates a draft valid for 30 days that reuses the latest currency and tax', () => {
    const draft = draftQuote([base], new Date(2026, 10, 16));
    expect(draft).toMatchObject({ number: 'Q-2026-002', status: 'draft', issueDate: '2026-11-16', validUntil: '2026-12-16', currency: 'ZAR', taxRate: 15 });
    expect(draft.lines).toHaveLength(1);
  });

  it('copies lines with new ids and resets status', () => {
    const copy = duplicateQuote(base, [base], new Date(2026, 10, 16));
    expect(copy.status).toBe('draft');
    expect(copy.number).toBe('Q-2026-002');
    expect(copy.lines.map((line) => line.description)).toEqual(['Design', 'Build']);
    expect(copy.lines[0]?.id).not.toBe('l1');
  });
});

describe('filterQuotes and isExpired', () => {
  it('filters by status and searches number, title, and client', () => {
    const quotes = [base, { ...base, number: 'Q-2026-002', title: 'Mobile app', status: 'draft' as const, clientId: 'c2' }];
    const names = new Map([['c1', 'Acme'], ['c2', 'Globex']]);
    expect(filterQuotes(quotes, names, 'globex', 'all').map((quote) => quote.number)).toEqual(['Q-2026-002']);
    expect(filterQuotes(quotes, names, '', 'sent').map((quote) => quote.number)).toEqual(['Q-2026-001']);
  });

  it('marks sent quotes past their validity date as expired', () => {
    expect(isExpired(base, '2026-12-02')).toBe(true);
    expect(isExpired({ ...base, status: 'accepted' }, '2026-12-02')).toBe(false);
  });
});
