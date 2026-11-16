# Deployment Guide

This guide takes you from nothing to a live, syncing app. No prior cloud experience is needed. Every click is written out.

- **Time:** about 45 minutes.
- **Cost:** free. MongoDB Atlas Free cluster, Cloudflare Workers Free plan, and GitHub Pages on a public repository.
- **Order:** 1 Database → 2 API → 3 Website → 4 Connect the app.

> Cloud dashboards change their wording from time to time. If a label differs slightly, look for the closest match in the same place.

## What you are building

```
Your phone / laptop                 Cloudflare (free)                 MongoDB Atlas (free)
┌───────────────────────┐  HTTPS   ┌─────────────────────────┐  TLS  ┌─────────────────────┐
│ Cyber Swiss Blade app │ ───────► │ Worker: the sync API    │ ────► │ Free cluster: data  │
│ (from GitHub Pages)   │  token   │ holds the DB password   │       │                     │
└───────────────────────┘          └─────────────────────────┘       └─────────────────────┘
```

The app always works offline. The Worker and database add backup and sync between your devices.

## Values you will collect

Open a note in your password manager now and fill this in as you go. Never paste these values into the code, chat, or a public place.

| # | Value | Example | From step |
| --- | --- | --- | --- |
| A | Database username | `csb-api` | 1.3 |
| B | Database password | `Xk82mQ...` | 1.3 |
| C | Connection string | `mongodb+srv://csb-api:Xk82...@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority` | 1.5 |
| D | API token | 64 random letters and digits | 2.5 |
| E | Worker URL | `https://cyber-swiss-blade-api.yourname.workers.dev` | 2.4 |
| F | Website URL | `https://yourname.github.io/cyber-swiss-blade/` | 3.4 |

---

## Part 0: Prepare your Mac

You run a few commands in **Terminal**, the text window for typing commands.

1. Press `⌘ Space`, type `Terminal`, and press Return.
2. Check that Node.js is installed. Type the command, then press Return:
   ```sh
   node -v
   ```
   - If you see `v24.x.x` (or newer), continue.
   - If you see `command not found`, go to https://nodejs.org, download the **LTS** installer for macOS, run it, then close and reopen Terminal.
3. Check Git:
   ```sh
   git --version
   ```
   If macOS offers to install the **Command Line Developer Tools**, click **Install** and wait for it to finish.
4. Go to the project folder and install its tools:
   ```sh
   cd ~/source/repos/cyber-swiss-blade
   npm ci
   ```
   The install ends with a line like `added 128 packages`.

> **Tip:** Every command block below assumes Terminal is in the project folder. If you open a new Terminal window, run the `cd` line above again.

---

## Part 1: MongoDB Atlas (the database)

### 1.1 Sign in and create a project

1. Go to https://cloud.mongodb.com and sign in.
2. In the top navigation bar, open the **Projects** menu and select **New Project**.
3. Name it `cyber-swiss-blade`, select **Next**, then select **Create Project**.

### 1.2 Create a free cluster

1. In the left sidebar, select **Project Overview**.
2. Select **Create**.
3. Choose the **Free** option (marked **M0** on older screens).
4. **Provider:** keep the default, such as AWS.
5. **Region:** pick the one nearest to you from the list. Atlas lists only regions that offer free clusters.
6. **Name:** type `csb-cluster`. You can't change the name later.
7. Select **Create Deployment** (or **Create**). After a few seconds, the **Security Quickstart** window appears.

### 1.3 Create the database user (values A and B)

In the Security Quickstart window:

1. **Username:** type `csb-api`. This is **value A**.
2. **Password:** select **Autogenerate Secure Password**, then select **Copy**. Paste it into your note as **value B**. Generated passwords use only letters and digits, which is what this project needs.
3. Select **Create Database User**.
4. Under the IP address section, select **Add My Current IP Address**. You will open access fully in the next step.
5. Select **Finish and Close**, then **Go to Overview**.

**Lower the user's permissions.** The quickstart may give the user full admin rights; the app needs less.

1. In the left sidebar, under **Security**, select **Database & Network Access**.
2. Open the **Database Users** tab.
3. On the `csb-api` row, select **Edit**.
4. Under **Built-in Role**, choose **Read and write to any database**.
5. Select **Update User**.

### 1.4 Let Cloudflare reach the database

Cloudflare Workers connect from changing IP addresses, so the database must accept connections from any address. The strong password from 1.3 and encrypted connections protect it.

1. In the left sidebar, under **Security**, select **Database & Network Access**.
2. In the inner left menu, under **Network Access**, select **IP Access List**.
3. Select **Add IP Address**.
4. Select **Allow Access from Anywhere**, or type `0.0.0.0/0` in the address field.
5. **Comment:** type `Cloudflare Worker`.
6. Select **Confirm**.

The status shows **Pending** for about a minute, then **Active**. Atlas emails you a security warning about this entry; that is expected.

