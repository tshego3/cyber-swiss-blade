import type { ToolModule } from '../../core/types';
import { QUOTATION_COLLECTIONS } from './types';

export const quotationsModule: ToolModule = {
  id: 'quotations',
  title: 'Quotations',
  summary: 'Build client quotes with line items, tax, and status tracking. Print straight to PDF.',
  icon: 'quote',
  category: 'Productivity',
  collections: Object.values(QUOTATION_COLLECTIONS),
  load: () => import('./view'),
};
