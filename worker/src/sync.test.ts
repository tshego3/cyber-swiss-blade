import { describe, expect, it } from 'vitest';
import type { SyncRecord } from '../../shared/protocol';
import type { BsonDocument } from './mongo/bson';
import type { MongoDatabase } from './mongo/client';
import { handleSync, parseSyncRequest, type SyncAccess } from './sync';

const change: SyncRecord = { id: 'a1', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: { name: 'API' } };
const editor: SyncAccess = { userId: 'u1', isAdmin: false, grants: { quotations: { view: true, edit: true }, timesheet: { view: true, edit: true } } };
const NOW = (): number => Date.parse('2026-11-16T12:00:00.000Z');
const emptyFind = (command: BsonDocument): BsonDocument => ('find' in command ? { ok: 1, cursor: { id: 0, firstBatch: [] } } : { ok: 1 });

function fakeDatabase(replies: (command: BsonDocument) => BsonDocument): { database: MongoDatabase; commands: BsonDocument[] } {
  const commands: BsonDocument[] = [];
  return {
    commands,
    database: {
      name: 'test',
      command: async (command) => {
        commands.push(command);
        return replies(command);
      },
    },
  };
}

describe('parseSyncRequest', () => {
  it('accepts a well-formed request', () => {
    expect(parseSyncRequest({ collections: { timesheet_projects: { since: '', changes: [change] } } }).collections.timesheet_projects?.changes).toHaveLength(1);
  });

  it.each([
    [{}, 'missing collections'],
    [{ collections: { 'Bad-Name': { since: '', changes: [] } } }, 'invalid collection name'],
    [{ collections: { ok: { since: '', changes: [{ ...change, id: 'a b' }] } } }, 'invalid id'],
    [{ collections: { ok: { since: '', changes: [{ ...change, data: { $where: 'x' } }] } } }, 'operator key'],
  ])('rejects %j (%s)', (body) => {
    expect(() => parseSyncRequest(body)).toThrow();
  });
});

describe('handleSync', () => {
  it('upserts changes, treats duplicate keys as conflicts, and returns server versions', async () => {
    const serverVersion = { _id: 'a1', updatedAt: '2026-11-16T11:00:00.000Z', deleted: false, data: { name: 'Newer' }, syncedAt: '2026-11-16T11:00:01.000Z' };
    const { database, commands } = fakeDatabase((command) => {
      if ('update' in command) return { ok: 1, n: 0, writeErrors: [{ index: 0, code: 11000, errmsg: 'duplicate key' }] };
      if ('find' in command) return { ok: 1, cursor: { id: 0, firstBatch: 'filter' in command && command.filter && '_id' in (command.filter as BsonDocument) ? [serverVersion] : [] } };
      return { ok: 1 };
    });
    const response = await handleSync(database, { collections: { quotation_clients: { since: '2026-11-16T09:00:00.000Z', changes: [change] } } }, NOW, editor);
    const update = commands.find((command) => 'update' in command);
    expect(update?.updates).toEqual([
      { q: { _id: 'a1', updatedAt: { $lt: change.updatedAt } }, u: { updatedAt: change.updatedAt, deleted: false, data: { name: 'API' }, syncedAt: '2026-11-16T12:00:00.000Z' }, upsert: true },
    ]);
    expect(response.collections.quotation_clients?.records).toEqual([{ id: 'a1', updatedAt: serverVersion.updatedAt, deleted: false, data: { name: 'Newer' }, syncedAt: serverVersion.syncedAt }]);
    expect(response.collections.quotation_clients?.cursor).toBe('2026-11-16T09:00:00.000Z');
  });

  it('creates the sync index on a first pull and advances the cursor', async () => {
    const remote = { _id: 'b2', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: {}, syncedAt: '2026-11-16T10:00:05.000Z' };
    const { database, commands } = fakeDatabase((command) => ('find' in command ? { ok: 1, cursor: { id: 0, firstBatch: [remote] } } : { ok: 1 }));
    const response = await handleSync(database, { collections: { quotation_clients: { since: '', changes: [] } } }, NOW, editor);
    expect(commands[0]).toHaveProperty('createIndexes', 'quotation_clients');
    expect(commands.find((command) => 'find' in command)).toMatchObject({ limit: 500, batchSize: 500, singleBatch: true });
    expect(response.collections.quotation_clients).toMatchObject({ cursor: remote.syncedAt, hasMore: false });
  });

  it('stamps and filters the owner on owner-scoped collections', async () => {
    const { database, commands } = fakeDatabase(emptyFind);
    await handleSync(database, { collections: { timesheet_logs: { since: '2026-11-16T09:00:00.000Z', changes: [change] } } }, NOW, editor);
    const update = commands.find((command) => 'update' in command);
    expect(update?.updates).toEqual([expect.objectContaining({ q: { _id: 'a1', updatedAt: { $lt: change.updatedAt }, ownerId: 'u1' }, u: expect.objectContaining({ ownerId: 'u1' }) })]);
    expect(commands.find((command) => 'find' in command)?.filter).toEqual({ ownerId: 'u1', syncedAt: { $gte: '2026-11-16T09:00:00.000Z' } });
  });

  it('lets administrators pull every owner but write only as themselves', async () => {
    const { database, commands } = fakeDatabase(emptyFind);
    await handleSync(database, { collections: { timesheet_logs: { since: '', changes: [change] } } }, NOW, { ...editor, isAdmin: true });
    expect(commands.find((command) => 'find' in command)?.filter).toEqual({});
    expect(commands.find((command) => 'update' in command)?.updates).toEqual([expect.objectContaining({ q: expect.objectContaining({ ownerId: 'u1' }) })]);
  });

  it('rejects changes from a viewer and returns the server copies', async () => {
    const { database, commands } = fakeDatabase(emptyFind);
    const viewer: SyncAccess = { ...editor, grants: { quotations: { view: true, edit: false } } };
    await handleSync(database, { collections: { quotation_clients: { since: '', changes: [change] } } }, NOW, viewer);
    expect(commands.some((command) => 'update' in command)).toBe(false);
    expect(commands.filter((command) => 'find' in command).at(-1)?.filter).toEqual({ _id: { $in: ['a1'] } });
  });

  it.each([
    ['a collection without view access', { quotations: { view: false, edit: false } }, 'quotation_clients'],
    ['an unknown collection', { quotations: { view: true, edit: true } }, 'secrets'],
  ])('refuses %s', async (_label, grants, collection) => {
    const { database } = fakeDatabase(emptyFind);
    await expect(handleSync(database, { collections: { [collection]: { since: '', changes: [] } } }, NOW, { ...editor, grants })).rejects.toMatchObject({ type: 'http', status: 403 });
  });
});
