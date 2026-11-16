import { onDataChange } from '../../core/db';
import { el, replaceChildren } from '../../core/dom';
import type { Entity } from '../../core/repository';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, confirmAction, emptyState, errorState, field, formValue, loadingState, openFormDialog, toast } from '../../core/ui';
import { clientAddress, clients, invoices, quotes } from './data';
import { quotationHeader } from './header';
import { QUOTATION_COLLECTIONS, type Client, type Invoice, type Quote } from './types';

interface ClientsState {
  readonly clients: readonly Entity<Client>[];
  readonly quotes: readonly Entity<Quote>[];
  readonly invoices: readonly Entity<Invoice>[];
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

export function mountClients(root: HTMLElement, context: ModuleContext): Unmount {
  let state: ClientsState = { clients: [], quotes: [], invoices: [], isLoading: true, errorMessage: null };
  const content = el('div');

  const load = async (): Promise<void> => {
    try {
      const [clientList, quoteList, invoiceList] = await Promise.all([clients.list(), quotes.list(), invoices.list()]);
      state = { clients: clientList, quotes: quoteList, invoices: invoiceList, isLoading: false, errorMessage: null };
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
      return replaceChildren(content, [el('ul', { class: 'card-grid' }, sorted.map((client) => clientCard(client, [...state.quotes, ...state.invoices].filter((document) => document.clientId === client.id).length, context.canEdit)))]);
    }
    replaceChildren(content, [emptyState({ icon: 'users', title: 'No clients yet', text: 'Clients appear on your quotes as the billing party.' })]);
  };

  root.append(quotationHeader('clients', context.canEdit ? [button({ label: 'New client', icon: 'plus', variant: 'primary', onClick: () => openClientDialog() })] : []), content);
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

function clientCard(client: Entity<Client>, documentCount: number, canEdit: boolean): HTMLLIElement {
  return el('li', { class: 'card item-card' }, [
    el('div', {}, [el('h2', { class: 'item-name', text: client.company || client.name }), el('p', { class: 'muted', text: client.company ? client.name : client.email || 'No email' })]),
    el('p', { class: 'muted small', text: [clientAddress(client).join(', '), `${documentCount} document${documentCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ') }),
    canEdit && el('div', { class: 'row' }, [
      button({ label: 'Edit', icon: 'edit', variant: 'ghost', onClick: () => openClientDialog(client) }),
      button({ label: 'Delete', icon: 'trash', variant: 'ghost', onClick: () => void deleteClient(client, documentCount) }),
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
      field('VAT number', input('taxNumber')),
      field('Address line 1', input('address1')),
      field('Address line 2', input('address2')),
      el('div', { class: 'grid-2' }, [field('City', input('city')), field('Province or region', input('region'))]),
      el('div', { class: 'grid-2' }, [field('Postal code', input('postalCode')), field('Country', input('country'))]),
    ],
    onSubmit: async (form) => {
      const value = (key: keyof Client): string => formValue(form, key);
      const next: Client = {
        name: value('name'),
        company: value('company'),
        email: value('email'),
        phone: value('phone'),
        taxNumber: value('taxNumber'),
        address1: value('address1'),
        address2: value('address2'),
        city: value('city'),
        region: value('region'),
        postalCode: value('postalCode'),
        country: value('country'),
      };
      await clients.save(next, client?.id);
      return true;
    },
  });
}

async function deleteClient(client: Entity<Client>, documentCount: number): Promise<void> {
  if (documentCount > 0) {
    toast(`${client.name} is used by ${documentCount} quotes or invoices. Delete or reassign them first.`, 'error');
    return;
  }
  if (await confirmAction('Delete client', `Delete ${client.name}?`, 'Delete')) await clients.remove(client.id);
}
