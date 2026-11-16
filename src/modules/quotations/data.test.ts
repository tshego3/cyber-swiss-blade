import { describe, expect, it } from 'vitest';
import type { Entity } from '../../core/repository';
import {
  EMPTY_PROFILE,
  depositInvoice,
  documentTotals,
  draftQuote,
  duplicateQuote,
  filterQuotes,
  finalInvoice,
  invoiceBalance,
  invoiceState,
  isExpired,
  nextNumber,
  paymentReference,
  upgradeClient,
  upgradeQuote,
} from './data';
import type { Invoice, Quote, QuoteLine } from './types';

const line = (id: string, quantity: number, unitPrice: number, discountPercent = 0): QuoteLine => ({ id, description: id, quantity, unit: '', unitPrice, discountPercent, catalogueItemId: '' });
const user = { id: 'u1', username: 'sam', displayName: 'Sam', email: 'sam@example.com', phone: '082', roles: [] };

const base: Entity<Quote> = {
  id: 'q1',
  updatedAt: '2026-11-01T00:00:00.000Z',
  preparedByName: 'Sam',
  preparedByEmail: '',
  preparedByPhone: '',
  number: 'Q-2026-001',
  clientId: 'c1',
  title: 'Event video',
  issueDate: '2026-11-01',
  validUntil: '2026-12-01',
  eventDate: '2026-11-20',
  bookingConfirmed: false,
  status: 'accepted',
  currency: 'ZAR',
  taxRate: 15,
  discountPercent: 10,
  depositPercent: 50,
  lines: [line('Filming', 2, 1500), line('Editing', 1, 2000, 25)],
  notes: '',
  terms: 'Deposit due before the shoot.',
  brief: '',
};

describe('documentTotals', () => {
  it('applies line discounts, then the document discount, then VAT', () => {
    expect(documentTotals(base)).toEqual({ subtotal: 4500, discount: 450, tax: 607.5, total: 4657.5 });
  });
});

describe('numbering', () => {
  it('continues the sequence per prefix and year', () => {
    expect(nextNumber('Q', ['Q-2026-001', 'Q-2026-014', 'Q-2025-099', 'INV-2026-050'], 2026)).toBe('Q-2026-015');
    expect(nextNumber('INV', [], 2027)).toBe('INV-2027-001');
  });
});

describe('quotes', () => {
  it('creates a draft with profile defaults and the signed-in preparer', () => {
    const draft = draftQuote([base], { ...EMPTY_PROFILE, depositPercent: 40, defaultTerms: 'Terms' }, user, new Date(2026, 10, 16));
    expect(draft).toMatchObject({ number: 'Q-2026-002', status: 'draft', validUntil: '2026-12-16', depositPercent: 40, terms: 'Terms', preparedByName: 'Sam', preparedByEmail: 'sam@example.com' });
  });

  it('uses no VAT when the business is not VAT registered', () => {
    expect(draftQuote([], { ...EMPTY_PROFILE, vatRegistered: false }, null, new Date(2026, 10, 16)).taxRate).toBe(0);
  });

  it('duplicates with new line ids and a fresh status', () => {
    const copy = duplicateQuote(base, [base], EMPTY_PROFILE, user, new Date(2026, 10, 16));
    expect(copy).toMatchObject({ number: 'Q-2026-002', status: 'draft', bookingConfirmed: false });
    expect(copy.lines[0]?.id).not.toBe('Filming');
  });

  it('filters, searches, and expires', () => {
    const list = [base, { ...base, number: 'Q-2026-002', title: 'Logo', status: 'draft' as const, clientId: 'c2' }];
    expect(filterQuotes(list, new Map([['c2', 'Globex']]), 'globex', 'all').map((quote) => quote.number)).toEqual(['Q-2026-002']);
    expect(isExpired({ ...base, status: 'sent' }, '2026-12-02')).toBe(true);
  });

  it('upgrades records saved before the new fields existed', () => {
    const old = { number: 'Q-1', lines: [{ id: 'a', description: 'x', quantity: 1, unitPrice: 5 }] };
    expect(upgradeQuote(old)).toMatchObject({ depositPercent: 0, eventDate: '', lines: [{ id: 'a', unit: '', discountPercent: 0, catalogueItemId: '' }] });
    expect(upgradeClient({ name: 'A', address: '1 Main Rd' })).toMatchObject({ address1: '1 Main Rd', city: '' });
  });
});

describe('invoices', () => {
  const today = new Date(2026, 10, 16);

  it('makes a deposit invoice for the deposit share of the total, due the day before the event', () => {
    const deposit = depositInvoice(base, [], EMPTY_PROFILE, user, today);
    expect(deposit).toMatchObject({ number: 'INV-2026-001', kind: 'deposit', quoteId: 'q1', dueDate: '2026-11-19' });
    expect(documentTotals(deposit).total).toBe(2328.75);
  });

  it('makes a final invoice that subtracts the deposits already invoiced', () => {
    const deposit: Entity<Invoice> = { ...depositInvoice(base, [], EMPTY_PROFILE, user, today), id: 'i1', updatedAt: '' };
    const final = finalInvoice(base, [deposit], EMPTY_PROFILE, user, today);
    expect(final).toMatchObject({ number: 'INV-2026-002', kind: 'final', discountPercent: 0 });
    expect(final.lines.map((item) => item.description).slice(-2)).toEqual(['Discount (10%)', `Less deposit invoiced on ${deposit.number}`]);
    expect(documentTotals(deposit).total + documentTotals(final).total).toBeCloseTo(documentTotals(base).total, 2);
  });

  it('derives the payment state from payments and the due date', () => {
    const invoice: Invoice = { ...depositInvoice(base, [], EMPTY_PROFILE, user, today), status: 'sent' };
    expect(invoiceState(invoice, '2026-11-16')).toBe('sent');
    expect(invoiceState(invoice, '2026-11-25')).toBe('overdue');
    const partly = { ...invoice, payments: [{ id: 'p1', date: '2026-11-17', amount: 1000, method: 'EFT', reference: '' }] };
    expect(invoiceState(partly, '2026-11-18')).toBe('partly-paid');
    expect(invoiceBalance(partly)).toBe(1328.75);
    expect(invoiceState({ ...partly, payments: [{ ...partly.payments[0], id: 'p1', date: '', method: '', reference: '', amount: 2328.75 }] }, '2026-12-30')).toBe('paid');
    expect(invoiceState({ ...invoice, status: 'void' }, '2026-12-30')).toBe('void');
  });

  it('keeps special characters in the client name as written', () => {
    expect(paymentReference('{client}', 'X', { name: 'A$&B', company: '', email: '', phone: '', taxNumber: '', address1: '', address2: '', city: '', region: '', postalCode: '', country: '' })).toBe('A$&B');
  });

  it('fills in the payment reference', () => {
    expect(paymentReference('{number} {client}', 'INV-2026-001', { name: 'Ann', company: 'Acme', email: '', phone: '', taxNumber: '', address1: '', address2: '', city: '', region: '', postalCode: '', country: '' })).toBe('INV-2026-001 Acme');
  });
});
