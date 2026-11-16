import { describe, expect, it } from 'vitest';
import { pickMechanism, scramPassword } from './client';
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

describe('SCRAM-SHA-1 (MongoDB auth spec test vector)', () => {
  it('produces the expected client proof and server signature', async () => {
    const start = scramStart('user', 'fyko+d2lbbFgONRv9qkxdawL');
    const serverFirst = 'r=fyko+d2lbbFgONRv9qkxdawLHo+Vgk7qvUOKUwuWLIWg4l/9SraGMHEE,s=rQ9ZY3MntBeuP3E1TDVC4w==,i=10000';
    const final = await scramFinal(scramPassword('user', 'pencil', 'SCRAM-SHA-1'), start, serverFirst, 'SCRAM-SHA-1');
    expect(final.message).toBe('c=biws,r=fyko+d2lbbFgONRv9qkxdawLHo+Vgk7qvUOKUwuWLIWg4l/9SraGMHEE,p=MC2T8BvbmWRckDw8oWl5IVghwCY=');
    expect(() => verifyServerFinal('v=UMWeI25JD1yNYZRMpZ4VHvhZ9e0=', final.serverSignature)).not.toThrow();
  });

  it('uses SCRAM-SHA-1 only when the server does not offer SCRAM-SHA-256', () => {
    expect(pickMechanism(['SCRAM-SHA-1'])).toBe('SCRAM-SHA-1');
    expect(pickMechanism(['SCRAM-SHA-1', 'SCRAM-SHA-256'])).toBe('SCRAM-SHA-256');
    expect(pickMechanism([])).toBe('SCRAM-SHA-256');
  });
});
