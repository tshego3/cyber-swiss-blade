import { describe, expect, it } from 'vitest';
import { joinLines } from './convert';

describe('joinLines', () => {
  it('joins Windows, Unix, and old Mac line breaks with a space', () => {
    expect(joinLines('one\r\ntwo\nthree\rfour')).toEqual({ text: 'one two three four', lines: 4 });
  });

  it('uses the selected separator', () => {
    expect(joinLines('a\nb', 'none').text).toBe('ab');
    expect(joinLines('a\nb', 'comma').text).toBe('a, b');
  });

  it('drops blank lines and a final line break', () => {
    expect(joinLines('a\nb\n', 'comma')).toEqual({ text: 'a, b', lines: 2 });
    expect(joinLines('a\n\n  \nb', 'comma')).toEqual({ text: 'a, b', lines: 2 });
    expect(joinLines('')).toEqual({ text: '', lines: 0 });
  });
});
