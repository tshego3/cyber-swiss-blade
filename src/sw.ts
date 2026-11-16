/// <reference lib="webworker" />

interface PrecacheManifest {
  readonly version: string;
  readonly files: readonly string[];
}

declare const self: ServiceWorkerGlobalScope;
declare const CSB_MANIFEST: PrecacheManifest;

const CACHE_PREFIX = 'csb-';
const CACHE_NAME = `${CACHE_PREFIX}${CSB_MANIFEST.version}`;
const SHELL_URL = new URL('./index.html', self.registration.scope).href;
const MATCH_OPTIONS: CacheQueryOptions = { ignoreVary: true };

self.addEventListener('install', (event) => {
  const urls = CSB_MANIFEST.files.map((file) => new URL(file, self.registration.scope).href);
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urls)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? serveShell(request) : cacheFirst(request));
});

async function serveShell(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(SHELL_URL, MATCH_OPTIONS)) ?? fetch(request);
}

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(request.url, MATCH_OPTIONS)) ?? fetch(request);
}
