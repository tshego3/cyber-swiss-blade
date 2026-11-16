import { base64ToBytes, bytesToBase64, utf8Encode } from '../../../shared/bytes';

const MIN_ITERATIONS = 4096;
const derivedKeys = new Map<string, DerivedKeys>();

export interface ScramStart {
  readonly message: string;
  readonly bare: string;
  readonly nonce: string;
}

export interface ScramFinal {
  readonly message: string;
  readonly serverSignature: string;
}

interface DerivedKeys {
  readonly clientKey: Uint8Array<ArrayBuffer>;
  readonly storedKey: Uint8Array<ArrayBuffer>;
  readonly serverKey: Uint8Array<ArrayBuffer>;
}

export interface ScramError {
  readonly type: 'auth';
  readonly message: string;
}

export function scramStart(username: string, nonce = bytesToBase64(crypto.getRandomValues(new Uint8Array(24)))): ScramStart {
  const bare = `n=${username.replace(/=/g, '=3D').replace(/,/g, '=2C')},r=${nonce}`;
  return { message: `n,,${bare}`, bare, nonce };
}

export async function scramFinal(password: string, start: ScramStart, serverFirst: string): Promise<ScramFinal> {
  const fields = parseFields(serverFirst);
  const nonce = fields.get('r') ?? '';
  const salt = fields.get('s') ?? '';
  const iterations = Number(fields.get('i'));
  if (!nonce.startsWith(start.nonce) || !salt || !Number.isInteger(iterations) || iterations < MIN_ITERATIONS) {
    throw scramError('The server sent an invalid SCRAM challenge.');
  }
  const keys = await deriveKeys(password.normalize('NFKC'), salt, iterations);
  const withoutProof = `c=biws,r=${nonce}`;
  const authMessage = utf8Encode(`${start.bare},${serverFirst},${withoutProof}`);
  const clientSignature = await hmac(keys.storedKey, authMessage);
  const proof = keys.clientKey.map((byte, index) => byte ^ (clientSignature[index] ?? 0));
  return {
    message: `${withoutProof},p=${bytesToBase64(proof)}`,
    serverSignature: bytesToBase64(await hmac(keys.serverKey, authMessage)),
  };
}

export function verifyServerFinal(serverFinal: string, expectedSignature: string): void {
  if (parseFields(serverFinal).get('v') !== expectedSignature) throw scramError('The server signature did not match.');
}

async function deriveKeys(password: string, salt: string, iterations: number): Promise<DerivedKeys> {
  const passwordHash = bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8Encode(password))));
  const cacheKey = `${salt}:${iterations}:${passwordHash}`;
  const keys = derivedKeys.get(cacheKey) ?? (await computeKeys(password, base64ToBytes(salt), iterations));
  derivedKeys.set(cacheKey, keys);
  return keys;
}

async function computeKeys(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<DerivedKeys> {
  const material = await crypto.subtle.importKey('raw', utf8Encode(password), 'PBKDF2', false, ['deriveBits']);
  const salted = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, 256));
  const clientKey = await hmac(salted, utf8Encode('Client Key'));
  return {
    clientKey,
    storedKey: new Uint8Array(await crypto.subtle.digest('SHA-256', clientKey)),
    serverKey: await hmac(salted, utf8Encode('Server Key')),
  };
}

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data));
}

function parseFields(message: string): Map<string, string> {
  return new Map(
    message.split(',').map((part): [string, string] => {
      const separator = part.indexOf('=');
      return [part.slice(0, separator), part.slice(separator + 1)];
    }),
  );
}

function scramError(message: string): ScramError {
  return { type: 'auth', message };
}
