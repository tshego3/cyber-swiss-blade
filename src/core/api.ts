import { isAdminUser, isModulePermission, isRoleRecord, isSessionResponse, type AdminUser, type ModulePermission, type RoleRecord, type SessionResponse } from '../../shared/auth';
import { isJsonObject, isRemoteRecord, type JsonObject, type JsonValue, type StatusResponse, type SyncRequest, type SyncResponse } from '../../shared/protocol';
import { deleteMeta, getMeta, resetSyncState, setMeta } from './db';
import type { ApiConfig } from './types';

const CONFIG_KEY = 'api-config';
const TIMEOUT_MS = 20_000;

export type ApiErrorType = 'not-configured' | 'signed-out' | 'network' | 'unauthorized' | 'forbidden' | 'conflict' | 'invalid' | 'locked' | 'server' | 'invalid-response';

export interface ApiError {
  readonly type: ApiErrorType;
  readonly message: string;
  readonly status?: number;
}

export interface ApiAuth {
  readonly baseUrl: string;
  readonly token: string;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

const MESSAGES: Readonly<Record<ApiErrorType, string>> = {
  'not-configured': 'Sync is not configured.',
  'signed-out': 'Sign in to sync.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'Your session has ended. Sign in again.',
  forbidden: 'You do not have permission to do this.',
  conflict: 'This conflicts with existing data.',
  invalid: 'The request was not valid.',
  locked: 'Too many attempts. Try again later.',
  server: 'The sync server returned an error.',
  'invalid-response': 'The sync server sent an unexpected response.',
};

const STATUS_TYPES: Readonly<Record<number, ApiErrorType>> = { 400: 'invalid', 401: 'unauthorized', 403: 'forbidden', 404: 'invalid', 409: 'conflict', 413: 'invalid', 429: 'locked' };

export function isApiError(error: unknown): error is ApiError {
  return isJsonObject(error) && typeof error.type === 'string' && typeof error.message === 'string';
}

export function apiError(type: ApiErrorType, status?: number, message = MESSAGES[type]): ApiError {
  return status === undefined ? { type, message } : { type, message, status };
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isApiError(error)) return error.message;
  console.error(error);
  return fallback;
}

export function normalizeBaseUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    const isLocal = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !isLocal) return null;
    return url.href.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export async function loadApiConfig(): Promise<ApiConfig | null> {
  const value = await getMeta(CONFIG_KEY);
  return isJsonObject(value) && typeof value.baseUrl === 'string' ? { baseUrl: value.baseUrl } : null;
}

export async function saveApiConfig(config: ApiConfig | null): Promise<void> {
  const previous = await loadApiConfig();
  if (previous?.baseUrl !== config?.baseUrl) await resetSyncState();
  if (!config) return deleteMeta(CONFIG_KEY);
  return setMeta(CONFIG_KEY, { baseUrl: config.baseUrl });
}

export async function fetchStatus(baseUrl: string): Promise<StatusResponse> {
  const body = await request(baseUrl, 'GET', '/status');
  if (!isJsonObject(body) || body.ok !== true || typeof body.database !== 'string' || typeof body.serverTime !== 'string' || typeof body.setupRequired !== 'boolean') {
    throw apiError('invalid-response');
  }
  return { ok: true, database: body.database, serverTime: body.serverTime, setupRequired: body.setupRequired };
}

export async function postSync(auth: ApiAuth, payload: SyncRequest): Promise<SyncResponse> {
  const body = await request(auth.baseUrl, 'POST', '/sync', payload, auth.token);
  if (!isSyncResponse(body)) throw apiError('invalid-response');
  return body;
}

export function postLogin(baseUrl: string, username: string, passwordKey: string): Promise<SessionResponse> {
  return session(request(baseUrl, 'POST', '/auth/login', { username, passwordKey }));
}

export function postSetup(baseUrl: string, body: JsonObject): Promise<SessionResponse> {
  return session(request(baseUrl, 'POST', '/auth/setup', body));
}

export function getMe(auth: ApiAuth): Promise<SessionResponse> {
  return session(request(auth.baseUrl, 'GET', '/auth/me', undefined, auth.token));
}

