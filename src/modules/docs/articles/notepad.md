---
title: Notepad
summary: Personal notes on ADB, Galaxy Watch mirroring, Edge CORS, VS Code compare, RustDesk, Office and Visual Studio installs, SSMS, MySQL, and useful links.
category: Reference
order: 80
gist: 01e798cf3f28a1c0f3560ad5d0f9cf12
---

# Notepad

This article holds short personal notes and links. It covers ADB commands, Galaxy Watch screen mirroring, development tool settings, offline installers, and study links.

## ADB commands

Before you use ADB, put the Android device in developer mode. Refer to [Extract an APK with ADB](doc:android-extract-apk-adb).

### Connect and manage apps

1. Pair the device: `adb pair 255.255.0.0:0000`. Enter the pairing code.
2. Connect the device: `adb connect 255.255.0.0:0000`.
3. Run `adb devices` to list the devices. If more than one device shows, use `-s` to select one:

   ```bash
   adb devices
   List of devices attached
   adb connect 255.255.0.0:0000 device
   adb connect 255.255.0.0:0001 offline
   adb -s 255.255.0.0:0000 [Command] --user 0
   ```

| Task | Command | Example values |
| --- | --- | --- |
| Install an APK | `adb install [Package-Name].apk` | `WhatsApp.apk` |
| List packages | `adb shell cmd package list packages` | |
| Clear the data of a package | `adb shell pm clear [package-name]` | `com.samsung.android.app.contacts`, `com.samsung.android.providers.contacts`, `com.google.android.contacts` |
| Uninstall a package | `adb uninstall [Package-Name]` | `com.whatsapp` |
| Disconnect | `adb disconnect` | |
| Change the screen density | `adb shell wm density 100` | Connect first with `adb connect 255.255.0.0:0000`. |
| Reset the screen density | `adb shell wm density reset` | |
| Run a command on one device | `adb -s device_id command` | |

### Copy files

| Task | Command |
| --- | --- |
| Pull a full directory | `adb -s emulator-5554 pull /sdcard/Documents/ ~/Downloads/` |
| Pull a file | `adb -s emulator-5554 pull /sdcard/Documents/file.json ~/Downloads/` |
| Push a file | `adb -s emulator-5554 push ~/Downloads/file.json /sdcard/Documents/` |
| List a full directory | `adb -s emulator-5554 shell ls -l /sdcard/Documents exit` |

### Force the screen orientation in Windows Subsystem for Android

1. Turn off auto-rotate:

   ```bash
   adb shell settings put system accelerometer_rotation 0
   ```

2. Set the orientation with `user_rotation`:

   | Orientation | Command |
   | --- | --- |
   | Portrait (0°) | `adb shell settings put system user_rotation 0` |
   | Landscape (90°) | `adb shell settings put system user_rotation 1` |
   | Portrait reversed (180°) | `adb shell settings put system user_rotation 2` |
   | Landscape reversed (270°) | `adb shell settings put system user_rotation 3` |

## Mirror a Galaxy Watch 4 or 5 screen to a PC

Use ADB and scrcpy to show the watch screen on a Windows or Mac computer. Do the steps in this order.

### Install the Android SDK platform tools

