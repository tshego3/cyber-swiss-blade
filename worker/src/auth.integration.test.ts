import { connect as connectTcp } from 'node:net';
import { Duplex } from 'node:stream';
import { connect as connectTls } from 'node:tls';
import { describe, expect, it } from 'vitest';
import { derivePasswordKey } from '../../shared/auth';
import { handleAdmin } from './admin';
import { authenticate, handleLogin, handleSetup, isSetupRequired, type AuthEnv } from './auth';
import { parseMongoUri, withDatabase, type Connector, type MongoDatabase } from './mongo/client';
import { handleSync } from './sync';

const uri = process.env.MONGODB_TEST_URI ?? '';
const database = `csb_test_auth_${Date.now()}`;
const env: AuthEnv = { secret: 'integration-secret-0123456789abcdef', sessionSecret: 'integration-session-secret-0123456789', now: Date.now };
const COLLECTIONS = ['auth_users', 'auth_meta', 'auth_roles', 'auth_permissions', 'timesheet_logs', 'quotation_clients'];

const nodeConnector: Connector = (address, tls) => {
  const socket = tls ? connectTls({ host: address.host, port: address.port, servername: address.host }) : connectTcp({ host: address.host, port: address.port });
  const { readable, writable } = Duplex.toWeb(socket);
  return { readable: readable as ReadableStream<Uint8Array>, writable: writable as WritableStream<Uint8Array>, close: () => void socket.destroy() };
};

function withToken(token: string): Request {
  return new Request('https://worker.test/sync', { headers: { Authorization: `Bearer ${token}` } });
}

function entry(id: string): { id: string; updatedAt: string; deleted: boolean; data: { note: string } } {
  return { id, updatedAt: new Date().toISOString(), deleted: false, data: { note: id } };
}

async function run(db: MongoDatabase): Promise<void> {
  expect(await isSetupRequired(db)).toBe(true);
  const adminKey = await derivePasswordKey('admin', 'admin password 123');
  await expect(handleSetup(db, { setupKey: 'wrong', username: 'admin', displayName: 'Admin', passwordKey: adminKey }, env)).rejects.toMatchObject({ status: 403 });
  const adminSession = await handleSetup(db, { setupKey: env.secret, username: 'admin', displayName: 'Admin', passwordKey: adminKey }, env);
  expect(adminSession.grants.quotations).toEqual({ view: true, edit: true });
  await expect(handleSetup(db, { setupKey: env.secret, username: 'other', displayName: 'Other', passwordKey: adminKey }, env)).rejects.toMatchObject({ status: 409 });

  const adminContext = await authenticate(db, withToken(adminSession.token), env);
  const devKey = await derivePasswordKey('dev', 'developer password 1');
  await handleAdmin(db, adminContext, 'POST', ['users'], () => Promise.resolve({ username: 'dev', displayName: 'Dev', email: '', phone: '', roles: [], passwordKey: devKey }), env.now());
  await expect(handleLogin(db, { username: 'dev', passwordKey: adminKey }, env)).rejects.toMatchObject({ status: 401 });
  const devSession = await handleLogin(db, { username: 'dev', passwordKey: devKey }, env);
  expect(devSession.grants).toEqual({ timesheet: { view: true, edit: true }, quotations: { view: false, edit: false } });

  const devContext = await authenticate(db, withToken(devSession.token), env);
  const asDev = { userId: devContext.user.id, isAdmin: false, grants: devContext.grants };
  const asAdmin = { userId: adminContext.user.id, isAdmin: true, grants: adminContext.grants };
  await handleSync(db, { collections: { timesheet_logs: { since: '', changes: [entry('dev-1')] } } }, Date.now, asDev);
  await handleSync(db, { collections: { timesheet_logs: { since: '', changes: [entry('admin-1')] } } }, Date.now, asAdmin);
  const devPull = await handleSync(db, { collections: { timesheet_logs: { since: '', changes: [] } } }, Date.now, asDev);
  expect(devPull.collections.timesheet_logs?.records.map((record) => record.id)).toEqual(['dev-1']);
  const adminPull = await handleSync(db, { collections: { timesheet_logs: { since: '', changes: [] } } }, Date.now, asAdmin);
  expect(adminPull.collections.timesheet_logs?.records.map((record) => [record.id, record.ownerId]).sort()).toEqual([['admin-1', adminContext.user.id], ['dev-1', devContext.user.id]]);
  await expect(handleSync(db, { collections: { quotation_clients: { since: '', changes: [] } } }, Date.now, asDev)).rejects.toMatchObject({ status: 403 });

  for (let attempt = 0; attempt < 5; attempt += 1) await handleLogin(db, { username: 'dev', passwordKey: adminKey }, env).catch(() => undefined);
  await expect(handleLogin(db, { username: 'dev', passwordKey: devKey }, env)).rejects.toMatchObject({ status: 429 });

  await handleAdmin(db, adminContext, 'PUT', ['users', devContext.user.id], () => Promise.resolve({ signOut: true }), env.now());
  await expect(authenticate(db, withToken(devSession.token), env)).rejects.toMatchObject({ status: 401 });
}

describe.skipIf(!uri)('accounts and permissions against MongoDB (set MONGODB_TEST_URI to run)', () => {
  it('sets up an admin, signs in users, scopes data by owner, and locks out guessing', async () => {
    const settings = parseMongoUri(uri || 'mongodb://localhost');
    try {
      await withDatabase(settings, database, nodeConnector, run);
    } finally {
      await withDatabase(settings, database, nodeConnector, async (db) => {
        for (const collection of COLLECTIONS) await db.command({ drop: collection }).catch(() => undefined);
      });
    }
  }, 60_000);
});
