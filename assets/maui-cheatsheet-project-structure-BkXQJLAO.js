var e=`---
title: .NET MAUI project structure and lifecycle
summary: The .NET MAUI project layout, when to use MainPage or AppShell, the CreateWindow method, and page, app, and view lifecycle events.
category: .NET MAUI
order: 60
---

# .NET MAUI project structure and lifecycle

This article explains the files in a .NET MAUI project and how the app creates its first window and page. It also shows the lifecycle events of pages, the application, and views.

## Project layout

A typical .NET MAUI project has this structure:

| Item | Content |
| --- | --- |
| \`Platforms\` | Platform-specific code and resources: \`Android\`, \`iOS\`, \`MacCatalyst\`, \`Windows\`, and others. |
| \`Resources\` | App-wide resources: \`Images\`, \`Fonts\`, \`Styles\`, \`Raw\`, and others. |
| \`App.xaml\` | Global resources and the entry point of the application. |
| \`App.xaml.cs\` | The code-behind file for \`App.xaml\`. It contains the \`App\` class, which is the entry point of the application. |
| \`MainPage.xaml\` | The default page (UI) of the application. |
| \`MainPage.xaml.cs\` | The code-behind file for \`MainPage.xaml\`. |
| \`AppShell.xaml\` | Optional. The Shell-based navigation structure of the app. |
| \`AppShell.xaml.cs\` | The code-behind file for \`AppShell.xaml\`. |

## Compare MainPage and AppShell

| Item | Definition | Use it when |
| --- | --- | --- |
| \`MainPage\` | The default page that shows when the application starts. It is a single-page UI. | The app has 1 page or very simple navigation. You do not need flyout menus or tabs. You want a simple, light app structure. |
| \`AppShell\` | A navigation structure that defines hierarchical navigation, with flyout menus, tabs, and nested navigation. | The app has many pages and needs structured navigation. You want flyout menus, tabs, or nested navigation. You need the same UI structure on all platforms. |

## Set the first page

### Set MainPage in the constructor (old approach)

Older versions (similar to Xamarin.Forms) set the \`MainPage\` property in the \`App\` constructor:

\`\`\`csharp
public App()
{
    InitializeComponent();
    MainPage = new MainPage(); // Sets MainPage as the starting page
}
\`\`\`

To start with Shell navigation, set \`MainPage\` to an \`AppShell\` instance:

\`\`\`csharp
public App()
{
    InitializeComponent();
    MainPage = new AppShell(); // Sets AppShell as the starting point
}
\`\`\`

> **NOTE:** Dated (checked November 2026): .NET 9 marks the \`Application.MainPage\` property as obsolete. Override \`CreateWindow\` and pass the first page to a new \`Window\`, as the next section shows.

### Override CreateWindow (new approach)

In .NET MAUI, override the \`CreateWindow\` method. This method gives more control over the creation of the application window:

\`\`\`csharp
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new MainPage()); // Create a new Window with MainPage
    }
}
\`\`\`

\`CreateWindow\` lets you:

- Customize the window (for example, set the size, the title, or other properties).
- Do platform-specific initialization.
- Support more than 1 window (for example, on desktop platforms).

## Use AppShell

### AppShell.xaml

\`\`\`xml
<Shell xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
       xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
       xmlns:views="clr-namespace:YourAppNamespace.Views"
       x:Class="YourAppNamespace.AppShell">

    <FlyoutItem Title="Home">
        <ShellContent Route="MainPage" ContentTemplate="{DataTemplate views:MainPage}" />
    </FlyoutItem>

    <FlyoutItem Title="Settings">
        <ShellContent Route="SettingsPage" ContentTemplate="{DataTemplate views:SettingsPage}" />
    </FlyoutItem>

</Shell>
\`\`\`

### AppShell.xaml.cs

\`\`\`csharp
public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
    }
}
\`\`\`

### App.xaml.cs

\`\`\`csharp
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new AppShell());
    }
}
\`\`\`

## Use lifecycle events

.NET MAUI has lifecycle events for important moments in the life of pages, views, and the application.

| Event | Scope | When it occurs |
| --- | --- | --- |
| \`OnAppearing\` | Page | The page is about to appear. |
| \`OnDisappearing\` | Page | The page is about to disappear. |
| \`OnStart\` | Application | The application starts. |
| \`OnSleep\` | Application | The application goes to the background. |
| \`OnResume\` | Application | The application comes back from the background. |
| \`OnParentSet\`, \`OnSizeAllocated\` | View | Override these methods in custom views. |

### Page lifecycle events

\`\`\`csharp
protected override void OnAppearing()
{
    base.OnAppearing();
    Debug.WriteLine("Page is appearing");
    // Perform actions like loading data or starting animations
}

protected override void OnDisappearing()
{
    base.OnDisappearing();
    Debug.WriteLine("Page is disappearing");
    // Perform cleanup or stop animations
}
\`\`\`

### Application lifecycle events

\`\`\`csharp
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new AppShell());
    }

    protected override void OnStart()
    {
        Debug.WriteLine("App is starting");
        // Perform actions like initializing services
    }

    protected override void OnSleep()
    {
        Debug.WriteLine("App is sleeping");
        // Save state or pause ongoing tasks
    }

    protected override void OnResume()
    {
        Debug.WriteLine("App is resuming");
        // Restore state or resume tasks
    }
}
\`\`\`

### View lifecycle events

\`\`\`csharp
public class CustomView : ContentView
{
    protected override void OnParentSet()
    {
        base.OnParentSet();
        Debug.WriteLine("CustomView parent has been set");
    }

    protected override void OnSizeAllocated(double width, double height)
    {
        base.OnSizeAllocated(width, height);
        Debug.WriteLine($"CustomView size allocated: {width}x{height}");
    }
}
\`\`\`

## Related links

- [Shell overview](https://learn.microsoft.com/en-us/dotnet/maui/fundamentals/shell/?view=net-maui-9.0)
- [.NET MAUI Shell sample](https://github.com/dotnet/maui-samples/tree/main/9.0/Fundamentals/Shell)
- [Reusable components in .NET MAUI](doc:maui-cheatsheet-reusable-components)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
`;export{e as default};