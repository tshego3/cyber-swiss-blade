import type { SessionUser } from '../../../shared/access';
import type { JsonObject, JsonValue } from '../../../shared/protocol';
import { addDays, newId, roundMoney, toIsoDate } from '../../core/format';
import { createRepository, type Entity } from '../../core/repository';
import {
  PROFILE_ID,
  QUOTATION_COLLECTIONS,
  catalogueShape,
  clientShape,
  invoiceShape,
  profileShape,
  quoteShape,
  type BusinessProfile,
  type CatalogueItem,
  type Client,
  type DocumentTotals,
  type Invoice,
  type InvoiceKind,
  type InvoiceState,
  type PreparedBy,
  type PricedDocument,
  type Quote,
  type QuoteLine,
  type QuoteStatus,
} from './types';

const DEFAULT_CURRENCY = 'ZAR';
const DEFAULT_TAX_RATE = 15;
const VALIDITY_DAYS = 30;

const LINE_DEFAULTS: JsonObject = { unit: '', discountPercent: 0, catalogueItemId: '' };
const PREPARED_DEFAULTS: JsonObject = { preparedByName: '', preparedByEmail: '', preparedByPhone: '' };

export const EMPTY_PROFILE: BusinessProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  taxNumber: '',
  vatRegistered: true,
  logo: '',
  paymentTerms: '',
  defaultTerms: '',
  depositPercent: 50,
  paymentDays: 30,
  quotePrefix: 'Q',
  invoicePrefix: 'INV',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  branchCode: '',
  paymentReference: '{number}',
};

export const BRIEF_TEMPLATES: Readonly<Record<'photo' | 'video', string>> = {
  photo: ['Deadline:', 'Three main points to show:', 'Feeling to evoke:', 'Essential photos:', 'Group shots:', 'Where the photos will be shown:'].join('\n'),
  video: ['Deadline:', 'Three main points to show:', 'Feeling to evoke:', 'Clips that we must film:', 'Length and format:', 'Where the video will be shown:'].join('\n'),
};

function linesWithDefaults(value: JsonValue | undefined): JsonValue {
  return Array.isArray(value) ? value.map((line: JsonValue) => (line !== null && typeof line === 'object' && !Array.isArray(line) ? { ...LINE_DEFAULTS, ...line } : line)) : [];
}

export function upgradeClient(data: JsonObject): JsonObject {
  const { address, ...rest } = data;
  return { taxNumber: '', address1: typeof address === 'string' ? address : '', address2: '', city: '', region: '', postalCode: '', country: '', ...rest };
}

export function upgradeQuote(data: JsonObject): JsonObject {
  return { ...PREPARED_DEFAULTS, eventDate: '', bookingConfirmed: false, discountPercent: 0, depositPercent: 0, terms: '', brief: '', ...data, lines: linesWithDefaults(data.lines) };
}

export function upgradeInvoice(data: JsonObject): JsonObject {
  return { ...PREPARED_DEFAULTS, ...data, lines: linesWithDefaults(data.lines), payments: Array.isArray(data.payments) ? data.payments : [] };
}

export function upgradeProfile(data: JsonObject): JsonObject {
  return { ...EMPTY_PROFILE, ...data };
}

export const clients = createRepository<Client>(QUOTATION_COLLECTIONS.clients, clientShape, upgradeClient);
export const quotes = createRepository<Quote>(QUOTATION_COLLECTIONS.quotes, quoteShape, upgradeQuote);
export const invoices = createRepository<Invoice>(QUOTATION_COLLECTIONS.invoices, invoiceShape, upgradeInvoice);
export const catalogue = createRepository<CatalogueItem>(QUOTATION_COLLECTIONS.catalogue, catalogueShape);
export const profiles = createRepository<BusinessProfile>(QUOTATION_COLLECTIONS.profile, profileShape, upgradeProfile);

export async function loadProfile(): Promise<BusinessProfile> {
  return (await profiles.get(PROFILE_ID)) ?? EMPTY_PROFILE;
}

