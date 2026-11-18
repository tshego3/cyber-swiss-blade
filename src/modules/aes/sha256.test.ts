import { describe, expect, it } from 'vitest';
import { utf8Encode } from '../../../shared/bytes';
import { sha256 } from './sha256';

describe('sha256', () => {
  it('matches the FIPS 180-4 test vectors', () => {
    const hex = (bytes: Uint8Array): string => [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    expect(hex(sha256(utf8Encode('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(hex(sha256(new Uint8Array(0)))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches Web Crypto for every length from 0 to 200 bytes', async () => {
    for (let length = 0; length <= 200; length += 1) {
      const data = crypto.getRandomValues(new Uint8Array(length));
      expect(sha256(data)).toEqual(new Uint8Array(await crypto.subtle.digest('SHA-256', data)));
    }
  });
});
