import { describe, expect, it } from 'vitest';
import { legacyQueryRoute, parseQuery, parseRoute } from './router';

describe('router', () => {
  it('reads the section, path, and query from the hash', () => {
    expect(parseRoute('#/docs/library/it-studies')).toEqual({ section: 'docs', path: ['library', 'it-studies'], query: {} });
    expect(parseRoute('#/base64?token=a+b/c==&mode=x')).toEqual({ section: 'base64', path: [], query: { token: 'a+b/c==', mode: 'x' } });
    expect(parseRoute('')).toEqual({ section: '', path: [], query: {} });
  });

  it('decodes percent-encoded values and keeps plus signs', () => {
    expect(parseQuery('token=NjAw%2B%2F%3D%3D&flag')).toEqual({ token: 'NjAw+/==', flag: '' });
  });

  it('sends an old query link to the module that declares the key', () => {
    const targets = [{ id: 'docs' }, { id: 'base64', legacyQueryKeys: ['token'] }];
    expect(legacyQueryRoute('?token=MTYzMjUxMDI=', '', targets)).toBe('#/base64?token=MTYzMjUxMDI%3D');
    expect(legacyQueryRoute('?token=abc', '#/docs', targets)).toBeNull();
    expect(legacyQueryRoute('?other=1', '', targets)).toBeNull();
  });
});
