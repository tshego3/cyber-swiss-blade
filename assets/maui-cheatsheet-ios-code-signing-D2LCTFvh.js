var e=`---
title: iOS code signing for .NET MAUI
summary: Create, install, trust, repair, and replace Apple certificates, bundle IDs, and provisioning profiles that sign a .NET MAUI iOS app.
category: .NET MAUI
order: 30
---

# iOS code signing for .NET MAUI

This article tells you how to set up Apple code signing for a .NET MAUI iOS app. Use it to create certificates and profiles, to fix signing errors, and to replace old signing items.

## Before you start

- A Mac with Xcode and Keychain Access.
- An Apple Developer account. Sign in at [developer.apple.com/account](https://developer.apple.com/account).
- Your Apple ID in **Xcode > Settings > Accounts**.

## Code signing overview

Apple requires a cryptographic signature on every app before the app can run on a device or go to the App Store. Code signing connects 3 components:

| Component | Purpose |
| --- | --- |
| **Certificate** | Proves the identity of the developer or organization. |
| **Identifier (Bundle ID)** | Identifies the app (for example, \`com.company.appname\`). |
| **Provisioning profile** | Binds a certificate, a bundle ID, and a device list together. |

There are 2 main certificate types:

| Certificate | Use |
| --- | --- |
| **Apple Development** | Run and debug apps on physical devices. |
| **Apple Distribution** | Submit to the App Store, or distribute through Ad Hoc or Enterprise. |

## Create a certificate signing request

A certificate signing request (CSR) is a file that you make on your Mac. Apple uses it to create your certificate. The private key stays on your Mac in **Keychain Access**. Do not share the private key.

1. Open **Keychain Access** (**Applications > Utilities > Keychain Access**, or search with Spotlight).
2. In the menu bar, select **Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority**.
3. Complete the form:
   - **User Email Address**: the Apple ID email of your developer account.
   - **Common Name**: a descriptive label, for example \`Jane Smith Development\`.
   - **CA Email Address**: leave it blank.
   - **Request is**: select **Saved to disk**.
4. Click **Continue**.
5. Select a location (for example, Desktop) and click **Save**.

**Result:** You have a \`.certSigningRequest\` file. Keep it. You upload it to the Apple Developer portal in the next task.

> **NOTE:** Keychain Access automatically makes a 2048-bit RSA key pair. It stores the private key in your login keychain. The private key must not leave your Mac, except when you export it for a backup or to share it in your team.

## Create certificates on the Developer Portal

1. Go to [https://developer.apple.com/account](https://developer.apple.com/account) and sign in.
2. Go to **Certificates, Identifiers & Profiles > Certificates** and click **+**.

### Create an Apple Development certificate

Use this certificate to build and debug on physical devices.

1. Under **Software**, select **Apple Development** and click **Continue**.
2. Click **Choose File**, select your \`.certSigningRequest\` file, and click **Continue**.
3. Click **Download** to save the \`.cer\` file.
4. Double-click the \`.cer\` file. Keychain Access installs it automatically.

### Create an Apple Distribution certificate

Use this certificate for App Store submissions and for Ad Hoc or Enterprise distribution.

1. Under **Software**, select **Apple Distribution** and click **Continue**.
2. Upload the same \`.certSigningRequest\` file (or a new one) and click **Continue**.
3. Download the \`.cer\` file and double-click it to install it.

> **IMPORTANT:** A team can have only 1 active Apple Distribution certificate at a time. To use it on more than 1 Mac, export the certificate with its private key as a \`.p12\` file. In Keychain Access, right-click the certificate and select **Export > Personal Information Exchange (.p12)**. Then import the file on the other Mac.

## Register an app identifier

1. In the Developer Portal, go to **Certificates, Identifiers & Profiles > Identifiers** and click **+**.
2. Select **App IDs > App** and click **Continue**.
3. Complete the fields:
   - **Description**: a name that people can read, for example \`HairGlam SPA\`.
   - **Bundle ID**: select **Explicit** for 1 app or **Wildcard** for a family of apps.
     - Explicit example: \`com.company.hairglam\`
     - Wildcard example: \`com.company.*\`
4. Under **Capabilities**, enable the entitlements that the app needs (Push Notifications, iCloud, Sign in with Apple, and others).
5. Click **Continue**, then **Register**.

> **NOTE:** Use an explicit ID if the app needs entitlements such as Push Notifications or In-App Purchases. A wildcard ID cannot use most entitlements.

## Register devices

Ad Hoc and Development profiles need registered device UDIDs.

1. Go to **Certificates, Identifiers & Profiles > Devices** and click **+**.
2. Enter a **Device Name** (a friendly label) and the **UDID**. To find the UDID, use one of these methods:
   - In Xcode: connect the device, select **Window > Devices and Simulators**, select the device, and copy the **Identifier**.
   - In Finder: connect the device, click its name in the sidebar, and click the model text until it shows the UDID.
3. Click **Continue**, then **Register**.

You can register up to 100 devices of each device type (iPhone, iPad, Mac, and others) in each membership year.

## Create provisioning profiles

Go to **Certificates, Identifiers & Profiles > Profiles** and click **+**.

### Create a development profile

1. Under **Development**, select **iOS App Development** (or the applicable platform) and click **Continue**.
2. Select the **App ID** that you registered and click **Continue**.
3. Select the **Development certificates** to include and click **Continue**.
4. Select the **registered devices** to include and click **Continue**.
5. Enter a descriptive name (for example, \`HairGlam Development\`). Click **Generate**, then **Download**.
6. Double-click the \`.mobileprovision\` file to install it.

### Create an App Store distribution profile

1. Under **Distribution**, select **App Store Connect** and click **Continue**.
2. Select the **App ID** and click **Continue**.
3. Select your **Distribution certificate** and click **Continue**.
4. Enter a name (for example, \`HairGlam App Store\`). Click **Generate**, then **Download**.
5. Double-click the file to install it.

### Create an Ad Hoc distribution profile

1. Under **Distribution**, select **Ad Hoc** and click **Continue**.
2. Select the **App ID** and click **Continue**.
3. Select your **Distribution certificate** and click **Continue**.
4. Select the **registered test devices** and click **Continue**.
5. Enter a name, then generate, download, and double-click the file to install it.

## Install certificates and profiles

| Item | How to install |
| --- | --- |
| \`.cer\` certificate | Double-click it. Keychain Access opens and imports it. |
| \`.p12\` certificate and private key | Double-click it. Enter the export password when the prompt shows. |
| \`.mobileprovision\` profile | Double-click it. Xcode registers it automatically. |

After the installation, open **Keychain Access** (login keychain, **Certificates** category) and make sure that:

- The certificate shows a **blue information icon** and no warning triangle.
- The **private key** shows under the certificate when you expand it. If the private key is missing, you cannot use the certificate to sign.

## Set certificate trust to Use System Defaults

Sometimes macOS marks an Apple certificate as not trusted. This stops Xcode from a build or an archive. Do these tasks to fix it.

### Set the trust

1. Open **Keychain Access** (Spotlight: \`Keychain Access\`).
2. In the left sidebar, select the **login** keychain.
3. Click the **Certificates** category.
4. Find your **Apple Development** certificate. The name format is \`Apple Development: Your Name (TEAMID)\`.
5. Right-click the certificate and select **Get Info**.
6. Click the arrow to expand the **Trust** section.
7. Change **When using this certificate** from the custom setting to **Use System Defaults**.
8. Close the window. macOS can ask for your login password to save the change.
9. Do steps 4 to 8 again for your **Apple Distribution** certificate.

> **NOTE:** **Use System Defaults** tells macOS to use the Apple root certificates and not an override that you set by accident. It is the correct setting for all developer certificates from Apple.

### Allow all applications to access the private key (optional)

Do this task if build tools, CI agents, or codesign utilities cannot get access to the private key.

1. In Keychain Access, expand the certificate to show the **private key** (the key icon).
2. Right-click the private key and select **Get Info**.
3. Go to the **Access Control** tab.
4. Select **Allow all applications to access this item**.
5. Click **Save Changes** and enter your login password.

> **CAUTION:** Access for all applications decreases the security of the private key. The recommended alternative: keep the default setting. When macOS asks for a password during a build, click **Always Allow** for \`codesign\` and \`security\`. This gives access to only these tools.

### Restart Xcode and the Mac (optional)

After you change the trust settings, old caches can still cause problems.

1. Quit Xcode completely (\`Cmd + Q\`).
2. If necessary, restart your Mac to clear all keychain and codesign caches.
3. Open Xcode again and start a build.

## Repair a certificate with Xcode

If a certificate is valid in the portal but Xcode still shows signing errors, use a blank project. The blank project makes Xcode check and repair the certificate chain again.

### Create a blank project

1. Start **Xcode**.
2. Select **File > New > Project**.
3. On the **iOS** (or **macOS**) tab, select **App** and click **Next**.
4. Complete the project details:
   - **Product Name**: \`CertFixApp\` (or a different generic name).
   - **Team**: select the team that has the failing certificate.
   - **Organization Identifier**: for example, \`com.yourcompany\`.
   - **Bundle Identifier**: a unique value, for example \`com.yourcompany.certfix\`.
   - **Interface**: Storyboard.
   - **Language**: Swift.
5. Click **Next**, select a location, and click **Create**.

### Assign the failing certificate

1. In the **Project Navigator** (left panel), click the **project name** at the top (the blue Xcode icon).
2. In the main editor, select your **Target** and open the **Signing & Capabilities** tab.
3. Under **Signing**, set **Team** to the team that has the failing certificate.

**Result:** Xcode tries to find the matching certificate and provisioning profile. It fills the **Signing Certificate** and **Provisioning Profile** fields.

### Start the automatic fix with a build

1. Press \`Cmd + B\` to build the project.
2. If Xcode finds a certificate problem, it shows a banner or an error with 1 of these options:
   - **Automatically manage signing**: select this checkbox if it is clear. Xcode creates or repairs all necessary profiles for you.
   - **Fix Issue**: click this button. Xcode tries to revoke the broken item and create a new replacement automatically.
3. If Xcode asks you to sign in to your Apple ID, sign in.

### Verify in Keychain Access

1. Open **Keychain Access** from Spotlight.
2. Go to the **Certificates** category in the **login** keychain.
3. Find the certificate that failed and make sure that:
   - The trust setting is **Use System Defaults** (no warning triangle).
   - A private key shows under the certificate when you expand it.
4. If the certificate is **expired** or **invalid** (red X icon):
   1. Right-click it and select **Delete** to remove it from the keychain.
   2. Go back to Xcode, select **Signing & Capabilities**, and click **Fix Issue** (or build again). Xcode makes a new certificate through the Apple Developer portal.

> **NOTE:** When Xcode makes a new certificate after you delete the old one, Xcode also makes a new provisioning profile. Install or refresh the profiles on all registered devices again before these devices can run debug builds.

## Use Xcode automatic signing

For most development workflows, automatic signing in Xcode is the easiest method. It is the recommended method for most teams.

1. In **Signing & Capabilities**, select **Automatically manage signing**.
2. Select your **Team**.

**Result:** Xcode does these tasks:

- It creates an Apple Development certificate if there is no certificate.
- It creates a wildcard development provisioning profile, or an explicit profile for the enabled entitlements.
- It refreshes profiles that are near their expiry date.

For distribution (App Store or TestFlight), Xcode requests a Distribution certificate and an App Store provisioning profile when you select **Product > Archive**.

> **NOTE:** Manual signing is better for large teams that share 1 Distribution certificate, for CI/CD pipelines, and for apps with complex entitlements. Examples of complex entitlements: App Extensions, CloudKit, and custom capabilities that Xcode does not manage.

## Remove and replace old certificates and profiles

Certificates expire, private keys get lost, and profiles become old. If old items stay on the Mac, Xcode can use the wrong item. Do these tasks to remove old items and install new replacements.

> **IMPORTANT:** Make sure that you do not need the old certificate or profile. If other team members or CI pipelines use it, speak with them before you revoke or delete it.

### Remove the certificate from Keychain Access

1. Open **Keychain Access** (Spotlight: \`Keychain Access\`).
2. In the left sidebar, select the **login** keychain.
3. Click the **Certificates** category.
4. Find the old certificate (expired, revoked, or to be replaced). Expired and revoked items usually show a **red X icon**.
5. Click the disclosure triangle to expand the certificate. Look for a **private key** under it.
6. Right-click the certificate, select **Delete**, and confirm.
   - If there is a private key, Keychain Access asks if you also want to delete the key. If you are sure that you will not use this certificate again, select **Delete** for the key too.
7. Do these steps again for all duplicates of the same certificate.

> **NOTE:** Old certificates can be in the **System** keychain and also in the **login** keychain. Switch between them in the left sidebar and delete the duplicates from both.

### Revoke the certificate on the Developer Portal

Revoke a certificate to make it invalid on all machines and CI environments.

1. Go to [https://developer.apple.com/account](https://developer.apple.com/account) and select **Certificates, Identifiers & Profiles > Certificates**.
2. Find the old certificate in the list. The portal labels expired certificates **Expired**. Active certificates show an expiry date.
3. Click the certificate to open its detail page.
4. For an active certificate, click **Revoke** and confirm the warning.
   - Expired certificates do not have a **Revoke** button. They are already invalid, so you can ignore them.

**Result:** The certificate is not in the active list of the portal.

> **WARNING:** When you revoke a certificate, all provisioning profiles that include it become invalid immediately. Delete and create these profiles again (see the next task), or let Xcode make them again automatically.

### Delete old profiles from the Developer Portal

1. In the Developer Portal, go to **Certificates, Identifiers & Profiles > Profiles**.
2. Find the profiles that include the old certificate. The portal marks invalid profiles as **Invalid**.
3. Click a profile, click **Delete**, and confirm.
4. Do steps 2 and 3 again for each affected profile.
5. Create replacement profiles immediately. See [Create provisioning profiles](#create-provisioning-profiles).

### Remove profiles from disk

After you delete a profile from the Developer Portal or Xcode, the local copy can stay on disk and cause build problems.

The profile location depends on your Xcode version:

| Xcode version | Profile location |
| --- | --- |
| **Xcode 16 and later** (current) | \`~/Library/Developer/Xcode/UserData/Provisioning Profiles/\` |
| Xcode 15 and earlier (legacy) | \`~/Library/MobileDevice/Provisioning Profiles/\` |

> **NOTE:** Xcode 16 moved the profile storage to the new path. If you use Xcode 16 or later, the folder \`~/Library/MobileDevice/Provisioning Profiles/\` is missing or empty. This is correct. Look in the new path.

Each profile is a \`.mobileprovision\` file with a UUID name (for example, \`3f6a2b1c-...-abc123.mobileprovision\`).

1. Open **Finder**.
2. In the menu bar, select **Go > Go to Folder** (\`Cmd + Shift + G\`).
3. Paste the path for your Xcode version and press **Return**:
   - **Xcode 16 and later**: \`~/Library/Developer/Xcode/UserData/Provisioning Profiles/\`
   - **Xcode 15 and earlier**: \`~/Library/MobileDevice/Provisioning Profiles/\`
4. Identify the profiles. Select a \`.mobileprovision\` file and press \`Space\` for a Quick Look preview. Or run this script in Terminal to list all profiles with their names and expiry dates:

   \`\`\`bash
   # Xcode 16+ path
   PROFILES=~/Library/Developer/Xcode/UserData/Provisioning\\ Profiles
   # Xcode 15 and earlier: uncomment the line below instead:
   # PROFILES=~/Library/MobileDevice/Provisioning\\ Profiles

   for f in "$PROFILES"/*.mobileprovision; do
     echo "--- $f"
     security cms -D -i "$f" 2>/dev/null | grep -E "<key>(Name|ExpirationDate|TeamName)</key>" -A1
   done
   \`\`\`

5. Drag the expired or unwanted \`.mobileprovision\` files to the **Trash**, or delete them in Terminal:

   \`\`\`bash
   # Xcode 16+: remove a specific profile by UUID
   rm ~/Library/Developer/Xcode/UserData/Provisioning\\ Profiles/<UUID>.mobileprovision

   # Xcode 16+: remove ALL profiles (Xcode will re-download valid ones)
   rm ~/Library/Developer/Xcode/UserData/Provisioning\\ Profiles/*.mobileprovision
   \`\`\`

6. Empty the Trash.

> **NOTE:** After you delete local profiles, Xcode gets all valid profiles from the portal again. This occurs the next time that you open a project or start a build. You must be signed in under **Xcode > Settings > Accounts**.

### Remove a certificate in Xcode

Xcode has an interface to manage and refresh certificates and profiles. You do not have to go to the Developer Portal.

1. Open **Xcode > Settings** (\`Cmd + ,\`) and select the **Accounts** tab.
2. Select your **Apple ID** in the left column. Then select the **Team** on the right.
3. Click **Manage Certificates**.
4. A sheet shows all certificates of that team on this Mac. Select the old or problematic certificate.
5. Click the **-** (minus) button at the bottom left of the sheet.
6. Close the sheet.

> **NOTE:** The minus button removes the certificate from Xcode only. It does not delete it from Keychain Access, and it does not revoke it on the portal. To remove it fully, also do [Remove the certificate from Keychain Access](#remove-the-certificate-from-keychain-access) and [Revoke the certificate on the Developer Portal](#revoke-the-certificate-on-the-developer-portal).

### Create a replacement certificate in Xcode

1. In the **Manage Certificates** sheet, click the **+** (plus) button.
2. Select **Apple Development** or **Apple Distribution** from the menu.
3. Close the sheet.

**Result:** Xcode makes a CSR, sends it to the portal, and installs the new certificate in Keychain Access automatically. The new certificate is available for signing.

> **TIP:** When you create certificates in the **Manage Certificates** sheet, you do not need a \`.certSigningRequest\` file. Xcode does all the CSR and installation steps.

### Refresh provisioning profiles in Xcode

1. Open your project in Xcode.
2. Click the **project name** in the Project Navigator, select the **Target**, and open **Signing & Capabilities**.
3. Make sure that **Automatically manage signing** is selected and the correct **Team** is selected.
4. If it shows, click the **refresh arrow** next to the **Provisioning Profile** field. Or start a build (\`Cmd + B\`).

   **Result:** Xcode finds invalid or expired profiles, creates or downloads replacement profiles from the portal, and installs the new \`.mobileprovision\` files locally.

5. If the profiles do not refresh, go to **Xcode > Settings > Accounts**, select your team, and click **Download Manual Profiles**. Xcode gets all valid profiles from the portal and replaces the old local copies.

### Reset all signing items

If the signing state is badly broken (many expired certificates, orphaned profiles, missing private keys), do a full reset. This is the fastest recovery.

1. In **Xcode > Settings > Accounts > Manage Certificates**, click **-** to remove all certificates of the affected team.
2. Delete all local profiles from disk. See [Remove profiles from disk](#remove-profiles-from-disk).
3. Revoke all affected certificates on the Developer Portal. See [Revoke the certificate on the Developer Portal](#revoke-the-certificate-on-the-developer-portal).
4. Delete all invalid profiles from the Developer Portal. See [Delete old profiles from the Developer Portal](#delete-old-profiles-from-the-developer-portal).
5. Go to **Xcode > Settings > Accounts > Manage Certificates** and click **+** to create a new Development certificate, a new Distribution certificate, or both.
6. Open your project, select **Signing & Capabilities**, and make sure that **Automatically manage signing** is on. Build the project (\`Cmd + B\`).

**Result:** Xcode makes new profiles and the full signing chain.

## Configure signing in the project file

Set the signing key and the provisioning profile for each configuration in the \`.csproj\` file. This example also sets the app icon and the alternative app icons.

\`\`\`xml
<Project Sdk="Microsoft.NET.Sdk">
<PropertyGroup Condition="'$(TargetFramework)'=='net10.0-ios' AND '$(Configuration)'=='Debug'">
    <CodesignKey>Apple Development: iPhone Developer</CodesignKey>
    <CodesignProvision>YourDevelopmentProfile</CodesignProvision>
    <Optimize>false</Optimize>
</PropertyGroup>
<PropertyGroup Condition="'$(TargetFramework)'=='net10.0-ios' AND '$(Configuration)'=='Release'">
    <CodesignKey>Apple Distribution: iPhone Distribution</CodesignKey>
    <CodesignProvision>YourDistributionProfile</CodesignProvision>
    <Optimize>true</Optimize>
</PropertyGroup>
<PropertyGroup>
    <AppIcon>AppIcon</AppIcon>
</PropertyGroup>
<ItemGroup>
    <AlternativeAppIcon Include="AlternativeAppIcons" />
</ItemGroup>
<ItemGroup>
    <MauiXaml Update="Views\\MainPage.xaml">
        <Generator>MSBuild:Compile</Generator>
    </MauiXaml>
</ItemGroup>
</Project>
\`\`\`

## Checklist

Use this checklist when you set up signing for the first time, set up a new Mac, or replace old certificates.

### Apple Developer Portal

- [ ] Signed in to developer.apple.com with the correct Apple ID
- [ ] Apple Development certificate created and downloaded
- [ ] Apple Distribution certificate created and downloaded
- [ ] App Identifier (Bundle ID) registered
- [ ] Test devices registered (for Development or Ad Hoc)
- [ ] Development provisioning profile created and downloaded
- [ ] App Store (or Ad Hoc) provisioning profile created and downloaded

### Keychain Access on your Mac

- [ ] Development \`.cer\` installed (private key shows under it)
- [ ] Distribution \`.cer\` installed (private key shows under it)
- [ ] Both certificates set to **Use System Defaults** trust
- [ ] No expired or revoked certificates for the same team

### Xcode

- [ ] Signed in to the Apple ID in **Xcode > Settings > Accounts**
- [ ] Correct team selected in **Signing & Capabilities**
- [ ] Provisioning profiles visible under **Xcode > Settings > Accounts > Manage Certificates**
- [ ] Project builds without signing errors (\`Cmd + B\`)
- [ ] Archive is successful for distribution (**Product > Archive**)

## Troubleshooting

### No signing certificate found

- Make sure that the certificate is in the **login** keychain, not in the **System** keychain.
- Make sure that the private key shows under the certificate.
- Download the \`.cer\` file from the Developer Portal again and double-click it to install it.

### Certificate has been revoked

- A person in the team revoked the certificate in the Developer Portal.
- Delete the old certificate from the keychain. Then create and download a new one.

### Provisioning profile does not include signing certificate

- The profile uses a different certificate. Create a new profile that includes your certificate. Or add your certificate to the portal and generate the profile again.

### Your account already has a valid distribution certificate

- A team can have only 1 Apple Distribution certificate. On the Mac that has the certificate, export it as a \`.p12\` file. Import the file on your Mac.

### Missing private key (gray certificate)

- The certificate was installed on a different Mac without its private key.
- On the original Mac, export a \`.p12\` file (certificate and private key). Import the file on your Mac.

### codesign wants to access key during a build

- Click **Always Allow** to give \`codesign\` permanent access to the private key.
- If the prompt closes before you can click, open Keychain Access. Right-click the private key, select **Get Info > Access Control**, and add \`/usr/bin/codesign\` manually.

### Expired certificate

- Distribution certificates and Development certificates are valid for 1 year.
- Make a new certificate with the same procedure: create a CSR, create a new certificate in the portal, then download and install it.
- Update or generate again all provisioning profiles that use the expired certificate.

## Related links

- [Apple Account Management (.NET MAUI docs)](https://learn.microsoft.com/en-us/dotnet/maui/ios/apple-account-management)
- [Apple Developer account](https://developer.apple.com/account)
- [How to create a .p12 file (YouTube)](https://youtu.be/jq42brrSg28)
- [How to renew an iOS distribution or development certificate (YouTube)](https://youtu.be/v19ZoFa1cJs)
- [.NET MAUI DevOps, CI/CD, and environment setup](doc:maui-cheatsheet-devops)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
`;export{e as default};