import type { BsonDocument } from './bson';
import { openWireConnection, type DuplexStream, type WireConnection } from './connection';
import { md5Hex } from './md5';
import { scramFinal, scramStart, verifyServerFinal, type ScramMechanism } from './scram';

const DEFAULT_PORT = 27017;
const DNS_OVER_HTTPS = 'https://cloudflare-dns.com/dns-query';
const DNS_TIMEOUT_MS = 5_000;
const MAX_SASL_STEPS = 3;

export interface HostAddress {
  readonly host: string;
  readonly port: number;
}

export interface MongoSettings {
  readonly hosts: readonly HostAddress[];
  readonly srvHost: string | null;
  readonly username: string;
  readonly password: string;
  readonly authSource: string;
  readonly tls: boolean;
}

export type Connector = (address: HostAddress, tls: boolean) => DuplexStream;

export interface MongoDatabase {
  readonly name: string;
  readonly command: (command: BsonDocument) => Promise<BsonDocument>;
}

export function parseMongoUri(uri: string): MongoSettings {
  const match = /^(mongodb(?:\+srv)?):\/\/(?:([^:@/]+)(?::([^@/]*))?@)?([^/?]+)\/?[^?]*(?:\?(.*))?$/.exec(uri.trim());
  if (!match) throw new TypeError('MONGODB_URI is not a valid MongoDB connection string.');
  const [, scheme = '', user = '', password = '', hostList = '', query = ''] = match;
  const params = new URLSearchParams(query);
  const isSrv = scheme === 'mongodb+srv';
  return {
    hosts: isSrv ? [] : hostList.split(',').map(parseHost),
    srvHost: isSrv ? hostList : null,
    username: decodeURIComponent(user),
    password: decodeURIComponent(password),
    authSource: params.get('authSource') ?? 'admin',
    tls: isSrv ? params.get('tls') !== 'false' && params.get('ssl') !== 'false' : params.get('tls') === 'true' || params.get('ssl') === 'true',
  };
}

export async function withDatabase<T>(settings: MongoSettings, databaseName: string, connector: Connector, work: (database: MongoDatabase) => Promise<T>): Promise<T> {
  const hosts = settings.srvHost ? await resolveSrv(settings.srvHost) : settings.hosts;
  const user = settings.username ? `${settings.authSource}.${settings.username}` : null;
  const { connection, mechanisms } = await connectToPrimary(hosts, settings.tls, connector, user);
  try {
    if (settings.username) await authenticate(connection, settings, pickMechanism(mechanisms));
    return await work({ name: databaseName, command: (command) => connection.command(databaseName, command) });
  } finally {
    await connection.close();
  }
}

interface Primary {
  readonly connection: WireConnection;
  readonly mechanisms: readonly string[];
}

interface HelloResult {
  readonly primary: Primary | null;
  readonly redirect: string | null;
}

async function connectToPrimary(hosts: readonly HostAddress[], tls: boolean, connector: Connector, user: string | null): Promise<Primary> {
  for (const address of hosts) {
    const first = await hello(address, tls, connector, user);
    if (first.primary) return first.primary;
    if (!first.redirect) continue;
    const redirected = await hello(parseHost(first.redirect), tls, connector, user);
    if (redirected.primary) return redirected.primary;
  }
  throw new Error('No writable primary was found.');
}

async function hello(address: HostAddress, tls: boolean, connector: Connector, user: string | null): Promise<HelloResult> {
  const connection = openWireConnection(connector(address, tls));
  let redirect: string | null = null;
  try {
    const reply = await connection.command('admin', user ? { hello: 1, saslSupportedMechs: user } : { hello: 1 });
    const mechanisms = Array.isArray(reply.saslSupportedMechs) ? reply.saslSupportedMechs.filter((item): item is string => typeof item === 'string') : [];
    if (reply.isWritablePrimary === true) return { primary: { connection, mechanisms }, redirect: null };
    redirect = typeof reply.primary === 'string' ? reply.primary : null;
  } catch (error) {
    console.warn(`MongoDB host ${address.host} was unreachable`, error);
  }
  await connection.close().catch((error: unknown) => console.warn('Closing a MongoDB connection failed', error));
  return { primary: null, redirect };
}

export function pickMechanism(mechanisms: readonly string[]): ScramMechanism {
  return mechanisms.includes('SCRAM-SHA-1') && !mechanisms.includes('SCRAM-SHA-256') ? 'SCRAM-SHA-1' : 'SCRAM-SHA-256';
}

export function scramPassword(username: string, password: string, mechanism: ScramMechanism): string {
  return mechanism === 'SCRAM-SHA-1' ? md5Hex(`${username}:mongo:${password}`) : password;
}

async function authenticate(connection: WireConnection, settings: MongoSettings, mechanism: ScramMechanism): Promise<void> {
  const start = scramStart(settings.username);
  let reply = await connection.command(settings.authSource, {
    saslStart: 1,
    mechanism,
    payload: new TextEncoder().encode(start.message),
    options: { skipEmptyExchange: true },
  });
  const final = await scramFinal(scramPassword(settings.username, settings.password, mechanism), start, payloadText(reply), mechanism);
  reply = await connection.command(settings.authSource, { saslContinue: 1, conversationId: reply.conversationId ?? 1, payload: new TextEncoder().encode(final.message) });
  verifyServerFinal(payloadText(reply), final.serverSignature);
  for (let step = 0; step < MAX_SASL_STEPS && reply.done !== true; step += 1) {
    reply = await connection.command(settings.authSource, { saslContinue: 1, conversationId: reply.conversationId ?? 1, payload: new Uint8Array(0) });
  }
}

async function resolveSrv(host: string): Promise<HostAddress[]> {
  const url = `${DNS_OVER_HTTPS}?name=${encodeURIComponent(`_mongodb._tcp.${host}`)}&type=SRV`;
  const response = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(DNS_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`SRV lookup failed with status ${response.status}.`);
  const body: unknown = await response.json();
  const answers = typeof body === 'object' && body !== null && 'Answer' in body && Array.isArray(body.Answer) ? body.Answer : [];
  const hosts = answers
    .map((answer: unknown) => (typeof answer === 'object' && answer !== null && 'data' in answer && typeof answer.data === 'string' ? answer.data.split(' ') : []))
    .filter((parts: string[]) => parts.length === 4)
    .map((parts: string[]) => ({ host: (parts[3] ?? '').replace(/\.$/, ''), port: Number(parts[2]) || DEFAULT_PORT }));
  if (hosts.length === 0) throw new Error('SRV lookup returned no hosts.');
  return hosts;
}

function parseHost(value: string): HostAddress {
  const [host = '', port] = value.split(':');
  return { host, port: port ? Number(port) : DEFAULT_PORT };
}

function payloadText(reply: BsonDocument): string {
  return reply.payload instanceof Uint8Array ? new TextDecoder().decode(reply.payload) : '';
}
