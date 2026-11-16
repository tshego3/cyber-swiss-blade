import type { ShapeOf } from '../../core/shape';

export const QUOTATION_COLLECTIONS = {
  clients: 'quotation_clients',
  quotes: 'quotation_quotes',
  profile: 'quotation_profile',
} as const;

export const PROFILE_ID = 'profile';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined';

export const QUOTE_STATUSES: readonly QuoteStatus[] = ['draft', 'sent', 'accepted', 'declined'];

export const STATUS_LABELS: Readonly<Record<QuoteStatus, string>> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
};

export type Client = {
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
};

export type QuoteLine = {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
};

export type Quote = {
  readonly number: string;
  readonly clientId: string;
  readonly title: string;
  readonly issueDate: string;
  readonly validUntil: string;
  readonly status: QuoteStatus;
  readonly currency: string;
  readonly taxRate: number;
  readonly lines: readonly QuoteLine[];
  readonly notes: string;
};

export type BusinessProfile = {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxNumber: string;
  readonly paymentTerms: string;
};

export interface QuoteTotals {
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
}

export const clientShape: ShapeOf<Client> = { name: 'string', company: 'string', email: 'string', phone: 'string', address: 'string' };

export const quoteLineShape: ShapeOf<QuoteLine> = { id: 'string', description: 'string', quantity: 'number', unitPrice: 'number' };

export const quoteShape: ShapeOf<Quote> = {
  number: 'string',
  clientId: 'string',
  title: 'string',
  issueDate: 'string',
  validUntil: 'string',
  status: QUOTE_STATUSES,
  currency: 'string',
  taxRate: 'number',
  lines: [quoteLineShape],
  notes: 'string',
};

export const profileShape: ShapeOf<BusinessProfile> = {
  name: 'string',
  email: 'string',
  phone: 'string',
  address: 'string',
  taxNumber: 'string',
  paymentTerms: 'string',
};
