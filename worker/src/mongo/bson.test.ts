import { describe, expect, it } from 'vitest';
import { decodeDocument, encodeDocument, type BsonDocument } from './bson';

describe('BSON', () => {
  it('encodes the canonical hello world document', () => {
    const bytes = encodeDocument({ hello: 'world' });
    expect([...bytes]).toEqual([0x16, 0, 0, 0, 0x02, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0, 0x06, 0, 0, 0, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0, 0]);
  });

  it('round-trips every supported value type', () => {
    const document: BsonDocument = {
      text: 'Ünïcödé ✓',
      small: 42,
      negative: -7,
      fraction: 1.25,
      large: 2 ** 40,
      long: 9007199254740993n,
      flag: true,
      empty: null,
      when: new Date('2026-11-16T10:00:00.000Z'),
      bytes: Uint8Array.of(1, 2, 3),
      nested: { list: [1, 'two', { three: 3 }] },
    };
    expect(decodeDocument(encodeDocument(document))).toEqual(document);
  });

  it('skips undefined fields', () => {
    expect(decodeDocument(encodeDocument({ a: 1, b: undefined }))).toEqual({ a: 1 });
  });

  it('rejects truncated input', () => {
    expect(() => decodeDocument(Uint8Array.of(0x20, 0, 0, 0, 0))).toThrow();
  });
});
