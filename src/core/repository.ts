import type { JsonObject } from '../../shared/protocol';
import { getRecord, listRecords, writeLocal, type StoredRecord } from './db';
import { newId, nowIso } from './format';
import { matchesShape, type ShapeOf } from './shape';

export interface EntityMeta {
  readonly id: string;
  readonly updatedAt: string;
  readonly ownerId?: string;
}

export type Entity<T> = T & EntityMeta;

export interface Repository<T extends JsonObject> {
  readonly collection: string;
  readonly list: () => Promise<Entity<T>[]>;
  readonly get: (id: string) => Promise<Entity<T> | undefined>;
  readonly save: (data: T, id?: string) => Promise<Entity<T>>;
  readonly remove: (id: string) => Promise<void>;
}

export function createRepository<T extends JsonObject>(collection: string, shape: ShapeOf<T>, upgrade: (data: JsonObject) => JsonObject = (data) => data): Repository<T> {
  const toEntity = (record: StoredRecord | undefined): Entity<T> | undefined => {
    if (!record || record.deleted) return undefined;
    const data = upgrade(record.data);
    if (!matchesShape<T>(data, shape)) return undefined;
    const entity: Entity<T> = { ...data, id: record.id, updatedAt: record.updatedAt };
    return record.ownerId === undefined ? entity : { ...entity, ownerId: record.ownerId };
  };

  return {
    collection,
    async list() {
      const records = await listRecords(collection);
      return records.map(toEntity).filter((entity): entity is Entity<T> => entity !== undefined);
    },
    async get(id) {
      return toEntity(await getRecord(collection, id));
    },
    async save(data, id = newId()) {
      const existing = await getRecord(collection, id);
      const base: StoredRecord = { collection, id, updatedAt: nowIso(), deleted: false, data: withoutMeta(data) };
      const record: StoredRecord = existing?.ownerId === undefined ? base : { ...base, ownerId: existing.ownerId };
      await writeLocal(record);
      return { ...data, id, updatedAt: record.updatedAt };
    },
    async remove(id) {
      await writeLocal({ collection, id, updatedAt: nowIso(), deleted: true, data: {} });
    },
  };
}

function withoutMeta(data: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'id' && key !== 'updatedAt' && key !== 'ownerId'));
}
