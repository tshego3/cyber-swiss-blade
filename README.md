# Cyber Swiss Blade

Cyber Swiss Blade is a set of developer tools in one app. You can install it on a computer or a phone. It works without an internet connection. All services that it uses are free.

| Tool | What it does | Where it keeps data |
| --- | --- | --- |
| Timesheet | Your weekly Agile Report. You log work items, meetings, notes, and leave per day. The app merges each day into one report row and exports the year to Excel. | On the device. It syncs to MongoDB. Each person sees only their own timesheet. |
| Quotations | Quotes, deposit invoices, final invoices, payments, clients, and a service catalogue. You can print each document to PDF. | On the device. It syncs to MongoDB. Shared by the people who have access. |
| AES Encryption | Encrypts and decrypts files and text with a password. | On the device only. |
| Base64 | Changes text and files to Base64, and back. | On the device only. |
| Docs | Guides, cheat sheets, and code samples from GitHub gists, with search, page navigation, and code highlighting. | In the app files. The text works offline. Images in some articles load from the web. |

## Start here

| You want to | Read |
| --- | --- |
| Put the app online | [Deployment Guide](docs/deployment.md). It shows each click in MongoDB, Cloudflare, and GitHub. |
| Change the code | [Onboarding Guide](docs/onboarding.md). It shows how to run the app and add a tool. |

## Accounts and roles

Timesheet and Quotations need a sign-in. AES Encryption, Base64, and Docs do not.

| Part | What it does |
| --- | --- |
| Setup | When a server has no users, the first sign-in creates the administrator. It needs the setup key (the `API_TOKEN` secret). |
| Users | Administrators add users, reset passwords, and disable accounts in **Administration**. |
| Roles | Every user has the role **Registered users**. Administrators can add more roles, for example **Quotation editors**. |
| Permissions | Each tool has View and Edit permissions. Administrators give them to roles. Administrators always have full access. |
| Offline | After you sign in, the app works offline with your last permissions. The Worker checks the permissions again at each sync. |

The browser stretches each password with PBKDF2 (600,000 rounds) before it sends it. The Worker stores only a salted hash of that result.

## How it works

```
Your device                     Cloudflare (free)                MongoDB Atlas (free)
App from GitHub Pages  ──────►  Worker (the sync API)  ──────►  Database
Data on the device              Keeps the database password
```

1. The app saves each change on the device first.
2. The app sends the changes to the Worker with your session. The Worker checks your permissions and saves the changes in MongoDB.
3. The Worker sends back the changes from your other devices.
4. Sync starts when the app opens, 2 seconds after a change, when the device goes online, and every 5 minutes.

**Sync rules:**
- If two devices change the same record, the newest change wins.
- A deleted record stays as a marker (`deleted: true`). The marker deletes the record on the other devices.
- The Worker waits 60 seconds before it moves the sync position past a change. This prevents lost changes.
- If you connect to a different Worker, the app sends all its data again.

## Project folders

| Folder | What it contains |
| --- | --- |
| `src/core/` | The shared parts: layout, router, local database, sync, screen parts, and theme. |
| `src/modules/<tool>/` | One tool. `module.ts` describes it. `view.ts` loads only when you open the tool. |
| `src/styles/` | Colours, fonts, spacing, and layout. |
| `shared/` | Code that the app and the Worker both use. |
| `worker/` | The sync API. It connects to MongoDB without a driver package, because the official driver does not have the MIT licence. |
| `docs/` | The deployment guide and the onboarding guide. |
| `src/modules/docs/articles/` | The Docs articles, one Markdown file each. `.claude/skills/csb-docs-writing` has the writing rules. |
| `.claude/skills/` | The rules of the project. |

## What you need

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 24 or higher | To build and run the app. |
| Git and a GitHub account | Any | To put the website online. |
| Cloudflare account | Free plan | For the sync API. |
| MongoDB Atlas account | Free cluster | For the database. |

