import {
  COLLECTION_PATTERN,
  MAX_CHANGES_PER_COLLECTION,
  MAX_COLLECTIONS_PER_SYNC,
  PULL_LIMIT,
  isJsonObject,
  isRemoteRecord,
  isSyncRecord,
  type CollectionSyncRequest,
  type CollectionSyncResponse,
  type JsonValue,
  type RemoteRecord,
  type SyncRecord,
  type SyncRequest,
  type SyncResponse,
} from '../../shared/protocol';
import { isBsonDocument, type BsonDocument, type BsonValue } from './mongo/bson';
import type { MongoDatabase } from './mongo/client';
import type { MongoServerError } from './mongo/connection';

const DUPLICATE_KEY = 11000;
const SETTLE_MS = 60_000;
const MAX_FIELD_DEPTH = 8;

export interface ValidationError {
  readonly type: 'validation';
  readonly message: string;
}

export function parseSyncRequest(body: unknown): SyncRequest {
  if (!isJsonObject(body) || !isJsonObject(body.collections)) throw invalid('Body must contain a collections object.');
  const entries = Object.entries(body.collections);
  if (entries.length > MAX_COLLECTIONS_PER_SYNC) throw invalid('Too many collections in one request.');
  const collections: Record<string, CollectionSyncRequest> = {};
  for (const [name, value] of entries) {
    if (!COLLECTION_PATTERN.test(name)) throw invalid(`Invalid collection name: ${name}.`);
    collections[name] = parseCollectionRequest(value);
  }
  return { collections };
}

export async function handleSync(database: MongoDatabase, request: SyncRequest, now: () => number): Promise<SyncResponse> {
  const collections: Record<string, CollectionSyncResponse> = {};
  for (const [name, entry] of Object.entries(request.collections)) {
    if (!entry.since) await ensureIndex(database, name);
    const rejected = await pushChanges(database, name, entry.changes, new Date(now()).toISOString());
    const pulled = await findRecords(database, name, entry.since ? { syncedAt: { $gte: entry.since } } : {}, PULL_LIMIT);
    const conflicts = rejected.length > 0 ? await findRecords(database, name, { _id: { $in: rejected } }, rejected.length) : [];
    const cursor = nextCursor(entry.since, pulled, new Date(now() - SETTLE_MS).toISOString());
    collections[name] = {
      records: uniqueById([...pulled, ...conflicts]),
      cursor,
      hasMore: pulled.length === PULL_LIMIT && cursor > entry.since,
    };
  }
  return { collections };
}

export function nextCursor(since: string, pulled: readonly RemoteRecord[], settledBefore: string): string {
  const latest = pulled.reduce((max, record) => (record.syncedAt > max ? record.syncedAt : max), since);
  const settled = latest < settledBefore ? latest : settledBefore;
  return settled > since ? settled : since;
}

function parseCollectionRequest(value: JsonValue): CollectionSyncRequest {
  if (!isJsonObject(value) || typeof value.since !== 'string' || !Array.isArray(value.changes)) throw invalid('Each collection needs since and changes.');
  const changes: readonly JsonValue[] = value.changes;
  if (changes.length > MAX_CHANGES_PER_COLLECTION) throw invalid('Too many changes in one request.');
  const records: SyncRecord[] = [];
  for (const change of changes) {
    if (!isSyncRecord(change) || !hasSafeKeys(change.data, 0)) throw invalid('A change record is malformed.');
    records.push(change);
  }
  return { since: value.since, changes: records };
}

function hasSafeKeys(value: JsonValue, depth: number): boolean {
  if (depth > MAX_FIELD_DEPTH) return false;
  if (Array.isArray(value)) return value.every((item: JsonValue) => hasSafeKeys(item, depth + 1));
  if (!isJsonObject(value)) return true;
  return Object.entries(value).every(([key, item]) => !key.startsWith('$') && !key.includes('\0') && hasSafeKeys(item, depth + 1));
}

async function ensureIndex(database: MongoDatabase, collection: string): Promise<void> {
  await database.command({ createIndexes: collection, indexes: [{ key: { syncedAt: 1, _id: 1 }, name: 'syncedAt_id' }] });
}

async function pushChanges(database: MongoDatabase, collection: string, changes: readonly SyncRecord[], syncedAt: string): Promise<string[]> {
  if (changes.length === 0) return [];
  const reply = await database.command({
    update: collection,
    ordered: false,
    updates: changes.map((change) => ({
      q: { _id: change.id, updatedAt: { $lt: change.updatedAt } },
      u: { updatedAt: change.updatedAt, deleted: change.deleted, data: change.data, syncedAt },
      upsert: true,
    })),
  });
  const writeErrors = Array.isArray(reply.writeErrors) ? reply.writeErrors : [];
  const rejected: string[] = [];
  for (const writeError of writeErrors) {
    const details: BsonDocument = isBsonDocument(writeError) ? writeError : {};
    const change = typeof details.index === 'number' ? changes[details.index] : undefined;
    if (details.code !== DUPLICATE_KEY || !change) throw writeRejected(details.code);
    rejected.push(change.id);
  }
  return rejected;
}

async function findRecords(database: MongoDatabase, collection: string, filter: BsonDocument, limit: number): Promise<RemoteRecord[]> {
  const reply = await database.command({ find: collection, filter, sort: { syncedAt: 1, _id: 1 }, limit, singleBatch: true });
  const batch = isBsonDocument(reply.cursor) ? reply.cursor.firstBatch : undefined;
  return (Array.isArray(batch) ? batch : []).map(toRemoteRecord).filter((record): record is RemoteRecord => record !== null);
}

function toRemoteRecord(document: BsonValue): RemoteRecord | null {
  const json = toJson(document);
  if (!isJsonObject(json)) return null;
  const record = { id: json._id, updatedAt: json.updatedAt, deleted: json.deleted, data: json.data, syncedAt: json.syncedAt };
  return isRemoteRecord(record) ? { id: record.id, updatedAt: record.updatedAt, deleted: record.deleted, data: record.data, syncedAt: record.syncedAt } : null;
}

function toJson(value: BsonValue | undefined): JsonValue {
  if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return value ?? null;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return null;
  if (Array.isArray(value)) return value.map((item: BsonValue) => toJson(item));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJson(item)]));
}

function uniqueById(records: readonly RemoteRecord[]): RemoteRecord[] {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

function writeRejected(code: BsonValue | undefined): MongoServerError {
  return { type: 'mongo', message: 'A write was rejected by the database.', code: typeof code === 'number' ? code : -1 };
}

function invalid(message: string): ValidationError {
  return { type: 'validation', message };
}
