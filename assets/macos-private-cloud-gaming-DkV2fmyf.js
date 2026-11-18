var e=`---
title: Private cloud gaming on macOS 15
summary: Connect from macOS 15 to a Windows 11 Pro PC with Remote Desktop, and stream games with Sunshine and Moonlight.
category: Systems and setup
order: 40
---

# Private cloud gaming on macOS 15

This guide connects a macOS 15 (Sequoia) computer to a Windows 11 Pro PC in two ways. Use Remote Desktop for a stable desktop connection, also when the Windows Pro host is unlicensed. Use Sunshine and Moonlight to stream games from a PC with a GeForce GPU.

## Before you start

| Item | Requirement |
| --- | --- |
| Host | Windows 11 Pro PC (a GeForce GPU for game streaming) |
| Client | macOS 15 (Sequoia) |
| Remote Desktop client | **Windows App** (previously Microsoft Remote Desktop) from the Mac App Store |
| Streaming software | Sunshine on the host, Moonlight on the client |
| Network | Both devices on the same network, or a virtual LAN for streaming over the internet |

> **NOTE:** Dated (checked November 2026): Microsoft renamed the Microsoft Remote Desktop app for macOS to Windows App in September 2024.

## Turn on Remote Desktop on Windows

1. Open **Settings > System > Remote Desktop**.
2. Turn on **Enable Remote Desktop** and confirm.
3. Click **Select users that can remotely access this PC**. If necessary, add your Windows user name.

## Open the firewall for Remote Desktop

1. Open **Control Panel > System and Security > Windows Defender Firewall > Allow an app or feature through Windows Defender Firewall**.
2. Make sure that **Remote Desktop** is selected for the **Private** and **Public** profiles.
3. For more control, open **Windows Defender Firewall with Advanced Security** and select **Inbound Rules**.
4. Find these rules:
   - **Remote Desktop - User Mode (TCP-In)**, port 3389
   - **Remote Desktop - User Mode (UDP-In)**, port 3389
5. For each rule, do these steps:
   1. Double-click the rule.
   2. Go to the **Advanced** tab.
   3. Under **Edge traversal**, select **Allow edge traversal**.
   4. Click **OK**.

## Verify the Remote Desktop service

1. Open **Services**. Make sure that **Remote Desktop Services** (TermService) has the startup type **Automatic** and the status **Running**.
2. In a Command Prompt that runs as Administrator, run this command:

   \`\`\`cmd
   netstat -an | find "3389"
   \`\`\`

   **Result:** The output shows \`LISTENING\` on \`0.0.0.0:3389\` (TCP) and an active UDP 3389 port.

## Allow connections without a password (optional)

By default, Windows requires a password for Remote Desktop (RDP) connections. This is a built-in security measure. If you connect without a password, for example from the Windows App on macOS 15, the login can fail or Windows can block the access.

> **WARNING:** These changes decrease security. Use them only in trusted environments. Make all the changes on the Windows host.

### With Local Group Policy Editor

1. Open \`Local Group Policy Editor\` (\`gpedit.msc\`).
2. Go to \`Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options\`.
3. Find **Accounts: Limit local account use of blank passwords to console logon only** and set it to **Disabled**.

### With Registry Editor

If Group Policy is not available, use the registry:

1. Open \`regedit\`.
2. Go to \`HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Lsa\`.
3. Set \`LimitBlankPasswordUse\` to \`0\`.

### On macOS 15

The Windows App can save credentials in the macOS Keychain. But it still needs a valid password to connect.

## Improve Remote Desktop graphics (optional)

1. Apply the UpinelBetterRDP registry file. It turns on 60 FPS, GPU acceleration, and RemoteFX improvements.
2. In Local Group Policy Editor, go to \`Computer Configuration > Administrative Templates > Windows Components > Remote Desktop Services > Remote Desktop Session Host > Remote Session Environment\`.
3. Enable **Use hardware graphics adapters for all Remote Desktop Services sessions**.
4. To get frame rates above 30 FPS, go to \`HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\WinStations\`. Create the DWORD value \`DWMFRAMEINTERVAL\` and set it to 15 (decimal). This sets the limit to 60 FPS.

> **NOTE:** Dated (checked November 2026): Microsoft removed RemoteFX vGPU from Windows (disabled in 2020, removed in 2021). RemoteFX vGPU settings in the registry file have no effect on Windows 11. GPU acceleration comes from the **Use hardware graphics adapters** policy.

## Set up the Windows App on macOS

1. Download **Windows App** from the Mac App Store.
2. Open the app and click **Add PC**.
3. In **PC name**, type the IP address or host name of the Windows host (for example, \`192.168.1.16\`).
4. In **User account**, click **Add User Account**. Type your Windows credentials.

## Give local network permission on macOS

macOS 15 has stricter rules for local network access.

1. Open **System Settings > Privacy & Security > Local Network**.
2. Find **Windows App** (**Microsoft Remote Desktop** in older versions). Turn it **Off**, wait a few seconds, then turn it **On**.
3. Quit and start Windows App again to refresh the permissions.

## Install Sunshine on the Windows host

1. Download the latest version of Sunshine from the [Sunshine GitHub releases page](https://github.com/LizardByte/Sunshine/releases).
2. Run the installer. If the installer asks, restart the PC.

## Configure Sunshine

1. Start Sunshine and open its web interface at \`https://localhost:47990\`.
2. Create a user name and a password for secure access.
3. On the **Applications** tab, add the games or applications that you want to stream.
4. Use these encoder settings for a GeForce GPU:

   | Setting | Value |
   | --- | --- |
   | NVENC Preset | Low Latency High Performance (llhp) |
   | Rate Control | CBR |
   | Encoder | Auto |
   | HEVC Support | Enabled (if the client supports it) |

   > **NOTE:** Dated (checked November 2026): Current Sunshine versions use the NVENC presets P1 (fastest) to P7 (best quality) in place of \`llhp\`. Use P1 for the lowest latency.

## Optimize the host graphics settings

1. Open NVIDIA Control Panel and set **V-Sync** to **Fast**.
2. Limit the frame rate to the refresh rate of the client (for example, 60 or 120 FPS). Use RTSS or the settings in the game.
3. Turn off **Hardware-accelerated GPU scheduling**. Go to **Graphics Settings > Change default graphics settings** and turn off the option.

## Install Moonlight on macOS

1. Download Moonlight for macOS from the [Moonlight releases page](https://github.com/moonlight-stream/moonlight-qt/releases).
2. Start the app and allow the necessary permissions (network, microphone, and other permissions).

## Pair Moonlight with Sunshine

1. Make sure that the two devices are on the same network.
2. Moonlight usually finds the host automatically. If it does not, type the IP address of the host manually.
3. Moonlight shows a PIN. Type the PIN in the Sunshine web interface to complete the pairing.

## Configure the Moonlight stream

In the Moonlight settings, use these values:

| Setting | Value |
| --- | --- |
| Resolution | The resolution of the Mac display (for example, 1920x1080 or 2560x1440) |
| Frame Rate | 60 or 120 FPS |
| Bitrate | Start at 30 Mbps and change it for the performance that you get |
| Video Codec | HEVC (if the Mac supports it) |
| Frame Pacing | Prefer lowest latency |

## Stream over the internet (optional)

To stream from a remote location, do one of these steps:

- Enable **UPnP** in your router, or forward the Sunshine ports manually. The defaults are TCP 47984, 47989, and 48010, and UDP 47998, 47999, 48000, 48002, and 48010. Do not forward TCP 47990: it is the Sunshine web interface.
- Use **ZeroTier** or **Tailscale** to make a virtual LAN between the devices.

## Troubleshooting

| Error code | Symptom | Typical causes | Fixes |
| --- | --- | --- | --- |
| 0x104 | "We couldn't connect ... PC can't be found." | The network is not reachable. The IP address or host name is wrong. macOS privacy settings block the app. | Ping the host from the Mac. Check the IP address or host name again. Turn the Local Network permission off and on. Turn off VPNs and proxies. |
| 0x407 | "Connection was lost before ... Authentication" or "Refused." | The firewall blocks port 3389. The RDP service is stopped. DNS resolves the wrong address. | Open TCP and UDP port 3389 and allow edge traversal. Restart the Remote Desktop service. Flush the macOS DNS cache. |

### Error 0x104

1. In Terminal on the Mac, run these commands:

   \`\`\`bash
   ping <Windows-IP>
   nc -zv <Windows-IP> 3389
   nc -zv -u <Windows-IP> 3389
   \`\`\`

   **Result:** The host replies and the ports are open.

2. Turn off all VPNs and proxies.

### Error 0x407

1. On Windows, restart **Remote Desktop Services**.
2. On the Mac, flush the DNS cache:

   \`\`\`bash
   sudo killall -HUP mDNSResponder
   \`\`\`

3. Make sure that the firewall rules allow TCP and UDP port 3389 with edge traversal.

### General tips

- Give the Windows host a static IP address, or reserve its address in DHCP, so that the address does not change.
- You can use other macOS clients, for example **Royal TSX** or **Jump Desktop**.
- Keep the two operating systems updated to the latest builds.

## Related links

- [Sunshine releases](https://github.com/LizardByte/Sunshine/releases)
- [Moonlight releases](https://github.com/moonlight-stream/moonlight-qt/releases)
`;export{e as default};