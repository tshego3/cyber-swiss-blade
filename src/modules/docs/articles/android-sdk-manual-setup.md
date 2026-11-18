---
title: Android SDK manual setup
summary: Install the Android SDK, Microsoft OpenJDK, and an Android emulator by hand on Windows or macOS, without Android Studio.
category: Flutter and Android
order: 20
---

# Android SDK manual setup

This guide installs the Android SDK by hand with the **Microsoft Build of OpenJDK**. On Windows, the SDK goes to `C:\Program Files (x86)\Android\android-sdk`. On macOS, the SDK goes to `/Library/Android/sdk`.

## Before you start

| Item | Value |
| --- | --- |
| Java | Microsoft Build of OpenJDK 17 (LTS) |
| SDK packages | Command line tools only, SDK Platform-Tools |
| Windows SDK folder | `C:\Program Files (x86)\Android\android-sdk` |
| macOS SDK folder | `/Library/Android/sdk` |
| Shell | Administrator PowerShell on Windows, Zsh on macOS |

## Install Microsoft OpenJDK

The Android SDK Manager is a Java application. The Microsoft Build of OpenJDK gives long-term support and stability.

1. Go to the [Microsoft OpenJDK download page](https://learn.microsoft.com/en-us/java/openjdk/download).
2. Select **OpenJDK 17 (LTS)**.
3. Install the package:
   - **Windows:** Run the `.msi` file. In the wizard, select the feature **Set JAVA_HOME variable**.
   - **macOS:** Run the `.pkg` file.

> **IMPORTANT:** On Windows, do not skip the **Set JAVA_HOME variable** feature.

## Download the SDK packages

1. Go to the [Android SDK tools page](https://developer.android.com/tools) and scroll to the bottom.
2. Download the **Command line tools only** zip file for your operating system (for example, `commandlinetools-win-xxxx_latest.zip`).
3. Download the **SDK Platform-Tools** zip file. This package contains `adb`.

## Create the folder structure

The SDK tools do not run unless they are in a folder with the name `latest`. This step is mandatory.

### Windows

1. Create the root folder `C:\Program Files (x86)\Android\android-sdk`.
2. Extract `platform-tools-latest-windows.zip` directly into the root folder.

   **Result:** The path `...\android-sdk\platform-tools\adb.exe` exists.
3. Create the folder `...\android-sdk\cmdline-tools\latest`.
4. Extract the contents of the command line tools zip file into the `latest` folder.

   **Result:** The path `...\android-sdk\cmdline-tools\latest\bin\sdkmanager.bat` exists.

### macOS

1. Create the root folder `/Library/Android/sdk`.
2. Use the same structure as on Windows.

   **Result:** The path `/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager` exists.

## Set the environment variables

The environment variables connect the tools to each other and to your shell.

### Windows

1. Search for **Edit the system environment variables**.
2. Click **Environment Variables**.
3. Under **System variables**, add these new variables:

   | Variable | Value |
   | --- | --- |
   | `JAVA_HOME` | `C:\Program Files\Microsoft\jdk-17.x.x-hotspot` (make sure that this is your real installation path) |
   | `ANDROID_HOME` | `C:\Program Files (x86)\Android\android-sdk` |

4. Edit the `Path` variable and add these lines:
   - `%JAVA_HOME%\bin`
   - `%ANDROID_HOME%\cmdline-tools\latest\bin`
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`

### macOS (Zsh)

1. Open Terminal and run `nano ~/.zshrc` or `open ~/.zshrc`.
2. Add these lines:

   ```bash
   # Java Home (Microsoft OpenJDK)
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/microsoft-17.jdk/Contents/Home

   # Android Home
   export ANDROID_HOME=/Library/Android/sdk

   # Update Path
   export PATH=$PATH:$JAVA_HOME/bin
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/emulator
   ```

3. Save the file (in nano, press Ctrl+O and then Enter, or press Ctrl+S). Exit with Ctrl+X.
4. Run `source ~/.zshrc`.

## Verify the installation

Run these commands:

| Command | Expected result |
| --- | --- |
| `java -version` | Shows Microsoft OpenJDK |
| `echo %JAVA_HOME%` (Windows) or `echo $JAVA_HOME` (macOS) | Shows the JDK path |
| `adb version` | Shows the adb version |

## Install the build tools and licenses

After you set the paths, complete the installation in a terminal. On Windows, use an Administrator PowerShell window.

1. Update the tools:

   ```bash
   sdkmanager --update
   ```

2. Download the build tools and a platform (this example uses API 36):

   ```bash
   sdkmanager "build-tools;36.0.0" "platforms;android-36"
   ```

3. Accept the licenses:

   ```bash
   sdkmanager --licenses
   ```

> **IMPORTANT:** Accept the licenses before you install the emulator or a system image. If you do not, you get `Skipping ... license is not accepted` and the AVD is not created.

## Create an Android emulator

Select the system image that agrees with the CPU of your host computer, not only with the operating system:

| Host CPU | System image ABI |
| --- | --- |
| Intel or AMD 64-bit (most Windows and Linux PCs) | `x86_64` |
| ARM64 (Apple silicon Mac, ARM Windows or Copilot+ PC) | `arm64-v8a` |

1. Install the emulator:

   ```bash
   sdkmanager --install emulator
   ```

2. Install the system image and create the Android Virtual Device (AVD).

   For an Intel or AMD 64-bit host:

   ```bash
   sdkmanager --install "system-images;android-36;google_apis;x86_64"
   avdmanager create avd -n AVD-API36 -k "system-images;android-36;google_apis;x86_64"
   ```

   For an ARM64 host (Apple silicon or ARM Windows):

   ```bash
   sdkmanager --install "system-images;android-36;google_apis;arm64-v8a"
   avdmanager create avd -n AVD-API36 -k "system-images;android-36;google_apis;arm64-v8a"
   ```

3. At the prompt `Do you wish to create a custom hardware profile? [no]`, press Enter.

   **Result:** The command creates `config.ini`. This step must succeed before the next step.
4. Turn on physical keyboard input and set the screen to 1080x2400 at 420 dpi. The emulator ignores the keyboard by default. The screen values agree with the default Android Studio "Medium Phone" (Pixel 8) template, which is the most common current emulator profile.

   On macOS or Linux:

   ```bash
   echo "hw.keyboard=yes" >> ~/.android/avd/AVD-API36.avd/config.ini
   echo "hw.lcd.width=1080" >> ~/.android/avd/AVD-API36.avd/config.ini
   echo "hw.lcd.height=2400" >> ~/.android/avd/AVD-API36.avd/config.ini
   echo "hw.lcd.density=420" >> ~/.android/avd/AVD-API36.avd/config.ini
   ```

   On Windows (PowerShell):

   ```powershell
   Add-Content "$env:USERPROFILE\.android\avd\AVD-API36.avd\config.ini" "hw.keyboard=yes"
   Add-Content "$env:USERPROFILE\.android\avd\AVD-API36.avd\config.ini" "hw.lcd.width=1080"
   Add-Content "$env:USERPROFILE\.android\avd\AVD-API36.avd\config.ini" "hw.lcd.height=2400"
   Add-Content "$env:USERPROFILE\.android\avd\AVD-API36.avd\config.ini" "hw.lcd.density=420"
   ```

5. Start the Android Virtual Device:

   ```bash
   emulator -avd AVD-API36
   ```

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `Skipping ... license is not accepted`, and the AVD is not created. | You did not accept the licenses before you installed the emulator or the system image. | Run `sdkmanager --licenses`, then install the system image again. |
| `FATAL \| Avd's CPU Architecture 'arm64' is not supported by the QEMU2 emulator on x86_64 host. System image must match the host architecture.` | You use an `arm64-v8a` system image on an `x86_64` host. | Install the `x86_64` system image and create the AVD again. |
| `Add-Content` fails with `Could not find a part of the path`. | The AVD was not created, so `config.ini` does not exist. | Run `avdmanager list avd` to check. Then run the `sdkmanager --install` and `avdmanager create avd` commands again. |
| The keyboard does not work after you set `hw.keyboard=yes`. | The emulator starts from an old snapshot. | Do a cold boot: `emulator -avd AVD-API36 -no-snapshot`. |
| The SDK tools do not run. | The command line tools are not in a folder with the name `latest`. | Move the tools to `cmdline-tools\latest`. |

## Related links

- [Microsoft OpenJDK download](https://learn.microsoft.com/en-us/java/openjdk/download)
- [Android SDK tools](https://developer.android.com/tools)
- [Debug an Android app wirelessly](doc:android-wireless-debugging)
- [Extract an APK from an Android device with ADB](doc:android-extract-apk-adb)
