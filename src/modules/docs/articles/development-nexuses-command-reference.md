---
title: Development nexuses: command reference
summary: Commands and settings for Visual Studio Code, Windows, macOS, FFmpeg, Podman, cURL, Node.js, MySQL, Git, and Azure Application Insights.
category: Reference
order: 40
---

# Development nexuses: command reference

This article is a reference of commands and settings for daily development work on Windows and macOS. Use it to find a command quickly. For PowerShell scripts, refer to [Development nexuses: PowerShell scripts](doc:development-nexuses-powershell).

## Microsoft Edge and Tor Browser

### Start Microsoft Edge in guest or InPrivate mode

| Shell | Command |
| --- | --- |
| CMD | `start msedge.exe www.stackoverflow.com -guest` |
| PowerShell | `Start-Process msedge.exe -ArgumentList "-guest"` |
| CMD | `start msedge.exe www.stackoverflow.com -inprivate` |
| PowerShell | `Start-Process msedge.exe -ArgumentList "-inprivate"` |

To start guest mode from the Run dialog, do these steps:

1. Press `Win + R` to open the Run dialog.
2. Type this command and press Enter:

   ```cmd
   msedge.exe --guest
   ```

### Set a country in Tor Browser

1. Open the `torrc` file: `C:\Users\User\Downloads\Tor Browser\Browser\TorBrowser\Data\Tor\torrc`.
2. Add these lines. Replace `us` with the country code that you want. Put each option on its own line.

   ```text
   EntryNodes {us}
   ExitNodes {us}
   StrictNodes 1
   ```

## Visual Studio Code

### Explorer and preview settings

Add these settings to `settings.json` to stop files from opening in preview mode or opening automatically.

| Setting | Value | Effect |
| --- | --- | --- |
| `explorer.autoReveal` | `false` | Stops the Explorer view from expanding folders to show the active file. |
| `workbench.editor.enablePreview` | `false` | Turns off preview mode. A single click opens a file permanently. |
| `workbench.list.openMode` | `doubleClick` | A double-click opens files in lists such as the Explorer. |
| `explorer.autoOpenDroppedFile` | `false` | Stops files that you drag, drop, or paste into the Explorer from opening. |
| `workbench.editor.enablePreviewFromQuickOpen` | `false` | Files from Quick Open do not open in preview mode. |

### Preview Markdown

1. Open the Command Palette (`Ctrl/Cmd + Shift + P`).
2. Type one of these commands:
   - To the side: `Markdown: Open Preview to the Side`
   - Full tab: `Markdown: Open Preview`

### Show the Open Editors panel

Use one of these methods:

- From the View menu:
  1. Select **View** > **Open View...**.
  2. Select **Open Editors**.
- From the Explorer sidebar:
  1. Open the **Explorer** panel.
  2. Select the **three-dot menu** (⋮) in the top-right corner of the panel.
  3. Make sure that **Open Editors** has a check mark.
- From the settings:
  1. Open **Settings** (`Ctrl+,` or `Cmd+,`).
  2. Search for `explorer.openEditors.visible`.
  3. Set the value to a number greater than `0`.

If you moved or hid the panel by accident, right-click the Activity Bar. Look for the options to reset or move the panel.

### Change the text case

1. Select the text.
2. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on macOS) to open the **Command Palette**.
3. Type `Transform to` and select one of these commands:
   - `Transform to Uppercase`
   - `Transform to Lowercase`
   - `Transform to Titlecase`

The Command Palette also has `Toggle Render Whitespace`.

### Find and replace with regular expressions

Turn on **Use Regular Expressions** (the `.*` button) in the Find and Replace box before you use these patterns.

To replace `MyClass.<property>` with `await new MyClass().<property>()`, use these patterns:

- Find:

  ```text
  \bMyClass\.(\w+)\b
  ```

- Replace:

  ```text
  await new MyClass().$1()
  ```

In the find pattern, `\b` sets word boundaries, so the pattern does not match part of a word. `MyClass\.` matches the literal `MyClass.`. `(\w+)` is a capture group for the property name (for example `PropOne` or `PropTwo`). In the replacement, `$1` is the captured property name, and `()` makes it a method call.

To change `MyClass.Property.ChildProperty` to `(await new MyClass().Property()).ChildProperty`, capture both parts of the property chain:

- Find:

  ```text
  \bMyClass\.(\w+)\.(\w+)\b
  ```

- Replace:

  ```text
  (await new MyClass().$1()).$2
  ```

