---
title: .NET MAUI example: Native background service for Android and iOS
summary: Build a background uploader in a .NET MAUI app with native platform APIs: WorkManager and a foreground service on Android, and BGTaskScheduler on iOS.
category: .NET MAUI
order: 170
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI example: Native background service for Android and iOS

This example shows platform-native implementations of a background uploader. The uploader posts JSON to `https://dummyjson.com/todos/add` and can get the list from `https://dummyjson.com/todos`. Each platform implementation is in the `Platforms` folder of the MAUI app and uses the platform APIs directly, with no shared background library.

| Platform | Mechanism |
| --- | --- |
| Android | A WorkManager `Worker` for reliable background uploads (recommended), a foreground service, and manifest entries. |
| iOS | `BGTaskScheduler` registration to schedule processing, and an `NSTimer` with background tasks while the app runs. |

## Before you start

- A .NET MAUI app. The Android project file in this example targets `net10.0-android36.0`.
- Android: the `Xamarin.AndroidX.Work.Runtime` NuGet package (version 2.11.0 in this example) and a minimum Android version of 26.0.
- iOS: a real device with the correct certificates for tests. Background behavior in the simulator is limited.

## Create the shared code

The shared code has two interfaces and a `TodoService`. Both platforms use them.

### Background worker interface

Create `Interfaces/IBackgroundWorker.cs`:

```csharp
namespace YourApp.Interfaces
{
    /// <summary>
    /// Background Worker with delayed Execution
    /// </summary>
    public interface IBackgroundWorker
    {
        /// <summary>
        /// Event Raised when BG Worker has been Stopped
        /// </summary>
        event EventHandler? WorkerStopped;

        /// <summary>
        /// Represent BG Work
        /// </summary>
        Func<Task>? BackgroundWork { get; }

        /// <summary>
        /// Start Specific BG Work
        /// </summary>
        void StartWorker(Func<Task> backgroundWork);

        /// <summary>
        /// Force Stop BG Work Execution
        /// </summary>
        void StopWorker();
    }
}
```

### Platform uploader interface

Create `Interfaces/IPlatformUploader.cs`:

```csharp
namespace YourApp.Interfaces
{
    public interface IPlatformUploader
    {
        void EnqueueUploadNow(Func<Task>? backgroundWork = null);
    }
}
```

### Todo service

Create `Shared/TodoService.cs`. `GetTodosAsync` gets the todo list. `AddTodoAsync` posts one todo item. Both use a 30 s HTTP timeout.

```csharp
using System.Net.Http.Json;

namespace YourApp.Shared
{
    public record TodoRecord(int Id, string Todo, bool Completed, int UserId);

    public record TodoResponse(
        List<TodoRecord> Todos,
        int Total,
        int Skip,
        int Limit
    );

    public static class TodoService
    {
        public static async Task<List<TodoRecord>> GetTodosAsync()
        {
            try
            {
                HttpClient client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
                TodoResponse? response = await client.GetFromJsonAsync<TodoResponse>(
                    "https://dummyjson.com/todos"
                );

                return response?.Todos ?? [];
            }
            catch (Exception)
            {
                return new();
            }
        }

        public static async Task AddTodoAsync()
        {
            try
            {
                HttpClient client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

                TodoRecord todo = new TodoRecord(
                    0,
                    "Use DummyJSON in the project",
                    false,
                    5
                );

                await client.PostAsJsonAsync(
                    "https://dummyjson.com/todos/add",
                    todo
                );

                System.Diagnostics.Debug.WriteLine(string.Concat("Date: ", DateTime.Now, " Todo Added!"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.Message);
            }
        }
    }
}
```

## Implement the Android service

The Android implementation uses these files:

| File | Purpose |
| --- | --- |
| `Platforms/Android/UploadWorker.cs` | WorkManager worker that does the upload. |
| `Platforms/Android/PlatformUploader.cs` | Enqueues a one-time upload. |
| `Platforms/Android/BackgroundWorker.cs` | Starts and stops the foreground service. |
| `Platforms/Android/BackgroundService.cs` | Foreground service that runs the work at an interval. |
| `Platforms/Android/AndroidManifest.xml` | Service declaration and permissions. |
| `Platforms/Android/MainActivity.cs` | Helper that schedules the work. |

### Add the NuGet package

1. Add the WorkManager package:

   ```bash
   dotnet add package Xamarin.AndroidX.Work.Runtime
   ```

