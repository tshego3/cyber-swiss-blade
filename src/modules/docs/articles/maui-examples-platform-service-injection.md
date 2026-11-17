---
title: .NET MAUI example: Platform service injection in Xamarin and .NET MAUI
summary: Implement a file helper service for Android and iOS, and inject it with DependencyService in Xamarin or with dependency injection in .NET MAUI.
category: .NET MAUI
order: 120
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI example: Platform service injection in Xamarin and .NET MAUI

This example implements one service interface for Android and iOS and injects it into shared code. Xamarin uses `DependencyService` to find the service. .NET MAUI uses dependency injection through `MauiProgram.cs`. The example service, `IFileHelper`, writes text to a file and shares the file on iOS.

> **NOTE:** Dated (checked November 2026): Microsoft ended support for Xamarin on May 1, 2024. Use the Xamarin samples only to migrate existing code to .NET MAUI.

## Define the interface

The interface is the same in Xamarin and .NET MAUI.

```csharp
public interface IFileHelper
{
    Task<string> GetDocumentsPath();
    Task WriteToFile(string filename, string content);
    Task ShareFile(string filename); // Added for iOS file sharing
}
```

## Implement the interface for each platform

The .NET MAUI implementations are below. The Xamarin implementations have the same class bodies. They differ only in the namespace and in the `Dependency` attribute. See [Xamarin differences](#xamarin-differences).

### Android

The Android implementation writes to the public Downloads folder on external storage. It does not need to share the file. The `global::` prefix is necessary: in the `YourNamespace.Platforms.Android` namespace, `Android.OS` refers to `YourNamespace.Platforms.Android.OS`.

> **NOTE:** Dated (checked November 2026): `Environment.GetExternalStoragePublicDirectory` is deprecated since Android 10 (API 29) because of scoped storage. Use `Context.GetExternalFilesDir` for app-specific files, or the `MediaStore.Downloads` collection for files in the public Downloads folder.

```csharp
namespace YourNamespace.Platforms.Android
{
    public class FileHelperAndroid : IFileHelper
    {
        public Task<string> GetDocumentsPath()
        {
            // Save to external storage (Downloads folder)
            var path = global::Android.OS.Environment.GetExternalStoragePublicDirectory(global::Android.OS.Environment.DirectoryDownloads).AbsolutePath;
            return Task.FromResult(path);
        }

        public async Task WriteToFile(string filename, string content)
        {
            try
            {
                string path = await GetDocumentsPath();
                string filePath = Path.Combine(path, filename);

                Debug.WriteLine($"Writing to file: {filePath}");

                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }

                using (StreamWriter writer = new StreamWriter(filePath, append: true))
                {
                    await writer.WriteLineAsync(content);
                }

                Debug.WriteLine($"File written successfully: {filePath}");
            }
            catch (UnauthorizedAccessException ex)
            {
                Debug.WriteLine($"Permission error: {ex.Message}");
            }
            catch (IOException ex)
            {
                Debug.WriteLine($"IO error: {ex.Message}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Unexpected error: {ex.Message}");
            }
        }

        public Task ShareFile(string filename)
        {
            // Not needed for Android since files are saved to external storage
            return Task.CompletedTask;
        }
    }
}
```

### iOS

The iOS implementation writes to the Documents folder of the app. `ShareFile` opens the share sheet for the file.

```csharp
namespace YourNamespace.Platforms.iOS
{
    public class FileHelperIOS : IFileHelper
    {
        public Task<string> GetDocumentsPath()
        {
            // Save to app's Documents directory
            var documents = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            return Task.FromResult(documents);
        }

        public async Task WriteToFile(string filename, string content)
        {
            try
            {
                string path = await GetDocumentsPath();
                string filePath = Path.Combine(path, filename);

                Debug.WriteLine($"Writing to file: {filePath}");

                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }

                using (StreamWriter writer = new StreamWriter(filePath, append: true))
                {
                    await writer.WriteLineAsync(content);
                }

                Debug.WriteLine($"File written successfully: {filePath}");
            }
            catch (UnauthorizedAccessException ex)
            {
                Debug.WriteLine($"Permission error: {ex.Message}");
            }
            catch (IOException ex)
            {
                Debug.WriteLine($"IO error: {ex.Message}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Unexpected error: {ex.Message}");
            }
        }

        public async Task ShareFile(string filename)
        {
            try
            {
                string path = await GetDocumentsPath();
                string filePath = Path.Combine(path, filename);

                if (!File.Exists(filePath))
                {
                    Debug.WriteLine("File does not exist.");
                    return;
                }

                // Use the .NET MAUI Share API to share the file
                await Share.RequestAsync(new ShareFileRequest
                {
                    Title = "Share File",
                    File = new ShareFile(filePath)
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error sharing file: {ex.Message}");
            }
        }
    }
}
```

### Xamarin differences

In Xamarin, put the `Dependency` attribute above the namespace and use the Xamarin project namespaces. The class bodies stay the same.

```csharp
[assembly: Dependency(typeof(FileHelperAndroid))]
namespace YourNamespace.Droid
{
    public class FileHelperAndroid : IFileHelper
    {
        // Same members as the .NET MAUI Android implementation
    }
}
```

```csharp
[assembly: Dependency(typeof(FileHelperIOS))]
namespace YourNamespace.iOS
{
    public class FileHelperIOS : IFileHelper
    {
        // Same members as the .NET MAUI iOS implementation
    }
}
```

In Xamarin, `Share.RequestAsync` comes from Xamarin.Essentials. Change the comment in `ShareFile` to `// Use Xamarin.Essentials to share the file`. In .NET MAUI, the same API is part of MAUI.

## Register the service in .NET MAUI

In .NET MAUI, register the platform implementation in `MauiProgram.cs`. Xamarin does not need this step, because the `Dependency` attribute registers the class.

```csharp
public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        #if ANDROID
        builder.Services.AddSingleton<IFileHelper, FileHelperAndroid>();
        #elif IOS
        builder.Services.AddSingleton<IFileHelper, FileHelperIOS>();
        #endif

        return builder.Build();
    }
}
```

## Use the service in shared code

### Xamarin

Get the service from `DependencyService`. The shared Xamarin.Forms project is a .NET Standard library, so the `IOS` compiler symbol is not defined there. Check `Device.RuntimePlatform` at run time.

```csharp
public class SomeService
{
    private readonly IFileHelper _fileHelper;

    public SomeService()
    {
        _fileHelper = DependencyService.Get<IFileHelper>();
    }

    public async Task DoSomething()
    {
        string path = await _fileHelper.GetDocumentsPath();
        await _fileHelper.WriteToFile("test.txt", "Hello, World!");

        if (Device.RuntimePlatform == Device.iOS)
        {
            await _fileHelper.ShareFile("test.txt"); // Share the file on iOS
        }
    }
}
```

### .NET MAUI

Get the service through the constructor. In .NET MAUI, the `IOS` compiler symbol is defined for the iOS target, so `#if IOS` works in shared code. The commented-out lines show how to write a JSON log of a request and a response with Newtonsoft.Json.

```csharp
public class SomeService
{
    private readonly IFileHelper _fileHelper;

    public SomeService(IFileHelper fileHelper)
    {
        _fileHelper = fileHelper;
    }

    public async Task DoSomething()
    {
        string path = await _fileHelper.GetDocumentsPath();

        // Dictionary<string, object> model = new Dictionary<string, object>();
        // model.Add("Url", "https://gist.github.com/");
        // model.Add("DateTime", DateTime.Now);
        // model.Add("Request", "<csharp-request-object>");
        // model.Add("Response", "<csharp-response-object>");
        // // model.Add("Response", JsonConvert.DeserializeObject<T>("<http-response-string>"));
        // // // model.Add("Response", JsonConvert.DeserializeObject<object>("<http-response-string>"));
        // System.Diagnostics.Debug.WriteLine(JsonConvert.SerializeObject(model));
        // await _fileHelper.WriteToFile("test.json", JsonConvert.SerializeObject(model));
        await _fileHelper.WriteToFile("test.txt", "Hello, World!");

        #if IOS
        await _fileHelper.ShareFile("test.txt"); // Share the file on iOS
        #endif
    }
}
```

## Comparison

| Item | Xamarin | .NET MAUI |
| --- | --- | --- |
| Service location | `DependencyService.Get<IFileHelper>()` | Constructor injection |
| Registration | `[assembly: Dependency(typeof(...))]` on each platform class | `builder.Services.AddSingleton<IFileHelper, ...>()` in `MauiProgram.cs` |
| Platform namespaces | `YourNamespace.Droid`, `YourNamespace.iOS` | `YourNamespace.Platforms.Android`, `YourNamespace.Platforms.iOS` |
| Platform check in shared code | `Device.RuntimePlatform == Device.iOS` | `#if IOS` |

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