export function saveProfile(profile: BusinessProfile): Promise<Entity<BusinessProfile>> {
  return profiles.save(profile, PROFILE_ID);
}

export function lineAmount(line: QuoteLine): number {
  return roundMoney(line.quantity * line.unitPrice * (1 - line.discountPercent / 100));
}

export function documentTotals(document: PricedDocument): DocumentTotals {
  const subtotal = roundMoney(document.lines.reduce((total, line) => total + lineAmount(line), 0));
  const discount = roundMoney((subtotal * document.discountPercent) / 100);
  const tax = roundMoney(((subtotal - discount) * document.taxRate) / 100);
  return { subtotal, discount, tax, total: roundMoney(subtotal - discount + tax) };
}

export function depositAmount(quote: Quote): number {
  return roundMoney((documentTotals(quote).total * quote.depositPercent) / 100);
}

export function paidAmount(invoice: Invoice): number {
  return roundMoney(invoice.payments.reduce((total, payment) => total + payment.amount, 0));
}

export function invoiceBalance(invoice: Invoice): number {
  return roundMoney(documentTotals(invoice).total - paidAmount(invoice));
}

export function invoiceState(invoice: Invoice, today: string): InvoiceState {
  if (invoice.status === 'void') return 'void';
  if (invoice.status === 'draft') return 'draft';
  const balance = invoiceBalance(invoice);
  if (invoice.status === 'paid' || (balance <= 0 && documentTotals(invoice).total > 0)) return 'paid';
  if (invoice.dueDate && invoice.dueDate < today) return 'overdue';
  return invoice.payments.length > 0 ? 'partly-paid' : 'sent';
}

export function nextNumber(prefix: string, existing: readonly string[], year: number): string {
  const safe = prefix.trim() || 'DOC';
  const pattern = new RegExp(`^${safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{4})-(\\d+)$`);
  const highest = existing.reduce((max, number) => {
    const match = pattern.exec(number);
    return match && Number(match[1]) === year ? Math.max(max, Number(match[2])) : max;
  }, 0);
  return `${safe}-${year}-${String(highest + 1).padStart(3, '0')}`;
}

export function createLine(item?: Entity<CatalogueItem>): QuoteLine {
  return {
    id: newId(),
    description: item ? [item.name, item.description].filter(Boolean).join(' - ') : '',
    quantity: 1,
    unit: item?.unit ?? '',
    unitPrice: item?.unitPrice ?? 0,
    discountPercent: 0,
    catalogueItemId: item?.id ?? '',
  };
}

export function preparedBy(user: SessionUser | null): PreparedBy {
  return { preparedByName: user?.displayName ?? '', preparedByEmail: user?.email ?? '', preparedByPhone: user?.phone ?? '' };
}

export function draftQuote(existing: readonly Quote[], profile: BusinessProfile, user: SessionUser | null, today: Date): Quote {
  const issueDate = toIsoDate(today);
  const latest = [...existing].sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];
  return {
    ...preparedBy(user),
    number: nextNumber(profile.quotePrefix, existing.map((quote) => quote.number), today.getFullYear()),
    clientId: '',
    title: '',
    issueDate,
    validUntil: addDays(issueDate, VALIDITY_DAYS),
    eventDate: '',
    bookingConfirmed: false,
    status: 'draft',
    currency: latest?.currency ?? DEFAULT_CURRENCY,
    taxRate: profile.vatRegistered ? (latest?.taxRate ?? DEFAULT_TAX_RATE) : 0,
    discountPercent: 0,
    depositPercent: profile.depositPercent,
    lines: [createLine()],
    notes: '',
    terms: profile.defaultTerms,
    brief: '',
  };
}

