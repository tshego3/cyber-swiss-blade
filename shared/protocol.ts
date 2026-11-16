export type JsonValue = null | boolean | number | string | readonly JsonValue[] | JsonObject;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface SyncRecord {
  readonly id: string;
  readonly updatedAt: string;
  readonly deleted: boolean;
  readonly data: JsonObject;
}

export interface RemoteRecord extends SyncRecord {
  readonly syncedAt: string;
  readonly ownerId?: string;
}

export interface CollectionSyncRequest {
  readonly since: string;
  readonly changes: readonly SyncRecord[];
}

export interface SyncRequest {
  readonly collections: Readonly<Record<string, CollectionSyncRequest>>;
}

export interface CollectionSyncResponse {
  readonly records: readonly RemoteRecord[];
  readonly cursor: string;
  readonly hasMore: boolean;
}

export interface SyncResponse {
  readonly collections: Readonly<Record<string, CollectionSyncResponse>>;
}

export interface StatusResponse {
  readonly ok: true;
  readonly database: string;
  readonly serverTime: string;
  readonly setupRequired: boolean;
}

export interface ErrorResponse {
  readonly error: string;
}

export const COLLECTION_PATTERN = /^[a-z][a-z0-9_]{0,47}$/;
export const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const MAX_COLLECTIONS_PER_SYNC = 16;
export const MAX_CHANGES_PER_COLLECTION = 200;
export const PULL_LIMIT = 500;

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isSyncRecord(value: unknown): value is SyncRecord {
  if (!isJsonObject(value)) return false;
  return (
    typeof value.id === 'string' &&
    ID_PATTERN.test(value.id) &&
    typeof value.updatedAt === 'string' &&
    ISO_TIMESTAMP_PATTERN.test(value.updatedAt) &&
    typeof value.deleted === 'boolean' &&
    isJsonObject(value.data)
  );
}

export function isRemoteRecord(value: unknown): value is RemoteRecord {
  if (!isSyncRecord(value) || !('syncedAt' in value) || typeof value.syncedAt !== 'string') return false;
  return !('ownerId' in value) || typeof value.ownerId === 'string';
}
