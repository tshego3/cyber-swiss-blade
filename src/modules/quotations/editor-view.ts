import { el, replaceChildren } from '../../core/dom';
import { formatMoney } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, field, loadingState, selectControl, toast } from '../../core/ui';
import {
  BRIEF_TEMPLATES,
  catalogue,
  clientLabel,
  clients,
  depositAmount,
  depositInvoice,
  documentTotals,
  duplicateQuote,
  finalInvoice,
  invoices,
  loadProfile,
  preparedBy,
  quotes,
} from './data';
import { createAutosave, linesEditor, readChecked, readNumber, readText, renderTotals } from './document-parts';
import { statusBadge } from './header';
import { printQuote } from './print';
import { QUOTE_STATUSES, STATUS_LABELS, type BusinessProfile, type CatalogueItem, type Client, type Invoice, type Quote } from './types';

const SAVE_DELAY_MS = 500;

interface EditorData {
  readonly quote: Entity<Quote>;
  readonly clients: readonly Entity<Client>[];
  readonly catalogue: readonly Entity<CatalogueItem>[];
  readonly invoices: readonly Entity<Invoice>[];
  readonly profile: BusinessProfile;
}

export function mountQuoteEditor(root: HTMLElement, context: ModuleContext, quoteId: string): Unmount {
  const saver = createAutosave(SAVE_DELAY_MS);
  const load = async (): Promise<void> => {
    replaceChildren(root, [loadingState('Loading quote')]);
    try {
      const [quote, clientList, items, invoiceList, profile] = await Promise.all([quotes.get(quoteId), clients.list(), catalogue.list(), invoices.list(), loadProfile()]);
      if (!quote) return renderMissing(root);
      renderEditor(root, context, { quote, clients: clientList, catalogue: items, invoices: invoiceList, profile }, saver);
    } catch (error) {
      console.error('Quote failed to load', error);
      replaceChildren(root, [errorState('Unable to load this quote.', () => void load())]);
    }
  };
  void load();
  return () => {
    saver.flush();
    root.replaceChildren();
  };
}

function renderMissing(root: HTMLElement): void {
  const back = el('a', { class: 'button button-secondary', text: 'Back to quotes', attrs: { href: '#/quotations' } });
  replaceChildren(root, [emptyState({ icon: 'quote', title: 'Quote not found', text: 'It may have been deleted on another device.', action: back })]);
}