2. Make sure that the project file sets the minimum Android version and references the package for the Android target:

   ```xml
   <PropertyGroup>
       <SupportedOSPlatformVersion Condition="$([MSBuild]::GetTargetPlatformIdentifier('$(TargetFramework)')) == 'android'">26.0</SupportedOSPlatformVersion>
   </PropertyGroup>
   <ItemGroup Condition="'$(TargetFramework)' == 'net10.0-android36.0'">
       <PackageReference Include="Xamarin.AndroidX.Work.Runtime" Version="2.11.0" />
   </ItemGroup>
   ```

### Add the permissions and the service to the manifest

Add these entries to `Platforms/Android/AndroidManifest.xml`, inside `<manifest>` and `<application>` as necessary. The service uses the `dataSync` foreground service type.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:allowBackup="true" android:icon="@mipmap/appicon" android:roundIcon="@mipmap/appicon_round" android:supportsRtl="true">
        <service android:name=".BackgroundService" android:exported="false" android:foregroundServiceType="dataSync" />
    </application>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
</manifest>
```

> **NOTE:** Verify the merged manifest. The `[Service]` attribute on `BackgroundService` also adds a `<service>` entry, with a generated name (a `crc64` hash prefix), not `.BackgroundService`. Open the merged `AndroidManifest.xml` in the `obj` folder. If it has two entries, remove the manual entry, or set `Name = "com.yourcompany.yourapp.BackgroundService"` in the attribute so that both names match.

> **NOTE:** Dated (checked November 2026): On Android 15 (API 35) and later, a `dataSync` foreground service can run for 6 hours in 24 hours at most. Google recommends WorkManager or user-initiated data transfer jobs for long transfers.

### Create the upload worker

Create `UploadWorker.cs`. WorkManager calls `DoWork`. If the upload fails, the worker returns a failure. If an exception occurs, the worker asks WorkManager to retry.

```csharp
using Android.Content;
using AndroidX.Work;
using YourApp.Shared;

namespace YourApp.Platforms.Android
{
    public class UploadWorker : Worker
    {
        public UploadWorker(Context context, WorkerParameters workerParams) : base(context, workerParams) { }

        public override Result DoWork()
        {
            try
            {
                bool isTaskComplete = DoUploadAsync().GetAwaiter().GetResult();

                return isTaskComplete ? Result.InvokeSuccess()! : Result.InvokeFailure()!;
            }
            catch (Exception)
            {
                return Result.InvokeRetry()!;
            }
        }

