---
name: csb-data-sync
description: Data layer, sync protocol, Cloudflare Worker, MongoDB wire client, service worker, and security rules for Cyber Swiss Blade. Use when touching IndexedDB (src/core/db.ts, repository.ts), the sync engine (src/core/sync.ts, api.ts), shared/protocol.ts, anything in worker/, src/sw.ts, the manifest, offline caching, CSP, secrets, or encryption code.
---

# Data, Sync, PWA, and Security

## IndexedDB (`src/core/db.ts`)

1. Database `cyber-swiss-blade`, version 1, native IndexedDB API (no wrapper library).
2. Stores: `records` (key `[collection, id]`, index `collection`), `outbox` (key `[collection, id]`, value `{ updatedAt }`), and `meta` (key-value: API config, sync cursors, last sync time, module-local state).
3. Only `db.ts` opens transactions. Everything else goes through `repository.ts` or `getMeta`/`setMeta`.
4. `writeLocal` writes the record and its outbox entry in one transaction, then notifies `onDataChange(collection, 'local')`.
5. Do not bump the schema version for new modules. Generic stores cover them.

## Repository (`src/core/repository.ts`)

`createRepository<T>(collection, shape)` returns `list`, `get`, `save(data, id?)`, and `remove(id)`.
- `save` stamps `updatedAt` (ISO, ms precision) and strips `id`/`updatedAt` from the stored data.
- `remove` writes a tombstone (`deleted: true`, `data: {}`).
- Reads drop tombstones and records that fail `matchesShape`.

## Sync Protocol (`shared/protocol.ts`)

`POST /sync` sends `{ collections: { [name]: { since, changes: SyncRecord[] } } }`. The response is `{ collections: { [name]: { records: RemoteRecord[], cursor, hasMore } } }`.

1. Client (`src/core/sync.ts`): push up to 200 outbox records per collection, apply the response in one transaction, and loop while `hasMore` (max 10 rounds).
2. Triggers: start, 2 s after a local change, `online`, tab becomes visible, and every 5 min while visible. One run at a time.
3. Conflict rule: last-write-wins on client `updatedAt`.
   - Worker: `update` with `q: { _id, updatedAt: { $lt } }` and `upsert: true`. A duplicate-key error (11000) means the server copy is newer; the Worker re-reads it and returns it.
   - Client: `shouldApplyRemote` keeps a pending local change only if it is newer than the remote record.
4. Cursor: the server-assigned `syncedAt`. Pull with `$gte`, since re-receiving a record is harmless. Index `{ syncedAt: 1, _id: 1 }` is created on a collection's first pull.
5. Sync states: `local-only`, `idle`, `syncing`, `offline`, `error`. Show them through `describeSyncState`.

## Worker (`worker/`)

1. Single entry `src/index.ts`: CORS allowlist from `ALLOWED_ORIGINS`, Bearer token compared via SHA-256 digests, 1 MB body cap, generic error bodies.
2. `src/sync.ts` validates every request: collection pattern, id pattern, ISO timestamps, max counts, no `$`-prefixed or NUL keys, and depth ≤ 8.
3. `src/mongo/` is a dependency-free MongoDB client: OP_MSG framing (`connection.ts`), BSON subset (`bson.ts`), SCRAM-SHA-256 (`scram.ts`), and SRV lookup over DNS-over-HTTPS plus primary discovery (`client.ts`). It opens one connection per request and closes it in `finally`.
4. Sockets come from `cloudflare:sockets` through the `Connector` seam. Tests inject a Node connector.
5. Never log secrets or request bodies. Never return MongoDB error text to the client.

## Service Worker and PWA

1. `src/sw.ts` is a native classic-script service worker with no imports. The Vite `csb-precache` plugin prepends `CSB_MANIFEST` (version hash plus every emitted and public file).
2. Install precaches everything. Navigation serves cached `index.html`. Other same-origin GETs are cache-first, matched by URL with `ignoreVary`. Cross-origin requests (the API) are not intercepted.
3. Updates wait. `pwa.ts` shows a banner, and Reload posts `SKIP_WAITING` to `registration.waiting`, then reloads on `controllerchange`.
4. The manifest uses `public/manifest.webmanifest`, standalone, with `id`/`scope`/`start_url` set to `/cyber-swiss-blade/` and SVG + PNG + maskable icons.
5. Test offline with `npm run build && npm run preview`, then stop the server and reload.

## Security

1. CSP is injected at build: `default-src 'self'`, `script-src 'self'`, and `style-src 'self'` (no inline). `theme-init.js` is an external script for that reason.
2. The API token and URL are stored only in IndexedDB `meta` on the user's device, never in source or `localStorage`.
3. AES: AES-256-GCM, PBKDF2-SHA256 at 600,000 iterations, a 16-byte random salt, and a 12-byte random IV per message. The header (magic `CSB1`, iterations, salt, IV) is authenticated as AAD. Never persist passwords or plaintext.
4. CSV export prefixes cells that start with `= + - @` to block formula injection.
5. Render user content with `textContent` via `el()`. Never use HTML strings.
