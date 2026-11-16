import { el, replaceChildren } from './dom';
import { icon, type IconName } from './icons';

export interface Command {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: IconName;
  readonly run: () => void;
}

export function filterCommands(commands: readonly Command[], query: string): Command[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return commands.filter((command) => terms.every((term) => `${command.label} ${command.hint}`.toLowerCase().includes(term)));
}

export function openPalette(commands: readonly Command[]): void {
  if (document.querySelector('.palette')) return;
  let matches: Command[] = [...commands];
  let selected = 0;
  const input = el('input', {
    class: 'palette-input',
    attrs: { type: 'search', placeholder: 'Jump to a tool or action', 'aria-label': 'Search commands', role: 'combobox', 'aria-controls': 'palette-list', 'aria-expanded': 'true', autocomplete: 'off' },
  });
  const list = el('ul', { class: 'palette-list', attrs: { id: 'palette-list', role: 'listbox' } });
  const dialog = el('dialog', { class: 'dialog palette', attrs: { 'aria-label': 'Command palette' } }, [
    el('div', { class: 'palette-search' }, [icon('search', 16), input]),
    list,
  ]);

  const run = (command: Command | undefined): void => {
    if (!command) return;
    dialog.close();
    command.run();
  };

  const render = (): void => {
    replaceChildren(
      list,
      matches.length === 0
        ? [el('li', { class: 'palette-empty', text: 'No matching commands' })]
        : matches.map((command, index) =>
            el('li', { class: 'palette-item', attrs: { role: 'option', id: `palette-${command.id}`, 'aria-selected': index === selected ? 'true' : 'false' }, on: { click: () => run(command) } }, [
              icon(command.icon, 16),
              el('span', { class: 'palette-label', text: command.label }),
              el('span', { class: 'palette-hint', text: command.hint }),
            ]),
          ),
    );
    const active = matches[selected];
    if (active) input.setAttribute('aria-activedescendant', `palette-${active.id}`);
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  };

  input.addEventListener('input', () => {
    matches = filterCommands(commands, input.value);
    selected = 0;
    render();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      selected = (selected + step + matches.length) % Math.max(matches.length, 1);
      render();
    }
    if (event.key === 'Enter') run(matches[selected]);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());

  render();
  document.body.append(dialog);
  dialog.showModal();
}
