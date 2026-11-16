# Onboarding

This guide gets you from clone to your first merged change. For deployment, see the [Deployment Guide](deployment.md).

## 1. The ideas behind the code

| Principle | In practice |
| --- | --- |
| Native first | TypeScript, HTML, CSS, and browser APIs. No UI framework, no runtime npm packages. |
| Modular | Each tool is a folder in `src/modules/`. The shell knows tools only through `src/modules/registry.ts`. |
| Offline first | Every write lands in IndexedDB. The network is only for sync. |
| MIT only, free only | A new package needs an MIT licence and a reason it cannot be built natively. Hosting stays on free tiers. |
| Code explains itself | If a block needs a comment, simplify it instead. |

The detailed rules are project skills in `.claude/skills/`. Read them once:

| Skill | Read it before you touch |
| --- | --- |
| `csb-engineering` | anything |
| `csb-modules` | a module or the registry |
| `csb-data-sync` | IndexedDB, sync, the Worker, the service worker, security |
| `csb-design-system` | views, CSS, icons |
| `csb-state-testing` | async views or tests |

## 2. First run (5 minutes)

You need Node.js 24 and npm 11. No Cloudflare or MongoDB account is needed to develop.

```sh
git clone https://github.com/<you>/cyber-swiss-blade.git
cd cyber-swiss-blade
npm ci
npm run dev
```

Open `http://localhost:5173/cyber-swiss-blade/`, then check each module:

1. **Timesheet → New project**: create a project, then select **Start** on the timer.
2. **Quotations**: add a client, create a quote, and edit a line. Totals update as you type.
3. **AES Encryption → Text**: encrypt a sentence, then decrypt it.
4. Press `⌘K` (or `Ctrl K`) to open the command palette.

The sidebar shows **Local only**. That is correct until you connect a sync server.

## 3. Project tour

```
src/
  main.ts              App entry: builds the shell, routes, starts sync, registers the service worker
  sw.ts                Service worker (precache + cache-first, no imports)
  core/
    types.ts           ToolModule, SyncState, ApiConfig
    dom.ts             el(): typed element builder (the only way to create DOM)
    ui.ts              UI kit: button, field, dialogs, toasts, states, dropzone
    icons.ts           Hand-drawn SVG icon paths
    db.ts              IndexedDB: records, outbox, meta
    repository.ts      createRepository<T>(collection, shape)
    shape.ts           Runtime validation that matches a TypeScript type
    sync.ts            Sync engine (push outbox, pull changes, triggers)
    api.ts             Worker client with timeouts and typed errors
    shell.ts, home.ts, settings-view.ts, palette.ts, router.ts, theme.ts, pwa.ts
  modules/
    registry.ts        The list of tools
    timesheet/ quotations/ aes/ base64/
  styles/              tokens.css (colours, type, spacing), base.css, shell.css
shared/                protocol.ts and bytes.ts, used by the app and the Worker
worker/src/
  index.ts             HTTP routes, CORS, Bearer auth
  sync.ts              Request validation, last-write-wins upserts, pulls
  mongo/               BSON, OP_MSG wire protocol, SCRAM-SHA-256, primary discovery
```

## 4. How data moves

```
view → repository.save()      IndexedDB: records + outbox (one transaction)
     → onDataChange('local')  sync engine waits 2 s, then POST /sync
                              Worker: validate → upsert if newer → pull since cursor
     ← response               client applies newer records, clears the pushed outbox, stores the cursor
     → onDataChange('remote') open views reload
```

Views never call `fetch` or IndexedDB. They call their module's `data.ts`, which uses `core/`.

## 5. Daily workflow

```sh
npm run dev                          # build features with hot reload
npm test                             # fast, Node-based unit tests
npm run lint && npm run build        # before every push
npm run build && npm run preview     # check PWA, offline, and update behaviour
```

Before you open a pull request:

