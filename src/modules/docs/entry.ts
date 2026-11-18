import { parseFrontMatter } from './front-matter';
import { parseMarkdown, plainText, type Block, type Heading } from './markdown';

export const CATEGORIES = [
  'C# and .NET',
  'ASP.NET and Blazor',
  '.NET MAUI',
  'Angular',
  'React',
  'TypeScript and JavaScript',
  'Flutter and Android',
  'Identity and APIs',
  'Dynamics 365',
  'DevOps and tools',
  'Systems and setup',
  'AI and design',
  'Reference',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ArticleEntry {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: string;
  readonly order: number;
  readonly minutes: number;
  readonly headings: readonly Heading[];
}

const WORDS_PER_MINUTE = 200;

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.md$/, '');
}

function countWords(blocks: readonly Block[]): number {
  let total = 0;
  for (const block of blocks) {
    if (block.type === 'heading' || block.type === 'paragraph') total += plainText(block.children).split(/\s+/).length;
    else if (block.type === 'code') total += block.text.split('\n').length;
    else if (block.type === 'list') total += block.items.reduce((sum, item) => sum + countWords(item.blocks), 0);
    else if (block.type === 'quote' || block.type === 'callout') total += countWords(block.blocks);
    else if (block.type === 'table') total += block.rows.length * block.head.length * 3;
  }
  return total;
}

export function buildEntry(slug: string, raw: string): ArticleEntry {
  const { meta, body } = parseFrontMatter(raw);
  const document = parseMarkdown(body);
  const order = Number.parseInt(meta.order ?? '', 10);
  return {
    slug,
    title: meta.title ?? slug,
    summary: meta.summary ?? '',
    category: meta.category ?? 'Reference',
    order: Number.isFinite(order) ? order : 999,
    minutes: Math.max(1, Math.round(countWords(document.blocks) / WORDS_PER_MINUTE)),
    headings: document.headings.filter((heading) => heading.level === 2 || heading.level === 3),
  };
}

export function isArticleEntry(value: unknown): value is ArticleEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.slug === 'string' &&
    typeof entry.title === 'string' &&
    typeof entry.summary === 'string' &&
    typeof entry.category === 'string' &&
    typeof entry.order === 'number' &&
    typeof entry.minutes === 'number' &&
    Array.isArray(entry.headings)
  );
}

export function sortEntries(entries: readonly ArticleEntry[]): ArticleEntry[] {
  const rank = (category: string): number => {
    const position = (CATEGORIES as readonly string[]).indexOf(category);
    return position < 0 ? CATEGORIES.length : position;
  };
  return [...entries].sort((a, b) => rank(a.category) - rank(b.category) || a.order - b.order || a.title.localeCompare(b.title));
}

function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}#+.]+/u).filter(Boolean);
}

export interface SearchHit {
  readonly entry: ArticleEntry;
  readonly heading: Heading | null;
  readonly score: number;
}

export function searchEntries(entries: readonly ArticleEntry[], query: string, limit = 40): SearchHit[] {
  const terms = tokens(query);
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const about = `${entry.summary} ${entry.category}`.toLowerCase();
    const heading = entry.headings.find((candidate) => terms.every((term) => candidate.text.toLowerCase().includes(term))) ?? null;
    let score = 0;
    let matched = true;
    for (const term of terms) {
      if (title.includes(term)) score += 10;
      else if (about.includes(term)) score += 4;
      else if (entry.headings.some((candidate) => candidate.text.toLowerCase().includes(term))) score += 2;
      else matched = false;
    }
    if (matched) hits.push({ entry, heading: score >= terms.length * 10 ? null : heading, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title)).slice(0, limit);
}