function renderEditor(root: HTMLElement, context: ModuleContext, data: EditorData, saver: ReturnType<typeof createAutosave>): void {
  const disabled = !context.canEdit;
  let quote: Quote = data.quote;
  const saveStatus = el('span', { class: 'save-status muted', text: disabled ? 'Read-only' : 'All changes saved', attrs: { role: 'status' } });
  const totals = el('dl', { class: 'totals' });
  const badge = el('span');

  const save = async (): Promise<void> => {
    try {
      await quotes.save(quote, data.quote.id);
      saveStatus.textContent = 'All changes saved';
    } catch (error) {
      console.error('Quote failed to save', error);
      saveStatus.textContent = 'Save failed. Your edits are still on screen.';
    }
  };

  const summarize = (): void => {
    const deposit = depositAmount(quote);
    renderTotals(totals, quote, quote.currency, deposit > 0 ? [[`Deposit (${quote.depositPercent}%)`, deposit]] : []);
    replaceChildren(badge, [statusBadge(quote.status, STATUS_LABELS[quote.status])]);
  };

  const update = (next: Quote): void => {
    quote = next;
    saveStatus.textContent = 'Saving…';
    summarize();
    saver.schedule(save);
  };

  // Goes through the autosaver so that a pending edit cannot later overwrite the new status.
  const markInvoiced = (): void => {
    const statusSelect = root.querySelector<HTMLSelectElement>('select[name=status]');
    if (statusSelect) statusSelect.value = 'invoiced';
    update({ ...quote, status: 'invoiced' });
    saver.flush();
  };

  const lines = linesEditor({ lines: quote.lines, currency: quote.currency, catalogue: data.catalogue, disabled, onChange: (changed) => update({ ...quote, lines: changed }) });
  const clientOptions = [{ value: '', label: 'Select a client' }, ...data.clients.map((client) => ({ value: client.id, label: clientLabel(client) }))];
  const input = (name: string, attrs: Readonly<Record<string, string | number | boolean>>): HTMLInputElement => el('input', { class: 'input', attrs: { name, disabled, ...attrs } });
  const brief = el('textarea', { class: 'input', text: quote.brief, attrs: { name: 'brief', rows: 6, disabled, placeholder: 'Questions to ask the client before the work starts.' } });
  const addBrief = (kind: keyof typeof BRIEF_TEMPLATES): void => {
    brief.value = [brief.value.trim(), BRIEF_TEMPLATES[kind]].filter(Boolean).join('\n\n');
    brief.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const form = el('form', { class: 'editor', attrs: { novalidate: true, 'aria-label': `Quote ${quote.number}` } }, [
    el('div', { class: 'editor-main stack-lg' }, [
      el('section', { class: 'card stack' }, [
        el('h2', { class: 'section-title', text: 'Details' }),
        field('Client', withDisabled(selectControl('clientId', clientOptions, quote.clientId), disabled), data.clients.length === 0 ? 'Add clients in the Clients tab.' : undefined),
        field('Title', input('title', { value: quote.title, placeholder: 'Event video', maxlength: 120 })),
        el('div', { class: 'grid-2' }, [field('Issue date', input('issueDate', { type: 'date', value: quote.issueDate })), field('Valid until', input('validUntil', { type: 'date', value: quote.validUntil }))]),
        el('div', { class: 'grid-2' }, [
          field('Event or booking date', input('eventDate', { type: 'date', value: quote.eventDate }), 'Optional. The deposit invoice is due the day before.'),
          el('label', { class: 'check booking-check' }, [input('bookingConfirmed', { type: 'checkbox', checked: quote.bookingConfirmed }), el('span', { text: 'Booking confirmed' })]),
        ]),
      ]),
      lines.element,
      el('section', { class: 'card stack' }, [
        field('Notes', el('textarea', { class: 'input', text: quote.notes, attrs: { name: 'notes', rows: 3, disabled, placeholder: 'Scope and assumptions. Printed on the quote.' } })),
        field('Terms and conditions', el('textarea', { class: 'input', text: quote.terms, attrs: { name: 'terms', rows: 4, disabled } }), 'The default comes from the Business profile.'),
      ]),
      el('section', { class: 'card stack' }, [
        el('div', { class: 'lines-head' }, [
          el('h2', { class: 'section-title', text: 'Client brief' }),
          !disabled && el('div', { class: 'row' }, [button({ label: 'Photo questions', variant: 'ghost', onClick: () => addBrief('photo') }), button({ label: 'Video questions', variant: 'ghost', onClick: () => addBrief('video') })]),
        ]),
        brief,
        el('p', { class: 'field-hint', text: 'Internal. Not printed on the quote.' }),
      ]),
    ]),
    el('aside', { class: 'editor-aside' }, [
      el('section', { class: 'card stack summary-card' }, [
        el('div', { class: 'summary-head' }, [el('h2', { class: 'section-title', text: 'Summary' }), badge]),
        field('Status', withDisabled(selectControl('status', QUOTE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })), quote.status), disabled)),
        el('div', { class: 'grid-2 grid-keep' }, [
          field('Currency', el('input', { class: 'input mono', attrs: { name: 'currency', value: quote.currency, maxlength: 3, pattern: '[A-Za-z]{3}', disabled } })),
          field('VAT %', input('taxRate', { type: 'number', min: 0, max: 100, step: '0.01', value: quote.taxRate })),
        ]),
        el('div', { class: 'grid-2 grid-keep' }, [
          field('Discount %', input('discountPercent', { type: 'number', min: 0, max: 100, step: '0.01', value: quote.discountPercent })),
          field('Deposit %', input('depositPercent', { type: 'number', min: 0, max: 100, step: '1', value: quote.depositPercent })),
        ]),
        totals,
        saveStatus,
        quote.preparedByName && el('p', { class: 'muted small', text: `Prepared by ${quote.preparedByName}` }),
      ]),
      !disabled && invoicePanel(context, data, () => quote, markInvoiced),
    ]),
  ]);

  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('.lines, .catalogue-picker')) return;
    const currency = /^[A-Za-z]{3}$/.test(readText(form, 'currency')) ? readText(form, 'currency').toUpperCase() : quote.currency;
    const currencyChanged = currency !== quote.currency;
    update({
      ...quote,
      clientId: readText(form, 'clientId'),
      title: readText(form, 'title'),
      issueDate: readText(form, 'issueDate'),
      validUntil: readText(form, 'validUntil'),
      eventDate: readText(form, 'eventDate'),
      bookingConfirmed: readChecked(form, 'bookingConfirmed'),
      notes: readText(form, 'notes'),
      terms: readText(form, 'terms'),
      brief: readText(form, 'brief'),
      status: QUOTE_STATUSES.find((status) => status === readText(form, 'status')) ?? quote.status,
      currency,
      taxRate: readNumber(form, 'taxRate', quote.taxRate),
      discountPercent: readNumber(form, 'discountPercent', quote.discountPercent),
      depositPercent: readNumber(form, 'depositPercent', quote.depositPercent),
    });
    if (currencyChanged) lines.setCurrency(currency);
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  const client = (): Client | undefined => data.clients.find((candidate) => candidate.id === quote.clientId);
  const actions = [
    !disabled && button({ label: 'Duplicate', icon: 'copy', onClick: (event) => void duplicate(context, quote, data.profile, event.currentTarget) }),
    !disabled && button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void remove(context, saver.cancel, data.quote.id, quote.number) }),
    button({ label: 'Print / PDF', icon: 'printer', variant: 'primary', onClick: () => printQuote(quote, client(), data.profile) }),
  ];
  replaceChildren(root, [
    el('a', { class: 'back-link', attrs: { href: '#/quotations' } }, ['← All quotes']),
    el('header', { class: 'page-header' }, [el('div', { class: 'page-heading' }, [el('h1', { class: 'page-title mono', text: quote.number })]), el('div', { class: 'page-actions' }, actions)]),
    form,
  ]);
  summarize();
}

