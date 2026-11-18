import { describe, expect, it } from 'vitest';
import { base64ToBytes, utf8Decode, utf8Encode } from '../../../shared/bytes';
import { aesCryptFileName, decryptAesCrypt, encryptAesCrypt, isAesCrypt, plainFileName } from './aescrypt';
import { isCryptoError } from './crypto';

const PASSWORD = 'correct horse battery';

// Made by an independent AES Crypt v2 implementation (Python hashlib + hmac + OpenSSL CLI).
const REFERENCE_PARTIAL_BLOCK =
  'QUVTAgAAEENSRUFURURfQlkAcHlyZWYAADTgK3JHX/xlKob8Ou9ARh3J0M4+j75TNZOVeZT2+8AX1XPDIe0X1PwBFyMnAFYAKfDbCL6shS5DFyao9g2PT1pVdjZ/BERQuLyXF4xyc6BEOasOn2BoM9nvmE7gWg17ilmxxHLW7u0rm3p4L87C8zqCmCxuhCbn+/QEoScBW9D21+p0+ZXsePtAniMoevXG6AG8bgUkyxAXRuPuooeE/zZ5Q0RjG8kAMVNQlhnqtC6naw==';
const REFERENCE_FULL_BLOCKS =
  'QUVTAgAAEENSRUFURURfQlkAcHlyZWYAAGXmcsIl0yAqn2Occe7IDef0MIUlH+s+8Cv8o5WSHTRgzIRFXnOZJAY68GJ12i0L2A2yDHEuZD5HdBQsveLoYzqcfGd61OURvfzvmBeyVpTeXY5GDO0mbjihGdrSAHh6L0E1QjW/qe1VlzGmc0+k5LypDjlz1Bv7RMJk54iSQJSbANCphCRsaqtifyH0wSEzD1nsU6zisAqTPeOmA1MvfSyi';

async function captureError(task: () => Promise<unknown>): Promise<unknown> {
  try {
    await task();
  } catch (error) {
    return error;
  }
  return null;
}

describe('AES Crypt v2', () => {
  it('decrypts files from an independent implementation', async () => {
    expect(utf8Decode(await decryptAesCrypt(base64ToBytes(REFERENCE_PARTIAL_BLOCK), PASSWORD))).toBe('Hello from the Python reference!!');
    expect(utf8Decode(await decryptAesCrypt(base64ToBytes(REFERENCE_FULL_BLOCKS), PASSWORD))).toBe('0123456789abcdef0123456789abcdef');
  });

  it('round-trips empty, partial, and full-block content', async () => {
    for (const text of ['', 'a', '0123456789abcdef', 'x'.repeat(1000)]) {
      const encrypted = await encryptAesCrypt(utf8Encode(text), PASSWORD);
      expect(isAesCrypt(encrypted)).toBe(true);
      expect(utf8Decode(await decryptAesCrypt(encrypted, PASSWORD))).toBe(text);
    }
  });

  it('rejects a wrong password and a modified file', async () => {
    const encrypted = await encryptAesCrypt(utf8Encode('secret'), PASSWORD);
    const wrong = await captureError(() => decryptAesCrypt(encrypted, 'not the password'));
    expect(isCryptoError(wrong) && wrong.type).toBe('wrong-password');
    const modified = encrypted.slice();
    modified[modified.length - 40] = (modified[modified.length - 40] ?? 0) ^ 1;
    const damaged = await captureError(() => decryptAesCrypt(modified, PASSWORD));
    expect(isCryptoError(damaged) && damaged.type).toBe('invalid-format');
  });

  it('does not treat a plain file that starts with "AES" as encrypted', () => {
    expect(isAesCrypt(utf8Encode('AES-256 rotation plan for 2027'))).toBe(false);
  });

  it('reports a damaged file instead of empty output', async () => {
    const encrypted = await encryptAesCrypt(new Uint8Array(0), PASSWORD);
    const tampered = encrypted.slice();
    tampered[tampered.length - 33] = 5;
    const error = await captureError(() => decryptAesCrypt(tampered, PASSWORD));
    expect(isCryptoError(error) && error.type).toBe('invalid-format');
  });

  it('names files like AES Crypt', () => {
    expect(aesCryptFileName('report.pdf')).toBe('report.pdf.aes');
    expect(plainFileName('report.pdf.aes')).toBe('report.pdf');
    expect(plainFileName('report.bin')).toBe('report.bin.decrypted');
  });
});
