export type Separator = 'space' | 'none' | 'comma';

const SEPARATORS: Readonly<Record<Separator, string>> = { space: ' ', none: '', comma: ', ' };
const LINE_BREAK = /\r\n|\n|\r/;

export interface JoinResult {
  readonly text: string;
  readonly lines: number;
}

// Blank lines (also the one after a final line break) are dropped, so no separator is doubled or left at the end.
export function joinLines(text: string, separator: Separator = 'space'): JoinResult {
  const lines = text.split(LINE_BREAK).filter((line) => line.trim() !== '');
  return { text: lines.join(SEPARATORS[separator]), lines: lines.length };
}
