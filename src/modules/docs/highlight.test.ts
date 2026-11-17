import { describe, expect, it } from 'vitest';
import { highlight } from './highlight';

describe('highlight', () => {
  it('keeps the full text', () => {
    const code = 'public class A { // note\n  string s = "x"; int n = 42; }';
    expect(highlight(code, 'csharp').map((token) => token.text).join('')).toBe(code);
  });

  it('marks keywords, strings, comments, and numbers', () => {
    const kinds = highlight('const a = "b"; // c\nlet n = 1;', 'ts').filter((token) => token.kind !== 'plain');
    expect(kinds.map((token) => [token.kind, token.text])).toEqual([
      ['keyword', 'const'],
      ['string', '"b"'],
      ['comment', '// c'],
      ['keyword', 'let'],
      ['number', '1'],
    ]);
  });

  it('marks markup tags and attributes', () => {
    const kinds = highlight('<Label Text="Hi" />', 'xml').map((token) => token.kind);
    expect(kinds).toContain('tag');
    expect(kinds).toContain('attr');
    expect(kinds).toContain('string');
  });

  it('returns plain text for unknown languages', () => {
    expect(highlight('anything', 'text')).toEqual([{ kind: 'plain', text: 'anything' }]);
  });
});
