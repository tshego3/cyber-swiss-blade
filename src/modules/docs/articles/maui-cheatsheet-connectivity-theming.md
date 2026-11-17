---
title: Internet connection checks and dark or light themes in .NET MAUI
summary: Check and monitor the internet connection with the Connectivity API, and apply, detect, and toggle dark and light themes in a .NET MAUI app.
category: .NET MAUI
order: 80
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# Internet connection checks and dark or light themes in .NET MAUI

This article shows how to check the internet connection with the `Connectivity` API. It also shows how to use dark and light themes, and how to use the 2 features on 1 page.

## Before you start

- For Android, add these permissions to the `AndroidManifest.xml` file:

  ```xml
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.INTERNET" />
  ```

## Check the internet connection

Use the `Connectivity` class to get the network access and type:

```csharp
using Microsoft.Maui.Networking;

public bool IsInternetAvailable()
{
    var current = Connectivity.NetworkAccess;

    if (current == NetworkAccess.Internet)
    {
        Debug.WriteLine("Internet is available");
        return true;
    }
    else
    {
        Debug.WriteLine("No internet access");
        return false;
    }
}
```

Example call:

```csharp
if (IsInternetAvailable())
{
    // Proceed with network operations
}
else
{
    DisplayAlert("No Internet", "Please check your internet connection.", "OK");
}
```

> **NOTE:** Dated (checked November 2026): .NET 10 marks `DisplayAlert` as obsolete. Use `await DisplayAlertAsync(...)`.

## Monitor connection changes

Subscribe to the `ConnectivityChanged` event to react to network changes in real time:

```csharp
public void MonitorConnectivity()
{
    Connectivity.ConnectivityChanged += ConnectivityChangedHandler;
}

private void ConnectivityChangedHandler(object sender, ConnectivityChangedEventArgs e)
{
    if (e.NetworkAccess == NetworkAccess.Internet)
    {
        Debug.WriteLine("Internet connection restored");
    }
    else
    {
        Debug.WriteLine("Internet connection lost");
    }
}
```

## Use dark and light themes

.NET MAUI supports dark and light themes by default. You can apply a theme from the system settings or change the theme while the app runs.

### Define theme resources

Add theme colors and styles in `App.xaml` or in a separate resource dictionary:

```xml
<Application.Resources>
    <ResourceDictionary>
        <!-- Light Theme -->
        <ResourceDictionary x:Key="LightTheme">
            <Color x:Key="BackgroundColor">White</Color>
            <Color x:Key="TextColor">Black</Color>
        </ResourceDictionary>

        <!-- Dark Theme -->
        <ResourceDictionary x:Key="DarkTheme">
            <Color x:Key="BackgroundColor">Black</Color>
            <Color x:Key="TextColor">White</Color>
        </ResourceDictionary>
    </ResourceDictionary>
</Application.Resources>
```

### Follow the system theme

Use `AppThemeBinding` to switch the values automatically when the system theme changes:

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MyMauiApp.MainPage"
             BackgroundColor="{AppThemeBinding Light=White, Dark=Black}">

    <Label Text="Hello, MAUI!"
           TextColor="{AppThemeBinding Light=Black, Dark=White}"
           HorizontalOptions="Center"
           VerticalOptions="Center" />
</ContentPage>
```

### Change the theme in code

Set the `Application.Current.UserAppTheme` property:

```csharp
// Set Light Theme
Application.Current.UserAppTheme = AppTheme.Light;

// Set Dark Theme
Application.Current.UserAppTheme = AppTheme.Dark;

// Follow System Theme
Application.Current.UserAppTheme = AppTheme.Unspecified;
```

### Detect the system theme

Read the `Application.Current.RequestedTheme` property:

```csharp
var currentTheme = Application.Current.RequestedTheme;

if (currentTheme == AppTheme.Dark)
{
    Debug.WriteLine("Dark theme is active");
}
else if (currentTheme == AppTheme.Light)
{
    Debug.WriteLine("Light theme is active");
}
```

### Add a toggle button

```xml
<Button Text="Toggle Theme"
        Clicked="OnToggleThemeClicked"
        HorizontalOptions="Center"
        VerticalOptions="Center" />
```

The `OnToggleThemeClicked` handler is in the full page code in the next section.

## Combine the connection check and theming

This page shows the internet status, has a button to check the connection, and has a button to toggle the theme. The status label updates on the main thread when the connection changes.

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MyMauiApp.MainPage"
             BackgroundColor="{AppThemeBinding Light=White, Dark=Black}">

    <StackLayout>
        <Label Text="Internet Status:"
               TextColor="{AppThemeBinding Light=Black, Dark=White}"
               HorizontalOptions="Center"
               VerticalOptions="Center" />

        <Label x:Name="InternetStatusLabel"
               TextColor="{AppThemeBinding Light=Black, Dark=White}"
               HorizontalOptions="Center"
               VerticalOptions="Center" />

        <Button Text="Check Internet"
                Clicked="OnCheckInternetClicked"
                HorizontalOptions="Center"
                VerticalOptions="Center" />

        <Button Text="Toggle Theme"
                Clicked="OnToggleThemeClicked"
                HorizontalOptions="Center"
                VerticalOptions="Center" />
    </StackLayout>
</ContentPage>
```

```csharp
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        MonitorConnectivity();
    }

    private void OnCheckInternetClicked(object sender, EventArgs e)
    {
        InternetStatusLabel.Text = IsInternetAvailable() ? "Connected" : "Disconnected";
    }

    private void OnToggleThemeClicked(object sender, EventArgs e)
    {
        if (Application.Current.UserAppTheme == AppTheme.Dark)
        {
            Application.Current.UserAppTheme = AppTheme.Light;
        }
        else
        {
            Application.Current.UserAppTheme = AppTheme.Dark;
        }
    }

    private bool IsInternetAvailable()
    {
        var current = Connectivity.NetworkAccess;
        return current == NetworkAccess.Internet;
    }

    private void MonitorConnectivity()
    {
        Connectivity.ConnectivityChanged += ConnectivityChangedHandler;
    }

    private void ConnectivityChangedHandler(object sender, ConnectivityChangedEventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            InternetStatusLabel.Text = e.NetworkAccess == NetworkAccess.Internet ? "Connected" : "Disconnected";
        });
    }
}
```

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
- [.NET MAUI resources and libraries](doc:maui-cheatsheet-resources)
