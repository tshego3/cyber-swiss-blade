import { el, replaceChildren } from '../../core/dom';
import { formatMoney } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, field, loadingState, selectControl, toast } from '../../core/ui';
import { clientLabel, clients, createLine, duplicateQuote, lineAmount, loadProfile, quoteTotals, quotes } from './data';
import { statusBadge } from './header';
import { printQuote } from './print';
import { QUOTE_STATUSES, STATUS_LABELS, type BusinessProfile, type Client, type Quote, type QuoteLine, type QuoteStatus } from './types';

const SAVE_DELAY_MS = 500;
const LINE_LABELS: Readonly<Record<keyof QuoteLine, string>> = { id: 'Line', description: 'Description', quantity: 'Quantity', unitPrice: 'Unit price' };

interface Saver {
  readonly schedule: (save: () => Promise<void>) => void;
  readonly cancel: () => void;
}

interface EditorData {
  readonly quote: Entity<Quote>;
  readonly clients: readonly Entity<Client>[];
  readonly profile: BusinessProfile;
}

export function mountQuoteEditor(root: HTMLElement, context: ModuleContext, quoteId: string): Unmount {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingSave: (() => Promise<void>) | null = null;

  const flush = (): void => {
    clearTimeout(saveTimer);
    if (pendingSave) void pendingSave();
    pendingSave = null;
  };

  const saver: Saver = {
    schedule(save) {
      pendingSave = save;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flush, SAVE_DELAY_MS);
    },
    cancel() {
      clearTimeout(saveTimer);
      pendingSave = null;
    },
  };

  const load = async (): Promise<void> => {
    replaceChildren(root, [loadingState('Loading quote')]);
    try {
      const [quote, clientList, profile] = await Promise.all([quotes.get(quoteId), clients.list(), loadProfile()]);
      if (quote) renderEditor(root, context, { quote, clients: clientList, profile }, saver);
      else renderMissing(root);
    } catch (error) {
      console.error('Quote failed to load', error);
      replaceChildren(root, [errorState('Unable to load this quote.', () => void load())]);
    }
  };

  void load();
  return () => {
    flush();
    root.replaceChildren();
  };
}

function renderMissing(root: HTMLElement): void {
  const back = el('a', { class: 'button button-secondary', text: 'Back to quotes', attrs: { href: '#/quotations' } });
  replaceChildren(root, [emptyState({ icon: 'quote', title: 'Quote not found', text: 'It may have been deleted on another device.', action: back })]);
}

function renderEditor(root: HTMLElement, context: ModuleContext, data: EditorData, saver: Saver): void {
  let quote: Quote = data.quote;
  const saveStatus = el('span', { class: 'save-status muted', text: 'All changes saved', attrs: { role: 'status' } });
  const totals = el('dl', { class: 'totals' });
  const badge = el('span');
  const lines = el('ol', { class: 'lines' });
  const clientOptions = [{ value: '', label: 'Select a client' }, ...data.clients.map((client) => ({ value: client.id, label: clientLabel(client) }))];

  const save = async (): Promise<void> => {
    try {
      await quotes.save(quote, data.quote.id);
      saveStatus.textContent = 'All changes saved';
    } catch (error) {
      console.error('Quote failed to save', error);
      saveStatus.textContent = 'Save failed. Your edits are still on screen.';
    }
  };

  const update = (next: Quote): void => {
    quote = next;
    saveStatus.textContent = 'Saving…';
    renderSummary(quote, totals, badge);
    saver.schedule(save);
  };

  const renderLines = (): void => {
    replaceChildren(lines, quote.lines.map((line) => lineRow(line, quote.currency, (changed) => update({ ...quote, lines: replaceLine(quote.lines, changed) }), () => {
      update({ ...quote, lines: quote.lines.filter((item) => item.id !== line.id) });
      renderLines();
    })));
  };

  const form = el('form', { class: 'editor', attrs: { novalidate: true, 'aria-label': `Quote ${quote.number}` } }, [
    el('div', { class: 'editor-main stack-lg' }, [
      el('section', { class: 'card stack' }, [
        el('h2', { class: 'section-title', text: 'Details' }),
        field('Client', selectControl('clientId', clientOptions, quote.clientId), data.clients.length === 0 ? 'Add clients in the Clients tab.' : undefined),
        field('Title', el('input', { class: 'input', attrs: { name: 'title', value: quote.title, placeholder: 'Website rebuild', maxlength: 120 } })),
        el('div', { class: 'grid-2' }, [
          field('Issue date', el('input', { class: 'input', attrs: { name: 'issueDate', type: 'date', value: quote.issueDate } })),
          field('Valid until', el('input', { class: 'input', attrs: { name: 'validUntil', type: 'date', value: quote.validUntil } })),
        ]),
      ]),
      el('section', { class: 'card stack' }, [
        el('div', { class: 'lines-head' }, [el('h2', { class: 'section-title', text: 'Line items' }), el('span', { class: 'muted', text: 'Qty × unit price' })]),
        lines,
        button({ label: 'Add line', icon: 'plus', variant: 'ghost', onClick: () => {
          update({ ...quote, lines: [...quote.lines, createLine()] });
          renderLines();
          lines.querySelector<HTMLInputElement>('li:last-child [data-field="description"]')?.focus();
        } }),
      ]),
      el('section', { class: 'card stack' }, [field('Notes', el('textarea', { class: 'input', text: quote.notes, attrs: { name: 'notes', rows: 4, placeholder: 'Scope, assumptions, payment terms…' } }))]),
    ]),
    el('aside', { class: 'editor-aside' }, [
      el('section', { class: 'card stack summary-card' }, [
        el('div', { class: 'summary-head' }, [el('h2', { class: 'section-title', text: 'Summary' }), badge]),
        field('Status', selectControl<QuoteStatus>('status', QUOTE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })), quote.status)),
        el('div', { class: 'grid-2' }, [
          field('Currency', el('input', { class: 'input mono', attrs: { name: 'currency', value: quote.currency, maxlength: 3, pattern: '[A-Za-z]{3}' } })),
          field('Tax %', el('input', { class: 'input mono', attrs: { name: 'taxRate', type: 'number', min: 0, max: 100, step: '0.01', value: quote.taxRate } })),
        ]),
        totals,
        saveStatus,
      ]),
    ]),
  ]);

  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('.lines')) return;
    const next = readHeader(form, quote);
    const currencyChanged = next.currency !== quote.currency;
    update(next);
    if (currencyChanged) renderLines();
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  const actions = [
    button({ label: 'Duplicate', icon: 'copy', onClick: (event) => void duplicate(context, quote, event.currentTarget) }),
    button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void remove(context, saver, data.quote.id, quote.number) }),
    button({ label: 'Print / PDF', icon: 'printer', variant: 'primary', onClick: () => printQuote(quote, data.clients.find((client) => client.id === quote.clientId), data.profile) }),
  ];
  replaceChildren(root, [
    el('a', { class: 'back-link', attrs: { href: '#/quotations' } }, ['← All quotes']),
    el('header', { class: 'page-header' }, [el('div', { class: 'page-heading' }, [el('h1', { class: 'page-title mono', text: quote.number })]), el('div', { class: 'page-actions' }, actions)]),
    form,
  ]);
  renderLines();
  renderSummary(quote, totals, badge);
}

