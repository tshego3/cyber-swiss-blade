---
title: .NET MAUI guide: Build and sign APK and IPA files in Azure Pipelines
summary: Set the Android package format to APK and build, sign, and publish Xamarin.Android and .NET MAUI apps with Azure Pipelines YAML.
category: .NET MAUI
order: 270
---

# .NET MAUI guide: Build and sign APK and IPA files in Azure Pipelines

This guide shows how to make a .NET MAUI project produce an APK file, and gives two Azure Pipelines YAML files. The first pipeline builds a Xamarin.Android app. The second pipeline builds a .NET MAUI app for iOS and Android. Both samples use the WeatherTwentyOne app.

## Before you start

Make these items in Azure DevOps before you run the pipelines:

| Item | Used by | Values |
| --- | --- | --- |
| Variable group `versioning` | Both | Version values. |
| Variable group `mono` | Both | `mono.version` (only in the commented-out Mono task). |
| Variable group `android-signing` | Both | `keystore.password`, `keystore.alias`, `key.password`. |
| Variable group `ios-signing` | .NET MAUI | `cert.name`, `cert.namedev`, `cert.namedevtm`, `cert.passwordmaui`, `profile.name`, `profile.namedev`. |
| Secure files | Both | The keystore `app.keystore`. For iOS, the certificates and the provisioning profiles. |
| Self-hosted macOS agent | .NET MAUI | An agent in the `Default` pool with the `MAUI` and `MSBuild` capabilities. |

## Set the Android package format to APK

1. In Visual Studio, double-click the **Properties** folder of the app. A properties page opens.
2. Select **Android** on the left, then **Options**.
3. Set **Android package format** to **apk**.

## Xamarin.Android pipeline

This pipeline runs on a Microsoft-hosted `windows-2022` agent. It installs Java 11, restores the NuGet packages, builds the Android project with the `XamarinAndroid@1` task, signs and aligns the APK, and publishes it as the `weathertwentyone-droid-signed` artifact.

```yaml
trigger:
  - main

pool:
  vmImage: 'windows-2022'
  # vmImage: 'macOS-13'

variables:
  - group: versioning
  - group: android-signing
  - group: mono
  - name: buildConfiguration
    value: 'Release'
  - name: outputDirectory
    value: '$(build.binariesDirectory)/$(buildConfiguration)'
  - name: versionFile
    value: 'WeatherTwentyOne/WeatherTwentyOne.Droid/Properties/AndroidManifest.xml'
  - name: apkName
    value: 'weathertwentyone.release.apk'

steps:
# - task: Bash@3
#   displayName: 'Set Mono Version'
#   inputs:
#     targetType: 'inline'
#     script: 'sudo $AGENT_HOMEDIRECTORY/scripts/select-xamarin-sdk.sh $(mono.version)'

- task: JavaToolInstaller@0
  displayName: 'Install Java 11'
  inputs:
    versionSpec: '11'
    jdkArchitectureOption: 'x64'
    jdkSourceOption: 'PreInstalled'

- script: |
    echo "##vso[task.setvariable variable=JAVA_HOME]$(JAVA_HOME_11_X64)"
    echo "JAVA_HOME set to $(JAVA_HOME)"
  displayName: 'Set JAVA_HOME'

- task: UseDotNet@2
  displayName: 'Set .NET Core SDK Version'
  inputs:
    packageType: sdk
    version: 2.2.203
    installationPath: $(Agent.ToolsDirectory)/dotnet

- task: NuGetToolInstaller@1
  displayName: 'Install NuGet Tools'

- task: NuGetCommand@2
  displayName: 'Restore NuGet Packages'
  inputs:
    restoreSolution: '**/*.sln'
    # restoreSolution: WeatherTwentyOne/WeatherTwentyOne.sln

- task: XamarinAndroid@1
  displayName: 'Build Android App'
  inputs:
    projectFile: 'WeatherTwentyOne/WeatherTwentyOne.Droid/WeatherTwentyOne.Droid.csproj'
    outputDirectory: '$(outputDirectory)'
    configuration: '$(buildConfiguration)'

- task: AndroidSigning@3
  displayName: 'Signing and aligning APK file(s) **/*.apk'
  inputs:
    apkFiles: '**/*.apk'
    apksign: true
    apksignerKeystoreFile: 'app.keystore'
    apksignerKeystorePassword: '$(keystore.password)'
    apksignerKeystoreAlias: '$(keystore.alias)'
    apksignerKeyPassword: '$(key.password)'
    apksignerArguments: '--out $(Build.ArtifactStagingDirectory)/$(apkName)'
    zipalign: true

- task: PublishPipelineArtifact@1
  displayName: 'Create Artifact: Signed APK'
  inputs:
    targetPath: '$(Build.ArtifactStagingDirectory)'
    artifact: 'weathertwentyone-droid-signed'
```

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin on 1 May 2024, and the `XamarinAndroid@1` task builds only Xamarin projects. .NET Core 2.2 reached end of support in December 2019. The Microsoft-hosted `macOS-13` image is retired. Migrate the app to .NET for Android or .NET MAUI and use the .NET MAUI pipeline below.

