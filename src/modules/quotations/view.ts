import './quotations.css';
import type { ModuleContext, Unmount } from '../../core/types';
import { mountClients } from './clients-view';
import { mountQuoteEditor } from './editor-view';
import { mountQuoteList } from './list-view';
import { mountProfile } from './profile-view';

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const [section] = context.path;
  if (section === 'clients') return mountClients(root);
  if (section === 'profile') return mountProfile(root);
  if (section) return mountQuoteEditor(root, context, section);
  return mountQuoteList(root, context);
}
