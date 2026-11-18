import { concatBytes, utf8Encode } from '../../../shared/bytes';
import { cryptoError, MIN_PASSWORD_LENGTH, uint16 } from './crypto';
import { sha256 } from './sha256';

// AES Crypt stream format version 2 (https://www.aescrypt.com/aes_file_format.html).
// Files are compatible with AES Crypt, pyAesCrypt, and the earlier JS AES File Encryption tool.

const SIGNATURE = [0x41, 0x45, 0x53];
const VERSION = 2;
const BLOCK = 16;
const KEY_BYTES = 32;
const HMAC_BYTES = 32;
const KDF_ROUNDS = 8192;
const MAX_PASSWORD_LENGTH = 1024;
const MAX_EXTENSIONS = 256;
const CREATED_BY = 'CREATED_BY';
const CONTAINER_BYTES = 128;

export const AESCRYPT_EXTENSION = '.aes';

// "AES", a known version (0, 1, or 2), and a zero reserved byte. A plain file that only starts with "AES" does not match.
export function isAesCrypt(bytes: Uint8Array): boolean {
  return bytes.length > 5 && SIGNATURE.every((byte, index) => bytes[index] === byte) && (bytes[3] ?? 0xff) <= VERSION && bytes[4] === 0;
}

export function aesCryptFileName(name: string): string {
  return `${name || 'file'}${AESCRYPT_EXTENSION}`;
}

export function plainFileName(name: string): string {
  return name.toLowerCase().endsWith(AESCRYPT_EXTENSION) ? name.slice(0, -AESCRYPT_EXTENSION.length) : `${name}.decrypted`;
}

