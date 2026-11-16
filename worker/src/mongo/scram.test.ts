import { describe, expect, it } from 'vitest';
import { scramFinal, scramStart, verifyServerFinal } from './scram';

describe('SCRAM-SHA-256 (RFC 7677 test vector)', () => {
  it('produces the expected client proof and server signature', async () => {
    const start = scramStart('user', 'rOprNGfwEbeRWgbNEkqO');
    expect(start.message).toBe('n,,n=user,r=rOprNGfwEbeRWgbNEkqO');
    const serverFirst = 'r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096';
    const final = await scramFinal('pencil', start, serverFirst);
    expect(final.message).toBe('c=biws,r=rOprNGfwEbeRWgbNEkqO%hvYDpWUa2RaTCAfuxFIlj)hNlF$k0,p=dHzbZapWIk4jUhN+Ute9ytag9zjfMHgsqmmiz7AndVQ=');
    expect(() => verifyServerFinal('v=6rriTRBi23WpRR/wtup+mMhUZUn/dB5nLTJRsjl95G4=', final.serverSignature)).not.toThrow();
  });

  it('escapes reserved characters in user names', () => {
    expect(scramStart('a=b,c', 'n').bare).toBe('n=a=3Db=2Cc,r=n');
  });

  it('rejects a server nonce that does not extend the client nonce', async () => {
    await expect(scramFinal('pencil', scramStart('user', 'abc'), 'r=xyz,s=W22ZaJ0SNY7soEsUEjb6gQ==,i=4096')).rejects.toMatchObject({ type: 'auth' });
  });
});
