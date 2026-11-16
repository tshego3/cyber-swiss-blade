import { base64ToBytes, bytesToBase64, isBase64Error, utf8Decode, utf8Encode } from '../../../shared/bytes';

const DATA_URL_PATTERN = /^data:([^;,]*)(?:;[^,]*)?;base64,/i;

export type ConversionResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

export interface DecodedFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly mimeType: string;
}

export function encodeText(text: string, urlSafe: boolean): string {
  return bytesToBase64(utf8Encode(text), urlSafe);
}

export function decodeText(base64: string): ConversionResult {
  try {
    return { ok: true, value: utf8Decode(base64ToBytes(stripDataUrl(base64).payload)) };
  } catch (error) {
    return { ok: false, error: isBase64Error(error) ? error.message : 'The decoded bytes are not UTF-8 text. Use the Files tab instead.' };
  }
}

export function toDataUrl(base64: string, mimeType: string): string {
  return `data:${mimeType || 'application/octet-stream'};base64,${base64}`;
}

export function decodeFile(input: string): DecodedFile {
  const { payload, mimeType } = stripDataUrl(input);
  return { bytes: base64ToBytes(payload), mimeType };
}

function stripDataUrl(input: string): { readonly payload: string; readonly mimeType: string } {
  const trimmed = input.trim();
  const match = DATA_URL_PATTERN.exec(trimmed);
  return match ? { payload: trimmed.slice(match[0].length), mimeType: match[1] || 'application/octet-stream' } : { payload: trimmed, mimeType: 'application/octet-stream' };
}
