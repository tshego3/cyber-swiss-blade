import { addDays, newId, roundMoney, toIsoDate } from '../../core/format';
import { createRepository, type Entity } from '../../core/repository';
import {
  PROFILE_ID,
  QUOTATION_COLLECTIONS,
  clientShape,
  profileShape,
  quoteShape,
  type BusinessProfile,
  type Client,
  type Quote,
  type QuoteLine,
  type QuoteStatus,
  type QuoteTotals,
} from './types';

const DEFAULT_CURRENCY = 'ZAR';
const DEFAULT_TAX_RATE = 15;
const VALIDITY_DAYS = 30;
const NUMBER_PATTERN = /^Q-(\d{4})-(\d+)$/;

export const clients = createRepository<Client>(QUOTATION_COLLECTIONS.clients, clientShape);
export const quotes = createRepository<Quote>(QUOTATION_COLLECTIONS.quotes, quoteShape);
export const profiles = createRepository<BusinessProfile>(QUOTATION_COLLECTIONS.profile, profileShape);

export const EMPTY_PROFILE: BusinessProfile = { name: '', email: '', phone: '', address: '', taxNumber: '', paymentTerms: '' };

export async function loadProfile(): Promise<BusinessProfile> {
  return (await profiles.get(PROFILE_ID)) ?? EMPTY_PROFILE;
}

export function saveProfile(profile: BusinessProfile): Promise<Entity<BusinessProfile>> {
  return profiles.save(profile, PROFILE_ID);
}

export function lineAmount(line: QuoteLine): number {
  return roundMoney(line.quantity * line.unitPrice);
}

export function quoteTotals(quote: Quote): QuoteTotals {
  const subtotal = roundMoney(quote.lines.reduce((total, line) => total + lineAmount(line), 0));
  const tax = roundMoney((subtotal * quote.taxRate) / 100);
  return { subtotal, tax, total: roundMoney(subtotal + tax) };
}

export function nextQuoteNumber(existing: readonly Quote[], year: number): string {
  const highest = existing.reduce((max, quote) => {
    const match = NUMBER_PATTERN.exec(quote.number);
    return match && Number(match[1]) === year ? Math.max(max, Number(match[2])) : max;
  }, 0);
  return `Q-${year}-${String(highest + 1).padStart(3, '0')}`;
}

export function createLine(): QuoteLine {
  return { id: newId(), description: '', quantity: 1, unitPrice: 0 };
}

export function draftQuote(existing: readonly Quote[], today: Date): Quote {
  const issueDate = toIsoDate(today);
  const latest = [...existing].sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];
  return {
    number: nextQuoteNumber(existing, today.getFullYear()),
    clientId: '',
    title: '',
    issueDate,
    validUntil: addDays(issueDate, VALIDITY_DAYS),
    status: 'draft',
    currency: latest?.currency ?? DEFAULT_CURRENCY,
    taxRate: latest?.taxRate ?? DEFAULT_TAX_RATE,
    lines: [createLine()],
    notes: '',
  };
}

export function duplicateQuote(source: Quote, existing: readonly Quote[], today: Date): Quote {
  const draft = draftQuote(existing, today);
  return { ...source, number: draft.number, issueDate: draft.issueDate, validUntil: draft.validUntil, status: 'draft', lines: source.lines.map((line) => ({ ...line, id: newId() })) };
}

export function isExpired(quote: Quote, today: string): boolean {
  return quote.status === 'sent' && quote.validUntil < today;
}

export function filterQuotes<T extends Quote>(list: readonly T[], clientNames: ReadonlyMap<string, string>, search: string, status: QuoteStatus | 'all'): T[] {
  const query = search.trim().toLowerCase();
  return list
    .filter((quote) => status === 'all' || quote.status === status)
    .filter((quote) => !query || `${quote.number} ${quote.title} ${clientNames.get(quote.clientId) ?? ''}`.toLowerCase().includes(query))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
}

export function clientLabel(client: Client | undefined): string {
  if (!client) return 'No client';
  return client.company ? `${client.company} · ${client.name}` : client.name;
}
