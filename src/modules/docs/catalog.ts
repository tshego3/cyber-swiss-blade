import { parseFrontMatter } from './front-matter';
import { isArticleEntry, slugFromPath, sortEntries, type ArticleEntry } from './entry';

const ENTRIES = import.meta.glob<unknown>('./articles/*.md', { query: '?meta', import: 'default', eager: true });
const BODIES = import.meta.glob<string>('./articles/*.md', { query: '?raw', import: 'default' });

export const ARTICLES: readonly ArticleEntry[] = sortEntries(Object.values(ENTRIES).filter(isArticleEntry));

export function findArticle(slug: string): ArticleEntry | null {
  return ARTICLES.find((entry) => entry.slug === slug) ?? null;
}

export async function loadArticleBody(slug: string): Promise<string> {
  const loader = Object.entries(BODIES).find(([path]) => slugFromPath(path) === slug)?.[1];
  if (!loader) return '';
  return parseFrontMatter(await loader()).body;
}

export interface Neighbours {
  readonly previous: ArticleEntry | null;
  readonly next: ArticleEntry | null;
}

export function neighbours(slug: string): Neighbours {
  const index = ARTICLES.findIndex((entry) => entry.slug === slug);
  return { previous: ARTICLES[index - 1] ?? null, next: index < 0 ? null : (ARTICLES[index + 1] ?? null) };
}
