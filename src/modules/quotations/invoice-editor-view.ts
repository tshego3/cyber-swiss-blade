import { el, replaceChildren } from '../../core/dom';
import { formatDate, formatMoney, newId, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, field, formValue, loadingState, openFormDialog, selectControl, toast } from '../../core/ui';
import { catalogue, clientLabel, clients, invoiceBalance, invoiceState, invoices, loadProfile, paidAmount, quotes } from './data';
import { createAutosave, linesEditor, readNumber, readText, renderTotals } from './document-parts';
import { statusBadge } from './header';
import { printInvoice } from './print';
import { INVOICE_KIND_TITLES, INVOICE_STATE_LABELS, INVOICE_STATUSES, type BusinessProfile, type CatalogueItem, type Client, type Invoice, type Payment } from './types';

const SAVE_DELAY_MS = 500;
const METHODS = ['EFT', 'Cash', 'Card', 'Other'] as const;
const STATUS_TEXT: Readonly<Record<Invoice['status'], string>> = { draft: 'Draft', sent: 'Sent', paid: 'Paid', void: 'Void' };

interface InvoiceData {
  readonly invoice: Entity<Invoice>;
  readonly clients: readonly Entity<Client>[];
  readonly catalogue: readonly Entity<CatalogueItem>[];
  readonly profile: BusinessProfile;
  readonly quoteNumber: string;
}

export function mountInvoiceEditor(root: HTMLElement, context: ModuleContext, invoiceId: string): Unmount {
  const saver = createAutosave(SAVE_DELAY_MS);
  const load = async (): Promise<void> => {
    replaceChildren(root, [loadingState('Loading invoice')]);
    try {
      const [invoice, clientList, items, profile] = await Promise.all([invoices.get(invoiceId), clients.list(), catalogue.list(), loadProfile()]);
      if (!invoice) {
        const back = el('a', { class: 'button button-secondary', text: 'Back to invoices', attrs: { href: '#/quotations/invoices' } });
        replaceChildren(root, [emptyState({ icon: 'file', title: 'Invoice not found', text: 'It may have been deleted on another device.', action: back })]);
        return;
      }
      const quote = invoice.quoteId ? await quotes.get(invoice.quoteId) : undefined;
      renderEditor(root, context, { invoice, clients: clientList, catalogue: items, profile, quoteNumber: quote?.number ?? '' }, saver);
    } catch (error) {
      console.error('Invoice failed to load', error);
      replaceChildren(root, [errorState('Unable to load this invoice.', () => void load())]);
    }
  };
  void load();
  return () => {
    saver.flush();
    root.replaceChildren();
  };
}