### 1.5 Copy the connection string (value C)

1. In the left sidebar, under **Database**, select **Clusters**.
2. On `csb-cluster`, select **Connect**.
3. Select **Drivers**. Ignore the driver and version dropdowns; they don't change the string.
4. Under **Add your connection string into your application code**, select the copy icon. The string looks like this:
   ```
   mongodb+srv://csb-api:<db_password>@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority&appName=csb-cluster
   ```
5. Paste it into your note. Replace `<db_password>`, including the angle brackets, with **value B**.
6. This complete string is **value C**. Select **Close**.

> **If you chose your own password:** encode these characters in the connection string: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `?` → `%3F`, `#` → `%23`, `%` → `%25`. Autogenerated passwords never need this.

---

## Part 2: Cloudflare Worker (the API)

### 2.1 Sign in and choose your workers.dev address

1. Go to https://dash.cloudflare.com and sign in. Verify your email address if Cloudflare asks; deploying requires it.
2. In the left sidebar, select **Workers & Pages**. If Cloudflare offers a "Get started" screen, skip it; you deploy from Terminal.
3. Find **Your subdomain** on the right side of the page. If none is set, select **Change** (or **Set up**), type a name such as your username, and save. Your Worker address will be `https://cyber-swiss-blade-api.<subdomain>.workers.dev`.

### 2.2 Tell the API which website may use it

The API accepts requests only from your own website.

1. Open `worker/wrangler.toml` in any text editor, such as TextEdit.
2. Find the line starting with `ALLOWED_ORIGINS`.
3. Replace `tshego3` with **your GitHub username in lowercase**. Keep the two `localhost` entries:
   ```toml
   ALLOWED_ORIGINS = "https://yourname.github.io,http://localhost:5173,http://localhost:4173"
   ```
   Use only the scheme and host, with no path and no trailing slash.
4. Save the file.

### 2.3 Log Wrangler in to your Cloudflare account

Wrangler is Cloudflare's command-line tool. `npx` downloads it the first time you use it.

```sh
cd worker
npx wrangler@4.151.3 login
```

1. A browser tab opens. Select **Allow**.
2. Back in Terminal, the message `Successfully logged in` appears.

### 2.4 Deploy the Worker (value E)

```sh
npx wrangler@4.151.3 deploy
```

- If Wrangler asks to register a workers.dev subdomain, answer `y` and pick a name.
- The output ends with a URL such as `https://cyber-swiss-blade-api.yourname.workers.dev`. That is **value E**.

The Worker runs but can't reach the database yet, because it has no secrets.

### 2.5 Add the two secrets (value D)

**First, create the API token.** It is the password your app uses to talk to the API.

```sh
openssl rand -hex 32
```

Copy the 64-character output into your note. This is **value D**.

**Then store both secrets in Cloudflare.** Each command asks `Enter a secret value:`. Paste the value and press Return. Nothing appears while you paste; that is normal.

```sh
npx wrangler@4.151.3 secret put MONGODB_URI
npx wrangler@4.151.3 secret put API_TOKEN
```

- For `MONGODB_URI`, paste **value C**.
- For `API_TOKEN`, paste **value D**.
- Each command prints `Success! Uploaded secret ...` and deploys the change automatically.

<details>
<summary>Prefer the dashboard? Add the secrets by clicking instead</summary>

1. Go to **Workers & Pages**, and on the **Overview** tab select **cyber-swiss-blade-api**.
2. Open **Settings**.
3. Under **Variables and Secrets**, select **Add**.
4. **Type:** Secret. **Variable name:** `MONGODB_URI`. **Value:** value C.
5. Select **Add variable**, then add `API_TOKEN` with value D the same way.
6. Select **Deploy**.

</details>

### 2.6 Test the API

Replace the two placeholders, then run:

```sh
curl -H "Authorization: Bearer VALUE_D" https://VALUE_E/status
```

| You see | Meaning |
| --- | --- |
| `{"ok":true,"database":"cyber_swiss_blade",...}` | Everything works. Continue. |
| `{"error":"Unauthorized."}` | The token doesn't match. Run `secret put API_TOKEN` again. |
| `{"error":"The sync server could not complete the request."}` | The Worker can't reach Atlas. Check 1.4 (Active entry) and value C (password filled in). See [Reading the logs](#reading-the-logs). |
| `Could not resolve host` | Check value E for typos. |

Go back to the project folder:

```sh
cd ..
```

---

## Part 3: GitHub Pages (the website)

### 3.1 Create the repository

1. Go to https://github.com and sign in.
2. Select **+** in the top-right corner, then **New repository**.
3. **Repository name:** `cyber-swiss-blade`. The site address depends on this exact name.
4. Select **Public**. Free GitHub Pages requires a public repository; your data is never in the repository.
5. Leave **Add a README**, **.gitignore**, and **license** unchecked; the project already has them.
6. Select **Create repository**.

