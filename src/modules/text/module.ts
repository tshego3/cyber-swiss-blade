import type { ToolModule } from '../../core/types';

export const textModule: ToolModule = {
  id: 'text',
  title: 'Text tools',
  summary: 'Join multi-line text into one line with a space, a comma, or no separator.',
  icon: 'text',
  category: 'Encoding',
  access: 'public',
  collections: [],
  load: () => import('./view'),
};
