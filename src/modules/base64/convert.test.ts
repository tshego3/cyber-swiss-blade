import { describe, expect, it } from 'vitest';
import { decodeFile, decodeText, encodeText, toDataUrl } from './convert';

describe('text conversion', () => {
  it('encodes and decodes UTF-8 text', () => {
    expect(encodeText('✓ ok', false)).toBe('4pyTIG9r');
    expect(decodeText('4pyTIG9r')).toEqual({ ok: true, value: '✓ ok' });
  });

  it('decodes the payload of a data URL', () => {
    expect(decodeText('data:text/plain;charset=utf-8;base64,aGk=')).toEqual({ ok: true, value: 'hi' });
  });

  it('reports invalid Base64 and binary content', () => {
    expect(decodeText('###').ok).toBe(false);
    expect(decodeText('/w==').ok).toBe(false);
  });
});

describe('file conversion', () => {
  it('reads the MIME type from data URLs', () => {
    const file = decodeFile(toDataUrl('iVBORw==', 'image/png'));
    expect(file.mimeType).toBe('image/png');
    expect(file.bytes).toEqual(Uint8Array.of(0x89, 0x50, 0x4e, 0x47));
  });

  it('defaults to application/octet-stream for raw Base64', () => {
    expect(decodeFile('AAE=').mimeType).toBe('application/octet-stream');
  });
});