export function duplicateQuote(source: Quote, existing: readonly Quote[], profile: BusinessProfile, user: SessionUser | null, today: Date): Quote {
  const draft = draftQuote(existing, profile, user, today);
  return { ...source, ...preparedBy(user), number: draft.number, issueDate: draft.issueDate, validUntil: draft.validUntil, status: 'draft', bookingConfirmed: false, lines: source.lines.map((line) => ({ ...line, id: newId() })) };
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

export function filterInvoices<T extends Invoice>(list: readonly T[], clientNames: ReadonlyMap<string, string>, search: string, state: InvoiceState | 'all', today: string): T[] {
  const query = search.trim().toLowerCase();
  return list
    .filter((invoice) => state === 'all' || invoiceState(invoice, today) === state)
    .filter((invoice) => !query || `${invoice.number} ${invoice.title} ${clientNames.get(invoice.clientId) ?? ''}`.toLowerCase().includes(query))
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate) || b.number.localeCompare(a.number));
}

function invoiceBase(source: Quote | null, profile: BusinessProfile, existing: readonly Invoice[], user: SessionUser | null, today: Date, kind: InvoiceKind): Invoice {
  const issueDate = toIsoDate(today);
  return {
    ...preparedBy(user),
    number: nextNumber(profile.invoicePrefix, existing.map((invoice) => invoice.number), today.getFullYear()),
    kind,
    quoteId: '',
    clientId: source?.clientId ?? '',
    title: source?.title ?? '',
    issueDate,
    dueDate: addDays(issueDate, profile.paymentDays),
    status: 'draft',
    currency: source?.currency ?? DEFAULT_CURRENCY,
    taxRate: source?.taxRate ?? (profile.vatRegistered ? DEFAULT_TAX_RATE : 0),
    discountPercent: 0,
    lines: [createLine()],
    payments: [],
    notes: '',
    terms: source?.terms ?? profile.defaultTerms,
  };
}

export function draftInvoice(existing: readonly Invoice[], profile: BusinessProfile, user: SessionUser | null, today: Date): Invoice {
  return invoiceBase(null, profile, existing, user, today, 'standard');
}

export function depositInvoice(quote: Entity<Quote>, existing: readonly Invoice[], profile: BusinessProfile, user: SessionUser | null, today: Date): Invoice {
  const totals = documentTotals(quote);
  const net = roundMoney(((totals.subtotal - totals.discount) * quote.depositPercent) / 100);
  const line: QuoteLine = { ...createLine(), description: `Deposit (${quote.depositPercent}%) for quotation ${quote.number}`, unitPrice: net };
  return { ...invoiceBase(quote, profile, existing, user, today, 'deposit'), quoteId: quote.id, dueDate: quote.eventDate ? addDays(quote.eventDate, -1) : toIsoDate(today), lines: [line] };
}

export function finalInvoice(quote: Entity<Quote>, existing: readonly Entity<Invoice>[], profile: BusinessProfile, user: SessionUser | null, today: Date): Invoice {
  const deposits = existing.filter((invoice) => invoice.quoteId === quote.id && invoice.kind === 'deposit' && invoice.status !== 'void');
  const credits = deposits.map((deposit): QuoteLine => {
    const totals = documentTotals(deposit);
    return { ...createLine(), description: `Less deposit invoiced on ${deposit.number}`, unitPrice: -roundMoney(totals.subtotal - totals.discount) };
  });
  const lines = quote.lines.map((line) => ({ ...line, id: newId() }));
  const { discount } = documentTotals(quote);
  const discountLine: QuoteLine[] = discount > 0 ? [{ ...createLine(), description: `Discount (${quote.discountPercent}%)`, unitPrice: -discount }] : [];
  return { ...invoiceBase(quote, profile, existing, user, today, deposits.length > 0 ? 'final' : 'standard'), quoteId: quote.id, lines: [...lines, ...discountLine, ...credits] };
}

export function paymentReference(template: string, number: string, client: Client | undefined): string {
  const name = client?.company || client?.name || '';
  return template.replace(/\{number\}/g, () => number).replace(/\{client\}/g, () => name).trim();
}

export function clientLabel(client: Client | undefined): string {
  if (!client) return 'No client';
  return client.company ? `${client.company} · ${client.name}` : client.name;
}

export function clientAddress(client: Client): string[] {
  return [client.address1, client.address2, [client.city, client.region, client.postalCode].filter(Boolean).join(', '), client.country].filter(Boolean);
}
