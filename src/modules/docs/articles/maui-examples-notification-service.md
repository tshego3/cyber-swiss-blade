---
title: .NET MAUI example: Notification service with dependency injection
summary: Create a .NET MAUI notification service for toasts, alerts, confirmations, and push notifications, and inject it into ViewModels with dependency injection.
category: .NET MAUI
order: 130
---

# .NET MAUI example: Notification service with dependency injection

This tutorial creates a .NET MAUI service that handles notifications: toasts, alerts, confirmations, and push notifications. Dependency injection makes the service available in the whole application.

## Before you start

- A .NET MAUI project with a `MainPage` and a `MainViewModel`.
- The `CommunityToolkit.Maui` NuGet package for the toasts (`CommunityToolkit.Maui.Alerts`). The first task installs it.

## Add the CommunityToolkit.Maui package

`NotificationService` uses `CommunityToolkit.Maui.Alerts` for the toast and `CommunityToolkit.Maui.Core` for `ToastDuration`, so the project does not compile without this package. If you do not want toasts, remove `ShowToast` from the interface and the implementation, and skip this task.

1. Add the package:

   ```bash
   dotnet add package CommunityToolkit.Maui
   ```

2. Call `UseMauiCommunityToolkit()` in `MauiProgram.cs`. The full file is in [Register the service](#register-the-service).

## Create the notification service interface

Define an interface for the notification service. With an interface, you can mock or replace the service.

```csharp
using CommunityToolkit.Maui.Core;

public interface INotificationService
{
    Task ShowToast(string message, ToastDuration toastDuration);
    Task ShowAlertAsync(string title, string message, string cancel = "OK");
    Task<bool> ShowConfirmationAsync(string title, string message, string accept = "Yes", string cancel = "No");
    Task SendPushNotification(string title, string message);
    Task SendLocalNotification(string title, string message);
}
```

## Implement the notification service

Implement the interface. The toast uses the Community Toolkit. The alert and the confirmation use `DisplayAlert` on the page of the first window. The push notification and the local notification are placeholders.

> **NOTE:** Dated (checked November 2026): In .NET 10, `DisplayAlert` is obsolete. Use `DisplayAlertAsync` with the same parameters.

```csharp
using CommunityToolkit.Maui.Core;
using Microsoft.Maui.Controls;

public class NotificationService : INotificationService
{
    public async Task ShowToast(string message, ToastDuration toastDuration)
    {
        await CommunityToolkit.Maui.Alerts.Toast.Make(message, toastDuration).Show();
    }

    public async Task ShowAlertAsync(string title, string message, string cancel)
    {
        await Application.Current!.Windows[0].Page!.DisplayAlert(title, message, cancel);
    }

    public async Task<bool> ShowConfirmationAsync(string title, string message, string accept, string cancel)
    {
        return await Application.Current!.Windows[0].Page!.DisplayAlert(title, message, accept, cancel);
    }

    public async Task SendPushNotification(string title, string message)
    {
        // Implement push notification logic here
        // This could involve using a third-party service like Firebase Cloud Messaging (FCM)
        // or a platform-specific notification API.

        await Task.Delay(1000);
    }

    public async Task SendLocalNotification(string title, string message)
    {
        // Implement local notification logic here
        // This could involve using a third-party service like Firebase Cloud Messaging (FCM)
        // or a platform-specific notification API.

        await Task.Delay(1000);
    }
}
```

## Register the service

In `MauiProgram.cs`, register `NotificationService` as a singleton. Then you can inject it where necessary. Register the ViewModel and the page too.

```csharp
using CommunityToolkit.Maui;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Maui.Controls.Hosting;
using Microsoft.Maui.Hosting;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit() // Add this line
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

        builder.Services.AddTransient<MainViewModel>();
        builder.Services.AddTransient<MainPage>();

        builder.Services.AddSingleton<INotificationService, NotificationService>();

        return builder.Build();
    }
}
```

The new lines are `UseMauiCommunityToolkit()` (for the toast) and the three `builder.Services` registrations.

## Inject and use the service

Inject `INotificationService` into ViewModels, pages, or other services.

```csharp
using CommunityToolkit.Maui.Core;

public class MainViewModel
{
    private readonly INotificationService _notificationService;

    public MainViewModel(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task ShowNotification()
    {
        await _notificationService.ShowToast("This is a toast message!", ToastDuration.Short);
        await _notificationService.ShowAlertAsync("Alert", "This is an alert message.");
        bool result = await _notificationService.ShowConfirmationAsync("Confirm", "Are you sure?");
        if (result)
        {
            await _notificationService.SendPushNotification("Notification", "You confirmed!");
            await _notificationService.SendLocalNotification("Notification", "You confirmed!");
        }
    }
}
```

## Use the ViewModel in the page

Inject the ViewModel into the page, set it as the binding context, and call the notification method.

```csharp
public partial class MainPage : ContentPage
{
    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    private async void OnButtonClicked(object sender, EventArgs e)
    {
        var viewModel = BindingContext as MainViewModel;
        await viewModel.ShowNotification();
    }
}
```

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
