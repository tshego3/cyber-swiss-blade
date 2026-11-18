import './docs.css';
import { el, replaceChildren, type Child } from '../../core/dom';
import { icon } from '../../core/icons';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, emptyState, errorState, loadingState } from '../../core/ui';
import { ARTICLES, findArticle, loadArticleBody, neighbours } from './catalog';
import { CATEGORIES, searchEntries, type ArticleEntry } from './entry';
import { parseMarkdown, type Heading } from './markdown';
import { renderBlocks } from './render';

export function mount(root: HTMLElement, context: ModuleContext): Unmount {
  const slug = context.path[0] ?? '';
  const anchor = context.path[1] ?? '';
  const cleanups: (() => void)[] = [];
  const article = slug ? findArticle(slug) : null;
  const content = el('div', { class: 'docs-content' });
  const layout = el('div', { class: 'docs', attrs: { 'data-page': slug ? 'article' : 'home' } }, [articleNav(slug, article?.category ?? ''), content]);
  root.append(layout);

  if (!slug) replaceChildren(content, homePage());
  else if (!article) replaceChildren(content, [notFound()]);
  else void showArticle(article, anchor, content, layout, cleanups);

  return () => {
    for (const cleanup of cleanups) cleanup();
    root.replaceChildren();
  };
}

async function showArticle(entry: ArticleEntry, anchor: string, content: HTMLElement, layout: HTMLElement, cleanups: (() => void)[]): Promise<void> {
  replaceChildren(content, [loadingState(`Loading ${entry.title}`)]);
  let body: string;
  try {
    body = await loadArticleBody(entry.slug);
  } catch (error) {
    console.error(`Docs article ${entry.slug} failed to load`, error);
    if (!content.isConnected) return;
    replaceChildren(content, [errorState('This article could not be loaded.', () => void showArticle(entry, anchor, content, layout, cleanups))]);
    return;
  }
  if (!content.isConnected) return;
  if (!body.trim()) {
    replaceChildren(content, [notFound()]);
    return;
  }
  const document = parseMarkdown(body);
  const blocks = document.blocks.filter((block) => !(block.type === 'heading' && block.level === 1));
  const headings = entry.headings;
  const scrollTo = (id: string): void => {
    if (!content.isConnected) return;
    const target = content.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
    history.replaceState(null, '', `#/docs/${entry.slug}/${encodeURIComponent(id)}`);
  };
  const toc = tableOfContents(entry.slug, headings, scrollTo);
  const articleElement = el('article', { class: 'doc-article' }, [
    articleHeader(entry),
    headings.length > 1 && toc.inline,
    el('div', { class: 'doc-body' }, renderBlocks(blocks, { slug: entry.slug, onAnchor: scrollTo })),
    articleFooter(entry),
  ]);
  replaceChildren(content, [articleElement]);
  if (headings.length > 1) {
    layout.append(toc.aside);
    cleanups.push(trackActiveHeading(content, toc.links));
  }
  if (anchor) requestAnimationFrame(() => scrollTo(anchor));
}

function articleHeader(entry: ArticleEntry): HTMLElement {
  return el('header', { class: 'doc-header' }, [
    el('nav', { class: 'doc-breadcrumb', attrs: { 'aria-label': 'Breadcrumb' } }, [
      el('a', { text: 'Docs', attrs: { href: '#/docs' } }),
      el('span', { class: 'doc-breadcrumb-sep', text: '/', attrs: { 'aria-hidden': 'true' } }),
      el('span', { text: entry.category }),
    ]),
    el('h1', { class: 'doc-title', text: entry.title }),
    el('p', { class: 'doc-meta' }, [el('span', { text: `${entry.minutes} min read` })]),
  ]);
}