        public async Task<bool> DoUploadAsync()
        {
            try
            {
                await TodoService.AddTodoAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
```

### Create the platform uploader

Create `PlatformUploader.cs`. It enqueues a `OneTimeWorkRequest` for `UploadWorker`.

```csharp
using Android.Content;
using AndroidX.Work;
using Java.Util.Concurrent;
using YourApp.Interfaces;
using YourApp.Shared;

namespace YourApp.Platforms.Android
{
    public class PlatformUploader : IPlatformUploader
    {
        public void EnqueueUploadNow(Func<Task>? backgroundWork = null)
        {
            OneTimeWorkRequest request = OneTimeWorkRequest.Builder.From<UploadWorker>().Build();
            WorkManager.GetInstance(global::Android.App.Application.Context).Enqueue(request);
        }
    }
}
```

### Create the background worker

Create `BackgroundWorker.cs`. `StartWorker` keeps the work function and starts `BackgroundService`. On Android 8.0 (API 26, `BuildVersionCodes.O`) and later, it starts the service as a foreground service. `StopWorker` raises the `WorkerStopped` event.

```csharp
using Android.Content;
using Android.OS;
using YourApp.Interfaces;

namespace YourApp.Platforms.Android
{
    public class BackgroundWorker : IBackgroundWorker
    {
        public event EventHandler? WorkerStopped;

        public Func<Task>? BackgroundWork { get; private set; }
        
        public static IBackgroundWorker? Current { get; private set; }

        public void StartWorker(Func<Task> backgroundWork)
        {
            try
            {
                BackgroundWork = backgroundWork;
                Current = this;
                Intent intent = new Intent(global::Android.App.Application.Context, typeof(BackgroundService));

                if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
                {
                    global::Android.App.Application.Context.StartForegroundService(intent);
                }
                else
                {
                    global::Android.App.Application.Context.StartService(intent);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(ex.Message);
            }
        }

        public void StopWorker()
        {
            WorkerStopped?.Invoke(this, EventArgs.Empty);
            Current = null;
        }
    }
}
```

### Create the background service

Create `BackgroundService.cs`. The service shows an ongoing notification and runs the work in a loop. The interval is 15 s in a Debug build and 300 s in a Release build. If the previous run is not complete, the loop skips the run. When the worker stops, the service removes the notification and stops itself.

```csharp
using Android.App;
using Android.Content;
using Android.Content.PM;
using Android.OS;
using Android.Runtime;
using AndroidX.Core.App;
using AndroidX.Core.Content.Resources;
using YourApp.Interfaces;

namespace YourApp.Platforms.Android
{
    [Service(
        ForegroundServiceType = ForegroundService.TypeDataSync,
        Exported = false
    )]
    public class BackgroundService : Service
    {
        private const int SERVICE_ID = 1010;

        private const string SERVICE_NOTIFICATION_CHANNEL_ID = "1011";

#if DEBUG
        private readonly TimeSpan _interval = TimeSpan.FromSeconds(15);
#elif RELEASE
        private readonly TimeSpan _interval = TimeSpan.FromSeconds(300);
#endif

        private IBackgroundWorker? _backgroundWorker;

        private bool _workerActive;
        private bool _isBusy;

        private CancellationTokenSource? _cancellationTokenSource;

        public override IBinder? OnBind(Intent? intent)
        {
            return null;
        }

        [System.Runtime.Versioning.SupportedOSPlatform("android29.0")]
        [return: GeneratedEnum]
        public override StartCommandResult OnStartCommand(Intent? intent, [GeneratedEnum] StartCommandFlags flags, int startId)
        {
            _cancellationTokenSource?.Cancel();
            _cancellationTokenSource = new CancellationTokenSource();
            _backgroundWorker = BackgroundWorker.Current;
            _backgroundWorker?.WorkerStopped += OnWorkerStopped;
            Notification notification = BuildNotification() ?? new();
            StartForeground(SERVICE_ID, notification, ForegroundService.TypeDataSync);

            _ = Task.Run(async () =>
            {
                _workerActive = true;
                while (_workerActive)
                {
                    try
                    {
                        await Task.Delay(_interval, _cancellationTokenSource.Token);
                    }
                    catch (TaskCanceledException)
                    {
                        _workerActive = false;
                        break;
                    }

                    if (_isBusy == true)
                    {
                        continue;
                    }

                    if (_backgroundWorker != null && _backgroundWorker.BackgroundWork != null)
                    {
                        try
                        {
                            _isBusy = true;
                            await _backgroundWorker.BackgroundWork();
                        }
                        finally
                        {
                            _isBusy = false;
                        }
                    }
                }
            });

            return StartCommandResult.Sticky;
        }

        private void OnWorkerStopped(object? sender, EventArgs e)
        {
            _workerActive = false;
            _cancellationTokenSource?.Cancel();
            _backgroundWorker?.WorkerStopped -= OnWorkerStopped;
            StopForeground(StopForegroundFlags.Remove);
            StopSelf();
        }

        private Notification? BuildNotification()
        {
            Intent intent = new Intent(global::Android.App.Application.Context, typeof(MainActivity));
            intent.AddFlags(ActivityFlags.NoUserAction);
            intent.PutExtra("Title", "Message");

            PendingIntent? pendingIntent = PendingIntent.GetActivity(global::Android.App.Application.Context, 0, intent, PendingIntentFlags.UpdateCurrent | PendingIntentFlags.Immutable);

            NotificationCompat.Builder? notificationBuilder = new NotificationCompat.Builder(global::Android.App.Application.Context, SERVICE_NOTIFICATION_CHANNEL_ID);

            if (notificationBuilder != null)
            {
                notificationBuilder.SetContentTitle("Background Service");
                notificationBuilder.SetContentText("Running background service");
                notificationBuilder.SetSmallIcon(Resource.Mipmap.appicon);
                notificationBuilder.SetColor(ResourcesCompat.GetColor(global::Android.App.Application.Context.Resources, Resource.Color.colorAccent, null));
                notificationBuilder.SetOngoing(true);
                notificationBuilder.SetContentIntent(pendingIntent);
            }

            if (Build.VERSION.SdkInt >= BuildVersionCodes.O)
            {
                NotificationChannel notificationChannel = new NotificationChannel(SERVICE_NOTIFICATION_CHANNEL_ID, "YourApp", NotificationImportance.Low);
                notificationChannel.Importance = NotificationImportance.Low;
                notificationChannel.EnableLights(true);
                notificationChannel.EnableVibration(false);
                notificationChannel.SetShowBadge(true);

                if (global::Android.App.Application.Context.GetSystemService(NotificationService) is NotificationManager notificationManager)
                {
                    notificationBuilder?.SetChannelId(SERVICE_NOTIFICATION_CHANNEL_ID);
                    notificationManager.CreateNotificationChannel(notificationChannel);
                }
            }

            return notificationBuilder?.Build();
        }
    }
}
```

> **NOTE:** The `_backgroundWorker?.WorkerStopped += OnWorkerStopped;` statement is a null-conditional assignment. It needs C# 14 (.NET 10) or later.

### Schedule the work from MainActivity

Add a helper to `Platforms/Android/MainActivity.cs` that schedules an upload. The sample schedules a periodic upload every 15 minutes with the unique name `yourapp-upload-worker` and the `Keep` policy.

```csharp
using Android.App;
using Android.Content.PM;
using Android.OS;
using AndroidX.Work;
using Java.Util.Concurrent;
using YourApp.Platforms.Android;

namespace YourApp
{
    [Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, LaunchMode = LaunchMode.SingleTop, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density)]
    public class MainActivity : MauiAppCompatActivity
    {
        protected override void OnCreate(Bundle? savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            ScheduleUploadWork();
        }

        public void ScheduleUploadWork()
        {
            try
            {
                if (false)
                {
                    PeriodicWorkRequest workRequest = new PeriodicWorkRequest.Builder(
                        typeof(UploadWorker), 15, TimeUnit.Minutes!
                    ).Build();

                    WorkManager.GetInstance(Android.App.Application.Context).EnqueueUniquePeriodicWork(
                        "yourapp-upload-worker",
                        ExistingPeriodicWorkPolicy.Keep!,
                        workRequest
                    );
                }
            }
            catch (Exception)
            {
            }
        }
    }
}
```

> **NOTE:** The `if (false)` condition turns off the periodic work in this sample. Change the condition to turn it on.

### Android notes

- Use `OneTimeWorkRequest` for single uploads. Use `PeriodicWorkRequest` for recurring uploads.
- Keep queued items in local storage (SQLite or a file). Let the worker read and upload them, and remove each item after a successful upload.
- WorkManager handles constraints (network type, battery) and retries.

## Implement the iOS service

The iOS implementation uses these files:

| File | Purpose |
| --- | --- |
| `Platforms/iOS/BackgroundWorker.cs` | Runs the work on a repeating timer inside a background task. |
| `Platforms/iOS/PlatformUploader.cs` | Runs one upload inside a background task. |
| `Platforms/iOS/AppDelegate.cs` | Registers and submits the `BGTaskScheduler` task. |
| `Platforms/iOS/Info.plist` | Background modes and the permitted task identifier. |

### Add the Info.plist entries

1. Add these keys to `Platforms/iOS/Info.plist`:

   ```xml
   <key>UIBackgroundModes</key>
   <array>
       <string>fetch</string>
       <string>processing</string>
       <string>remote-notification</string>
   </array>
   <key>BGTaskSchedulerPermittedIdentifiers</key>
   <array>
       <string>com.yourcompany.yourapp.backgroundworker</string>
   </array>
   ```

2. Replace `com.yourcompany.yourapp.backgroundworker` with your app identifier. Use the same value for `REFRESH_IDENTIFIER` in `AppDelegate.cs`.

### Create the background worker

Create `BackgroundWorker.cs`. A repeating `NSTimer` runs the work every `TIMER_COOLDOWN` seconds: 15 s in a Debug build and 300 s in a Release build. Each run is inside a `BeginBackgroundTask` and `EndBackgroundTask` pair. If the previous run is not complete, the timer skips the run.

```csharp
using Foundation;
using UIKit;
using YourApp.Interfaces;

namespace YourApp.Platforms.iOS
{
    public class BackgroundWorker : IBackgroundWorker
    {
#if DEBUG
        public const double TIMER_COOLDOWN = 15;
#elif RELEASE
        public const double TIMER_COOLDOWN = 300;
#endif

        public event EventHandler? WorkerStopped;

        private NSTimer? _timer;
        private bool _isBusy;

        public Func<Task>? BackgroundWork { get; private set; }

        public void StartWorker(Func<Task> backgroundWork)
        {
            BackgroundWork = backgroundWork;

            if (_timer is not null)
            {
                StopWorker();
            }

            _timer = NSTimer.CreateRepeatingScheduledTimer(TIMER_COOLDOWN, async _ =>
            {
                if (_isBusy == true)
                {
                    return;
                }

                _isBusy = true;
                nint taskId = 0;

                taskId = UIApplication.SharedApplication.BeginBackgroundTask(() =>
                {
                    UIApplication.SharedApplication.EndBackgroundTask(taskId);
                });

                try
                {
                    if (BackgroundWork is not null)
                    {
                        await BackgroundWork();
                    }
                }
                finally
                {
                    UIApplication.SharedApplication.EndBackgroundTask(taskId);
                    _isBusy = false;
                }
            });
        }

        public void StopWorker()
        {
            if (_timer is not null)
            {
                OnWorkerStopped();
                _timer.Invalidate();
                _timer.Dispose();
                _timer = null;
            }
        }

        protected virtual void OnWorkerStopped()
        {
            WorkerStopped?.Invoke(this, EventArgs.Empty);
        }
    }
}
```

### Create the platform uploader

Create `PlatformUploader.cs`. It runs the work once inside a background task.

```csharp
using UIKit;
using YourApp.Interfaces;

namespace YourApp.Platforms.iOS
{
    public class PlatformUploader : IPlatformUploader
    {
        public void EnqueueUploadNow(Func<Task>? backgroundWork = null)
        {
            _ = Task.Run(async () =>
            {
                if (backgroundWork != null)
                {
                    nint taskId = 0;

                    taskId = UIApplication.SharedApplication.BeginBackgroundTask(() =>
                    {
                        UIApplication.SharedApplication.EndBackgroundTask(taskId);
                    });

                    await backgroundWork();

                    UIApplication.SharedApplication.EndBackgroundTask(taskId);
                }
            });
        }
    }
}
```

### Register the BGTask in AppDelegate

Edit `Platforms/iOS/AppDelegate.cs`. `_backgroundWorker` is a property, so it gets the service when the task runs. A field initializer runs when iOS creates the `AppDelegate`, before the MAUI app exists, and gives `null`. `FinishedLaunching` registers the task handler. When the app goes to the background, `DidEnterBackground` submits a `BGProcessingTaskRequest` that needs network connectivity and does not need external power. The earliest start is `TIMER_COOLDOWN` seconds later.

```csharp
using Foundation;
using UIKit;
using BackgroundTasks;
using YourApp.Interfaces;

namespace YourApp;

[Register("AppDelegate")]
public class AppDelegate : MauiUIApplicationDelegate
{
    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

    private const string REFRESH_IDENTIFIER = "com.yourcompany.yourapp.backgroundworker";

    private IBackgroundWorker? _backgroundWorker => IPlatformApplication.Current?.Services?.GetService<IBackgroundWorker>();

    public override bool FinishedLaunching(UIApplication application, NSDictionary? launchOptions)
    {
        BGTaskScheduler.Shared.Register(REFRESH_IDENTIFIER, null, task =>
        {
            NSOperationQueue queue = NSOperationQueue.CurrentQueue;

            task.ExpirationHandler = () =>
            {
                queue.CancelAllOperations();
            };

            queue.AddOperation(() => _ = _backgroundWorker?.BackgroundWork?.Invoke());
        });

        return base.FinishedLaunching(application, launchOptions);
    }

    public override void DidEnterBackground(UIApplication uiApplication)
    {
        base.DidEnterBackground(uiApplication);

        BGProcessingTaskRequest request = new BGProcessingTaskRequest(REFRESH_IDENTIFIER)
        {
            RequiresNetworkConnectivity = true,
            RequiresExternalPower = false,
            EarliestBeginDate = NSDate.FromTimeIntervalSinceNow(Platforms.iOS.BackgroundWorker.TIMER_COOLDOWN)
        };

        try
        {
            BGTaskScheduler.Shared.Submit(request, out NSError? error);
            // if you try this on simulator you will get a error: Error Domain=BGTaskSchedulerErrorDomain Code=1 "(null)"
            // However, in real device with proper certificates you should get no error.
            if (error is not null)
            {
                System.Diagnostics.Debug.WriteLine(error.Description);
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine(ex.Message);
        }
    }
}
```

> **NOTE:** Verify the task completion. Apple requires a call to `task.SetTaskCompleted(success)` when the work ends. The handler above does not call it and does not wait for `BackgroundWork`, so the system can end the task at expiration. Await the work, then call `SetTaskCompleted`, and submit a new request to schedule the next run.

### iOS notes

- Use an `NSURLSession` background configuration, so that uploads continue when the system suspends the app. The sample code uses `HttpClient` and does not do this.
- `BGTaskScheduler` schedules processing tasks. The system decides the exact time.
- Keep queued items in local storage (Core Data, SQLite, or a file). Let the background task read and upload them.
- Test on a real device. The simulator limits background behavior.

## Register the background service

These changes apply to both platforms.

1. Edit `App.xaml.cs`. Inject `IBackgroundWorker` and start the worker with `TodoService.AddTodoAsync` when the app starts:

   ```csharp
   using YourApp.Interfaces;
   using YourApp.Shared;

   namespace YourApp;

   public partial class App : Application
   {
       private readonly IBackgroundWorker _backgroundWorker;

       public App(IBackgroundWorker backgroundWorker)
       {
           _backgroundWorker = backgroundWorker;
           InitializeComponent();
       }

       protected override Window CreateWindow(IActivationState? activationState)
       {
           return new Window(new AppShell());
       }

       protected override async void OnStart()
       {
           try
           {
               base.OnStart();
               _backgroundWorker.StartWorker(TodoService.AddTodoAsync);
           }
           catch (Exception ex)
           {
               System.Diagnostics.Debug.WriteLine(ex.Message);
           }
       }
   }
   ```

2. Edit `MauiProgram.cs`. Register the platform implementations of `IBackgroundWorker` and `IPlatformUploader`:

   ```csharp
   #if ANDROID
   using YourApp.Platforms.Android;
   #elif IOS
   using YourApp.Platforms.iOS;
   #endif
   // ...
   #if ANDROID
           builder.Services.AddSingleton<IBackgroundWorker, BackgroundWorker>();
           builder.Services.AddSingleton<IPlatformUploader, PlatformUploader>();
   #elif IOS
           builder.Services.AddSingleton<IBackgroundWorker, BackgroundWorker>();
           builder.Services.AddSingleton<IPlatformUploader, PlatformUploader>();
   #endif
   ```

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `BGTaskScheduler.Shared.Submit` gives `Error Domain=BGTaskSchedulerErrorDomain Code=1 "(null)"`. | The app runs in the iOS simulator. | Test on a real device with the correct certificates. |
| Google Play reports a foreground service permission error. | The app declares a foreground service and its permissions. | See [Resolve Google Play foreground service permission errors](doc:google-play-foreground-service-permissions). |

## Related links

Android:

- [Background work (Android Developers)](https://developer.android.com/develop/background-work)
- [WorkManager (Android Developers)](https://developer.android.com/reference/androidx/work/WorkManager)
- [Creating Android Services (Xamarin)](https://learn.microsoft.com/en-us/previous-versions/xamarin/android/app-fundamentals/services/)
- [Started Services with Xamarin.Android](https://learn.microsoft.com/en-us/previous-versions/xamarin/android/app-fundamentals/services/creating-a-service/started-services)
- [Background Work in Xamarin.Forms, Android (Medium)](https://medium.com/nerd-for-tech/background-work-in-xamarin-forms-part-1-xamarin-android-63f629e73f9)
- [Resolve Google Play foreground service permission errors](doc:google-play-foreground-service-permissions)

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin on May 1, 2024. The Xamarin links go to archived documentation. The platform concepts still apply to .NET MAUI.

iOS:

- [BGTaskScheduler (Apple Developer)](https://developer.apple.com/documentation/backgroundtasks/bgtaskscheduler)
- [Using background tasks to update your app (Apple Developer)](https://developer.apple.com/documentation/UIKit/using-background-tasks-to-update-your-app)
- [Backgrounding in Xamarin.iOS](https://learn.microsoft.com/en-us/previous-versions/xamarin/ios/app-fundamentals/backgrounding/)
- [iOS Backgrounding Techniques (Xamarin)](https://learn.microsoft.com/en-us/previous-versions/xamarin/ios/app-fundamentals/backgrounding/ios-backgrounding-techniques/)
- [iOS Backgrounding with Tasks (Xamarin)](https://learn.microsoft.com/en-us/previous-versions/xamarin/ios/app-fundamentals/backgrounding/ios-backgrounding-techniques/ios-backgrounding-with-tasks)
- [Background Work in Xamarin.Forms, iOS (Medium)](https://medium.com/nerd-for-tech/background-work-in-xamarin-forms-part-2-xamarin-ios-ff22037a7b60)
