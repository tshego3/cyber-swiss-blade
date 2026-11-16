# Onboarding Guide

This guide is for developers who start work on Cyber Swiss Blade. It shows you how to run the app, how the code works, and how to make your first change.

To put the app online, use the [Deployment Guide](deployment.md).

**Bold text** is a button, a menu, or a key. `Code text` is text that you type, or a file name.

---

## Part 1: Rules of the project

Read these rules before you change the code.

| Rule | What it means |
| --- | --- |
| Use native code | Use TypeScript, HTML, CSS, and browser features. Do not add a UI framework. Do not add a runtime package. |
| One tool, one folder | Each tool is a folder in `src/modules/`. The app finds tools only through `src/modules/registry.ts`. |
| Access by role | A tool is `public` or `restricted`. Restricted tools need a sign-in. Administrators give View and Edit permission to roles. |
| Save locally first | The app saves all data on the device first. It uses the network only to sync. |
| MIT licence only | A new package must have the MIT licence. You must also show that you cannot write it yourself. |
| Keep code simple | If code needs a comment to explain it, make the code simpler. |

The full rules are in the folder `.claude/skills/`. Read the skill that matches your work:

| Skill | Read it before you change |
| --- | --- |
| `csb-engineering` | Any code |
| `csb-modules` | A tool, or the tool list |
| `csb-data-sync` | The database, sync, the Worker, the service worker, or security |
| `csb-design-system` | Screens, CSS, or icons |
| `csb-state-testing` | Screens that load data, or tests |

---

## Part 2: Run the app on your computer

You do not need a MongoDB or Cloudflare account for this part.

### 2.1 Install the tools

