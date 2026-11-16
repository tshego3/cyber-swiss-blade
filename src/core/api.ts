import { isJsonObject, isRemoteRecord, type JsonValue, type StatusResponse, type SyncRequest, type SyncResponse } from '../../shared/protocol';
import { deleteMeta, getMeta, resetSyncState, setMeta } from './db';
import type { ApiConfig } from './types';

const CONFIG_KEY = 'api-config';
const TIMEOUT_MS = 20_000;

export type ApiErrorType = 'not-configured' | 'network' | 'unauthorized' | 'server' | 'invalid-response';

export interface ApiError {
  readonly type: ApiErrorType;
  readonly message: string;
  readonly status?: number;
}

const MESSAGES: Readonly<Record<ApiErrorType, string>> = {
  'not-configured': 'Sync is not configured.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'The API token was rejected.',
  server: 'The sync server returned an error.',
  'invalid-response': 'The sync server sent an unexpected response.',
};

export function isApiError(error: unknown): error is ApiError {
  return isJsonObject(error) && typeof error.type === 'string' && typeof error.message === 'string';
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
  if (!isJsonObject(value) || typeof value.baseUrl !== 'string' || typeof value.token !== 'string') return null;
  return { baseUrl: value.baseUrl, token: value.token };
}

export async function saveApiConfig(config: ApiConfig | null): Promise<void> {
  const previous = await loadApiConfig();
  if (previous?.baseUrl !== config?.baseUrl) await resetSyncState();
  if (!config) return deleteMeta(CONFIG_KEY);
  return setMeta(CONFIG_KEY, { baseUrl: config.baseUrl, token: config.token });
}

export async function fetchStatus(config: ApiConfig): Promise<StatusResponse> {
  const body = await request(config, '/status', { method: 'GET' });
  if (!isJsonObject(body) || body.ok !== true || typeof body.database !== 'string' || typeof body.serverTime !== 'string') {
    throw apiError('invalid-response');
  }
  return { ok: true, database: body.database, serverTime: body.serverTime };
}

export async function postSync(config: ApiConfig, payload: SyncRequest): Promise<SyncResponse> {
  const body = await request(config, '/sync', { method: 'POST', body: JSON.stringify(payload) });
  if (!isSyncResponse(body)) throw apiError('invalid-response');
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

async function request(config: ApiConfig, path: string, init: RequestInit): Promise<unknown> {
  const response = await fetchWithTimeout(`${config.baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
  });
  if (response.status === 401) throw apiError('unauthorized', response.status);
  if (!response.ok) throw apiError('server', response.status);
  try {
    return await response.json();
  } catch {
    throw apiError('invalid-response', response.status);
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw apiError('network');
  }
}

function apiError(type: ApiErrorType, status?: number): ApiError {
  return status === undefined ? { type, message: MESSAGES[type] } : { type, message: MESSAGES[type], status };
}
