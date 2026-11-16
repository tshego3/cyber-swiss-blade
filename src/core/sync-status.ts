import { relativeTime } from './format';
import type { IconName } from './icons';
import type { SyncState } from './types';

export interface SyncStatusView {
  readonly label: string;
  readonly detail: string;
  readonly icon: IconName;
  readonly tone: 'muted' | 'ok' | 'busy' | 'warn';
}

export function describeSyncState(state: SyncState, now = Date.now()): SyncStatusView {
  const pending = state.pending > 0 ? `${state.pending} change${state.pending === 1 ? '' : 's'} pending` : 'All changes saved';
  switch (state.kind) {
    case 'local-only':
      return { label: 'Local only', detail: 'Data stays on this device until you connect sync', icon: 'cloud-off', tone: 'muted' };
    case 'signed-out':
      return { label: 'Signed out', detail: 'Sign in to sync your data', icon: 'cloud-off', tone: 'muted' };
    case 'syncing':
      return { label: 'Syncing', detail: pending, icon: 'refresh', tone: 'busy' };
    case 'offline':
      return { label: 'Offline', detail: pending, icon: 'cloud-off', tone: 'warn' };
    case 'error':
      return { label: 'Sync paused', detail: state.message, icon: 'cloud-off', tone: 'warn' };
    case 'idle':
      return {
        label: state.lastSyncedAt ? `Synced ${relativeTime(state.lastSyncedAt, now)}` : 'Ready to sync',
        detail: pending,
        icon: 'cloud',
        tone: 'ok',
      };
  }
}
