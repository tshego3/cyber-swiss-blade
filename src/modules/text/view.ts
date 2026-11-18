import '../tools.css';
import { el } from '../../core/dom';
import type { ModuleContext, Unmount } from '../../core/types';
import { button, copyToClipboard, field, moduleHeader, segmented } from '../../core/ui';
import { joinLines, type Separator } from './convert';

const SEPARATOR_OPTIONS = [
  { value: 'space', label: 'Space' },
  { value: 'comma', label: 'Comma' },
  { value: 'none', label: 'Nothing' },
] as const satisfies readonly { value: Separator; label: string }[];

export function mount(root: HTMLElement, _context: ModuleContext): Unmount {
  root.append(
    moduleHeader({ title: 'Text tools', subtitle: 'Clean up text. Everything stays on this device.' }, 'Text tools', [{ label: 'Join lines', href: '#/text', active: true }]),
    joinLinesPanel(),
  );
  return () => root.replaceChildren();
}

function joinLinesPanel(): HTMLElement {
  let separator: Separator = 'space';
  const input = el('textarea', { class: 'input', attrs: { rows: 10, placeholder: 'Type or paste text with line breaks', 'aria-label': 'Input', spellcheck: 'false' } });
  const output = el('textarea', { class: 'input', attrs: { rows: 6, readonly: true, 'aria-label': 'Output' } });
  const status = el('p', { class: 'tool-status', attrs: { role: 'status' } });

  const convert = (): void => {
    const result = joinLines(input.value, separator);
    output.value = result.text;
    status.textContent = result.lines > 0 ? `Joined ${result.lines} ${result.lines === 1 ? 'line' : 'lines'} into 1.` : '';
  };
  input.addEventListener('input', convert);

  return el('section', { class: 'card tool-panel stack' }, [
    field('Input', input),
    el('div', { class: 'toolbar' }, [
      segmented<Separator>('Separator', SEPARATOR_OPTIONS, separator, (next) => {
        separator = next;
        convert();
      }),
    ]),
    el('div', { class: 'output-head' }, [
      el('span', { class: 'field-label', text: 'Output' }),
      button({ label: 'Copy output', icon: 'copy', iconOnly: true, variant: 'ghost', onClick: () => void copyToClipboard(output.value) }),
    ]),
    output,
    status,
  ]);
}
