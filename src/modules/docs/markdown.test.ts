import { describe, expect, it } from 'vitest';
import { parseFrontMatter } from './front-matter';
import { headingId, parseInline, parseMarkdown, type Block } from './markdown';

function first(source: string): Block | undefined {
  return parseMarkdown(source).blocks[0];
}

describe('front matter', () => {
  it('reads keys and returns the body', () => {
    const result = parseFrontMatter('---\ntitle: A: B\norder: 20\n---\n# A: B\n\nText');
    expect(result.meta).toEqual({ title: 'A: B', order: '20' });
    expect(result.body).toBe('# A: B\n\nText');
  });

  it('returns the full text when there is no front matter', () => {
    expect(parseFrontMatter('# Title').body).toBe('# Title');
  });
});

describe('markdown blocks', () => {
  it('makes GitHub style heading IDs and keeps them unique', () => {
    expect(headingId('Create the C# service')).toBe('create-the-c-service');
    const document = parseMarkdown('## Setup\n\n## Setup');
    expect(document.headings.map((heading) => heading.id)).toEqual(['setup', 'setup-1']);
  });

  it('reads fenced code with a language and keeps the content', () => {
    expect(first('```csharp\nvar a = 1;\n\nvar b = 2;\n```')).toEqual({ type: 'code', lang: 'csharp', text: 'var a = 1;\n\nvar b = 2;' });
  });

  it('reads nested lists and code inside list items', () => {
    const block = first('1. Run this:\n   ```bash\n   npm ci\n   ```\n2. Then:\n   - a\n   - b\n3. Done');
    expect(block?.type).toBe('list');
    if (block?.type !== 'list') return;
    expect(block.items).toHaveLength(3);
    expect(block.items[0]?.blocks[1]).toEqual({ type: 'code', lang: 'bash', text: 'npm ci' });
    expect(block.items[1]?.blocks[1]?.type).toBe('list');
  });

  it('keeps an ordered list going over blank lines', () => {
    const block = first('1. One\n\n2. Two\n\nAfter');
    expect(block?.type === 'list' && block.items.length).toBe(2);
  });

  it('reads task items', () => {
    const block = first('- [x] Done\n- [ ] Open');
    expect(block?.type === 'list' && block.items.map((item) => item.checked)).toEqual([true, false]);
  });

  it('reads tables with alignment and escaped pipes', () => {
    const block = first('| A | B |\n| :-- | --: |\n| `a \\| b` | 2 |');
    expect(block?.type).toBe('table');
    if (block?.type !== 'table') return;
    expect(block.align).toEqual(['left', 'right']);
    expect(block.rows[0]?.[0]).toEqual([{ type: 'code', text: 'a | b' }]);
  });

  it('turns labelled blockquotes into callouts', () => {
    const block = first('> **WARNING:** Keep the key secret.');
    expect(block).toEqual({ type: 'callout', kind: 'warning', blocks: [{ type: 'paragraph', children: [{ type: 'text', text: 'Keep the key secret.' }] }] });
    expect(first('> Plain quote')?.type).toBe('quote');
  });
});

describe('markdown inline', () => {
  it('reads emphasis, code, and links', () => {
    expect(parseInline('**bold** and *em* with `x*y` [link](doc:abc#top)')).toEqual([
      { type: 'strong', children: [{ type: 'text', text: 'bold' }] },
      { type: 'text', text: ' and ' },
      { type: 'em', children: [{ type: 'text', text: 'em' }] },
      { type: 'text', text: ' with ' },
      { type: 'code', text: 'x*y' },
      { type: 'text', text: ' ' },
      { type: 'link', href: 'doc:abc#top', children: [{ type: 'text', text: 'link' }] },
    ]);
  });

  it('does not treat snake_case or spaced asterisks as emphasis', () => {
    expect(parseInline('my_var_name and 2 * 3 * 4')).toEqual([{ type: 'text', text: 'my_var_name and 2 * 3 * 4' }]);
  });

  it('links bare URLs without trailing punctuation', () => {
    expect(parseInline('See https://example.com/a.')).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'link', href: 'https://example.com/a', children: [{ type: 'text', text: 'https://example.com/a' }] },
      { type: 'text', text: '.' },
    ]);
  });

  it('reads images and escapes', () => {
    expect(parseInline('![Alt](https://x.dev/a.png) \\*not em\\*')).toEqual([
      { type: 'image', src: 'https://x.dev/a.png', alt: 'Alt' },
      { type: 'text', text: ' *not em*' },
    ]);
  });
});

describe('markdown review fixes', () => {
  it('reads bold italic', () => {
    expect(parseInline('***both***')).toEqual([{ type: 'strong', children: [{ type: 'em', children: [{ type: 'text', text: 'both' }] }] }]);
  });

  it('does not repeat heading IDs when a heading text ends in a number', () => {
    const ids = parseMarkdown('## Hello\n\n## Hello\n\n## Hello 1').headings.map((heading) => heading.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('does not start underscore emphasis inside a word after inline code', () => {
    expect(parseInline('`x`a_y_ z').some((node) => node.type === 'em')).toBe(false);
  });
});
