import type { ToolModule } from '../../core/types';
import { QUOTATION_COLLECTIONS } from './types';

export const quotationsModule: ToolModule = {
  id: 'quotations',
  title: 'Quotations',
  summary: 'Quotes, deposit and final invoices, payments, and a service catalogue. Print to PDF.',
  icon: 'quote',
  category: 'Productivity',
  access: 'restricted',
  collections: Object.values(QUOTATION_COLLECTIONS),
  load: () => import('./view'),
};