1. Download the [platform tools for Windows](https://dl.google.com/android/repository/platform-tools-latest-windows.zip). For other systems, refer to the [platform tools release page](https://developer.android.com/tools/releases/platform-tools). These are the official ADB and Fastboot binaries from Google.
2. Extract the file to a location on your PC.

   **Result:** You have the `platform-tools` folder. The steps below use this folder.
3. Optional: put the Pixel Watch Faces APK for the Galaxy Watch 4 or 5 in the `platform-tools` folder.

### Turn on ADB debugging on the watch

1. Go to **Settings** > **About Watch** > **Software** and tap **Software Version** 7 times.
2. Go to **Developer Options** and turn on **ADB Debugging**.
3. Scroll down and turn on **Debug over WiFi**.
4. Write down the IP address that shows. Do not include the port number (the value after the colon). For example, if the value is `192.168.1.3:5555`, the IP address is `192.168.1.3`.

### Connect the watch to the PC

1. Open the `platform-tools` folder. Type `CMD` in the address bar and press Enter.

   **Result:** Command Prompt opens.
2. Run this command. Replace `IP` with the watch IP address.

   ```cmd
   adb connect IP
   ```

3. On the watch, tap **OK** or **Always Allow from this computer**.
4. Run `adb devices`.

   **Result:** The IP address and port show, followed by the word `device`. The connection is good.

### Mirror the watch with scrcpy

1. Download [scrcpy from GitHub](https://github.com/Genymobile/scrcpy/releases) and extract it in the `platform-tools` folder. If Windows asks to replace files, select **Skip these files**.
2. Open Command Prompt in the folder (type `CMD` in the address bar).
3. Run `adb devices`. If the device ID shows, continue.
4. Run `scrcpy`.

   **Result:** The watch screen shows on the PC. The PC shows each action that you do on the watch.

### Adjust scrcpy

| Task | Command |
| --- | --- |
| Decrease the stream resolution to increase performance (replace `1024` as necessary) | `scrcpy --max-size 1024` |
| Set the bit rate (the default is 8 Mbps) | `scrcpy --bit-rate 8M` |
| Limit the frame rate | `scrcpy --max-fps 15` |
| Record the screen while it mirrors | `scrcpy --record file.mp4` |

## Turn off the CORS policy in Microsoft Edge

> **WARNING:** The CORS policy is a security feature that prevents cross-site scripting attacks. Turn it off only for development or tests. Do not use this setting in production.

1. Open Microsoft Edge and type `edge://flags/#unsafely-treat-insecure-origin-as-secure` in the address bar.
2. Press Enter.

   **Result:** The Experimental Features page opens.
3. Find **Insecure origins treated as secure** and select **Enabled**.
4. Restart Microsoft Edge.

**Result:** Edge does not apply the CORS policy to requests to localhost.

## Use a Galaxy Watch 4 with an iPhone

In [this video](https://youtu.be/J2R7462ryiY), Jignesh Jain connects a Samsung Galaxy Watch 4 to an iPhone, although Samsung and Apple say that this is not possible.

- Reset the watch and turn on the hidden feature: press and hold the Galaxy Watch 4 app icon, then set the settings on the watch and on the iPhone.
- The watch connects to the iPhone through Bluetooth. The watch shows phone calls and messages.
- To sync data to the Samsung app, connect the watch to an Android phone and install the Samsung Health app. When the Android phone syncs with the watch, the data syncs over Wi-Fi. You can then see the data on the iPhone.

## Compare files in Visual Studio Code

### Compare two files from the Explorer

1. Open the Explorer pane.
2. Right-click the first file and select **Select for Compare**.
3. Right-click the second file and select **Compare with Selected**.

   **Result:** A new tab shows the two files side by side.

You can also select the two files in the Explorer pane, press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac), and type `Compare Selected`.

To compare full directories, install an extension such as **Compare Folders**.

### Compare open editors

1. Open the two files in separate tabs.
2. In the first file, press `Ctrl+Shift+P` (Windows, Linux) or `Cmd+Shift+P` (macOS) and run **Compare Active File With...**.
3. Select the second file.

   **Result:** A new tab shows the two files side by side and highlights the differences.

### Merge changes

1. Right-click the first file and select **Select for Compare**.
2. Select the second file to compare with the first file.

   **Result:** A new tab shows the two files with a third column in the center for the merged changes.
3. Accept or reject each line with the `+` or `-` buttons in the center column.

## Set up a RustDesk server on Windows 10

1. Download the server from the [RustDesk server releases](https://github.com/rustdesk/rustdesk-server/releases) and start the server executable: `C:\Program Files\RustDeskServer\rustdesk_server.exe`.
2. Get these values:
   - Public key for authentication: `C:\Program Files\RustDeskServer\bin\id_ed25519.pub` = `[KEY]`
   - IPv4 address of the Ethernet adapter (`ipconfig` > Ethernet adapter Ethernet > IPv4 Address) = `[IP]`
3. In Windows Defender Firewall with Advanced Security, add inbound rules for these programs:
   - `C:\Program Files\RustDeskServer\bin\hbbr.exe` (allow inbound connections to `%ProgramFiles%\RustDeskServer\bin\hbbr.exe`)
   - `C:\Program Files\RustDeskServer\bin\hbbs.exe` (allow inbound connections to `%ProgramFiles%\RustDeskServer\bin\hbbs.exe`)

   The setting is at **Inbound Rules** > **RustDeskServer** > **Properties** > **Programs and Services** > **This program**.
4. Start the RustDesk client on the server and on the client machines.
5. In each client, select **ID** > the three-dot button > **IP/Relay Server**, and set these values:
   - ID server: `[IP]`
   - Relay server: `[IP]`
   - Key: `[KEY]`
6. Connect to the target machine on the local network. Enter the RustDesk client ID and password of the target machine.

## Install Microsoft 365 Apps for Enterprise with ODT

Before you start, make sure that you have administrator rights. Close all other programs and save open documents.

1. Right-click the package and select **Extract All**.
2. Select `C:\ODT` as the destination folder and select **Extract**.
3. Open the `C:\ODT` folder and double-click `install.bat`.
4. Follow the prompts in the installation wizard.

## Install Visual Studio offline

To make an offline layout, do these steps:

1. In the folder that contains the installer, press Shift and right-click. Select **Open PowerShell window here**.
2. Type `start cmd` and press Enter.
3. Run one of these commands.

```cmd
VisualStudioSetup.exe --layout c:\localVSlayout --add Microsoft.VisualStudio.Workload.ManagedDesktop --add Microsoft.VisualStudio.Workload.NetWeb --add Microsoft.VisualStudio.Workload.NativeDesktop --add Microsoft.VisualStudio.ComponentGroup.VC.Tools.142.x86.x64 --includeOptional --lang en-US
```

```cmd
vs_enterprise.exe --layout c:\localVSlayout --add Microsoft.VisualStudio.Workload.ManagedDesktop --add Microsoft.VisualStudio.Workload.NetWeb --add Microsoft.VisualStudio.Workload.Node --add Microsoft.VisualStudio.Workload.Python --includeOptional --lang en-US
```

```cmd
VisualStudioSetup.exe --layout c:\localVSlayout --add Microsoft.VisualStudio.Workload.Node --add Microsoft.VisualStudio.Workload.Python --includeOptional --lang en-US
```

| Link | Use |
| --- | --- |
| [Create an offline installation (GitHub source)](https://github.com/MicrosoftDocs/visualstudio-docs/blob/main/docs/install/create-an-offline-installation-of-visual-studio.md) | Offline download guide. |
| [Create an offline installation of Visual Studio](https://docs.microsoft.com/en-us/visualstudio/install/create-an-offline-installation-of-visual-studio?view=vs-2022) | Offline download guide. |
| [Use command-line parameters to install Visual Studio](https://docs.microsoft.com/en-us/visualstudio/install/use-command-line-parameters-to-install-visual-studio?view=vs-2022) | Command-line options. |
| [Workload and component IDs for Visual Studio Community](https://docs.microsoft.com/en-us/visualstudio/install/workload-component-id-vs-community?view=vs-2022&preserve-view=true) | Component IDs. |
| [Workload and component IDs (without preserve-view)](https://docs.microsoft.com/en-us/visualstudio/install/workload-component-id-vs-community?view=vs-2022) | Component IDs. |

## Turn on the dark theme in SQL Server Management Studio

1. Run Notepad++ as administrator.
2. Open the `ssms.pkgundef` file for your SSMS version:

   | Version | Folder |
   | --- | --- |
   | SSMS 2016 | `C:\Program Files (x86)\Microsoft SQL Server\130\Tools\Binn\ManagementStudio` |
   | SSMS 17 | `C:\Program Files (x86)\Microsoft SQL Server\140\Tools\Binn\ManagementStudio` |
   | SSMS 18 | `C:\Program Files (x86)\Microsoft SQL Server Management Studio 18\Common7\IDE` |

3. Find the "Remove Dark theme" section. Add `//` at the start of the first line below the heading.

   Before:

   ```ini
   // Remove Dark theme
   [$RootKey$\Themes\{1ded0138-47ce-435e-84ef-9ec1f439b749}]
   ```

   After:

   ```ini
   // Remove Dark theme
   // [$RootKey$\Themes\{1ded0138-47ce-435e-84ef-9ec1f439b749}]
   ```

4. Save the file.

## Fix a MySQL version dump mismatch

1. In MySQL Workbench, open **Edit** > **Preferences** > **Administration**.
2. In **Path to mysqldump Tool**, select the `mysqldump.exe` file: `C:\Program Files\MySQL\MySQL Server 5.7\bin\mysqldump.exe`.
3. Select **OK** and export the database.

## Windows shortcuts and tricks

| Task | Shortcut or command |
| --- | --- |
| End task | `Alt + F4` |
| Task Manager | `Ctrl + Shift + Esc` |
| Snipping Tool | `Ctrl + Shift + S` or `Windows logo + Shift + S` |
| Switch window | `Windows logo + Tab` |
| Send a message to each computer on the same network (CMD) | `MSG * Hi. I'm having a braai on Saturday, and you're invited. Feel free to bring your family and friends; all costs will be covered.` |
| Swap the mouse buttons (CMD) | `rundll32 user32, SwapMouseButton` |
| Fake update screen (press F11) | [fakeupdate.net](https://fakeupdate.net/) |

The last 3 items come from the [Veraxity YouTube channel](https://www.youtube.com/@Veraxity).

## Video project folder structure

```json
"FolderStructures": {
    "1.Audio": {
        "Music": "",
        "Voice": ""
    },
    "2.Footage": {
        "A-Roll": {
            "MOV": "",
            "MP4": ""
        },
        "B-Roll": {
            "MOV": "",
            "MP4": "" 
        },
        "Other": {
            "MOV": "",
            "MP4": ""
        },
        "ScreenCaps": {
            "MOV": "",
            "MP4": ""
        }
    },
    "3.Pictures": "",
    "4.Project": "",
    "5.Thumbnail": "",
    "6.Proxies": "",
    "7.Final": ""
}
```

## Cyber activity entities

| Name | Link | Notes |
| --- | --- | --- |
| The Play Inc. | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=MywyMzYsODk2LVBJTiAyODAx) | |
| Blue Cinema | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=MTAwMDU1NTY0ODk1) | |
| Grade A Motion | [blackflagofamazon.com search](https://www.blackflagofamazon.com/api/search?code=chameleon%20case&region=dC5tb3Rzd2FnYWVAb3V0bG9vay5jb20=) | |
| Identify Search API | [net.users.org search](https://net.users.org/api/search?area=255) | |
| Yellow SuperStore | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=MTYzMjUxMDI=) | |
| Black SuperStore | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=NjAwNzg1MzAxOTg2NDExNw==) | |
| Blue SuperStore | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=NzM1MzI4MDgyMDUwMzMxMg==) | |
| Black Retail Store | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=MTEwMDAwMDAyMjkwODk4OQ==) | |
| Blue Pharmacy | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=MDIwMDc5MjA2NjYxNQ==) | |
| Red SuperStore | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=OTcxMDA4NTA2MTc5MDA2Mg==) | |
| Web Cinema | [JavaScriptBase64 token](https://tshego3.github.io/JavaScriptBase64/?token=dC5tb3Rzd2FnYWVAb3V0bG9vay5jb20=) | |
| Web Checkout | [Vuma Reach](https://reach.vumatel.co.za/vuma-reach/home) | |

## Study and reading

### Books and writing tools

| Name | Link | Notes |
| --- | --- | --- |
| Z-Library | [za1lib.org](https://za1lib.org/) | Ebook library. |
| Z-Library | [z-lib.org](https://z-lib.org/) | Ebook library. |
| Library Genesis | [libgen.is](https://libgen.is/) | Ebook library. |
| QuillBot | [quillbot.com](https://quillbot.com/) | Paraphrase tool. |
| Grammarly | [app.grammarly.com](https://app.grammarly.com/) | Grammar tool. |

A title in the source is Base64 text: `QmV0dGluZyBPbiBaZXJv` ("Betting On Zero").

### Reference format

Use this format: Last Name, First Name. *Italicized Title*. Publisher, Publication Year.

Examples:

- Langer, A.J., "Lessons in Friendships." Chicken Soup for the Teenage Soul: 101 Stories of Life, Love, and Learning, edited by Jack Canfield et al., Simon & Schuster, 1997, pp. 56-62.
- Reynolds G., "Ethics in Information Technology, 6th Edition", Cengage, 2019
- Guest, 8 top nonprofit online campaigns that rocked social media, www.socialbrite.org, 2019
- Coronel, C., Morris, S., "Database System: Design, Implementation, & Management. 13th Edition", Cengage, 2019

### Study links

| Name | Link | Notes |
| --- | --- | --- |
| Host Blazor WASM in GitHub Pages (in 3:30 minutes) | [YouTube](https://www.youtube.com/watch?v=cMlWlv037Vg) | Video. |
| UNISA login | [cas.unisa.ac.za](https://cas.unisa.ac.za/cas/login) | |
| UNISA modules | [mymodules.dtls.unisa.ac.za](https://mymodules.dtls.unisa.ac.za/) | |
| myUNISA | [unisa.ac.za/sites/myunisa](https://www.unisa.ac.za/sites/myunisa/default/) | |
| UNISA web registration | [registration.unisa.ac.za](https://registration.unisa.ac.za/info/webreg.html) | |
| MongoDB: getting started | [mongodb.com](https://www.mongodb.com/docs/manual/tutorial/getting-started/) | |
| MongoDB: query an array of documents | [mongodb.com](https://www.mongodb.com/docs/manual/tutorial/query-array-of-documents) | |
| MongoDB: aggregation | [mongodb.com](https://www.mongodb.com/docs/manual/aggregation/) | |
| MongoDB aggregation (Tutorialspoint) | [tutorialspoint.com](https://www.tutorialspoint.com/mongodb/mongodb_aggregation.htm) | |
| MongoDB: sort by subdocument match | [tutorialspoint.com](https://www.tutorialspoint.com/mongodb-to-sort-by-subdocument-match) | |
| MongoDB: filter an array in a subdocument | [tutorialspoint.com](https://www.tutorialspoint.com/how-to-filter-array-in-subdocument-with-mongodb) | |
| Use the Office offline installer | [support.microsoft.com](https://support.microsoft.com/en-us/office/use-the-office-offline-installer-f0a85fe7-118f-41cb-a791-d59cef96ad1c#OfficePlans=signinorgid) | |
| Install Office 2019, 2016, or 2013 | [support.microsoft.com](https://support.microsoft.com/en-us/office/download-and-install-or-reinstall-office-2019-office-2016-or-office-2013-7c695b06-6d1a-4917-809c-98ce43f86479) | |

## Nutrition plan for six-pack abs

This plan comes from the adidas Runtastic blog ([Finally get your six-pack abs with this nutrition plan](https://www.runtastic.com/blog/en/finally-get-your-six-pack-abs-with-this-nutrition-plan/)). It is for a man of 80 kg who is moderately active (for example, 30 minutes of bodyweight training), at approximately 2,500 cal.

| Meal | Food | Calories |
| --- | --- | --- |
| Breakfast | Shakshuka with 2 slices of whole grain bread | 425 cal |
| Snack | Homemade granola bars | 250 cal |
| Lunch | Buddha bowl with quinoa | 770 cal |
| Snack | Strawberry banana oatmeal smoothie | 380 cal |
| Dinner | Stuffed tomatoes with beef | 630 cal |

Related topics: carb cycling, time under tension training plan, HIIT workouts, and [V Shred](https://vshred.com/).

## Related links

- [Extract an APK with ADB](doc:android-extract-apk-adb)
- [Windows Subsystem for Android](doc:windows-subsystem-for-android)
- [Android wireless debugging](doc:android-wireless-debugging)
- [RustDesk](https://rustdesk.com/)
- [RustDesk server setup video](https://www.youtube.com/watch?v=h4Hm6LC3pII)
- [Mirror Galaxy Watch 4/5 screen to PC (DroidWin)](https://droidwin.com/mirror-galaxy-watch-4-5-screen-to-pc-mac-windows/)
- [Development nexuses](doc:development-nexuses)
