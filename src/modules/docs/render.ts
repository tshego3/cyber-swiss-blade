import { el, type Child } from '../../core/dom';
import { icon, type IconName } from '../../core/icons';
import { copyToClipboard } from '../../core/ui';
import { highlight } from './highlight';
import type { Block, CalloutKind, Inline, ListItem } from './markdown';

export interface RenderOptions {
  readonly slug: string;
  readonly onAnchor: (id: string) => void;
}

const CALLOUT_LABELS: Readonly<Record<CalloutKind, string>> = { note: 'Note', tip: 'Tip', important: 'Important', warning: 'Warning', caution: 'Caution' };
const CALLOUT_ICONS: Readonly<Record<CalloutKind, IconName>> = { note: 'info', tip: 'info', important: 'info', warning: 'alert', caution: 'alert' };

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  csharp: 'C#',
  cs: 'C#',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  xpp: 'X++',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Zsh',
  cmd: 'Command Prompt',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  sql: 'SQL',
  tsql: 'T-SQL',
  xml: 'XML',
  xaml: 'XAML',
  html: 'HTML',
  razor: 'Razor',
  cshtml: 'Razor',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  jsonc: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  dart: 'Dart',
  kotlin: 'Kotlin',
  swift: 'Swift',
  java: 'Java',
  python: 'Python',
  php: 'PHP',
  dockerfile: 'Dockerfile',
  ini: 'INI',
  toml: 'TOML',
  http: 'HTTP',
  text: 'Text',
};

export function languageLabel(lang: string): string {
  return LANGUAGE_LABELS[lang] ?? (lang ? lang.toUpperCase() : 'Code');
}