To find `(await new MyClass().Property())` or `(await new MyClass().Property()).ChildProperty`, use these patterns:

```text
\(await\s+new\s+MyClass\(\)\.\w+\(\)\)
\(await\s+new\s+MyClass\(\)\.\w+\(\)\)\.\w+
```

To add a comma at the end of each line, use these patterns:

- Find: `(.+)$`
- Replace: `$1,`

To search across more than one line:

- Press `Shift+Enter` in the Search panel to type a multiline search.
- Use `(.*\n)+` to match one or more lines, with or without content. For example, `<html>(.*\n)+</html>` matches a full document.

To replace all newlines with spaces, do these steps:

1. Press `Ctrl + H` to open Find and Replace.
2. In **Find what**, type `\n`. To remove empty lines, type `^(?:[\t]*(?:\r?\n|\r))+`.
3. In **Replace with**, type one space.
4. Turn on **Use Regular Expressions** (the `.*` button).
5. Select **Replace All**.

To remove comments in Visual Studio, do these steps:

1. Open the code file.
2. Select the lines that contain the comments.
3. Press `Ctrl + H` to open Find and Replace.
4. In **Find what**, type the comment syntax for your language (for example `//` for single-line comments in C#, or `/* ... */` for block comments).
5. Keep **Replace with** empty.
6. Select **Replace All**.

To remove single-line C# comments more precisely, use the regular expression `//.*$` in **Find what**.

### Make a read-only proxy folder

This procedure shows a folder from `Documents` in `Downloads` through a symbolic link. VS Code shows the files as read-only.

On Windows:

1. Create the real folder `C:\Users\<YourUser>\Documents\Folder-X`.
2. If `C:\Users\<YourUser>\Downloads\Folder-X` exists, delete it.
3. Open **Command Prompt**. Use an administrator Command Prompt if possible.
4. Create the symbolic link:

   ```cmd
   mklink /D "C:\Users\<YourUser>\Downloads\Folder-X" "C:\Users\<YourUser>\Documents\Folder-X"
   ```

5. Open the `Downloads` folder in VS Code.
6. Add this setting to the VS Code `settings.json` file:

   ```json
   "files.readonlyInclude": {
   "**/Folder-X/**": true
   }
   ```

On macOS:

1. Create the real folder `~/Documents/Folder-X`.
2. If `~/Downloads/Folder-X` exists, delete it.
3. Open **Terminal**.
4. Create the symbolic link:

   ```bash
   ln -s ~/Documents/Folder-X ~/Downloads/Folder-X
   ```

5. Open the `Downloads` folder in VS Code.
6. Add the same `files.readonlyInclude` setting to `settings.json`.

**Result:**

- `Folder-X` shows in `Downloads` as a normal folder.
- The files stay in `Documents/Folder-X`.
- Changes to the real files show immediately through the symbolic link.
- VS Code opens the linked folder normally.
- VS Code makes the files that match `**/Folder-X/**` read-only.

## Windows

### Windows commands

| Task | Command or path |
| --- | --- |
| Open the temp folder | `%temp%` |
| Make a battery health report | `powercfg /batteryreport` |
| Open the system environment variables | `Windows + R` > `SystemPropertiesAdvanced` > **Environment Variables** |
| Stop the Azure DevOps agent | In Task Manager, end `Agent.Listener.exe` or `AzAgent.Listener.exe`, and `AgentService.exe` or `AzAgentService.exe`. |

### Turn on long paths

On Windows Pro or Enterprise, use Group Policy:

1. Press `Win + R`, type `gpedit.msc`, and press Enter.
2. Go to **Computer Configuration** > **Administrative Templates** > **System** > **Filesystem**.
3. Open **Enable Win32 long paths**.
4. Select **Enabled** > **Apply** > **OK**.
5. Restart the computer, or restart the application.

For Git, refer to [Git](#git).

### Install portable 7-Zip without UAC

1. Go to the [7-Zip download page](https://www.7-zip.org/download.html).
2. Download **7-Zip Extra: standalone console version, 7z DLL, Plugin for Far Manager** (`.7z`). The `-extra.7z` file on the official GitHub releases page is the same package.
3. Extract the archive to a folder that you own, for example `%USERPROFILE%\7zip\`.
4. Optional: add the folder to the user `Path`:
   1. Press `Win + R`, type `sysdm.cpl`, and select **Advanced** > **Environment Variables**.
   2. In **User variables**, edit **Path**. Select **New** and enter the folder that contains `7za.exe` (`%USERPROFILE%\7zip`).
5. Open a new Command Prompt or PowerShell window and run this command:

   ```cmd
   7za --help
   ```

   **Result:** The version string shows.

To compress a folder:

```cmd
7za a archive.7z C:\path\to\folder\*
```

To extract an archive:

```cmd
7za x archive.7z -oC:\path\to\output
```

### Use less RAM

Download [RAMMap](https://learn.microsoft.com/en-us/sysinternals/downloads/rammap?utm_source=chatgpt.com) and run it as administrator. On the **Empty** menu, use these commands:

| Command | Effect |
| --- | --- |
| Empty Standby List | Clears cached RAM. This is safe and the most useful. |
| Empty Working Sets | Frees unused app memory. |
| Empty Priority 0 Standby List | Optional deeper clean. |

Use RAMMap when RAM usage continues to increase (for example during games or heavy browsing). Do not use it too frequently, because Windows manages memory automatically.

To check RAM usage, run these commands in PowerShell as administrator:

```powershell
# Overall memory stats
Get-CimInstance Win32_OperatingSystem | Select @{N='TotalRAM(GB)';E={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{N='FreeRAM(GB)';E={[math]::Round($_.FreePhysicalMemory/1MB,2)}}, @{N='UsedRAM(GB)';E={[math]::Round(($_.TotalVisibleMemorySize - $_.FreePhysicalMemory)/1MB,2)}}

# Top 10 processes by RAM
Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 Name, @{N='RAM(MB)';E={[math]::Round($_.WorkingSet64/1MB,2)}}
```

To clear RAM with the RAMMap command line, run these commands as administrator:

```powershell
# Empty Standby List: clears cached RAM (safe, most useful)
RAMMap64.exe -Es

# Empty Working Sets: frees unused app memory
RAMMap64.exe -Ew

# Empty Priority 0 Standby List: optional deeper clean
RAMMap64.exe -E0
```

> **NOTE:** `RAMMap64.exe` must be in your `PATH`. If not, use the full path (for example `C:\Tools\RAMMap64.exe -Es`).

Windows settings:

- Turn off startup apps that you do not need, such as launchers, updaters, and chat apps (**Settings** > **Apps** > **Startup**).
- Stop background load: turn off Widgets, turn off Copilot (if present), and turn off Xbox Game Bar (if you do not use it).
- Search for **Adjust the appearance and performance of Windows** and set it to **Best performance**.

Microsoft Edge settings (**System and performance**):

- Turn on Sleeping Tabs (2-5 min).
- Turn on Efficiency Mode.
- Turn off Startup Boost.
- Use few extensions (only an ad blocker and a password manager).
- Do not keep many tabs open.

The best overall setup is a clean startup list, Edge sleeping tabs with efficiency mode, a RAMMap standby list clear from time to time, few extensions, and few tabs.

## macOS

| Task | Command or path |
| --- | --- |
| Clear user-level caches | `rm -rf ~/Library/Caches/*` |
| Show all machines on the local network | `arp -a` |
| Add the Android SDK platform-tools to the path | `export PATH=$PATH:~/Library/Android/sdk/platform-tools` |
| Folder for podcast episodes from the Apple Podcasts app (hidden) | `~/Library/Group Containers/243LU875E5.groups.com.apple.podcasts/Library/Cache` |

### Remove the quarantine attribute and unzip

macOS adds a quarantine attribute to files that you download from the internet. This attribute can stop scripts or apps inside a zip file from running after you unzip it. This command removes the attribute and unzips the file in one step:

```bash
xattr -d com.apple.quarantine file.zip && unzip file.zip
```

## Media conversion with FFmpeg

To convert MP4 to AVI:

```bash
ffmpeg -i input.mp4 output.avi
```

To convert all WAV files in a folder to MP3:

```bash
for i in *.wav; do ffmpeg -i "$i" -f mp3 "${i%.*}.mp3"; done
```

To convert MP4 to GIF, make a palette first and then use it:

```bash
ffmpeg -i input.mp4 -vf "fps=10,scale=1920:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i input.mp4 -i palette.png -filter_complex "fps=10,scale=1920:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif
```

## Podman

```bash
# Start service
podman machine start
# Start all projects
podman compose -f compose.dev.yml up
# Start specific project
podman compose -f compose.dev.yml up <project-name>
# Remove container for specific project
podman compose -f compose.dev.yml down <project-name>
# Build container for specific project
podman compose -f compose.dev.yml build <project-name> --no-cache
# Stop service
podman machine stop
```

## Text and location tools

### Convert text to Base64 in CMD

```cmd
@echo off
setlocal enabledelayedexpansion

set "text=<text>"
echo !text! | openssl base64
```

### Caesar cipher in PowerShell

Press `Windows + R`, type `PowerShell`, and run one of these commands. The shift is 3.

```powershell
# Encode:
$text="Hello World"; $shift=3; -join ($text.ToCharArray() | % { if ($_ -match '[A-Za-z]') { $b=if([char]::IsUpper($_)){65}else{97}; [char](($b + ([int]$_-$b+$shift)%26)) } else { $_ } })

# Decode:
$text="Khoor Zruog"; $shift=3; -join ($text.ToCharArray() | % { if ($_ -match '[A-Za-z]') { $b=if([char]::IsUpper($_)){65}else{97}; [char]($b + ((([int]$_-$b-$shift)%26+26)%26)) } else { $_ } })
```

### OpenStreetMap API

To get an address from coordinates:

```bash
curl "https://nominatim.openstreetmap.org/reverse?lat=-25.754511453940673&lon=28.181179918201046&format=json"
```

To get coordinates from an address:

```bash
curl "https://nominatim.openstreetmap.org/search?q=Herman+Road,+Germiston,+South+Africa&format=jsonv2"
```

## cURL REST API requests

These examples send GET, POST, PUT, PATCH, and DELETE requests. They also get an Azure token, send data to Azure Monitor, and upload a file.

```bash
curl -i -X GET "http://localhost:3000/" -H "accept: */*" -H "Content-Type: application/json"

curl -i -X GET "http://localhost:3000/{id}" -H "accept: */*" -H "Content-Type: application/json"

curl -i -X GET "http://localhost:3000/{id}" -H "accept: */*" -H "Authorization: Bearer eyJhbGciOiJ...."  -H "Content-Type: application/json"

curl -i -X POST "http://localhost:3000/" -H "accept: */*" -H "Content-Type: application/json" -d "{\"author\":\"Test Author\",\"books\":[{\"title\":\"Test Title\",\"year\":2007}]}"

curl -i -X POST "https://repository-manager-server.netlify.app/api/nexuses/" -H "accept: */*" -H "Content-Type: application/json" -d "{\"nexus\":\"Material Components Web - Codelabs Master - MDC-101 Starter\",\"raw_nexus\":\"https://codelabs.developers.google.com/codelabs/mdc-101-web/#1\"}"

curl -i -X POST "https://repository-manager-server.netlify.app/api/nexuses/" -H "accept: */*" -H "Content-Type: application/json" -d "{\"nexus\":\"MDC Web on other frameworks\",\"raw_nexus\":\"https://m2.material.io/develop/web/guides/framework-wrappers\"}"

curl -i -X POST "https://repository-manager-server.netlify.app/api/nexuses/" -H "accept: */*" -H "Content-Type: application/json" -d "{\"nexus\":\"Material Web Components for Angular\",\"raw_nexus\":\"https://trimox.github.io/angular-mdc-web/#/angular-mdc-web/home\"}"

curl -i -X PUT "http://localhost:3000/{id}" -H "accept: */*" -H "Content-Type: application/json" -d "{\"author\":\"Sample Author\",\"books\":[{\"title\":\"Sample Title\",\"year\":2008}]}"

curl -i -X PATCH "http://localhost:3000/{id}" -H "accept: */*" -H "Content-Type: application/json" -d "{\"author\":\"Sample Author\",\"books\":[{\"title\":\"Sample Title\",\"year\":2008}]}"

curl -i -X DELETE "http://localhost:3000/{id}" -H "accept: */*" -H "Content-Type: application/json"

curl -i -X POST "https://login.microsoftonline.com/{tenantid}/oauth2/token" -F "grant_type=client_credentials" -F "client_id={clientid}" -F "client_secret={clientsecret}" -F "resource=https://monitoring.azure.com/"

curl -i -X POST "https://{region}.monitoring.azure.com/{resourceid}" -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJ...." -d @file.json

curl -i -X POST "http://localhost:3000/{id}" -H "accept: */*" -H "Authorization: Bearer eyJhbGciOiJ...." -F "data=@path/to/local/file"
```

## Node.js and npm

### Install Node.js from the portable ZIP without UAC

1. Go to the [Node.js download page](https://nodejs.org/en/download/).
2. Select **Windows Binary (.zip)** for the version that you want (for example `node-v24.19.0-win-x64.zip`).
3. Extract the file to a folder that you own, for example `%USERPROFILE%\nodejs\`.
4. Optional: to use `node` and `npm` everywhere for your account, add the folder to the user `Path`:
   1. Press `Win + R`, type `sysdm.cpl`, and select **Advanced** > **Environment Variables**.
   2. In **User variables**, edit **Path**. Select **New** and paste the folder that contains `node.exe` (`%USERPROFILE%\nodejs`).
5. Open a new Command Prompt or PowerShell window and run these commands:

   ```cmd
   node -v
   npm -v
   ```

   **Result:** The version numbers show.

### npm commands

| Task | Command | Example |
| --- | --- | --- |
| Install a package in `node_modules` | `npm install <package-name>` | `npm install express` |
| Install a package globally | `npm install -g <package-name>` | `npm install -g @angular/cli`, `npm install -g azure-functions-core-tools` |
| Remove a package | `npm uninstall <package-name>` | `npm uninstall express` |
| Remove a global package | `npm uninstall -g <package-name>` | |
| Update a package | `npm update <package-name>` | `npm update express` |
| Update all global packages | `npm update -g` | |
| List installed packages | `npm list` | |
| List global packages | `npm list -g` | |
| Find outdated packages | `npm outdated` | |
| Find outdated global packages | `npm outdated -g` | |
| Run a script from `package.json` | `npm run <script-name>` | `npm run start` |
| Publish a package to the npm registry | `npm publish` | |
| Create a `package.json` file | `npm init` | |
| Run the tests in `package.json` | `npm test` | |
| Increase the package version | `npm version` | |
| Get help on npm commands | `npm help` | |

## MySQL

These notes are for MySQL Community Server 9.5.0 Innovation on macOS ARM.

To use the commands without the full path, add the `bin` folder to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
# Open your .zshrc file in a text editor
open ~/.zshrc # This will open the file in your default text editor (usually TextEdit on macOS)
# Add the following lines at the bottom of the file
export PATH=/usr/local/mysql-9.5.0-macos15-arm64/bin:$PATH
# Save and close the file
# Apply the changes
source ~/.zshrc
```

| Command | Purpose | Example |
| --- | --- | --- |
| `mysql` | Starts the MySQL client (interactive shell). | `mysql -u root -p` |
| `mysqld` | Starts the MySQL server daemon manually. | `mysqld --defaults-file=/usr/local/mysql/my.cnf` |
| `mysqld_safe` | Starts the server with safety checks. | `mysqld_safe --user=mysql &` |
| `mysqladmin` | Does administrative tasks (shutdown, status, and more). | `mysqladmin -u root -p shutdown` |
| `mysqldump` | Exports databases or tables to an SQL dump. | `mysqldump -u root -p mydb > mydb.sql` |
| `mysqlimport` | Imports data from text files. | `mysqlimport -u root -p mydb data.txt` |
| `mysqlshow` | Shows databases or tables quickly. | `mysqlshow -u root -p` |
| `SHOW DATABASES;` | Shows databases quickly. | `mysql -u root -p -e "SHOW DATABASES;"` |
| `mysqlcheck` | Checks, repairs, or optimizes tables. | `mysqlcheck -u root -p --all-databases` |
| `exit;`, `quit;`, or `Ctrl + D` | Closes your session with the server. | Run it in the MySQL shell. |

### Start MySQL automatically on macOS

The official Oracle `.dmg` installer adds the MySQL Preference Pane. To start MySQL each time you log in, do these steps:

1. Open **System Settings**.
2. Scroll down the left sidebar and select **MySQL**.
3. Turn on the auto-start option.

To make sure that the Preference Pane is installed, run this command:

```bash
ls /Library/PreferencePanes | grep MySQL
```

**Result:** The output shows `MySQL.prefPane`.

## Git

These are common Git commands for daily work on macOS with Azure DevOps.

| Category | Command | Description |
| --- | --- | --- |
| Setup and authentication | `git clone <url>` | Downloads a repository to your Mac. |
| | `git config --global user.name "Name"` | Sets your commit name. |
| | `git config --global user.email "email"` | Sets your commit email. |
| | `git config --global --list` | Lists all global configuration values. |
| | `git config --global branch.<name>.mergeOptions "--no-commit"` | Stops automatic commits after a merge into branch `<name>`. Set it for each branch. |
| | `git remote -v` | Lists the remote URLs. Use it to check the authentication and origin. |
| | `git config --global core.longpaths true` | Turns on long paths. |
| Daily flow | `git status` | Shows changed files and the current branch. |
| | `git add .` | Stages all changes for the next commit. |
| | `git commit -m "message"` | Commits staged changes with a descriptive note. |
| | `git push origin <branch>` | Uploads local commits to Azure DevOps. |
| | `git pull` | Fetches and merges changes from the remote. |
| Branches | `git checkout -b <name>` | Creates a new branch and switches to it. |
| | `git switch <name>` | Switches to a branch that exists. |
| | `git branch -a` | Lists all local and remote branches. |
| Conflicts | `git merge <branch>` | Merges a different branch into your current branch. |
| | `git diff` | Shows the line changes that cause conflicts. |
| | `git merge --abort` | Cancels the merge. |
| Advanced | `git cherry-pick <commit-hash>` | Applies one commit from a different branch. |
| | `git stash` | Puts your changes away temporarily, so you can work on something else. |
| | `git stash pop` | Brings back your stashed changes. |
| | `git log --oneline` | Shows a short history of commits. |

> **NOTE:** Git has no `merge.options` or `merge.commit` setting, so Git ignores them. To stop the automatic commit for one merge, run `git merge --no-commit <branch>`.

### Create a pull request from the terminal

Most people complete pull requests in the Azure DevOps web UI. You can do the local part in the terminal:

1. Push your branch: `git push origin feature-branch`.
2. Install the Azure CLI (`brew install azure-cli`) and the DevOps extension.
3. Create the pull request: `az repos pr create --target-branch main`.

### Resolve merge conflicts in VS Code

VS Code shows files with conflicts in **red**.

1. Open the file in VS Code.
2. Select the **Merge Editor** button at the bottom right.
3. Accept the "Current", "Incoming", or "Both" changes.
4. Run `git add` and `git commit` to finish.

## Azure Application Insights

### Query the response time with KQL

To get the average response time in milliseconds for each day of the last 3 days:

```text
requests
| where timestamp >= ago(3d)
| summarize avgDurationMs = avg(duration) by bin(timestamp, 1d)
| project Day = format_datetime(bin(timestamp, 1d), 'yyyy-MM-dd'), avgDurationMs
```

To get the average response time in 1-minute intervals:

```text
requests
| where timestamp >= ago(3d)
| summarize avgDuration = avg(duration) by bin(timestamp, 1m)
| project Minute = format_datetime(bin(timestamp, 1m), 'yyyy-MM-dd HH:mm'), avgDuration
```

To get the maximum response time in milliseconds for each day:

```text
requests
| where timestamp >= ago(3d)
| summarize maxDurationMs = max(duration) by bin(timestamp, 1d)
| project Day = format_datetime(bin(timestamp, 1d), 'yyyy-MM-dd'), maxDurationMs
```

To run a query, do these steps:

1. Open the Azure portal.
2. Go to your Application Insights resource.
3. In the left menu, under **Monitoring**, select **Logs**.
4. Paste the KQL query into the query editor.
5. Select **Run**.

### Show the average response time with Metrics

1. Open the Azure portal and select your Application Insights resource.
2. Go to **Metrics**.
3. Set these values:
   - Metric namespace: **Log-based metrics**
   - Metric: **Server response time**
   - Aggregation: **Average**
   - Time range: the last 3 days
4. Optional: add filters for specific requests or operations.

**Result:** The chart shows the average response time for the period.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `adb` is not recognized on macOS. | The SDK platform-tools folder is not in the path. | Run `export PATH=$PATH:~/Library/Android/sdk/platform-tools`. |
| PowerShell does not run `npm` or `node` from the portable ZIP. | The PowerShell execution policy blocks the `.ps1` launcher. | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. When PowerShell asks, enter `Y`. |
| Git shows an authentication error on macOS after you change your password or PAT. | Git uses the Apple Keychain. | Run `git config --global credential.helper osxkeychain`. |

## Related links

- [How to start Microsoft Edge in InPrivate mode from the command line (Stack Overflow)](https://stackoverflow.com/questions/32308174/how-to-start-microsoft-edge-in-inprivate-mode-from-command-line)
- [Set a specific country in Tor Browser (wikiHow)](https://www.wikihow.com/Set-a-Specific-Country-in-a-Tor-Browser)
- [7-Zip download](https://www.7-zip.org/download.html)
- [Node.js download](https://nodejs.org/en/download/)
- [Development nexuses](doc:development-nexuses)
- [Development nexuses: PowerShell scripts](doc:development-nexuses-powershell)
- [Development nexuses: AI agent tools and prompts](doc:development-nexuses-ai-agent-tools)