function articleFooter(entry: ArticleEntry): HTMLElement {
  const { previous, next } = neighbours(entry.slug);
  const card = (target: ArticleEntry | null, label: string, direction: 'previous' | 'next'): Child =>
    target &&
    el('a', { class: `doc-pager-link doc-pager-${direction}`, attrs: { href: `#/docs/${target.slug}` } }, [
      el('span', { class: 'doc-pager-label' }, [direction === 'previous' && icon('chevron-left', 14), el('span', { text: label }), direction === 'next' && icon('chevron-right', 14)]),
      el('span', { class: 'doc-pager-title', text: target.title }),
    ]);
  return el('nav', { class: 'doc-pager', attrs: { 'aria-label': 'More articles' } }, [card(previous, 'Previous', 'previous'), card(next, 'Next', 'next')]);
}

interface TableOfContents {
  readonly aside: HTMLElement;
  readonly inline: HTMLElement;
  readonly links: ReadonlyMap<string, readonly HTMLAnchorElement[]>;
}

function tableOfContents(slug: string, headings: readonly Heading[], scrollTo: (id: string) => void): TableOfContents {
  const links = new Map<string, HTMLAnchorElement[]>();
  const list = (onPick?: () => void): HTMLUListElement =>
    el(
      'ul',
      { class: 'toc-list' },
      headings.map((heading) => {
        const anchor = el('a', {
          class: `toc-link toc-level-${heading.level}`,
          text: heading.text,
          attrs: { href: `#/docs/${slug}/${encodeURIComponent(heading.id)}` },
          on: { click: (event) => {
            event.preventDefault();
            onPick?.();
            scrollTo(heading.id);
          } },
        });
        links.set(heading.id, [...(links.get(heading.id) ?? []), anchor]);
        return el('li', {}, [anchor]);
      }),
    );
  const aside = el('aside', { class: 'docs-toc', attrs: { 'aria-label': 'In this article' } }, [el('p', { class: 'docs-toc-title', text: 'In this article' }), list()]);
  const panelId = `toc-${crypto.randomUUID()}`;
  const toggle = el('button', { class: 'disclosure', attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId } }, [icon('list', 16), el('span', { text: 'In this article' }), icon('chevron-down', 16)]);
  const panel = el('div', { class: 'disclosure-panel', attrs: { id: panelId, hidden: true } });
  const close = (): void => setOpen(toggle, panel, false);
  panel.append(list(close));
  toggle.addEventListener('click', () => setOpen(toggle, panel, toggle.getAttribute('aria-expanded') !== 'true'));
  const inline = el('nav', { class: 'docs-toc-inline', attrs: { 'aria-label': 'In this article' } }, [toggle, panel]);
  return { aside, inline, links };
}

function setOpen(toggle: HTMLButtonElement, panel: HTMLElement, open: boolean): void {
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
}

