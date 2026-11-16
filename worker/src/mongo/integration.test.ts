import { connect as connectTcp } from 'node:net';
import { Duplex } from 'node:stream';
import { connect as connectTls } from 'node:tls';
import { describe, expect, it } from 'vitest';
import { handleSync } from '../sync';
import { parseMongoUri, withDatabase, type Connector } from './client';

const uri = process.env.MONGODB_TEST_URI ?? '';
const database = `csb_test_${Date.now()}`;

const nodeConnector: Connector = (address, tls) => {
  const socket = tls ? connectTls({ host: address.host, port: address.port, servername: address.host }) : connectTcp({ host: address.host, port: address.port });
  const { readable, writable } = Duplex.toWeb(socket);
  return { readable: readable as ReadableStream<Uint8Array>, writable: writable as WritableStream<Uint8Array>, close: () => void socket.destroy() };
};

describe.skipIf(!uri)('MongoDB integration (set MONGODB_TEST_URI to run)', () => {
  const settings = uri ? parseMongoUri(uri) : parseMongoUri('mongodb://localhost');

  it('authenticates and pings', async () => {
    const reply = await withDatabase(settings, database, nodeConnector, (db) => db.command({ ping: 1 }));
    expect(reply.ok).toBe(1);
  });

  it('syncs records between two devices with last-write-wins', async () => {
    const record = { id: 'r1', updatedAt: '2026-11-16T10:00:00.000Z', deleted: false, data: { name: 'First' } };
    const first = await withDatabase(settings, database, nodeConnector, (db) =>
      handleSync(db, { collections: { items: { since: '', changes: [record] } } }, () => Date.parse('2026-11-16T10:00:01.000Z')),
    );
    expect(first.collections.items?.records.map((item) => item.data)).toEqual([{ name: 'First' }]);

    const stale = { ...record, updatedAt: '2026-11-16T09:00:00.000Z', data: { name: 'Stale' } };
    const second = await withDatabase(settings, database, nodeConnector, (db) =>
      handleSync(db, { collections: { items: { since: first.collections.items?.cursor ?? '', changes: [stale] } } }, () => Date.parse('2026-11-16T10:00:02.000Z')),
    );
    expect(second.collections.items?.records.map((item) => item.data)).toEqual([{ name: 'First' }]);

    await withDatabase(settings, database, nodeConnector, (db) => db.command({ dropDatabase: 1 }));
  });
});
