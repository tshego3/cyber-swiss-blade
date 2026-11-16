import { el, replaceChildren } from './dom';
import { icon } from './icons';
import { describeSyncState } from './sync-status';
import type { SyncEngine } from './sync';
import { getThemePreference, nextThemePreference, onThemeChange, setThemePreference } from './theme';
import type { ThemePreference, ToolModule } from './types';
import { button } from './ui';

export interface Shell {
  readonly main: HTMLElement;
  readonly setActive: (section: string) => void;
  readonly refresh: () => void;
}

export interface ShellAccount {
  readonly name: string | null;
  readonly isAdmin: boolean;
}

export interface ShellOptions {
  readonly modules: () => readonly ToolModule[];
  readonly account: () => ShellAccount;
  readonly sync: SyncEngine;
  readonly openPalette: () => void;
}

const THEME_ICONS = { system: 'monitor', light: 'sun', dark: 'moon' } as const;
const THEME_LABELS: Readonly<Record<ThemePreference, string>> = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };

export function createShell(root: HTMLElement, options: ShellOptions): Shell {
  const main = el('main', { class: 'main', attrs: { id: 'main', tabindex: -1 } });
  const navLinks = new Map<string, HTMLAnchorElement>();
  const shell = el('div', { class: 'shell' });
  const closeNav = (): void => shell.classList.remove('nav-open');

  const link = (section: string, label: string, iconName: Parameters<typeof icon>[0]): HTMLAnchorElement => {
    const anchor = el('a', { class: 'nav-link', attrs: { href: `#/${section}` }, on: { click: closeNav } }, [icon(iconName), el('span', { text: label })]);
    navLinks.set(section, anchor);
    return anchor;
  };

  const nav = el('nav', { class: 'nav', attrs: { 'aria-label': 'Tools' } });
  const accountLinks = el('div', { class: 'account-links' });
  let active = '';

  const refresh = (): void => {
    for (const [key, anchor] of navLinks) {
      if (nav.contains(anchor) || accountLinks.contains(anchor)) navLinks.delete(key);
    }
    const modules = options.modules();
    const categories = [...new Set(modules.map((module) => module.category))];
    replaceChildren(nav, [
      link('', 'Home', 'home'),
      ...categories.flatMap((category) => [
        el('p', { class: 'nav-group', text: category }),
        ...modules.filter((module) => module.category === category).map((module) => link(module.id, module.title, module.icon)),
      ]),
    ]);
    const account = options.account();
    replaceChildren(accountLinks, [
      account.isAdmin && link('admin', 'Administration', 'shield'),
      account.name
        ? el('a', { class: 'nav-link', attrs: { href: '#/settings', title: 'Your account' }, on: { click: closeNav } }, [icon('user'), el('span', { text: account.name })])
        : link('sign-in', 'Sign in', 'lock'),
    ]);
    setActive(active);
  };

  const setActive = (section: string): void => {
    active = section;
    for (const [key, anchor] of navLinks) {
      if (key === section) anchor.setAttribute('aria-current', 'page');
      else anchor.removeAttribute('aria-current');
    }
  };

  const sidebar = el('aside', { class: 'sidebar', attrs: { id: 'sidebar' } }, [
    el('a', { class: 'brand', attrs: { href: '#/' } }, [el('span', { class: 'brand-mark' }, [icon('blade', 18)]), el('span', { class: 'brand-name', text: 'Cyber Swiss Blade' })]),
    el('button', { class: 'search-trigger', attrs: { type: 'button' }, on: { click: options.openPalette } }, [
      icon('search', 16),
      el('span', { text: 'Search tools' }),
      el('kbd', { text: /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K' }),
    ]),
    nav,
    el('div', { class: 'sidebar-footer' }, [syncIndicator(options.sync), accountLinks, themeToggle(), link('settings', 'Settings', 'settings')]),
  ]);

  const topbar = el('header', { class: 'topbar' }, [
    button({ label: 'Open navigation', icon: 'menu', iconOnly: true, variant: 'ghost', onClick: () => shell.classList.add('nav-open') }),
    el('a', { class: 'brand brand-compact', attrs: { href: '#/' } }, [el('span', { class: 'brand-mark' }, [icon('blade', 16)]), el('span', { class: 'brand-name', text: 'Swiss Blade' })]),
    button({ label: 'Search tools', icon: 'search', iconOnly: true, variant: 'ghost', onClick: options.openPalette }),
  ]);

  replaceChildren(shell, [sidebar, el('div', { class: 'scrim', on: { click: closeNav } }), el('div', { class: 'workspace' }, [topbar, main])]);
  replaceChildren(root, [el('a', { class: 'skip-link', text: 'Skip to content', attrs: { href: '#main' } }), shell]);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  refresh();
  return { main, setActive, refresh };
}

function syncIndicator(sync: SyncEngine): HTMLButtonElement {
  const indicator = el('button', { class: 'sync-indicator', attrs: { type: 'button' }, on: { click: () => void sync.syncNow() } });
  const render = (): void => {
    const view = describeSyncState(sync.state());
    indicator.dataset.tone = view.tone;
    indicator.title = view.detail;
    replaceChildren(indicator, [icon(view.icon, 16), el('span', { class: 'sync-text' }, [el('span', { class: 'sync-label', text: view.label }), el('span', { class: 'sync-detail', text: view.detail })])]);
  };
  sync.subscribe(render);
  setInterval(render, 30_000);
  return indicator;
}

function themeToggle(): HTMLButtonElement {
  const toggle = el('button', { class: 'nav-link', attrs: { type: 'button' } });
  const render = (preference: ThemePreference): void => {
    replaceChildren(toggle, [icon(THEME_ICONS[preference]), el('span', { text: THEME_LABELS[preference] })]);
  };
  toggle.addEventListener('click', () => setThemePreference(nextThemePreference(getThemePreference())));
  onThemeChange(render);
  render(getThemePreference());
  return toggle;
}
