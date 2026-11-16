---
name: csb-modules
description: How Cyber Swiss Blade modules are structured and how to add a new tool. Use when creating a new module, changing the module registry, adding sub-routes to a module, or deciding whether code belongs in a module or in core.
---

# Modules

The modular design follows Oqtane: a shell hosts independent modules; each declares itself and owns its views and data. Unlike Oqtane, there is no runtime plugin loading or permission system. Registration is one import.

## Anatomy

```
src/modules/<id>/
  module.ts       ToolModule definition (metadata + lazy load). Imported eagerly; keep it tiny.
  types.ts        Persisted data types (type aliases), ShapeOf validators, collection names.
  data.ts         Repositories and pure functions (totals, filters, CSV). No DOM.
  data.test.ts    Tests for data.ts.
  view.ts         export function mount(root, context): Unmount. Routes context.path to sub-views.
  *-view.ts       One file per screen.
  <id>.css        Module styles, imported by view.ts, so they load with the chunk.
```

Register the module in `src/modules/registry.ts`. The shell, home grid, command palette, and sync engine all read from `MODULES`.

## ToolModule Contract (`src/core/types.ts`)

```typescript
interface ToolModule {
  readonly id: string;                      // URL segment: #/<id>/...
  readonly title: string;
  readonly summary: string;                 // one sentence for the home card
  readonly icon: IconName;                  // add paths to src/core/icons.ts if needed
  readonly category: ModuleCategory;        // groups the sidebar
  readonly collections: readonly string[];  // synced collections; [] for device-only tools
  readonly load: () => Promise<ModuleView>; // () => import('./view')
}
```

## Adding a Module (Checklist)

1. Create `src/modules/<id>/` with the files above.
2. Synced data: in `types.ts`, define `type` aliases, `ShapeOf<T>` validators, and collection names. Prefix each name with the module id, as in `timesheet_entries`. Names must match `COLLECTION_PATTERN`.
3. In `data.ts`, create repositories with `createRepository<T>(collection, shape)`. Export pure functions and test them.
4. Views follow `csb-state-testing` (4-branch rendering) and `csb-design-system`. Start with `moduleHeader(...)` from `core/ui`.
5. Subscribe to `onDataChange` for the module's collections so remote sync refreshes the view. Unsubscribe in `Unmount`.
6. Add one line to `registry.ts`.
7. Run `npm run lint && npm test && npm run build`.

You need no Worker change, no IndexedDB schema bump, and no service worker edit. All records share one `records` store keyed by `[collection, id]`, and the precache list comes from the build.

## Boundaries

- Modules never import from other modules. If two modules need the same behaviour, move it to `src/core/` (DOM/app) or `shared/` (also used by the Worker).
- Modules never touch `localStorage`, `fetch`, or IndexedDB directly. Use repositories, or `getMeta`/`setMeta` for local-only state such as the running timer.
- Device-only tools (`collections: []`) must keep user data in memory or download it. They never persist secrets such as passwords.
