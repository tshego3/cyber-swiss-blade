export interface Route {
  readonly section: string;
  readonly path: readonly string[];
}

export function parseRoute(hash: string): Route {
  const [section = '', ...path] = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  return { section, path };
}

export function currentRoute(): Route {
  return parseRoute(window.location.hash);
}

export function navigate(path: string): void {
  window.location.hash = `#/${path.replace(/^\/+/, '')}`;
}

export function onRouteChange(listener: (route: Route) => void): () => void {
  const handler = (): void => listener(currentRoute());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}
