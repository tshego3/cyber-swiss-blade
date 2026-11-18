---
title: Set up the D365 F&O Unified Developer Experience
summary: Provision a UDE environment, install and connect the Visual Studio tools, configure metadata, then build, deploy, debug, test, and automate X++ development.
category: Dynamics 365
order: 150
---

# Set up the D365 F&O Unified Developer Experience

This guide shows how to set up and use the Unified Developer Experience (UDE) for Dynamics 365 Finance and Operations (F&O). The sources are Microsoft Learn (links at the end) and the Dynamics 365 FastTrack Tech Talk "Unified Development Experience for Finance and Operations".

## Before you start

### Tenant and licensing

- A license that lets you provision F&O, assigned to your user in Microsoft Entra ID:
  - Customers: Dynamics 365 Finance, or Dynamics 365 Supply Chain Management.
  - Partners and ISVs: Dynamics 365 Operations Application Partner Sandbox.
- Verify the assignment at **My Account > Subscriptions**.
- The Power Platform Administrator or Dynamics 365 Administrator role can create environments without a full user license. After the role assignment, allow 12 hours for the provisioning cache.
- Capacity: at least 1 GB free of Dataverse database capacity and 1 GB free of Operations database capacity. The capacity model replaces the LCS model where you buy environment slots. There is no hard limit on the number of environments.
- Templates (each needs a license):

  | Template | Application |
  | --- | --- |
  | `D365_FinOps_Finance` | Finance (preview). |
  | `D365_FinOps_SCM` | Supply Chain Management (preview). |
  | `D365_FinOps_ProjOps` | Project Operations Integrated (preview). It is also the partner sandbox template. |
  | `D365_FinOps_Commerce` | Commerce (preview). Trials only. |