- [ ] `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] New logic in a `data.ts` or `core/` file has tests beside it.
- [ ] The UI is checked in light and dark themes and at 390px width.
- [ ] No new dependency. If one is unavoidable, it is MIT, pinned, and `npm run licenses` passes.
- [ ] No secrets, `innerHTML`, `any`, or `!` non-null assertions.

## 6. Your first change: add a tool

This adds a UUID generator. It needs two new files and one changed line.

`src/modules/uuid/module.ts`

```typescript
import type { ToolModule } from '../../core/types';

export const uuidModule: ToolModule = {
  id: 'uuid',
  title: 'UUID',
  summary: 'Generate random v4 UUIDs and copy them.',
  icon: 'braces',
  category: 'Encoding',
  collections: [],
  load: () => import('./view'),
};
```

`src/modules/uuid/view.ts`

```typescript
import '../tools.css';
import { el } from '../../core/dom';
import type { Unmount } from '../../core/types';
import { button, copyToClipboard, pageHeader } from '../../core/ui';

export function mount(root: HTMLElement): Unmount {
  const output = el('p', { class: 'mono', text: crypto.randomUUID() });
  root.append(
    el('div', { class: 'module-header' }, [pageHeader({ title: 'UUID', subtitle: 'Random v4 identifiers.' })]),
    el('section', { class: 'card tool-panel stack' }, [
      output,
      el('div', { class: 'row' }, [
        button({ label: 'Generate', icon: 'refresh', variant: 'primary', onClick: () => (output.textContent = crypto.randomUUID()) }),
        button({ label: 'Copy', icon: 'copy', onClick: () => void copyToClipboard(output.textContent ?? '') }),
      ]),
    ]),
  );
  return () => root.replaceChildren();
}
```

`src/modules/registry.ts`: import `uuidModule` and add it to `MODULES`.

The sidebar, home grid, and command palette now list the tool. Its code loads only when it is opened.

**To sync data**, define a `type` and a `ShapeOf<T>` in `types.ts`, then create a repository in `data.ts`:

```typescript
export const snippets = createRepository<Snippet>('snippets_items', snippetShape);
```

Then list the collection name in `collections`. You don't need a Worker or database change. Copy the Timesheet projects view for the loading/error/data/empty pattern and the `onDataChange` subscription.

## 7. Working on the Worker

1. Create `worker/.dev.vars` (git-ignored):
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.example.mongodb.net/
   API_TOKEN=<at least 32 characters>
   ```
2. Run `npm run worker:dev`. The Worker listens on `http://localhost:8787`.
3. In the app, open **Settings → Sync** and enter `http://localhost:8787` and the token.
4. Local Worker logs print in the `worker:dev` terminal. For the deployed Worker, run `npx wrangler@4.151.3 tail` in `worker/`.

Worker unit tests use a fake database. To test against a real MongoDB, set `MONGODB_TEST_URI` and run `worker/src/mongo/integration.test.ts` (see the README).

## 8. Common issues

| Problem | Fix |
| --- | --- |
| `npm run preview` shows an old build | The service worker serves the cached version. Select **Reload** on the update banner, or in DevTools go to Application → Service workers → Unregister. |
| Inline `<script>` or `style=""` does not work in preview | The production Content Security Policy blocks inline code. Use modules, CSS classes, or `element.style.setProperty`. |
| ESLint: "Build DOM with el() instead of innerHTML" | Rendering HTML strings is banned. Use `el()` from `core/dom.ts`. |
| Type error on persisted data | Persisted module data must be a `type` alias (not an `interface`) so it is assignable to `JsonObject`. |
| A view keeps running after you navigate away | The `Unmount` you return must clear intervals and call the `onDataChange` unsubscribe. |
| Port 5173 or 4173 is busy | Pass `--port`, for example `npm run dev -- --port 5174`. To sync from that port, add `http://localhost:5174` to `ALLOWED_ORIGINS` in `worker/wrangler.toml`. |

## 9. Where to ask what

| Question | Look in |
| --- | --- |
| How do I deploy, rotate a token, or troubleshoot sync? | [deployment.md](deployment.md) |
| What is the rule for X? | `.claude/skills/` |
| How does the wire protocol work? | `worker/src/mongo/*.ts` and their tests |
