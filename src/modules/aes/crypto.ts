import { base64ToBytes, bytesToBase64, concatBytes, utf8Decode, utf8Encode } from '../../../shared/bytes';

const MAGIC = utf8Encode('CSB1');
const SALT_BYTES = 16;
const IV_BYTES = 12;
const HEADER_BYTES = MAGIC.length + 4 + SALT_BYTES + IV_BYTES;
const NAME_LENGTH_BYTES = 2;
const MAX_NAME_BYTES = 0xffff;
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 10_000_000;

export const DEFAULT_ITERATIONS = 600_000;
export const MIN_PASSWORD_LENGTH = 8;
export const ENCRYPTED_EXTENSION = '.csb';

export type CryptoErrorType = 'invalid-format' | 'wrong-password' | 'weak-password';

export interface CryptoError {
  readonly type: CryptoErrorType;
  readonly message: string;
}

export interface DecryptedFile {
  readonly name: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

export function isCryptoError(error: unknown): error is CryptoError {
  return typeof error === 'object' && error !== null && 'type' in error && 'message' in error;
}

export function isEncrypted(bytes: Uint8Array): boolean {
  return bytes.length > HEADER_BYTES && MAGIC.every((byte, index) => bytes[index] === byte);
}

export async function encryptBytes(plain: Uint8Array, password: string, name = '', iterations = DEFAULT_ITERATIONS): Promise<Uint8Array<ArrayBuffer>> {
  if (password.length < MIN_PASSWORD_LENGTH) throw cryptoError('weak-password', `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  const nameBytes = utf8Encode(name).subarray(0, MAX_NAME_BYTES);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const header = concatBytes([MAGIC, uint32(iterations), salt, iv]);
  const payload = concatBytes([uint16(nameBytes.length), nameBytes, plain]);
  const key = await deriveKey(password, salt, iterations);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: header }, key, payload);
  return concatBytes([header, new Uint8Array(ciphertext)]);
}

export async function decryptBytes(data: Uint8Array, password: string): Promise<DecryptedFile> {
  if (!isEncrypted(data)) throw cryptoError('invalid-format', 'This is not a Cyber Swiss Blade encrypted file.');
  const header = data.slice(0, HEADER_BYTES);
  const iterations = new DataView(header.buffer).getUint32(MAGIC.length);
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) throw cryptoError('invalid-format', 'The file header is damaged.');
  const salt = header.slice(MAGIC.length + 4, MAGIC.length + 4 + SALT_BYTES);
  const iv = header.slice(HEADER_BYTES - IV_BYTES);
  const key = await deriveKey(password, salt, iterations);
  const payload = await decryptPayload(key, iv, header, data.slice(HEADER_BYTES));
  const nameLength = new DataView(payload.buffer).getUint16(0);
  return {
    name: utf8Decode(payload.subarray(NAME_LENGTH_BYTES, NAME_LENGTH_BYTES + nameLength)),
    bytes: payload.slice(NAME_LENGTH_BYTES + nameLength),
  };
}

export async function encryptText(text: string, password: string, iterations = DEFAULT_ITERATIONS): Promise<string> {
  return bytesToBase64(await encryptBytes(utf8Encode(text), password, '', iterations));
}

export async function decryptText(base64: string, password: string): Promise<string> {
  let data: Uint8Array;
  try {
    data = base64ToBytes(base64);
  } catch {
    throw cryptoError('invalid-format', 'The ciphertext is not valid Base64.');
  }
  return utf8Decode((await decryptBytes(data, password)).bytes);
}

export function encryptedFileName(name: string): string {
  return `${name || 'file'}${ENCRYPTED_EXTENSION}`;
}

async function decryptPayload(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, header: Uint8Array<ArrayBuffer>, ciphertext: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: header }, key, ciphertext));
  } catch {
    throw cryptoError('wrong-password', 'Wrong password, or the file was modified.');
  }
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', utf8Encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function uint32(value: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

export function uint16(value: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value);
  return bytes;
}

export function cryptoError(type: CryptoErrorType, message: string): CryptoError {
  return { type, message };
}
