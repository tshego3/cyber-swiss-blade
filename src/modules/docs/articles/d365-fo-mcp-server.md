---
title: Set up the D365 F&O MCP server
summary: Host the d365fo-mcp-server on Azure App Service, offline on a local machine, or on a LAN server, and keep its metadata and code up to date.
category: Dynamics 365
order: 170
---

# Set up the D365 F&O MCP server

This guide installs the [D365 F&O MCP Server](https://github.com/dynamics365ninja/d365fo-mcp-server) for a **development environment**. The main setup uses low-cost Azure services and an Azure DevOps Git repository for your custom models. The guide also shows an [offline setup on your local machine](#offline-setup-on-your-local-machine) and a [LAN web server setup](#lan-web-server-setup-through-a-vpn). The source is `docs/SETUP_AZURE.md` in the repository.

## What the system does

- The server gives AI tools (GitHub Copilot, Claude Code) access to your D365FO metadata.
- The AI checks class names, table fields, labels, and form patterns against your real codebase.
- Thus, the AI does not write X++ code that does not compile.

System parts:

| Part | Function |
| --- | --- |
| Azure Blob Storage | Stores two database files. `xpp-metadata.db` is approximately 2 GB to 3 GB. The labels database is approximately 500 MB. Each extra language in `LABEL_LANGUAGES` adds approximately 125 MB. |
| Azure App Service | Runs the read-only MCP server on Linux. At each start, the server downloads the database files from Blob Storage. |
| Local companion on your dev VM | Writes files. You install it separately. Refer to the Quick Start guide in the repository. |
| Azure DevOps Git repository | Holds your custom model packages. The build pipelines clone this repository directly. |

Nothing updates fully automatically by default:

| What changes | Default result | What you must do |
| --- | --- | --- |
| New commits in your model Git branch | Nothing. The database stays old. | Run the custom build pipeline, or set up a CI trigger. |
| New releases of the server code on GitHub | Nothing. Your deployed copy stays old. | Sync the upstream repository into your DevOps clone. |

## Before you start

- An Azure subscription. Your account must have permission to create resource groups, storage accounts, app service plans, and web apps.
- An Azure DevOps organization and project. Your custom model packages must be in a Git repository in that project.
- A Windows machine or D365FO dev VM with Node.js 24.x LTS, Python 3.x, Git, and PowerShell 5.1 or later.
  - Node.js: [nodejs.org](https://nodejs.org) (select version 24.x LTS)
  - Python: [python.org/downloads](https://www.python.org/downloads/)
- Access to a D365FO environment for the standard packages: `K:\AosService\PackagesLocalDirectory`.

To check your installations, run these commands in PowerShell:

```powershell
node --version    # must show v24.x
python --version  # must show 3.x
git --version     # must show a version number
```

## Create the Azure resources

In this task, you create a resource group, a storage account, an app service plan, and a web app in the Azure portal.

### Create a resource group

A resource group holds all your resources. Later, you can delete all of them in one step.

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with your Azure account.
2. In the search bar, type `resource groups` and select **Resource groups**.
3. Select **+ Create**.
4. Select your subscription.
5. Type a name, for example `rg-d365fo-mcp-dev`.
6. Select a region near you, for example `West Europe`.
7. Select **Review + create**, then select **Create**.
8. Wait until the deployment completes. This usually takes less than 1 minute.

### Create a storage account

The storage account holds the metadata database files.

1. In the search bar, type `storage accounts` and select **Storage accounts**.
2. Select **+ Create**.
3. Select your subscription and the resource group.
4. Type a name, for example `std365fomcpdev`. Use only lowercase letters and numbers. The name must be globally unique.
5. Select a region near you.
6. Select **Standard** performance and **StorageV2 (general purpose v2)**.
7. Keep the default values on the other tabs.
8. Select **Review + create**, then select **Create**.
9. Wait until the deployment completes. This usually takes 1 to 2 minutes.

### Create the two blob containers

1. Open the new storage account.
2. In the left menu, select **Data storage > Containers**.
3. Select **+ Container**.
4. Type the name `xpp-metadata`.
5. Set the public access level to **Private**.
6. Select **Create**.
7. Do steps 3 to 6 again for a second container with the name `packages`.

### Copy the connection string

You need the connection string several times later.

1. In the left menu of the storage account, select **Security + networking > Access keys**.
2. Under **key1**, select **Show**.
3. Copy the **Connection string** value.
4. Paste it into a safe local note.

> **WARNING:** Do not share the connection string. Treat it like a password.

### Create an app service plan

The plan sets the size and the cost of the server. For development, use the small **B3** size.

1. In the search bar, type `app service plans` and select **App Service plans**.
2. Select **+ Create**.
3. Select your subscription and resource group.
4. Type a name, for example `asp-d365fo-mcp-dev`.
5. Select **Linux** as the operating system.
6. Select the same region as before.
7. Select the **Basic** pricing plan and the **B3** size. If B3 is not available, select **B2**. The database download needs at least 3.5 GB of memory.
8. Select **Review + create**, then select **Create**.

### Create the web app

The web app runs the MCP server code.

1. In the search bar, type `app services` and select **App Services**.
2. Select **+ Create > Web App**.
3. Select your subscription and resource group.
4. Type a name, for example `app-d365fo-mcp-dev`. This name becomes your server URL: `https://app-d365fo-mcp-dev.azurewebsites.net`.
5. Select **Publish: Code** and **Runtime stack: Node 24 LTS**.
6. Select **Operating System: Linux**.
7. Select the app service plan.
8. If the Basics tab shows the option, select **HTTPS only: Yes**.
9. Select **Review + create**, then select **Create**.
10. Wait until the deployment completes. This takes 2 to 5 minutes.
11. Select **Go to resource**.

### Turn on the managed identity

1. In your web app, in the left menu, select **Settings > Identity**.
2. On the **System assigned** tab, set **Status** to **On**.
3. Select **Save**, then select **Yes** to confirm.

## Configure the web app settings

1. Make a strong API key. Run one of these commands in PowerShell:

   ```powershell
   # If you have openssl, run:
   openssl rand -hex 32
   # If not, run this instead:
   $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
   ```

2. Save the key in your local note.
3. In your web app, go to **Settings > Environment variables**.
4. Select **+ Add** for each row in this table. Enter the name and the value exactly.

   | Name | Value | Notes |
   | --- | --- | --- |
   | `AZURE_STORAGE_CONNECTION_STRING` | (your connection string) | Lets the server download the databases. |
   | `BLOB_CONTAINER_NAME` | `xpp-metadata` | Container with the database files. |
   | `BLOB_DATABASE_NAME` | `databases/xpp-metadata-latest.db` | Blob path in the container. |
   | `DB_PATH` | `/tmp/xpp-metadata.db` | Local path for the main database. |
   | `LABELS_DB_PATH` | `/tmp/xpp-metadata-labels.db` | Local path for the labels database. |
   | `LABEL_LANGUAGES` | `en-US` | Add more languages, separated by commas. Each language adds approximately 125 MB. |
   | `MCP_SERVER_MODE` | `read-only` | Hides the file write tools. Use the local companion for writes. |
   | `NODE_ENV` | `production` | The server framework needs it. It does not control your license or data. |
   | `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` | Stops Azure from running npm install. The deploy package has all the files. |
   | `WEBSITE_NODE_DEFAULT_VERSION` | `~24` | Pins the Node.js version. |
   | `API_KEY` | (your generated key) | Protects the server. Clients send this key with each request. |

5. After you add all rows, select **Apply**.
6. Go to **Settings > Configuration**. On the **General settings** tab, find **Startup Command** and enter:

   ```bash
   bash startup.sh
   ```

7. Select **Save**, then select **Continue** to restart the app.

**Result:** The app shows errors when it starts. This is correct, because the database files do not exist yet.

> **WARNING:** Without `API_KEY`, all persons who know your URL can read your indexed code. The server does not start without a key unless you set `ALLOW_UNAUTHENTICATED=true`. Set `ALLOW_UNAUTHENTICATED=true` only if another service (Easy Auth, Entra ID, or a private endpoint) protects the app.

## Deploy the application code

There are two options. Option A uses a pipeline. Option B is manual. If you have permission to create pipelines in Azure DevOps, use Option A.

### Option A: Deploy with the Azure DevOps pipeline (recommended)

1. Clone the server repository to your machine:

   ```powershell
   git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git
   cd d365fo-mcp-server
   ```

2. Push this repository to a Git repository in your Azure DevOps project. If you do not know how, ask your DevOps admin.
3. In Azure DevOps, open your project.
4. Select **Pipelines > New pipeline**.
5. Select **Azure Repos Git**, then select the cloned repository.
6. Select **Existing Azure Pipelines YAML file**.
7. Select `/.azure-pipelines/d365fo-mcp-app-deploy.yml` from the repository.
8. Select **Save** (not Run). The pipeline needs the variable group first.
9. Do the [variable group steps](#create-the-variable-group). Then come back and run the pipeline.

### Option B: Deploy manually

Do these steps on your Windows machine.

1. Open PowerShell.
2. Clone and build the code:

   ```powershell
   git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git
   cd d365fo-mcp-server
   npm install
   npm run build
   ```

3. Create the deploy package:

   ```powershell
   Compress-Archive -Path dist, node_modules, package.json, package-lock.json, startup.sh `
     -DestinationPath deploy.zip -Force
   ```

   The code has no native add-ons. A package that you build on Windows runs correctly on Linux.

4. In the Azure portal, open your web app.
5. In the left menu, select **Deployment > Deployment Center**.
6. Upload `deploy.zip`. Follow the instructions on the screen.
7. Wait for the deployment to complete. **Deployment Center** shows the status.

## Build and upload the metadata database

The server needs a database that you build from your D365FO source code. This task has two parts: build the standard platform metadata, and build your custom model metadata from Git.

### Create the variable group

Option A needs this variable group.

1. In Azure DevOps, open your project.
2. Select **Pipelines > Library > + Variable group**.
3. Type the group name `xpp-mcp-server-config`. Use this exact name.
4. Add these variables:

   | Name | Value | Secret |
   | --- | --- | --- |
   | `AZURE_STORAGE_CONNECTION_STRING` | (your connection string) | Yes. Select the lock icon. |
   | `BLOB_CONTAINER_NAME` | `xpp-metadata` | No |
   | `CUSTOM_MODELS` | Your package names, separated by commas, for example `MyPackage` | No |
   | `AZURE_SUBSCRIPTION` | The name of your Azure DevOps service connection to Azure | No |
   | `AZURE_APP_SERVICE_NAME` | Your web app name, for example `app-d365fo-mcp-dev` | No |

5. Select **Save**.

If no service connection exists, go to **Project settings > Service connections > New service connection > Azure Resource Manager**. Create a connection with your Azure subscription and give it a simple name.

### Upload the standard packages (one time)

The standard D365FO code comes from your dev VM. Your custom code comes from Git.

1. On your D365FO VM, open File Explorer and go to `K:\AosService\`.
2. Right-click the folder `PackagesLocalDirectory` and select **Compress to ZIP file**. This makes a large zip file and can take a long time.
3. If you do not have it, install **Azure Storage Explorer** from [azure.microsoft.com/products/storage/storage-explorer](https://azure.microsoft.com/products/storage/storage-explorer).
4. Open Storage Explorer. Connect to your storage account with the connection string.
5. Go to the container `packages`.
6. Select **Upload > Upload Files** and upload the zip file.
7. If the name is different, rename the uploaded blob to `PackagesLocalDirectory.zip`.

Upload this file again only after Microsoft releases a version upgrade or a hotfix rollup.

### Prepare the custom pipeline for your Git repository

The pipelines are in the `.azure-pipelines/` folder of the server repository. They expect the custom packages from version control. Your models are in a Git repository, so use a Git checkout step.

1. Open `.azure-pipelines/d365fo-mcp-data-extract-and-build-custom.yml` in the cloned repository.
2. Find the checkout section near the top.
3. Make sure that the pipeline checks out your model repository with Git.
   - If the pipeline YAML is in the same repository as your custom packages, use:

     ```yaml
     steps:
       - checkout: self        # this repo contains your custom package folders
         clean: true
     ```

   - If the pipeline is in a different repository, add your model repository as a resource:

     ```yaml
     resources:
       repositories:
         - repository: customModels
           type: git                       # Azure Repos Git
           name: YourProject/YourModelRepo # project name / repo name

     steps:
       - checkout: customModels
         clean: true
     ```

4. Set the extraction input (`PACKAGES_PATH`) to the checked-out package folders, for example `$(Build.SourcesDirectory)/MyPackage`. The path must agree with the location of the package folder after checkout.
5. Commit and push the changes to the pipeline file.

### Build and publish the custom metadata

1. In Azure DevOps, go to **Pipelines**.
2. Select the pipeline `d365fo-mcp-data-extract-and-build-custom`.
3. Select **Run pipeline**.
4. Optional: enter the parameter `customModels` with your package name. This does an incremental update in approximately 5 to 10 minutes. Without the parameter, the full run takes approximately 15 to 30 minutes.
5. Select **Run**.
6. Wait for the pipeline to complete. Select the job to see the progress.

**Result:** The pipeline uploads the new databases to Blob Storage and restarts the web app.

### Build manually on your dev VM

Use this option if you cannot use pipelines.

1. Clone your custom model repository on the D365FO VM:

   ```bash
   git clone https://dev.azure.com/<org>/<project>/_git/<model-repo>
   ```

2. Clone the server repository and install its tools:

   ```powershell
   git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git
   cd d365fo-mcp-server
   npm install
   ```

3. Create a `.env` file in the root of the server repository with these values:

   ```ini
   PACKAGES_PATH=C:\path\to\<model-repo>\MyPackage
   CUSTOM_MODELS=MyPackage
   AZURE_STORAGE_CONNECTION_STRING=(your connection string)
   BLOB_CONTAINER_NAME=xpp-metadata
   ```

4. Extract the metadata and build the database. This can take 1 hour or more.

   ```powershell
   npm run extract-metadata
   npm run build-database
   ```

5. Open Azure Storage Explorer.
6. Upload `data\xpp-metadata.db` to the container `xpp-metadata`, in the virtual folder `databases`.
7. If necessary, rename the uploaded blob to `xpp-metadata-latest.db`. The full blob name must be `databases/xpp-metadata-latest.db`.
8. Upload `data\xpp-metadata-labels.db` to the root of the same container.
9. In the portal, restart the web app (**Overview > Restart**).

> **IMPORTANT:** Build and upload the database again after each merge into your model branch. Or set up the [CI trigger](#rebuild-the-metadata-on-each-merge) to do this automatically.

### Platform upgrades

When Microsoft releases a new version:

1. On the updated VM, make a zip of `K:\AosService\PackagesLocalDirectory` again.
2. Upload it to the `packages` container as `PackagesLocalDirectory.zip`.
3. Run the pipeline `d365fo-mcp-data-extract-and-build-platform`. It takes 60 to 120 minutes. For a full rebuild, run `d365fo-mcp-data-platform-upgrade` instead. It takes 90 to 120 minutes.

The upgrade pipeline builds in two passes to stay in the agent memory limits. Each data pipeline restarts the web app at the end. The app then downloads the new database.

## Check that the server works

1. After the restart, wait some minutes. The app downloads the database at a cold start. The download is large, so the first start can take several minutes.
2. In the portal, open your web app and select **Monitoring > Log stream**. Look for messages about the database download and the server start.
3. In a browser, open:

   ```text
   https://app-d365fo-mcp-dev.azurewebsites.net/health
   ```

**Result:** You see a response similar to this:

```json
{"status":"ok","mode":"read-only", ...}
```

If you see an error:

1. Read the failure reason in **Log stream**.
2. Make sure that all environment variables from [Configure the web app settings](#configure-the-web-app-settings) exist and have the correct spelling.
3. Make sure that the blob `databases/xpp-metadata-latest.db` exists in the `xpp-metadata` container.
4. After you fix the problem, restart the app again.

## Connect your editor to the server

Each developer connects their own tools to the shared server.

### VS Code and GitHub Copilot

1. Open VS Code.
2. Open the Command Palette (**Ctrl+Shift+P**).
3. Run **MCP: Add Server**.
4. Select **HTTP**.
5. Enter the URL `https://app-d365fo-mcp-dev.azurewebsites.net/mcp`.
6. Enter the header name `X-Api-Key` and your API key as the value.

### Claude Code

1. Run:

   ```powershell
   npx d365fo-mcp connect https://app-d365fo-mcp-dev.azurewebsites.net
   ```

2. Enter your API key when the tool asks for it.

### Test the connection

1. Ask the AI: "search for table CustTable".
2. If the tool returns real results from your metadata, the connection works.

To write files (create objects), install the local companion on your dev VM. Refer to the Quick Start guide in the repository.

## Set up automatic updates

There are two types of updates:

| Type | Trigger | Pipeline | Usual duration |
| --- | --- | --- | --- |
| Metadata update (your model code changed) | Merge into your model Git branch | `d365fo-mcp-data-extract-and-build-custom` | 5 to 30 min |
| Server code update (new release on GitHub) | New commit in your server repository in DevOps | `d365fo-mcp-app-deploy` | 5 to 10 min |

### Rebuild the metadata on each merge

This setup builds the database again each time someone merges into the model branch. It works because your model packages are in an Azure Repos Git repository.

1. In Azure DevOps, go to **Pipelines**.
2. Select the pipeline `d365fo-mcp-data-extract-and-build-custom`.
3. Select **Edit** (top right).
4. Select **Triggers**.
5. On the **YAML** tab, select **Get sources** if the page asks for it, or edit the YAML directly.
6. Enable continuous integration. Add this block to the YAML file:

   ```yaml
   trigger:
     branches:
       include:
         - main        # your model branch
     paths:
       exclude:
         - docs/*      # optional: ignore non-code changes
   ```

7. If your model repository is not the repository of the pipeline YAML, put the trigger block in the pipeline file. Make sure that the checkout step points to the model repository.
8. Select **Save and queue**, then select **Save** (do not run now).
9. To test, merge a small change into the model branch.

**Result:** The pipeline starts in a few seconds.

Each triggered run uses pipeline agent time. Incremental runs with the `customModels` parameter take approximately 5 to 10 minutes. Full runs take longer. If there are many merges each day, use a scheduled batch instead. Replace the trigger with:

```yaml
schedules:
  - cron: "0 2 * * *"      # daily at 02:00 UTC
    displayName: Nightly metadata rebuild
    branches:
      include:
        - main
    always: false          # skips the run when no new commits exist
```

The same pattern works on GitHub Actions. Use an `on: push: branches: [main]` trigger, then call `az webapp` or the build scripts from the workflow. This guide uses Azure DevOps because your models are there.

### Update the server code from GitHub

Your deployed copy of the server is in your own Git repository in Azure DevOps. New releases come first on GitHub. Use one of these methods to sync.

#### Method A: scheduled sync pipeline (recommended)

1. In your DevOps project, create a new pipeline file with the name `sync-upstream.yml`.
2. Use content similar to this:

   ```yaml
   schedules:
     - cron: "0 3 * * 1"        # weekly, Mondays at 03:00 UTC
       displayName: Sync upstream d365fo-mcp-server
       branches:
         include:
           - main
       always: true

   pool:
     vmImage: ubuntu-latest

   steps:
     - checkout: self
       persistCredentials: true

     - script: |
         git remote add upstream https://github.com/dynamics365ninja/d365fo-mcp-server.git
         git fetch upstream main
         git merge upstream/main --no-edit || echo "Merge conflicts found. Manual fix needed."
         git push origin main
       displayName: Fetch, merge, and push upstream changes
   ```

3. Give the build service account push permission. Go to **Project settings > Repositories > (your repo) > Security**. Find "{project} Build Service ({org})" and set **Contribute** to **Allow**.
4. Save the pipeline. The schedule runs it.

**Result:** The push to `main` starts the `d365fo-mcp-app-deploy` pipeline, which has a CI trigger on `main`. That pipeline builds and deploys to your web app.

#### Method B: manual sync

1. Watch the [releases page](https://github.com/dynamics365ninja/d365fo-mcp-server/releases) or the CHANGELOG.md file of the repository.
2. When you want a version, run these commands on your machine:

   ```powershell
   cd d365fo-mcp-server
   git pull origin main                     # your DevOps clone
   git remote add upstream https://github.com/dynamics365ninja/d365fo-mcp-server.git
   git fetch upstream
   git merge upstream/main
   git push                                  # triggers the deploy pipeline
   ```

3. If merge conflicts occur, fix them before you push.

#### Rules for server updates

- Read the CHANGELOG before each sync. A new version can contain breaking changes.
- After each server update, check the `/health` endpoint and run one tool call from your editor.
- If stability is more important than new features, pin a known good version. Then sync only when the changelog shows something that you need.

## Day-to-day operation

| Event | Action | Time |
| --- | --- | --- |
| Merge into your model branch | The CI trigger runs automatically. Or run the pipeline manually with `customModels`. | 5 to 10 min |
| Rebuild only from the blob data that exists | Run the custom pipeline with `skipExtraction=true`. | Shorter than a full run |
| Microsoft platform update or hotfix | Make and upload `PackagesLocalDirectory.zip` again, then run the platform pipeline. | 60 to 120 min |
| Full rebuild of everything | Run `d365fo-mcp-data-platform-upgrade`. | 90 to 120 min |
| New server release on GitHub | Sync with the scheduled sync pipeline, or merge manually. | 5 to 10 min deploy |

- If you are not sure, run the custom pipeline before the upgrade pipeline.
- The upgrade pipeline builds in two passes. This keeps the memory use in the agent limit.
- Each data pipeline restarts the web app. The app downloads the new database automatically.
- To save cost, stop or scale down the app service plan when nobody uses the dev server.

## Security review notes

A code-level security review of the server repository was done for version 1.14.0. The reviewer cloned the repository and read the source, but did not run the project.

**Result of the review:** No source code theft, no telemetry, and no data leaks. The project is safe to deploy when you configure the API key.

The review confirmed these points:

- The server sends nothing to third parties. It makes only three types of outbound calls:
  - It downloads the metadata database from your own storage account, with your connection string.
  - It checks the version against the public npm registry. This call sends no data and fails silently when offline.
  - It does health checks on localhost.
- The code and the dependencies have no telemetry or analytics libraries.
- The server does not upload anything during normal operation. Only a manual CLI tool can upload, and you run it yourself.
- The C# bridge has no network code. It builds locally on your machine.
- All nine runtime dependencies are mainstream packages (MCP SDK, Express, Zod, Azure Storage Blob, and similar). `npm audit` shows zero known vulnerabilities.
- There is no hidden code execution: no `eval`, no dynamic function construction, and no obfuscated payloads.
- Authentication fails closed. The server does not start in HTTP mode without an API key.

These risks come from the configuration, not from the code. They are your responsibility:

- **The database is sensitive.** The index holds X++ source snippets, extension wiring, security roles, and label text. Protect the blob container and the connection string like production secrets.
- **Wrong settings expose all data.** Set `ALLOW_UNAUTHENTICATED=true` only when Easy Auth, Entra ID, or a private endpoint protects the app. If not, all persons with the URL can read your full model. The `/health` page is public by design.
- **The supply chain changes over time.** The review covers version 1.14.0 only. A future update can add new code. Before each sync, read the changelog and the diff.
- **The one-line installer runs remote code.** The command `irm .../install.ps1 | iex` downloads and runs a script directly. Read the script first, or use the manual path: `npm install -g d365fo-mcp`.

## Offline setup on your local machine

Use this option if you cannot use Azure or do not want to. All parts run on your own machine or dev VM.

- The server runs in **stdio mode**. Your editor starts it as a child process. There is no URL, no port, and no API key.
- You get all read tools and the file write tools, because the server is next to your source code.

| | Azure setup | Offline local setup |
| --- | --- | --- |
| Shared for the team | Yes | No. Each developer installs their own. |
| Needs an Azure subscription | Yes | No |
| Needs internet at run time | Yes (database download) | No, after installation |
| Write tools | Separate local companion | Included |
| Cost | App service plan | None |

### Requirements for the offline setup

- A Windows machine or D365FO dev VM with Node.js 24.x LTS and Git.
- Access to `K:\AosService\PackagesLocalDirectory` for the standard packages (dev VM), or a copied package folder for custom models.
- Approximately 10 GB free disk space for the source packages and the built databases.
- Internet access one time, to download the installer files. If the machine has no internet, use the [fully offline installation](#install-without-internet-access).

### Install the server code

If the machine has internet access, run this line in PowerShell. It installs Node.js if it is missing, installs the server from npm, and starts the setup wizard:

```powershell
irm https://raw.githubusercontent.com/dynamics365ninja/d365fo-mcp-server/main/install.ps1 | iex
```

If Node.js 24+ is already installed, these commands are sufficient:

```powershell
npm install -g d365fo-mcp
d365fo-mcp setup
```

### Install without internet access

1. On a machine with internet access, download the package one time. Use one of these options:
   - Option A: Run `npm pack d365fo-mcp`. This makes a file such as `d365fo-mcp-1.14.0.tgz`. Copy it to the target machine on a USB drive or a network share.
   - Option B: Run `git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git` and copy the full folder.
2. Also copy the npm dependencies. In the cloned repository, run `npm install`, then copy the full folder with `node_modules`.
3. On the target machine, install or unpack the server:
   - From the tgz file: `npm install -g C:\path\to\d365fo-mcp-1.14.0.tgz`
   - From the cloned folder: run `npm run build` in the folder. Later, use the folder path directly in the editor configuration.

The version check against the npm registry fails silently when the machine is offline. This is harmless.

### Build the metadata database locally

If the setup wizard already found or built a database, skip this task.

1. If you used the git option, clone the server repository:

   ```powershell
   git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git
   cd d365fo-mcp-server
   npm install
   ```

2. Create a `.env` file in the root of the repository:

   ```ini
   PACKAGES_PATH=K:\AosService\PackagesLocalDirectory
   CUSTOM_MODELS=MyPackage
   ```

   For custom models only, set `PACKAGES_PATH` to the checked-out model folder instead, for example `C:\repos\MyModelRepo\MyPackage`.

3. Build the database. The full standard build takes approximately 1 hour. Incremental rebuilds after merges take minutes.

   ```powershell
   npm run extract-metadata
   npm run build-database
   ```

4. Build the server code:

   ```powershell
   npm run build
   ```

Build the database again after each merge into your model branch. Or use the [CI trigger](#rebuild-the-metadata-on-each-merge), changed to run the two build commands instead of an upload to Blob Storage.

### Connect your editor to the local server

The connection uses a **command**, not a URL. Configure the stdio transport.

VS Code and GitHub Copilot:

1. Open VS Code.
2. Open the Command Palette (**Ctrl+Shift+P**).
3. Run **MCP: Add Server**.
4. Select **Command (stdio)** instead of HTTP.
5. Enter the command `d365fo-mcp` with the argument `serve`. If you use the cloned folder, enter the full path to `dist\index.js` instead: `node C:\path\to\d365fo-mcp-server\dist\index.js`.

You do not need an API key.

Claude Code:

```powershell
claude mcp add d365fo -- d365fo-mcp serve
```

To test the connection, ask the AI: "search for table CustTable". Real results from your metadata show that the local server works. The write tools are available immediately, different from the Azure setup. The AI can create classes, tables, and forms directly in your package folders.

### Select a setup

- Use the **offline local setup** if you work alone, have no Azure subscription, or need writes and have no shared server.
- Use the **Azure setup** if a full team shares one index, or if your dev VM is too small for the database and the server.
- You can run both at the same time. Point your editor to Azure for reads during a review, and to the local stdio server for writes.

## LAN web server setup through a VPN

Use this option for one shared server, as in the Azure setup, but on your own network.

- Developers connect to it through the company VPN. Nothing is open to the public internet.
- There are no Azure resources and no monthly hosting bill. You need one server on the LAN that is always on.

| | Azure App Service | LAN server (VPN) | Offline local (stdio) |
| --- | --- | --- | --- |
| Shared for the team | Yes | Yes | No. Each developer installs their own. |
| Needs an Azure subscription | Yes | No | No |
| Reachable from outside the office | Yes, public URL | Only with the VPN connected | No |
| Write tools | Separate local companion | Optional: run `read-only` or full mode | Included |
| Cost | App service plan | Your own hardware or VM | None |

### Requirements for the LAN server

- One Windows or Linux server on the LAN that is always on, with at least 8 GB RAM, 4 CPU cores, and 10 GB free disk space.
- Node.js 24.x LTS on that server.
- A fixed host name for the server, for example `mcp-dev.corp.local`. If you do not control DNS, ask your network admin.
- The built database files. Build them one time as in [Build and upload the metadata database](#build-and-upload-the-metadata-database) or [Build the metadata database locally](#build-the-metadata-database-locally). Then copy them to the server.
- VPN access for each developer who uses the server.

### Install the server code on the LAN server

1. Sign in to the LAN server.
2. Create a folder for the installation, for example `C:\d365fo-mcp` (Windows) or `/opt/d365fo-mcp` (Linux).
3. Clone the repository and build:

   ```powershell
   cd C:\d365fo-mcp
   git clone https://github.com/dynamics365ninja/d365fo-mcp-server.git
   cd d365fo-mcp-server
   npm install
   npm run build
   ```

If the server has no internet access, use the [fully offline installation](#install-without-internet-access). Copy the prepared folder with `node_modules` to this location instead.

### Put the database files on the server

1. Get the two database files from one of these sources:
   - Copy them from a machine where you built them. Look for `data\xpp-metadata.db` and `data\xpp-metadata-labels.db`.
   - Or, if you did the Azure setup, download them from the Blob Storage container `xpp-metadata` with Azure Storage Explorer.
2. Put both files in a data folder next to the installation, for example `C:\d365fo-mcp\data\`.

### Configure the environment variables

| Name | Value | Notes |
| --- | --- | --- |
| `DB_PATH` | `C:\d365fo-mcp\data\xpp-metadata.db` | On Linux, use `/opt/d365fo-mcp/data/xpp-metadata.db`. |
| `LABELS_DB_PATH` | `C:\d365fo-mcp\data\xpp-metadata-labels.db` | Same folder as above. |
| `LABEL_LANGUAGES` | `en-US` | Add more languages, separated by commas. |
| `MCP_SERVER_MODE` | `read-only` | Use `full` only if you accept writes through the shared server. |
| `NODE_ENV` | `production` | The server framework needs it. |
| `API_KEY` | (a strong generated key) | Keep it set, although the VPN protects the server. |

1. Make a key with the same commands as in [Configure the web app settings](#configure-the-web-app-settings).
2. Set the variables for the full system (**System Properties > Environment Variables** on Windows). Or, if you start the server manually, put a `.env` file in the root of the repository.
3. Read `docs/CONFIGURATION.md` in the repository for the exact names of the variables that control the listen port and the bind address. Set them so that the server listens on the LAN interface, not only on localhost.

### Run the server as a service

The server must continue to run after a reboot or a logout. Register it as a service.

On Windows, use NSSM (download it from [nssm.cc](https://nssm.cc)):

```powershell
nssm install d365fo-mcp "C:\Program Files\nodejs\node.exe" "C:\d365fo-mcp\d365fo-mcp-server\dist\index.js"
nssm set d365fo-mcp AppDirectory C:\d365fo-mcp\d365fo-mcp-server
nssm set d365fo-mcp AppEnvironmentExtra NODE_ENV=production API_KEY=(your key) DB_PATH=C:\d365fo-mcp\data\xpp-metadata.db LABELS_DB_PATH=C:\d365fo-mcp\data\xpp-metadata-labels.db MCP_SERVER_MODE=read-only
nssm start d365fo-mcp
```

On Linux, use systemd. Save this file as `/etc/systemd/system/d365fo-mcp.service`:

```ini
[Unit]
Description=D365FO MCP Server
After=network.target

[Service]
WorkingDirectory=/opt/d365fo-mcp/d365fo-mcp-server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production
Environment=DB_PATH=/opt/d365fo-mcp/data/xpp-metadata.db
Environment=LABELS_DB_PATH=/opt/d365fo-mcp/data/xpp-metadata-labels.db
Environment=MCP_SERVER_MODE=read-only
Environment=API_KEY=(your key)

[Install]
WantedBy=multi-user.target
```

Then run:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now d365fo-mcp
```

### Open the firewall for VPN clients only

> **WARNING:** Do not forward this port to the internet. Limit the rule to your VPN subnet.

Example for Windows:

```powershell
New-NetFirewallRule -DisplayName "D365FO MCP Server" -Direction Inbound -Protocol TCP `
  -LocalPort 3000 -RemoteAddress 10.8.0.0/24 -Action Allow
```

Replace `3000` with your port and `10.8.0.0/24` with your real VPN subnet.

Optional HTTPS in the VPN: put a reverse proxy (IIS, nginx, or Caddy) in front of the server with an internal certificate. Then give developers the URL `https://mcp-dev.corp.local/mcp`. For most development networks, plain HTTP with the API key is acceptable.

### Check the LAN server

1. On a machine with a VPN connection, open `http://mcp-dev.corp.local:3000/health` in a browser.

**Result:** You see:

```json
{"status":"ok","mode":"read-only", ...}
```

If it fails, check the service status (`nssm status d365fo-mcp` or `systemctl status d365fo-mcp`), check the environment variables, and make sure that the firewall rule agrees with the client subnet.

### Connect your editor to the LAN server

The steps are the same as for the Azure setup, but with the internal URL.

- VS Code and GitHub Copilot: add an HTTP server with the URL `http://mcp-dev.corp.local:3000/mcp`, the header `X-Api-Key`, and your key as the value.
- Claude Code:

  ```powershell
  npx d365fo-mcp connect http://mcp-dev.corp.local:3000
  ```

  Use the same port as in the health check URL.

To test, ask the AI: "search for table CustTable".

### Update the LAN server

- **Metadata changed:** Build the databases again, copy the new files over the old files in the data folder, and restart the service. You can automate this with a scheduled task or a cron job.
- **New server release:** Sync upstream as in [Update the server code from GitHub](#update-the-server-code-from-github). Pull on the server, run `npm install` and `npm run build`, and restart the service.

The databases are local files, so there is no blob upload step. Thus, updates are simpler than in the Azure setup.

## The official Microsoft ERP MCP server

Microsoft has its own MCP server in Dynamics 365 Finance and Operations. It became generally available in February 2026. It does not replace this project. The two servers solve different problems.

> **NOTE:** Verify the current version requirements and the Copilot Credits price of the official server on Microsoft Learn. The values in this table can change.

| | Official Dynamics 365 ERP MCP | This project (d365fo-mcp-server) |
| --- | --- | --- |
| Purpose | Agents do runtime operations in the live ERP | AI assistants write correct X++ against your codebase |
| Tools | Data CRUD through OData, form navigation, X++ actions through `ICustomAPI` | 26 tools over your indexed metadata: classes, tables, forms, EDTs, labels, security (the repository README now lists 22 tools) |
| Knows your custom code | Only what you expose through `ICustomAPI` | Yes. Indexes all standard, ISV, and custom models |
| Requirements | Version 10.0.47+, Tier 2+ environment or UDE, Feature Management, allowed client list | Any version. Runs on Azure App Service with a local companion for writes |
| Cost | Approximately 0.1 Copilot Credits for each tool call outside Copilot Studio | Azure hosting cost only |
| Best for | Business agents: post journals, approve orders, query data | Developer productivity: Copilot writes X++ that compiles |

Deploy this project now for developer productivity. Think about the official server later for business agent scenarios. The two servers can run at the same time.

## Related links

- [d365fo-mcp-server on GitHub](https://github.com/dynamics365ninja/d365fo-mcp-server)
- [d365fo-mcp-server releases](https://github.com/dynamics365ninja/d365fo-mcp-server/releases)
- [Azure Portal](https://portal.azure.com)
- [Azure Storage Explorer](https://azure.microsoft.com/products/storage/storage-explorer)
- [NSSM](https://nssm.cc)
- [D365 F&O development processes](doc:d365-fo-development-processes)