> **NOTE:** The app works without Cloudflare and MongoDB. You need them only for sync and backup.

## Run the app on your computer

1. Open Terminal. The [Deployment Guide](docs/deployment.md#11-open-terminal) shows how on Windows, macOS, and Linux.
2. Type these commands. Press **Enter** after each line. Replace `yourname` with the GitHub username, for example `jsmith`.
   ```sh
   git clone https://github.com/yourname/cyber-swiss-blade.git
   cd cyber-swiss-blade
   npm ci
   npm run dev
   ```
3. Open `http://localhost:5173/cyber-swiss-blade/` in your browser.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the app. The page updates when you save a file. |
| `npm test` | Runs the tests. |
| `npm run lint` | Checks the code style. |
| `npm run build` | Checks the types and makes the final files in `dist/`. |
| `npm run preview` | Starts the final files on port 4173. The service worker runs here. |
| `npm run licenses` | Shows the licence of each installed package. |
| `npm run worker:dev` | Starts the Worker on your computer, on port 8787. |
| `npm run worker:deploy` | Sends the Worker to Cloudflare. |
| `node scripts/import-agile-report.mjs <file> --api <URL>` | Imports an Agile Report workbook into your timesheet, one time. Add `--dry-run` to check the file first. |

**Test the app without internet:**
1. Type `npm run build`, then `npm run preview`.
2. Open the app one time.
3. Stop the preview with **Ctrl + C**.
4. Reload the page.
   **Result:** The app opens.

## Put the app online

Use the [Deployment Guide](docs/deployment.md). You can use the websites or Terminal. Part 8 of the guide shows the Terminal method.

This is a summary:

| Step | Service | Result |
| --- | --- | --- |
| 1 | MongoDB Atlas | A free database, a database user, and a connection string. |
| 2 | Cloudflare | The Worker at `cyber-swiss-blade-api.<your-name>.workers.dev`, with two secrets. |
| 3 | GitHub Pages | The website at `https://<your-name>.github.io/cyber-swiss-blade/`. GitHub Actions deploys it after each push to `main`. |
| 4 | The app | You sign in with the Worker URL and create the administrator with the setup key. Then you add your team. |

> **WARNING:** Keep the database password and the setup key only in Cloudflare and your password manager. Do not put them in the code.

## Test with a real database

The normal tests do not need a database. This test uses a real MongoDB database:

```sh
MONGODB_TEST_URI='mongodb+srv://user:pass@cluster.example.mongodb.net/' npx vitest run worker/src/mongo/integration.test.ts worker/src/auth.integration.test.ts
```

> **NOTE:** The tests write to databases with names that start with `csb_test_`. Then they delete the test collections. MongoDB then removes the empty databases.

## Packages

The app and the Worker use no packages when they run. All their code is in this project.

These packages are for building and testing only:

| Package | Licence | Use |
| --- | --- | --- |
| `vite`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint` | MIT | Build, test, and code checks |
| `typescript` | Apache-2.0 | The TypeScript compiler. The project rules allow it. |
| `wrangler` (with `npx`) | MIT or Apache-2.0 | Sends the Worker to Cloudflare |

Some packages inside these tools have other licences, for example ISC, BSD, and MPL-2.0. They do not go into the app. `npm run licenses` shows the full list.

## Limits

| Limit | Value |
| --- | --- |
| Cloudflare free plan | 100,000 requests each day. 10 ms of CPU time for each request. |
| MongoDB free cluster | 512 MB of data. |
| Database password | Use only letters and digits. |
| One sync round | Sends up to 200 changes and gets up to 500 records for each type of data. |
| AES files | The file must fit in the memory of the device. |
| Sign-in attempts | 5 wrong passwords lock the account for 15 minutes. |
| Sessions | A session lasts 30 days. A password change ends the other sessions of the user. |
| Logo on documents | 200 KB or less. |

## Licence

MIT. See [LICENSE](LICENSE).