export function resolveHref(href: string, slug: string): string | null {
  if (href.startsWith('#')) return href.length > 1 ? `#/docs/${slug}/${encodeURIComponent(href.slice(1))}` : null;
  if (href.startsWith('doc:')) {
    const [target = '', anchor] = href.slice(4).split('#');
    if (!/^[a-z0-9-]+$/.test(target)) return null;
    return anchor ? `#/docs/${target}/${encodeURIComponent(anchor)}` : `#/docs/${target}`;
  }
  if (href.startsWith('app:')) {
    const target = href.slice(4);
    return /^[a-z0-9-]+(?:\/[^?#\s]*)?(?:\?[^#\s]*)?$/.test(target) ? `#/${target}` : null;
  }
  if (/^(https?:|mailto:)/i.test(href)) return href;
  return null;
}

export function renderBlocks(blocks: readonly Block[], options: RenderOptions): Child[] {
  return blocks.map((block) => renderBlock(block, options));
}

function renderBlock(block: Block, options: RenderOptions): Child {
  switch (block.type) {
    case 'heading':
      return renderHeading(block.level, block.id, block.children, options);
    case 'paragraph':
      return el('p', {}, renderInline(block.children, options));
    case 'code':
      return codeBlock(block.text, block.lang);
    case 'list':
      return el(block.ordered ? 'ol' : 'ul', { attrs: { start: block.ordered && block.start !== 1 ? block.start : undefined } }, block.items.map((item) => listItem(item, options)));
    case 'quote':
      return el('blockquote', {}, renderBlocks(block.blocks, options));
    case 'callout':
      return el('div', { class: 'callout', attrs: { 'data-kind': block.kind, role: 'note' } }, [
        el('p', { class: 'callout-title' }, [icon(CALLOUT_ICONS[block.kind], 16), el('span', { text: CALLOUT_LABELS[block.kind] })]),
        ...renderBlocks(block.blocks, options),
      ]);
    case 'table':
      return el('div', { class: 'doc-table-wrap', attrs: { tabindex: 0, role: 'region', 'aria-label': 'Table' } }, [
        el('table', { class: 'doc-table' }, [
          el('thead', {}, [el('tr', {}, block.head.map((cell, column) => el('th', { attrs: { 'data-align': block.align[column] ?? undefined, scope: 'col' } }, renderInline(cell, options))))]),
          el('tbody', {}, block.rows.map((row) => el('tr', {}, row.map((cell, column) => el('td', { attrs: { 'data-align': block.align[column] ?? undefined } }, renderInline(cell, options)))))),
        ]),
      ]);
    case 'rule':
      return el('hr');
  }
}

function renderHeading(level: number, id: string, children: readonly Inline[], options: RenderOptions): HTMLElement {
  const content = renderInline(children, options);
  const attrs = { id, tabindex: -1 };
  if (level <= 2) return el('h2', { attrs }, content);
  if (level === 3) return el('h3', { attrs }, content);
  if (level === 4) return el('h4', { attrs }, content);
  return el('h5', { attrs }, content);
}

function listItem(item: ListItem, options: RenderOptions): HTMLLIElement {
  const content = renderBlocks(item.blocks, options);
  if (item.checked === null) return el('li', {}, content);
  return el('li', { class: 'task' }, [
    el('input', { attrs: { type: 'checkbox', checked: item.checked, disabled: true, 'aria-label': item.checked ? 'Done' : 'Not done' } }),
    el('div', {}, content),
  ]);
}

export function renderInline(nodes: readonly Inline[], options: RenderOptions): Child[] {
  return nodes.map((node): Child => {
    switch (node.type) {
      case 'text':
        return node.text;
      case 'break':
        return el('br');
      case 'code':
        return el('code', { text: node.text });
      case 'strong':
        return el('strong', {}, renderInline(node.children, options));
      case 'em':
        return el('em', {}, renderInline(node.children, options));
      case 'del':
        return el('del', {}, renderInline(node.children, options));
      case 'image':
        return image(node.src, node.alt);
      case 'link':
        return link(node.href, node.children, options);
    }
  });
}

function link(href: string, children: readonly Inline[], options: RenderOptions): Child {
  const resolved = resolveHref(href, options.slug);
  const content = renderInline(children, options);
  if (!resolved) return el('span', {}, content);
  if (href.startsWith('#')) {
    const id = href.slice(1);
    return el('a', { attrs: { href: resolved }, on: { click: (event) => {
      event.preventDefault();
      options.onAnchor(id);
    } } }, content);
  }
  if (/^https?:/i.test(resolved)) return el('a', { class: 'external', attrs: { href: resolved, target: '_blank', rel: 'noopener noreferrer' } }, content);
  return el('a', { attrs: { href: resolved } }, content);
}

function image(src: string, alt: string): Child {
  if (!/^https:\/\//i.test(src)) return el('span', { class: 'image-missing', text: alt ? `Image: ${alt}` : 'Image' });
  const fallback = el('a', { class: 'image-missing external', text: alt ? `Image: ${alt}` : 'Open image', attrs: { href: src, target: '_blank', rel: 'noopener noreferrer', hidden: true } });
  const picture = el('img', { attrs: { src, alt, loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' } });
  picture.addEventListener('error', () => {
    picture.hidden = true;
    fallback.hidden = false;
  }, { once: true });
  return el('span', { class: 'doc-image' }, [picture, fallback]);
}

export function codeBlock(code: string, lang: string): HTMLElement {
  const content = el('code', {}, highlight(code, lang).map((token) => (token.kind === 'plain' ? token.text : el('span', { class: `tok-${token.kind}`, text: token.text }))));
  return el('div', { class: 'code-block' }, [
    el('div', { class: 'code-head' }, [
      el('span', { class: 'code-lang', text: languageLabel(lang) }),
      el('button', { class: 'code-copy', attrs: { type: 'button', 'aria-label': `Copy ${languageLabel(lang)} code` }, on: { click: () => void copyToClipboard(code) } }, [icon('copy', 14), el('span', { text: 'Copy' })]),
    ]),
    el('pre', { attrs: { tabindex: 0 } }, [content]),
  ]);
}
