import { describe, expect, it } from 'vitest';
import type { SyncRecord } from '../../shared/protocol';
import type { BsonDocument } from './mongo/bson';
import type { MongoDatabase } from './mongo/client';
import { handleSync, parseSyncRequest } from './sync';

const change: SyncRecord = { id: 'a1', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: { name: 'API' } };

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
    const response = await handleSync(database, { collections: { projects: { since: '2026-11-16T09:00:00.000Z', changes: [change] } } }, () => Date.parse('2026-11-16T12:00:00.000Z'));
    const update = commands.find((command) => 'update' in command);
    expect(update?.updates).toEqual([
      { q: { _id: 'a1', updatedAt: { $lt: change.updatedAt } }, u: { updatedAt: change.updatedAt, deleted: false, data: { name: 'API' }, syncedAt: '2026-11-16T12:00:00.000Z' }, upsert: true },
    ]);
    expect(response.collections.projects?.records).toEqual([{ id: 'a1', updatedAt: serverVersion.updatedAt, deleted: false, data: { name: 'Newer' }, syncedAt: serverVersion.syncedAt }]);
    expect(response.collections.projects?.cursor).toBe('2026-11-16T09:00:00.000Z');
  });

  it('creates the sync index on a first pull and advances the cursor', async () => {
    const remote = { _id: 'b2', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: {}, syncedAt: '2026-11-16T10:00:05.000Z' };
    const { database, commands } = fakeDatabase((command) => ('find' in command ? { ok: 1, cursor: { id: 0, firstBatch: [remote] } } : { ok: 1 }));
    const response = await handleSync(database, { collections: { projects: { since: '', changes: [] } } }, () => Date.parse('2026-11-16T12:00:00.000Z'));
    expect(commands[0]).toHaveProperty('createIndexes', 'projects');
    expect(response.collections.projects).toMatchObject({ cursor: remote.syncedAt, hasMore: false });
  });
});
