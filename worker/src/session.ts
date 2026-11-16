import { base64ToBytes, bytesToBase64, concatBytes, utf8Decode, utf8Encode } from '../../shared/bytes';
import { isJsonObject } from '../../shared/protocol';

export const TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  readonly sub: string;
  readonly ver: number;
  readonly exp: number;
}

export interface IssuedToken {
  readonly token: string;
  readonly expiresAt: string;
}

export async function issueToken(secret: string, userId: string, version: number, now: number): Promise<IssuedToken> {
  const payload: TokenPayload = { sub: userId, ver: version, exp: now + TOKEN_LIFETIME_MS };
  const body = bytesToBase64(utf8Encode(JSON.stringify(payload)), true);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), utf8Encode(body)));
  return { token: `${body}.${bytesToBase64(signature, true)}`, expiresAt: new Date(payload.exp).toISOString() };
}

export async function verifyToken(secret: string, token: string, now: number): Promise<TokenPayload | null> {
  const [body = '', signature = '', extra] = token.split('.');
  if (!body || !signature || extra !== undefined) return null;
  const signatureBytes = safeDecode(signature);
  if (!signatureBytes) return null;
  if (!(await crypto.subtle.verify('HMAC', await signingKey(secret), signatureBytes, utf8Encode(body)))) return null;
  const payload = parsePayload(safeDecode(body));
  return payload && payload.exp > now ? payload : null;
}

export function newSalt(): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function passwordVerifier(salt: string, passwordKey: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', concatBytes([base64ToBytes(salt), base64ToBytes(passwordKey)]));
  return bytesToBase64(new Uint8Array(digest));
}

export async function sameSecret(expected: string, provided: string): Promise<boolean> {
  const [left, right] = await Promise.all([sha256(expected), sha256(provided)]);
  let difference = provided.length === 0 ? 1 : 0;
  left.forEach((byte, index) => {
    difference |= byte ^ (right[index] ?? 0);
  });
  return difference === 0;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  const raw = await sha256(`csb-session:${secret}`);
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sha256(value: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', utf8Encode(value)));
}

function safeDecode(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    return base64ToBytes(value);
  } catch {
    return null;
  }
}

function parsePayload(bytes: Uint8Array | null): TokenPayload | null {
  if (!bytes) return null;
  try {
    const value: unknown = JSON.parse(utf8Decode(bytes));
    if (!isJsonObject(value) || typeof value.sub !== 'string' || typeof value.ver !== 'number' || typeof value.exp !== 'number') return null;
    return { sub: value.sub, ver: value.ver, exp: value.exp };
  } catch {
    return null;
  }
}
