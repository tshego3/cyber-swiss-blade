var e=`---
title: Enable the D365 F&O extension in Visual Studio
summary: Install the Dynamics 365 Finance and Operations development extension in Visual Studio from a service update package in LCS.
category: Dynamics 365
order: 140
---

# Enable the D365 F&O extension in Visual Studio

This procedure installs the Dynamics 365 Finance and Operations (D365 F&O) extension in Visual Studio from a service update package. It is based on [Adding D365 FO extension to Visual Studio for development](https://www.linkedin.com/pulse/adding-d365-fo-extension-visual-studio-development-shayan-arshi/). For the Unified Developer Experience, refer to [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience).

## Before you start

- Install **Visual Studio** before you do these steps.
- Install these .NET Framework targeting packs:
  - .NET Framework 4.5.2 targeting pack
  - .NET Framework 4.6.2 targeting pack
  - **.NET Framework 4.6 targeting pack**
- An account for Microsoft Dynamics Lifecycle Services (LCS).

> **NOTE:** Dated (checked November 2026): .NET Framework 4.5.2, 4.6, and 4.6.1 reached end of support on 26 April 2022. Visual Studio 2017 and 2019 do not support current F&O tools: the \`17.0\` files in this procedure are for Visual Studio 2022, and from Platform Update 75 only Visual Studio 2026 is supported. For new environments, Microsoft moves X++ development to the Unified Developer Experience, which installs the extension from Visual Studio. Refer to [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience).

## Download the service update

1. Log in to **Microsoft Dynamics Lifecycle Services (LCS)**.
2. On the main page, find the **Shared Asset Library**.
3. In the list of submenus, select **Software Deployment Package**.
4. Find the latest **Service Update** and download it.

## Find the installer

1. Unzip the downloaded folder.
2. Go to this folder:

   \`\`\`text
   ServiceUpdate\\DevToolsService\\Scripts
   \`\`\`

3. Find these files:

   \`\`\`text
   Microsoft.Dynamics.Framework.Tools.Installer.17.0.vsix
   Microsoft.Dynamics.Framework.Tools.InternalDevTools.17.0.vsix
   \`\`\`

## Install the extension

1. Open the \`.vsix\` file and follow the wizard.
2. Select the applicable Visual Studio version (Visual Studio 2019/2017 or another supported version).

**Result:** Visual Studio shows the D365 extension for Finance and Operations.

## Related links

- [Adding D365 FO extension to Visual Studio for development](https://www.linkedin.com/pulse/adding-d365-fo-extension-visual-studio-development-shayan-arshi/)
- [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience)
- [D365 F&O development processes](doc:d365-fo-development-processes)
`;export{e as default};