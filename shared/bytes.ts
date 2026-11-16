const CHUNK_SIZE = 0x8000;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*$/;

export interface Base64Error {
  readonly type: 'invalid-base64';
  readonly message: string;
}

export function utf8Encode(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  const parts: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    parts.push(String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE)));
  }
  const base64 = btoa(parts.join(''));
  return urlSafe ? base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : base64;
}

export function base64ToBytes(input: string): Uint8Array<ArrayBuffer> {
  const unpadded = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/={0,2}$/, '');
  if (!BASE64_PATTERN.test(unpadded) || unpadded.length % 4 === 1) {
    throw invalidBase64();
  }
  const binary = atob(unpadded.padEnd(Math.ceil(unpadded.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function isBase64Error(error: unknown): error is Base64Error {
  return typeof error === 'object' && error !== null && 'type' in error && error.type === 'invalid-base64';
}

export function concatBytes(parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function invalidBase64(): Base64Error {
  return { type: 'invalid-base64', message: 'The input is not valid Base64.' };
}
