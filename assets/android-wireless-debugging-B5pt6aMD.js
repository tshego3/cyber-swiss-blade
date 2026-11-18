var e=`---
title: Debug an Android app wirelessly
summary: Connect an Android device over Wi-Fi to debug apps from Android Studio or from Visual Studio 2022 without a USB cable.
category: Flutter and Android
order: 30
---

# Debug an Android app wirelessly

This article shows how to debug an Android app over Wi-Fi from Android Studio or from Visual Studio 2022. Wireless debugging removes the USB cable, which can wear out ports and adds clutter.

## Before you start

- An Android device in developer mode. See [Turn on developer mode](doc:android-extract-apk-adb#turn-on-developer-mode).
- An Android 11 or later device for pairing with a QR code in Android Studio.
- Android Studio Bumblebee 2021.1.1 or later, or Visual Studio 2022.
- The device and the computer on the same network.

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin and Xamarin.Forms on 1 May 2024. Use .NET MAUI. The ADB pair and connect steps are the same for .NET MAUI apps.

> **NOTE:** Dated (checked November 2026): In current Android Studio versions, the pairing command is also in the device selector of the toolbar, as **Pair Devices Using Wi-Fi**.

## Pair with Android Studio

Android Studio Bumblebee 2021.1.1 and later have Wi-Fi debugging as a default feature.

1. In Android Studio, go to **Device Manager > Physical > Pair using Wi-Fi**.

   **Result:** A pop-up window shows a QR code.

   ![Android Studio pair using Wi-Fi window with a QR code](https://i.sstatic.net/1IMqw.png)

2. On the Android device, go to **Settings > Developer options > Wireless debugging > Pair device with QR code**.
3. Scan the QR code.

   ![Android wireless debugging settings with the pair device with QR code option](https://i.sstatic.net/ZQwnA.png)

## Turn on wireless debugging for Visual Studio

1. On the Android device, open **Settings**.
2. Find the option to pair a device with a pairing code. It is usually under **Developer options**.
3. Turn on **Wireless debugging**. Visual Studio cannot connect without it.

   **Result:** The device shows a pairing code and its IP address and port.

## Pair the device with Visual Studio

1. Start Visual Studio 2022.
2. Go to **Tools > Android > Android ADB Command Prompt**.
3. Type \`adb pair <IP address>:<port>\`. Replace \`<IP address>\` and \`<port>\` with the values from the device. For example, if the IP address is \`192.168.1.221\` and the port is \`37215\`, type:

   \`\`\`cmd
   adb pair 192.168.1.221:37215
   \`\`\`

4. At the prompt, type the pairing code from the device and press Enter.

   **Result:** A message shows that the pairing was successful.

## Connect to the device

1. Type \`adb connect <IP address>:<port>\`. Replace the placeholders with the values from the device. For example:

   \`\`\`cmd
   adb connect 192.168.1.221:3725
   \`\`\`

> **NOTE:** Verify the port. The example uses \`3725\`, which can be a typo of the pairing port \`37215\`. The port for \`adb connect\` is usually different from the pairing port. Use the IP address and port that the **Wireless debugging** screen shows.

## Deploy the app

1. In Visual Studio, select the deploy option.

   **Result:** Visual Studio builds the Xamarin.Forms app and installs it on the device, without a cable.
2. Wait for the deployment to complete. It can take some time, also for a blank app or a simple project.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| A message says that the target machine actively refused the connection. | Turn off **Wireless debugging** on the device, then turn it on again. |
| Connection problems continue. | Restart the Android device. |
| The default port does not work. | Try a different port. |
| Wireless debugging has bugs. | Update to the latest version of Visual Studio 2022. Updates often fix wireless debugging. |

## Related links

- [How to debug over Wi-Fi with Android Studio](https://stackoverflow.com/a/70876682) (Stack Overflow)
- [How to debug your Xamarin Forms app wirelessly with Visual Studio 2022](https://youtu.be/BUxug-X0vDE?si=Y-OGBW_fKWfijUYK) (YouTube video)
- [Galaxy.ai YouTube Summarizer](https://galaxy.ai/youtube-summarizer) (the tool that made the original summary of the video)
- [Extract an APK from an Android device with ADB](doc:android-extract-apk-adb)
- [Android SDK manual setup](doc:android-sdk-manual-setup)
`;export{e as default};