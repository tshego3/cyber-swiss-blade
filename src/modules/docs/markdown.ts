export type Inline =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'code'; readonly text: string }
  | { readonly type: 'strong' | 'em' | 'del'; readonly children: readonly Inline[] }
  | { readonly type: 'link'; readonly href: string; readonly children: readonly Inline[] }
  | { readonly type: 'image'; readonly src: string; readonly alt: string }
  | { readonly type: 'break' };

export type CalloutKind = 'note' | 'tip' | 'important' | 'warning' | 'caution';
export type Align = 'left' | 'center' | 'right' | null;

export interface ListItem {
  readonly checked: boolean | null;
  readonly blocks: readonly Block[];
}

export type Block =
  | { readonly type: 'heading'; readonly level: number; readonly id: string; readonly text: string; readonly children: readonly Inline[] }
  | { readonly type: 'paragraph'; readonly children: readonly Inline[] }
  | { readonly type: 'code'; readonly lang: string; readonly text: string }
  | { readonly type: 'list'; readonly ordered: boolean; readonly start: number; readonly items: readonly ListItem[] }
  | { readonly type: 'quote'; readonly blocks: readonly Block[] }
  | { readonly type: 'callout'; readonly kind: CalloutKind; readonly blocks: readonly Block[] }
  | { readonly type: 'table'; readonly align: readonly Align[]; readonly head: readonly (readonly Inline[])[]; readonly rows: readonly (readonly (readonly Inline[])[])[] }
  | { readonly type: 'rule' };

export interface Heading {
  readonly level: number;
  readonly id: string;
  readonly text: string;
}

export interface Document {
  readonly blocks: readonly Block[];
  readonly headings: readonly Heading[];
}

const MAX_DEPTH = 12;
const CALLOUTS: Readonly<Record<string, CalloutKind>> = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'important', WARNING: 'warning', CAUTION: 'caution' };