function lineRow(line: QuoteLine, currency: string, onChange: (line: QuoteLine) => void, onRemove: () => void): HTMLLIElement {
  const amount = el('span', { class: 'line-amount mono', text: formatMoney(lineAmount(line), currency) });
  const input = (name: keyof QuoteLine, attrs: Readonly<Record<string, string | number>>): HTMLInputElement =>
    el('input', { class: `input${name === 'description' ? '' : ' mono'}`, attrs: { 'data-field': name, 'aria-label': LINE_LABELS[name], ...attrs } });
  const description = input('description', { value: line.description, placeholder: 'Describe the work' });
  const quantity = input('quantity', { type: 'number', min: 0, step: 'any', value: line.quantity });
  const unitPrice = input('unitPrice', { type: 'number', min: 0, step: '0.01', value: line.unitPrice });
  const row = el('li', { class: 'line-row' }, [description, quantity, unitPrice, amount, button({ label: 'Remove line', icon: 'close', iconOnly: true, variant: 'ghost', onClick: onRemove })]);
  row.addEventListener('input', () => {
    const changed: QuoteLine = { id: line.id, description: description.value, quantity: Number(quantity.value) || 0, unitPrice: Number(unitPrice.value) || 0 };
    amount.textContent = formatMoney(lineAmount(changed), currency);
    onChange(changed);
  });
  return row;
}

function readHeader(form: HTMLFormElement, quote: Quote): Quote {
  const value = (name: string): string => {
    const element = form.elements.namedItem(name);
    return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement ? element.value : '';
  };
  const status = QUOTE_STATUSES.find((candidate) => candidate === value('status')) ?? quote.status;
  const currency = /^[A-Za-z]{3}$/.test(value('currency')) ? value('currency').toUpperCase() : quote.currency;
  return { ...quote, clientId: value('clientId'), title: value('title'), issueDate: value('issueDate'), validUntil: value('validUntil'), notes: value('notes'), status, currency, taxRate: Number(value('taxRate')) || 0 };
}

function replaceLine(lines: readonly QuoteLine[], changed: QuoteLine): QuoteLine[] {
  return lines.map((line) => (line.id === changed.id ? changed : line));
}

function renderSummary(quote: Quote, totals: HTMLElement, badge: HTMLElement): void {
  const { subtotal, tax, total } = quoteTotals(quote);
  const row = (label: string, amount: number, strong = false): HTMLElement =>
    el('div', { class: `total-row${strong ? ' is-total' : ''}` }, [el('dt', { text: label }), el('dd', { class: 'mono', text: formatMoney(amount, quote.currency) })]);
  replaceChildren(totals, [row('Subtotal', subtotal), row(`Tax (${quote.taxRate}%)`, tax), row('Total', total, true)]);
  replaceChildren(badge, [statusBadge(quote.status, STATUS_LABELS[quote.status])]);
}

async function duplicate(context: ModuleContext, quote: Quote, trigger: EventTarget | null): Promise<void> {
  if (trigger instanceof HTMLButtonElement) trigger.disabled = true;
  const copy = await quotes.save(duplicateQuote(quote, await quotes.list(), new Date()));
  toast(`Created ${copy.number}`, 'success');
  context.navigate(copy.id);
}

async function remove(context: ModuleContext, saver: Saver, id: string, number: string): Promise<void> {
  if (!(await confirmAction('Delete quote', `Delete ${number}? This cannot be undone.`, 'Delete'))) return;
  saver.cancel();
  await quotes.remove(id);
  context.navigate('');
}