function renderEditor(root: HTMLElement, context: ModuleContext, data: InvoiceData, saver: ReturnType<typeof createAutosave>): void {
  const disabled = !context.canEdit;
  let invoice: Invoice = data.invoice;
  const saveStatus = el('span', { class: 'save-status muted', text: disabled ? 'Read-only' : 'All changes saved', attrs: { role: 'status' } });
  const totals = el('dl', { class: 'totals' });
  const badge = el('span');
  const payments = el('div', { class: 'stack' });

  const save = async (): Promise<void> => {
    try {
      await invoices.save(invoice, data.invoice.id);
      saveStatus.textContent = 'All changes saved';
    } catch (error) {
      console.error('Invoice failed to save', error);
      saveStatus.textContent = 'Save failed. Your edits are still on screen.';
    }
  };

  const summarize = (): void => {
    const state = invoiceState(invoice, toIsoDate(new Date()));
    renderTotals(totals, invoice, invoice.currency, [
      ['Paid', paidAmount(invoice)],
      ['Balance due', invoiceBalance(invoice)],
    ]);
    replaceChildren(badge, [statusBadge(state === 'paid' ? 'accepted' : state === 'overdue' || state === 'void' ? 'declined' : state === 'draft' ? 'draft' : 'sent', INVOICE_STATE_LABELS[state])]);
    renderPayments();
  };

  const update = (next: Invoice, saveNow = false): void => {
    invoice = next;
    saveStatus.textContent = 'Saving…';
    summarize();
    saver.schedule(save);
    if (saveNow) saver.flush();
  };

  const renderPayments = (): void => {
    replaceChildren(payments, [
      invoice.payments.length === 0
        ? el('p', { class: 'muted small', text: 'No payments recorded.' })
        : el(
            'ul',
            { class: 'stack payment-list' },
            invoice.payments.map((payment) =>
              el('li', { class: 'payment-row' }, [
                el('span', { text: formatDate(payment.date) }),
                el('span', { class: 'muted', text: [payment.method, payment.reference].filter(Boolean).join(' · ') }),
                el('span', { class: 'mono', text: formatMoney(payment.amount, invoice.currency) }),
                !disabled && button({ label: 'Remove payment', icon: 'close', iconOnly: true, variant: 'ghost', onClick: () => update({ ...invoice, payments: invoice.payments.filter((item) => item.id !== payment.id) }, true) }),
              ]),
            ),
          ),
      !disabled &&
        button({ label: 'Record payment', icon: 'plus', variant: 'ghost', onClick: () => openPaymentDialog(invoice, (payment) => {
          const status = invoice.status === 'draft' ? 'sent' : invoice.status;
          const statusSelect = root.querySelector<HTMLSelectElement>('select[name=status]');
          if (statusSelect) statusSelect.value = status;
          update({ ...invoice, status, payments: [...invoice.payments, payment] }, true);
        }) }),
    ]);
  };

  const lines = linesEditor({ lines: invoice.lines, currency: invoice.currency, catalogue: data.catalogue, disabled, onChange: (changed) => update({ ...invoice, lines: changed }) });
  const clientOptions = [{ value: '', label: 'Select a client' }, ...data.clients.map((client) => ({ value: client.id, label: clientLabel(client) }))];
  const input = (name: string, attrs: Readonly<Record<string, string | number | boolean>>): HTMLInputElement => el('input', { class: 'input', attrs: { name, disabled, ...attrs } });
  const select = (control: HTMLSelectElement): HTMLSelectElement => {
    control.disabled = disabled;
    return control;
  };

  const form = el('form', { class: 'editor', attrs: { novalidate: true, 'aria-label': `Invoice ${invoice.number}` } }, [
    el('div', { class: 'editor-main stack-lg' }, [
      el('section', { class: 'card stack' }, [
        el('h2', { class: 'section-title', text: INVOICE_KIND_TITLES[invoice.kind] }),
        data.quoteNumber && el('p', { class: 'muted small' }, ['From quotation ', el('a', { class: 'mono', text: data.quoteNumber, attrs: { href: `#/quotations/${data.invoice.quoteId}` } })]),
        field('Client', select(selectControl('clientId', clientOptions, invoice.clientId))),
        field('Title', input('title', { value: invoice.title, maxlength: 120 })),
        el('div', { class: 'grid-2' }, [field('Issue date', input('issueDate', { type: 'date', value: invoice.issueDate })), field('Due date', input('dueDate', { type: 'date', value: invoice.dueDate }))]),
      ]),
      lines.element,
      el('section', { class: 'card stack' }, [
        field('Notes', el('textarea', { class: 'input', text: invoice.notes, attrs: { name: 'notes', rows: 3, disabled } })),
        field('Terms and conditions', el('textarea', { class: 'input', text: invoice.terms, attrs: { name: 'terms', rows: 4, disabled } })),
      ]),
    ]),
    el('aside', { class: 'editor-aside' }, [
      el('section', { class: 'card stack summary-card' }, [
        el('div', { class: 'summary-head' }, [el('h2', { class: 'section-title', text: 'Summary' }), badge]),
        field('Status', select(selectControl('status', INVOICE_STATUSES.map((status) => ({ value: status, label: STATUS_TEXT[status] })), invoice.status)), 'Overdue and partly paid follow from the due date and payments.'),
        el('div', { class: 'grid-2 grid-keep' }, [
          field('Currency', el('input', { class: 'input mono', attrs: { name: 'currency', value: invoice.currency, maxlength: 3, pattern: '[A-Za-z]{3}', disabled } })),
          field('VAT %', input('taxRate', { type: 'number', min: 0, max: 100, step: '0.01', value: invoice.taxRate })),
        ]),
        field('Discount %', input('discountPercent', { type: 'number', min: 0, max: 100, step: '0.01', value: invoice.discountPercent })),
        totals,
        saveStatus,
      ]),
      el('section', { class: 'card stack' }, [el('h2', { class: 'section-title', text: 'Payments' }), payments]),
    ]),
  ]);

  form.addEventListener('input', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('.lines, .catalogue-picker')) return;
    const currency = /^[A-Za-z]{3}$/.test(readText(form, 'currency')) ? readText(form, 'currency').toUpperCase() : invoice.currency;
    const currencyChanged = currency !== invoice.currency;
    update({
      ...invoice,
      clientId: readText(form, 'clientId'),
      title: readText(form, 'title'),
      issueDate: readText(form, 'issueDate'),
      dueDate: readText(form, 'dueDate'),
      notes: readText(form, 'notes'),
      terms: readText(form, 'terms'),
      status: INVOICE_STATUSES.find((status) => status === readText(form, 'status')) ?? invoice.status,
      currency,
      taxRate: readNumber(form, 'taxRate', invoice.taxRate),
      discountPercent: readNumber(form, 'discountPercent', invoice.discountPercent),
    });
    if (currencyChanged) lines.setCurrency(currency);
  });
  form.addEventListener('submit', (event) => event.preventDefault());

  const remove = async (): Promise<void> => {
    if (!(await confirmAction('Delete invoice', `Delete ${invoice.number}? To keep a record, set the status to Void instead.`, 'Delete'))) return;
    saver.cancel();
    await invoices.remove(data.invoice.id);
    context.navigate('invoices');
  };
  const actions = [
    !disabled && button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void remove() }),
    button({ label: 'Print / PDF', icon: 'printer', variant: 'primary', onClick: () => printInvoice(invoice, data.clients.find((client) => client.id === invoice.clientId), data.profile) }),
  ];
  replaceChildren(root, [
    el('a', { class: 'back-link', attrs: { href: '#/quotations/invoices' } }, ['← All invoices']),
    el('header', { class: 'page-header' }, [el('div', { class: 'page-heading' }, [el('h1', { class: 'page-title mono', text: invoice.number })]), el('div', { class: 'page-actions' }, actions)]),
    form,
  ]);
  summarize();
}

