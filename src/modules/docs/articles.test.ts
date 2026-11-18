import { describe, expect, it } from 'vitest';
import { ARTICLES } from './catalog';
import { buildEntry, isCategory, slugFromPath } from './entry';
import { parseFrontMatter } from './front-matter';
import { parseMarkdown, type Block, type Inline } from './markdown';

const SOURCES = import.meta.glob<string>('./articles/*.md', { query: '?raw', import: 'default', eager: true });
const ARTICLE_FILES = Object.entries(SOURCES).map(([path, raw]) => ({ slug: slugFromPath(path), raw }));
const HEADING_IDS = new Map(ARTICLE_FILES.map(({ slug, raw }) => [slug, new Set(parseMarkdown(parseFrontMatter(raw).body).headings.map((heading) => heading.id))]));

function inlineNodes(blocks: readonly Block[]): Inline[] {
  return blocks.flatMap((block): Inline[] => {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
        return flatten(block.children);
      case 'list':
        return block.items.flatMap((item) => inlineNodes(item.blocks));
      case 'quote':
      case 'callout':
        return inlineNodes(block.blocks);
      case 'table':
        return [...block.head, ...block.rows.flat()].flatMap(flatten);
      default:
        return [];
    }
  });
}

function flatten(nodes: readonly Inline[]): Inline[] {
  return nodes.flatMap((node) => ('children' in node ? [node, ...flatten(node.children)] : [node]));
}

describe('docs articles', () => {
  it('loads every article into the catalog', () => {
    expect(ARTICLES.map((entry) => entry.slug).sort()).toEqual(ARTICLE_FILES.map((file) => file.slug).sort());
  });

  for (const { slug, raw } of ARTICLE_FILES) {
    describe(slug, () => {
      const { meta, body } = parseFrontMatter(raw);
      const document = parseMarkdown(body);

      it('has valid front matter', () => {
        expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(meta.title, 'title').toBeTruthy();
        expect(meta.summary, 'summary').toBeTruthy();
        expect(isCategory(meta.category ?? ''), `category "${meta.category}"`).toBe(true);
        expect(meta.order ?? '', 'order').toMatch(/^\d+$/);
      });

      it('has one level 1 heading equal to the title', () => {
        const titles = document.blocks.filter((block) => block.type === 'heading' && block.level === 1);
        expect(titles).toHaveLength(1);
        expect(titles[0]?.type === 'heading' && titles[0].text).toBe(buildEntry(slug, raw).title);
      });

      it('uses no em or en dashes', () => {
        const lines = raw.split('\n').flatMap((line, index) => (/[–—]/.test(line) ? [`${index + 1}: ${line}`] : []));
        expect(lines).toEqual([]);
      });

      it('has no raw HTML outside code', () => {
        const html = inlineNodes(document.blocks).flatMap((node) => (node.type === 'text' && /<\/?(?:details|summary|a|br|div|img|p|table|tr|td|span)\b[^>]*>/i.test(node.text) ? [node.text] : []));
        expect(html).toEqual([]);
      });

      it('links only to articles and headings that exist', () => {
        const broken = inlineNodes(document.blocks).flatMap((node) => {
          if (node.type !== 'link') return [];
          if (node.href.startsWith('#')) return HEADING_IDS.get(slug)?.has(node.href.slice(1)) ? [] : [node.href];
          if (!node.href.startsWith('doc:')) return [];
          const [target = '', anchor] = node.href.slice(4).split('#');
          const ids = HEADING_IDS.get(target);
          if (!ids) return [node.href];
          return anchor && !ids.has(anchor) ? [node.href] : [];
        });
        expect(broken).toEqual([]);
      });
    });
  }
});
