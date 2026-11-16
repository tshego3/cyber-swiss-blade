---
name: csb-data-sync
description: Data layer, sync protocol, accounts and permissions, Cloudflare Worker, MongoDB wire client, service worker, and security rules for Cyber Swiss Blade. Use when touching IndexedDB (src/core/db.ts, repository.ts), the sync engine (src/core/sync.ts, api.ts), sign-in or roles (src/core/session.ts, shared/access.ts, shared/auth.ts, worker/src/auth.ts, admin.ts), shared/protocol.ts, anything in worker/, src/sw.ts, the manifest, offline caching, CSP, secrets, or encryption code.
---

# Data, Sync, PWA, and Security

## IndexedDB (`src/core/db.ts`)

1. Database `cyber-swiss-blade`, version 1, native IndexedDB API (no wrapper library).
2. Stores: `records` (key `[collection, id]`, index `collection`, optional `ownerId`), `outbox` (key `[collection, id]`, value `{ updatedAt }`), and `meta` (key-value: server URL, session, last user ID, sync cursors, last sync time, module-local state).
6. `clearSyncedData()` empties `records`, `outbox`, and cursors. Sign-out and a sign-in as a different user call it.
3. Only `db.ts` opens transactions. Everything else goes through `repository.ts` or `getMeta`/`setMeta`.
4. `writeLocal` writes the record and its outbox entry in one transaction, then notifies `onDataChange(collection, 'local')`.
5. Do not bump the schema version for new modules. Generic stores cover them.

## Repository (`src/core/repository.ts`)

`createRepository<T>(collection, shape, upgrade?)` returns `list`, `get`, `save(data, id?)`, and `remove(id)`.
- `upgrade(data)` runs before `matchesShape`. Use it to fill fields that older records lack, instead of a migration.
- `save` stamps `updatedAt` (ISO, ms precision), strips `id`/`updatedAt`/`ownerId` from the stored data, and keeps the local `ownerId`.
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
5. Sync states: `local-only`, `signed-out`, `idle`, `syncing`, `offline`, `error`. Show them through `describeSyncState`.
6. The client syncs only the collections of restricted modules that the user can view.

## Accounts and Permissions (`shared/access.ts`, `shared/auth.ts`, `worker/src/auth.ts`, `admin.ts`, `session.ts`)

1. `MODULE_ACCESS` is the single list of restricted modules: collections, owner-scoped collections, and default View/Edit roles. The Worker rejects any collection that is not in it (403).
2. Roles: `administrators` and `registered` are system roles. Every signed-in user has `registered`. Administrators pass every check. Edit implies View.
3. Server-only collections: `auth_users`, `auth_roles`, `auth_permissions`, `auth_meta`. They never go through `/sync` and never reach the client except through `/admin/*` without secrets.
4. Passwords: the browser derives a key with PBKDF2-SHA256, 600,000 rounds, salt `csb:v1:<lowercase username>` (`derivePasswordKey`). The Worker stores `SHA-256(salt16 ‖ key)` only. Never run the slow KDF in the Worker (10 ms CPU limit, 100k PBKDF2 cap).
5. Sessions: `base64url(payload).base64url(HMAC-SHA256)`, key `SHA-256("csb-session:" + SESSION_SECRET)`, with fallback to `API_TOKEN` when the optional `SESSION_SECRET` secret is missing. Payload `{ sub, ver, exp }`, 30 days. Every `find` sets `batchSize` equal to `limit`, because a single batch otherwise stops at 101 documents. Every request loads the user; `disabled` or a changed `tokenVersion` gives 401.
6. Setup: `POST /auth/setup` needs the setup key (`API_TOKEN`) and works only while `auth_meta/setup` does not exist.
7. Lockout: 5 wrong passwords lock the account for 15 minutes (429). Unknown users and wrong passwords return the same message.
8. Owner scope: in owner-scoped collections the Worker sets `ownerId` from the session, matches it in every write, and filters pulls by it. Administrators pull all owners but write only as themselves, so other owners' records are read-only.
9. Endpoints: `GET /status` (public), `POST /auth/setup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/password`, `PUT /auth/profile`, `POST /sync`, and `/admin/users|roles|permissions`. Add a module through `MODULE_ACCESS`, not a new endpoint.

## Worker (`worker/`)

1. Single entry `src/index.ts`: CORS allowlist from `ALLOWED_ORIGINS`, Bearer token compared via SHA-256 digests, 1 MB body cap, generic error bodies.
2. `src/sync.ts` validates every request: collection pattern, id pattern, ISO timestamps, max counts, no `$`-prefixed or NUL keys, and depth ≤ 8.
3. `src/mongo/` is a dependency-free MongoDB client: OP_MSG framing (`connection.ts`), BSON subset (`bson.ts`), SCRAM-SHA-256 and SCRAM-SHA-1 (`scram.ts`, `md5.ts`), and SRV lookup over DNS-over-HTTPS plus primary discovery (`client.ts`). `hello` sends `saslSupportedMechs`; use SCRAM-SHA-1 only when the server does not offer SCRAM-SHA-256 (Atlas free and shared tiers offer only SCRAM-SHA-1). It opens one connection per request and closes it in `finally`.
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
2. The server URL and the session token are stored only in IndexedDB `meta` on the user's device, never in source or `localStorage`. Passwords are never stored.
3. AES: AES-256-GCM, PBKDF2-SHA256 at 600,000 iterations, a 16-byte random salt, and a 12-byte random IV per message. The header (magic `CSB1`, iterations, salt, IV) is authenticated as AAD. Never persist passwords or plaintext.
4. Copy for Excel (`toTsv`) prefixes cells that start with `= + - @` with `'` to block formula injection. The `.xlsx` export writes inline strings, never formulas.
5. Render user content with `textContent` via `el()`. Never use HTML strings.
