import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import { formatDate, formatMoney, toIsoDate } from '../../core/format';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, emptyState, errorState, loadingState, segmented, type Option } from '../../core/ui';
import { clientLabel, clients, documentTotals, draftQuote, filterQuotes, isExpired, loadProfile, quotes } from './data';
import { quotationHeader, statusBadge } from './header';
import { QUOTATION_COLLECTIONS, QUOTE_STATUSES, STATUS_LABELS, type Client, type Quote, type QuoteStatus } from './types';

type StatusFilter = QuoteStatus | 'all';

interface ListState {
  readonly quotes: readonly Entity<Quote>[];
  readonly clients: readonly Entity<Client>[];
  readonly search: string;
  readonly status: StatusFilter;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

const STATUS_OPTIONS: readonly Option<StatusFilter>[] = [{ value: 'all', label: 'All' }, ...QUOTE_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))];

export function mountQuoteList(root: HTMLElement, context: ModuleContext): Unmount {
  let state: ListState = { quotes: [], clients: [], search: '', status: 'all', isLoading: true, errorMessage: null };
  const results = el('div');

  const setState = (patch: Partial<ListState>): void => {
    state = { ...state, ...patch };
    render();
  };

  const load = async (): Promise<void> => {
    try {
      const [quoteList, clientList] = await Promise.all([quotes.list(), clients.list()]);
      setState({ quotes: quoteList, clients: clientList, isLoading: false, errorMessage: null });
    } catch (error) {
      console.error('Quotes failed to load', error);
      setState({ isLoading: false, errorMessage: 'Unable to load quotes.' });
    }
  };

  let creating = false;
  const createQuote = async (): Promise<void> => {
    if (creating) return;
    creating = true;
    try {
      const quote = await quotes.save(draftQuote(await quotes.list(), await loadProfile(), context.user, new Date()));
      context.navigate(quote.id);
    } finally {
      creating = false;
    }
  };

  const render = (): void => {
    if (state.isLoading) return replaceChildren(results, [loadingState('Loading quotes')]);
    if (state.errorMessage) return replaceChildren(results, [errorState(state.errorMessage, () => void load())]);
    if (state.quotes.length > 0) return replaceChildren(results, renderQuotes(state));
    replaceChildren(results, [
      emptyState({ icon: 'quote', title: 'No quotes yet', text: 'Create a quote, add line items, and print it to PDF.', action: context.canEdit ? button({ label: 'New quote', icon: 'plus', variant: 'primary', onClick: () => void createQuote() }) : undefined }),
    ]);
  };

  const search = el('input', { class: 'input', attrs: { type: 'search', placeholder: 'Search number, title, or client', 'aria-label': 'Search quotes' } });
  search.addEventListener('input', () => setState({ search: search.value }));
  root.append(
    quotationHeader('quotes', context.canEdit ? [button({ label: 'New quote', icon: 'plus', variant: 'primary', onClick: () => void createQuote() })] : []),
    el('div', { class: 'toolbar' }, [search, segmented('Status', STATUS_OPTIONS, state.status, (status) => setState({ status }))]),
    results,
  );
  render();
  void load();
  const stopListening = onDataChange((collection) => {
    if (Object.values<string>(QUOTATION_COLLECTIONS).includes(collection)) void load();
  });
  return () => {
    stopListening();
    root.replaceChildren();
  };
}

function renderQuotes(state: ListState): HTMLElement[] {
  const clientsById = new Map(state.clients.map((client) => [client.id, client]));
  const names = new Map(state.clients.map((client) => [client.id, clientLabel(client)]));
  const visible = filterQuotes(state.quotes, names, state.search, state.status);
  const today = toIsoDate(new Date());
  if (visible.length === 0) return [el('p', { class: 'state muted', text: 'No quotes match your filters.' })];
  return [
    el('p', { class: 'result-count muted', text: `${visible.length} of ${state.quotes.length} quotes` }),
    el(
      'ul',
      { class: 'quote-list' },
      visible.map((quote) => {
        const expired = isExpired(quote, today);
        return el('li', {}, [
          el('a', { class: 'quote-row', attrs: { href: `#/quotations/${encodeURIComponent(quote.id)}` } }, [
            el('span', { class: 'quote-number mono', text: quote.number }),
            el('span', { class: 'quote-main' }, [el('span', { class: 'quote-title', text: quote.title || 'Untitled quote' }), el('span', { class: 'muted', text: clientLabel(clientsById.get(quote.clientId)) })]),
            el('span', { class: 'quote-date muted', text: formatDate(quote.issueDate) }),
            expired ? statusBadge('expired', 'Expired') : statusBadge(quote.status, STATUS_LABELS[quote.status]),
            el('span', { class: 'quote-total mono', text: formatMoney(documentTotals(quote).total, quote.currency) }),
          ]),
        ]);
      }),
    ),
  ];
}
