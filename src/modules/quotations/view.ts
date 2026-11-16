import './quotations.css';
import type { ModuleContext, Unmount } from '../../core/types';
import { mountCatalogue } from './catalogue-view';
import { mountClients } from './clients-view';
import { mountQuoteEditor } from './editor-view';
import { mountInvoiceEditor } from './invoice-editor-view';
import { mountInvoices } from './invoices-view';
import { mountQuoteList } from './list-view';
import { mountProfile } from './profile-view';

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const [section, id] = context.path;
  if (section === 'clients') return mountClients(root, context);
  if (section === 'profile') return mountProfile(root, context);
  if (section === 'catalogue') return mountCatalogue(root, context);
  if (section === 'invoices') return id ? mountInvoiceEditor(root, context, id) : mountInvoices(root, context);
  if (section) return mountQuoteEditor(root, context, section);
  return mountQuoteList(root, context);
}
