import type { JsonObject, JsonValue, RemoteRecord, SyncRecord } from '../../shared/protocol';

const DB_NAME = 'cyber-swiss-blade';
const DB_VERSION = 1;
const RECORDS = 'records';
const OUTBOX = 'outbox';
const META = 'meta';
const CURSOR_PREFIX = 'cursor:';

export interface StoredRecord extends SyncRecord {
  readonly collection: string;
  readonly ownerId?: string;
}

export interface OutboxEntry {
  readonly collection: string;
  readonly id: string;
  readonly updatedAt: string;
}

interface MetaEntry {
  readonly key: string;
  readonly value: JsonValue;
}

export type ChangeSource = 'local' | 'remote';
export type ChangeListener = (collection: string, source: ChangeSource) => void;

const changeListeners = new Set<ChangeListener>();
let connection: Promise<IDBDatabase> | null = null;

export function onDataChange(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export async function listRecords(collection: string): Promise<StoredRecord[]> {
  const db = await openDatabase();
  const index = db.transaction(RECORDS).objectStore(RECORDS).index('collection');
  return requestResult<StoredRecord[]>(index.getAll(collection));
}

export async function getRecord(collection: string, id: string): Promise<StoredRecord | undefined> {
  const db = await openDatabase();
  return requestResult<StoredRecord | undefined>(db.transaction(RECORDS).objectStore(RECORDS).get([collection, id]));
}

export async function writeLocal(record: StoredRecord): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDS, OUTBOX], 'readwrite');
  transaction.objectStore(RECORDS).put(record);
  transaction.objectStore(OUTBOX).put({ collection: record.collection, id: record.id, updatedAt: record.updatedAt } satisfies OutboxEntry);
  await transactionDone(transaction);
  notify(record.collection, 'local');
}

export async function listOutbox(collection?: string): Promise<OutboxEntry[]> {
  const db = await openDatabase();
  const store = db.transaction(OUTBOX).objectStore(OUTBOX);
  const range = collection ? IDBKeyRange.bound([collection], [collection, []]) : undefined;
  return requestResult<OutboxEntry[]>(store.getAll(range));
}

export function isUnchanged(local: StoredRecord | undefined, remote: SyncRecord & { readonly ownerId?: string }): boolean {
  return local !== undefined && local.updatedAt === remote.updatedAt && local.deleted === remote.deleted && local.ownerId === remote.ownerId;
}

export function shouldApplyRemote(local: StoredRecord | undefined, pending: OutboxEntry | undefined, remote: SyncRecord): boolean {
  if (!local || !pending) return true;
  return remote.updatedAt >= local.updatedAt;
}

export async function applySyncResult(
  collection: string,
  pushed: readonly OutboxEntry[],
  remote: readonly RemoteRecord[],
  cursor: string,
): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDS, OUTBOX, META], 'readwrite');
  const records = transaction.objectStore(RECORDS);
  const outbox = transaction.objectStore(OUTBOX);
  for (const entry of pushed) {
    const current = await requestResult<OutboxEntry | undefined>(outbox.get([collection, entry.id]));
    if (current?.updatedAt === entry.updatedAt) outbox.delete([collection, entry.id]);
  }
  let changed = 0;
  for (const record of remote) {
    const key = [collection, record.id];
    const local = await requestResult<StoredRecord | undefined>(records.get(key));
    const pending = await requestResult<OutboxEntry | undefined>(outbox.get(key));
    if (isUnchanged(local, record) || !shouldApplyRemote(local, pending, record)) continue;
    const stored: StoredRecord = { collection, id: record.id, updatedAt: record.updatedAt, deleted: record.deleted, data: record.data };
    records.put(record.ownerId === undefined ? stored : { ...stored, ownerId: record.ownerId });
    outbox.delete(key);
    changed += 1;
  }
  transaction.objectStore(META).put({ key: cursorKey(collection), value: cursor } satisfies MetaEntry);
  await transactionDone(transaction);
  if (changed > 0) notify(collection, 'remote');
}

export async function resetSyncState(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDS, OUTBOX, META], 'readwrite');
  const all = await requestResult<StoredRecord[]>(transaction.objectStore(RECORDS).getAll());
  const outbox = transaction.objectStore(OUTBOX);
  for (const record of all) outbox.put({ collection: record.collection, id: record.id, updatedAt: record.updatedAt } satisfies OutboxEntry);
  const meta = transaction.objectStore(META);
  const keys = await requestResult<IDBValidKey[]>(meta.getAllKeys());
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith(CURSOR_PREFIX)) meta.delete(key);
  }
  await transactionDone(transaction);
}

export async function getCursor(collection: string): Promise<string> {
  const value = await getMeta(cursorKey(collection));
  return typeof value === 'string' ? value : '';
}

export async function getMeta(key: string): Promise<JsonValue | undefined> {
  const db = await openDatabase();
  const entry = await requestResult<MetaEntry | undefined>(db.transaction(META).objectStore(META).get(key));
  return entry?.value;
}

export async function setMeta(key: string, value: JsonValue | JsonObject): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(META, 'readwrite');
  transaction.objectStore(META).put({ key, value } satisfies MetaEntry);
  await transactionDone(transaction);
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(META, 'readwrite');
  transaction.objectStore(META).delete(key);
  await transactionDone(transaction);
}

export async function clearSyncedData(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDS, OUTBOX, META], 'readwrite');
  transaction.objectStore(RECORDS).clear();
  transaction.objectStore(OUTBOX).clear();
  const meta = transaction.objectStore(META);
  const keys = await requestResult<IDBValidKey[]>(meta.getAllKeys());
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith(CURSOR_PREFIX)) meta.delete(key);
  }
  await transactionDone(transaction);
}

export async function eraseAllData(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([RECORDS, OUTBOX, META], 'readwrite');
  for (const store of [RECORDS, OUTBOX, META]) transaction.objectStore(store).clear();
  await transactionDone(transaction);
}

function cursorKey(collection: string): string {
  return `${CURSOR_PREFIX}${collection}`;
}

function notify(collection: string, source: ChangeSource): void {
  for (const listener of changeListeners) listener(collection, source);
}

function openDatabase(): Promise<IDBDatabase> {
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore(RECORDS, { keyPath: ['collection', 'id'] }).createIndex('collection', 'collection');
      db.createObjectStore(OUTBOX, { keyPath: ['collection', 'id'] });
      db.createObjectStore(META, { keyPath: 'key' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
  return connection;
}

function requestResult<T>(request: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