## .NET MAUI pipeline

This pipeline runs on a self-hosted macOS agent. It selects Xcode 26.2, installs the Apple certificates and provisioning profiles, installs the .NET SDK and the MAUI workloads, and builds the app for iOS and Android. Then it signs and renames the APK, and publishes the APK, APP, and IPA files as the `drop` artifact.

```yaml
trigger:
- main

variables:
  - group: versioning
  - group: mono
  - group: ios-signing
  - group: android-signing
  - name: buildConfiguration
    value: 'Release'
  - name: outputDirectory
    value: '$(build.binariesDirectory)/$(buildConfiguration)'
  - name: iosVersionFile
    value: 'Apps/WeatherTwentyOne/Platforms/iOS/Info.plist'
  - name: versionFile
    value: 'Apps/WeatherTwentyOne/Platforms/Android/AndroidManifest.xml'
  - name: DotNetVersion
    value: 10.0.100
  - name: VSVERSION
    value: 17/pre

stages:
- stage: BuildiOS
  jobs:
  - job: BuildMAUIApps
    displayName: Build App
    timeoutInMinutes: 120
    pool:
      # vmImage: 'macOS-26'
      name: 'Default'
      demands:
      # Option 1: Use a specific agent
      # - Agent.Name -equals macOS-Agent-01
      # Option 2: Use a shared custom capability - Azure DevOps → Agent pools → Default → [agent] → Capabilities → User capabilities → Add MAUI=true to macOS-Agent-01 and any other Mac build agents
      - MAUI -equals true 
      - MSBuild

    steps:

    - script: sudo xcode-select -s /Applications/Xcode_26.2.app
      displayName: 'Select Xcode 26.2'

    - task: InstallAppleCertificate@2
      inputs:
        certSecureFile: '$(cert.name)'
        certPwd: '$(cert.passwordmaui)'
        keychain: 'temp'

    - task: InstallAppleCertificate@2
      inputs:
        certSecureFile: '$(cert.namedev)'
        certPwd: '$(cert.passwordmaui)'
        keychain: 'temp'

    - task: InstallAppleCertificate@2
      inputs:
        certSecureFile: '$(cert.namedevtm)'
        certPwd: '$(cert.passwordmaui)'
        keychain: 'temp'

    - task: InstallAppleProvisioningProfile@1
      inputs:
        provisioningProfileLocation: 'secureFiles'
        provProfileSecureFile: '$(profile.name)'
        removeProfile: true

    - task: InstallAppleProvisioningProfile@1
      inputs:
        provisioningProfileLocation: 'secureFiles'
        provProfileSecureFile: '$(profile.namedev)'
        removeProfile: true

    - task: UseDotNet@2
      displayName: .NET Version
      inputs:
        packageType: 'sdk'
        version: '$(DotNetVersion)'

    - task: Bash@3
      displayName: Install MAUI
      inputs:
        targetType: 'inline'
        script: |
          dotnet nuget locals all --clear
          dotnet workload install maui --source https://api.nuget.org/v3/index.json
          dotnet workload install android ios maccatalyst tvos macos maui wasm-tools --source https://api.nuget.org/v3/index.json

    - task: Bash@3
      displayName: Restore nuget
      inputs:
        targetType: 'inline'
        script: |
          cd Apps/WeatherTwentyOne/
          dotnet restore WeatherTwentyOne.csproj

    - task: Bash@3
      displayName: Build iOS App
      inputs:
        targetType: 'inline'
        script: |
          cd Apps/WeatherTwentyOne/
          dotnet publish WeatherTwentyOne.csproj -f net10.0-ios -r ios-arm64 -c $(buildConfiguration)

    - task: Bash@3
      displayName: Build Android App
      inputs:
        targetType: 'inline'
        script: |
          cd Apps/WeatherTwentyOne/
          dotnet build WeatherTwentyOne.csproj -f net10.0-android36.0 -c $(buildConfiguration)
    
    - task: AndroidSigning@3
      displayName: 'Signing and aligning APK file(s) **/*.apk'
      inputs:
        apkFiles: '**/*.apk'
        apksign: true
        apksignerKeystoreFile: 'app.keystore'
        apksignerKeystorePassword: $(keystore.password)
        apksignerKeystoreAlias: $(keystore.alias)
        apksignerKeyPassword: $(key.password)
        zipalign: true
    
    - task: Bash@3
      displayName: Rename Signed APK
      inputs:
        targetType: 'inline'
        script: |
          cd Apps/WeatherTwentyOne/bin/$(buildConfiguration)/net10.0-android36.0/
          mv weathertwentyone.droid-Signed.apk weathertwentyone.apk

    - task: CopyFiles@2
      inputs:
        Contents: |
          **/*.apk
          **/*.app
          **/*.ipa
          **/release-notes.txt
        TargetFolder: '$(outputDirectory)'

    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(outputDirectory)'
        ArtifactName: 'drop'
        publishLocation: 'Container'
```