1. Make sure that Node.js 24 or higher is installed. Type `node -v` in Terminal ([how to open Terminal](deployment.md#11-open-terminal)) and press **Enter**.
2. If Node.js is not installed, do step 1.2 of the [Deployment Guide](deployment.md#12-make-sure-that-nodejs-is-installed).

### 2.2 Get the code and start the app

1. Type these commands in Terminal. Press **Enter** after each line. Replace `yourname` with the GitHub username.
   ```sh
   git clone https://github.com/yourname/cyber-swiss-blade.git
   cd cyber-swiss-blade
   npm ci
   npm run dev
   ```
   Example of the first line: `git clone https://github.com/jsmith/cyber-swiss-blade.git`
   **Result:** Terminal shows the address `http://localhost:5173/cyber-swiss-blade/`.
2. Open this address in your browser.
   **Result:** The home page of the app opens.

### 2.3 Try the public tools

1. Click **AES Encryption**, then the **Text** tab. Encrypt a sentence. Then decrypt it.
2. Click **Base64**. Encode a sentence.
3. Press **Ctrl + K**. On macOS, press **Command + K**.
   **Result:** The command palette opens.

> **NOTE:** Timesheet and Quotations show **Sign in**. They need a Worker and an account. Part 7 shows how to run the Worker on your computer.

### 2.4 Stop the app

1. In Terminal, press **Ctrl + C**.

---

## Part 3: Find your way in the code

| Path | What it contains |
| --- | --- |
| `src/main.ts` | The start of the app. It makes the layout, starts the router and sync, and registers the service worker. |
| `src/sw.ts` | The service worker. It keeps the app files on the device, so the app works offline. |
| `src/core/dom.ts` | `el()`, the only way to make HTML elements. |
| `src/core/ui.ts` | Shared screen parts: buttons, fields, dialogs, messages, and empty, error, and loading states. |
| `src/core/icons.ts` | The icons, as SVG paths. |
| `src/core/db.ts` | The local database (IndexedDB). |
| `src/core/repository.ts` | `createRepository()`. Each tool uses it to read and save its data. |
| `src/core/shape.ts` | Checks that saved data has the correct type. |
| `src/core/sync.ts` | The sync engine. It sends changes and gets changes. |
| `src/core/api.ts` | Calls to the Worker. |
| `src/core/session.ts` | Sign-in, the cached session, and the permission checks `canView()` and `canEdit()`. |
| `src/core/auth-view.ts`, `admin-view.ts` | The sign-in screen, and the Administration screen for users, roles, and permissions. |
| `shared/access.ts` | The list of restricted tools, their collections, and the default roles. The app and the Worker both read it. |
| `src/modules/registry.ts` | The list of tools. |
| `src/modules/<tool>/` | One tool: `timesheet`, `quotations`, `aes`, or `base64`. |
| `src/styles/` | Colours, fonts, spacing, and the layout. |
| `shared/` | Code that the app and the Worker both use. |
| `worker/src/` | The Worker: routes (`index.ts`), accounts (`auth.ts`, `session.ts`), administration (`admin.ts`), sync (`sync.ts`), and the MongoDB connection (`mongo/`). |
| `scripts/import-agile-report.mjs` | The one-time import of an Agile Report workbook. |

---

## Part 4: How data moves

1. A screen calls `save()` on a repository.
2. The repository saves the record on the device. It also adds the record to a send list (the outbox).
3. After 2 seconds, the sync engine sends the outbox to the Worker.
4. The Worker checks the session and the permissions of the user. To pull, the user needs View. To push, the user needs Edit.
5. The Worker saves each record in MongoDB if it is newer. In owner-scoped collections, such as `timesheet_logs`, the Worker adds the user ID as `ownerId`.
6. The Worker sends back records that changed on other devices. In owner-scoped collections, a user gets only their own records. Administrators get all records.
7. The app saves those records on the device.
8. Open screens show the new data.

> **NOTE:** Screens never call the network or the local database directly. They call the `data.ts` file of their tool.

---

## Part 5: Daily work

### 5.1 Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app. The page updates when you save a file. |
| `npm test` | Runs the tests. |
| `npm run lint` | Checks the code style. |
| `npm run build` | Checks the types and makes the final files in `dist/`. |
| `npm run preview` | Starts the final files with the service worker on port 4173. |

### 5.2 Before you push

Do all of these checks:

- [ ] `npm run lint` shows no errors.
- [ ] `npm test` shows no failed tests.
- [ ] `npm run build` shows no errors.
- [ ] New logic in a `data.ts` file or a `core/` file has a test file next to it.
- [ ] You looked at the screen in the light theme and the dark theme.
- [ ] You looked at the screen at phone width (390 pixels).
- [ ] You added no package. If you must add one, it is MIT, and `npm run licenses` shows no error.
- [ ] The code has no secrets, no `innerHTML`, no `any`, and no `!` after a value.

---

## Part 6: Your first change: add a tool

This example adds a UUID tool. It makes random IDs. You make two files and change one line.

### 6.1 Make the tool folder

1. In the folder `src/modules/`, make a new folder with the name `uuid`.

### 6.2 Make the tool description

1. In the folder `src/modules/uuid/`, make the file `module.ts` with this text:

```typescript
import type { ToolModule } from '../../core/types';

export const uuidModule: ToolModule = {
  id: 'uuid',
  title: 'UUID',
  summary: 'Generate random v4 UUIDs and copy them.',
  icon: 'braces',
  category: 'Encoding',
  access: 'public',
  collections: [],
  load: () => import('./view'),
};
```

### 6.3 Make the tool screen

1. In the same folder, make the file `view.ts` with this text:

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

### 6.4 Add the tool to the list

1. Open `src/modules/registry.ts`.
2. Add this line below the other `import` lines:
   ```typescript
   import { uuidModule } from './uuid/module';
   ```
3. Add `uuidModule` at the end of the `MODULES` list.
4. Save the file.
   **Result:** The menu, the home page, and the command palette show **UUID**.

### 6.5 Save data that syncs (optional)

If your tool must save data, do these steps:

1. In `types.ts`, write the data type as a `type`, not an `interface`.
2. In `types.ts`, write a `ShapeOf` object for the type.
3. In `data.ts`, make a repository:
   ```typescript
   export const snippets = createRepository<Snippet>('snippets_items', snippetShape);
   ```
4. In `module.ts`, set `access: 'restricted'`, and put the collection name in `collections`.
5. In `shared/access.ts`, add the tool to `MODULE_ACCESS`. Give the same collections, the owner-scoped collections, and the default View and Edit roles.
6. In your screens, use `context.canEdit` to disable inputs for users who can only view.
7. Deploy the Worker (`npm run worker:deploy`). The Worker refuses collections that are not in `MODULE_ACCESS`.

The test `src/modules/registry.test.ts` fails if steps 4 and 5 do not match. For a full example screen, look at `src/modules/quotations/catalogue-view.ts`.

---

## Part 7: Run the Worker on your computer

You need your **Connection string** from step 2.6 of the [Deployment Guide](deployment.md#26-copy-the-connection-string).

1. In the folder `worker/`, make a file with the name `.dev.vars` and this text. Use a code editor, for example VS Code. Notepad and TextEdit can add `.txt` to the name. `API_TOKEN` is the setup key. Use 32 characters or more.
   ```
   MONGODB_URI=YOUR_CONNECTION_STRING
   API_TOKEN=YOUR_API_TOKEN
   ```
2. Replace `YOUR_CONNECTION_STRING` with your **Connection string**. Replace `YOUR_API_TOKEN` with your **API token**.
   Example:
   ```
   MONGODB_URI=mongodb+srv://csb-api:Xk82mQ4pLr7TnB2v@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority
   API_TOKEN=4b1e8f2a6c3d9e0f7a5b2c8d1e4f6a9b3c7d0e2f5a8b1c4d7e0f3a6b9c2d5e8f
   ```
3. In Terminal, type `npm run worker:dev` and press **Enter**.
   **Result:** The Worker runs at `http://localhost:8787`.
4. In the app, click **Sign in**.
5. In **Server URL**, type `http://localhost:8787`. Type any username and password. Click **Sign in**.
   **Result:** The page shows **Create the administrator**.
6. In **Setup key**, type the `API_TOKEN` value from `.dev.vars`. Fill in the other fields. Click **Create administrator**.
   **Result:** Timesheet, Quotations, and Administration open.

> **CAUTION:** Use a test database in `MONGODB_URI`, for example a name in `MONGODB_DB` that ends with `_dev`. The Worker writes users and data to it.

> **WARNING:** Git ignores the file `.dev.vars`. Do not rename it. Do not put its values in another file.

The Worker log shows in the Terminal window where the Worker runs.

---

## Part 8: Fix a problem

| Problem | Solution |
| --- | --- |
| `npm run preview` shows an old version. | Click **Reload** on the update message. Or open the browser developer tools, go to **Application**, then **Service workers**, and click **Unregister**. |
| An inline `<script>` or `style=""` does not work in preview. | The security policy blocks inline code. Use a module, a CSS class, or `element.style.setProperty()`. |
| ESLint shows "Build DOM with el() instead of innerHTML". | Do not use HTML text. Use `el()` from `src/core/dom.ts`. |
| TypeScript shows an error on saved data. | Write the saved data type as a `type`, not an `interface`. |
| A screen continues to run after you leave it. | The function that `mount()` returns must stop all timers and listeners. |
| Sync shows "You do not have access to …". | The collection is not in `MODULE_ACCESS` in `shared/access.ts`, or your roles have no View permission. Deploy the Worker after you change `shared/access.ts`. |
| Old saved records do not show after you add a field. | Give `createRepository()` an upgrade function that fills the new field. See `upgradeQuote()` in `src/modules/quotations/data.ts`. |
| Port 5173 or 4173 is not free. | Type `npm run dev -- --port 5174`. To sync from that port, add `http://localhost:5174` to `ALLOWED_ORIGINS` in `worker/wrangler.toml`. |

---

## Part 9: Where to find answers

| Question | Where to look |
| --- | --- |
| How do I deploy? How do I change a token? Why does sync fail? | [Deployment Guide](deployment.md) |
| What is the rule for this code? | `.claude/skills/` |
| How does the MongoDB connection work? | `worker/src/mongo/` and its test files |
