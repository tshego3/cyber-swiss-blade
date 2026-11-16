import { el } from './dom';
import { icon } from './icons';
import type { ToolModule, Unmount } from './types';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function toolCard(module: ToolModule): HTMLAnchorElement {
  const storage = module.collections.length > 0 ? 'Syncs to MongoDB' : 'Runs on this device';
  return el('a', { class: 'tool-card', attrs: { href: `#/${module.id}` } }, [
    el('span', { class: 'tool-icon' }, [icon(module.icon, 20)]),
    el('span', { class: 'tool-title', text: module.title }),
    el('span', { class: 'tool-summary', text: module.summary }),
    el('span', { class: 'tool-meta' }, [el('span', { text: module.category }), el('span', { 'class': 'dot', attrs: { 'aria-hidden': 'true' } }), el('span', { text: storage })]),
  ]);
}

export function mountHome(root: HTMLElement, modules: readonly ToolModule[]): Unmount {
  const now = new Date();
  root.append(
    el('section', { class: 'home' }, [
      el('p', { class: 'eyebrow', text: new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(now) }),
      el('h1', { class: 'display', text: `${greeting(now.getHours())}.` }),
      el('p', { class: 'lead', text: 'Your personal developer toolkit. Every tool works offline; project data syncs when you are connected.' }),
      el('div', { class: 'tool-grid' }, modules.map(toolCard)),
    ]),
  );
  return () => root.replaceChildren();
}
