import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { formatDate, formatMoney, roundMoney, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, emptyState, errorState, loadingState, segmented, type Option } from '../../core/ui';
import { clientLabel, clients, documentTotals, draftInvoice, filterInvoices, invoiceBalance, invoiceState, invoices, loadProfile } from './data';
import { quotationHeader, statusBadge } from './header';
import { INVOICE_STATE_LABELS, QUOTATION_COLLECTIONS, type Client, type Invoice, type InvoiceState } from './types';

type StateFilter = InvoiceState | 'all';

const FILTERS: readonly Option<StateFilter>[] = [
  { value: 'all', label: 'All' },
  ...(['draft', 'sent', 'overdue', 'partly-paid', 'paid', 'void'] as const).map((state) => ({ value: state, label: INVOICE_STATE_LABELS[state] })),
];

const STATE_BADGES: Readonly<Record<InvoiceState, string>> = { draft: 'draft', sent: 'sent', 'partly-paid': 'sent', overdue: 'expired', paid: 'accepted', void: 'declined' };

export function mountInvoices(root: HTMLElement, context: ModuleContext): Unmount {
  let list: readonly Entity<Invoice>[] = [];
  let clientList: readonly Entity<Client>[] = [];
  let search = '';
  let filter: StateFilter = 'all';
  let loaded = false;
  let failed = false;
  const results = el('div');

  const load = async (): Promise<void> => {
    try {
      [list, clientList] = await Promise.all([invoices.list(), clients.list()]);
      failed = false;
    } catch (error) {
      console.error('Invoices failed to load', error);
      failed = true;
    }
    loaded = true;
    render();
  };

  let creating = false;
  const create = async (): Promise<void> => {
    if (creating) return;
    creating = true;
    try {
      const invoice = await invoices.save(draftInvoice(await invoices.list(), await loadProfile(), context.user, new Date()));
      context.navigate(`invoices/${invoice.id}`);
    } finally {
      creating = false;
    }
  };

  const render = (): void => {
    if (!loaded) return replaceChildren(results, [loadingState('Loading invoices')]);
    if (failed) return replaceChildren(results, [errorState('Unable to load invoices.', () => void load())]);
    if (list.length === 0) {
      return replaceChildren(results, [emptyState({ icon: 'file', title: 'No invoices yet', text: 'Open an accepted quote and create a deposit or final invoice. Or start a blank invoice.' })]);
    }
    const today = toIsoDate(new Date());
    const names = new Map(clientList.map((client) => [client.id, clientLabel(client)]));
    const visible = filterInvoices(list, names, search, filter, today);
    const outstanding = new Map<string, number>();
    for (const invoice of list) {
      if (!['draft', 'void', 'paid'].includes(invoiceState(invoice, today))) outstanding.set(invoice.currency, roundMoney((outstanding.get(invoice.currency) ?? 0) + invoiceBalance(invoice)));
    }
    const outstandingText = outstanding.size === 0 ? formatMoney(0, list[0]?.currency ?? 'ZAR') : [...outstanding].map(([currency, amount]) => formatMoney(amount, currency)).join(' + ');
    replaceChildren(results, [
      el('p', { class: 'result-count muted', text: `${visible.length} of ${list.length} invoices · Outstanding ${outstandingText}` }),
      visible.length === 0
        ? el('p', { class: 'state muted', text: 'No invoices match your filters.' })
        : el(
            'ul',
            { class: 'quote-list' },
            visible.map((invoice) => {
              const state = invoiceState(invoice, today);
              return el('li', {}, [
                el('a', { class: 'quote-row', attrs: { href: `#/quotations/invoices/${encodeURIComponent(invoice.id)}` } }, [
                  el('span', { class: 'quote-number mono', text: invoice.number }),
                  el('span', { class: 'quote-main' }, [el('span', { class: 'quote-title', text: invoice.title || 'Untitled invoice' }), el('span', { class: 'muted', text: names.get(invoice.clientId) ?? 'No client' })]),
                  el('span', { class: 'quote-date muted', text: invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : formatDate(invoice.issueDate) }),
                  statusBadge(STATE_BADGES[state], INVOICE_STATE_LABELS[state]),
                  el('span', { class: 'quote-total mono', text: formatMoney(state === 'paid' || state === 'void' ? documentTotals(invoice).total : invoiceBalance(invoice), invoice.currency) }),
                ]),
              ]);
            }),
          ),
    ]);
  };

  const searchInput = el('input', { class: 'input', attrs: { type: 'search', placeholder: 'Search number, title, or client', 'aria-label': 'Search invoices' } });
  searchInput.addEventListener('input', () => {
    search = searchInput.value;
    render();
  });
  root.append(
    quotationHeader('invoices', context.canEdit ? [button({ label: 'New invoice', icon: 'plus', variant: 'primary', onClick: () => void create() })] : []),
    el('div', { class: 'toolbar' }, [
      searchInput,
      segmented('Status', FILTERS, filter, (value) => {
        filter = value;
        render();
      }),
    ]),
    results,
  );
  render();
  void load();
  const stop = onDataChange((collection) => {
    if (collection === QUOTATION_COLLECTIONS.invoices || collection === QUOTATION_COLLECTIONS.clients) void load();
  });
  return () => {
    stop();
    root.replaceChildren();
  };
}
