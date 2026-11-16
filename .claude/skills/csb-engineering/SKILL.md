---
name: csb-engineering
description: Core engineering rules for Cyber Swiss Blade (vanilla TypeScript + Vite PWA, Cloudflare Worker, MongoDB). Use before ANY feature work, bug fix, refactor, or dependency change in this repository - covers platform identity, architecture boundaries, project structure, TypeScript strictness, dependency/licence policy, change management, build, and deployment.
---

# Engineering Rules (Vanilla TypeScript + Vite PWA)

These rules are mandatory for all feature work, bug fixes, and refactors.

## Platform Identity

1. Stack: TypeScript, HTML, CSS, native browser APIs, built by Vite. No UI framework, no router library, no CSS framework, no runtime npm dependencies.
2. Cyber Swiss Blade is a personal, offline-first toolkit. Each tool is a module (see `csb-modules`). It is derived from feeds-pwa's conventions with React/Mantine/Workbox/idb removed.
3. Hosting: static PWA on GitHub Pages (`base: '/cyber-swiss-blade/'`). API: one Cloudflare Worker in `worker/`. Database: MongoDB Atlas M0. All free tier.

## Non-Negotiable Architecture Rules

1. No app server beyond `worker/`. The Worker exposes only `GET /status` and `POST /sync`. New features use the generic sync protocol; do not add per-module endpoints.
2. The browser never talks to MongoDB and never sees database credentials. `MONGODB_URI` and `API_TOKEN` live only in Cloudflare secrets (`wrangler secret put`). `worker/.dev.vars` is git-ignored.
3. Local-first: every write goes to IndexedDB through `src/core/repository.ts`. The network is only for sync.
4. Code shared by app and Worker lives in `shared/` and must not touch the DOM or Worker-only APIs.
5. Modules never import from other modules. Shared behaviour moves into `src/core/` or `shared/`.

## Architecture Layers

```
Views (src/modules/*/view.ts)  ->  Module data (data.ts: repositories + pure functions)  ->  Core services (src/core)  ->  shared/
Worker: index.ts (HTTP, CORS, auth) -> sync.ts (validation, LWW) -> mongo/ (wire protocol, SCRAM, BSON)
```

| Layer | Responsibility | Location |
| --- | --- | --- |
| Shared | Sync protocol types and guards, byte helpers | `shared/` |
| Core | Shell, router, DB, repository, sync engine, UI kit, theme, PWA | `src/core/` |
| Module data | Repositories, pure calculations, validation shapes | `src/modules/<id>/data.ts`, `types.ts` |
| Module views | DOM rendering and event wiring | `src/modules/<id>/*-view.ts`, `view.ts` |
| Styles | Tokens, base components, shell; module CSS beside its view | `src/styles/`, `src/modules/<id>/*.css` |
| Service worker | Precache + cache-first offline shell | `src/sw.ts` |
| API | Auth, CORS, validation, MongoDB access | `worker/src/` |

**Golden rule:** views never call `fetch` or IndexedDB directly. They call module data functions or core services.

## TypeScript Rules

1. `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals/Parameters`. Warnings are errors.
2. No `any`, no non-null assertions (`!`), no `@ts-ignore`. ESLint enforces `explicit-function-return-type`.
3. `interface` for object shapes. Exception: persisted module data uses `type` aliases so it stays assignable to `JsonObject`.
4. Validate everything crossing a boundary (IndexedDB reads, API responses, request bodies) with a type guard or `matchesShape`. Do not cast unknown data.
5. `readonly` on all model properties. `const` by default; `let` only for local view state that a `setState` closure replaces.
6. Functional module pattern. No classes.
7. Module-level mutable state only for a single cached resource inside core (`db.ts` connection, Worker SCRAM key cache).

## Robust Coding Principles

1. Guard clauses and early returns. No nested ternaries.
2. Keep functions short. A view `mount` may hold small render closures; extract anything reusable.
3. Every loop has a fixed upper bound (sync rounds, SASL steps, BSON depth).
4. Never leave a Promise floating: `await` it, or prefix `void` when fire-and-forget is intended.
5. Typed errors as plain objects with `type` and `message` (`ApiError`, `CryptoError`, `MongoServerError`, `ValidationError`). Never `throw new Error('failed')` in app code.
6. Timeouts on every network call (`AbortSignal.timeout`).
7. User-facing messages are safe and generic. Log details with `console.error`, never render them.
8. No `innerHTML`, `insertAdjacentHTML`, `eval`, or `Function` (ESLint blocks the first two). Build DOM with `el()`.

## Dependencies and Licences

1. Runtime dependencies: none. Implement natively first.
2. A new package needs all of these: (a) it is impossible or unreasonable to build natively, (b) it uses the MIT licence, verified in its `package.json` and repository, (c) it is free with no paid tier needed, (d) it is maintained with no known CVEs, (e) the version is pinned exactly and at least two weeks old.
3. `typescript` (Apache-2.0) is the only allowed non-MIT direct dependency. `npm run licenses` fails on any other.
4. Run Wrangler via `npx wrangler@<pinned>`; it is not a dependency.

## Change Management

1. Make the smallest diff that solves the problem. Code is liability.
2. Match surrounding naming and style. Reuse core helpers before you add new ones.
3. If code needs a comment to explain it, simplify it. No em dashes or emojis in code comments.
4. No placeholder or mock data in shipped code.
5. Before you finish, run `npm run lint`, `npm test`, and `npm run build`. Run `npm run licenses` after any dependency change.

## Deployment

1. GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys `dist/` to Pages on push to `main`.
2. Deploy the Worker with `npm run worker:deploy`. Keep `ALLOWED_ORIGINS` in `worker/wrangler.toml` limited to the Pages origin and localhost.
3. No source maps in production.
