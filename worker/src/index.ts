import { connect } from 'cloudflare:sockets';
import type { StatusResponse } from '../../shared/protocol';
import { handleAdmin } from './admin';
import { authenticate, handleLogin, handlePassword, handleProfile, handleSetup, isSetupRequired, sessionResponse, type AuthEnv } from './auth';
import { httpError, isHttpError, json, readJson, readObject } from './http';
import { parseMongoUri, withDatabase, type Connector, type MongoDatabase } from './mongo/client';
import { handleSync, parseSyncRequest, type ValidationError } from './sync';

export interface Env {
  readonly MONGODB_URI: string;
  readonly API_TOKEN: string;
  readonly SESSION_SECRET?: string;
  readonly MONGODB_DB: string;
  readonly ALLOWED_ORIGINS: string;
}

const MIN_SECRET_LENGTH = 32;

const connector: Connector = (address, tls) =>
  connect({ hostname: address.host, port: address.port }, { secureTransport: tls ? 'on' : 'off', allowHalfOpen: false });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);
    if (origin && !cors) return json({ error: 'Origin not allowed.' }, 403, {});
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors ?? {} });
    try {
      return json(await route(request, env), 200, cors ?? {});
    } catch (error) {
      if (isHttpError(error)) return json({ error: error.message }, error.status, cors ?? {});
      if (isValidationError(error)) return json({ error: error.message }, 400, cors ?? {});
      console.error('Request failed', error);
      return json({ error: 'The sync server could not complete the request.' }, 502, cors ?? {});
    }
  },
};

async function route(request: Request, env: Env): Promise<object> {
  if (!env.API_TOKEN || env.API_TOKEN.length < MIN_SECRET_LENGTH) throw httpError(500, 'The server is not configured.');
  const auth: AuthEnv = { secret: env.API_TOKEN, sessionSecret: env.SESSION_SECRET && env.SESSION_SECRET.length >= MIN_SECRET_LENGTH ? env.SESSION_SECRET : env.API_TOKEN, now: Date.now };
  const databaseName = env.MONGODB_DB || 'cyber_swiss_blade';
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  return withDatabase(parseMongoUri(env.MONGODB_URI), databaseName, connector, (database) => dispatch(database, request, segments, auth));
}

async function dispatch(database: MongoDatabase, request: Request, segments: readonly string[], auth: AuthEnv): Promise<object> {
  const { method } = request;
  const path = segments.join('/');
  if (method === 'GET' && path === 'status') {
    const body: StatusResponse = { ok: true, database: database.name, serverTime: new Date(auth.now()).toISOString(), setupRequired: await isSetupRequired(database) };
    return body;
  }
  if (method === 'POST' && path === 'auth/setup') return handleSetup(database, await readObject(request), auth);
  if (method === 'POST' && path === 'auth/login') return handleLogin(database, await readObject(request), auth);

  const context = await authenticate(database, request, auth);
  if (method === 'GET' && path === 'auth/me') return sessionResponse(database, context.user, auth);
  if (method === 'POST' && path === 'auth/password') return handlePassword(database, context, await readObject(request), auth);
  if (method === 'PUT' && path === 'auth/profile') return handleProfile(database, context, await readObject(request), auth);
  if (method === 'POST' && path === 'sync') {
    const syncRequest = parseSyncRequest(await readJson(request));
    return handleSync(database, syncRequest, auth.now, { userId: context.user.id, isAdmin: context.isAdmin, grants: context.grants });
  }
  if (segments[0] === 'admin') return handleAdmin(database, context, method, segments.slice(1), () => readObject(request), auth.now());
  throw httpError(404, 'Not found.');
}

function corsHeaders(origin: string | null, allowed: string): Record<string, string> | null {
  const origins = allowed.split(',').map((value) => value.trim());
  if (!origin || !origins.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function isValidationError(error: unknown): error is ValidationError {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'validation';
}
