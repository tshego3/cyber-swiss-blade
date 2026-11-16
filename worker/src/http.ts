import { isJsonObject, type JsonObject, type JsonValue } from '../../shared/protocol';

const MAX_BODY_BYTES = 1_000_000;

export interface HttpError {
  readonly type: 'http';
  readonly status: number;
  readonly message: string;
}

export function httpError(status: number, message: string): HttpError {
  return { type: 'http', status, message };
}

export function isHttpError(error: unknown): error is HttpError {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'http';
}

export function json(body: JsonValue | object, status: number, headers: Readonly<Record<string, string>>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > MAX_BODY_BYTES) throw httpError(413, 'Request body is too large.');
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw httpError(413, 'Request body is too large.');
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, 'Request body is not valid JSON.');
  }
}

export async function readObject(request: Request): Promise<JsonObject> {
  const body = await readJson(request);
  if (!isJsonObject(body)) throw httpError(400, 'Request body must be a JSON object.');
  return body;
}

export function text(body: JsonObject, key: string, maxLength: number, required = true): string {
  const value = body[key];
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.length > maxLength || (required && value.trim() === '')) throw httpError(400, `The field ${key} is not valid.`);
  return value.trim();
}

export function bearerToken(request: Request): string {
  const header = request.headers.get('Authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}