export async function encryptAesCrypt(plain: Uint8Array<ArrayBuffer>, password: string): Promise<Uint8Array<ArrayBuffer>> {
  if (password.length < MIN_PASSWORD_LENGTH) throw cryptoError('weak-password', `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
  checkPasswordLength(password);
  const iv1 = random(BLOCK);
  const key1 = deriveKey(password, iv1);
  const iv2 = random(BLOCK);
  const key2 = random(KEY_BYTES);
  const sessionKeys = await encryptRaw(key1, iv1, concatBytes([iv2, key2]));
  const sessionHmac = await hmac(key1, sessionKeys);
  const remainder = plain.length % BLOCK;
  const padded = remainder === 0 ? plain : concatBytes([plain, new Uint8Array(BLOCK - remainder).fill(BLOCK - remainder)]);
  const ciphertext = await encryptRaw(key2, iv2, padded);
  const contentHmac = await hmac(key2, ciphertext);
  return concatBytes([header(), iv1, sessionKeys, sessionHmac, ciphertext, Uint8Array.of(remainder), contentHmac]);
}

export async function decryptAesCrypt(data: Uint8Array<ArrayBuffer>, password: string): Promise<Uint8Array<ArrayBuffer>> {
  if (!isAesCrypt(data)) throw cryptoError('invalid-format', 'This is not an AES Crypt file.');
  if (data[3] !== VERSION) throw cryptoError('invalid-format', 'Only AES Crypt version 2 files are supported.');
  if (data[4] !== 0) throw cryptoError('invalid-format', 'The file header is damaged.');
  checkPasswordLength(password);
  let position = skipExtensions(data, 5);
  const minimum = position + BLOCK + BLOCK + KEY_BYTES + HMAC_BYTES + 1 + HMAC_BYTES;
  if (data.length < minimum) throw cryptoError('invalid-format', 'The file is damaged.');

  const iv1 = data.slice(position, (position += BLOCK));
  const sessionKeys = data.slice(position, (position += BLOCK + KEY_BYTES));
  const sessionHmac = data.subarray(position, (position += HMAC_BYTES));
  const key1 = deriveKey(password, iv1);
  if (!equalBytes(await hmac(key1, sessionKeys), sessionHmac)) throw cryptoError('wrong-password', 'Wrong password, or the file was modified.');
  const session = await decryptRaw(key1, iv1, sessionKeys);
  const iv2 = session.slice(0, BLOCK);
  const key2 = session.slice(BLOCK);

  const ciphertext = data.subarray(position, data.length - 1 - HMAC_BYTES);
  const remainder = data[data.length - 1 - HMAC_BYTES] ?? 0;
  if (ciphertext.length % BLOCK !== 0 || remainder >= BLOCK) throw cryptoError('invalid-format', 'The file is damaged.');
  if (ciphertext.length === 0 && remainder !== 0) throw cryptoError('invalid-format', 'The file is damaged.');
  if (!equalBytes(await hmac(key2, ciphertext), data.subarray(data.length - HMAC_BYTES))) throw cryptoError('invalid-format', 'The file is damaged (bad HMAC).');
  const plain = await decryptRaw(key2, iv2, ciphertext);
  return remainder === 0 ? plain : plain.subarray(0, plain.length - (BLOCK - remainder));
}

function header(): Uint8Array<ArrayBuffer> {
  const createdBy = concatBytes([utf8Encode(CREATED_BY), Uint8Array.of(0), utf8Encode('Cyber Swiss Blade')]);
  return concatBytes([Uint8Array.from(SIGNATURE), Uint8Array.of(VERSION, 0), uint16(createdBy.length), createdBy, uint16(CONTAINER_BYTES), new Uint8Array(CONTAINER_BYTES), uint16(0)]);
}

function skipExtensions(data: Uint8Array, start: number): number {
  let position = start;
  for (let count = 0; count < MAX_EXTENSIONS; count += 1) {
    if (position + 2 > data.length) break;
    const length = ((data[position] ?? 0) << 8) | (data[position + 1] ?? 0);
    position += 2;
    if (length === 0) return position;
    position += length;
  }
  throw cryptoError('invalid-format', 'The file header is damaged.');
}

function checkPasswordLength(password: string): void {
  if (password.length === 0) throw cryptoError('weak-password', 'Enter the password.');
  if (password.length > MAX_PASSWORD_LENGTH) throw cryptoError('weak-password', `AES Crypt passwords have at most ${MAX_PASSWORD_LENGTH} characters.`);
}

function utf16le(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(text.length * 2);
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes[index * 2] = code & 0xff;
    bytes[index * 2 + 1] = code >> 8;
  }
  return bytes;
}

export function deriveKey(password: string, iv: Uint8Array): Uint8Array<ArrayBuffer> {
  const passwordBytes = utf16le(password);
  const buffer = new Uint8Array(KEY_BYTES + passwordBytes.length);
  buffer.set(iv);
  buffer.set(passwordBytes, KEY_BYTES);
  let digest = buffer.subarray(0, KEY_BYTES);
  for (let round = 0; round < KDF_ROUNDS; round += 1) {
    digest = sha256(buffer);
    buffer.set(digest);
  }
  return digest;
}

async function aesKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-CBC', false, ['encrypt', 'decrypt']);
}

// AES Crypt stores raw CBC blocks without PKCS#7 padding. Web Crypto always pads,
// so encryption drops the extra padding block, and decryption appends a valid one.
async function encryptRaw(raw: Uint8Array<ArrayBuffer>, iv: Uint8Array<ArrayBuffer>, plain: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const key = await aesKey(raw);
  const padded = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, plain));
  return padded.subarray(0, plain.length);
}

async function decryptRaw(raw: Uint8Array<ArrayBuffer>, iv: Uint8Array<ArrayBuffer>, ciphertext: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  if (ciphertext.length === 0) return new Uint8Array(0);
  const key = await aesKey(raw);
  const lastBlock = ciphertext.slice(ciphertext.length - BLOCK);
  const paddingBlock = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-CBC', iv: lastBlock }, key, new Uint8Array(0)));
  try {
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, concatBytes([ciphertext, paddingBlock])));
  } catch {
    throw cryptoError('invalid-format', 'The file is damaged.');
  }
}

async function hmac(raw: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return difference === 0;
}

function random(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}