To pick the build agent, use one of the two options in the `demands` comments:

- Option 1: Use a specific agent, for example `Agent.Name -equals macOS-Agent-01`.
- Option 2: Use a shared custom capability. In Azure DevOps, go to **Agent pools** > **Default** > (agent) > **Capabilities** > **User capabilities**. Add `MAUI=true` to `macOS-Agent-01` and to all other Mac build agents.

## Differences between the pipelines

| Area | Xamarin.Android | .NET MAUI |
| --- | --- | --- |
| Agent | Microsoft-hosted `windows-2022` (`macOS-13` in a comment) | Self-hosted `Default` pool (`macOS-26` in a comment) |
| Structure | Steps only | One stage (`BuildiOS`) with one job (`BuildMAUIApps`), timeout 120 minutes |
| SDK | Java 11 and .NET Core SDK 2.2.203 | .NET SDK `$(DotNetVersion)` (10.0.100) and the MAUI workloads |
| Build | `XamarinAndroid@1` task | `dotnet publish` for `net10.0-ios` (`ios-arm64`) and `dotnet build` for `net10.0-android36.0` |
| Signing | `AndroidSigning@3` writes the APK to the staging directory | `AndroidSigning@3`, then a script renames `weathertwentyone.droid-Signed.apk` to `weathertwentyone.apk` |
| Artifact | `PublishPipelineArtifact@1` | `CopyFiles@2` and `PublishBuildArtifacts@1` |

> **NOTE:** `DotNetVersion` (10.0.100) must match the `net10.0` target frameworks. Azure Pipelines variable names are not case-sensitive, so the pipeline defines `buildConfiguration` only once. The stage is named `BuildiOS`, but the job builds iOS and Android. Verify the name of the signed APK in the rename step: it depends on the `ApplicationId` of your project and on the output of `AndroidSigning@3`.

## Related links

- [Stack Overflow: How to create an APK file in a MAUI project to distribute the Android app](https://stackoverflow.com/questions/75984083/how-to-get-create-an-apk-file-in-a-maui-project-to-can-distribute-the-android-ap)
- [Azure DevOps self-hosted agent on macOS](doc:azure-devops-macos-self-hosted-agent)