### 3.2 Turn on Pages with GitHub Actions

1. In the new repository, select **Settings**. If you don't see it, open the **⋯** menu.
2. In the left sidebar, under **Code, planning, and automation**, select **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

You don't need to pick a template. The project already contains the workflow.

### 3.3 Create a token for pushing code

GitHub doesn't accept your account password in Terminal. It needs a personal access token.

1. Select your profile picture (top right), then **Settings**.
2. In the left sidebar, at the bottom, select **Developer settings**.
3. Select **Personal access tokens**, then **Tokens (classic)**.
4. Select **Generate new token**, then **Generate new token (classic)**.
5. **Note:** `cyber-swiss-blade push`. **Expiration:** 90 days, or your choice.
6. Tick **repo** and **workflow**. **workflow** is required, because the project includes a deployment workflow file.
7. Select **Generate token** and copy it. GitHub shows it only once.

### 3.4 Push the code (value F)

Commit your work if you haven't yet, then connect and push. Replace `yourname`.

```sh
git remote add origin https://github.com/yourname/cyber-swiss-blade.git
git push -u origin main
```

When Terminal asks:
- **Username:** your GitHub username.
- **Password:** the token from 3.3. Nothing appears while you paste.

Watch the deployment:

1. In the repository, open the **Actions** tab.
2. Select the run named **Deploy to GitHub Pages**. It shows a yellow dot while running.
3. After about two minutes, both jobs, **build** and **deploy**, show green ticks.
4. The **deploy** job shows your site address, `https://yourname.github.io/cyber-swiss-blade/`. That is **value F**.

If the run shows a red cross, select it, open the failed step, and read the last lines. The usual fix is redoing step 3.2.

---

## Part 4: Connect the app

1. Open **value F** in your browser.
2. In the left sidebar, select **Settings**. On a phone, tap **☰** first.
3. Under **Sync**:
   - **API URL:** value E.
   - **API token:** value D.
4. Select **Save and sync**. The message **Connected to cyber_swiss_blade** appears, and the sidebar shows **Synced just now**.

**Install it as an app:**
- **Chrome or Edge on a computer:** select the install icon at the right of the address bar, then **Install**.
- **iPhone (Safari):** tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** tap **⋮**, then **Add to Home screen** (or **Install app**).

**Add another device:** open value F there and repeat steps 2 to 4. Both devices then sync through the same database.

### Check your data in Atlas (optional)

1. In Atlas, in the left sidebar under **Database**, select **Clusters**.
2. On `csb-cluster`, select **Browse Collections**. Newer screens may call it **Data Explorer**.
3. Open the `cyber_swiss_blade` database. Each table in the app, such as `timesheet_projects`, appears after its first sync.

---

## Updating later

| You want to | Do this | Then |
| --- | --- | --- |
| Ship app changes | `git push` | The Actions run redeploys. Open apps show **A new version is ready**; select **Reload**. |
| Ship API changes | `npm run worker:deploy` | Live in seconds. |
| Change the API token | `cd worker`, then `npx wrangler@4.151.3 secret put API_TOKEN` | Enter the new token in **Settings → Sync** on every device. |
| Change the database password | In Atlas, go to **Database & Network Access → Database Users → Edit → Edit Password**, rebuild value C, then `secret put MONGODB_URI`. | No app change is needed. |
| Move to a new database | `secret put MONGODB_URI` with the new string | In the app, select **Disconnect**, then connect again so each device uploads its data. |

## Reading the logs

When sync fails, the Worker log says why.

- **Terminal:** run `cd worker`, then `npx wrangler@4.151.3 tail`. Use the app, then watch the lines appear. Press `Ctrl C` to stop.
- **Dashboard:** go to **Workers & Pages**, select **cyber-swiss-blade-api**, then **Logs**, then **Live**.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Settings shows "The API token was rejected." | The token in the app must equal `API_TOKEN` exactly. Paste it again, with no spaces. |
| Settings shows "Network error." | Check value E. Also check that `ALLOWED_ORIGINS` (step 2.2) contains `https://yourname.github.io` exactly, then run `npm run worker:deploy` again. |
| "The sync server could not complete the request." | Read the logs. The usual causes are an IP access list entry not yet **Active**, `<db_password>` still in value C, or a password with unencoded symbols. |
| The cluster shows as **Paused** in Atlas | Select **Resume** on the cluster card. |
| The website shows a blank page or 404 | The repository name must be exactly `cyber-swiss-blade`. Otherwise, update `BASE` in `vite.config.ts` and the paths in `public/manifest.webmanifest`. |
| `git push` is rejected for workflow files | The token is missing the **workflow** scope. Create a new token (step 3.3). |
| The app still shows an old version | Select **Reload** on the update banner, or close every tab of the app and open it again. |
| No install option in the browser | Open the site over `https://` (value F), not a local file. |