const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const EMPTY_HEADING = /^ {0,3}(#{1,6})[ \t]*$/;
const FENCE = /^( *)(`{3,}|~{3,})[ \t]*([^`\s]*)[^`]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?/;
const LIST_ITEM = /^( *)([-*+]|\d{1,9}[.)])(?:[ \t]+|$)/;
const TABLE_DELIMITER = /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/;

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .trim()
    .replace(/ /g, '-');
}

export function plainText(nodes: readonly Inline[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text' || node.type === 'code') return node.text;
      if (node.type === 'image') return node.alt;
      if (node.type === 'break') return ' ';
      return plainText(node.children);
    })
    .join('');
}

export function parseMarkdown(source: string): Document {
  const lines = source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const used = new Map<string, number>();
  const headings: Heading[] = [];
  const uniqueId = (text: string): string => {
    const base = headingId(text) || 'section';
    let count = used.get(base) ?? 0;
    let id = count === 0 ? base : `${base}-${count}`;
    while (used.has(id) && id !== base) {
      count += 1;
      id = `${base}-${count}`;
    }
    used.set(base, count + 1);
    if (id !== base) used.set(id, 1);
    return id;
  };
  const blocks = parseBlocks(lines, 0, { uniqueId, headings });
  return { blocks, headings };
}

interface ParseContext {
  readonly uniqueId: (text: string) => string;
  readonly headings: Heading[];
}

function isBlank(line: string): boolean {
  return line.trim() === '';
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

function startsBlock(line: string): boolean {
  return HEADING.test(line) || EMPTY_HEADING.test(line) || FENCE.test(line) || RULE.test(line) || QUOTE.test(line) || LIST_ITEM.test(line);
}

function parseBlocks(lines: readonly string[], depth: number, context: ParseContext): Block[] {
  if (depth > MAX_DEPTH) return [{ type: 'paragraph', children: [{ type: 'text', text: lines.join(' ') }] }];
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (isBlank(line)) {
      index += 1;
      continue;
    }
    const fence = FENCE.exec(line);
    if (fence) {
      index = readFence(lines, index, fence, blocks);
      continue;
    }
    const heading = HEADING.exec(line) ?? EMPTY_HEADING.exec(line);
    if (heading) {
      const children = parseInline(heading[2] ?? '');
      const text = plainText(children).trim();
      const level = (heading[1] ?? '#').length;
      const id = context.uniqueId(text);
      context.headings.push({ level, id, text });
      blocks.push({ type: 'heading', level, id, text, children });
      index += 1;
      continue;
    }
    if (RULE.test(line)) {
      blocks.push({ type: 'rule' });
      index += 1;
      continue;
    }
    if (QUOTE.test(line)) {
      index = readQuote(lines, index, depth, context, blocks);
      continue;
    }
    if (LIST_ITEM.test(line)) {
      index = readList(lines, index, depth, context, blocks);
      continue;
    }
    if (line.includes('|') && TABLE_DELIMITER.test(lines[index + 1] ?? '') && (lines[index + 1] ?? '').includes('-')) {
      index = readTable(lines, index, blocks);
      continue;
    }
    index = readParagraph(lines, index, blocks);
  }
  return blocks;
}

function readFence(lines: readonly string[], start: number, fence: RegExpExecArray, blocks: Block[]): number {
  const indent = (fence[1] ?? '').length;
  const marker = fence[2] ?? '```';
  const body: string[] = [];
  let index = start + 1;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();
    if (trimmed.startsWith(marker) && trimmed.replace(marker[0] === '`' ? /`/g : /~/g, '') === '') break;
    body.push(line.slice(Math.min(indent, indentOf(line))));
    index += 1;
  }
  blocks.push({ type: 'code', lang: (fence[3] ?? '').toLowerCase(), text: body.join('\n') });
  return index + 1;
}

function readQuote(lines: readonly string[], start: number, depth: number, context: ParseContext, blocks: Block[]): number {
  const body: string[] = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (QUOTE.test(line)) body.push(line.replace(QUOTE, ''));
    else if (!isBlank(line) && !startsBlock(line) && body.length > 0 && !isBlank(body[body.length - 1] ?? '')) body.push(line);
    else break;
    index += 1;
  }
  const inner = parseBlocks(body, depth + 1, context);
  blocks.push(toCallout(inner) ?? { type: 'quote', blocks: inner });
  return index;
}

function toCallout(blocks: readonly Block[]): Block | null {
  const [first, ...rest] = blocks;
  if (!first || first.type !== 'paragraph') return null;
  const [label, ...after] = first.children;
  if (!label || label.type !== 'strong') return null;
  const match = /^([A-Z]+):?$/.exec(plainText(label.children).trim());
  const kind = match ? CALLOUTS[match[1] ?? ''] : undefined;
  if (!kind) return null;
  const [lead, ...tail] = after;
  const children = lead && lead.type === 'text' ? [{ type: 'text', text: lead.text.replace(/^:?\s*/, '') } as const, ...tail] : after;
  const content = children.length > 0 && plainText(children).trim() !== '' ? [{ type: 'paragraph', children } as const, ...rest] : rest;
  return { type: 'callout', kind, blocks: content };
}

interface Marker {
  readonly indent: number;
  readonly content: number;
  readonly ordered: boolean;
  readonly start: number;
}

function readMarker(line: string): Marker | null {
  const match = LIST_ITEM.exec(line);
  if (!match) return null;
  const indent = (match[1] ?? '').length;
  const symbol = match[2] ?? '-';
  const ordered = /\d/.test(symbol);
  const spaces = match[0].length - indent - symbol.length;
  const content = indent + symbol.length + (spaces >= 1 && spaces <= 4 ? spaces : 1);
  return { indent, content, ordered, start: ordered ? Number.parseInt(symbol, 10) : 1 };
}

function readList(lines: readonly string[], start: number, depth: number, context: ParseContext, blocks: Block[]): number {
  const first = readMarker(lines[start] ?? '');
  if (!first) return start + 1;
  const items: ListItem[] = [];
  let index = start;
  while (index < lines.length) {
    const marker = readMarker(lines[index] ?? '');
    if (!marker || marker.ordered !== first.ordered || marker.indent > first.indent + 1 || marker.indent < first.indent) break;
    const body: string[] = [(lines[index] ?? '').slice(marker.content)];
    index += 1;
    let inFence = FENCE.test(body[0] ?? '');
    while (index < lines.length) {
      const line = lines[index] ?? '';
      const indent = indentOf(line);
      if (inFence) {
        body.push(line.slice(Math.min(indent, marker.content)));
        if (FENCE.test(line.trim()) && line.trim().replace(/[`~]/g, '') === '') inFence = false;
        index += 1;
        continue;
      }
      if (isBlank(line)) {
        const next = lines[nextFilled(lines, index + 1)];
        if (next === undefined || indentOf(next) <= first.indent) break;
        body.push('');
        index += 1;
        continue;
      }
      if (indent > marker.indent + 1) {
        body.push(line.slice(Math.min(indent, marker.content)));
        if (FENCE.test(line)) inFence = true;
        index += 1;
        continue;
      }
      const previous = body[body.length - 1] ?? '';
      if (!startsBlock(line) && !isBlank(previous)) {
        body.push(line.trim());
        index += 1;
        continue;
      }
      break;
    }
    items.push(toListItem(body, depth, context));
    while (index < lines.length && isBlank(lines[index] ?? '')) {
      const next = lines[nextFilled(lines, index)];
      const nextMarker = next === undefined ? null : readMarker(next);
      if (!nextMarker || nextMarker.indent !== marker.indent || nextMarker.ordered !== first.ordered) return pushList(blocks, first, items, index);
      index += 1;
    }
  }
  return pushList(blocks, first, items, index);
}

