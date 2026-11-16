import type { ShapeOf } from '../../core/shape';

export const QUOTATION_COLLECTIONS = {
  clients: 'quotation_clients',
  quotes: 'quotation_quotes',
  profile: 'quotation_profile',
  catalogue: 'quotation_catalogue',
  invoices: 'quotation_invoices',
} as const;

export const PROFILE_ID = 'profile';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'invoiced';

export const QUOTE_STATUSES: readonly QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined', 'invoiced'];

export const STATUS_LABELS: Readonly<Record<QuoteStatus, string>> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  invoiced: 'Invoiced',
};

export type InvoiceKind = 'standard' | 'deposit' | 'final';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';
export type InvoiceState = 'draft' | 'sent' | 'partly-paid' | 'overdue' | 'paid' | 'void';

export const INVOICE_KINDS: readonly InvoiceKind[] = ['standard', 'deposit', 'final'];
export const INVOICE_STATUSES: readonly InvoiceStatus[] = ['draft', 'sent', 'paid', 'void'];

export const INVOICE_STATE_LABELS: Readonly<Record<InvoiceState, string>> = {
  draft: 'Draft',
  sent: 'Sent',
  'partly-paid': 'Partly paid',
  overdue: 'Overdue',
  paid: 'Paid',
  void: 'Void',
};

export const INVOICE_KIND_TITLES: Readonly<Record<InvoiceKind, string>> = {
  standard: 'Tax invoice',
  deposit: 'Deposit invoice',
  final: 'Final invoice',
};

export type Client = {
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly phone: string;
  readonly taxNumber: string;
  readonly address1: string;
  readonly address2: string;
  readonly city: string;
  readonly region: string;
  readonly postalCode: string;
  readonly country: string;
};

export type QuoteLine = {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly discountPercent: number;
  readonly catalogueItemId: string;
};

export type PreparedBy = {
  readonly preparedByName: string;
  readonly preparedByEmail: string;
  readonly preparedByPhone: string;
};

export type Quote = PreparedBy & {
  readonly number: string;
  readonly clientId: string;
  readonly title: string;
  readonly issueDate: string;
  readonly validUntil: string;
  readonly eventDate: string;
  readonly bookingConfirmed: boolean;
  readonly status: QuoteStatus;
  readonly currency: string;
  readonly taxRate: number;
  readonly discountPercent: number;
  readonly depositPercent: number;
  readonly lines: readonly QuoteLine[];
  readonly notes: string;
  readonly terms: string;
  readonly brief: string;
};

export type Payment = {
  readonly id: string;
  readonly date: string;
  readonly amount: number;
  readonly method: string;
  readonly reference: string;
};

export type Invoice = PreparedBy & {
  readonly number: string;
  readonly kind: InvoiceKind;
  readonly quoteId: string;
  readonly clientId: string;
  readonly title: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly status: InvoiceStatus;
  readonly currency: string;
  readonly taxRate: number;
  readonly discountPercent: number;
  readonly lines: readonly QuoteLine[];
  readonly payments: readonly Payment[];
  readonly notes: string;
  readonly terms: string;
};

export type CatalogueItem = {
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly unit: string;
  readonly unitPrice: number;
  readonly archived: boolean;
};

export type BusinessProfile = {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxNumber: string;
  readonly vatRegistered: boolean;
  readonly logo: string;
  readonly paymentTerms: string;
  readonly defaultTerms: string;
  readonly depositPercent: number;
  readonly paymentDays: number;
  readonly quotePrefix: string;
  readonly invoicePrefix: string;
  readonly bankName: string;
  readonly accountHolder: string;
  readonly accountNumber: string;
  readonly branchCode: string;
  readonly paymentReference: string;
};

export interface DocumentTotals {
  readonly subtotal: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
}

export interface PricedDocument {
  readonly lines: readonly QuoteLine[];
  readonly discountPercent: number;
  readonly taxRate: number;
}

export const clientShape: ShapeOf<Client> = {
  name: 'string',
  company: 'string',
  email: 'string',
  phone: 'string',
  taxNumber: 'string',
  address1: 'string',
  address2: 'string',
  city: 'string',
  region: 'string',
  postalCode: 'string',
  country: 'string',
};

export const quoteLineShape: ShapeOf<QuoteLine> = {
  id: 'string',
  description: 'string',
  quantity: 'number',
  unit: 'string',
  unitPrice: 'number',
  discountPercent: 'number',
  catalogueItemId: 'string',
};

const preparedByShape: ShapeOf<PreparedBy> = { preparedByName: 'string', preparedByEmail: 'string', preparedByPhone: 'string' };

export const quoteShape: ShapeOf<Quote> = {
  ...preparedByShape,
  number: 'string',
  clientId: 'string',
  title: 'string',
  issueDate: 'string',
  validUntil: 'string',
  eventDate: 'string',
  bookingConfirmed: 'boolean',
  status: QUOTE_STATUSES,
  currency: 'string',
  taxRate: 'number',
  discountPercent: 'number',
  depositPercent: 'number',
  lines: [quoteLineShape],
  notes: 'string',
  terms: 'string',
  brief: 'string',
};

export const paymentShape: ShapeOf<Payment> = { id: 'string', date: 'string', amount: 'number', method: 'string', reference: 'string' };

export const invoiceShape: ShapeOf<Invoice> = {
  ...preparedByShape,
  number: 'string',
  kind: INVOICE_KINDS,
  quoteId: 'string',
  clientId: 'string',
  title: 'string',
  issueDate: 'string',
  dueDate: 'string',
  status: INVOICE_STATUSES,
  currency: 'string',
  taxRate: 'number',
  discountPercent: 'number',
  lines: [quoteLineShape],
  payments: [paymentShape],
  notes: 'string',
  terms: 'string',
};

export const catalogueShape: ShapeOf<CatalogueItem> = { category: 'string', name: 'string', description: 'string', unit: 'string', unitPrice: 'number', archived: 'boolean' };

export const profileShape: ShapeOf<BusinessProfile> = {
  name: 'string',
  email: 'string',
  phone: 'string',
  address: 'string',
  taxNumber: 'string',
  vatRegistered: 'boolean',
  logo: 'string',
  paymentTerms: 'string',
  defaultTerms: 'string',
  depositPercent: 'number',
  paymentDays: 'number',
  quotePrefix: 'string',
  invoicePrefix: 'string',
  bankName: 'string',
  accountHolder: 'string',
  accountNumber: 'string',
  branchCode: 'string',
  paymentReference: 'string',
};
