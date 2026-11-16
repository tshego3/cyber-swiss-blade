# Cyber Swiss Blade

An offline-first, installable personal developer toolkit. One shell, independent modules, zero runtime dependencies, and free-tier hosting end to end.

| Module | What it does | Storage |
| --- | --- | --- |
| Timesheet | Projects, live timer, weekly totals, CSV export | IndexedDB, synced to MongoDB |
| Quotations | Clients, line items, tax, status, print to PDF | IndexedDB, synced to MongoDB |
| AES Encryption | Files and text, AES-256-GCM + PBKDF2-SHA256 | Device only |
| Base64 | Text and files, URL-safe, data URLs | Device only |

New to the codebase? Start with [docs/onboarding.md](docs/onboarding.md).

## Architecture

```
GitHub Pages (static PWA)  --HTTPS + Bearer token-->  Cloudflare Worker  --TLS socket-->  MongoDB Atlas (M0)
   IndexedDB + outbox                                   GET /status, POST /sync             one collection per entity
   Service worker precache                              secrets: MONGODB_URI, API_TOKEN
```

| Path | Purpose |
| --- | --- |
| `src/core/` | Shell and shared services: router, IndexedDB, repository, sync engine, UI kit, theme, PWA |
| `src/modules/<id>/` | One tool. `module.ts` declares it; `view.ts` is lazy-loaded |
| `src/styles/` | Design tokens, base components, shell layout |
| `shared/` | Code used by both the app and the Worker: sync protocol, byte helpers |
| `worker/` | The API. It speaks the MongoDB wire protocol directly (`worker/src/mongo/`). The official driver is Apache-2.0, so it is not used |
| `.claude/skills/` | Project rules for engineering, modules, data/sync, design, and testing |

### Sync

1. Every write goes to IndexedDB first and adds an outbox entry.
2. The sync engine pushes the outbox and pulls changes in one `POST /sync` request.
3. Sync runs on start, 2 s after a local change, when the device comes online, on tab focus, and every 5 minutes.

Conflict and cursor rules:
- **Conflicts:** last-write-wins on the client `updatedAt`. The Worker writes only if the stored copy is older. If the stored copy is newer, the Worker returns it and the client takes it.
- **Deletes:** tombstones (`deleted: true`).
- **Pull cursor:** the server-assigned `syncedAt`. It stays 60 s behind the server clock, so writes still in flight are not skipped.
- **New server:** changing the API URL resets cursors and queues every local record for upload.

## Prerequisites

| Tool | Version | Needed for |
| --- | --- | --- |
| Node.js | 24 LTS | everything |
| npm | 11 | everything |
| Git + a GitHub account | any | hosting on GitHub Pages |
| Cloudflare account (free) | n/a | the sync API |
| MongoDB Atlas account (free) | n/a | the database |

The app works fully without Cloudflare and Atlas. Those accounts are needed only for sync and backup.

## Local setup

```sh
git clone https://github.com/<you>/cyber-swiss-blade.git
cd cyber-swiss-blade
npm ci
npm run dev          # http://localhost:5173/cyber-swiss-blade/
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload (no service worker) |
| `npm test` | Unit tests (Vitest) |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run build` | Type-check the app and the Worker, then build `dist/` |
| `npm run preview` | Serve `dist/` with the service worker on :4173 |
| `npm run licenses` | Licence audit of installed packages |
| `npm run worker:dev` | Run the Worker locally on :8787 |
| `npm run worker:deploy` | Deploy the Worker to Cloudflare |

The service worker registers only in production builds. To test offline behaviour, run `npm run build && npm run preview`, open the app once, stop the server, and reload.

## Deployment

Deploy in this order: database, then API, then site, then connect.

### 1. MongoDB Atlas (free M0)

1. Sign in at cloud.mongodb.com and create a project.
2. Create a free **M0** cluster. Any provider and region works.
3. Under **Database Access**, add a user:
   - Password authentication. Use a long **ASCII** password.
   - Built-in role **Read and write to any database**, or a custom role with `readWrite` on `cyber_swiss_blade`.
4. Under **Network Access**, add `0.0.0.0/0`. Cloudflare Workers have no fixed egress IP; the database user password and TLS protect access.
5. Click **Connect → Drivers** and copy the `mongodb+srv://` string. Put the password in place of `<password>`, URL-encoding any `@ : / ? #` characters.

### 2. Cloudflare Worker (free plan)

```sh
cd worker
npx wrangler@4.151.3 login                       # opens the browser once
npx wrangler@4.151.3 secret put MONGODB_URI      # paste the connection string
openssl rand -hex 32                              # generate the API token and copy it
npx wrangler@4.151.3 secret put API_TOKEN        # paste the same token
cd ..
```