function nextFilled(lines: readonly string[], from: number): number {
  let index = from;
  while (index < lines.length && isBlank(lines[index] ?? '')) index += 1;
  return index;
}

function pushList(blocks: Block[], first: Marker, items: readonly ListItem[], index: number): number {
  blocks.push({ type: 'list', ordered: first.ordered, start: first.start, items });
  return index;
}

function toListItem(body: readonly string[], depth: number, context: ParseContext): ListItem {
  const task = /^\[([ xX])\][ \t]+/.exec(body[0] ?? '');
  const lines = task ? [(body[0] ?? '').slice(task[0].length), ...body.slice(1)] : body;
  return { checked: task ? task[1] !== ' ' : null, blocks: parseBlocks(lines, depth + 1, context) };
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '');
  const cells: string[] = [];
  let current = '';
  let inCode = false;
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index] ?? '';
    if (char === '\\' && trimmed[index + 1] === '|') {
      current += '|';
      index += 1;
      continue;
    }
    if (char === '`') inCode = !inCode;
    if (char === '|' && !inCode) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function readTable(lines: readonly string[], start: number, blocks: Block[]): number {
  const head = splitRow(lines[start] ?? '');
  const align = splitRow(lines[start + 1] ?? '').map((cell): Align => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return left ? 'left' : null;
  });
  const rows: (readonly Inline[])[][] = [];
  let index = start + 2;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (isBlank(line) || !line.includes('|')) break;
    const cells = splitRow(line);
    rows.push(head.map((_, column) => parseInline(cells[column] ?? '')));
    index += 1;
  }
  blocks.push({ type: 'table', align: head.map((_, column) => align[column] ?? null), head: head.map((cell) => parseInline(cell)), rows });
  return index;
}

function readParagraph(lines: readonly string[], start: number, blocks: Block[]): number {
  const body: string[] = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (isBlank(line) || (body.length > 0 && startsBlock(line))) break;
    if (body.length > 0 && line.includes('|') && TABLE_DELIMITER.test(lines[index + 1] ?? '')) break;
    body.push(line);
    index += 1;
  }
  const text = body
    .map((line, position) => {
      const trimmed = line.trim();
      const last = position === body.length - 1;
      if (!last && (/ {2,}$/.test(line) || trimmed.endsWith('\\'))) return `${trimmed.replace(/\\$/, '')}\u0000`;
      return trimmed;
    })
    .join('\n');
  blocks.push({ type: 'paragraph', children: parseInline(text) });
  return index;
}

