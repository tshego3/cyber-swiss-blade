import { describe, expect, it } from 'vitest';
import { derivePasswordKey } from '../../shared/auth';
import { TOKEN_LIFETIME_MS, issueToken, passwordVerifier, sameSecret, verifyToken } from './session';

const SECRET = 'a-test-secret-that-is-long-enough-1234';
const NOW = Date.parse('2026-11-17T08:00:00.000Z');

describe('session tokens', () => {
  it('round-trips the user and version until expiry', async () => {
    const { token, expiresAt } = await issueToken(SECRET, 'user-1', 3, NOW);
    expect(Date.parse(expiresAt)).toBe(NOW + TOKEN_LIFETIME_MS);
    expect(await verifyToken(SECRET, token, NOW + 1000)).toEqual({ sub: 'user-1', ver: 3, exp: NOW + TOKEN_LIFETIME_MS });
    expect(await verifyToken(SECRET, token, NOW + TOKEN_LIFETIME_MS + 1)).toBeNull();
  });

  it('rejects a token signed with another secret or changed in transit', async () => {
    const { token } = await issueToken(SECRET, 'user-1', 1, NOW);
    expect(await verifyToken(`${SECRET}x`, token, NOW)).toBeNull();
    const [body = '', signature = ''] = token.split('.');
    const forged = `${btoa(JSON.stringify({ sub: 'admin', ver: 1, exp: NOW + 10_000 })).replace(/=+$/, '')}.${signature}`;
    expect(await verifyToken(SECRET, forged, NOW)).toBeNull();
    expect(await verifyToken(SECRET, `${body}.${signature}.extra`, NOW)).toBeNull();
    expect(await verifyToken(SECRET, 'garbage', NOW)).toBeNull();
  });
});

describe('password verifier', () => {
  it('matches only the same derived key and salt', async () => {
    const key = await derivePasswordKey('Admin', 'correct horse battery');
    expect(key).toBe(await derivePasswordKey(' admin ', 'correct horse battery'));
    const salt = 'AAAAAAAAAAAAAAAAAAAAAA==';
    const verifier = await passwordVerifier(salt, key);
    expect(await sameSecret(verifier, await passwordVerifier(salt, key))).toBe(true);
    expect(await sameSecret(verifier, await passwordVerifier(salt, await derivePasswordKey('admin', 'wrong password!')))).toBe(false);
    expect(await sameSecret(verifier, '')).toBe(false);
  });
});
