---
title: Install Windows Subsystem for Android without Windows Insider
summary: Install Windows Subsystem for Android on any edition of Windows 11 from the msixbundle file, without the Windows Insider Program.
category: Flutter and Android
order: 60
---

# Install Windows Subsystem for Android without Windows Insider

Windows Subsystem for Android (WSA) lets Windows run Android apps directly, without an emulator. When the guide was written, WSA was available only as a preview in the Beta Channel of the Windows Insider Program. This guide installs WSA on Windows 11 without the Windows Insider Program.

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Windows Subsystem for Android on 5 March 2025. WSA and the Amazon Appstore are no longer in the Microsoft Store, WSA gets no updates, and the download steps in this guide can fail. To run Android apps on Windows, use the Android Emulator. See [Android SDK manual setup](doc:android-sdk-manual-setup).

## Before you start

- A device with any version and edition of Windows 11.
- An internet connection.
- Hyper-V turned on. See [Turn on Hyper-V](#turn-on-hyper-v).

## Turn on Hyper-V

If Hyper-V is already on, go to [Download the WSA package](#download-the-wsa-package).

If your Windows edition is **Home**, see [how to turn on Hyper-V in Windows Home edition](https://gist.github.com/HimDek/6edde284203a620745fad3f762be603b).

If your Windows edition is **Pro**, **Enterprise**, or **Education**, do these steps:

1. In the Start menu search bar, search for `Turn Windows features on or off` and open it.

   ![Turn Windows features on or off in the Start menu search](https://user-images.githubusercontent.com/61367380/141923398-ee251035-8e1d-42e6-9551-5c797e2b8f73.png)

2. In the window, find `Hyper-V`, `Virtual Machine Platform`, and `Windows Hypervisor Platform`. Select the check box of each item.
3. Click `OK`. This step takes some time.
4. Restart the computer.

   **Result:** Hyper-V is on.

## Download the WSA package

1. Go to [https://store.rg-adguard.net/](https://store.rg-adguard.net/).

   ![The store.rg-adguard.net page](https://user-images.githubusercontent.com/61367380/141881825-20ca849d-ddb8-443d-b883-1af5fb21db9e.png)

2. In the first list, select `ProductID`.
3. In the box next to it, type `9p3395vx91nr`.
4. In the list next to the box, select `Slow`.

   ![The ProductID, product ID, and Slow values on the page](https://user-images.githubusercontent.com/61367380/141882202-2c5401cb-cdaf-4a10-a93d-67d231aafbe7.png)

5. Click the check mark icon.

   **Result:** A list of files shows below.
6. Find `MicrosoftCorporationII.WindowsSubsystemForAndroid_<version>.msixbundle` in the list. The list shows the current version number in place of `<version>`. When the guide was written, the file size was approximately 1.2 GB.
7. Right-click the file and click `Save link as...`.

   ![The Save link as command on the msixbundle file](https://user-images.githubusercontent.com/61367380/141882808-d3348fad-220d-4a21-b0fb-468ce144fb9b.png)

8. Save the file and remember its location.
9. If the browser shows a warning that it cannot download the file securely, click the up arrow icon and click **Keep**.

   **Result:** The download starts.

   ![The browser warning with the Keep command](https://user-images.githubusercontent.com/61367380/141883353-19f2a557-9cbb-4a7f-8c3c-1e46f122592a.png)

## Install the WSA package

1. When the download is complete, go to the file location. Right-click the file and click `Copy as path`.

   ![The Copy as path command on the downloaded file](https://user-images.githubusercontent.com/61367380/141884516-dda65b19-2abd-42e2-b2b5-a8afa24d3609.png)

2. In the Start menu, search for `powershell`. Right-click `Windows PowerShell` and click `Run as Administrator`.

   ![Run Windows PowerShell as Administrator](https://user-images.githubusercontent.com/61367380/141885081-e84efb8a-32ef-4c95-9eda-91303d6c9cb7.png)

3. In the PowerShell window, type `Add-AppxPackage ` (with a space at the end). Then press `Ctrl + V` to paste the path that you copied.

   ```powershell
   Add-AppxPackage "<path to the msixbundle file>"
   ```

   ![The Add-AppxPackage command with the pasted path](https://user-images.githubusercontent.com/61367380/141886091-d119b086-fa94-4dda-80dd-2c5a24242dc8.png)

4. Press Enter.

   **Result:** The installation starts.
5. When the installation is complete, close the PowerShell window.

   **Result:** `Windows Subsystem for Android Settings` shows in the Start menu.

   ![Windows Subsystem for Android Settings in the Start menu](https://user-images.githubusercontent.com/61367380/141886990-9c745a77-ee8c-45ed-9d5a-c16cc0505b71.png)

## Start WSA

1. Open `Windows Subsystem for Android Settings`.
2. Click the icon on the far left side of the **Files** box.

   **Result:** Windows Subsystem for Android starts and opens the Android `File Manager` app.

   ![The Windows Subsystem for Android Settings window with the Files box](https://user-images.githubusercontent.com/61367380/141887519-c2f80fc2-75fe-449b-a899-b842c545788a.png)

## Related links

- [store.rg-adguard.net](https://store.rg-adguard.net/)
- [Turn on Hyper-V in Windows Home edition](https://gist.github.com/HimDek/6edde284203a620745fad3f762be603b)
- [Install Android apps or APK files in Windows with Windows Subsystem for Android (no emulator)](https://gist.github.com/HimDek/e09340eae2861e1ad8b7f6bdba5ee9ff)
- [Extract an APK from an Android device with ADB](doc:android-extract-apk-adb)
