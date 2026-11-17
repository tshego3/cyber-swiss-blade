---
title: .NET MAUI guide: Fix SSH pairing with macOS from Visual Studio
summary: Fix the Visual Studio pair-to-Mac SSH connection when newer macOS releases reject the legacy ssh-rsa algorithms.
category: .NET MAUI
order: 260
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI guide: Fix SSH pairing with macOS from Visual Studio

Use this guide if Visual Studio on Windows cannot pair with a Mac over SSH, but Remote Login is on for all users. Recent macOS releases, for example Sequoia and Ventura, have newer OpenSSH builds that disable legacy algorithms. RSA signatures with SHA-1 are off by default. The Mac can reject the Visual Studio connection, which often expects these older algorithms, although the configuration looks correct.

## Before you start

Install these items on the Mac:

| Item | How to install |
| --- | --- |
| Xcode | Install it from [the App Store](https://apps.apple.com/us/app/xcode/id497799835). After the installation, open Xcode manually so that it can add more components. |
| Mono | Install it from [mono-project.com](https://www.mono-project.com). |
| Rosetta | Run `softwareupdate --install-rosetta` or `/usr/sbin/softwareupdate --install-rosetta` in Terminal. |

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin on 1 May 2024, and the Mono project moved to WineHQ in 2024. Pair to Mac for .NET MAUI needs Xcode and installs the .NET SDK on the Mac, so you do not need Mono for .NET MAUI. Install Mono only for old Xamarin projects.

## Check Remote Login and the firewall

1. On the Mac, open **System Settings** (or **System Preferences**) and go to **Sharing**.
2. Make sure that **Remote Login** is on and that it gives access to the correct user accounts.
3. Make sure that the firewall does not block incoming connections on port 22 (the default SSH port).

## Allow the legacy algorithms

Sequoia has an OpenSSH 9.x version. To see the version on your Mac, run `ssh -V`. Allow the older algorithms that Visual Studio uses.

1. Open Terminal on the Mac and open the SSH daemon configuration:

   ```bash
   sudo nano /etc/ssh/sshd_config
   ```

2. Add these lines at the end of the file:

   ```text
   HostkeyAlgorithms +ssh-rsa
   PubkeyAcceptedAlgorithms +ssh-rsa
   ```

3. Save the file. In nano, press **Ctrl+O** to write and **Ctrl+X** to exit.

## Restart the SSH service

1. Unload and load the SSH daemon to apply the changes:

   ```bash
   sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist
   sudo launchctl load -w /System/Library/LaunchDaemons/ssh.plist
   ```

2. As an alternative, restart the Mac.

## Test the connection

1. Before you try Visual Studio again, connect to the Mac from another computer with an SSH client. On Windows, you can use PuTTY or Windows Subsystem for Linux.

   ```bash
   ssh your_username@your_mac_ip
   ```

   **Result:** If you can log in, the Mac accepts SSH connections.

## Update Visual Studio and the workloads

1. Update Visual Studio on Windows to the latest version. Microsoft releases updates that fix connection and compatibility problems with the latest macOS releases.
2. Update the related workloads on Windows, for example the Xamarin or MAUI build workloads. This fixed similar problems in some cases. Xamarin is out of support, so use the .NET MAUI workload for current projects.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Pairing from Visual Studio still fails after the steps above. | Clear the cached SSH host keys on the Windows computer. Make sure that the network does not isolate the Windows computer from the Mac. |
| The connection still fails. | The internal SSH client of Visual Studio (or the way it starts SSH for pairing) can be the cause. Repair or reinstall Visual Studio, or the iOS build components, to remove old settings. |