function invoicePanel(context: ModuleContext, data: EditorData, current: () => Quote, markInvoiced: () => void): HTMLElement {
  const related = data.invoices.filter((invoice) => invoice.quoteId === data.quote.id);
  let creating = false;
  const create = async (kind: 'deposit' | 'final'): Promise<void> => {
    if (creating) return;
    creating = true;
    try {
      const quote: Entity<Quote> = { ...data.quote, ...current() };
      const existing = await invoices.list();
      const invoice = kind === 'deposit' ? depositInvoice(quote, existing, data.profile, context.user, new Date()) : finalInvoice(quote, existing, data.profile, context.user, new Date());
      const saved = await invoices.save(invoice);
      if (kind === 'final') markInvoiced();
      toast(`Created ${saved.number}`, 'success');
      context.navigate(`invoices/${saved.id}`);
    } finally {
      creating = false;
    }
  };
  const hasDeposit = related.some((invoice) => invoice.kind === 'deposit' && invoice.status !== 'void');
  return el('section', { class: 'card stack' }, [
    el('h2', { class: 'section-title', text: 'Invoices' }),
    related.length === 0
      ? el('p', { class: 'muted small', text: 'No invoices yet.' })
      : el(
          'ul',
          { class: 'stack related-invoices' },
          related.map((invoice) => el('li', {}, [el('a', { class: 'mono', text: invoice.number, attrs: { href: `#/quotations/invoices/${invoice.id}` } }), el('span', { class: 'muted small', text: ` ${formatMoney(documentTotals(invoice).total, invoice.currency)}` })])),
        ),
    el('div', { class: 'row' }, [
      !hasDeposit && current().depositPercent > 0 && button({ label: 'Deposit invoice', icon: 'plus', onClick: () => void create('deposit') }),
      button({ label: hasDeposit ? 'Final invoice' : 'Invoice in full', icon: 'plus', onClick: () => void create('final') }),
    ]),
  ]);
}

function withDisabled<T extends HTMLSelectElement>(select: T, disabled: boolean): T {
  select.disabled = disabled;
  return select;
}

async function duplicate(context: ModuleContext, quote: Quote, profile: BusinessProfile, trigger: EventTarget | null): Promise<void> {
  if (trigger instanceof HTMLButtonElement) trigger.disabled = true;
  const copy = await quotes.save(duplicateQuote({ ...quote, ...preparedBy(context.user) }, await quotes.list(), profile, context.user, new Date()));
  toast(`Created ${copy.number}`, 'success');
  context.navigate(copy.id);
}

async function remove(context: ModuleContext, cancelSave: () => void, id: string, number: string): Promise<void> {
  if (!(await confirmAction('Delete quote', `Delete ${number}? This cannot be undone.`, 'Delete'))) return;
  cancelSave();
  await quotes.remove(id);
  context.navigate('');
}
