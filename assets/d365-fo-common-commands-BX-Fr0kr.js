var e=`---
title: D365 F&O common commands and fixes
summary: Commands, scripts, and fixes for D365 F&O development VMs, platform updates, UAT databases, environment admins, and Azure Functions.
category: Dynamics 365
order: 20
---

# D365 F&O common commands and fixes

This article collects commands and short procedures for daily work on Dynamics 365 Finance and Operations (D365 F&O) development VMs. Use it as a quick reference.

## Development VM commands

| Task | Command | Shell |
| --- | --- | --- |
| Create a symbolic link | \`mklink /D "C:\\Users\\<YourUser>\\Downloads\\Folder-X" "C:\\Users\\<YourUser>\\Documents\\Folder-X"\` | CMD |
| Install the D365 PowerShell tools | \`Install-Module -Name d365fo.tools\` | PowerShell |
| Synchronize the database for one module | \`Invoke-D365DbSyncModule -Module {ModelPrefix}\` | PowerShell |
| Synchronize the full database | \`Invoke-D365DbSync\` | PowerShell |
| Reset the Windows license period | \`slmgr /rearm\` | CMD |

## Set the default model in Visual Studio

Open \`C:/Users/%USERNAME%/Documents/Visual Studio Dynamics 365/DynamicsDevConfig.xml\` and set this element:

\`\`\`xml
<DefaultModelForNewProjects>{ModelPrefix}</DefaultModelForNewProjects>
\`\`\`

## Apply a platform update package

Use this procedure to install a platform update deployable package on a development environment.

1. Get the package from [Software deployable package files](https://sa.lcs.dynamics.com/V2/SharedAssetLibrary).
2. Read [Install the deployable package](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/migration-upgrade/upgrade-latest-platform-update#example).
3. Run the installer commands:

\`\`\`cmd
:: Change the working directory to:
cd /d D:\\Downloads\\FinanceAndOperations_10.0.0000.00_Application
:: Run step ID 1 again:
AXUpdateInstaller.exe execute -runbookid=OneBoxDev -rerunstep=1
:: Set step ID 1 to complete:
AXUpdateInstaller.exe execute -runbookid=OneBoxDev -setstepcomplete=1
:: Set steps 1 to 13 to complete, in one line:
for /L %i in (1,1,13) do AXUpdateInstaller.exe execute -runbookid=OneBoxDev -setstepcomplete=%i
\`\`\`

## Connect a OneBox DevTest environment to the UAT database

Use this procedure to debug against the UAT database. For the full scenario, read [Debug UAT database](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/database/dbmovement-scenario-debugdiag).

1. On the Services drive, go to the \`AoSService\\WebRoot\` directory. The Services drive is usually drive J or K.
2. Make a backup copy of the \`web.config\` file.
3. Open \`web.config\` in Notepad or another editor.
4. Find these settings and change their values:

\`\`\`xml
<add key="DataAccess.Database" value="<example_axdb_fromAzure>" />
<add key="DataAccess.DbServer" value="<example_axdb_server.database.windows.net>" />
<add key="DataAccess.SqlPwd" value="<axdbadmin_password_from_LCS>" />
<add key="DataAccess.SqlUser" value="axdbadmin" />
<add key="DataAccess.AxAdminSqlPwd" value="<axdbadmin_password_from_LCS>" />
<add key="DataAccess.AxAdminSqlUser" value="axdbadmin" />
\`\`\`

## Run all SQL files in a folder

Run this batch script in the folder that holds the \`.sql\` files. The first loop uses Windows authentication. The second loop uses SQL authentication.

\`\`\`cmd
for %%G in (*.sql) do sqlcmd /S <server> /d <database> -E -i"%%G"
pause

for %%G in (*.sql) do sqlcmd /S <server> /d <database> -U <username> -P <password> -i"%%G"
pause
\`\`\`

## Access Azure File Storage with File Explorer

Use these values to connect to an Azure file share:

\`\`\`text
Username: {StorageAccount}.file.core.windows.net\\{StorageAccount}
Path: \\\\{StorageAccount}.file.core.windows.net\\{folder}
Password: {Accesskey}
\`\`\`

## Change the environment admin

To change the admin user of a D365 F&O environment, update the environment administrator. The official guide is [Update the environment administrator](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/lifecycle-services/update-environment-admin).

### Tier 2 and higher environments (for example UAT)

> **WARNING:** This change causes downtime in the target environment. Plan the change.

1. Log in to Lifecycle Services (LCS) and open your project.
2. Open the **Environment Details** page for the UAT environment.
3. Select **Maintain > Update Environment Admin**.
4. In the dialog box, select a new user. The user must be a **Project Owner** or an **Environment Admin** in the same LCS project.
5. Select **Save**.

### Tier 1 environments (development boxes)

You must have RDP access to the environment. Use PowerShell ISE for a better experience.

\`\`\`powershell
Install-Module -Name D365FO.tools
Import-Module -Name D365FO.tools
Set-D365Admin -AdminSignInName "admin@yourdomain.com"
\`\`\`

### Rules for the new admin

- The new admin must be in the **same Azure AD tenant** as the environment.
- If you change domains, you must get a **new ISV license file** for the new domain.
- Use a **generic admin account** (for example \`d365admin@yourdomain.com\`). This prevents problems when employees leave the organization.

## Troubleshooting

### Git fetch shows a "cannot lock ref" error

Run these commands in PowerShell:

\`\`\`powershell
# Step 0: deletes each origin/... ref with its own git call, so no piped text reaches Git.
# --no-deref: removes origin/HEAD itself. Without it, Git would delete the branch that origin/HEAD points to instead.
git for-each-ref --format='%(refname)' refs/remotes/origin | ForEach-Object { git update-ref -d --no-deref $_ }
# Step 1: rebuilds all origin/... refs from the server.
git fetch --prune origin
# Git Bash: the original one-line command works there, because Git Bash does not add the CR.
\`\`\`

### A DLL error occurs during a get latest

Run this script to stop and start the D365 services and IIS:

\`\`\`cmd
NET STOP "MR2012ProcessService"
NET STOP "DynamicsAxBatch"
NET STOP "Microsoft.Dynamics.AX.Framework.Tools.DMF.SSISHelperService.exe"
NET STOP "W3SVC"
PAUSE
NET START "MR2012ProcessService"
NET START "DynamicsAxBatch"
NET START "Microsoft.Dynamics.AX.Framework.Tools.DMF.SSISHelperService.exe"
NET START "W3SVC"
PAUSE

iisreset
\`\`\`

### Other VM problems

| Problem | Cause | Fix |
| --- | --- | --- |
| The RDP session disconnects or stops responding | Unstable direct connection | Connect from another server. For example, connect with RDP to the AX development server, then connect from there to the D365 server. |
| The server restarts again and again | The Windows license has expired | Run \`slmgr /rearm\` in CMD. |
| The database goes into an inconsistent state | The host computer shut down before the VM | If the VM runs on your computer, shut down the VM from inside the VM first. Then shut down your computer. |

### Azure Functions shows "Stack settings update is not supported for your .NET stack"

**Cause:** \`FUNCTIONS_WORKER_RUNTIME\` is still \`dotnet\`, the in-process value.

> **NOTE:** Dated (checked November 2026): Support for the .NET in-process model in Azure Functions ended on 10 November 2026. Move all .NET function apps to the isolated worker model (\`dotnet-isolated\`).

1. In **Environment variables**, set \`FUNCTIONS_WORKER_RUNTIME=dotnet-isolated\`.
2. If \`FUNCTIONS_INPROC_NET8_ENABLED\` exists, remove it.
3. Select **Apply**, then refresh the page.
4. In **Configuration > General settings**, set the stack to .NET (isolated) with your target version.
5. Set the platform to 64 Bit, save, and restart the app.

If the stack dropdown stays locked, run this command in Cloud Shell. Then restart the app.

\`\`\`bash
az functionapp config set -g <rg> -n <app> --net-framework-version v<version>
\`\`\`

If the error comes back after a release, your pipeline can set \`FUNCTIONS_WORKER_RUNTIME\` back to \`dotnet\`. Change the value in the pipeline too.

## Related links

- [Install the deployable package](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/migration-upgrade/upgrade-latest-platform-update#example)
- [Software deployable package files](https://sa.lcs.dynamics.com/V2/SharedAssetLibrary)
- [Debug UAT database](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/database/dbmovement-scenario-debugdiag)
- [Update the environment administrator](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/lifecycle-services/update-environment-admin)
- [Apply a D365 service update](https://dynamics365musings.com/d365-service-update/)
- [Connect to SharePoint with a PnP PowerShell certificate](doc:d365-fo-sharepoint-pnp-certificate)
- [D365 F&O development processes](doc:d365-fo-development-processes)
`;export{e as default};