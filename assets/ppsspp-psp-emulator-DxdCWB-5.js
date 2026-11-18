var e=`---
title: PPSSPP PSP emulator guide
summary: Install PPSSPP, get PSP games, and set up graphics, controllers, and wireless multiplayer for the PlayStation Portable emulator.
category: Systems and setup
order: 50
---

# PPSSPP PSP emulator guide

PPSSPP is a PlayStation Portable (PSP) emulator. It plays PSP games in high definition on Android, iOS, Windows, and macOS.

## Before you start

| Item | Value |
| --- | --- |
| Platforms | Android, iOS, Windows, macOS |
| Game file formats | \`.iso\`, \`.cso\`, \`.pbp\` |
| Multiplayer | Two devices on the same Wi-Fi network |

## Get PPSSPP

Use these official sources for a safe installation and the latest development builds:

| Name | Link | Notes |
| --- | --- | --- |
| Official website | [ppsspp.org](https://www.ppsspp.org) | |
| Source code | [PPSSPP GitHub repository](https://github.com/hrydgard/ppsspp) | Read the README and follow updates. |
| Android | [Google Play Store](https://play.google.com/store/apps/details?id=org.ppsspp.ppsspp) | |
| iOS | [Apple App Store](https://apps.apple.com/us/app/ppsspp-psp-emulator/id6496972903) | |

The Gold version has the same performance as the free version. It supports the developers and has a gold icon.

## Get games

The emulator does not include games. You need game files in \`.iso\` or \`.cso\` format.

| Source | Description |
| --- | --- |
| Dump your own discs | Use a PSP with custom firmware to rip your physical UMD discs. This is the legal method. |
| Homebrew store | Get free, community-made indie games in the **Homebrew & Demos** tab of the app. |
| Online archives | For game backups, use trusted community repositories, for example the [Internet Archive (PSP ISO section)](https://web.archive.org/web/20260000000000*/PSP%20ISO) or [Romsfun](https://romsfun.com/). |

> **NOTE:** Verify the Internet Archive link. It opens a Wayback Machine URL search, not an Internet Archive collection.

> **WARNING:** Do not download files that end in \`.exe\` or \`.apk\`. Use only \`.iso\`, \`.cso\`, or \`.pbp\` files.

## Set up the graphics

These settings make games look better than on the original hardware.

1. Go to **Settings > Graphics**. Set **Rendering backend** to **Vulkan** (best for Android and Windows) or **Metal** (iOS and macOS).
2. Set **Rendering resolution** to **2x PSP** or **3x PSP** for a sharp image that is similar to 1080p. If your device is fast, try **5x PSP** or higher.
3. Go to **Texture Scaling**. Set **Upscale level** to **2x** or **3x**.
4. Set **Upscale type** to **xBRZ** or **Hybrid** for smoother edges.
5. Set **Anisotropic filtering** to **16x**. This keeps textures sharp at steep view angles.

## Set up the controls

### Touch controls

| Task | Procedure |
| --- | --- |
| Change the layout | Go to **Settings > Controls > Edit touch control layout**. Drag the buttons to new positions or change their size. |
| Turn off the touch controls | If you use a physical controller, go to **Settings > Controls** and clear **On-screen touch controls**. |

### Wireless controller

These steps use the Mobile Controller D3 as an example.

1. Put the controller in pairing mode. For many mobile controllers (for example, the D3), push and hold the **B** (or **O**) button and the **Power** button at the same time.
2. Connect to the controller in the Bluetooth settings of your phone.
3. In PPSSPP, go to **Settings > Controls > Control Mapping**.
4. Tap **Auto Configure**.

   **Result:** PPSSPP maps the wireless controller.

## Play wireless multiplayer (ad hoc)

Use these steps to play with a friend on the same Wi-Fi network.

1. On both devices, go to **Settings > Networking**.
2. Select **Enable networking/WLAN**.
3. Select one player as the host. Find the IP address of the host in the Wi-Fi settings of the phone.
4. On both devices, type the IP address of the host in the **Change PRO ad hoc server IP address** field.
5. Make sure that the two players have different MAC addresses. Tap the **MAC address** setting to make a random value.

## Related links

- [PPSSPP official website](https://www.ppsspp.org)
- [PPSSPP GitHub repository](https://github.com/hrydgard/ppsspp)
- [PPSSPP on Google Play](https://play.google.com/store/apps/details?id=org.ppsspp.ppsspp)
- [PPSSPP on the Apple App Store](https://apps.apple.com/us/app/ppsspp-psp-emulator/id6496972903)
`;export{e as default};