import { describe, expect, it } from 'vitest';
import { base64ToBytes, bytesToBase64, concatBytes, isBase64Error, utf8Decode, utf8Encode } from './bytes';

describe('bytesToBase64', () => {
  it('encodes UTF-8 text the same way as btoa for ASCII', () => {
    expect(bytesToBase64(utf8Encode('hello world'))).toBe('aGVsbG8gd29ybGQ=');
  });

  it('produces URL-safe output without padding', () => {
    expect(bytesToBase64(Uint8Array.of(0xfb, 0xff, 0xbf), true)).toBe('-_-_');
    expect(bytesToBase64(utf8Encode('a'), true)).toBe('YQ');
  });

  it('handles inputs larger than one chunk', () => {
    const bytes = new Uint8Array(100_000).map((_, index) => index % 256);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });
});

describe('base64ToBytes', () => {
  it('accepts URL-safe input, whitespace, and missing padding', () => {
    expect(utf8Decode(base64ToBytes(' aGVs\nbG8 '))).toBe('hello');
    expect(base64ToBytes('-_-_')).toEqual(Uint8Array.of(0xfb, 0xff, 0xbf));
  });

  it('round-trips multi-byte characters', () => {
    const text = 'Sawubona, Ünïcödé ✓ 🚀';
    expect(utf8Decode(base64ToBytes(bytesToBase64(utf8Encode(text))))).toBe(text);
  });

  it('rejects lengths that cannot be Base64', () => {
    expect(() => base64ToBytes('A')).toThrow();
    expect(() => base64ToBytes('AAAAA')).toThrow();
    expect(() => base64ToBytes('AA===')).toThrow();
  });

  it('throws a typed error for invalid input', () => {
    expect.assertions(1);
    try {
      base64ToBytes('not base64!');
    } catch (error) {
      expect(isBase64Error(error)).toBe(true);
    }
  });
});

describe('concatBytes', () => {
  it('joins byte arrays in order', () => {
    expect(concatBytes([Uint8Array.of(1), Uint8Array.of(2, 3)])).toEqual(Uint8Array.of(1, 2, 3));
  });
});
