---
title: .NET MAUI guide: Application Insights logging
summary: Send logs, events, and exceptions from a .NET MAUI app to Azure Application Insights, with session and device data on each telemetry item.
category: .NET MAUI
order: 250
---

# .NET MAUI guide: Application Insights logging

This guide shows how to send telemetry from a .NET MAUI app to Azure Application Insights through the .NET logging framework. It also adds session and device data to each telemetry item.

## Before you start

- An Azure subscription.
- The NuGet package `Microsoft.Extensions.Logging.ApplicationInsights`, version 2.22.0-beta3.

> **NOTE:** Dated (checked November 2026): 2.22.0-beta3 is a prerelease, and stable 2.x versions of the package came after it. Microsoft now recommends OpenTelemetry with the Azure Monitor exporter for new apps, and version 3.x of the Application Insights SDK is built on OpenTelemetry. Check NuGet for the current version before you pick a package.

## Create the Application Insights resource

1. Open the [Azure portal](https://portal.azure.com).
2. Click **Create a resource**.
3. In the **New** window, search for "Application Insights".
4. Select **Application Insights**, then click **Create**.
5. Enter the settings, for example the subscription, the resource group, and the region.
6. Click **Review + Create**, then click **Create**.
7. Copy the **Connection String** of the new resource. You need it to configure the app.

## Install the package

Install `Microsoft.Extensions.Logging.ApplicationInsights` with the NuGet Package Manager in Visual Studio, or add this reference to the project file:

```xml
<PackageReference Include="Microsoft.Extensions.Logging.ApplicationInsights" Version="2.22.0-beta3" />
```

The package connects Application Insights to the .NET logging framework.

## Configure Application Insights

In `MauiProgram.cs` (or your startup file), add Application Insights to the logging builder. Replace `YOUR-CONNECTION-STRING` with the connection string from the Azure resource.

```csharp
builder.Logging.AddApplicationInsights(configuration =>
{
    // Add a custom telemetry initializer to attach additional context data
    configuration.TelemetryInitializers.Add(new ApplicationInitializer());

    // Set the connection string from your Azure Application Insights resource
    configuration.ConnectionString = "YOUR-CONNECTION-STRING";
}, options =>
{
    // Option to include scopes for richer logging context
    options.IncludeScopes = true;
});
```

`IncludeScopes` adds the log scopes to the telemetry for more context.

## Add session and device data

Implement `ITelemetryInitializer` to add data to each telemetry item. This initializer adds a session ID, the device operating system, the manufacturer, the model, and the app version.

```csharp
using Microsoft.ApplicationInsights.Channel;
using Microsoft.ApplicationInsights.Extensibility;

public class ApplicationInitializer : ITelemetryInitializer
{
    public string SessionId { get; } = Guid.NewGuid().ToString();
    public string? DeviceOperationSystem { get; } = DeviceInfo.Current.Platform.ToString();
    public string DeviceOemName { get; } = DeviceInfo.Current.Manufacturer;
    public string DeviceModel { get; } = DeviceInfo.Current.Model;
    public string ComponentVersion { get; } = AppInfo.Current.VersionString;

    public void Initialize(ITelemetry telemetry)
    {
        telemetry.Context.Session.Id = SessionId;
        telemetry.Context.Device.OperatingSystem = DeviceOperationSystem;
        telemetry.Context.Device.OemName = DeviceOemName;
        telemetry.Context.Device.Model = DeviceModel;
        telemetry.Context.Component.Version = ComponentVersion;
    }
}
```

## Log events and exceptions

To log a custom event, use the `ILogger` interface:

```csharp
private readonly ILogger<MyService> logger;

public MyService(ILogger<MyService> logger)
{
    this.logger = logger;
}

public void MyAction(string parameter)
{
    // Log information when an action is executed
    logger.LogInformation("My action executed with parameter: {Parameter}", parameter);
}
```

To log an exception with its details:

```csharp
try
{
    // Code that might throw an exception
}
catch (Exception ex)
{
    // Log the exception details using the logger
    logger.LogError(ex, "Something went wrong");
}
```

## Related links

- [Azure portal](https://portal.azure.com)
- [.NET console app with Application Insights](doc:dotnet-console-application-insights)
