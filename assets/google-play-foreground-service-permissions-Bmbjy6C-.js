var e=`---
title: Fix Google Play foreground service permission errors
summary: Declare foreground service types in the manifest and in Google Play Console so that Play Store uploads and Azure DevOps pipelines do not fail.
category: Flutter and Android
order: 50
---

# Fix Google Play foreground service permission errors

Google requires developers to declare why their app uses foreground services. If your app uses a foreground service without an approved declaration in Google Play Console, the Play Store API rejects the build, and the Azure DevOps pipeline fails.

## Before you start

- Access to the app in **Google Play Console**.
- Access to the \`AndroidManifest.xml\` file of the app.
- A video that shows the notification of the running background service (Google often asks for it).

## Declare the service type in the manifest

Before you send the app to Google, make sure that the code declares the service type.

1. Add the permission for the specific service type with \`<uses-permission>\`.
2. Add the service type to the \`<service>\` element with \`android:foregroundServiceType\`.

\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:allowBackup="true" android:icon="@mipmap/appicon" android:supportsRtl="true" android:label="My App">
        <service android:name=".BackgroundService" android:exported="false" android:foregroundServiceType="dataSync" />
    </application>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
</manifest>
\`\`\`

## Create the declaration in Google Play Console

After the code is ready, tell Google about the foreground service.

1. Log in to **Google Play Console**.
2. Go to **Policy and programs > App content**.
3. Find **Foreground service permissions** and click **Start** (or **Manage**).
4. Select the type that agrees with your manifest (for example, \`Data sync\`).
5. Give a justification. Explain why the task must run in the background and why the app cannot do it in the foreground.
6. Give a video link. The video shows the notification that appears when the background service runs.

## Foreground service types

| Type | Use |
| --- | --- |
| \`dataSync\` | Upload or download data |
| \`location\` | GPS tracking |
| \`mediaPlayback\` | Music and video players |
| \`remoteMessaging\` | Message handling |

For the full list of types, see the [Android developer documentation](https://developer.android.com/about/versions/14/changes/fgs-types-required).

> **NOTE:** Dated (checked November 2026): On Android 15 and later, a \`dataSync\` foreground service can run for 6 hours in each 24-hour period, and Google plans to deprecate the \`dataSync\` type. Where possible, use WorkManager or a user-initiated data transfer job.

## Troubleshooting

### The declaration is not in App content

**Cause:** Google did not see a build that requests the permission yet. But the automated pipeline cannot upload the build, because the declaration is not complete.

**Fix:**

1. Make a release build on your computer (for example, an \`.apk\` file).
2. In a web browser, upload the file one time to the **Internal testing** track.

   **Result:** The upload can show an error or a warning. The upload causes Google to see that the app needs the declaration.
3. Go back to **App content**.

   **Result:** The declaration fields show.
4. Complete the declaration and save it.
5. Run the Azure DevOps pipeline again.

## Related links

- [Foreground service types are required (Android 14)](https://developer.android.com/about/versions/14/changes/fgs-types-required)
`;export{e as default};