export function postPassword(auth: ApiAuth, currentKey: string, newKey: string): Promise<SessionResponse> {
  return session(request(auth.baseUrl, 'POST', '/auth/password', { currentKey, newKey }, auth.token));
}

export function putProfile(auth: ApiAuth, profile: JsonObject): Promise<SessionResponse> {
  return session(request(auth.baseUrl, 'PUT', '/auth/profile', profile, auth.token));
}

export const admin = {
  users: (auth: ApiAuth): Promise<AdminUser[]> => list(request(auth.baseUrl, 'GET', '/admin/users', undefined, auth.token), isAdminUser),
  createUser: (auth: ApiAuth, body: JsonObject): Promise<AdminUser> => one(request(auth.baseUrl, 'POST', '/admin/users', body, auth.token), isAdminUser),
  updateUser: (auth: ApiAuth, id: string, body: JsonObject): Promise<AdminUser> => one(request(auth.baseUrl, 'PUT', `/admin/users/${encodeURIComponent(id)}`, body, auth.token), isAdminUser),
  roles: (auth: ApiAuth): Promise<RoleRecord[]> => list(request(auth.baseUrl, 'GET', '/admin/roles', undefined, auth.token), isRoleRecord),
  createRole: (auth: ApiAuth, body: JsonObject): Promise<RoleRecord> => one(request(auth.baseUrl, 'POST', '/admin/roles', body, auth.token), isRoleRecord),
  updateRole: (auth: ApiAuth, id: string, body: JsonObject): Promise<RoleRecord> => one(request(auth.baseUrl, 'PUT', `/admin/roles/${encodeURIComponent(id)}`, body, auth.token), isRoleRecord),
  deleteRole: async (auth: ApiAuth, id: string): Promise<void> => {
    await request(auth.baseUrl, 'DELETE', `/admin/roles/${encodeURIComponent(id)}`, undefined, auth.token);
  },
  permissions: (auth: ApiAuth): Promise<ModulePermission[]> => list(request(auth.baseUrl, 'GET', '/admin/permissions', undefined, auth.token), isModulePermission),
  updatePermissions: (auth: ApiAuth, id: string, body: JsonObject): Promise<ModulePermission[]> =>
    list(request(auth.baseUrl, 'PUT', `/admin/permissions/${encodeURIComponent(id)}`, body, auth.token), isModulePermission),
};

async function session(pending: Promise<unknown>): Promise<SessionResponse> {
  const body = await pending;
  if (!isSessionResponse(body)) throw apiError('invalid-response');
  return body;
}

async function one<T>(pending: Promise<unknown>, guard: (value: unknown) => value is T): Promise<T> {
  const body = await pending;
  if (!guard(body)) throw apiError('invalid-response');
  return body;
}

async function list<T>(pending: Promise<unknown>, guard: (value: unknown) => value is T): Promise<T[]> {
  const body = await pending;
  if (!Array.isArray(body) || !body.every(guard)) throw apiError('invalid-response');
  return body;
}

function isSyncResponse(value: unknown): value is SyncResponse {
  if (!isJsonObject(value) || !isJsonObject(value.collections)) return false;
  return Object.values(value.collections).every(isCollectionResponse);
}

function isCollectionResponse(value: JsonValue): boolean {
  return (
    isJsonObject(value) &&
    typeof value.cursor === 'string' &&
    typeof value.hasMore === 'boolean' &&
    Array.isArray(value.records) &&
    value.records.every(isRemoteRecord)
  );
}

async function request(baseUrl: string, method: Method, path: string, body?: JsonObject | SyncRequest, token?: string): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetchWithTimeout(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const parsed: unknown = await response.json().catch(() => undefined);
  if (response.ok) {
    if (parsed === undefined) throw apiError('invalid-response', response.status);
    return parsed;
  }
  const type = STATUS_TYPES[response.status] ?? 'server';
  const serverMessage = type !== 'server' && isJsonObject(parsed) && typeof parsed.error === 'string' ? parsed.error : undefined;
  throw apiError(type, response.status, serverMessage);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw apiError('network');
  }
}
