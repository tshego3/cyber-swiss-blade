---
title: .NET MAUI DevOps, CI/CD, and environment setup
summary: Links, macOS paths, environment variables, and commands to build, sign, and deploy .NET MAUI apps with Azure DevOps and other CI/CD tools.
category: .NET MAUI
order: 40
---

# .NET MAUI DevOps, CI/CD, and environment setup

This article collects the resources, paths, and environment settings for .NET MAUI CI/CD and deployment. Use it when you set up a build machine or a pipeline for Android and iOS.

## Before you start

- A Mac for iOS builds, with Xcode installed.
- The Android SDK and a JDK for Android builds.
- For iOS signing, see [iOS code signing for .NET MAUI](doc:maui-cheatsheet-ios-code-signing).

## Resources

| Name | Link | Notes |
| --- | --- | --- |
| Getting Started with DevOps and .NET MAUI | [Blog](https://devblogs.microsoft.com/dotnet/devops-for-dotnet-maui/) | |
| .NET MAUI AzureDevOps sample | [GitHub](https://github.com/dotnet/maui-samples/tree/main/9.0/Apps/WeatherTwentyOne/devops/AzureDevOps) | |
| .NET Runtime Identifier catalog | [Docs](https://learn.microsoft.com/en-us/dotnet/core/rid-catalog) | |
| Microsoft-hosted agents: software | [Docs](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/hosted?view=azure-devops&tabs=yaml#software) | |
| Sign your Android app (Azure DevOps) | [Docs](https://docs.microsoft.com/en-us/azure/devops/pipelines/apps/mobile/app-signing?view=azure-devops&tabs=apple-install-during-build#sign-your-android-app) | |
| Azure DevOps extension: Apple App Store | [GitHub](https://github.com/microsoft/app-store-vsts-extension/) | |
| Azure DevOps extension: Google Play Store | [GitHub](https://github.com/microsoft/google-play-vsts-extension/) | |
| Fastlane CI: Azure DevOps best practices | [Docs](https://docs.fastlane.tools/best-practices/continuous-integration/azure-devops/) | |
| App Store Connect API | [Portal](https://appstoreconnect.apple.com/access/integrations/api) | |
| Creating API keys for App Store Connect API | [Docs](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api) | |
| .NET MAUI deployment | [Docs](https://learn.microsoft.com/en-us/dotnet/maui/deployment/) | |
| .NET MAUI deployment in VS Code | [YouTube](https://www.youtube.com/watch?v=1t2zzoW4D98) | |
| Deploy and debug to iOS devices in VS Code | [YouTube](https://youtu.be/B-kZ-AgEeO8) | |
| Hot Restart (iOS) | [Docs](https://learn.microsoft.com/en-us/dotnet/maui/ios/hot-restart) | |

## macOS path reference

| Item | Path |
| --- | --- |
| Provisioning profiles (Xcode 16 and later) | `~/Library/Developer/Xcode/UserData/Provisioning Profiles` |
| Provisioning profiles (Xcode 15 and earlier) | `~/Library/MobileDevice/Provisioning Profiles` |
| Xcode application | `/Applications/Xcode.app` |
| Xcode developer tools | `/Applications/Xcode.app/Contents/Developer` |
| codesign | `/usr/bin/codesign` |
| productbuild | `/usr/bin/productbuild` |
| Xamarin logs | `~/Library/Logs/Xamarin` |
| Xamarin MonoTouch (Windows) | `%LOCALAPPDATA%\Xamarin\MonoTouch` |

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin in May 2024. Verify that the `Xamarin` paths exist for your .NET MAUI tools before you use them.

To show hidden files in Finder, press `Cmd + Shift + .` (period).

## Convert the App Store Connect API key to Base64

On macOS, run this command to write the `.p8` key as Base64 to a text file:

```bash
base64 -i ~/Downloads/AuthKey_{KeyID}.p8 -o ~/Downloads/AuthKey_{KeyID}.txt
```

## Set environment variables

### macOS

1. Open the `.zshrc` file in the default text editor (usually TextEdit on macOS).
2. Add the `export` lines at the bottom of the file. Save and close the file.
3. Apply the changes with `source ~/.zshrc`.
4. If you need a newer Ruby version, install it with Homebrew, add its path to `.zshrc`, and check the version.

`$HOME/Library/Android/sdk` is the default Android SDK folder of Android Studio on macOS. If you installed the SDK in a different folder, change `ANDROID_HOME`.

```bash
# Open your .zshrc file in a text editor
open ~/.zshrc # This will open the file in your default text editor (usually TextEdit on macOS)
# Add the following lines at the bottom of the file
export PATH="/usr/local/lib/node_modules:$PATH"
export PATH="/opt/homebrew/bin:$PATH"
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
export JAVA_HOME=/Library/Java/JavaVirtualMachines/microsoft-21.jdk/Contents/Home
export PATH=$PATH:$JAVA_HOME/bin
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export GEM_HOME=$HOME/.gem
export PATH=$GEM_HOME/bin:$PATH
# Save and close the file
# Apply the changes
source ~/.zshrc
# Install a newer Ruby version
brew install ruby # brew reinstall ruby
# Add this to your .zshrc file
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
# Check your version
ruby -v
```

### Windows

Set these system environment variables:

| Variable | Value |
| --- | --- |
| `ANDROID_HOME` | `C:\Program Files (x86)\Android\android-sdk` |
| `JAVA_HOME` | `C:\Program Files (x86)\Android\openjdk\jdk-21.0.8` |
| `ANDROID_NDK_HOME` (only if you use the NDK or the emulator) | `C:\ProgramData\Microsoft\AndroidNDK64\25.1.8937393` |

Add these entries to the system `Path` variable:

```text
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

> **NOTE:** Dated (checked November 2026): Google deprecated the Android SDK Tools package (`tools` and `tools\bin`). Its replacement is the Android SDK Command-line Tools. Add `%ANDROID_HOME%\cmdline-tools\latest\bin` to `Path`, as the macOS setup does.

## Related links

- [iOS code signing for .NET MAUI](doc:maui-cheatsheet-ios-code-signing)
- [Android SDK manual setup](doc:android-sdk-manual-setup)
- [macOS Azure DevOps self-hosted agent](doc:azure-devops-macos-self-hosted-agent)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
