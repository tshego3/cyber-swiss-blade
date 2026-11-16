import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import { el, replaceChildren } from './core/dom';
import { mountHome } from './core/home';
import { openPalette, type Command } from './core/palette';
import { registerServiceWorker } from './core/pwa';
import { currentRoute, navigate, onRouteChange, type Route } from './core/router';
import { mountSettings } from './core/settings-view';
import { createShell, type Shell } from './core/shell';
import { createSyncEngine, type SyncEngine } from './core/sync';
import { getThemePreference, nextThemePreference, setThemePreference } from './core/theme';
import type { ToolModule, Unmount } from './core/types';
import { errorState, loadingState } from './core/ui';
import { MODULES } from './modules/registry';

function buildCommands(sync: SyncEngine): Command[] {
  return [
    { id: 'home', label: 'Home', hint: 'Overview', icon: 'home', run: () => navigate('') },
    ...MODULES.map((module): Command => ({ id: module.id, label: module.title, hint: module.category, icon: module.icon, run: () => navigate(module.id) })),
    { id: 'settings', label: 'Settings', hint: 'Sync and appearance', icon: 'settings', run: () => navigate('settings') },
    { id: 'sync', label: 'Sync now', hint: 'Push and pull changes', icon: 'refresh', run: () => void sync.syncNow() },
    { id: 'theme', label: 'Switch theme', hint: 'System, light, dark', icon: 'sun', run: () => setThemePreference(nextThemePreference(getThemePreference())) },
  ];
}

async function mountModule(module: ToolModule, root: HTMLElement, route: Route, isCurrent: () => boolean): Promise<Unmount> {
  replaceChildren(root, [loadingState(`Loading ${module.title}`)]);
  try {
    const view = await module.load();
    if (!isCurrent()) return () => undefined;
    root.replaceChildren();
    return view.mount(root, { path: route.path, navigate: (path) => navigate(`${module.id}/${path}`) });
  } catch (error) {
    console.error(`Module ${module.id} failed to load`, error);
    if (!isCurrent()) return () => undefined;
    replaceChildren(root, [errorState(`${module.title} could not be loaded.`, () => window.location.reload())]);
    return () => root.replaceChildren();
  }
}

function startRouter(shell: Shell, sync: SyncEngine): void {
  let unmount: Unmount = () => undefined;
  let generation = 0;

  const render = async (route: Route): Promise<void> => {
    generation += 1;
    const current = generation;
    const isCurrent = (): boolean => current === generation;
    unmount();
    unmount = () => undefined;
    const host = el('div', { class: 'view' });
    shell.main.replaceChildren(host);
    shell.setActive(route.section);
    window.scrollTo({ top: 0 });
    const module = MODULES.find((candidate) => candidate.id === route.section);
    if (route.section === 'settings') unmount = mountSettings(host, sync);
    else if (!module) unmount = mountHome(host, MODULES);
    else {
      const mounted = await mountModule(module, host, route, isCurrent);
      if (isCurrent()) unmount = mounted;
      else mounted();
    }
  };

  onRouteChange((route) => void render(route));
  void render(currentRoute());
}

function start(): void {
  const root = document.getElementById('app') ?? document.body.appendChild(el('div', { attrs: { id: 'app' } }));
  const sync = createSyncEngine(MODULES.flatMap((module) => module.collections));
  const showPalette = (): void => openPalette(buildCommands(sync));
  const shell = createShell(root, { modules: MODULES, sync, openPalette: showPalette });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      showPalette();
    }
  });

  startRouter(shell, sync);
  sync.start();
  registerServiceWorker();
}

start();
