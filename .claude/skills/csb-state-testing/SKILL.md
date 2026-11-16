---
name: csb-state-testing
description: 4-branch view state pattern and Vitest testing rules for Cyber Swiss Blade. Use when building or editing any view that loads async data (loading/error/empty states), handling errors in views, deriving filtered data, or writing/updating tests.
---

# View State and Testing

## View State Pattern (vanilla DOM)

Each async view keeps one immutable state object in its `mount` closure and replaces it through `setState`:

```typescript
interface ListState {
  readonly items: readonly Entity<Item>[];   // always initialised to []
  readonly search: string;                   // filter inputs live in state
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
}

let state: ListState = { items: [], search: '', isLoading: true, errorMessage: null };
const setState = (patch: Partial<ListState>): void => {
  state = { ...state, ...patch };
  render();
};
```

Rules:
1. Initialise collections to `[]` and start with `isLoading: true`.
2. `load()` sets `isLoading: false` exactly once per outcome, together with data or `errorMessage`.
3. Derived values (filtered lists, totals, summaries) are never stored. Compute them in `render` with pure functions from `data.ts`.
4. Re-render only the region that changes (for example `results`), so inputs keep focus while typing.
5. Subscribe to `onDataChange` for the view's collections and reload. Return an `Unmount` that clears intervals, unsubscribes, and empties `root`.

## 4-Branch Rendering (exact order)

```typescript
if (state.isLoading) return replaceChildren(content, [loadingState('Loading quotes')]);
if (state.errorMessage) return replaceChildren(content, [errorState(state.errorMessage, () => void load())]);
if (state.items.length > 0) return replaceChildren(content, renderItems(state));
replaceChildren(content, [emptyState({ icon, title, text, action })]);
```

Never skip a branch. The error branch always offers Try again. The empty branch always tells the user what to do next. A filter with no matches shows a short inline message, not the empty state.

## Error Messages

1. Network: "Network error. Please check your connection."
2. Data: "Unable to load <thing>." / "The sync server sent an unexpected response."
3. Fallback: "Something went wrong. Please try again."

Log the raw error with `console.error`. Never render it.

## Testing (Vitest)

1. Co-locate tests: `data.ts` → `data.test.ts`. The environment is Node; WebCrypto, TextEncoder, and DataView are available.
2. Test pure logic: module calculations (totals, discounts, deposits, invoice state, numbering, the timesheet day merge, routines, TSV, the `.xlsx` workbook), access rules (`grantsFor`, owner scope, session tokens), core helpers (durations, dates, shapes, base64, `shouldApplyRemote`), crypto round-trips and failures, the BSON codec, SCRAM against the RFC 7677 and MongoDB SCRAM-SHA-1 vectors, MD5 against RFC 1321, and Worker sync validation/LWW with a fake `MongoDatabase`.
3. Name tests by behaviour: `it('keeps a pending local change that is newer than the remote record')`.
4. AES tests use 100,000 PBKDF2 iterations (the minimum the decoder accepts) to stay fast.
5. `worker/src/mongo/integration.test.ts` runs only when `MONGODB_TEST_URI` is set.
6. Before completion, run `npm run lint`, `npm test`, and `npm run build`. For UI changes, run `npm run preview` and check light, dark, 390px width, and offline (stop the server, reload).
