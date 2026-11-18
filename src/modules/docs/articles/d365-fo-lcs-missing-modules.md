---
title: Fix the LCS deploy error for missing modules
summary: Add compiled ISV and FormAdaptor modules to the repository and the build pipeline so that LCS accepts the deployable package.
category: Dynamics 365
order: 50
---

# Fix the LCS deploy error for missing modules

LCS deploys a package only if the package contains every module that is on the environment. This procedure adds compiled modules to the repository and copies them into the package in the build pipeline.

The procedure covers two types of missing modules:

- ISV modules, for example XPLUS. The vendor supplies compiled binaries, not source code.
- Microsoft FormAdaptor modules (`*FormAdaptor`). These are Microsoft test automation modules.

## Symptom and cause

The LCS deployment step in the release pipeline fails with this error:

```text
The selected package is missing the following modules that are currently deployed on your
environment. You must create an all-in-one deployable package ...
Missing module(s): ["<module1>"] ["<module2>"] ...
```

The environment has modules that the repository does not contain:

- The build packages only the modules in the binaries folder.
- ISV modules and FormAdaptor modules are not source code in the repository. Thus, the build does not package them.

## Identify the missing modules

1. Write down each module name in the error message. LCS shows the names in lowercase.
2. Put each module in one of these groups:
   - ISV module. The name agrees with the vendor product, for example `xplusg` or `xplsecuritybase`.
   - FormAdaptor module. The name ends with `formadaptor`, for example `retailformadaptor`.

> **NOTE:** The error can show only some of the missing modules. If the next release shows other module names, do all the tasks in this article again for those modules.

## Get the compiled modules

Use the same module versions that the environment has.

### ISV modules

1. Get the vendor deployable package for the version on the environment. Use the LCS asset library or ask the vendor.
2. Open `AOSService\Packages\files\` in the package. There is one `dynamicsax-<module>.<version>.zip` file for each module.
3. Extract each zip file into its own folder:

   ```powershell
   $src = '<vendor package folder>\AOSService\Packages\files'
   $dst = '<repo>\ISV\<Vendor>'
   Add-Type -AssemblyName System.IO.Compression.FileSystem

   foreach ($m in '<module1>','<module2>') {
       $file = Get-ChildItem $src -Filter "dynamicsax-$m.*.zip"
       $zip  = [IO.Compression.ZipFile]::OpenRead($file.FullName)
       $name = ($zip.Entries | Where-Object Name -match '^Dynamics\.AX\.[^.]+\.dll$' |
                Select-Object -First 1).Name -replace '^Dynamics\.AX\.|\.dll$'
       $zip.Dispose()
       [IO.Compression.ZipFile]::ExtractToDirectory($file.FullName, (Join-Path $dst $name))
   }
   ```

   - The script takes the module name from the DLL, not from the zip name. The zip name is in lowercase.
   - Use a short destination path. Long paths cause `Could not find a part of the path` errors.

As an alternative, install the vendor package on a development VM. Copy each module folder from `PackagesLocalDirectory\<Module>`. A folder that came from a package has only `bin\`, `Resources\`, `Reports\`, and `<Module>.xref`. This is correct.

### FormAdaptor modules

1. Use a development VM that has the same application version as the environment. LCS shows the version on the environment details page.
2. Copy only the `bin\` folder of each module:

   ```powershell
   $src = '<AOS drive>:\AOSService\PackagesLocalDirectory'
   $dst = '<repo>\ISV\FormAdaptor'

   foreach ($m in '<Module1>FormAdaptor','<Module2>FormAdaptor') {
       robocopy (Join-Path $src "$m\bin") (Join-Path $dst "$m\bin") /E /NFL /NDL /NJH /NJS /NP
   }
   ```

> **CAUTION:** Do not copy `Descriptor\`, `XppMetadata\`, or the source folder. If you copy them, the build can try to compile the module.

### Examine each module folder

1. Make sure that each folder contains `bin\Dynamics.AX.<Module>.dll`.
2. Record the DLL version:

   ```powershell
   Get-ChildItem '<repo>\ISV' -Directory | Get-ChildItem -Directory | ForEach-Object {
       $dll = Get-Item "$($_.FullName)\bin\Dynamics.AX.$($_.Name).dll" -ErrorAction SilentlyContinue
       [pscustomobject]@{ Module = $_.Name; Dll = [bool]$dll; Version = $dll.VersionInfo.FileVersion }
   } | Format-Table
   ```

## Add the modules to the repository

Keep the compiled modules apart from the source code. The build must not compile them. Use this folder layout:

```text
<repo>\
    ISV\
        .gitattributes
        <Vendor>\
            README.md
            <Module1>\bin\...
        FormAdaptor\
            <Module1>FormAdaptor\bin\...
