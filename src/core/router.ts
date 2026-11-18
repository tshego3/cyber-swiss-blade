export interface Route {
  readonly section: string;
  readonly path: readonly string[];
  readonly query: Readonly<Record<string, string>>;
}

const MAX_QUERY_PARAMS = 32;

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Unlike URLSearchParams, this keeps "+" as "+", so Base64 values survive.
export function parseQuery(query: string): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const pair of query.replace(/^\?/, '').split('&').filter(Boolean).slice(0, MAX_QUERY_PARAMS)) {
    const separator = pair.indexOf('=');
    const key = decode(separator < 0 ? pair : pair.slice(0, separator));
    if (key) result[key] = separator < 0 ? '' : decode(pair.slice(separator + 1));
  }
  return result;
}

export function parseRoute(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const queryStart = raw.indexOf('?');
  const pathPart = queryStart < 0 ? raw : raw.slice(0, queryStart);
  const [section = '', ...path] = pathPart
    .split('/')
    .filter(Boolean)
    .map((segment) => decode(segment));
  return { section, path, query: queryStart < 0 ? {} : parseQuery(raw.slice(queryStart + 1)) };
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

export interface LegacyQueryTarget {
  readonly id: string;
  readonly legacyQueryKeys?: readonly string[];
}

// Links from earlier standalone tools put a value in the page query (for example "?token=...")
// and have no hash route. Send the first match to the module that declares that query key.
export function legacyQueryRoute(search: string, hash: string, targets: readonly LegacyQueryTarget[]): string | null {
  if (hash.replace(/^#\/?/, '') !== '') return null;
  const query = parseQuery(search);
  for (const target of targets) {
    for (const key of target.legacyQueryKeys ?? []) {
      const value = query[key];
      if (value) return `#/${target.id}?${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
  }
  return null;
}
