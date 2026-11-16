import { connect } from 'cloudflare:sockets';
import type { ErrorResponse, StatusResponse, SyncResponse } from '../../shared/protocol';
import { parseMongoUri, withDatabase, type Connector } from './mongo/client';
import { handleSync, parseSyncRequest, type ValidationError } from './sync';

export interface Env {
  readonly MONGODB_URI: string;
  readonly API_TOKEN: string;
  readonly MONGODB_DB: string;
  readonly ALLOWED_ORIGINS: string;
}

const MAX_BODY_BYTES = 1_000_000;
const MIN_TOKEN_LENGTH = 32;

const connector: Connector = (address, tls) =>
  connect({ hostname: address.host, port: address.port }, { secureTransport: tls ? 'on' : 'off', allowHalfOpen: false });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    if (origin && !cors) return json({ error: 'Origin not allowed.' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors ?? {} });
    if (!(await isAuthorized(request, env.API_TOKEN))) return json({ error: 'Unauthorized.' }, 401, cors ?? {});
    try {
      return await route(request, env, cors ?? {});
    } catch (error) {
      if (isValidationError(error)) return json({ error: error.message }, 400, cors ?? {});
      console.error('Request failed', error);
      return json({ error: 'The sync server could not complete the request.' }, 502, cors ?? {});
    }
  },
};

async function route(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const { pathname } = new URL(request.url);
  const settings = parseMongoUri(env.MONGODB_URI);
  const databaseName = env.MONGODB_DB || 'cyber_swiss_blade';
  if (request.method === 'GET' && pathname === '/status') {
    await withDatabase(settings, databaseName, connector, (database) => database.command({ ping: 1 }));
    const body: StatusResponse = { ok: true, database: databaseName, serverTime: new Date().toISOString() };
    return json(body, 200, cors);
  }
  if (request.method === 'POST' && pathname === '/sync') {
    const syncRequest = parseSyncRequest(await readJson(request));
    const response = await withDatabase(settings, databaseName, connector, (database) => handleSync(database, syncRequest, Date.now));
    return json(response, 200, cors);
  }
  return json({ error: 'Not found.' }, 404, cors);
}

function corsHeaders(origin: string | null, allowed: string): Record<string, string> | null {
  const origins = allowed.split(',').map((value) => value.trim());
  if (!origin || !origins.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

async function isAuthorized(request: Request, token: string): Promise<boolean> {
  if (!token || token.length < MIN_TOKEN_LENGTH) return false;
  const header = request.headers.get('Authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [expectedHash, providedHash] = await Promise.all([sha256(token), sha256(provided)]);
  return expectedHash.every((byte, index) => byte === providedHash[index]) && provided.length > 0;
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) throw validation('Request body is too large.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw validation('Request body is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw validation('Request body is not valid JSON.');
  }
}

function json(body: StatusResponse | SyncResponse | ErrorResponse, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function validation(message: string): ValidationError {
  return { type: 'validation', message };
}

function isValidationError(error: unknown): error is ValidationError {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'validation';
}
