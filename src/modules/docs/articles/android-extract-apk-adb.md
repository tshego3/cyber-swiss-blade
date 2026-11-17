---
title: Extract an APK from an Android device with ADB
summary: Use ADB to find an installed app package on an Android device, pull its APK file, and install split APK files.
category: Flutter and Android
order: 40
gist: 6404f91e953b993eea3ded7e886da924
---

# Extract an APK from an Android device with ADB

This article shows how to get an APK file from an Android phone with the Android Debug Bridge (ADB). It also shows how to install an app that has split APK files and how to find the package name of an app.

## Before you start

- An Android device in developer mode (the original procedure used a Samsung phone with Android 9).
- A computer with the Android SDK Platform-Tools (the original procedure used Ubuntu 18.04).
- A USB connection between the device and the computer.

## Turn on developer mode

The steps are different on each phone. The general procedure is:

1. Go to **Settings**.
2. Find **About Phone** (or a similar item).
3. Scroll down to **Build Number**.
4. Tap the build number 7 times.
5. Go back to **Settings**.

   **Result:** The **Developer Options** item shows.

## Find the ADB location

If you installed Android Studio with the [JetBrains Toolbox](https://www.jetbrains.com/toolbox/app/), you possibly do not know where the Android SDK is. To find the SDK location in Android Studio:

1. Select **File > Project Structure...**.
2. In the left sidebar, select **SDK Location**.

In the original procedure, the SDK was in `/home/username/Android/Sdk`. The ADB tool is in the `platform-tools` subfolder.

## List the packages on the device

1. Make sure that the device is connected:

   ```bash
   /home/user/Android/Sdk/platform-tools/adb devices
   ```

   ```text
   * daemon not running; starting now at tcp:5037
   * daemon started successfully
   List of devices attached
   5832555546523551  device
   ```

2. List all the packages:

   ```bash
   /home/user/Android/Sdk/platform-tools/adb shell pm list packages
   ```

   ```text
   ...
   package:com.amazon.kindle
   package:com.google.android.apps.restore
   package:com.samsung.android.app.vr.input.service
   package:com.instantpot.app
   ...
   ```

3. Filter the list to find the package that you want:

   ```bash
   /home/user/Android/Sdk/platform-tools/adb shell pm list packages | grep -i instant
   ```

   ```text
   package:com.instantpot.app
   ```

## Pull the APK file

1. Get the path of the package:

   ```bash
   /home/user/Android/Sdk/platform-tools/adb shell pm path com.instantpot.app
   ```

   ```text
   package:/data/app/com.instantpot.app-bbb_fikgz0fAxuyjXwRCcc==/base.apk
   ```

2. Copy the APK file to the computer:

   ```bash
   /home/user/Android/Sdk/platform-tools/adb pull /data/app/com.instantpot.app-bbb_fikgz0fAxuyjXwRCcc==/base.apk
   ```

   ```text
   /data/app/com.instantpot.app-bbb_fikgz.... 23.7 MB/s (46654418 bytes in 1.876s)
   ```

## Install an app with split APK files

To install an app (for example, `com.example.app`) that has split configuration files, use `adb install-multiple`. On Windows, use the same commands:

```cmd
adb install-multiple base.apk split_config.armeabi_v7a.apk split_config.xhdpi.apk
adb install-multiple base.apk split_config.armeabi_v7a.apk split_config.en.apk split_config.xhdpi.apk
```

## Find the package name of an app

| Method | How to use it |
| --- | --- |
| Google Play Store | Search for the app. The package name is usually part of the URL. In `https://play.google.com/store/apps/details?id=com.example.app`, the package name is `com.example.app`. |
| APK Mirror | Websites such as APK Mirror list apps and their package names. Search for the app there. |
| An app on the device | Some apps list the installed apps with their package names, for example "Package Name Viewer". |
| Developer documentation | If the app is open source or has public documentation, the package name can be in the documentation. |

## Related links

- [adb: How do I get an apk file from an Android device?](https://stackoverflow.com/questions/4032960/how-do-i-get-an-apk-file-from-an-android-device/4033005) (stackoverflow.com)
- [Android Studio: How to change Android SDK path](https://stackoverflow.com/questions/16581752/android-studio-how-to-change-android-sdk-path) (stackoverflow.com)
- [How to install and use ADB, the Android Debug Bridge utility](https://www.howtogeek.com/125769/how-to-install-and-use-abd-the-android-debug-bridge-utility/) (howtogeek.com)
- [JetBrains Toolbox](https://www.jetbrains.com/toolbox/app/)
- [Android SDK manual setup](doc:android-sdk-manual-setup)
- [Debug an Android app wirelessly](doc:android-wireless-debugging)