function openPaymentDialog(invoice: Invoice, onAdd: (payment: Payment) => void): void {
  openFormDialog({
    title: 'Record payment',
    submitLabel: 'Add payment',
    body: [
      el('div', { class: 'grid-2' }, [
        field('Date', el('input', { class: 'input', attrs: { name: 'date', type: 'date', required: true, value: toIsoDate(new Date()) } })),
        field('Amount', el('input', { class: 'input mono', attrs: { name: 'amount', type: 'number', step: '0.01', min: '0.01', required: true, value: Math.max(invoiceBalance(invoice), 0) } })),
      ]),
      el('div', { class: 'grid-2' }, [
        field('Method', selectControl('method', METHODS.map((method) => ({ value: method, label: method })), 'EFT')),
        field('Reference', el('input', { class: 'input', attrs: { name: 'reference', maxlength: 80 } })),
      ]),
    ],
    onSubmit: (form) => {
      const amount = Number(formValue(form, 'amount'));
      if (!Number.isFinite(amount) || amount <= 0) {
        toast('Enter an amount above zero.', 'error');
        return false;
      }
      onAdd({ id: newId(), date: formValue(form, 'date'), amount: Math.round(amount * 100) / 100, method: formValue(form, 'method'), reference: formValue(form, 'reference') });
      toast('Payment recorded', 'success');
      return true;
    },
  });
}