- Region: Not every environment type is available in every region. Before you provision, check the region matrix in [Unified environment types and templates](https://learn.microsoft.com/en-us/power-platform/admin/unified-experience/unified-environment-types-and-templates).
  - Many locations have a primary Azure region that supports UPE, USE, and UDE, and a secondary region that supports only UDE and trials.
  - F&O does not support every Dataverse region. An installation in an unsupported region fails with "The selected region does not support the FnO app deployment".

### Developer machine

- Windows 10 or Windows 11.
- Free space on the system drive for the extension, the metadata, and the cross-reference database. The documented minimum is 16 GB. This is not a working figure.
  - Measured on 10.0.2645.111: 18.5 GB of extracted metadata, a 7.5 GB cross-reference backup, and approximately 8 GB after the restore of that backup. Plan for 60 GB.
- Visual Studio 2022 Professional or Enterprise. Visual Studio Community is not supported.
  - Use version 17.13 or later, on the Current channel.
  - The F&O extension from Platform Update 72 and later binds to `Microsoft.VisualStudio.Threading 17.13.0.0`. A 17.12 IDE cannot resolve that assembly.
  - LTSC servicing baselines below 17.13 (for example 17.12 LTSC) never get this assembly. You must move off the LTSC channel.
  - To see your version, go to **Help > About Microsoft Visual Studio**, or run `vswhere.exe -all -format json` from `C:\Program Files (x86)\Microsoft Visual Studio\Installer`.
  - Visual Studio 2026 (version 18.x) is not supported. The F&O extension targets only the 17.x IDE.
- Visual Studio workload: **.NET desktop development**.
- Visual Studio individual components: **Modeling SDK**, and optionally **DGML editor** (for dependency graphs).
- Visual Studio Marketplace extensions:
  - **Microsoft Reporting Services Projects**, for SSRS report development.
  - **Microsoft RDLC Report Designer**, for report design.
- SQL Server Express LocalDB. Visual Studio 2022 installs it. Make sure that it accepts Windows authentication before you start. To repair it, run `sqllocaldb create MSSQLLocalDB -s`.
- Optional: 7-Zip, for faster metadata extraction.
- Optional: a full SQL Server, if you want to keep the cross-reference database outside LocalDB.

> **NOTE:** Dated (checked November 2026): The "What's new in platform update 10.0.49" article on Microsoft Learn says that from Platform Update 75, Microsoft no longer supports Visual Studio 2022 for X++ development. Only Visual Studio 2026 is supported. The Visual Studio 2022 and 17.13 rules in this article apply only to earlier platform updates. Refer to [What's new in platform update 10.0.49](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/whats-new-platform-updates-10-0-49).

## What UDE is

- UDE replaces the LCS cloud-hosted developer VM. There is no VM, no RDP, and no local AOS.
- UDE has two tiers:
  - **Development tier:** your local machine. It holds the metadata, the X++ source, the compiler, the tools, and Visual Studio.
  - **Execution tier:** a cloud environment. It holds the business data, runs X++, and hosts the AOS.
- F&O is an application in a Power Platform environment with Dataverse.
- One environment has two URLs:
  - **Environment URL:** customer engagement and Dataverse apps.
  - **Finance and Operations URL:** the F&O runtime.
- Administration moves from LCS to the Power Platform admin center (PPAC).
- The Dataverse integration paths do not change: dual-write (bi-directional, near real-time) and virtual tables (no replication).

## Environment types

| Type | Power Platform type | Purpose and limits |
| --- | --- | --- |
| UDE (Unified Developer Environment) | Sandbox, provisioned with `DevToolsEnabled=true` | X++ development by one developer. 1 AOS instance, no elastic scaling. Supports direct SQL access to the product database. Not for development by many users or for performance tests. |
| USE (Unified Sandbox Environment) | Sandbox | Test, UAT, staging, and training. Full scaling (up to 80 AOS: 40 interactive, 40 batch). Supports copy, backup and restore, and transaction-less copy. |
| UPE (Unified Production Environment) | Production | Full scaling. You create it new, or convert a sandbox to production. |

> **IMPORTANT:** USE and UDE are not interchangeable. After provisioning, you cannot convert one to the other. The Power Platform "Developer" environment type is not a UDE and has no Dynamics 365 workload. A Trial environment does not work for UDE, because Visual Studio does not offer the metadata download.

## Provision the UDE

You must create a sandbox for developers with dev tools enabled with PowerShell. The PPAC user interface cannot create these sandboxes yet.

### Provision with PowerShell

1. Open Windows PowerShell 5.1. PowerShell 7 does not work.
2. Install the module:

   ```powershell
   Install-Module -Name Microsoft.PowerApps.Administration.PowerShell
   ```

3. Sign in:

   ```powershell
   Add-PowerAppsAccount -Endpoint prod
   ```

4. Make the template metadata. `DevToolsEnabled=true` makes the environment a UDE.

   ```powershell
   $jsonObject = @"
   {
     "PostProvisioningPackages":
     [
       {
         "applicationUniqueName": "msdyn_FinanceAndOperationsProvisioningAppAnchor",
         "parameters": "DevToolsEnabled=true|DemoDataEnabled=true"
       }
     ]
   }
   "@ | ConvertFrom-Json
   ```

5. Provision the environment:

   ```powershell
   New-AdminPowerAppEnvironment -DisplayName "MyUniqueNameHere" -EnvironmentSku Sandbox `
     -Templates "D365_FinOps_Finance" -TemplateMetadata $jsonObject `
     -LocationName "<location>" -ProvisionDatabase
   ```

The display name must be globally unique (it becomes part of the F&O URL) and have 20 characters maximum.

### Provision with PPAC (USE, UPE, or template-only environments)

1. Sign in to the Power Platform admin center.
2. Go to **Manage > Environments > New**.
3. Set `Add a Dataverse data store` to Yes. Optionally, set `Get new features early` for preview releases.
4. Select **Next**, then select a security group to limit access.
5. Set `Enable Dynamics 365 apps` to Yes, then select the template.
6. Select **Save**.

### Use an existing environment

Install the Dynamics 365 Finance and Operations Provisioning App on a Dataverse environment that supports Dynamics 365 apps. With this path, you can select a supported F&O version instead of the latest version.

### Check the environment after provisioning

1. Open the Finance and Operations URL. Make sure that the environment gets to the Ready state.
2. Give the developer account the System Administrator role in the environment. UDE work and SQL credential requests need this role.

You cannot provision or update to a specific F&O version yet. To match the version of a sandbox or production environment, copy that environment into the UDE. UDE features are generally available from version 10.0.39. If you copy from an older source, you lose the newer UDE features.

## Install and connect the tooling

1. Install **Power Platform Tools for Visual Studio** from the Visual Studio Marketplace. Do not do the plug-in profiler step in the documentation of that extension. UDE does not need it.
2. Install both extensions in the same Visual Studio. Power Platform Tools connects and downloads. The F&O extension supplies the `.rnrproj` project system. If they are in two different IDEs, neither works. To see which extensions are registered, run:

   ```cmd
   dir "C:\Program Files\Microsoft Visual Studio\<year>\<edition>\Common7\IDE\Extensions" /s /b | findstr /i "PowerPlatform Dynamics.Framework.Tools"
   ```

3. Before you connect, examine **Tools > Options > Power Platform Tools**:
   - `Auto setup for Dynamics 365...`: on by default. It extracts the system metadata and creates the metadata configuration. Turn it off only for a manual setup.
   - `Do not display Power Platform Explorer...`: turn it on for a faster connection.
   - `Download logs...`: turn it on to always get the deployment and DBSync logs.
4. Connect to the environment with one of these commands:
   - **Tools > Connect to Dataverse**. It downloads the assets only if they are not already on the machine.
   - **Tools > Download Dynamics 365 FinOps assets**. It always downloads.
5. If the developer account is not the signed-in user, do not use the signed-in user. Enter the credentials of the developer account.
6. Select the solution, select **Done**, then select the sandbox environment from the Dataverse organization list. If only one developer environment exists, the list can be skipped.

### MFA and guest accounts

- If the account requires MFA, clear all check boxes on the login screen.
- For a guest UPN in another tenant, go to **Tools > Options > Power Platform Tools** and enable `Skip Discovery when connecting to Dataverse`. Clear all login check boxes. Then enter the Dataverse URI when Visual Studio asks for it.

## Download and install the F&O assets

1. After you connect, accept the download dialog. The Visual Studio Output pane shows the progress.
2. The assets go to `C:\Users\<User>\AppData\Local\Microsoft\Dynamics365\<ApplicationVersion>`:

   | Asset | Content | Size on 10.0.2645.111 |
   | --- | --- | --- |
   | `PackagesLocalDirectory.zip` | System (reference) metadata | 18.5 GB extracted, 519,441 files in 176 module folders |
   | `Microsoft.Dynamics.FinOps.ToolsVS2022.vsix` | The F&O Visual Studio extension | 113 MB |
   | `DYNAMICSXREFDB.bak` | Cross-reference database backup | 7.5 GB |
   | `TraceParser.msi` | Performance trace tools | 5 MB |

3. If auto setup is off, or if the Output pane tells you to, do these manual steps:
   1. Unblock the downloaded files in File Explorer.
   2. Extract `PackagesLocalDirectory.zip` to a folder with the name `PackagesLocalDirectory`.
   3. Run the `.vsix` file to install the F&O extension.
4. On the next Visual Studio start, accept the elevation prompt. It registers the URL protocol handler, sets up the build targets, and extracts the compiler files.

The extension deletes `PackagesLocalDirectory.zip` after it extracts it. Keep the extracted folder. Some releases do not have `PackagesLocalDirectory\bin\InstalledVersion.json`. Do not treat it as necessary.

The extension does these operations, in log order:

1. It reads the environment details from Dataverse: `ApplicationVersion`, `PlatformVersion`, `FinOpsUri`, and `FinOpsEnvType`.
2. It downloads the four files in parallel into `%LOCALAPPDATA%\Microsoft\Dynamics365\<ApplicationVersion>\`.
3. It extracts `PackagesLocalDirectory.zip` in place, then deletes the zip.
4. If auto setup is on, it installs the vsix, restores the cross-reference database, and creates the metadata configuration. If auto setup is off, the log records `Not proceeding to setup the client with the downloads.`

If the download fails, stops, or is incomplete, refer to [Recover a failed UDE asset download](doc:d365-fo-ude-asset-download).

## Verify the downloaded version

**Symptom:** The local metadata agrees with a different environment (for example UAT) instead of the environment that you develop against.

**Cause:** Visual Studio downloads the application version of the connected environment. If you select the wrong organization when you connect, you get the wrong package.

### Check the environment version (cloud side)

- **F&O client:** Open the Finance and Operations URL and select the gear icon > **About**. It shows the environment name, the Application build, and the Platform build. This is the source of truth.
- **PPAC:** Go to **Manage > Environments** and select the environment. The detail page shows the environment type. **Resources > Dynamics 365 apps** shows the installed F&O app and its version.
- **Dataverse:** Open `Finance and Operation Package Manager App` > **Package**. It shows the applied packages and the update history.

### Check the local assets (development side)

- The download folder has the name of the application version: `C:\Users\<User>\AppData\Local\Microsoft\Dynamics365\<ApplicationVersion>`. More than one folder means that you downloaded more than one version.
- `...\<ApplicationVersion>\PackagesLocalDirectory\bin\InstalledVersion.json` holds the platform version of the extracted metadata.
- In Visual Studio, go to **Extensions > Dynamics 365 > Configure Metadata**. The current configuration shows the reference metadata folders and the application version of the cross-reference database.

### Check which environment Visual Studio uses

- **Tools > Connect to Dataverse** shows the selected Dataverse organization.
- The Output pane, channel "FinOps Cloud Runtime", shows the target environment URL at each deploy.

### Correct a wrong download

1. Connect to the correct environment: select **Tools > Connect to Dataverse**, sign in with the developer account, and select the correct organization.
2. Start a new download with **Tools > Download Dynamics 365 FinOps assets**. This command always downloads. `Connect to Dataverse` does not.
3. Create a metadata configuration for that environment. Set `Folders for reference metadata` to the new `PackagesLocalDirectory`, and set the applicable application version for the cross-reference database.
4. Keep one metadata configuration for each environment, also when the versions are the same. Restart Visual Studio to load it.
5. Build and deploy your models again. The local metadata and the environment must stay in sync.

A UAT environment is a USE, not a UDE. It has no dev tools, and Visual Studio does not offer a metadata download for it. If you downloaded a UAT-level version, the source is a UDE that was copied from UAT, or a second UDE. To align a UDE with a UAT or production version, copy that environment into the UDE. You cannot select a version directly.

## Configure metadata

1. Open Visual Studio, select **Continue without code**, then select **Extensions > Dynamics 365 > Configure Metadata**. If the menu item is missing, open **Extensions > Dynamics 365 > Infolog** and try again. Versions 10.0.39 and later fix this problem.
2. Select **New** and fill in the fields:

   | Field | Value |
   | --- | --- |
   | Name and Description | Identify the configuration. Use one configuration for each environment. |
   | Cross reference database server | `(localdb)\.` for LocalDB, or `localhost` for SQL Server. |
   | Cross reference database name | The extension creates it if it does not exist, from the downloaded `.bak` file. |
   | Application version to restore cross reference database from | Filled in from the downloaded assets. |
   | Folder for your own custom metadata | The folder of your X++ modules. Set it to your Git working folder. |
   | Folders for reference metadata | Must include the extracted `PackagesLocalDirectory`. Also add the parent folders of ISV modules. |

3. Select **Save**. Only one configuration is current at a time. A change applies to new Visual Studio instances.
4. Select **View > Application Explorer**.

**Result:** Application Explorer opens and shows the application tree. If it does not, restart Visual Studio.

## Start the first development loop

There are two starting points: a new model that you create locally, or a model that is already in a Git repository on GitHub.

### Create a new model

1. Go to **Extensions > Dynamics 365 > Model management > Create model**.
2. Give the model a name, select **Create new package**, then select the referenced models. Select Application Platform and Application Foundation as a minimum.
3. Put the model folder in your Git working folder (the `Folder for your own custom metadata` of the metadata configuration). Version control then includes the new code from the start.
4. Create a finance and operations project and set its **Model** property.
5. Select **Add > New item > Dynamics 365 items > Code > Runnable Class**, then write X++.
6. Commit the model descriptor files and the `.rnrproj` file to GitHub before you continue. Refer to [Source control and team topology](#source-control-and-team-topology) for the files that go in the repository.

### Use an existing model from GitHub

1. Clone the repository first, then connect:
   - Run `git clone <repo-url>` to a local disk. Do not use `OneDrive` or a sync tool. File-sync activity on half a million reference files is bad. Your own metadata is small, but a plain local clone is still better.
   - Do not put the clone under `%LOCALAPPDATA%\Microsoft\Dynamics365`. That folder is for the downloaded assets.
2. Add the clone to the metadata configuration (**Extensions > Dynamics 365 > Configure Metadata**):
   - `Folder for your own custom metadata`: the parent folder of the cloned models.
   - `Folders for reference metadata`: the extracted `PackagesLocalDirectory`, plus the parent folders of the ISV modules that the solution uses.
   - If the repository holds more than one package, each package needs its own `.rnrproj` in the repository. Open them through one solution file, in one Visual Studio instance, with one active configuration.
3. Get the missing parts:
   - Referenced Microsoft packages do not need a restore. They come with `PackagesLocalDirectory`.
   - Referenced ISV or third-party models do not come from GitHub, unless your team commits them or records their source. Refer to [Add ISV and third-party modules](#add-isv-and-third-party-modules).
4. Build the full solution one time immediately after the clone, before you change anything. This proves that the branch agrees with the environment version, and it shows broken references early.
5. If the build shows a version mismatch, you have the wrong branch or the wrong environment connection. Refer to [Verify the downloaded version](#verify-the-downloaded-version) before you change code.
6. Make your changes, then commit and push as usual. After you change branches, build and deploy again before you run anything. If you do not, the local metadata and the cloud environment become different without a warning.

### Build, deploy, and run

1. Build the project from its context menu. The X++ compiler, the label compiler, and the tools all run locally. The tool versions follow the application version of the active metadata configuration, not the extension version.
2. Deploy to the cloud, then run.

> **IMPORTANT:** Keep the local metadata and the connected environment in sync at all times. A difference between them is the main cause of UDE failures.

## Deploy and synchronize the database

| Method | How | Database sync |
| --- | --- | --- |
| Deploy built modules | **Extensions > Dynamics 365 > Deploy > Deploy Models to Online Environment**. Select the model. Referenced Microsoft packages are already on the server tier and do not need a deployment. | Optional in the dialog. |
| Deploy with a full build | **Extensions > Dynamics 365 > Build models**, with `Deploy to connected online environment` enabled. | Follows the `Synchronize database` setting on the same Options tab. |
| Deploy with an incremental build (fastest) | Build or rebuild from Solution Explorer with `Deploy changes to online environment` set to true. Deploys only the changes since the last successful deployment. | Follows the `Synchronize database` setting of the project. |
| Deploy the model of one project | Right-click the project > **Deploy model for project ...**. Deploys only changes. | No. |
| Synchronize without a deployment | **Extensions > Dynamics 365 > Synchronize database...**. Runs DBSync for all modules. It takes a long time. | Yes. |

Rules:

- Use incremental build and deploy for large modules.
- Do a full deployment with DB sync for binary-only ISV modules.
- Do not change or deploy system modules.
- Follow the progress in the Output pane, channel "FinOps Cloud Runtime".

## Debug

1. Set the symbol options in **Extensions > Options > Debugging**. Load the symbols for your solution, ApplicationPlatform, and ApplicationFoundation.
2. Set a breakpoint and press F5. A browser opens a URL for the runnable class. The symbols load, then the execution stops at the breakpoint.
3. Press F5 to continue. The Infolog output shows in the Visual Studio Infolog pane.
4. To run the scenario again, refresh the browser. The debugger stays attached and the symbols stay loaded.

To debug a form instead of a class:

1. Change the `mi` parameter in the URL, for example `https://<environment>?prt=initial&debug=vs&activityid=<unchanged>&cmp=DAT&mi=SysUserSetup`.
2. Find the object in Application Explorer (search syntax `SysUserSetup type:"form"`), select **View code**, and set breakpoints.

Other debug tasks:

- To attach to a running AOS, select **Extensions > Dynamics 365 > Launch debugger**.
- Detach, do not stop. Use **Detach All** instead of **Stop Debugging**. **Stop Debugging** restarts the runtime.
- Use Application Insights to monitor and diagnose code that runs in the environment.

## Get direct SQL access to the product database

Direct SQL access is available only in UDE. You must have the System Administrator role in the environment.

1. In Visual Studio, select **Tools > SQL Credentials for Dynamics 365 FinOps...**.
2. Enter a reason for the request. The dialog fills in the public IPv4 address of your machine.
3. If you need access from other machines, make the IPv4 range wider. The Azure SQL firewall denies all addresses outside the range.
4. Copy the credentials to the clipboard. They have an expiry time.

A new credential for the same user in the same environment cancels the previous credential. More than one user can have active credentials in one environment. One user can have credentials in more than one environment.

## Run unit tests

- The framework is SysTest. Test classes extend `SysTestCase`. Test methods have `[SysTestMethod]` and usually `Hookable(false)`.
- Create a separate test model. Put the word "Test" in the name. The default build definition finds test modules by that word.
- Test execution needs references to Application Foundation and Test Essentials.
- You must deploy each new or changed test before you run it. Tests run in the cloud against live SQL data.
- Run tests from **Test > Test Explorer > Run selected test**. The debug option in Test Explorer is not supported.
- Set the isolation with `[SysTestTransaction(TestTransactionMode::X)]`:

  | Mode | Behavior |
  | --- | --- |
  | `AutoRollback` | Default. Best isolation. Uses SQL save points. Nothing stays in the database. |
  | `LegacyRollback` | Records and deletes inserts, row by row. Use it for user connection or concurrency tests. Put the tests in `ttsBegin` / `ttsAbort`. |
  | `LegacyRollbackWithUpdateTracking` | Reverts inserts, updates, and deletes. Slowest. |
  | `None` | No isolation. Use it only to debug. |

## Add ISV and third-party modules

1. Put all received modules under one parent folder, for example `E:\ISVModules\Module01` and `E:\ISVModules\Module02`.
2. Check the modules into version control first.
3. Add the parent folder (`E:\ISVModules`) to `Folders for reference metadata` in the active metadata configuration.
4. To include an ISV license, put the file in a `__License` folder (two underscores) in the model, at the same level as `bin`. Example: `E:\ISVModules\Module01\__License\licenseFile01`.
5. Run a full DB sync from the Dynamics 365 menu. If you do not, the license does not apply.

To convert a legacy LCS deployable package to the unified format, run `ModelUtil.exe` from the `bin` folder with `-convertToUnifiedPackage`. Give the package zip and an output location. If the package holds more than one version of a model, the conversion fails with "The file ... already exists". Build the package again with exactly one version of each model.

## Source control and team topology

- In UDE, version control is necessary. It is the record of what is deployed where.
- Use Azure DevOps (or GitHub) with Git.
- Give each developer one UDE. Shared UDEs become corrupt easily, because a deploy can overwrite what another developer deployed.
- If you change Git branches and do not deploy again, the local metadata does not agree with the environment. Build and deploy after each branch change.
- One Visual Studio instance connects to one environment with one active metadata configuration at a time:
  - To change the metadata configuration, select **Extensions > Dynamics 365 > Configure Metadata**.
  - To change the environment, select **Tools > Connect to Dataverse**. A configuration change does not change the connection.
  - Keep one configuration for each environment, also when the versions are the same.
  - Keep the version of the F&O Visual Studio extension aligned with the environment version.
- Commit these items to Git:
  - Your custom metadata folder (X++ models and the model descriptor files in the metadata folder).
  - The X++ project files (`.rnrproj`), one for each package that you build.
  - The solution files.
- Do not commit `PackagesLocalDirectory` or generated binaries.

## CI/CD with Azure DevOps

### Prerequisites for CI/CD

- An Azure DevOps organization and project with a Git repository. The repository holds the X++ source, one `.rnrproj` for each package, and the model descriptors.
- The `Dynamics 365 Finance and Operations Tools` extension, installed in the organization (**Organization Settings > Extensions**).
- The `Power Platform Build Tools` extension (**Organization Settings > Extensions > Browse Marketplace**).
- YAML pipelines need Git. TFVC repositories need classic pipelines.

### Supply the X++ references as NuGet packages

1. In Visual Studio, go to **Tools > Options > Power Platform Tools > General** and enable `Download Dynamics 365 FnO NuGets for CI/CD`.
2. Select **Tools > Download Dynamics365 FnO NuGets for CI/CD**. Select the application release, optionally select specific packages, set the download location, and select **Download**.
3. Push the packages to your Azure Artifacts feed.

### Build pipeline

1. Add the `Create Deployable Package` task, task version 3.
2. Select `Create Power Platform Unified Package`.
3. Give the platform and application versions for the build and the deployable package path. Optionally, list X++ modules to delete. Optionally, also make an LCS-format package.
4. For licenses, add `Add Licenses to Deployable Packages` (task version 1), select `Power Platform Unified Package`, and give the model name. Add one task for each model.

The artifacts show under **Related** on the **Summary** tab of the pipeline.

| Problem | Cause | Fix |
| --- | --- | --- |
| `fnomoduledefinition.json file not found` | Wrong package path in the license task | Correct the deployable package path. |
| "An item with the specified name ... already exists" | Duplicate modules | Keep one version of each module. |

### Release pipeline

1. Add these tasks in this order: `Power Platform Tool Installer`, `Power Platform WhoAmI`, `Power Platform Deploy Package`.
2. WhoAmI needs a generic service connection. Get the connection details from **Your Organization > Details** in PPAC.
3. Give Deploy Package the path of the package from the build.

**Result:** One Power Platform unified package holds the X++ output and the Dataverse solutions. You deploy it with one `pac package deploy`.

## What changes for an LCS-era team

Terminology:

| LCS term | Unified term |
| --- | --- |
| Deploy | Provision. |
| Database refresh | Copy. Copy now moves code with data, which gives a full copy. |
| Database export | Backup, kept in the cloud. There is no downloadable `.bak` or `.bacpac`. |
| Point-in-time restore | Restore. Convert to production is supported for unified environments. |

Reset is not implemented yet where the F&O Provisioning App is installed. Restore of a deleted environment of that type is not implemented yet either.

LCS features with no PPAC equivalent:

| LCS feature | Replacement |
| --- | --- |
| Methodology and project settings | Dynamics Implementation portal or Azure DevOps. |
| Organization users | Microsoft 365 admin center. |
| Translation service | Dynamics translation connector. |
| Asset library | Store packages in Azure DevOps and import them directly to Dataverse. No offline database backups. |
| Solution management | Microsoft Marketplace. |
| Build environments | Microsoft-hosted agents in Azure DevOps. |
| Alert service | Support ticket. |
| Business process modeler | Business process catalog. |
| Task recorder | Save the files locally. |

## Setup checklist

Tenant:

- [ ] The correct F&O license is assigned to the developer account.
- [ ] 1 GB is free in both the Dataverse and the Operations database capacity.
- [ ] The target region supports UDE.

Environment:

- [ ] The UDE is provisioned with Windows PowerShell and `DevToolsEnabled=true`.
- [ ] The name has 20 characters or fewer and is globally unique.
- [ ] The version is 10.0.39 or later.
- [ ] The developer account has the System Administrator role.
- [ ] The F&O URL opens and shows Ready.

Machine:

- [ ] Visual Studio 2022 Professional or Enterprise, with the .NET desktop development workload and the Modeling SDK.
- [ ] Visual Studio 2022 is on 17.13 or later. It is not an LTSC baseline below 17.13 and not Visual Studio 2026. From Platform Update 75, use Visual Studio 2026 instead.
- [ ] Reporting Services Projects and RDLC Report Designer are installed.
- [ ] LocalDB accepts Windows authentication.
- [ ] 16 GB is free on the system drive (60 GB recommended).

Tools:

- [ ] The Power Platform Tools extension is installed and connected to the UDE.
- [ ] The F&O assets are downloaded and `PackagesLocalDirectory` is extracted.
- [ ] The metadata configuration is saved and current. Application Explorer opens.

Repository:

- [ ] The Git repository is cloned. The custom metadata folder points into the working folder.
- [ ] The `.rnrproj` files and the model descriptors are committed.

Verification:

- [ ] Create a model, add a runnable class, build, deploy, press F5, stop at a breakpoint, and see the Infolog output.

## Troubleshooting

### Environment and provisioning

| Problem | Cause | Fix |
| --- | --- | --- |
| The environment shows "preparing", then disappears | Provisioning failed | Open a support ticket with the environment name and the tenant ID. |
| "You don't have the required Dynamics 365 licenses to create a database with `<app name>`" | The license of the template is not assigned to you | Assign the license. |
| `EnvironmentNotInReadyState` | The environment is not ready | Wait, then open the F&O URL to verify. |

### Connection and setup

| Problem | Cause | Fix |
| --- | --- | --- |
| No metadata download prompt | The environment is not a sandbox for developers. Trials do not work. | Provision a UDE. |
| You must download the assets again | | Select **Tools > Download Dynamics 365 FinOps assets**. |
| The asset download fails, stops, or is incomplete | | Refer to [Recover a failed UDE asset download](doc:d365-fo-ude-asset-download). |
| `Configure Metadata` is missing | Known problem before 10.0.39 | Open the Infolog and try again. Versions 10.0.39+ fix it. |
| `prvCreatemsprov_fnopackage privilege` is missing | | Contact Microsoft Support with the environment details. |
| A greyed-out **Save** in Configure Metadata | A field failed validation | Put the pointer on the field with the red border to see the tooltip. |
| Cross-reference validation fails | The Windows user has no access to LocalDB or SQL Server | Make the LocalDB instance again with `sqllocaldb stop MSSQLLocalDB`, `sqllocaldb delete MSSQLLocalDB`, and `sqllocaldb create MSSQLLocalDB -s`. If necessary, install LocalDB 2019 again. |
| A "Please wait for update to complete" popup comes back again and again | The metadata version does not agree with the environment | Edit `...\<AppVersion>\PackagesLocalDirectory\bin\InstalledVersion.json` so that the version agrees with the platform version of the environment. |

### Visual Studio cannot open the .rnrproj project

**Symptom:** `'...\FinanceOperations1.rnrproj' cannot be opened because its project type (.rnrproj) is not supported by this version of the application.`

**Cause:** The F&O extension packages do not load, so the `.rnrproj` project factory does not register. Visual Studio then does not know the project type. The extension still shows as installed in **Extensions > Manage Extensions**.

1. Open `%LOCALAPPDATA%\Microsoft\VisualStudio\17.0_<instanceId>\ComponentModelCache\Microsoft.VisualStudio.Default.err`. A version mismatch shows as `System.TypeLoadException: Method 'add_StartAsync' in type 'Microsoft.Dynamics.Framework.Tools.LanguageService.XppLanguageClient' ... does not have an implementation.`
2. Examine the assembly references of `Microsoft.Dynamics.Framework.Tools.ProjectSystem.17.0.dll` in the extension folder under `...\Common7\IDE\Extensions\<random>\`. A 17.12 IDE cannot resolve a reference to `Microsoft.VisualStudio.Threading 17.13.0.0`.

   ```powershell
   $dll = "C:\Program Files\Microsoft Visual Studio\2022\Professional\Common7\IDE\Extensions\<random>\Microsoft.Dynamics.Framework.Tools.ProjectSystem.17.0.dll"
   [System.Reflection.Assembly]::ReflectionOnlyLoadFrom($dll).GetReferencedAssemblies() |
     Where-Object { $_.Name -like "Microsoft.VisualStudio.*" } | Select-Object Name, Version
   ```

3. Update Visual Studio 2022 to 17.13 or later.
4. Clear the MEF cache: delete `%LOCALAPPDATA%\Microsoft\VisualStudio\17.0_<instanceId>\ComponentModelCache` and run `devenv /updateconfiguration`.

As an alternative, install an older F&O extension from a Platform Update before the 17.13 dependency.

A second cause: the `.sln` or `.rnrproj` file association opens Visual Studio 2026, which has no F&O extension for your platform update. Open the solution with Visual Studio 2022. From Platform Update 75, the reverse applies: use Visual Studio 2026.

### Deployment and DBSync failures

- Get the log link from the Visual Studio Output pane. To always get it, enable `Download logs...` in the Power Platform Tools options.
- Or, in Dataverse, open `Finance and Operation Package Manager App` > **Operation History**, select the operation, and download `operationlogs.zip`.
- For the applied packages and the update history, select **Package** in the left pane of the same app.

### Wrong behavior after a successful deploy

1. Run the scenario again and read the Infolog.
2. Attach with **Extensions > Dynamics 365 > Launch debugger** and set breakpoints.
3. Add X++ unit tests to find the regression next time.
4. Use Application Insights for runtime telemetry.

### Data for Microsoft Support

- The correlation ID (Visual Studio Output pane), the client machine name, and the timestamp.
- `C:\Users\<user>\AppData\Local\Microsoft\Dynamics365\Logs\Microsoft.PowerPlatformVSExtension*.log`.
- `...\AppData\Roaming\Microsoft Corporation\Microsoft Visual Studio\<version>\VisualStudioD365Extension-*.log`.

## Related links

- [Unified developer experience for finance and operations apps](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-dev-overview)
- [Install and configure development tools](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-install-config-tools)
- [Tutorial: Write, deploy, and debug X++ code](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-debug)
- [Workflow across multiple environments (inner loop)](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-innerloop)
- [Unit testing](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-testing)
- [Continuous integration and deployment](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-pipelines)
- [Request credentials to product database](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-product-db-access)
- [Unified developer experience FAQ](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-faq)
- [Tutorial: Provision a new environment with an ERP-based template](https://learn.microsoft.com/en-us/power-platform/admin/unified-experience/tutorial-deploy-new-environment-with-erp-template)
- [Unified environment types and templates](https://learn.microsoft.com/en-us/power-platform/admin/unified-experience/unified-environment-types-and-templates)
- [Overview of unified admin experience](https://learn.microsoft.com/en-us/power-platform/admin/unified-experience/finance-operations-apps-overview)
- [Visual Studio requirements for X++](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-tools/developer-tools-vs2017)
- [What's new in platform update 10.0.49](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/whats-new-platform-updates-10-0-49)
- [Build automation with Microsoft-hosted agents](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-tools/hosted-build-automation)
- [Asset library in Lifecycle Services](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/lifecycle-services/asset-library)
- [LCS Shared asset library](https://lcs.dynamics.com/V2/SharedAssetLibrary)
- [Deploy and access development environments (downloadable VHD)](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-tools/access-instances)
- [FastTrack Tech Talk: Unified Development Experience for Finance and Operations](https://www.youtube.com/watch?v=OuEZ1rXkpYY)
- [Recover a failed UDE asset download](doc:d365-fo-ude-asset-download)
- [Enable the D365 F&O extension in Visual Studio](doc:d365-fo-visual-studio-extension)
- [D365 F&O development processes](doc:d365-fo-development-processes)
