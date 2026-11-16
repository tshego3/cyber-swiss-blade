import { el, type Child } from '../../core/dom';
import { formatDate, formatMoney } from '../../core/format';
import { clientAddress, depositAmount, documentTotals, invoiceBalance, lineAmount, paidAmount, paymentReference } from './data';
import { INVOICE_KIND_TITLES, type BusinessProfile, type Client, type Invoice, type PreparedBy, type PricedDocument, type Quote } from './types';

function lines(text: string): HTMLElement[] {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => el('span', { class: 'print-line', text: line }));
}

function block(label: string, children: readonly Child[]): HTMLElement {
  return el('section', { class: 'print-notes' }, [el('p', { class: 'print-label', text: label }), ...children]);
}

function party(label: string, title: string, details: readonly string[]): HTMLElement {
  return el('div', { class: 'print-party' }, [el('p', { class: 'print-label', text: label }), el('p', { class: 'print-strong', text: title }), ...details.filter(Boolean).flatMap(lines)]);
}

interface PrintSpec {
  readonly title: string;
  readonly number: string;
  readonly dates: readonly (readonly [string, string])[];
  readonly subject: string;
  readonly currency: string;
  readonly document: PricedDocument;
  readonly settlement: readonly (readonly [string, number])[];
  readonly notes: string;
  readonly terms: string;
  readonly preparer: PreparedBy;
}

function buildDocument(spec: PrintSpec, client: Client | undefined, profile: BusinessProfile): HTMLElement {
  const money = (amount: number): string => formatMoney(amount, spec.currency);
  const totals = documentTotals(spec.document);
  const hasUnits = spec.document.lines.some((line) => line.unit);
  const hasDiscounts = spec.document.lines.some((line) => line.discountPercent > 0);
  const headings = ['Description', 'Qty', hasUnits && 'Unit', 'Unit price', hasDiscounts && 'Disc %', 'Amount'].filter((heading): heading is string => typeof heading === 'string');
  const bank = [profile.bankName && `Bank: ${profile.bankName}`, profile.accountHolder && `Account holder: ${profile.accountHolder}`, profile.accountNumber && `Account number: ${profile.accountNumber}`, profile.branchCode && `Branch code: ${profile.branchCode}`].filter(Boolean);
  const reference = paymentReference(profile.paymentReference, spec.number, client);
  return el('article', { class: 'print-document' }, [
    el('header', { class: 'print-header' }, [
      el('div', { class: 'print-brand' }, [
        profile.logo && el('img', { class: 'print-logo', attrs: { src: profile.logo, alt: '' } }),
        party('From', profile.name || 'Your business', [profile.address, profile.email, profile.phone, profile.taxNumber && `VAT no. ${profile.taxNumber}`]),
      ]),
      el('div', { class: 'print-meta' }, [el('h1', { class: 'print-title', text: spec.title }), el('p', { class: 'print-number', text: spec.number }), ...spec.dates.map(([label, date]) => el('p', { text: `${label} ${formatDate(date, 'long')}` }))]),
    ]),
    party('Prepared for', client?.company || client?.name || 'Client', client ? [client.company ? client.name : '', ...clientAddress(client), client.email, client.phone, client.taxNumber && `VAT no. ${client.taxNumber}`] : []),
    spec.subject && el('h2', { class: 'print-subject', text: spec.subject }),
    el('table', { class: 'print-table' }, [
      el('thead', {}, [el('tr', {}, headings.map((heading) => el('th', { text: heading, attrs: { scope: 'col' } })))]),
      el(
        'tbody',
        {},
        spec.document.lines.map((line) =>
          el('tr', {}, [
            el('td', { text: line.description }),
            el('td', { text: String(line.quantity) }),
            hasUnits && el('td', { text: line.unit }),
            el('td', { text: money(line.unitPrice) }),
            hasDiscounts && el('td', { text: line.discountPercent ? `${line.discountPercent}%` : '' }),
            el('td', { text: money(lineAmount(line)) }),
          ]),
        ),
      ),
    ]),
    el('dl', { class: 'print-totals' }, [
      el('dt', { text: 'Subtotal' }),
      el('dd', { text: money(totals.subtotal) }),
      totals.discount > 0 && el('dt', { text: `Discount (${spec.document.discountPercent}%)` }),
      totals.discount > 0 && el('dd', { text: money(-totals.discount) }),
      el('dt', { text: `VAT (${spec.document.taxRate}%)` }),
      el('dd', { text: money(totals.tax) }),
      el('dt', { class: 'print-grand', text: 'Total' }),
      el('dd', { class: 'print-grand', text: money(totals.total) }),
      ...spec.settlement.flatMap(([label, amount]) => [el('dt', { text: label }), el('dd', { text: money(amount) })]),
    ]),
    bank.length > 0 && block('Banking details', [...bank.flatMap(lines), reference && el('span', { class: 'print-line', text: `Payment reference: ${reference}` })]),
    spec.notes && block('Notes', lines(spec.notes)),
    (spec.terms || profile.paymentTerms) && block('Terms and conditions', lines(spec.terms || profile.paymentTerms)),
    el('footer', { class: 'print-footer' }, [
      el('p', { text: 'Thank you for your business.' }),
      spec.preparer.preparedByName && el('p', { text: [`Prepared by ${spec.preparer.preparedByName}`, spec.preparer.preparedByEmail, spec.preparer.preparedByPhone].filter(Boolean).join(' · ') }),
    ]),
  ]);
}