1. Set `ALLOWED_ORIGINS` in `worker/wrangler.toml` to your Pages origin, for example `https://<you>.github.io`. Keep the localhost entries for development.
2. Run `npm run worker:deploy`. On the first deploy, Wrangler asks you to pick a `workers.dev` subdomain.
3. Note the URL it prints: `https://cyber-swiss-blade-api.<subdomain>.workers.dev`.
4. Verify the Worker. It should return `{"ok":true,...}`:

```sh
curl -H "Authorization: Bearer <token>" https://cyber-swiss-blade-api.<subdomain>.workers.dev/status
```

Secrets live only in Cloudflare. Never commit them, and never put them in frontend code.

### 3. GitHub Pages

1. Create a **public** repository named `cyber-swiss-blade`. Pages on private repositories needs a paid plan.
2. Push:
   ```sh
   git remote add origin https://github.com/<you>/cyber-swiss-blade.git
   git push -u origin main
   ```
3. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The workflow `.github/workflows/deploy.yml` runs lint, tests, the licence audit, and the build, then publishes `dist/`. Check the **Actions** tab for progress.
5. Open `https://<you>.github.io/cyber-swiss-blade/` and install it from the browser address bar, or with **Add to Home Screen** on iOS.

If you use a different repository name, change `BASE` in `vite.config.ts` and `id`, `start_url`, `scope`, and `shortcuts` in `public/manifest.webmanifest`.

### 4. Connect the app

Open **Settings → Sync**, enter the Worker URL and the API token, and select **Save and sync**. Both are stored only in this browser's IndexedDB. Repeat on each device.

### Updating

| Change | Action | Result |
| --- | --- | --- |
| App code | Push to `main` | Open apps show **A new version is ready**; select **Reload** |
| Worker code | `npm run worker:deploy` | Live immediately; no app change needed |
| Rotate the API token | `npx wrangler@4.151.3 secret put API_TOKEN` | Enter the new token in Settings on each device |
| Change database | `npx wrangler@4.151.3 secret put MONGODB_URI` | Change the API URL in Settings too, or use **Disconnect** then reconnect, so devices re-upload |

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| "The API token was rejected." | The token in Settings does not match `API_TOKEN`. Re-enter it. |
| CORS error, or `Origin not allowed.` | Add the exact origin (scheme + host, no path) to `ALLOWED_ORIGINS` and redeploy the Worker. |
| "The sync server could not complete the request." | Run `npx wrangler@4.151.3 tail` in `worker/`. Usual causes: Network Access not open, wrong password, or a paused M0 cluster. |
| Pages loads a blank page or 404 assets | `BASE` in `vite.config.ts` does not match the repository name. |
| Old version still showing | The service worker serves the cached build until you select **Reload** on the update banner. |
| App is not installable | It must be served over HTTPS (Pages) or from `localhost`. |

## Integration test

Unit tests cover BSON, SCRAM (RFC 7677 vector), and sync logic. To run the wire client against a real server:

```sh
MONGODB_TEST_URI='mongodb+srv://user:pass@cluster.example.mongodb.net/' npx vitest run worker/src/mongo/integration.test.ts
```

It creates and drops a `csb_test_*` database, so use a user that may drop databases.

## Dependencies

There are no runtime dependencies. The browser bundle and the Worker contain first-party code only.

| Package | Licence | Role |
| --- | --- | --- |
| `vite`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint` | MIT | Build, test, lint |
| `typescript` | Apache-2.0 | Compiler, required by the brief |
| `wrangler` (via `npx`, pinned) | MIT OR Apache-2.0 | Worker deploys |

Transitive dev tooling includes ISC, BSD, Apache-2.0, MPL-2.0 (lightningcss), and BlueOak packages. None ship to users. `npm run licenses` prints the full list and fails CI if a direct dependency is not MIT.

## Limits

- **Workers free plan:** 100k requests/day and 10 ms CPU per request. The Worker caches derived SCRAM keys per isolate to stay inside the CPU budget.
- **Atlas M0:** 512 MB storage.
- **Authentication:** SCRAM-SHA-256 only. Use an ASCII database password; SASLprep is approximated with NFKC.
- **Sync batches:** one round pushes up to 200 changes and pulls up to 500 records per collection, for up to 10 rounds per sync.
- **AES:** runs in memory, so very large files (hundreds of MB) depend on device RAM.

## Licence

MIT. See [LICENSE](LICENSE).
