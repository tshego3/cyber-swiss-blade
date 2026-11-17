---
title: Recover a failed UDE asset download
summary: Fix a failed, stalled, or incomplete download of the D365 F&O UDE assets, get PackagesLocalDirectory another way, and run the setup steps manually.
category: Dynamics 365
order: 160
gist: 4143abbf2ae6a49f115d90ace5f76ecb
---

# Recover a failed UDE asset download

Use this procedure when Visual Studio cannot download the four Unified Developer Experience (UDE) assets for D365 F&O. Do the tasks in sequence. The first task fixes most failures in approximately ten minutes. Do not start to copy 18.5 GB through the office before that task fails.

For the normal download and setup, refer to [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience#download-and-install-the-fo-assets).

## Before you start

There is no public static URL for the four assets. The extension changes an internal asset key into a short-lived Azure Storage SAS. The SAS is scoped to the connected environment and signed with your Dataverse token. You cannot make those URLs yourself and you cannot share them.

Thus, a manual route has two options: repair the download, or copy the assets from a machine that already has them.

| Asset | Internal key |
| --- | --- |
| `PackagesLocalDirectory.zip` | `systemmetadata` |
| `Microsoft.Dynamics.FinOps.ToolsVS2022.vsix` | `finopsvsix22` |
| `TraceParser.msi` | `traceparser` |
| `DYNAMICSXREFDB.bak` | `crossreference` |

The SAS never goes into the log, and it expires. Nothing about it is public, static, or shareable. A teammate cannot send you a working link.

## Fix the download in Visual Studio

Do this task first, every time.

1. **Read the log before you change anything.** The dialog does not give useful data. The log shows the environment, the version, and the file that failed.

   ```powershell
   Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Dynamics365\Logs\Microsoft.PowerPlatformVSExtension_*.log" |
     Sort-Object LastWriteTime | Select-Object -Last 1 |
     Get-Content | Where-Object { $_ -notmatch "% of .* (downloaded|unzipped)" }
   ```

   - The first line shows the environment details that the extension found. Read `ApplicationVersion` and `FinOpsEnvType` there first.
   - A `downloading <file> Start` line without a matching `End` line is a failed transfer. Write down the file.
   - If all files failed, the cause is the account or the environment. Go to step 3. If one file failed and the other files completed, the cause is the network link. Go to step 4.

2. **Turn auto setup off** in **Tools > Options > Power Platform Tools**. The run then stops after the extraction. A setup failure can no longer look like a download failure, and the two problems do not hide each other. After the download, do the [manual setup steps](#run-the-manual-setup-steps).
3. **Make sure that the four preconditions are true.** Each one has a different signature in the log.
   - The developer account has the System Administrator role in the environment. If it does not, the log records `You do not have the System Administrator role in the Dataverse Instance you are connected to`.
   - The environment is a UDE. `FinOpsEnvType` must be `OnlineDev`. A USE, a trial, or a Power Platform Developer environment does not offer a download.
   - SQL Server Express LocalDB runs with Windows authentication. If it does not, the extension stops the setup and shows a link to the Microsoft troubleshooting section.
   - The system drive has 40 GB or more free. You need space for the zip and its extraction at the same time.
4. **Remove the network problems, then try again.** Do these steps in this order:
   1. Delete the partial file first. The extension never resumes a download, and a partial file makes the full retry fail.

      ```powershell
      $ver = "10.0.xxxx.yy"
      Remove-Item "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver\PackagesLocalDirectory.zip" -ErrorAction SilentlyContinue
      ```

   2. Disconnect from the VPN and use a wired connection. Proxies, VPNs, and endpoint protection are the usual causes of a stalled or incomplete transfer.
   3. During the download, exclude `%LOCALAPPDATA%\Microsoft\Dynamics365` from real-time antivirus scans. A scan of an extraction of half a million files is a frequent cause of a stall.
   4. Start a new download with **Tools > Download Dynamics 365 FinOps assets**. Do not use `Connect to Dataverse`, because it skips the download when the files already exist.
5. **Wait, and watch the correct data.** In the reference run, `DYNAMICSXREFDB.bak` took 45 minutes on a normal link, and the zip is larger. Slow is not stalled.

   ```powershell
   Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Dynamics365\Logs\Microsoft.PowerPlatformVSExtension_*.log" |
     Sort-Object LastWriteTime | Select-Object -Last 1 |
     Get-Content -Wait -Tail 5
   ```

   If the percentage does not change for ten minutes, the download is stalled. If the percentage increases slowly, the download works.

If this task fails two times on the same file, stop and go to the next task.

## Get PackagesLocalDirectory when only the zip fails

This is the most frequent failure, and the first task often does not fix it. The zip is the largest transfer by far, it has no resume, and the extension discards a partial file.

- Size on 10.0.2645.111: the extracted `PackagesLocalDirectory` is 18.5 GB, with 519,441 files in 176 module folders. The zip is one continuous stream of approximately that size.
- The other three assets usually succeed because they are much smaller. If only this file fails, the cause is the network link, not a permission or the environment. Do not look for a role or license cause.
- There is no URL to give to you. Do not look for one.

Use one of these three methods. The first method is the best.

### Get the extracted folder from a teammate as an archive

Do not use robocopy to copy 519,441 loose files over SMB. The overhead for each file is too large and the copy takes hours. Make an archive first.

1. On the source machine, make a split archive. If a transfer stops, you lose only one part.

   ```powershell
   $ver = "10.0.xxxx.yy"
   $src = "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver\PackagesLocalDirectory"
   & "C:\Program Files\7-Zip\7z.exe" a -tzip -mx=1 -v2g "D:\transfer\PLD_$ver.zip" "$src"
   ```

   - `-mx=1` keeps the compression fast. The content is mostly XML and compresses well at level 1.
   - `-v2g` writes volumes of 2 GB: `PLD_<ver>.zip.001`, `.002`, and so on.

2. On the target machine, extract to the exact path that the extension expects:

   ```powershell
   & "C:\Program Files\7-Zip\7z.exe" x "D:\transfer\PLD_$ver.zip.001" -o"$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver"
   ```

3. Compare the file count and the byte count on both machines:

   ```powershell
   robocopy "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver\PackagesLocalDirectory" NULL `
     /L /E /BYTES /NJH /NFL /NDL /R:0 /W:0 | Select-String "Files :|Bytes :"
   ```

   **Result:** Both numbers agree exactly with the source. Robocopy returns exit code 1 for a listing run. That is success, not an error.

A physical disk is better than the network. 18.5 GB over USB 3 takes minutes.

### Get the metadata from NuGet packages

- The extension can make a `PackagesLocalDirectory` from the X++ NuGet packages instead of the zip. Refer to [Build PackagesLocalDirectory from NuGet packages](#build-packageslocaldirectory-from-nuget-packages).
- Use this method when the link cannot hold one long stream. It downloads more than one package, so a failure costs only one package.
- It still needs the DevTools service. It does not help with an account or environment problem.

### Get the folder from the VHD (last resort)

1. The extension can download the developer VHD. `PackagesLocalDirectory` is in it at `C:\AOSService\PackagesLocalDirectory`.
2. The menu item is hidden by default. Go to **Tools > Options > Power Platform Tools** and enable `Enable Download Dynamics 365 FinOps VHD`.
3. Select **Tools > Download Dynamics 365 FinOps VHD**. The VHD downloads as numbered blob parts, so a lost connection costs one part. The log shows `Starting <part> (<n>/<total>)` and `Failed <part>. (<n>/<total>) Reason: <reason>`.
4. Mount the VHD with `Mount-DiskImage`, then copy `PackagesLocalDirectory` out of it.

The VHD is much larger than the 18.5 GB that you need. Use this method only when nothing else is available.

## Copy all four assets from a working machine

The assets are specific to the F&O application version, not to a machine or a user. All developers on the same application version can share them.

1. Make sure that both sides have the same version:
   - Source machine: the folder name under `%LOCALAPPDATA%\Microsoft\Dynamics365\`.
   - Target environment: in the F&O client, the gear icon > **About**, `Application build`.

   > **WARNING:** A version mismatch is worse than no metadata. Do not copy across versions.

2. Copy the full version folder, with the extracted `PackagesLocalDirectory`:

   ```powershell
   $ver = "10.0.xxxx.yy"
   robocopy "\\<source-machine>\c$\Users\<source-user>\AppData\Local\Microsoft\Dynamics365\$ver" `
            "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver" /E /Z /MT:16 /R:3 /W:5 /NFL /NDL
   ```

   - Plan for 30 GB or more on the system drive. The extracted metadata is 18.5 GB and the cross-reference backup is 7.5 GB. An external disk is better than the network.
   - Robocopy is good for `DYNAMICSXREFDB.bak`, the vsix, and the msi. It is bad for `PackagesLocalDirectory`, which has more than half a million small files. Make an archive of that folder instead, as in [Get the extracted folder from a teammate as an archive](#get-the-extracted-folder-from-a-teammate-as-an-archive).
   - You can skip `DYNAMICSXREFDB.bak` if the teammate copies a restored `.mdf` and `.ldf` pair. The cross-reference database is used only for Go to definition and Find references.

3. Do the [manual setup steps](#run-the-manual-setup-steps).

## What LCS and PPAC can give you

### Power Platform admin center

PPAC gives nothing. It provisions and manages environments, but it has no developer asset download. Visual Studio is the only documented route to the four assets. The LCS asset library has no PPAC equivalent (refer to [What changes for an LCS-era team](doc:d365-fo-unified-developer-experience#what-changes-for-an-lcs-era-team)).

### LCS Shared asset library

The LCS Shared asset library has two useful asset types, but not the zip.

- Sign in at [Shared Asset Library](https://lcs.dynamics.com/V2/SharedAssetLibrary). All LCS users can read it. The downloads run in the browser, so they do not use the DevTools service or a SAS that your account cannot make.
- `PackagesLocalDirectory.zip` is not an asset type there. Microsoft does not publish it.
- **NuGet packages:** the five X++ packages, with names of the form `PUXX/10.X.XX - <role>`:

  | Package | LCS name |
  | --- | --- |
  | `Microsoft.Dynamics.AX.Platform.CompilerPackage` | `Compiler Tools` |
  | `Microsoft.Dynamics.AX.Platform.DevALM.BuildXpp` | `Platform Build Reference` |
  | `Microsoft.Dynamics.AX.Application1.DevALM.BuildXpp` | `Application 1 Build Reference` |
  | `Microsoft.Dynamics.AX.Application2.DevALM.BuildXpp` | `Application 2 Build Reference` |
  | `Microsoft.Dynamics.AX.ApplicationSuite.DevALM.BuildXpp` | `Application Suite Build Reference` |

  - LCS shows six packages for each release. The combined `application build reference` is the same as Application 1 and Application 2 together. Use the split pair, because the files are smaller.
  - Microsoft rule: download a version that is equal to or later than your environment version. For the effect of a mismatch, refer to [Verify the downloaded version](doc:d365-fo-unified-developer-experience#verify-the-downloaded-version).
  - These packages hold compiled X++ for builds. They are the same packages that the extension connects into a metadata folder, so they are sufficient for compilation. Before you use them as a full replacement for the zip, make sure that Application Explorer works as your team needs.
- **Downloadable VHD:** the one-box developer VM, with `PackagesLocalDirectory` in it.
  - It comes in numbered parts. Download all parts into one folder, then run the executable to extract the VHD.
  - It has the same problem as the VHD method above: many more bytes than the 18.5 GB that you need. Use it only when nothing else works.

> **NOTE:** Microsoft deprecates LCS features under One Dynamics One Platform. Use LCS as a fallback, not as a plan.

## Run the manual setup steps

These are the steps that auto setup does. Do all of them, in this order. `$ver` is the name of the application version folder.

1. **Unblock the files.** Windows marks files from another machine, and the vsix installer and the compiler reject blocked files.

   ```powershell
   Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver" -Recurse | Unblock-File
   ```

2. **Extract `PackagesLocalDirectory.zip`**, if you still have the zip.
   - Extract it next to the zip, into a folder with the exact name `PackagesLocalDirectory`.
   - `Expand-Archive` is slow on this file. Use 7-Zip: `7z x PackagesLocalDirectory.zip -o"<path>\PackagesLocalDirectory"`.
   - Delete the zip after the extraction. The extension does the same.
3. **Install the F&O Visual Studio extension.** Close Visual Studio first.
   - Run `Microsoft.Dynamics.FinOps.ToolsVS2022.vsix` and select Visual Studio 2022.
   - Or use the command line:

     ```powershell
     $vsix = "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver\Microsoft.Dynamics.FinOps.ToolsVS2022.vsix"
     & "C:\Program Files (x86)\Microsoft Visual Studio\Installer\resources\app\ServiceHub\Services\Microsoft.VisualStudio.Setup.Service\VSIXInstaller.exe" /quiet /admin $vsix
     ```

   - On the next Visual Studio start, accept the elevation prompt. It registers the URL protocol handler, sets the build targets, and extracts the compiler files.
4. **Restore the cross-reference database.**
   1. Start LocalDB and read the logical names in the backup. Do not guess them. Confirm them for your version.

      ```powershell
      SqlLocalDB start MSSQLLocalDB
      $bak = "$env:LOCALAPPDATA\Microsoft\Dynamics365\$ver\DYNAMICSXREFDB.bak"
      sqlcmd -S "(localdb)\MSSQLLocalDB" -E -Q "RESTORE FILELISTONLY FROM DISK = N'$bak'"
      ```

      On 10.0.2645.111, the names are `DYNAMICSXREFDB` and `DYNAMICSXREFDB_log`.

   2. Restore the database. The physical paths in the backup point to a Microsoft build machine, so `MOVE` is necessary.

      ```powershell
      $dir = "$env:LOCALAPPDATA\Microsoft\Dynamics365\XRefDB"
      New-Item -ItemType Directory -Force $dir | Out-Null
      $sql = @"
      RESTORE DATABASE [DYNAMICSXREFDB1] FROM DISK = N'$bak'
      WITH MOVE N'DYNAMICSXREFDB'     TO N'$dir\DYNAMICSXREFDB1.mdf',
           MOVE N'DYNAMICSXREFDB_log' TO N'$dir\DYNAMICSXREFDB1_log.ldf',
           REPLACE, STATS = 5;
      "@
      sqlcmd -S "(localdb)\MSSQLLocalDB" -E -b -Q $sql
      ```

   3. Verify the restore with `sqlcmd -S "(localdb)\MSSQLLocalDB" -E -Q "SELECT name, state_desc FROM sys.databases WHERE name = 'DYNAMICSXREFDB1'"`.

      **Result:** The state is `ONLINE`.

   - You can select the database name. It must agree with `Cross reference database name` in the metadata configuration.
   - The data file restores to approximately 7.9 GB and the log to 200 MB. LocalDB is a SQL Server Express instance with a limit of 10 GB for each database. Thus, the database fits, but with little space left. If the restore fails because of the size, use a full SQL Server instance.
   - If the drive does not have sufficient space, the extension shows `Cross reference database restore failed! : Please ensure above <n> GB of available free disk space on the system drive`.
5. **Create the metadata configuration.** For all fields, refer to [Configure metadata](doc:d365-fo-unified-developer-experience#configure-metadata).
   - `Folders for reference metadata`: the extracted `PackagesLocalDirectory`.
   - `Cross reference database server` and `Cross reference database name`: the instance and the database that you restored.
   - Restart Visual Studio, then open **View > Application Explorer** to confirm.

`TraceParser.msi` is optional. Install it only for performance traces. You do not need it to build, deploy, or debug.

## Build PackagesLocalDirectory from NuGet packages

The X++ first-party reference metadata also comes as NuGet packages. The extension can install them and show them as a `PackagesLocalDirectory`.

The five packages:

- `Microsoft.Dynamics.AX.Platform.CompilerPackage`
- `Microsoft.Dynamics.AX.Platform.DevALM.BuildXpp`
- `Microsoft.Dynamics.AX.ApplicationSuite.DevALM.BuildXpp`
- `Microsoft.Dynamics.AX.Application1.DevALM.BuildXpp`
- `Microsoft.Dynamics.AX.Application2.DevALM.BuildXpp`

To run it:

1. Go to **Tools > Options > Power Platform Tools > General** and enable `Download Dynamics 365 FnO NuGets for CI/CD`.
2. Select **Tools > Download Dynamics365 FnO NuGets for CI/CD**. Select the application release, optionally select specific packages, and set the download location.

The same packages have a CI/CD role. Refer to [CI/CD with Azure DevOps](doc:d365-fo-unified-developer-experience#cicd-with-azure-devops).

The extension does these operations, in log order:

1. `Info: End restoring nuget packages for metadata in Unified environment`.
2. `Info: End creating junctions from nuget packages for metadata in Unified environment`.
3. It runs `mklink /J` for each module. This connects the `Metadata` folder of each package into a folder tree with the shape of `PackagesLocalDirectory`. The compiler and Application Explorer then read it as normal reference metadata.

This method helps when the zip fails because it uses several medium downloads instead of one 18 GB stream. A failure costs one package, and you run that package again alone.

Limits:

- It still calls the DevTools service for the package SAS URLs. It is not an offline route and it does not fix an account or environment problem.
- It supplies only reference metadata. You still need the vsix and the cross-reference database from the other three assets, or from a teammate.
- The junction tree is not a normal folder copy. Do not make an archive of it for someone else. Give them the real `PackagesLocalDirectory`.

If your team already pushes these packages to an Azure Artifacts feed for CI/CD, get them from there. That path does not use the DevTools service.

## Related links

- [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience)
- [LCS Shared asset library](https://lcs.dynamics.com/V2/SharedAssetLibrary)
- [Install and configure development tools](https://learn.microsoft.com/en-us/power-platform/developer/unified-experience/finance-operations-install-config-tools)
- [Deploy and access development environments (downloadable VHD)](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-tools/access-instances)
- [D365 F&O development processes](doc:d365-fo-development-processes)
