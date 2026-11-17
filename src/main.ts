import './styles/tokens.css';
import './styles/base.css';
import './styles/shell.css';
import { mountAdmin } from './core/admin-view';
import { mountNoAccess, mountSignIn } from './core/auth-view';
import { el, replaceChildren } from './core/dom';
import { mountHome } from './core/home';
import { openPalette, type Command } from './core/palette';
import { registerServiceWorker } from './core/pwa';
import { currentRoute, navigate, onRouteChange, type Route } from './core/router';
import { canEdit, canView, getSession, initSession, isAdmin, onSessionChange, refreshSession, sessionUser, type Session } from './core/session';
import { mountSettings } from './core/settings-view';
import { confirmSignOut } from './core/sign-out';
import { createShell, type Shell } from './core/shell';
import { createSyncEngine, type SyncEngine } from './core/sync';
import { lockMobileZoom } from './core/viewport';
import { getThemePreference, nextThemePreference, setThemePreference } from './core/theme';
import type { ToolModule, Unmount } from './core/types';
import { errorState, loadingState } from './core/ui';
import { MODULES } from './modules/registry';

function visibleModules(): ToolModule[] {
  const signedIn = getSession() !== null;
  return MODULES.filter((module) => module.access === 'public' || !signedIn || canView(module.id));
}

function syncedCollections(): string[] {
  return MODULES.filter((module) => module.access === 'restricted' && canView(module.id)).flatMap((module) => module.collections);
}

function buildCommands(sync: SyncEngine): Command[] {
  const signedIn = getSession() !== null;
  return [
    { id: 'home', label: 'Home', hint: 'Overview', icon: 'home', run: () => navigate('') },
    ...visibleModules().map((module): Command => ({ id: module.id, label: module.title, hint: module.category, icon: module.icon, run: () => navigate(module.id) })),
    ...(isAdmin() ? [{ id: 'admin', label: 'Administration', hint: 'Users, roles, permissions', icon: 'shield', run: () => navigate('admin') } satisfies Command] : []),
    { id: 'settings', label: 'Settings', hint: 'Account, sync, and appearance', icon: 'settings', run: () => navigate('settings') },
    signedIn
      ? ({ id: 'sign-out', label: 'Sign out', hint: 'Account', icon: 'log-out', run: () => void confirmSignOut() } satisfies Command)
      : ({ id: 'sign-in', label: 'Sign in', hint: 'Account', icon: 'lock', run: () => navigate('sign-in') } satisfies Command),
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
    return view.mount(root, {
      path: route.path,
      navigate: (path) => navigate(`${module.id}/${path}`),
      canEdit: module.access === 'public' || canEdit(module.id),
      user: sessionUser(),
    });
  } catch (error) {
    console.error(`Module ${module.id} failed to load`, error);
    if (!isCurrent()) return () => undefined;
    replaceChildren(root, [errorState(`${module.title} could not be loaded.`, () => window.location.reload())]);
    return () => root.replaceChildren();
  }
}

function startRouter(shell: Shell, sync: SyncEngine): () => void {
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
    const signedIn = getSession() !== null;
    const module = MODULES.find((candidate) => candidate.id === route.section);
    const backHere = (): void => void render(currentRoute());
    if (route.section === 'settings') unmount = mountSettings(host, sync, navigate);
    else if (route.section === 'sign-in') {
      if (signedIn) navigate('');
      else unmount = mountSignIn(host, { onSignedIn: () => navigate('') });
    }
    else if (route.section === 'admin') {
      if (isAdmin()) unmount = mountAdmin(host, route.path);
      else unmount = signedIn ? mountNoAccess(host, 'Administration') : mountSignIn(host, { onSignedIn: backHere, message: 'Sign in as an administrator.' });
    } else if (!module) unmount = mountHome(host, visibleModules());
    else if (module.access === 'restricted' && !signedIn) unmount = mountSignIn(host, { onSignedIn: backHere, message: `Sign in to use ${module.title}.` });
    else if (module.access === 'restricted' && !canView(module.id)) unmount = mountNoAccess(host, module.title);
    else {
      const mounted = await mountModule(module, host, route, isCurrent);
      if (isCurrent()) unmount = mounted;
      else mounted();
    }
  };

  onRouteChange((route) => void render(route));
  void render(currentRoute());
  return () => void render(currentRoute());
}

async function start(): Promise<void> {
  lockMobileZoom();
  const root = document.getElementById('app') ?? document.body.appendChild(el('div', { attrs: { id: 'app' } }));
  await initSession();
  const sync = createSyncEngine(syncedCollections);
  const showPalette = (): void => openPalette(buildCommands(sync));
  const shell = createShell(root, {
    modules: visibleModules,
    account: () => ({ name: sessionUser()?.displayName ?? null, isAdmin: isAdmin() }),
    sync,
    openPalette: showPalette,
    signOut: () => void confirmSignOut(),
  });

  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      showPalette();
    }
  });

  const rerender = startRouter(shell, sync);
  const accessKey = (session: Session | null): string => (session ? JSON.stringify([session.user.id, session.user.roles, session.grants]) : '');
  let lastAccess = accessKey(getSession());
  onSessionChange((session) => {
    shell.refresh();
    const access = accessKey(session);
    if (access !== lastAccess) {
      lastAccess = access;
      rerender();
    }
    void sync.syncNow();
  });
  sync.start();
  registerServiceWorker();
  if (navigator.onLine) refreshSession().catch(() => undefined);
}

void start();