```

1. If the repository ignores all files by default, add these two lines to `.gitignore`:

   ```text
   !ISV/
   !ISV/**
   ```

2. Add `* -text` to `ISV\.gitattributes`. Git then stores the vendor files without line-ending changes. Without this rule, `core.autocrlf` changes the `.xml`, `.runtime`, and `.xpp` files.
3. In `ISV\<Vendor>\README.md`, write the vendor name, the version of each module, the date, and the source package.
4. If the total size is more than approximately 100 MB, use Git LFS for `*.dll` and `*.netmodule`.
5. Stage only `.gitignore` and `ISV`, then examine the staged files:

   ```powershell
   git add .gitignore ISV
   git diff --cached --name-only -- . ':!ISV'          # expect: .gitignore only
   git ls-files --eol -- ISV | Select-String 'i/lf'    # expect: README.md only
   ```

6. Commit through a pull request to the branch that the build uses.

## Change the build pipeline

Add one Copy files step for each folder in `ISV\`. Put the steps before Create Deployable Package. That step packages each module folder in `$(Build.BinariesDirectory)`.

1. Add the ISV step:

   ```yaml
   - task: CopyFiles@2
     displayName: 'Copy <Vendor> modules to binaries folder'
     inputs:
       SourceFolder: '$(Build.SourcesDirectory)\ISV\<Vendor>'
       Contents: |
         **
         !README.md
       TargetFolder: '$(Build.BinariesDirectory)'
   ```

2. Add the FormAdaptor step:

   ```yaml
   - task: CopyFiles@2
     displayName: 'Copy FormAdaptor modules to binaries folder'
     inputs:
       SourceFolder: '$(Build.SourcesDirectory)\ISV\FormAdaptor'
       Contents: '**'
       TargetFolder: '$(Build.BinariesDirectory)'
   ```

3. Put the steps in this order:
   1. Build solution
   2. Copy `<Vendor>` modules to binaries folder
   3. Copy FormAdaptor modules to binaries folder
   4. Create Deployable Package
   5. Add Licenses to Deployable Package (if necessary)
   6. Publish Artifact
4. Optional: in Create Deployable Package, set `XppBinariesPath` to `$(Build.BinariesDirectory)` and `XppBinariesSearch` to `*`. These are the default values. Explicit values prevent a later change from removing the modules.

### License files

Examine the vendor package for `AOSService\Scripts\License\*.txt`. If there is a license file:

1. Put it in `ISV\<Vendor>\License\`.
2. Add `!License/**` to `Contents` in the ISV copy step. If you do not, the build packages `License` as a module.
3. Enable Add Licenses to Deployable Package. Set the license file search pattern and the deployable package path.

## Verify the package before the release

The build does not change the environment. Do this check before you release the package.

1. Run the build. Download and extract the package.
2. Make sure that `AOSService\Packages\files\` has one `dynamicsax-<module>.*.zip` file for each module that you identified.
3. Compare each module zip with its folder in the repository:

   ```powershell
   $repo = '<repo>\ISV'
   $pkg  = '<pipeline package folder>\AOSService\Packages\files'
   Add-Type -AssemblyName System.IO.Compression.FileSystem
   $sha = [Security.Cryptography.SHA256]::Create()

   Get-ChildItem $repo -Directory | Get-ChildItem -Directory | ForEach-Object {
       $dir  = $_.FullName
       $file = Get-ChildItem $pkg -Filter "dynamicsax-$($_.Name).*.zip"
       if (-not $file) { [pscustomobject]@{ Module = $_.Name; InPackage = $false }; return }
       $zip     = [IO.Compression.ZipFile]::OpenRead($file.FullName)
       $entries = @($zip.Entries | Where-Object Name)
       $changed = @($entries | Where-Object {
           $local = Join-Path $dir $_.FullName
           if (-not (Test-Path -LiteralPath $local)) { return $true }
           $s = $_.Open(); $h = [BitConverter]::ToString($sha.ComputeHash($s)) -replace '-'; $s.Dispose()
           $h -ne (Get-FileHash -LiteralPath $local -Algorithm SHA256).Hash
       })
       $zip.Dispose()
       [pscustomobject]@{
           Module       = $_.Name
           InPackage    = $true
           PackageFiles = $entries.Count
           RepoFiles    = (Get-ChildItem $dir -Recurse -File).Count
           Different    = $changed.Count
       }
   } | Format-Table
   ```

   **Result:** Each module shows `InPackage` = `True` and `Different` = `0`. `PackageFiles` and `RepoFiles` are the same.

4. Run the release.

If the release shows other missing modules, do all the tasks again for those modules.

## Maintenance

- **Do not remove the modules to make the package pass.** The environment has them. If you remove them from the package, LCS rejects each pipeline package again.
- **ISV upgrade:** Replace the module folders in `ISV\<Vendor>\`. Update the README. Verify the package before the release.
- **Application upgrade:** Get the FormAdaptor modules again from a development VM on the new application version.
- **Module removal:**
  - To remove a module from the environment, add `AOSService\Scripts\ModuleToRemove.txt` to the package. Put one module name on each line.
  - Refer to [Uninstall a package](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/deployment/uninstall-deployable-package).
  - LCS does not let you remove Microsoft modules.
  - Remove the module from the repository after the deployment.
- **Test without downtime:** LCS checks the module list before it stops the environment. A package with a missing module fails at the start, and the environment stays available.

## Related links

- [Uninstall a package](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/deployment/uninstall-deployable-package)
- [D365 F&O development processes](doc:d365-fo-development-processes)
