export interface FrontMatter {
  readonly meta: Readonly<Record<string, string>>;
  readonly body: string;
}

const FENCE = '---';
const MAX_KEYS = 32;

export function parseFrontMatter(source: string): FrontMatter {
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith(`${FENCE}\n`)) return { meta: {}, body: text };
  const end = text.indexOf(`\n${FENCE}`, FENCE.length);
  if (end < 0) return { meta: {}, body: text };
  const meta: Record<string, string> = {};
  for (const line of text.slice(FENCE.length + 1, end).split('\n').slice(0, MAX_KEYS)) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (/^[a-z]+$/.test(key)) meta[key] = line.slice(separator + 1).trim();
  }
  const bodyStart = text.indexOf('\n', end + FENCE.length + 1);
  return { meta, body: bodyStart < 0 ? '' : text.slice(bodyStart + 1) };
}
