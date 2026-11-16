import { el } from '../../core/dom';
import { formatDate, formatMoney } from '../../core/format';
import { lineAmount, quoteTotals } from './data';
import type { BusinessProfile, Client, Quote } from './types';

function lines(text: string): HTMLElement[] {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => el('span', { class: 'print-line', text: line }));
}

function partyBlock(label: string, title: string, details: readonly string[]): HTMLElement {
  return el('div', { class: 'print-party' }, [el('p', { class: 'print-label', text: label }), el('p', { class: 'print-strong', text: title }), ...details.filter(Boolean).flatMap(lines)]);
}

export function buildQuoteDocument(quote: Quote, client: Client | undefined, profile: BusinessProfile): HTMLElement {
  const totals = quoteTotals(quote);
  const money = (amount: number): string => formatMoney(amount, quote.currency);
  return el('article', { class: 'print-document' }, [
    el('header', { class: 'print-header' }, [
      partyBlock('From', profile.name || 'Your business', [profile.address, profile.email, profile.phone, profile.taxNumber && `Tax no. ${profile.taxNumber}`]),
      el('div', { class: 'print-meta' }, [
        el('h1', { class: 'print-title', text: 'Quotation' }),
        el('p', { class: 'print-number', text: quote.number }),
        el('p', { text: `Issued ${formatDate(quote.issueDate, 'long')}` }),
        el('p', { text: `Valid until ${formatDate(quote.validUntil, 'long')}` }),
      ]),
    ]),
    partyBlock('Prepared for', client?.company || client?.name || 'Client', [client?.company ? client.name : '', client?.address ?? '', client?.email ?? '']),
    quote.title && el('h2', { class: 'print-subject', text: quote.title }),
    el('table', { class: 'print-table' }, [
      el('thead', {}, [el('tr', {}, ['Description', 'Qty', 'Unit price', 'Amount'].map((heading) => el('th', { text: heading, attrs: { scope: 'col' } })))]),
      el(
        'tbody',
        {},
        quote.lines.map((line) => el('tr', {}, [el('td', { text: line.description }), el('td', { text: String(line.quantity) }), el('td', { text: money(line.unitPrice) }), el('td', { text: money(lineAmount(line)) })])),
      ),
    ]),
    el('dl', { class: 'print-totals' }, [
      el('dt', { text: 'Subtotal' }),
      el('dd', { text: money(totals.subtotal) }),
      el('dt', { text: `Tax (${quote.taxRate}%)` }),
      el('dd', { text: money(totals.tax) }),
      el('dt', { class: 'print-grand', text: 'Total' }),
      el('dd', { class: 'print-grand', text: money(totals.total) }),
    ]),
    quote.notes && el('section', { class: 'print-notes' }, [el('p', { class: 'print-label', text: 'Notes' }), ...lines(quote.notes)]),
    profile.paymentTerms && el('section', { class: 'print-notes' }, [el('p', { class: 'print-label', text: 'Payment terms' }), ...lines(profile.paymentTerms)]),
  ]);
}

export function printQuote(quote: Quote, client: Client | undefined, profile: BusinessProfile): void {
  const document_ = buildQuoteDocument(quote, client, profile);
  const previousTitle = document.title;
  document.title = `${quote.number}${client ? ` - ${client.company || client.name}` : ''}`;
  document.body.append(document_);
  window.addEventListener(
    'afterprint',
    () => {
      document_.remove();
      document.title = previousTitle;
    },
    { once: true },
  );
  window.print();
}
