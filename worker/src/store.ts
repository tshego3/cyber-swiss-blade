import { isJsonObject, type JsonObject, type JsonValue } from '../../shared/protocol';
import { isBsonDocument, type BsonDocument, type BsonValue } from './mongo/bson';
import type { MongoDatabase } from './mongo/client';
import type { MongoServerError } from './mongo/connection';

export const DUPLICATE_KEY = 11000;
const MAX_FIND = 1000;

export async function findMany(database: MongoDatabase, collection: string, filter: BsonDocument, options: { readonly sort?: BsonDocument; readonly limit?: number } = {}): Promise<JsonObject[]> {
  const reply = await database.command({ find: collection, filter, sort: options.sort ?? { _id: 1 }, limit: options.limit ?? MAX_FIND, batchSize: options.limit ?? MAX_FIND, singleBatch: true });
  const batch = isBsonDocument(reply.cursor) ? reply.cursor.firstBatch : undefined;
  return (Array.isArray(batch) ? batch : []).map(toJson).filter(isJsonObject);
}

export async function findOne(database: MongoDatabase, collection: string, filter: BsonDocument): Promise<JsonObject | null> {
  return (await findMany(database, collection, filter, { limit: 1 }))[0] ?? null;
}

export async function insertOne(database: MongoDatabase, collection: string, document: BsonDocument): Promise<void> {
  checkWrite(await database.command({ insert: collection, documents: [document] }));
}

export async function updateOne(database: MongoDatabase, collection: string, filter: BsonDocument, update: BsonDocument, upsert = false): Promise<number> {
  const reply = await database.command({ update: collection, updates: [{ q: filter, u: update, upsert }] });
  checkWrite(reply);
  return typeof reply.n === 'number' ? reply.n : 0;
}

export async function updateMany(database: MongoDatabase, collection: string, filter: BsonDocument, update: BsonDocument): Promise<void> {
  checkWrite(await database.command({ update: collection, updates: [{ q: filter, u: update, multi: true }] }));
}

export async function deleteOne(database: MongoDatabase, collection: string, filter: BsonDocument): Promise<void> {
  checkWrite(await database.command({ delete: collection, deletes: [{ q: filter, limit: 1 }] }));
}

export async function ensureUniqueIndex(database: MongoDatabase, collection: string, field: string): Promise<void> {
  await database.command({ createIndexes: collection, indexes: [{ key: { [field]: 1 }, name: `${field}_unique`, unique: true }] });
}

export function toJson(value: BsonValue | undefined): JsonValue {
  if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') return value ?? null;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) return null;
  if (Array.isArray(value)) return value.map((item: BsonValue) => toJson(item));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJson(item)]));
}

export function writeErrorCodes(reply: BsonDocument): number[] {
  const errors = Array.isArray(reply.writeErrors) ? reply.writeErrors : [];
  return errors.map((error) => (isBsonDocument(error) && typeof error.code === 'number' ? error.code : -1));
}

function checkWrite(reply: BsonDocument): void {
  const [code] = writeErrorCodes(reply);
  if (code !== undefined) throw { type: 'mongo', message: 'A write was rejected by the database.', code } satisfies MongoServerError;
}
