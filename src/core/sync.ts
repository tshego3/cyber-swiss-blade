import { MAX_CHANGES_PER_COLLECTION, type CollectionSyncRequest, type SyncRecord } from '../../shared/protocol';
import { isApiError, loadApiConfig, postSync } from './api';
import { applySyncResult, getCursor, getMeta, getRecord, listOutbox, onDataChange, setMeta, type OutboxEntry } from './db';
import type { ApiConfig, SyncState } from './types';

const LAST_SYNC_KEY = 'last-synced-at';
const MAX_ROUNDS = 10;
const LOCAL_CHANGE_DELAY_MS = 2_000;
const INTERVAL_MS = 5 * 60_000;

export type SyncListener = (state: SyncState) => void;

export interface SyncEngine {
  readonly start: () => void;
  readonly syncNow: () => Promise<void>;
  readonly state: () => SyncState;
  readonly subscribe: (listener: SyncListener) => () => void;
}

interface PreparedCollection {
  readonly request: CollectionSyncRequest;
  readonly pushed: readonly OutboxEntry[];
}

export function createSyncEngine(collections: readonly string[]): SyncEngine {
  const listeners = new Set<SyncListener>();
  let current: SyncState = { kind: 'local-only', pending: 0 };
  let running: Promise<void> | null = null;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const publish = (state: SyncState): void => {
    current = state;
    for (const listener of listeners) listener(state);
  };

  const run = async (): Promise<void> => {
    const config = await loadApiConfig();
    const pending = await countPending();
    if (!config) return publish({ kind: 'local-only', pending });
    if (!navigator.onLine) return publish({ kind: 'offline', pending });
    publish({ kind: 'syncing', pending });
    try {
      await syncRounds(config, collections);
      const lastSyncedAt = new Date().toISOString();
      await setMeta(LAST_SYNC_KEY, lastSyncedAt);
      publish({ kind: 'idle', pending: await countPending(), lastSyncedAt });
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Something went wrong. Please try again.';
      if (!isApiError(error)) console.error('Sync failed', error);
      publish({ kind: 'error', pending: await countPending(), message });
    }
  };

  const syncNow = (): Promise<void> => {
    running ??= run().finally(() => {
      running = null;
    });
    return running;
  };

  const refreshPending = async (): Promise<void> => {
    publish({ ...current, pending: await countPending() });
  };

  const onLocalChange = (): void => {
    void refreshPending();
    clearTimeout(debounce);
    debounce = setTimeout(() => void syncNow(), LOCAL_CHANGE_DELAY_MS);
  };

  const start = (): void => {
    onDataChange((_collection, source) => {
      if (source === 'local') onLocalChange();
    });
    window.addEventListener('online', () => void syncNow());
    window.addEventListener('offline', () => void syncNow());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void syncNow();
    });
    setInterval(() => {
      if (document.visibilityState === 'visible') void syncNow();
    }, INTERVAL_MS);
    void restoreLastSync().then(() => syncNow());
  };

  const restoreLastSync = async (): Promise<void> => {
    const lastSyncedAt = await getMeta(LAST_SYNC_KEY);
    if (typeof lastSyncedAt === 'string') publish({ kind: 'idle', pending: await countPending(), lastSyncedAt });
  };

  return {
    start,
    syncNow,
    state: () => current,
    subscribe(listener) {
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    },
  };
}

async function syncRounds(config: ApiConfig, collections: readonly string[]): Promise<void> {
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const hasMore = await syncRound(config, collections);
    if (!hasMore) return;
  }
}

async function syncRound(config: ApiConfig, collections: readonly string[]): Promise<boolean> {
  const prepared = new Map<string, PreparedCollection>();
  for (const collection of collections) {
    prepared.set(collection, await prepareCollection(collection));
  }
  const response = await postSync(config, {
    collections: Object.fromEntries([...prepared].map(([collection, entry]) => [collection, entry.request])),
  });
  let hasMore = false;
  for (const [collection, entry] of prepared) {
    const result = response.collections[collection];
    if (!result) continue;
    await applySyncResult(collection, entry.pushed, result.records, result.cursor);
    hasMore ||= result.hasMore || entry.pushed.length === MAX_CHANGES_PER_COLLECTION;
  }
  return hasMore;
}

async function prepareCollection(collection: string): Promise<PreparedCollection> {
  const pushed = (await listOutbox(collection)).slice(0, MAX_CHANGES_PER_COLLECTION);
  const changes: SyncRecord[] = [];
  for (const entry of pushed) {
    const record = await getRecord(collection, entry.id);
    if (record) changes.push({ id: record.id, updatedAt: record.updatedAt, deleted: record.deleted, data: record.data });
  }
  return { pushed, request: { since: await getCursor(collection), changes } };
}

async function countPending(): Promise<number> {
  return (await listOutbox()).length;
}
