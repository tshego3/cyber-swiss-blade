import { el, type Child } from '../../core/dom';
import { moduleHeader } from '../../core/ui';

export type QuotationTab = 'quotes' | 'invoices' | 'clients' | 'catalogue' | 'profile';

const TABS: readonly { readonly id: QuotationTab; readonly label: string; readonly href: string }[] = [
  { id: 'quotes', label: 'Quotes', href: '#/quotations' },
  { id: 'invoices', label: 'Invoices', href: '#/quotations/invoices' },
  { id: 'clients', label: 'Clients', href: '#/quotations/clients' },
  { id: 'catalogue', label: 'Catalogue', href: '#/quotations/catalogue' },
  { id: 'profile', label: 'Business profile', href: '#/quotations/profile' },
];

export function quotationHeader(active: QuotationTab, actions: readonly Child[]): HTMLElement {
  return moduleHeader(
    { title: 'Quotations', subtitle: 'Quotes, invoices, deposits, and payments.', actions },
    'Quotation sections',
    TABS.map((tab) => ({ label: tab.label, href: tab.href, active: tab.id === active })),
  );
}

export function statusBadge(status: string, label: string): HTMLSpanElement {
  return el('span', { class: `badge badge-${status}`, text: label });
}
