# Deployment Guide

This guide puts Cyber Swiss Blade on the internet. It also connects the app to a database, so your data syncs between your devices.

You do not need cloud experience. Do the steps in order. Do one step at a time.

You can do Parts 2 and 4 on the websites or in Terminal. The main steps use the websites. [Part 8](#part-8-terminal-method-optional) shows the Terminal method.

| | |
| --- | --- |
| **Time** | Approximately 45 minutes |
| **Cost** | Free. All three services have a free plan. |
| **You need** | A computer with Windows, macOS, or Linux. A MongoDB account, a Cloudflare account, and a GitHub account. |

> **NOTE:** Websites change their button names sometimes. If a name in this guide is different on your screen, find the nearest match in the same area.

---

## How to read the steps

Each step has one action. Many steps also have a result.

1. Click **Save**.
   **Result:** A green message shows.

If you do not see the result, stop. Go to [Part 7: Fix a problem](#part-7-fix-a-problem).

**Bold text** is a button, a menu, or a field on the screen. `Code text` is text that you type or copy.

### Keys

The keys are different on each system. This guide uses the Windows names. Use this table to find your key.

| This guide says | Windows | macOS | Linux |
| --- | --- | --- | --- |
| **Enter** | Enter | Return | Enter |
| **Ctrl + S** (save a file) | Ctrl + S | Command + S | Ctrl + S |
| **Ctrl + C** (stop a command in Terminal) | Ctrl + C | Ctrl + C | Ctrl + C |
| **Paste in Terminal** | Ctrl + V, or right-click | Command + V | Ctrl + Shift + V |

---

## Words in this guide

| Word | Meaning |
| --- | --- |
| Terminal | The window where you type commands. On Windows, this guide uses Command Prompt. Step 1.1 shows how to open it. |
| Command | A line of text that you type in Terminal. Press **Enter** to run it. |
| Repository (repo) | The project folder on GitHub. |
| Push | Send your code from your computer to GitHub. |
| Cluster | Your database server on MongoDB Atlas. One cluster can hold many databases. |
| Database | A named group of data in a cluster. This app uses the database `cyber_swiss_blade`. |
| Connection string | The address and password of the database, in one line of text. |
| Worker | A small program on Cloudflare. It connects the app to the database. |
| Secret | A private value that only the Worker can read. |
| Setup key | A long random value. It lets you make the first administrator account one time. Cloudflare keeps it as the `API_TOKEN` secret. |
| Administrator | A person who manages users, roles, and permissions in the app. |
| Role | A group of users, for example "Quotation editors". Permissions are given to roles. |

---

## Values that you will collect

You save eight values during this guide. Save each value in a password manager. Use the name in the first column. The steps use the same names.

> **WARNING:** These values give access to your data. Do not put them in the code. Do not send them in chat or email.

The examples in this guide use the GitHub username `jsmith`. Use your own values. Do not use the example values.

| Name | Example | Step |
| --- | --- | --- |
| **Database username** | `csb-api` | 2.3 |
| **Database password** | `Xk82mQ4pLr7TnB2v` | 2.3 |
| **Connection string** | `mongodb+srv://csb-api:Xk82mQ4pLr7TnB2v@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority` | 2.6 |
| **Setup key** | `4b1e8f2a6c3d9e0f7a5b2c8d1e4f6a9b3c7d0e2f5a8b1c4d7e0f3a6b9c2d5e8f` | 3.6 |
| **Worker URL** | `https://cyber-swiss-blade-api.jsmith.workers.dev` | 3.5 |
| **Website URL** | `https://jsmith.github.io/cyber-swiss-blade/` | 4.6 |
| **Admin username** | `admin` | 5.1 |
| **Admin password** | At least 10 characters | 5.1 |

---

## Part 1: Prepare your computer

### 1.1 Open Terminal

Do the steps for your system:

| System | Steps |
| --- | --- |
| Windows | Press the **Windows** key. Type `cmd`. Press **Enter**. **Command Prompt** opens. |
| macOS | Press **Command + Space**. Type `Terminal`. Press **Return**. |
| Linux | Press **Ctrl + Alt + T**. Or open **Terminal** from the app menu. |

**Result:** A window with a text prompt opens. This guide calls this window "Terminal".

> **NOTE:** On Windows, use Command Prompt. Do not use PowerShell. Some commands in this guide do not work in PowerShell.

### 1.2 Make sure that Node.js is installed

1. In Terminal, type this command and press **Enter**:
   ```sh
   node -v
   ```
2. Look at the result.
   - If you see `v24` or a higher number, go to step 1.3.
   - If you see `not found` or `not recognized`, do the next three steps.
3. Go to https://nodejs.org.
4. Download the **LTS** version for your system. Open the installer and follow the instructions. On Linux, follow the instructions on the download page.
5. Close Terminal. Open it again (step 1.1). Do step 1.2 again.

### 1.3 Make sure that Git is installed

1. Type this command and press **Enter**:
   ```sh
   git --version
   ```
   **Result:** You see a version, for example `git version 2.50.1`.
2. If you do not see a version, install Git for your system:

| System | Steps |
| --- | --- |
| Windows | Go to https://git-scm.com/downloads. Download the installer for Windows. Keep all the default options. |
| macOS | A window asks you to install **Command Line Developer Tools**. Click **Install**. Wait until it finishes. |
| Linux | Type `sudo apt install git` (Ubuntu or Debian) or `sudo dnf install git` (Fedora). Press **Enter**. |

3. Close Terminal. Open it again (step 1.1). Do step 1.3 again.

### 1.4 Go to the project folder

1. Type `cd` and one space. Do not press **Enter** yet.
2. Open your file manager. On Windows, this is **File Explorer**. On macOS, this is **Finder**.
3. Drag the project folder `cyber-swiss-blade` into the Terminal window.
   **Result:** Terminal shows the path of the folder after `cd`. Examples:

   | System | Example |
   | --- | --- |
   | Windows | `cd C:\Users\jsmith\Projects\cyber-swiss-blade` |
   | macOS | `cd /Users/jsmith/Projects/cyber-swiss-blade` |
   | Linux | `cd /home/jsmith/projects/cyber-swiss-blade` |
4. Press **Enter**.
5. Type this command and press **Enter**:
   ```sh
   npm ci
   ```
   **Result:** After some seconds, you see a line like `added 128 packages`.

> **NOTE:** On Windows, the folder can be on a different drive, for example `D:`. Then type `cd /d` in step 1, not `cd`.

> **NOTE:** All the commands in this guide start in this project folder. If you open a new Terminal window, do step 1.4 again.

---

## Part 2: Set up the database (MongoDB Atlas)

In this part, you make a cluster, a database user, and a connection string.

You do not make the database. The Worker makes the database `cyber_swiss_blade` at the first sync. It also makes the collections. To use a different name, do step 2.7.

> **NOTE:** To do this part in Terminal, do step [8.2](#82-set-up-the-database-in-terminal) instead. Then go to Part 3.

> **NOTE:** You can use a cluster that you have already. Then skip steps 2.1 and 2.2. In the other steps, use your project and your cluster name. Do step 2.7 to select the database.

### 2.1 Make a project

1. Go to https://cloud.mongodb.com and sign in.
2. At the top of the page, click the **Projects** menu.
3. Click **New Project**.
4. In the name field, type `cyber-swiss-blade`.
5. Click **Next**.
6. Click **Create Project**.
   **Result:** The page of your new project opens.

### 2.2 Make a free cluster

1. In the left menu, click **Project Overview**.
2. Click **Create**.
3. Select the **Free** option. Some screens show the name **M0**.
4. For **Provider**, keep the default value.
5. For **Region**, select the region that is nearest to you.
6. In the **Name** field, type `csb-cluster`.
7. Click **Create Deployment**. Some screens show **Create**.
   **Result:** The **Security Quickstart** window opens.

### 2.3 Make the database user

Do these steps in the **Security Quickstart** window.

1. In the **Username** field, type `csb-api`.
2. Save `csb-api` in your password manager with the name **Database username**.
3. Click **Autogenerate Secure Password**.
4. Click **Copy**.
5. Save the password in your password manager with the name **Database password**.
6. Click **Create Database User**.
   **Result:** The user shows in a list.
7. Click **Add My Current IP Address**.
8. Click **Finish and Close**.
9. Click **Go to Overview**.

### 2.4 Give the user less access

The new user can change all settings. The app needs less access. Less access is safer.

1. In the left menu, under **Security**, click **Database & Network Access**.
2. Click the **Database Users** tab.
3. On the `csb-api` row, click **Edit**.
4. Find **Built-in Role**. Select **Read and write to any database**.
5. Click **Update User**.
   **Result:** The `csb-api` row shows the new role.

### 2.5 Let Cloudflare connect to the database

Cloudflare uses many different addresses. Thus, the database must accept all addresses. Your strong password keeps the database safe.

1. In the left menu, under **Security**, click **Database & Network Access**.
2. In the second menu, under **Network Access**, click **IP Access List**.
3. Click **Add IP Address**.
4. Click **Allow Access from Anywhere**.
   **Result:** The field shows `0.0.0.0/0`.
5. In the **Comment** field, type `Cloudflare Worker`.
6. Click **Confirm**.
   **Result:** The new row shows **Pending**. After approximately one minute, it shows **Active**.

> **NOTE:** MongoDB sends you an email about this change. This is normal.

### 2.6 Copy the connection string

1. In the left menu, under **Database**, click **Clusters**.
2. On the `csb-cluster` card, click **Connect**.
3. Click **Drivers**.
4. Find the step **Add your connection string into your application code**.
5. Click the copy icon next to the text that starts with `mongodb+srv://`.
6. Save the text in your password manager with the name **Connection string**.
7. Find `<db_password>` in the text. Replace it with your **Database password**. Remove the `<` and `>` signs.
   - Before: `mongodb+srv://csb-api:<db_password>@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority`
   - After: `mongodb+srv://csb-api:Xk82mQ4pLr7TnB2v@csb-cluster.ab12c.mongodb.net/?retryWrites=true&w=majority`
8. Save the changed text.
9. Click **Close**.

> **CAUTION:** If you typed your own password, it can contain special characters. Replace them in the connection string with this table. Generated passwords do not have these characters.
>
> | Character | Replace with |
> | --- | --- |
> | `@` | `%40` |
> | `:` | `%3A` |
> | `/` | `%2F` |
> | `?` | `%3F` |
> | `#` | `%23` |
> | `%` | `%25` |

### 2.7 Select the database name (optional)

The Worker uses the database `cyber_swiss_blade`. It makes this database at the first sync. You do not make it yourself.

To use a different database, change the Worker settings file. Do not change your **Connection string**.

1. In your file manager, open the project folder `cyber-swiss-blade`, then the folder `worker`.
2. Open the file `wrangler.toml` in a text editor.
3. Find the line that starts with `MONGODB_DB`.
4. Change `cyber_swiss_blade` to your database name. Keep the `"` signs.
   - Before: `MONGODB_DB = "cyber_swiss_blade"`
   - After (example for the database `my_tools`): `MONGODB_DB = "my_tools"`
5. Press **Ctrl + S** to save. Close the text editor.
   **Result:** In step 3.8, the Worker shows `"database":"my_tools"`.

**Terminal method:** In the project folder, type this command. Replace `my_tools` with your database name. Press **Enter**.
```sh
node -e "const fs=require('fs');const f='worker/wrangler.toml';fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('cyber_swiss_blade','my_tools'))"
```

> **CAUTION:** Use a database only for this app. The app makes collections with names like `timesheet_projects` and `quotation_quotes`. Another app can use the same names.

> **NOTE:** If you change the name after step 3.5, type `npm run worker:deploy`. The Worker uses the new name after this command.

To give the user access to only this database, change step 2.4:
1. On the `csb-api` row, click **Edit**.
2. Remove the built-in role.
3. Click **Add Specific Privilege**.
4. Select the role `readWrite`. In the **Database** field, type the database name, for example `my_tools`.
5. Click **Update User**.

---

## Part 3: Set up the API (Cloudflare Worker)

### 3.1 Sign in to Cloudflare

1. Go to https://dash.cloudflare.com and sign in.
2. If Cloudflare asks you to verify your email address, do it now. You cannot deploy without it.

### 3.2 Get your workers.dev name

1. In the left menu, click **Workers & Pages**.
2. If you see a **Get started** page, close it. You use Terminal for the next steps.
3. On the right side, find **Your subdomain**.
4. If no name shows, click **Change**. Type a name, for example your username. Click **Save**.
   **Result:** Your Worker address will be `https://cyber-swiss-blade-api.YOUR-SUBDOMAIN.workers.dev`.
   Example: for the name `jsmith`, the address is `https://cyber-swiss-blade-api.jsmith.workers.dev`.

### 3.3 Write your website address in the Worker settings

The Worker accepts requests only from your website. You must tell it your website address.

> **NOTE:** To do this step in Terminal, do step [8.3](#83-write-your-website-address-in-terminal) instead.

1. In your file manager, open the project folder `cyber-swiss-blade`.
2. Open the folder `worker`.
3. Right-click the file `wrangler.toml`. Open it with a text editor, for example VS Code, Notepad, or TextEdit.
4. Find the line that starts with `ALLOWED_ORIGINS`.
5. Change `tshego3` to your GitHub username. Use lowercase letters. Do not change other text.
   - Before:
     ```toml
     ALLOWED_ORIGINS = "https://tshego3.github.io,http://localhost:5173,http://localhost:4173"
     ```
   - After (example for `jsmith`):
     ```toml
     ALLOWED_ORIGINS = "https://jsmith.github.io,http://localhost:5173,http://localhost:4173"
     ```
6. Press **Ctrl + S** to save.
7. Close the text editor.

> **NOTE:** If your GitHub username is `tshego3`, do not change this line.

### 3.4 Connect Terminal to your Cloudflare account

1. In Terminal, type these commands. Press **Enter** after each line.
   ```sh
   cd worker
   npx wrangler@4.151.3 login
   ```
2. If Terminal asks `Ok to proceed? (y)`, type `y` and press **Enter**.
   **Result:** Your browser opens a Cloudflare page.
3. In the browser, click **Allow**.
   **Result:** Terminal shows `Successfully logged in`.

### 3.5 Deploy the Worker

1. Type this command and press **Enter**:
   ```sh
   npx wrangler@4.151.3 deploy
   ```
2. If Terminal asks to register a workers.dev subdomain, type `y`. Then type a name and press **Enter**.
   **Result:** The last lines show an address that starts with `https://cyber-swiss-blade-api`.
   Example: `https://cyber-swiss-blade-api.jsmith.workers.dev`
3. Save this address in your password manager with the name **Worker URL**.

> **NOTE:** The Worker is online now. It cannot use the database yet. The next steps add the secrets.

### 3.6 Make the setup key

1. Type this command and press **Enter**:
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   **Result:** Terminal shows a line of 64 letters and digits.
   Example: `4b1e8f2a6c3d9e0f7a5b2c8d1e4f6a9b3c7d0e2f5a8b1c4d7e0f3a6b9c2d5e8f`
2. Save this line in your password manager with the name **Setup key**.

> **NOTE:** You use the setup key one time, in step 5.1. It also signs the sign-in sessions. If you change it later, all users must sign in again.

### 3.7 Add the two secrets to the Worker

1. Type this command and press **Enter**:
   ```sh
   npx wrangler@4.151.3 secret put MONGODB_URI
   ```
   **Result:** Terminal shows `Enter a secret value:`.
2. Paste your **Connection string**. Press **Enter**.
   **Result:** Terminal shows `Success! Uploaded secret MONGODB_URI`.
3. Type this command and press **Enter**:
   ```sh
   npx wrangler@4.151.3 secret put API_TOKEN
   ```
4. Paste your **Setup key**. Press **Enter**.
   **Result:** Terminal shows `Success! Uploaded secret API_TOKEN`.

> **NOTE:** When you paste a secret, Terminal does not show it. This is normal.

**Other method:** You can also add the secrets in the Cloudflare dashboard:
1. Click **Workers & Pages**. On the **Overview** tab, click **cyber-swiss-blade-api**.
2. Click **Settings**.
3. Find **Variables and Secrets**. Click **Add**.
4. For **Type**, select **Secret**. For **Variable name**, type `MONGODB_URI`. For **Value**, paste your **Connection string**.
5. Click **Add variable**. Add `API_TOKEN` with your **Setup key** in the same way.
6. Click **Deploy**.

### 3.8 Test the Worker

1. Type this command, but do not press **Enter** yet:
   ```sh
   curl YOUR_WORKER_URL/status
   ```
2. Replace `YOUR_WORKER_URL` with your **Worker URL**.
   Example:
   ```sh
   curl https://cyber-swiss-blade-api.jsmith.workers.dev/status
   ```
3. Press **Enter**.
4. Compare the result with this table.

| You see | What it means | What to do |
| --- | --- | --- |
| `{"ok":true,"database":"cyber_swiss_blade",...,"setupRequired":true}` | The Worker and the database work. The name is your database name (step 2.7). `setupRequired` is `true` until you do step 5.1. | Go to step 3.9. |
| `{"error":"The server is not configured."}` | The `API_TOKEN` secret is missing or too short. | Do step 3.7 again for `API_TOKEN`. |
| `{"error":"The sync server could not complete the request."}` | The Worker cannot connect to the database. | Make sure that step 2.5 shows **Active**. Make sure that your **Connection string** has no `<db_password>` text. Then do step 3.7 again for `MONGODB_URI`. |
| `Could not resolve host` | The address is wrong. | Look for a typing error in your **Worker URL**. |

### 3.9 Go back to the project folder

1. Type this command and press **Enter**:
   ```sh
   cd ..
   ```

---

## Part 4: Put the website online (GitHub Pages)

> **NOTE:** To do this part in Terminal, do step [8.4](#84-put-the-website-online-in-terminal) instead. Then go to Part 5.

### 4.1 Make the repository

1. Go to https://github.com and sign in.
2. In the top-right corner, click **+**.
3. Click **New repository**.
4. In **Repository name**, type `cyber-swiss-blade`. Use this exact name.
5. Select **Public**.
6. Do not select **Add a README**, **.gitignore**, or **license**. The project has them already.
7. Click **Create repository**.
   **Result:** An empty repository page opens.

> **NOTE:** Free GitHub Pages needs a public repository. Your app data does not go into the repository. Only the code goes there.

### 4.2 Set the website source

1. On the repository page, click **Settings**. If you cannot see it, click **⋯** first.
2. In the left menu, under **Code, planning, and automation**, click **Pages**.
3. Find **Build and deployment**.
4. In the **Source** list, select **GitHub Actions**.

> **CAUTION:** Do not select **Deploy from a branch**. Do not use the `npx gh-pages` command. These two methods show a blank page for this project.

### 4.3 Let GitHub Actions run

1. On the repository page, click **Settings**.
2. In the left menu, click **Actions**, then **General**.
3. Under **Actions permissions**, select **Allow all actions and reusable workflows**.
4. Click **Save**.

### 4.4 Make a token to push code

GitHub does not accept your account password in Terminal. You must make a token.

1. In the top-right corner, click your profile picture.
2. Click **Settings**.
3. In the left menu, at the bottom, click **Developer settings**.
4. Click **Personal access tokens**, then **Tokens (classic)**.
5. Click **Generate new token**, then **Generate new token (classic)**.
6. In **Note**, type `cyber-swiss-blade push`.
7. In **Expiration**, select **90 days**.
8. Select the **repo** box.
9. Select the **workflow** box.
10. Click **Generate token**.
11. Copy the token to your password manager. GitHub shows it only one time.

> **NOTE:** The **workflow** box is necessary. Without it, GitHub rejects the push.

### 4.5 Push the code

1. Type these commands. Press **Enter** after each line. Replace `yourname` with your GitHub username.
   ```sh
   git add -A
   git commit -m "Set up deployment"
   git remote add origin https://github.com/yourname/cyber-swiss-blade.git
   git push -u origin main
   ```
   Example of the third line: `git remote add origin https://github.com/jsmith/cyber-swiss-blade.git`
2. If a GitHub sign-in window opens, click **Sign in with your browser**. Follow the steps in the browser.
3. If Terminal asks for **Username**, type your GitHub username. Press **Enter**.
4. If Terminal asks for **Password**, paste the token from step 4.4. Press **Enter**.
   **Result:** Terminal shows `main -> main`.

> **NOTE:** If Terminal shows `nothing to commit`, that is correct. Continue.
> If Terminal shows `remote origin already exists`, that is also correct. Continue.

### 4.6 Wait for the deployment

1. On the repository page, click the **Actions** tab.
2. Click the newest run with the name **Deploy to GitHub Pages**.
   **Result:** You see two jobs: **build** and **deploy**. A yellow dot shows that a job runs.
3. Wait approximately two minutes.
   **Result:** Both jobs show a green tick.
4. Click the **deploy** job. Find the website address.
   Example: `https://jsmith.github.io/cyber-swiss-blade/`
5. Save the address in your password manager with the name **Website URL**.
6. Open your **Website URL** in your browser.
   **Result:** The app opens.

If you do not see a run, do these steps:
1. Click **Deploy to GitHub Pages** in the left list.
2. Click **Run workflow**.
3. Select the branch `main`.
4. Click the green **Run workflow** button.

---

## Part 5: Connect the app and add your team

Timesheet and Quotations need an account. AES Encryption and Base64 work without an account.

### 5.1 Create the administrator

You do this step one time only.

1. Open your **Website URL** in your browser.
2. In the left menu of the app, click **Sign in**. On a phone, tap **☰** first.
3. In **Server URL**, paste your **Worker URL**. Example: `https://cyber-swiss-blade-api.jsmith.workers.dev`
4. Type any username and password. Click **Sign in**.
   **Result:** The page shows **Create the administrator**, because the server has no users yet.
5. In **Setup key**, paste your **Setup key**.
6. In **Username**, keep `admin`, or type a different name. Save it with the name **Admin username**.
7. In **Display name**, type your name. Example: `Jo Smith`.
8. In **Password** and **Confirm password**, type a new password with at least 10 characters. Save it with the name **Admin password**.
9. Click **Create administrator**.
   **Result:** The menu shows your name and **Administration**. The sync status shows **Synced just now**.

> **NOTE:** After step 5.1, the setup key cannot make another administrator. Only an administrator can add users.

### 5.2 Add your team members

1. In the left menu, click **Administration**.
2. On the **Users** tab, click **Add user**.
3. Type the **Username**, **Display name**, and **Email** of the person. Example: `thabo`, `Thabo M`, `thabo@example.com`.
4. Select the roles of the person. Every user has the role **Registered users**.
5. Type a first password for the person. Type it again in **Confirm password**.
6. Click **Add user**.
   **Result:** The person shows in the list with the status **Active**.
7. Give the username and the first password to the person in a safe way. Tell the person to change the password in **Settings**, then **Change password**.

### 5.3 Give access with roles and permissions

The default access is:

| Tool | Who can view | Who can edit |
| --- | --- | --- |
| Timesheet | Every user. Each person sees only their own timesheet. Administrators see the timesheets of all users. | Every user |
| Quotations | Administrators only | Administrators only |

To give other people access to Quotations:

1. In **Administration**, click the **Roles** tab.
2. Click **Add role**.
3. In **Role ID**, type `quotation-editors`. In **Name**, type `Quotation editors`. Click **Add role**.
4. Click the **Users** tab. Click the edit icon next to a person. Select **Quotation editors**. Click **Save user**.
5. Click the **Permissions** tab.
6. In the **Quotations** table, on the **Quotation editors** row, select **Edit**.
   **Result:** A message shows **Quotations permissions saved**. The person sees Quotations after the next sync, or after they sign in again.

> **NOTE:** Select only **View** to let a role read quotes and invoices but not change them.

### 5.4 Install the app (optional)

| Device | Steps |
| --- | --- |
| Computer (Chrome or Edge) | Click the install icon at the right side of the address bar. Click **Install**. |
| iPhone or iPad (Safari) | Tap **Share**. Tap **Add to Home Screen**. Tap **Add**. |
| Android (Chrome) | Tap **⋮**. Tap **Install app** or **Add to Home screen**. |

### 5.5 Use another device

1. On the other device, open your **Website URL**.
2. Click **Sign in**. Type the **Worker URL**, your username, and your password. Click **Sign in**.
   **Result:** Both devices show the same data.

> **CAUTION:** When you sign out, the device deletes its copy of your Timesheet and Quotations data. Changes that did not sync yet are lost. The app warns you first.

### 5.6 See your data in MongoDB (optional)

1. In MongoDB Atlas, in the left menu, under **Database**, click **Clusters**.
2. On the `csb-cluster` card, click **Browse Collections**. Some screens show **Data Explorer**.
3. Click the database `cyber_swiss_blade`, or your database name from step 2.7.
   **Result:** You see one collection for each type of data, for example `timesheet_logs`. The `auth_` collections hold the users, roles, and permissions. Do not change them in Atlas.

### 5.7 Import your Agile Report (one time, optional)

You can copy an existing Agile Report workbook (`.xlsx`) into your timesheet. The import reads each day like this:

| Part of the comment | Becomes |
| --- | --- |
| Text before ` || ` | A note, with the project from column B |
| Each part that starts with a billing code and ` - `. Billing codes start with `CR-`, `PR-`, `WR-`, or `9001`, or are column B codes such as `Productive`. | One billing code item |
| `For 1.5 hours,` at the start of an item | The hours of that item |
| Text in `[ ]` at the end of an item | The summary of that item |

1. Go to the project folder (step 1.4).
2. Type this command. Replace the file path with the path of your workbook. Press **Enter**.
   ```sh
   node scripts/import-agile-report.mjs "2026 Agile Report.xlsx" --dry-run
   ```
   **Result:** Terminal shows the number of days and billing codes for each month. Nothing is sent.
3. Type the same command again. Replace `--dry-run` with `--api` and your **Worker URL**. Press **Enter**.
   Example:
   ```sh
   node scripts/import-agile-report.mjs "2026 Agile Report.xlsx" --api https://cyber-swiss-blade-api.jsmith.workers.dev
   ```
4. Type your username and password when Terminal asks.
   **Result:** Terminal shows `Import complete`.
5. Open the Timesheet in the app.
   **Result:** After the next sync, the Month tab shows the imported days.

> **NOTE:** If you run the import again, it updates the same entries. It does not make copies.

> **NOTE:** Older versions of the app saved the timesheet in `timesheet_projects` and `timesheet_entries`. The new app does not use them. To delete them, open **Browse Collections** (step 5.6). Point to each collection and click the **trash** icon.

---

## Part 6: Make changes later

| Task | Steps | Result |
| --- | --- | --- |
| Change the app | Do step 4.5 (only `git add`, `git commit`, and `git push`). | GitHub deploys the new version. The app shows **A new version is ready**. Click **Reload**. |
| Change the Worker | In Terminal, type `npm run worker:deploy`. | The new Worker is online after some seconds. |
| Change the setup key | Do steps 3.6 and 3.7 (only `API_TOKEN`). | All users must sign in again, unless you use a separate session key. |
| Use a separate session key (recommended) | Make a new value as in step 3.6. In the `worker` folder, type `npx wrangler@4.151.3 secret put SESSION_SECRET` and paste the value. | Sessions use this key, not the setup key. All users must sign in again one time. |
| Reset the password of a user | In **Administration**, on the **Users** tab, click the edit icon. Type a **New password**. Click **Save user**. | The user signs in with the new password. Other sessions of the user end. |
| Stop a person from signing in | In **Administration**, edit the user. Select **Disable this account**. Click **Save user**. | The person cannot sign in or sync. Their data stays. |
| Change the database password | In Atlas, go to **Database & Network Access**, then **Database Users**. Click **Edit**, then **Edit Password**. Make a new **Connection string** (step 2.6). Do step 3.7 (only `MONGODB_URI`). | The app continues to work. |
| Use a new database | For a different cluster, make a new **Connection string** and do step 3.7 (only `MONGODB_URI`). For a different name, do step 2.7. Type `npm run worker:deploy`. Then do step 5.1 again, because the new database has no users. | The new database starts empty. |

---

## Part 7: Fix a problem

### 7.1 Read the Worker log

The Worker log tells you why sync failed.

**In Terminal:**
1. Type `cd worker` and press **Enter**.
2. Type `npx wrangler@4.151.3 tail` and press **Enter**.
3. Use the app. Look at the new lines in Terminal.
4. Press **Ctrl + C** to stop.

**In the Cloudflare dashboard:**
1. Click **Workers & Pages**.
2. Click **cyber-swiss-blade-api**.
3. Click **Logs**.
4. Click **Live**.

### 7.2 Problems and solutions

| Problem | Solution |
| --- | --- |
| On Windows, `npm` or `curl` shows a red error about scripts or parameters. | You use PowerShell. Open Command Prompt (step 1.1). Do step 1.4 again. |
| `git commit` shows `Please tell me who you are`. | Type `git config --global user.name "Your Name"` and press **Enter**. Type `git config --global user.email "you@example.com"` and press **Enter**. Do step 4.5 again. |
| The website is blank. | Right-click the page. Click **View Page Source**. If you see `/src/main.ts`, the website source is wrong. Do steps 4.2 and 4.3. Then do the "If you do not see a run" steps in 4.6. |
| The **Actions** tab shows no run. | Do step 4.3. Then do the "If you do not see a run" steps in 4.6. |
| The **Actions** run shows a red cross. | Click the run. Click the failed job. Read the last lines. Make sure that step 4.2 shows **GitHub Actions**. |
| `git push` fails with a message about `workflow`. | Your token has no **workflow** access. Do step 4.4 again. Select **workflow**. |
| The app shows "Your session has ended. Sign in again." | Click **Sign in** in the menu and sign in. This happens after a password change, after 30 days, or when the setup key changes. |
| The app shows "The username or password is wrong." | Type the username in lowercase letters. Ask an administrator to reset your password (Part 6). |
| The app shows "Too many failed attempts." | Wait 15 minutes. Then try again. |
| The app shows "The setup key is wrong." | Paste your **Setup key** again. It must be the same value as the `API_TOKEN` secret (step 3.7). |
| The app shows "Setup is already complete." | An administrator exists. Sign in with that account. |
| The app shows "You do not have access to Quotations." | Ask an administrator to give one of your roles **View** permission (step 5.3). |
| The app shows "Network error." | Make sure that your **Worker URL** is correct. Make sure that step 3.3 has your GitHub username. Then type `npm run worker:deploy`. |
| The app shows "The sync server could not complete the request." | Read the Worker log (7.1). Make sure that step 2.5 shows **Active**. Make sure that your **Connection string** has the password and no `<db_password>` text. |
| Atlas shows the cluster as **Paused**. | Click **Resume** on the cluster card. |
| The website shows 404 errors. | The repository name must be `cyber-swiss-blade`. Use this name, or ask a developer to change `BASE` in `vite.config.ts`. |
| The app shows an old version. | Click **Reload** on the update message. Or close all tabs of the app and open it again. |
| The browser does not show an install option. | Open your **Website URL**. The address must start with `https://`. |

---

## Part 8: Terminal method (optional)

This part does the website steps with commands. The result is the same as Parts 2 and 4.

> **NOTE:** Each service still opens your browser one time. You sign in there and approve Terminal.

### 8.1 Install the command tools

You need two more tools. They stay on your computer. They do not go into the app.

| Tool | What it controls | Licence |
| --- | --- | --- |
| Atlas CLI (`atlas`) | MongoDB Atlas | Apache-2.0 |
| GitHub CLI (`gh`) | GitHub | MIT |

1. Do the steps for your system:

| System | Steps |
| --- | --- |
| Windows | Type `winget install MongoDB.MongoDBAtlasCLI` and press **Enter**. Then type `winget install GitHub.cli` and press **Enter**. |
| macOS | Install Homebrew from https://brew.sh. Then type `brew install mongodb-atlas gh` and press **Enter**. |
| Linux | Follow https://www.mongodb.com/docs/atlas/cli/current/install-atlas-cli/. Then follow https://github.com/cli/cli#installation. |

2. Close Terminal. Open it again (step 1.1). Do step 1.4 again.
3. Type `atlas --version` and press **Enter**.
   **Result:** You see a version.
4. Type `gh --version` and press **Enter**.
   **Result:** You see a version.

### 8.2 Set up the database in Terminal

This step replaces steps 2.1 to 2.6.

1. Type this command and press **Enter**:
   ```sh
   atlas auth login
   ```
   **Result:** Your browser opens an Atlas page.
2. Sign in. Follow the steps in the browser.
3. If Terminal asks questions about default values, press **Enter** for each question.
   **Result:** Terminal shows that you are logged in.
4. Type this command and press **Enter**:
   ```sh
   atlas projects create cyber-swiss-blade
   ```
   **Result:** Terminal shows `Project '...' created.` The text between the `'` signs is the project ID.
   Example: `Project '6745f1c2a8b3d40012e5f7a9' created.`
5. Type this command and press **Enter**. Replace `YOUR_PROJECT_ID` with the project ID.
   ```sh
   atlas config set project_id YOUR_PROJECT_ID
   ```
   Example: `atlas config set project_id 6745f1c2a8b3d40012e5f7a9`
6. Type this command and press **Enter**:
   ```sh
   atlas clusters create csb-cluster --provider AWS --region US_EAST_1 --tier M0
   ```
7. Type this command and press **Enter**:
   ```sh
   atlas clusters watch csb-cluster
   ```
   **Result:** After some minutes, Terminal shows `Cluster available.`
8. Type this command and press **Enter**:
   ```sh
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
   **Result:** Terminal shows a line of 48 letters and digits.
   Example: `9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c2b4d6f8e0a1c3e5b`
9. Save this line in your password manager with the name **Database password**.
10. Save `csb-api` in your password manager with the name **Database username**.
11. Type this command. Replace `YOUR_DATABASE_PASSWORD` with your **Database password**. Press **Enter**.
    ```sh
    atlas dbusers create readWriteAnyDatabase --username csb-api --password YOUR_DATABASE_PASSWORD
    ```
    Example: `atlas dbusers create readWriteAnyDatabase --username csb-api --password 9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c2b4d6f8e0a1c3e5b`
12. Type this command and press **Enter**:
    ```sh
    atlas accessLists create 0.0.0.0/0 --type cidrBlock --comment "Cloudflare Worker"
    ```
    **Result:** Terminal shows `Created a new IP access list.`
13. Type this command and press **Enter**:
    ```sh
    atlas clusters connectionStrings describe csb-cluster
    ```
    **Result:** Terminal shows an address that starts with `mongodb+srv://`.
    Example: `mongodb+srv://csb-cluster.ab12c.mongodb.net`
14. Make your connection string from this address. Put `csb-api:`, your **Database password**, and `@` after `mongodb+srv://`. Put `/` at the end.
    - Before: `mongodb+srv://csb-cluster.ab12c.mongodb.net`
    - After: `mongodb+srv://csb-api:9f2c4e6a8b0d1f3e5a7c9b1d3f5e7a9c2b4d6f8e0a1c3e5b@csb-cluster.ab12c.mongodb.net/`
15. Save the result in your password manager with the name **Connection string**.
    To use a database name other than `cyber_swiss_blade`, do step 2.7 now.
16. Go to Part 3.

> **NOTE:** `US_EAST_1` is in the USA. You can use a region nearer to you, for example `EU_WEST_1` (Ireland).

> **CAUTION:** Terminal keeps a history of your commands. Thus, the history contains your database password. On a shared computer, use the website method (Part 2).

### 8.3 Write your website address in Terminal

This step replaces step 3.3.

1. Type this command, but do not press **Enter** yet:
   ```sh
   node -e "const fs=require('fs');const f='worker/wrangler.toml';fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('tshego3','yourname'))"
   ```
2. Replace `yourname` with your GitHub username. Use lowercase letters.
   Example:
   ```sh
   node -e "const fs=require('fs');const f='worker/wrangler.toml';fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('tshego3','jsmith'))"
   ```
3. Press **Enter**.
   **Result:** Terminal shows no message. This is correct.

> **NOTE:** If your GitHub username is `tshego3`, do not do this step.

### 8.4 Put the website online in Terminal

This step replaces steps 4.1 to 4.6. In all the commands, replace `yourname` with your GitHub username. For example, `repos/yourname/cyber-swiss-blade` becomes `repos/jsmith/cyber-swiss-blade`.

1. Type this command and press **Enter**:
   ```sh
   gh auth login --scopes workflow
   ```
2. Terminal asks some questions. Use the arrow keys and **Enter** to select these answers:
   - **GitHub.com**
   - **HTTPS**
   - **Yes** (authenticate Git with your GitHub credentials)
   - **Login with a web browser**
3. Copy the code that Terminal shows. Press **Enter**.
   Example: `! First copy your one-time code: A1B2-C3D4`
   **Result:** Your browser opens a GitHub page.
4. Paste the code. Click **Continue**, then **Authorize**.
   **Result:** Terminal shows `Logged in as yourname`. Example: `Logged in as jsmith`.
5. Make the repository. Type this command and press **Enter**:
   ```sh
   gh repo create cyber-swiss-blade --public
   ```
6. Set the website source to GitHub Actions. Type this command and press **Enter**:
   ```sh
   gh api -X POST repos/yourname/cyber-swiss-blade/pages -f build_type=workflow
   ```
   **Result:** Terminal shows text that contains `"build_type": "workflow"`.
   Example command: `gh api -X POST repos/jsmith/cyber-swiss-blade/pages -f build_type=workflow`
7. If Terminal shows `409`, the website exists already. Type the same command with `PUT`, not `POST`.
   Example: `gh api -X PUT repos/jsmith/cyber-swiss-blade/pages -f build_type=workflow`
   **Result:** Terminal shows no message. This is correct.
8. Let GitHub Actions run. Type this command and press **Enter**:
   ```sh
   gh api -X PUT repos/yourname/cyber-swiss-blade/actions/permissions -F enabled=true -f allowed_actions=all
   ```
9. Push the code. Type these commands. Press **Enter** after each line.
   ```sh
   git add -A
   git commit -m "Set up deployment"
   git remote add origin https://github.com/yourname/cyber-swiss-blade.git
   git push -u origin main
   ```
   **Result:** Terminal shows `main -> main`. You do not need a token. The GitHub CLI signs in for Git.
10. Type this command and press **Enter**:
    ```sh
    gh run watch
    ```
11. Select the run **Deploy to GitHub Pages**. Press **Enter**.
    **Result:** After approximately two minutes, both jobs show a tick.
12. Type this command and press **Enter**:
    ```sh
    gh api repos/yourname/cyber-swiss-blade/pages --jq .html_url
    ```
    **Result:** Terminal shows the address of your website.
    Example: `https://jsmith.github.io/cyber-swiss-blade/`
13. Save this address in your password manager with the name **Website URL**.
14. Go to Part 5.

If `gh run watch` shows no run, do these steps:
1. Type `gh workflow run deploy.yml --ref main` and press **Enter**.
2. Wait 10 seconds.
3. Do step 10 again.

### 8.5 Other tasks in Terminal

| Task | Steps |
| --- | --- |
| Change the database password | Make a new password (step 8.2, step 8). Type `atlas dbusers update csb-api --password YOUR_NEW_PASSWORD`. Replace `YOUR_NEW_PASSWORD` with the new password. Make a new **Connection string** (step 8.2, step 14). Do step 3.7 (only `MONGODB_URI`). |
| Look at the deployments | Type `gh run list --workflow deploy.yml`. |
| Start a deployment again | Type `gh workflow run deploy.yml --ref main`. |
| Read the Worker log | Do step 7.1 (**In Terminal**). |
