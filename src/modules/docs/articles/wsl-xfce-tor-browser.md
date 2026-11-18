---
title: WSL, Tor Browser, and Firefox on Windows 11 for a standard user
summary: Set up an isolated WSL 2 Ubuntu distribution with Tor Browser and Firefox as a standard Windows 11 user, with no UAC prompt.
category: Systems and setup
order: 10
---

# WSL, Tor Browser, and Firefox on Windows 11 for a standard user

This guide sets up an Ubuntu distribution in WSL 2 that runs Tor Browser and Firefox. The distribution gets internet, display, and audio output. It gets no other access to the host. A standard Windows user does all the steps, and no UAC prompt shows after the [one-time admin setup](#one-time-admin-setup-it).

## Before you start

| Item | Value |
| --- | --- |
| Document version | 2.3 (2026-10-12) |
| Windows | Windows 11 23H2 or later |
| WSL | WSL 2.x |
| Distribution | Ubuntu 24.04 LTS |
| Privilege | Standard Windows user. No UAC prompt after the [one-time admin setup](#one-time-admin-setup-it). |
| Goal | The Linux distribution gets internet, display, and audio output. It gets no other access to the host. |

## Safety and threat model

> **WARNING:** WSL is not a sandbox and is not Tails. The Windows host can see all activity in the distribution. If the host is compromised or monitored, this setup gives no anonymity.

> **WARNING:** Get written approval before you use Tor on a company device or network. Endpoint and network monitoring records Tor connections. Use without approval can break company policy.

> **WARNING:** Firefox traffic does not go through Tor. Firefox shows your real public IP address.

### Host access channels

WSL 2 cannot remove all access to the host. The table shows each channel and its status after this guide.

| Channel | Direction | Status | Control |
| --- | --- | --- | --- |
| Windows drives (`C:` and others) | Linux to host | Blocked | Automount off. Daily user has no root. |
| Windows programs (interop) | Linux to host | Blocked | Interop off. Windows PATH off. |
| Host network: Windows host, LAN, VPN, private ranges | Linux to host | Blocked | Linux firewall (nftables). Optional Hyper-V firewall rule ([host-enforced network block](#host-enforced-network-block-optional)). |
| Host DNS and host proxy | Linux to host | Blocked | DNS tunneling off. Auto proxy off. Public DNS only. |
| Host data copied in: `hosts` file, computer name | Host to Linux | Blocked | `generateHosts` off. Fixed host name. |
| Linux ports on Windows `localhost` | Host to Linux | Blocked | Localhost forwarding off. Firewall drops inbound. |
| Host GPU driver (`/dev/dxg`, `/usr/lib/wsl`) | Linux to host | Blocked for daily user | Boot script. |
| Other WSL distributions (`/mnt/wsl`) | Linux to Linux | Blocked | Boot script. |
| Internet | Linux to internet | **Open** | Necessary. |
| Display (WSLg) | Linux to host | **Open** | Necessary for browser windows. |
| Audio output (WSLg) | Linux to host | **Open** | Necessary for audio. |
| Microphone and camera | Host to Linux | Blocked in browsers | Browser policy. |
| Clipboard (WSLg) | Both | **Open** | Procedure only ([Use the browsers](#use-the-browsers)). |
| Hyper-V sockets (WSL control) | Both | **Open** | Necessary for WSL. Risk from WSL service or kernel exploits. |
| Host reads distribution disk and memory | Host to Linux | **Open** | Cannot be blocked. |

> **CAUTION:** Linux root can undo all controls inside Linux. The daily user has no root. A Windows user can start the distribution as root with `wsl -u root`. No password is necessary.

If you need strong anonymity, use Tails (boot from USB) or Whonix.

## Privilege matrix

| Task | Windows admin (UAC) necessary |
| --- | --- |
| Turn on virtualization in UEFI | Yes. Physical access and firmware password. |
| Turn on the Virtual Machine Platform feature | Yes. One time. See [One-time admin setup](#one-time-admin-setup-it). |
| Install the WSL package | Yes, usually. One time. See [One-time admin setup](#one-time-admin-setup-it). |
| Optional Hyper-V firewall rule | Yes. One time. See [One-time admin setup](#one-time-admin-setup-it). |
| Import a distribution (`wsl --import`) | No |
| Edit `%USERPROFILE%\.wslconfig` | No |
| Edit `/etc/wsl.conf`, firewall, install packages | No. Uses Linux root, not UAC. |
| Install Tor Browser in the Linux home folder | No |
| `wsl --terminate`, `--shutdown`, `--export`, `--unregister` | No |

> **NOTE:** Linux root (`wsl -u root`) is not the same as Windows admin. It does not cause a UAC prompt.

## Check the prerequisites

Do these checks in a standard PowerShell window. Do not use "Run as administrator".

1. Show the WSL version:

   ```powershell
   wsl --version
   ```

   Make sure that the output shows `WSL version: 2.x` or later.

2. Show the state of the Virtual Machine Platform feature:

   ```powershell
   (Get-CimInstance Win32_OptionalFeature -Filter "Name='VirtualMachinePlatform'").InstallState
   ```

   Make sure that the output is `1` (enabled).

3. If a check fails, stop. Send the [one-time admin setup](#one-time-admin-setup-it) to your IT administrator.
4. If the output shows that policy disables WSL, stop. Speak to your IT administrator.

## Get and examine the Ubuntu image

> **CAUTION:** Download the image only from Canonical. Do not use mirrors or third-party sites.

1. Go to [https://releases.ubuntu.com/noble/](https://releases.ubuntu.com/noble/). This folder always contains the latest Ubuntu 24.04 LTS point release.
2. Download the WSL image. The file name has the format `ubuntu-24.04.N-wsl-amd64.wsl`. Use the highest `N`.
3. Download `SHA256SUMS` from the same page ([https://releases.ubuntu.com/noble/SHA256SUMS](https://releases.ubuntu.com/noble/SHA256SUMS)). Save it in the same folder as the image.
4. Set the file paths. Change the image name to the real file name:

   ```powershell
   $Image = "$env:USERPROFILE\Downloads\ubuntu-24.04.5-wsl-amd64.wsl"
   $Sums  = "$env:USERPROFILE\Downloads\SHA256SUMS"
   ```

5. Compare the hashes:

   ```powershell
   $Leaf     = [regex]::Escape((Split-Path $Image -Leaf))
   $Expected = (Select-String -Path $Sums -Pattern "[ *]$Leaf$" | Select-Object -First 1).Line -split '\s+' | Select-Object -First 1
   $Actual   = (Get-FileHash -Algorithm SHA256 -Path $Image).Hash.ToLower()
   if ($Expected -and $Actual -eq $Expected) { 'HASH OK' } else { 'HASH MISMATCH - STOP' }
   ```

6. If the output is `HASH MISMATCH - STOP`, delete the image. Do not continue.

> **NOTE:** For high assurance, also examine [https://releases.ubuntu.com/noble/SHA256SUMS.gpg](https://releases.ubuntu.com/noble/SHA256SUMS.gpg) with the Ubuntu image signing key.

> **NOTE:** This page has `amd64` images only. For an `arm64` device, get the image and its `SHA256SUMS` from [https://cdimage.ubuntu.com/](https://cdimage.ubuntu.com/).

## Import the distribution

1. Set the variables. The folder is in your user profile, so admin rights are not necessary:

   ```powershell
   $Distro = 'TorBox'
   $Target = "$env:LOCALAPPDATA\WSL\$Distro"
   New-Item -ItemType Directory -Force -Path $Target | Out-Null
   ```

2. Import the image:

   ```powershell
   wsl --import $Distro $Target $Image --version 2
   ```

3. Make sure that `TorBox` shows in the list with `VERSION 2`:

   ```powershell
   wsl --list --verbose
   ```

> **NOTE:** If `wsl --import` does not accept the `.wsl` file, use this command. It needs a recent WSL version: `wsl --install --from-file $Image --name $Distro --location $Target`

> **CAUTION:** Do not put the distribution in a OneDrive folder. Sync can corrupt the virtual disk. Sync also copies the data to the cloud.

## Configure the distribution

Do these steps as Linux root.

> **CAUTION:** Make sure that the prompt shows `root@` and ends in `#`. If it shows `tbuser@` and `$`, the commands fail. Start the root shell in step 1.

1. Start a root shell:

   ```powershell
   wsl -d TorBox -u root
   ```

2. Update the packages:

   ```bash
   apt update && apt full-upgrade -y
   ```

3. Create the daily user `tbuser`. This user has no password and no `sudo`:

   ```bash
   id tbuser >/dev/null 2>&1 || useradd --create-home --shell /bin/bash --user-group tbuser
   gpasswd -d tbuser sudo 2>/dev/null || true
   ```

   > **NOTE:** Use `wsl -d TorBox -u root` for all admin tasks. A browser exploit then cannot use `sudo` to get root and remove the firewall.

4. Install only the necessary packages:

   ```bash
   apt install -y --no-install-recommends \
     ca-certificates curl gnupg dirmngr xz-utils nftables iproute2 \
     libgtk-3-0t64 libdbus-glib-1-2 libx11-xcb1 libxt6t64 \
     libasound2t64 libpulse0 fonts-dejavu-core
   ```

   > **NOTE:** The `t64` package names are for Ubuntu 24.04. For Ubuntu 22.04, remove `t64` from the names.

   > **CAUTION:** Do not install the `pulseaudio` server. WSLg supplies the audio server. A second server can stop the audio.

   > **NOTE:** Do not install XFCE or another desktop. WSLg shows each Linux application as a Windows window. A desktop adds packages and attack surface, but no function.

Stay in the root shell for the next section.

## Configure host isolation

Do these steps as Linux root.

> **CAUTION:** Make sure that the prompt shows `root@` and ends in `#`. If it shows `tbuser@` and `$`, type `exit`. Then run `wsl -d TorBox -u root`.

1. Make a copy of the current `/etc/wsl.conf`. Then write the new file:

   ```bash
   cp -a /etc/wsl.conf /etc/wsl.conf.orig 2>/dev/null || true
   cat > /etc/wsl.conf <<'EOF'
   # Do not mount Windows drives (C:, D:, ...) in /mnt
   [automount]
   enabled = false
   mountFsTab = false

   # Do not start Windows programs from Linux. Do not add the Windows PATH.
   [interop]
   enabled = false
   appendWindowsPath = false

   # Do not copy the Windows hosts file, DNS settings or computer name
   [network]
   hostname = torbox
   generateHosts = false
   generateResolvConf = false

   # Start as the user with no admin rights
   [user]
   default = tbuser

   # No init system. Run the isolation script as root at each start.
   [boot]
   systemd = false
   command = /usr/local/sbin/torbox-boot.sh
   EOF
   ```

2. Write the DNS and hosts files. They use public DNS (Quad9), not the Windows host:

   ```bash
   rm -f /etc/resolv.conf
   printf 'nameserver 9.9.9.9\nnameserver 149.112.112.112\n' > /etc/resolv.conf
   printf '127.0.0.1 localhost\n127.0.1.1 torbox\n::1 localhost ip6-localhost ip6-loopback\n' > /etc/hosts
   ```

   > **NOTE:** If the company network blocks public DNS, Firefox cannot find websites. Tor Browser does not use local DNS. Speak to your IT administrator.

3. Write the firewall rules. The rules allow the public internet only:

   ```bash
   cat > /etc/nftables.conf <<'EOF'
   #!/usr/sbin/nft -f
   # TorBox firewall: public internet only. No host, LAN or VPN access.
   flush ruleset

   table inet torbox {
       # Private, local and special IPv4 ranges.
       # The Windows host, WSL NAT gateway, WSL DNS tunnel, LAN and VPN are in these ranges.
       set no_go_v4 {
           type ipv4_addr
           flags interval
           elements = {
               0.0.0.0/8, 10.0.0.0/8, 100.64.0.0/10, 169.254.0.0/16,
               172.16.0.0/12, 192.0.0.0/24, 192.168.0.0/16, 198.18.0.0/15,
               224.0.0.0/4, 240.0.0.0/4
           }
       }

       # No inbound connections. Replies to outbound connections only.
       chain input {
           type filter hook input priority filter; policy drop;
           iif "lo" accept
           ct state established,related accept
       }

       chain forward {
           type filter hook forward priority filter; policy drop;
       }

       # Outbound: loopback and public IPv4 only. No IPv6.
       chain output {
           type filter hook output priority filter; policy drop;
           oif "lo" accept
           meta nfproto ipv6 reject
           ip daddr @no_go_v4 counter reject
           meta nfproto ipv4 accept
       }
   }
   EOF
   chmod 0644 /etc/nftables.conf
   nft -c -f /etc/nftables.conf && echo "RULES OK"
   ```

   Make sure that the output shows `RULES OK`.

4. Write the boot script:

   ```bash
   cat > /usr/local/sbin/torbox-boot.sh <<'EOF'
   #!/bin/sh
   # TorBox boot script. WSL runs it as root at each start ([boot] command in /etc/wsl.conf).

   # 1. Load the firewall. If it fails, turn off the network (fail closed).
   if ! /usr/sbin/nft -f /etc/nftables.conf; then
       for i in /sys/class/net/*; do
           [ "${i##*/}" = lo ] || ip link set "${i##*/}" down
       done
   fi

   # 2. Stop access to the host GPU driver for users other than root.
   [ -e /dev/dxg ] && chmod 000 /dev/dxg

   # 3. Remove the read-only host driver mounts and the mount shared with other distributions.
   for m in /usr/lib/wsl/drivers /usr/lib/wsl/lib /mnt/wsl; do
       mountpoint -q "$m" && umount -l "$m"
   done

   # 4. Remove empty drive folders (/mnt/c ...) that stay from the first start. rmdir removes empty folders only.
   for d in /mnt/[a-z]; do
       mountpoint -q "$d" || rmdir "$d" 2>/dev/null
   done

   exit 0
   EOF
   chown root:root /usr/local/sbin/torbox-boot.sh
   chmod 0755 /usr/local/sbin/torbox-boot.sh
   ```

   > **NOTE:** Without `/dev/dxg`, the browsers use software rendering. This is correct. It removes the host GPU driver from the attack surface.

5. Close the root shell:

   ```bash
   exit
   ```

## Configure WSL on Windows and test the isolation

> **CAUTION:** `%USERPROFILE%\.wslconfig` applies to all WSL 2 distributions of your Windows user. Read the current file before you change it. If it has other settings, merge them manually.

1. Make a copy of the current file:

   ```powershell
   $Cfg = "$env:USERPROFILE\.wslconfig"
   if (Test-Path $Cfg) { Copy-Item $Cfg "$Cfg.bak-$(Get-Date -Format yyyyMMddHHmmss)" }
   ```

2. Write the new file:

   ```powershell
   @'
   [wsl2]
   # Limit the resources
   memory=2GB
   processors=2
   # No swap file on the Windows disk
   swap=0
   # NAT networking. Do not use mirrored mode. Mirrored mode shares the host interfaces.
   networkingMode=nat
   # Do not forward Linux localhost ports (Tor SOCKS 9150) to Windows
   localhostForwarding=false
   # Do not send DNS through the host. Do not copy the host proxy settings.
   dnsTunneling=false
   autoProxy=false
   # Apply Windows and Hyper-V firewall rules to WSL traffic
   firewall=true
   # WSLg is necessary for the browser windows and audio
   guiApplications=true
   '@ | Set-Content -Path $Cfg -Encoding ascii
   ```

3. Stop WSL to apply the changes:

   ```powershell
   wsl --shutdown
   ```

   > **CAUTION:** This command stops all WSL distributions. Save your work in other distributions first.

4. Make sure that the firewall loaded at start:

   ```powershell
   wsl -d TorBox -u root -- nft list table inet torbox
   ```

   Make sure that the output shows `table inet torbox`. If it shows an error, stop. Do not use the browsers.

5. Start the distribution as `tbuser`:

   ```powershell
   wsl -d TorBox
   ```

6. Do the isolation test:

   ```bash
   t() { if eval "$2" >/dev/null 2>&1; then echo "FAIL: $1"; else echo "OK:   $1"; fi; }
   GW=$(ip route show default | awk '{print $3; exit}')
   t "no sudo"                    "sudo -n true"
   t "no Windows drive mounts"    '( for d in /mnt/[a-z]; do mountpoint -q "$d" && exit 0; done; exit 1 )'
   t "no host file mounts"        "grep -E ' (9p|drvfs|virtiofs) ' /proc/mounts"
   t "no Windows programs"        "command -v cmd.exe"
   t "no host GPU device"         "test -r /dev/dxg"
   t "no shared /mnt/wsl"         "mountpoint -q /mnt/wsl"
   t "no host network ($GW:445)"  "timeout 3 bash -c 'echo > /dev/tcp/$GW/445'"
   t "no host DNS ($GW:53)"       "timeout 3 bash -c 'echo > /dev/tcp/$GW/53'"
   id
   curl -fsS https://check.torproject.org/api/ip; echo
   ```

7. Make sure that:
   - All test lines show `OK`.
   - `id` shows `tbuser` and no `sudo` group.
   - The `curl` output shows `"IsTor":false` and your public IP address. This shows that the internet works.

> **NOTE:** `/mnt` is not empty. It contains `wslg`. This is correct. WSLg supplies the display and audio.

> **NOTE:** The first start ([Configure the distribution](#configure-the-distribution)) mounts `C:` at `/mnt/c`. After the restart, an empty `/mnt/c` folder can stay. An empty folder gives no access to the host. The boot script removes it.

> **NOTE:** If a test shows `FAIL`, do not use the browsers. Examine the boot script and `/etc/wsl.conf`. See [Troubleshooting](#troubleshooting).

## Upgrade from version 2.1

A distribution built with version 2.1 of this guide has the old boot script. Do these steps one time:

1. Start a root shell:

   ```powershell
   wsl -d TorBox -u root
   ```

2. Write the boot script again. Use step 4 of [Configure host isolation](#configure-host-isolation).
3. Close the root shell. Stop WSL:

   ```powershell
   wsl --shutdown
   ```

4. Do the isolation test again (steps 4 to 7 of [Configure WSL on Windows and test the isolation](#configure-wsl-on-windows-and-test-the-isolation)). Make sure that all lines show `OK`.

## Install Tor Browser

Do these steps as `tbuser`. Admin rights are not necessary.

1. Find the current stable version at [https://www.torproject.org/download/](https://www.torproject.org/download/).
2. Set the variables. Replace `X.Y.Z` with the current stable version:

   ```bash
   cd ~
   TB_VER="X.Y.Z"
   TB_FILE="tor-browser-linux-x86_64-${TB_VER}.tar.xz"
   TB_URL="https://www.torproject.org/dist/torbrowser/${TB_VER}/${TB_FILE}"
   ```

3. Download the archive and its signature:

   ```bash
   curl --proto '=https' --tlsv1.2 -fSLO "${TB_URL}"
   curl --proto '=https' --tlsv1.2 -fSLO "${TB_URL}.asc"
   ```

4. Get the Tor Browser signing key. Export only the key with the correct fingerprint:

   ```bash
   gpg --auto-key-locate nodefault,wkd --locate-keys torbrowser@torproject.org
   gpg --output ./tor.keyring --export 0xEF6E286DDA85EA2A4BA7DE684E2C6E8793298290
   ```

5. Examine the signature:

   ```bash
   gpgv --keyring ./tor.keyring "${TB_FILE}.asc" "${TB_FILE}"
   ```

   Make sure that the output shows `Good signature from "Tor Browser Developers (signing key) <torbrowser@torproject.org>"`.

   > **WARNING:** If the output does not show `Good signature`, delete the files. Do not extract or start them.

6. Extract the archive. Remove the download files:

   ```bash
   tar -xJf "${TB_FILE}"
   rm -f "${TB_FILE}" "${TB_FILE}.asc" tor.keyring
   ```

7. Block the microphone and camera in Tor Browser:

   ```bash
   P=~/tor-browser/Browser/TorBrowser/Data/Browser/profile.default
   mkdir -p "$P"
   printf 'user_pref("permissions.default.microphone", 2);\nuser_pref("permissions.default.camera", 2);\n' >> "$P/user.js"
   ```

8. Find missing libraries:

   ```bash
   ldd ~/tor-browser/Browser/libxul.so | grep 'not found' || echo "OK: all libraries found"
   ```

   If a library is missing, find its package with `apt-cache search <library>`. Install the package as root:

   ```powershell
   wsl -d TorBox -u root -- apt install -y --no-install-recommends <package>
   ```

9. Start Tor Browser. Keep the terminal open while you use the browser:

   ```bash
   ~/tor-browser/Browser/start-tor-browser
   ```

10. Optional: create a Windows desktop shortcut. Run this in a standard PowerShell window:

    ```powershell
    $Desktop  = [Environment]::GetFolderPath('Desktop')
    $Shell    = New-Object -ComObject WScript.Shell
    $Shortcut = $Shell.CreateShortcut("$Desktop\Tor Browser (WSL).lnk")
    $Shortcut.TargetPath  = "$env:WINDIR\System32\wsl.exe"
    $Shortcut.Arguments   = '-d TorBox -- /home/tbuser/tor-browser/Browser/start-tor-browser'
    $Shortcut.WindowStyle = 7
    $Shortcut.Save()
    ```

## Install Firefox

Install Firefox from the official Mozilla APT repository. Do not use the Ubuntu `firefox` package. In Ubuntu 24.04 it installs a Snap, and Snap needs systemd.

Do steps 1 to 6 as Linux root.

> **CAUTION:** Make sure that the prompt shows `root@` and ends in `#`. As `tbuser`, step 2 fails with `curl: (23)` and `KEY MISMATCH - STOP`. Nothing changes on the system. Type `exit`, then start again at step 1.

1. Start a root shell:

   ```powershell
   wsl -d TorBox -u root
   ```

2. Download the Mozilla signing key. Make sure that the fingerprint is correct:

   ```bash
   install -d -m 0755 /etc/apt/keyrings
   KEY=/etc/apt/keyrings/packages.mozilla.org.asc
   curl --proto '=https' --tlsv1.2 -fsSL https://packages.mozilla.org/apt/repo-signing-key.gpg -o "$KEY"
   FPR=$(gpg --show-keys --with-colons "$KEY" | awk -F: '/^fpr/{print $10; exit}')
   if [ "$FPR" = "35BAA0B33E9EB396F59CA838C0BA5CE6DC6315A3" ]; then echo "KEY OK"; else echo "KEY MISMATCH - STOP"; rm -f "$KEY"; fi
   ```

   > **WARNING:** If the output shows `KEY MISMATCH - STOP`, do not continue.

3. Add the repository. Give it priority over the Ubuntu Snap package:

   ```bash
   cat > /etc/apt/sources.list.d/mozilla.sources <<'EOF'
   Types: deb
   URIs: https://packages.mozilla.org/apt
   Suites: mozilla
   Components: main
   Signed-By: /etc/apt/keyrings/packages.mozilla.org.asc
   EOF
   cat > /etc/apt/preferences.d/mozilla <<'EOF'
   Package: *
   Pin: origin packages.mozilla.org
   Pin-Priority: 1000
   EOF
   ```

4. Install Firefox:

   ```bash
   apt update
   apt install -y --no-install-recommends firefox
   apt policy firefox | grep -q packages.mozilla.org && echo "SOURCE OK" || echo "SOURCE WRONG - STOP"
   ```

   Make sure that the output shows `SOURCE OK`.

5. Write the Firefox security policy. The policy blocks the microphone, camera, and add-ons. It forces HTTPS and DNS over HTTPS. It clears browsing data when Firefox closes:

   ```bash
   install -d -m 0755 /etc/firefox/policies
   cat > /etc/firefox/policies/policies.json <<'EOF'
   {
     "policies": {
       "DisableTelemetry": true,
       "DisableFirefoxStudies": true,
       "PasswordManagerEnabled": false,
       "OfferToSaveLogins": false,
       "HttpsOnlyMode": "force_enabled",
       "DNSOverHTTPS": {
         "Enabled": true,
         "ProviderURL": "https://dns.quad9.net/dns-query",
         "Locked": true
       },
       "Permissions": {
         "Camera":        { "BlockNewRequests": true, "Locked": true },
         "Microphone":    { "BlockNewRequests": true, "Locked": true },
         "Location":      { "BlockNewRequests": true, "Locked": true },
         "Notifications": { "BlockNewRequests": true, "Locked": true }
       },
       "SanitizeOnShutdown": {
         "Cache": true,
         "Cookies": true,
         "History": true,
         "Sessions": true,
         "FormData": true,
         "Locked": true
       },
       "ExtensionSettings": {
         "*": { "installation_mode": "blocked" },
         "uBlock0@raymondhill.net": {
           "installation_mode": "force_installed",
           "install_url": "https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi"
         }
       }
     }
   }
   EOF
   chmod 0644 /etc/firefox/policies/policies.json
   python3 -m json.tool /etc/firefox/policies/policies.json >/dev/null && echo "POLICY OK"
   ```

   Make sure that the output shows `POLICY OK`.

6. Close the root shell:

   ```bash
   exit
   ```

7. Start Firefox as `tbuser`:

   ```powershell
   wsl -d TorBox -- firefox
   ```

8. Go to `about:policies`. Make sure that the status is **Active** and that no errors show.

> **NOTE:** WSLg adds Linux applications to the Windows Start menu. Look for **Firefox (TorBox)**. It starts Firefox as `tbuser`.

## Use the browsers

### Tor Browser

1. Select **Connect**.
2. Set the security level to **Safest**: **Settings > Privacy & Security > Security Level > Safest**.
3. Do not install add-ons.
4. Do not sign in to personal accounts.
5. Do not open downloaded documents while you are online.

### Firefox

1. Use Firefox only for sites where anonymity is not necessary.
2. Do not use Firefox and Tor Browser for the same accounts or sites.

### Both browsers

1. Do not copy sensitive data through the clipboard. WSLg shares the clipboard with Windows.
2. If the company network blocks Tor, stop. Speak to your IT administrator. Do not try to go around company controls.
3. At the end of the session, stop the distribution:

   ```powershell
   wsl --terminate TorBox
   ```

   To also clear the WSL virtual machine memory, use `wsl --shutdown`.

   > **CAUTION:** `wsl --shutdown` stops all WSL distributions.

## Maintenance and removal

1. Tor Browser updates itself. Accept the update when the browser asks.
2. Update Ubuntu and Firefox each week:

   ```powershell
   wsl -d TorBox -u root -- sh -c 'apt update && apt full-upgrade -y && apt autoremove -y'
   ```

3. After each update, do the isolation test again (steps 4 to 7 of [Configure WSL on Windows and test the isolation](#configure-wsl-on-windows-and-test-the-isolation)).
4. To remove the setup, run these commands:

   > **WARNING:** These commands delete the distribution and all its data permanently.

   ```powershell
   wsl --unregister TorBox
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\WSL\TorBox"
   ```

> **NOTE:** Deletion does not securely erase data on an SSD. Use full-disk encryption (BitLocker) on the host.

## Use disposable sessions (optional)

This procedure gives a clean distribution for each session. It is similar to Tails without persistent storage.

1. Make a clean image one time, after you [install Firefox](#install-firefox):

   ```powershell
   wsl --terminate TorBox
   wsl --export TorBox "$env:LOCALAPPDATA\WSL\TorBox-clean.tar"
   ```

2. At the end of each session, restore the clean image:

   ```powershell
   wsl --unregister TorBox
   wsl --import TorBox "$env:LOCALAPPDATA\WSL\TorBox" "$env:LOCALAPPDATA\WSL\TorBox-clean.tar" --version 2
   ```

> **NOTE:** Each restore removes Tor Browser and Firefox updates. Make a new clean image after each update.

> **NOTE:** A clean image selects new Tor entry guards each time. This slightly decreases protection against some attacks. Tails without persistence has the same behavior.

> **CAUTION:** The clean `.tar` file contains the full distribution. Protect it as a sensitive file.

## One-time admin setup (IT)

These steps need an elevated PowerShell window. Do them one time on each device.

1. Turn on virtualization (Intel VT-x or AMD-V) in UEFI.
2. Install the WSL platform without a distribution:

   ```powershell
   wsl --install --no-distribution
   ```

3. Restart the device.
4. Log on as the standard user. Make sure that `wsl --version` runs with no UAC prompt.

> **NOTE:** If the Microsoft Store is blocked, get the WSL MSI from [https://github.com/microsoft/WSL/releases](https://github.com/microsoft/WSL/releases). Then turn on the feature and install the MSI:
>
> ```powershell
> dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
> msiexec.exe /i wsl.<version>.x64.msi /qn
> ```

> **NOTE:** Intune and Group Policy can disable WSL or limit its settings. Make sure that policy allows WSL for this user.

### Host-enforced network block (optional)

The Linux firewall in [Configure host isolation](#configure-host-isolation) is inside the distribution. Linux root can remove it. A Hyper-V firewall rule is on the host. Linux root cannot remove it.

> **CAUTION:** This rule applies to all WSL distributions of all users on the device. It blocks WSL access to the LAN, VPN, and local services. Other WSL users can lose access to local resources.

1. Make sure that Hyper-V firewall is available for WSL:

   ```powershell
   Get-NetFirewallHyperVVMSetting -PolicyStore ActiveStore -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}'
   ```

2. Add the rule:

   ```powershell
   New-NetFirewallHyperVRule -Name 'WSL-Block-Private' -DisplayName 'WSL: block host, LAN and VPN ranges' `
     -Direction Outbound -Action Block -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' `
     -RemoteAddresses '10.0.0.0/8','100.64.0.0/10','169.254.0.0/16','172.16.0.0/12','192.168.0.0/16'
   ```

3. To remove the rule:

   ```powershell
   Remove-NetFirewallHyperVRule -Name 'WSL-Block-Private'
   ```

## Version history

### Version 2.3

| # | Change | Reason |
| --- | --- | --- |
| 1 | Added a root prompt check to [Configure the distribution](#configure-the-distribution), [Configure host isolation](#configure-host-isolation), and [Install Firefox](#install-firefox). | Field test: the Firefox installation ran as `tbuser`. The key download failed safely with `KEY MISMATCH - STOP`. |

### Version 2.2

| # | Change | Reason |
| --- | --- | --- |
| 1 | The drive test examines mounts (`mountpoint`), not folders (`test -e`). It examines all drive letters. | Field test: an empty `/mnt/c` folder gave a false `FAIL`. The folder had no mount and no access to the host. |
| 2 | The boot script removes empty `/mnt/<letter>` folders at each start. | The first start ([Configure the distribution](#configure-the-distribution)) mounts `C:` and leaves the folder. The folder is world-writable. |
| 3 | Added [Troubleshooting](#troubleshooting) and an [upgrade procedure from version 2.1](#upgrade-from-version-21). | Gives a safe procedure for a `FAIL` result and for existing installations. |

### Version 2.1

| # | Change | Reason |
| --- | --- | --- |
| 1 | Added the [host access channel table](#host-access-channels). | Shows what is blocked and what stays open. Display, audio output, clipboard, and Hyper-V sockets stay open. |
| 2 | Added an nftables firewall: public IPv4 only, no inbound, no IPv6. | In NAT mode, Linux can reach the Windows host, LAN, and VPN. |
| 3 | Added `dnsTunneling=false`, `autoProxy=false`, `firewall=true`. Public DNS in `/etc/resolv.conf`. | Host DNS and proxy are host access paths. |
| 4 | Added `generateHosts=false` and a fixed host name. | Stops the copy of host data (hosts file, computer name) into Linux. |
| 5 | Added a boot script. It loads the firewall with fail-closed behavior. It removes `/dev/dxg`, `/usr/lib/wsl`, and `/mnt/wsl` access. | Removes the host GPU driver mounts and the mount shared with other distributions. |
| 6 | Added microphone and camera blocks in both browsers. | WSLg forwards the host microphone. Only audio output is necessary. |
| 7 | Added Firefox from the signed Mozilla APT repository, with a locked security policy. | The Ubuntu package needs Snap and systemd. |
| 8 | Added an automated isolation test ([Configure WSL on Windows and test the isolation](#configure-wsl-on-windows-and-test-the-isolation)). | Each control has a pass or fail result. |
| 9 | Added an optional Hyper-V firewall rule ([Host-enforced network block](#host-enforced-network-block-optional)). | Linux root cannot remove a host rule. |

### Version 2.0

| # | Severity | Problem in version 1 | Change in version 2 |
| --- | --- | --- | --- |
| 1 | High | Said "Tails-like". WSL is not isolated from the host and is not amnesic. | Added the [threat model](#safety-and-threat-model). Added Tails and Whonix as alternatives. |
| 2 | High | Used "PowerShell (Admin)" for most steps. This does not work with no UAC. | Only the [one-time admin setup](#one-time-admin-setup-it) needs admin. The distribution is in `%LOCALAPPDATA%`. |
| 3 | High | Added the `deb.torproject.org` repository for `torbrowser-launcher`. That repository does not supply this package. | Use the official Tor Browser archive with GPG signature verification. |
| 4 | High | No integrity test for the Ubuntu image. | Added the SHA256 hash test ([Get and examine the Ubuntu image](#get-and-examine-the-ubuntu-image)). |
| 5 | Medium | The daily user had `sudo`. | The daily user has no password and no `sudo`. Use `wsl -u root` for admin tasks. |
| 6 | Medium | Setup B expected `rootfs.tar` inside the `.appx`. It is not there. A bundle also contains more packages. `wsl --import` does not ask for a user. | Import the official `.wsl` image. Create the user explicitly. |
| 7 | Medium | Localhost forwarding sent the Tor SOCKS and control ports to Windows. | Set `localhostForwarding=false`. |
| 8 | Medium | Installed XFCE and ran `startxfce4`. WSLg does not support a full desktop session. `xfce4-panel` is already in `xfce4`. | Removed XFCE. WSLg shows the browser windows. |
| 9 | Low | Installed the `pulseaudio` server. It can conflict with the WSLg audio server. | Install only the `libpulse0` client library. |
| 10 | Low | The title "Network Isolation" described filesystem settings. | Changed the title and content. |
| 11 | Low | Said `ls /mnt` must be empty. `/mnt/wslg` is always there. | The test examines `/mnt/c`. |
| 12 | Low | Used `wsl --shutdown` as admin. It needs no admin and stops all distributions. | Use `wsl --terminate TorBox`. |
| 13 | Low | Swap file on the Windows disk. | Set `swap=0`. |
| 14 | Low | Distribution name `Ubuntu` can conflict with a Store installation. | Changed the name to `TorBox`. |
| 15 | Low | No update or removal procedure. | Added [Maintenance and removal](#maintenance-and-removal). |

## Troubleshooting

### The drive mount test fails

The isolation test shows `FAIL: no Windows drive mounts`.

1. Examine the drive folder. Run this in a standard PowerShell window:

   ```powershell
   wsl -d TorBox -u root -- sh -c 'mountpoint /mnt/c; ls -la /mnt/c'
   ```

2. If the output shows `/mnt/c is not a mountpoint` and only `.` and `..`, the folder is empty. There is no access to the host. Remove the folder:

   ```powershell
   wsl -d TorBox -u root -- rmdir /mnt/c
   ```

3. If the output shows `/mnt/c is a mountpoint`, or shows Windows files, stop. Do not use the browsers. Make sure that `/etc/wsl.conf` has `[automount]` with `enabled = false`. Then run `wsl --shutdown` and do the test again.

### Other isolation test failures

If a test shows `FAIL`, do not use the browsers. Examine the boot script and `/etc/wsl.conf`. If you built the distribution with version 2.1, do the [upgrade from version 2.1](#upgrade-from-version-21).

### The firewall table does not load

If `nft list table inet torbox` shows an error, stop. Do not use the browsers.

### Firefox cannot find websites

If the company network blocks public DNS, Firefox cannot find websites. Tor Browser does not use local DNS. Speak to your IT administrator.

## Related links

- [Ubuntu 24.04 LTS (Noble) releases](https://releases.ubuntu.com/noble/)
- [Ubuntu cdimage (arm64 images)](https://cdimage.ubuntu.com/)
- [Tor Browser download](https://www.torproject.org/download/)
- [Tor IP check API](https://check.torproject.org/api/ip)
- [Mozilla APT repository signing key](https://packages.mozilla.org/apt/repo-signing-key.gpg)
- [WSL releases](https://github.com/microsoft/WSL/releases)
