---
title: Fix a corrupted USB drive or SD card
summary: Repair a corrupted USB drive or SD card with Diskpart on Windows or with mkfs on Linux, and remove write protection with hdparm.
category: Systems and setup
order: 20
gist: 3c89476e1d80e89a72b951fcba1d3615
---

# Fix a corrupted USB drive or SD card

This article shows how to repair a corrupted storage device from the command line. Use Diskpart on Windows, or `mkfs` on Ubuntu or another Linux distribution. It also shows how to remove write protection from a USB flash drive.

## Before you start

- A Windows Command Prompt that runs as Administrator, or a Linux terminal with `sudo`.
- A backup of the data on the device. All the procedures in this article erase the device.

> **WARNING:** Make sure that you select the correct disk. If you select the wrong disk, you erase the wrong disk.

## Clean the device on Windows

Video: [Windows procedure](https://youtu.be/XFBoXMkih-0)

1. Open Command Prompt as Administrator.
2. Run these commands. For `select disk`, use the number of the corrupted storage device (0, 1, 2, 3, and so on) from the `list disk` output.

   ```cmd
   diskpart
   list disk
   select disk <number>
   clean
   exit
   ```

## Format the device on Linux

Video: [Linux procedure](https://youtu.be/cbfqE_FtrZ0)

### Identify the volume

Put the USB drive into the computer and identify it correctly. Take care in this step, because you can format the wrong disk.

```bash
df -h
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       28G    24G  2.3G  92% /
udev            1.4G   12K  1.4G   1% /dev
tmpfs           277M  1.2M  276M   1% /run
none            5.0M     0  5.0M   0% /run/lock
none            1.4G   34M  1.4G   3% /run/shm
/dev/sdc1      14.8G  1.4G  13.4G  10% /media/tecadmin
```

In this example, `/dev/sdc1` is the attached 16 GB USB drive.

### Unmount and format the drive

Ubuntu mounts a USB drive automatically when you attach it. Linux cannot format a disk that is mounted.

1. Unmount the USB drive:

   ```bash
   sudo umount /dev/sdb1
   ```

2. Format the drive with the file system that you want. Most users select VFAT or NTFS, because Windows can use these file systems easily.

   | File system | Command |
   | --- | --- |
   | VFAT | `sudo mkfs.vfat /dev/sdb1` |
   | NTFS | `sudo mkfs.ntfs /dev/sdc1` |
   | EXT4 | `sudo mkfs.ext4 /dev/sdc1` |

   You can use the same method for other file systems.

> **CAUTION:** The source commands use both `/dev/sdb1` and `/dev/sdc1`. Replace the device in each command with the device that you identified with `df -h`.

## Remove write protection

Video: [Remove write protection from a USB flash drive in Ubuntu Linux](https://youtu.be/Z9A1-NeXfJU)

On Windows, you can try these methods:

1. In Registry Editor, go to `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\StorageDevicePolicies`. Change the value of `WriteProtect` to `0`.
2. Use MS-DOS at computer startup.
3. Use Disk Management.
4. Use the HP USB Drive Format Tool.

If all these methods give the error "The Disk is Write Protected", use GNU/Linux. To turn off the write protection of a disk device, use the low-level system utility `hdparm`. The `-r0` option sets the read-only flag to 0 (off) and gives back the default read-write permission.

```bash
sudo hdparm -r0 /dev/sdb
```

In this example, `/dev/sdb` is the physical disk device. If the device has partitions that are mounted as read-only, mount them again as read-write before you write data to them.

## Related links

- [Windows Diskpart procedure (video)](https://youtu.be/XFBoXMkih-0)
- [Format a USB drive on the Ubuntu or Linux command line (video)](https://youtu.be/cbfqE_FtrZ0)
- [Remove write protection from a USB flash drive in Ubuntu Linux (video)](https://youtu.be/Z9A1-NeXfJU)
