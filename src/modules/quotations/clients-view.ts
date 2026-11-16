import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import type { Entity } from '../../core/repository';
import type { Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, field, formValue, loadingState, openFormDialog, toast } from '../../core/ui';
import { clients, quotes } from './data';
import { quotationHeader } from './header';
import { QUOTATION_COLLECTIONS, type Client, type Quote } from './types';

interface ClientsState {
  readonly clients: readonly Entity<Client>[];
  readonly quotes: readonly Entity<Quote>[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export function mountClients(root: HTMLElement): Unmount {
  let state: ClientsState = { clients: [], quotes: [], isLoading: true, errorMessage: null };
  const content = el('div');

  const load = async (): Promise<void> => {
    try {
      const [clientList, quoteList] = await Promise.all([clients.list(), quotes.list()]);
      state = { clients: clientList, quotes: quoteList, isLoading: false, errorMessage: null };
    } catch (error) {
      console.error('Clients failed to load', error);
      state = { ...state, isLoading: false, errorMessage: 'Unable to load clients.' };
    }
    render();
  };

  const render = (): void => {
    if (state.isLoading) return replaceChildren(content, [loadingState('Loading clients')]);
    if (state.errorMessage) return replaceChildren(content, [errorState(state.errorMessage, () => void load())]);
    if (state.clients.length > 0) {
      const sorted = [...state.clients].sort((a, b) => a.name.localeCompare(b.name));
      return replaceChildren(content, [el('ul', { class: 'card-grid' }, sorted.map((client) => clientCard(client, state.quotes.filter((quote) => quote.clientId === client.id).length)))]);
    }
    replaceChildren(content, [emptyState({ icon: 'users', title: 'No clients yet', text: 'Clients appear on your quotes as the billing party.' })]);
  };

  root.append(quotationHeader('clients', [button({ label: 'New client', icon: 'plus', variant: 'primary', onClick: () => openClientDialog() })]), content);
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

function clientCard(client: Entity<Client>, quoteCount: number): HTMLLIElement {
  return el('li', { class: 'card item-card' }, [
    el('div', {}, [el('h2', { class: 'item-name', text: client.company || client.name }), el('p', { class: 'muted', text: client.company ? client.name : client.email || 'No email' })]),
    el('p', { class: 'muted small', text: `${quoteCount} quote${quoteCount === 1 ? '' : 's'}` }),
    el('div', { class: 'row' }, [
      button({ label: 'Edit', icon: 'edit', variant: 'ghost', onClick: () => openClientDialog(client) }),
      button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void deleteClient(client, quoteCount) }),
    ]),
  ]);
}

function openClientDialog(client?: Entity<Client>): void {
  const input = (name: keyof Client, attrs: Readonly<Record<string, string | boolean>> = {}): HTMLInputElement =>
    el('input', { class: 'input', attrs: { name, value: client?.[name] ?? '', autocomplete: 'off', maxlength: 120, ...attrs } });
  openFormDialog({
    title: client ? 'Edit client' : 'New client',
    submitLabel: client ? 'Save' : 'Add client',
    body: [
      el('div', { class: 'grid-2' }, [field('Contact name', input('name', { required: true })), field('Company', input('company'))]),
      el('div', { class: 'grid-2' }, [field('Email', input('email', { type: 'email' })), field('Phone', input('phone', { type: 'tel' }))]),
      field('Address', el('textarea', { class: 'input', text: client?.address ?? '', attrs: { name: 'address', rows: 3 } })),
    ],
    onSubmit: async (form) => {
      await clients.save(
        { name: formValue(form, 'name'), company: formValue(form, 'company'), email: formValue(form, 'email'), phone: formValue(form, 'phone'), address: formValue(form, 'address') },
        client?.id,
      );
      return true;
    },
  });
}

async function deleteClient(client: Entity<Client>, quoteCount: number): Promise<void> {
  if (quoteCount > 0) {
    toast(`${client.name} is used by ${quoteCount} quotes. Delete or reassign them first.`, 'error');
    return;
  }
  if (await confirmAction('Delete client', `Delete ${client.name}?`, 'Delete')) await clients.remove(client.id);
}