function printElement(element: HTMLElement, title: string): void {
  const previousTitle = document.title;
  document.title = title;
  document.body.append(element);
  window.addEventListener(
    'afterprint',
    () => {
      element.remove();
      document.title = previousTitle;
    },
    { once: true },
  );
  window.print();
}

function fileTitle(number: string, client: Client | undefined): string {
  return `${number}${client ? ` - ${client.company || client.name}` : ''}`;
}

export function buildQuoteDocument(quote: Quote, client: Client | undefined, profile: BusinessProfile): HTMLElement {
  const deposit = depositAmount(quote);
  return buildDocument(
    {
      title: 'Quotation',
      number: quote.number,
      dates: [['Issued', quote.issueDate], ['Valid until', quote.validUntil], ...(quote.eventDate ? [['Event date', quote.eventDate] as const] : [])],
      subject: quote.title,
      currency: quote.currency,
      document: quote,
      settlement: deposit > 0 ? [[`Deposit due (${quote.depositPercent}%)`, deposit], ['Balance on completion', documentTotals(quote).total - deposit]] : [],
      notes: quote.notes,
      terms: quote.terms,
      preparer: quote,
    },
    client,
    profile,
  );
}

export function buildInvoiceDocument(invoice: Invoice, client: Client | undefined, profile: BusinessProfile): HTMLElement {
  const paid = paidAmount(invoice);
  return buildDocument(
    {
      title: INVOICE_KIND_TITLES[invoice.kind],
      number: invoice.number,
      dates: [['Issued', invoice.issueDate], ...(invoice.dueDate ? [['Due', invoice.dueDate] as const] : [])],
      subject: invoice.title,
      currency: invoice.currency,
      document: invoice,
      settlement: paid > 0 ? [['Paid', paid], ['Balance due', invoiceBalance(invoice)]] : [['Balance due', invoiceBalance(invoice)]],
      notes: invoice.notes,
      terms: invoice.terms,
      preparer: invoice,
    },
    client,
    profile,
  );
}

export function printQuote(quote: Quote, client: Client | undefined, profile: BusinessProfile): void {
  printElement(buildQuoteDocument(quote, client, profile), fileTitle(quote.number, client));
}

export function printInvoice(invoice: Invoice, client: Client | undefined, profile: BusinessProfile): void {
  printElement(buildInvoiceDocument(invoice, client, profile), fileTitle(invoice.number, client));
}