function trackActiveHeading(content: HTMLElement, links: ReadonlyMap<string, readonly HTMLAnchorElement[]>): () => void {
  const targets = [...links.keys()].map((id) => content.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`)).filter((target): target is HTMLElement => target !== null);
  const visible = new Set<string>();
  let active = '';
  const setActive = (id: string): void => {
    if (id === active) return;
    for (const anchor of links.get(active) ?? []) anchor.removeAttribute('aria-current');
    active = id;
    for (const anchor of links.get(active) ?? []) anchor.setAttribute('aria-current', 'location');
  };
  const observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (record.isIntersecting) visible.add(record.target.id);
        else visible.delete(record.target.id);
      }
      const first = targets.find((target) => visible.has(target.id));
      if (first) {
        setActive(first.id);
        return;
      }
      const above = targets.filter((target) => target.getBoundingClientRect().top < 0).pop();
      if (above) setActive(above.id);
    },
    { rootMargin: '-64px 0px -60% 0px' },
  );
  for (const target of targets) observer.observe(target);
  return () => observer.disconnect();
}

function articleNav(currentSlug: string, currentCategory: string): HTMLElement {
  const panelId = `docs-nav-${crypto.randomUUID()}`;
  const search = el('input', { class: 'input docs-search', attrs: { type: 'search', placeholder: 'Filter articles', 'aria-label': 'Filter articles', autocomplete: 'off', spellcheck: 'false' } });
  const results = el('div', { class: 'docs-nav-tree' });
  const toggle = el('button', { class: 'disclosure', attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId } }, [icon('book', 16), el('span', { text: currentCategory || 'Browse articles' }), icon('chevron-down', 16)]);
  const panel = el('div', { class: 'docs-nav-panel', attrs: { id: panelId } }, [search, results]);
  toggle.addEventListener('click', () => {
    const open = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  const render = (): void => {
    const query = search.value.trim();
    if (query) {
      const hits = searchEntries(ARTICLES, query);
      replaceChildren(results, [
        hits.length === 0
          ? el('p', { class: 'docs-nav-empty', text: 'No articles match.' })
          : el(
              'ul',
              { class: 'docs-nav-list' },
              hits.map((hit) =>
                el('li', {}, [
                  el('a', { class: 'docs-nav-link', attrs: { href: hit.heading ? `#/docs/${hit.entry.slug}/${encodeURIComponent(hit.heading.id)}` : `#/docs/${hit.entry.slug}`, 'aria-current': hit.entry.slug === currentSlug ? 'page' : undefined } }, [
                    el('span', { text: hit.entry.title }),
                    el('span', { class: 'docs-nav-hint', text: hit.heading ? hit.heading.text : hit.entry.category }),
                  ]),
                ]),
              ),
            ),
      ]);
      return;
    }
    replaceChildren(results, categoryGroups().map(([category, entries]) => {
      const group = el('details', { class: 'docs-nav-group', attrs: { open: category === currentCategory || !currentSlug } }, [
        el('summary', {}, [el('span', { text: category }), el('span', { class: 'docs-nav-count', text: String(entries.length) })]),
        el(
          'ul',
          { class: 'docs-nav-list' },
          entries.map((entry) => el('li', {}, [el('a', { class: 'docs-nav-link', text: entry.title, attrs: { href: `#/docs/${entry.slug}`, 'aria-current': entry.slug === currentSlug ? 'page' : undefined } })])),
        ),
      ]);
      return group;
    }));
  };
  search.addEventListener('input', render);
  render();
  requestAnimationFrame(() => results.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' }));
  return el('aside', { class: 'docs-nav', attrs: { 'aria-label': 'Articles' } }, [toggle, panel]);
}

function categoryGroups(): [string, ArticleEntry[]][] {
  const groups = new Map<string, ArticleEntry[]>();
  for (const entry of ARTICLES) groups.set(entry.category, [...(groups.get(entry.category) ?? []), entry]);
  return [...groups.entries()];
}

function homePage(): Child[] {
  const groups = categoryGroups();
  const known = new Set<string>(CATEGORIES);
  return [
    el('header', { class: 'doc-header' }, [
      el('h1', { class: 'doc-title', text: 'Docs' }),
      el('p', { class: 'doc-lead', text: `${ARTICLES.length} guides, cheat sheets, and code samples. The text works offline.` }),
    ]),
    ARTICLES.length === 0
      ? emptyState({ icon: 'book', title: 'No articles yet', text: 'Add Markdown files to src/modules/docs/articles.' })
      : el(
          'div',
          { class: 'docs-hub' },
          groups.map(([category, entries]) =>
            el('section', { class: 'card docs-hub-card' }, [
              el('h2', { class: 'docs-hub-title', text: known.has(category) ? category : `${category} (unknown category)` }),
              el(
                'ul',
                { class: 'docs-hub-list' },
                entries.map((entry) => el('li', {}, [el('a', { attrs: { href: `#/docs/${entry.slug}`, title: entry.summary } }, [el('span', { class: 'docs-hub-link', text: entry.title }), el('span', { class: 'docs-hub-summary', text: entry.summary })])])),
              ),
            ]),
          ),
        ),
  ];
}

function notFound(): HTMLElement {
  const back = button({ label: 'All articles', icon: 'book', onClick: () => (window.location.hash = '#/docs') });
  return emptyState({ icon: 'book', title: 'Article not found', text: 'This article does not exist or has a new name.', action: back });
}

