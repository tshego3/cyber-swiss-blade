import { describe, expect, it } from 'vitest';
import { utf8Encode } from '../../../shared/bytes';
import { decryptBytes, decryptText, encryptBytes, encryptText, isCryptoError, isEncrypted } from './crypto';

const ITERATIONS = 100_000;
const PASSWORD = 'correct horse battery';

async function captureError(task: () => Promise<unknown>): Promise<unknown> {
  try {
    await task();
  } catch (error) {
    return error;
  }
  return null;
}

describe('file encryption', () => {
  it('round-trips bytes and the original file name', async () => {
    const plain = utf8Encode('secret report');
    const encrypted = await encryptBytes(plain, PASSWORD, 'report.txt', ITERATIONS);
    expect(isEncrypted(encrypted)).toBe(true);
    const decrypted = await decryptBytes(encrypted, PASSWORD);
    expect(decrypted.name).toBe('report.txt');
    expect(decrypted.bytes).toEqual(plain);
  });

  it('uses a fresh salt and IV for every encryption', async () => {
    const [first, second] = await Promise.all([encryptBytes(utf8Encode('x'), PASSWORD, '', ITERATIONS), encryptBytes(utf8Encode('x'), PASSWORD, '', ITERATIONS)]);
    expect(first).not.toEqual(second);
  });

  it('rejects a wrong password and tampered headers', async () => {
    const encrypted = await encryptBytes(utf8Encode('x'), PASSWORD, '', ITERATIONS);
    const wrong = await captureError(() => decryptBytes(encrypted, 'wrong password'));
    expect(isCryptoError(wrong) && wrong.type).toBe('wrong-password');
    const tampered = encrypted.slice();
    tampered[10] = (tampered[10] ?? 0) ^ 1;
    const modified = await captureError(() => decryptBytes(tampered, PASSWORD));
    expect(isCryptoError(modified) && modified.type).toBe('wrong-password');
  });

  it('rejects short passwords and foreign files', async () => {
    const weak = await captureError(() => encryptBytes(utf8Encode('x'), 'short', '', ITERATIONS));
    expect(isCryptoError(weak) && weak.type).toBe('weak-password');
    const foreign = await captureError(() => decryptBytes(utf8Encode('plain text file that is long enough to pass'), PASSWORD));
    expect(isCryptoError(foreign) && foreign.type).toBe('invalid-format');
  });
});

describe('text encryption', () => {
  it('round-trips Unicode text through Base64', async () => {
    const ciphertext = await encryptText('Hallo ✓ 🚀', PASSWORD, ITERATIONS);
    expect(await decryptText(ciphertext, PASSWORD)).toBe('Hallo ✓ 🚀');
  });
});