const ESCAPABLE = /[\\`*_{}[\]()#+\-.!|~<>]/;
const URL_PATTERN = /^https?:\/\/[^\s<>]*[^\s<>.,:;"')\]!?*_]/;

export function parseInline(text: string, depth = 0): Inline[] {
  const nodes: Inline[] = [];
  let buffer = '';
  const flush = (): void => {
    if (buffer) nodes.push({ type: 'text', text: buffer });
    buffer = '';
  };
  const push = (node: Inline, consumed: number): number => {
    flush();
    nodes.push(node);
    return consumed;
  };
  const nested = (inner: string): Inline[] => (depth > MAX_DEPTH ? [{ type: 'text', text: inner }] : parseInline(inner, depth + 1));

  let index = 0;
  while (index < text.length) {
    const char = text[index] ?? '';
    const rest = text.slice(index);
    if (char === '\u0000') {
      index += push({ type: 'break' }, 1);
      continue;
    }
    if (char === '\n') {
      buffer += ' ';
      index += 1;
      continue;
    }
    if (char === '\\' && ESCAPABLE.test(text[index + 1] ?? '')) {
      buffer += text[index + 1] ?? '';
      index += 2;
      continue;
    }
    if (char === '`') {
      const run = /^`+/.exec(rest)?.[0] ?? '`';
      const close = text.indexOf(run, index + run.length);
      if (close > 0) {
        const inner = text.slice(index + run.length, close).replace(/\n/g, ' ');
        const code = /^ .* $/.test(inner) && inner.trim() !== '' ? inner.slice(1, -1) : inner;
        index += push({ type: 'code', text: code }, close + run.length - index);
        continue;
      }
      buffer += run;
      index += run.length;
      continue;
    }
    if (char === '!' && text[index + 1] === '[') {
      const link = readLink(text, index + 1);
      if (link) {
        index += push({ type: 'image', src: link.href, alt: link.label }, link.end - index);
        continue;
      }
    }
    if (char === '[') {
      const link = readLink(text, index);
      if (link) {
        index += push({ type: 'link', href: link.href, children: nested(link.label) }, link.end - index);
        continue;
      }
    }
    if (char === '<') {
      const auto = /^<(https?:\/\/[^\s>]+|mailto:[^\s>]+)>/.exec(rest);
      if (auto) {
        const href = auto[1] ?? '';
        index += push({ type: 'link', href, children: [{ type: 'text', text: href.replace(/^mailto:/, '') }] }, auto[0].length);
        continue;
      }
    }
    if (char === 'h' && !/[\p{L}\p{N}/]/u.test(text[index - 1] ?? '')) {
      const url = URL_PATTERN.exec(rest);
      if (url) {
        index += push({ type: 'link', href: url[0], children: [{ type: 'text', text: url[0] }] }, url[0].length);
        continue;
      }
    }
    const emphasis = readEmphasis(text, index, text[index - 1] ?? '');
    if (emphasis) {
      index += push({ type: emphasis.type, children: nested(emphasis.inner) }, emphasis.end - index);
      continue;
    }
    buffer += char;
    index += 1;
  }
  flush();
  return nodes;
}

interface LinkMatch {
  readonly label: string;
  readonly href: string;
  readonly end: number;
}

function readLink(text: string, open: number): LinkMatch | null {
  let depth = 0;
  let close = -1;
  for (let index = open; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\\') {
      index += 1;
      continue;
    }
    if (char === '`') {
      const end = text.indexOf('`', index + 1);
      if (end > 0) index = end;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) {
      close = index;
      break;
    }
  }
  if (close < 0 || text[close + 1] !== '(') return null;
  let parens = 0;
  for (let index = close + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === '(') parens += 1;
    if (char === ')') parens -= 1;
    if (parens === 0) {
      const target = text.slice(close + 2, index).trim();
      const href = (/^<([^>]*)>/.exec(target)?.[1] ?? target.split(/\s+/)[0] ?? '').trim();
      return { label: text.slice(open + 1, close), href, end: index + 1 };
    }
  }
  return null;
}

interface EmphasisMatch {
  readonly type: 'strong' | 'em' | 'del';
  readonly inner: string;
  readonly end: number;
}

function emphasisType(char: string, double: boolean): EmphasisMatch['type'] {
  if (char === '~') return 'del';
  return double ? 'strong' : 'em';
}

function readEmphasis(text: string, index: number, before: string): EmphasisMatch | null {
  const char = text[index];
  if (char !== '*' && char !== '_' && char !== '~') return null;
  const double = text[index + 1] === char;
  if (char === '~' && !double) return null;
  if (char === '_' && /[\p{L}\p{N}]/u.test(before)) return null;
  if (char !== '~' && text.startsWith(char.repeat(3), index) && !/\s/.test(text[index + 3] ?? ' ')) {
    const close = text.indexOf(char.repeat(3), index + 4);
    if (close > 0 && !/\s/.test(text[close - 1] ?? ' ')) return { type: 'strong', inner: text.slice(index + 2, close + 1), end: close + 3 };
  }
  const marker = double ? `${char}${char}` : char;
  const contentStart = index + marker.length;
  if (/\s/.test(text[contentStart] ?? ' ')) return null;
  let search = contentStart + 1;
  while (search < text.length) {
    const close = text.indexOf(marker, search);
    if (close < 0) return null;
    const inner = text.slice(contentStart, close);
    const precededBySpace = /\s$/.test(inner);
    const isSingleInsideDouble = !double && text[close + 1] === char;
    const wordAfter = char === '_' && /[\p{L}\p{N}]/u.test(text[close + marker.length] ?? '');
    if (inner.length > 0 && !precededBySpace && !wordAfter && !isSingleInsideDouble) {
      return { type: emphasisType(char, double), inner, end: close + marker.length };
    }
    search = isSingleInsideDouble ? close + 2 : close + 1;
  }
  return null;
}
