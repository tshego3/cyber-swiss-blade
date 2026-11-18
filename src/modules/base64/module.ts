import type { ToolModule } from '../../core/types';

export const base64Module: ToolModule = {
  id: 'base64',
  title: 'Base64',
  summary: 'Convert text and files to and from Base64, with URL-safe output and data URLs.',
  icon: 'braces',
  category: 'Encoding',
  access: 'public',
  collections: [],
  legacyQueryKeys: ['token'],
  load: () => import('./view'),
};
