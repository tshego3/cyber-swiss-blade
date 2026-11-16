import type { SessionUser } from '../../shared/access';
import type { IconName } from './icons';

export type Unmount = () => void;

export interface ModuleContext {
  readonly path: readonly string[];
  readonly navigate: (path: string) => void;
  readonly canEdit: boolean;
  readonly user: SessionUser | null;
}

export interface ModuleView {
  readonly mount: (root: HTMLElement, context: ModuleContext) => Unmount;
}

export type ModuleCategory = 'Productivity' | 'Security' | 'Encoding';

export interface ToolModule {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly icon: IconName;
  readonly category: ModuleCategory;
  readonly access: 'public' | 'restricted';
  readonly collections: readonly string[];
  readonly load: () => Promise<ModuleView>;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ApiConfig {
  readonly baseUrl: string;
}

export type SyncState =
  | { readonly kind: 'local-only'; readonly pending: number }
  | { readonly kind: 'signed-out'; readonly pending: number }
  | { readonly kind: 'idle'; readonly pending: number; readonly lastSyncedAt: string | null }
  | { readonly kind: 'syncing'; readonly pending: number }
  | { readonly kind: 'offline'; readonly pending: number }
  | { readonly kind: 'error'; readonly pending: number; readonly message: string };
