import { el, type Child } from '../../core/dom';
import { moduleHeader } from '../../core/ui';

export type QuotationTab = 'quotes' | 'clients' | 'profile';

export function quotationHeader(active: QuotationTab, actions: readonly Child[]): HTMLElement {
  return moduleHeader({ title: 'Quotations', subtitle: 'Draft, price, and send client quotes.', actions }, 'Quotation sections', [
    { label: 'Quotes', href: '#/quotations', active: active === 'quotes' },
    { label: 'Clients', href: '#/quotations/clients', active: active === 'clients' },
    { label: 'Business profile', href: '#/quotations/profile', active: active === 'profile' },
  ]);
}

export function statusBadge(status: string, label: string): HTMLSpanElement {
  return el('span', { class: `badge badge-${status}`, text: label });
}
