import type { ToolModule } from '../../core/types';

export const docsModule: ToolModule = {
  id: 'docs',
  title: 'Docs',
  summary: 'Read guides, cheat sheets, and code samples from GitHub gists, with search and page navigation.',
  icon: 'book',
  category: 'Knowledge',
  access: 'public',
  collections: [],
  load: () => import('./view'),
};
