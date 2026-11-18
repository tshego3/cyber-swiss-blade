var e=`---
title: .NET MAUI cheat sheet
summary: Commands, project setup, VS Code debugging, and short XAML and C# samples for UI, navigation, binding, DI, platform code, and more in .NET MAUI.
category: .NET MAUI
order: 10
---

# .NET MAUI cheat sheet

This cheat sheet is a quick reference for cross-platform app development with .NET MAUI. It covers the SDK, project setup, debugging in VS Code, and short samples for the most frequent tasks.

## Before you start

- The .NET SDK with the \`maui\` workload. The samples use the \`net10.0-android\` and \`net10.0-ios\` target frameworks.
- For iOS builds: a Mac with Xcode and the iOS SDK.
- For Android builds: the Android SDK. To find connected devices, you need \`adb\` from the SDK \`platform-tools\` folder.

## Cheat sheet parts

| Article | Content |
| --- | --- |
| [.NET MAUI resources and libraries](doc:maui-cheatsheet-resources) | Documentation, samples, books, third-party libraries, local database packages. |
| [iOS code signing for .NET MAUI](doc:maui-cheatsheet-ios-code-signing) | Apple certificates, bundle IDs, provisioning profiles, repair and replacement. |
| [.NET MAUI DevOps, CI/CD, and environment setup](doc:maui-cheatsheet-devops) | CI/CD resources, macOS paths, environment variables. |
| [MSAL authentication in .NET MAUI](doc:maui-cheatsheet-msal-authentication) | MSAL.NET and Entra ID links, B2C username fix. |
| [.NET MAUI project structure and lifecycle](doc:maui-cheatsheet-project-structure) | Project layout, \`MainPage\` and \`AppShell\`, \`CreateWindow\`, lifecycle events. |
| [Reusable components in .NET MAUI](doc:maui-cheatsheet-reusable-components) | \`ContentView\` controls, bindable properties, components in loops. |
| [Internet connection checks and dark or light themes in .NET MAUI](doc:maui-cheatsheet-connectivity-theming) | \`Connectivity\` API, \`AppThemeBinding\`, theme toggle. |
| [ObservableObject and INotifyPropertyChanged in .NET MAUI](doc:maui-cheatsheet-mvvm) | MVVM view models, login and notes example, ancestor binding context. |

## Install and manage the SDK

| Task | Command |
| --- | --- |
| Install the .NET MAUI SDK manually | \`dotnet workload install maui\` |
| Verify that the .NET MAUI SDK is installed | \`dotnet workload list\` |
| Update the workloads to match the latest installed SDK | \`dotnet workload update\` |
| Show the NuGet dependencies of the project that have newer versions | \`dotnet list package --outdated\` |

### Uninstall .NET from a Mac

If you installed .NET with Homebrew, run this command:

\`\`\`bash
brew uninstall --cask dotnet-sdk
\`\`\`

If you installed .NET with the official \`.pkg\` installer, remove the SDK and the runtime manually:

1. Remove the SDK and runtime folder. The default location of the SDK and the runtime is \`/usr/local/share/dotnet/\`.

   \`\`\`bash
   sudo rm -rf /usr/local/share/dotnet
   \`\`\`

2. If there is a symlink in \`/usr/local/bin/\` that points to the .NET executables, remove it:

   \`\`\`bash
   sudo rm /usr/local/bin/dotnet
   \`\`\`

3. For a complete removal, also remove the remaining files in \`/usr/local/\`:

   \`\`\`bash
   sudo rm -rf /usr/local/lib/dotnet
   sudo rm -rf /usr/local/etc/dotnet
   \`\`\`

4. Optional: if you installed global NuGet packages, remove them:

   \`\`\`bash
   rm -rf ~/.nuget
   \`\`\`

5. Verify the removal:

   \`\`\`bash
   dotnet --version
   \`\`\`

## Create, build, and run a project

### Commands

\`\`\`bash
# Create a new .NET MAUI project
dotnet new maui -n MyMauiApp

# Enter the project directory
cd MyMauiApp

# Restore NuGet packages
dotnet restore

#######################
# Android (Droid) Commands
#######################

# Clean the project for Android (if needed)
dotnet clean -f net10.0-android

# Build the project targeting Android
dotnet build -f net10.0-android

# Run/Deploy the app on an Android emulator or device
dotnet run -f net10.0-android

# Publish the project for Android in Release configuration
dotnet publish -f net10.0-android -c Release

#######################
# iOS Commands
#######################

# Clean the project for iOS (if needed)
dotnet clean -f net10.0-ios -r ios-arm64

# Build the project targeting iOS (requires macOS with iOS SDK)
dotnet build -f net10.0-ios -r ios-arm64
dotnet build -f net10.0-ios -r ios-arm64 -c Release

# Run the app on an iOS simulator/device
dotnet run -f net10.0-ios -r ios-arm64

# Publish the project for iOS in Release configuration
dotnet publish -f net10.0-ios -r ios-arm64 -c Release
\`\`\`

To build and run in 1 step, use the \`Run\` target:

\`\`\`bash
dotnet build -t:Run -f net10.0-android
dotnet build -t:Run -f net10.0-ios -r ios-arm64
\`\`\`

### Update the project file

These \`.csproj\` settings set the iOS runtime identifiers and the Release settings for iOS. The commented \`ValidateXcodeVersion\` line lets the project build with Xcode 26.1.1 when the installed .NET workload expects Xcode 26.2.

\`\`\`xml
<PropertyGroup Condition="$(TargetFramework.Contains('-ios'))">
  <RuntimeIdentifiers>ios-arm64;iossimulator-arm64;iossimulator-x64</RuntimeIdentifiers>
  <!-- This "changes the project" to allow building against Xcode 26.1.1, even though the installed .NET workload expects Xcode 26.2. This is the cleanest way to satisfy "change the project to use a xcode version 26.1.1". -->
  <!-- <ValidateXcodeVersion>false</ValidateXcodeVersion> -->
</PropertyGroup>

<PropertyGroup Condition="'$(Configuration)|$(TargetFramework)|$(Platform)'=='Release|net10.0-ios|AnyCPU'">
  <ApplicationId>mymauiapp</ApplicationId>
  <EnableAssemblyILStripping>false</EnableAssemblyILStripping>
</PropertyGroup>
\`\`\`

For the iOS signing settings in the \`.csproj\` file, see [Configure signing in the project file](doc:maui-cheatsheet-ios-code-signing#configure-signing-in-the-project-file).

## Configure VS Code for debugging

These \`.vscode/\` files set up 2 debug targets: iOS (iPhone 16) and Android (Pixel 9, API 35). Each launch configuration runs a build task first (\`preLaunchTask\`).

To find the device ID for \`_DeviceName\`:

| Platform | Command |
| --- | --- |
| iOS simulators | \`xcrun simctl list devices --json\` |
| iOS physical devices connected to the Mac | \`xcrun xctrace list devices\` |
| Android | \`adb devices\` |
| Android: confirm the device model | \`adb -s <device_id> shell getprop ro.product.model\` |

> **TIP:** To run \`adb\`, open **Android Studio > View > Tool Windows > Terminal**, or open the macOS Terminal. If the shell does not find \`adb\`, add the SDK \`platform-tools\` folder to your path: \`export PATH=$PATH:~/Library/Android/sdk/platform-tools\`.

### launch.json

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "iOS",
      "type": "coreclr",
      "request": "launch",
      "program": "dotnet",
      "args": [
        "build",
        "-t:Run",
        "-f:net10.0-ios",
        // iPhone 16 - Run bash cmd to find iOS device UDIDs: xcrun simctl list devices --json or xcrun xctrace list devices for actual physical devices connected to your Mac
        "-p:_DeviceName=:v2:udid:<device_id>"
      ],
      "cwd": "\${workspaceFolder}",
      "stopAtEntry": false,
      "console": "integratedTerminal",
      "preLaunchTask": "build-ios"
    },
    {
      "name": "Android",
      "type": "coreclr",
      "request": "launch",
      "program": "dotnet",
      "args": [
        "build",
        "-t:Run",
        "-f:net10.0-android36.0",
        // Pixel 9 - Run bash cmd to find Android device UDIDs: adb devices
        // Open Android Studio > View > Tool Windows > Terminal OR just open the macOS Terminal.
        // If adb is not recognized, you may need to add the SDK platform-tools to your path: export PATH=$PATH:~/Library/Android/sdk/platform-tools
        // To ensure that it's a Pixel 9, run: adb -s <device_id> shell getprop ro.product.model
        "-p:_DeviceName=:v2:udid:<device_id>"
        // "-p:AndroidSdkVersion=35.0"
      ],
      "cwd": "\${workspaceFolder}",
      "stopAtEntry": false,
      "console": "integratedTerminal",
      "preLaunchTask": "build-android"
    }
  ]
}
\`\`\`

### tasks.json

\`\`\`json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build-ios",
      "type": "shell",
      "command": "dotnet clean && dotnet build -f net10.0-ios -r ios-arm64",
      "group": "build",
      "problemMatcher": "$msCompile"
    },
    {
      "label": "build-android",
      "type": "shell",
      "command": "dotnet clean && dotnet build -f net10.0-android36.0",
      "group": "build",
      "problemMatcher": "$msCompile"
    }
  ]
}
\`\`\`

## UI elements

### Label

\`\`\`xml
<Label Text="{x:Static local:Constants.WelcomeText}" />
<Label Text="Hello, MAUI!"
       FontSize="24"
       TextColor="Blue"
       HorizontalOptions="Center"
       VerticalOptions="Center" />
\`\`\`

### Button

> **NOTE:** Dated (checked November 2026): .NET 10 marks \`DisplayAlert\` and \`DisplayActionSheet\` as obsolete. Use \`DisplayAlertAsync\` and \`DisplayActionSheetAsync\`. The samples in this article keep the old names.

\`\`\`xml
<Button Text="Click Me"
        Clicked="OnButtonClicked"
        HorizontalOptions="Center"
        VerticalOptions="Center" />
\`\`\`

\`\`\`csharp
private void OnButtonClicked(object sender, EventArgs e)
{
    DisplayAlert("Button Clicked", "You clicked the button!", "OK");
}
\`\`\`

### Entry

An \`Entry\` is a text input.

\`\`\`xml
<Entry Placeholder="Enter text here"
       Text="{Binding UserInput}"
       HorizontalOptions="FillAndExpand" />
\`\`\`

> **NOTE:** Dated (checked November 2026): .NET MAUI marks the \`AndExpand\` layout options (for example, \`FillAndExpand\`) as obsolete. Use \`Fill\`, or use a \`Grid\` to give the control the remaining space.

### Image

\`\`\`xml
<Image Source="dotnet_bot.png"
       Aspect="AspectFill"
       HorizontalOptions="Center"
       VerticalOptions="Center" />
\`\`\`

### ListView

> **NOTE:** Dated (checked November 2026): .NET 10 marks \`ListView\` and the cell types (for example, \`ViewCell\`) as obsolete. Use \`CollectionView\` with a \`DataTemplate\` for new code.

\`\`\`xml
<ListView ItemsSource="{Binding Items}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <ViewCell>
                <Label Text="{Binding Name}" />
            </ViewCell>
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>
\`\`\`

## Layouts

### StackLayout

\`\`\`xml
<StackLayout Orientation="Vertical"
             Spacing="10"
             Padding="20">
    <Label Text="First Item" />
    <Label Text="Second Item" />
    <Button Text="Click Me" />
</StackLayout>
\`\`\`

### Grid

\`\`\`xml
<Grid RowDefinitions="Auto, Auto, *"
      ColumnDefinitions="*, *"
      RowSpacing="10"
      ColumnSpacing="10">
    <Label Text="Row 0, Column 0" Grid.Row="0" Grid.Column="0" />
    <Label Text="Row 0, Column 1" Grid.Row="0" Grid.Column="1" />
    <Button Text="Click Me" Grid.Row="1" Grid.ColumnSpan="2" />
</Grid>
\`\`\`

### AbsoluteLayout

\`\`\`xml
<AbsoluteLayout>
    <BoxView Color="Red"
             AbsoluteLayout.LayoutFlags="PositionProportional"
             AbsoluteLayout.LayoutBounds="0.5, 0.5, 100, 100" />
</AbsoluteLayout>
\`\`\`

## Navigation

| Method | Navigation stack | Use |
| --- | --- | --- |
| \`PushAsync\` | Adds the page to the stack. Back navigation is possible. | Linear navigation. |
| \`PushModalAsync\` | Adds the page to the separate modal stack, not to the navigation stack. Close the page explicitly with \`PopModalAsync\`. | Modal, temporary interactions. |

Go to a new page:

\`\`\`csharp
await Shell.Current.GoToAsync(nameof(NewPage));
await Shell.Current.Navigation.PushAsync(new NewPage());
await Navigation.PushAsync(new NewPage());
\`\`\`

Go back:

\`\`\`csharp
await Shell.Current.Navigation.PopAsync();
await Navigation.PopAsync();
\`\`\`

Open and close a modal page:

\`\`\`csharp
await Shell.Current.Navigation.PushModalAsync(new ModalPage());
await Shell.Current.Navigation.PopModalAsync();
await Navigation.PushModalAsync(new ModalPage());
await Navigation.PopModalAsync();
\`\`\`

## Data binding

### BindingContext

\`\`\`csharp
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        BindingContext = new MainViewModel();
    }
}
\`\`\`

### Two-way binding

\`\`\`xml
<Entry Text="{Binding UserInput, Mode=TwoWay}" />
\`\`\`

### Command binding

The second button sends the \`NoteId\` property of the current data context as the \`CommandParameter\`. The third button sends the full note object of the current data context.

\`\`\`xml
<Button Text="Click Me"
        Command="{Binding ClickCommand}" />

<!-- This binds the CommandParameter to the NoteId property of the current data context. -->
<Button Text="Delete"
        Command="{Binding DeleteNoteAsync}"
        CommandParameter="{Binding NoteId}" />

<!-- This binds the CommandParameter to the entire current data context note object. -->
<Button Text="Delete"
        Command="{Binding DeleteNoteAsync}"
        CommandParameter="{Binding .}" />
\`\`\`

\`\`\`csharp
public class MainViewModel : INotifyPropertyChanged
{
    public ICommand ClickCommand { get; }

    public MainViewModel()
    {
        ClickCommand = new Command(OnClick);
    }

    private void OnClick()
    {
        // Handle click
    }
}
\`\`\`

For \`ObservableObject\` view models, see [ObservableObject and INotifyPropertyChanged in .NET MAUI](doc:maui-cheatsheet-mvvm).

## Dependency injection

Register the services in \`MauiProgram.cs\`:

\`\`\`csharp
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
            });

        builder.Services.AddSingleton<IMyService, MyService>();
        builder.Services.AddTransient<MainPage>();

        return builder.Build();
    }
}
\`\`\`

Inject a service in the constructor:

\`\`\`csharp
public partial class MainPage : ContentPage
{
    private readonly IMyService _myService;

    public MainPage(IMyService myService)
    {
        InitializeComponent();
        _myService = myService;
    }
}
\`\`\`

## Platform-specific code

### Check for the UI thread

\`\`\`csharp
if (MainThread.IsMainThread && isCallerBatchService == false /* For iOS, since background services only run within the app, they possess a UI thread. */)
{
    // source code
}
\`\`\`

### Device information

\`\`\`csharp
var deviceType = DeviceInfo.DeviceType; // Physical or Virtual
var platform = DeviceInfo.Platform; // Android, iOS, etc.
\`\`\`

### Platform-specific XAML

\`\`\`xml
<ContentPage>
    <ContentPage.Padding>
        <OnPlatform x:TypeArguments="Thickness">
            <On Platform="iOS" Value="0,20,0,0" />
            <On Platform="Android" Value="0,0,0,0" />
        </OnPlatform>
    </ContentPage.Padding>
</ContentPage>
\`\`\`

## Capture a photo or pick a file

These snippets let the user capture a photo or select a file, with fallback messages. The result is a byte array.

### Define the options

\`MediaSelectionOptions\` defines 3 options: \`CapturePicture\`, \`CaptureVideo\`, and \`SelectFile\`. The \`StringEnumConverter\` serializes and deserializes the values as strings. \`EnumMember\` gives the string value of each member.

\`\`\`csharp
[Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
public enum MediaSelectionOptions : int
{
    [EnumMember(Value = "Capture Picture"), Display(Name = "Capture Picture")]
    CapturePicture = 0,
    [EnumMember(Value = "Capture Video"), Display(Name = "Capture Video")]
    CaptureVideo = 1,
    [EnumMember(Value = "Select File"), Display(Name = "Select File")]
    SelectFile = 2
}
\`\`\`

### Declare the variables

\`result\` holds the result of the capture or file selection. \`stream\` holds the stream of the selected or captured file.

\`\`\`csharp
FileResult? result = null;
Stream? stream = null;
\`\`\`

### Show the action sheet

\`DisplayActionSheet\` shows a dialog with 2 options: capture a picture or select a file.

\`\`\`csharp
string action = await Shell.Current.DisplayActionSheet(
    "Would you like to take a picture or select one?",
    "Cancel",
    null,
    nameof(Enums.MediaSelectionOptions.CapturePicture),
    nameof(Enums.MediaSelectionOptions.SelectFile)
);
\`\`\`

### Handle the selection

\`Enum.TryParse\` converts the selected action to a \`MediaSelectionOptions\` value. The \`switch\` statement then does 1 of these tasks:

- **CapturePicture**: If the device supports photo capture, it captures a photo and opens a stream to the photo.
- **SelectFile**: It opens a file picker and opens a stream to the selected file.

\`DisplayAlert\` shows errors and information.

\`\`\`csharp
if (Enum.TryParse<Enums.MediaSelectionOptions>(action, out var selectedOption))
{
    switch (selectedOption)
    {
        case Enums.MediaSelectionOptions.CapturePicture:
            if (MediaPicker.Default.IsCaptureSupported)
            {
                result = await MediaPicker.Default.CapturePhotoAsync();
                if (result != null)
                {
                    stream = await result.OpenReadAsync();
                }
            }
            else
            {
                await Shell.Current.DisplayAlert("Error", "Camera capture is not supported on this device.", "OK");
            }
            break;

        case Enums.MediaSelectionOptions.SelectFile:
            result = await FilePicker.Default.PickAsync();
            if (result != null)
            {
                stream = await result.OpenReadAsync();
            }
            break;

        default:
            break;
    }
}
else
{
    await Shell.Current.DisplayAlert("Info", "No selection was made.", "OK");
}

if (result != null)
{
    stream!.Position = 0;
    byte[] bytes = [];
    using (var memoryStream = new MemoryStream())
    {
        stream.CopyTo(memoryStream);
        bytes = memoryStream.ToArray();
    }
}
\`\`\`

## Styling

### Global styles

\`\`\`xml
<Application.Resources>
    <ResourceDictionary>
        <Style TargetType="Label">
            <Setter Property="FontSize" Value="18" />
            <Setter Property="TextColor" Value="Black" />
        </Style>
    </ResourceDictionary>
</Application.Resources>
\`\`\`

### Local styles

\`\`\`xml
<ContentPage.Resources>
    <ResourceDictionary>
        <Style x:Key="MyLabelStyle" TargetType="Label">
            <Setter Property="FontSize" Value="24" />
            <Setter Property="TextColor" Value="Blue" />
        </Style>
    </ResourceDictionary>
</ContentPage.Resources>

<Label Text="Styled Label" Style="{StaticResource MyLabelStyle}" />
\`\`\`

For dark and light themes, see [Internet connection checks and dark or light themes in .NET MAUI](doc:maui-cheatsheet-connectivity-theming).

## Animations

> **NOTE:** Dated (checked November 2026): .NET 10 marks \`FadeTo\`, \`ScaleTo\`, and the other animation methods without the \`Async\` suffix as obsolete. Use \`FadeToAsync\` and \`ScaleToAsync\`.

\`\`\`csharp
// Simple animation
await myLabel.FadeTo(0, 1000); // Fade out over 1 second
await myLabel.FadeTo(1, 1000); // Fade in over 1 second

// Scale animation
await myButton.ScaleTo(2, 1000); // Scale up to 2x size over 1 second
await myButton.ScaleTo(1, 1000); // Scale back to normal size over 1 second
\`\`\`

## Localization

Show a string from a resource file:

\`\`\`xml
<Label Text="{x:Static resources:AppResources.HelloMessage}" />
\`\`\`

Define the string in \`AppResources.resx\`:

\`\`\`xml
<data name="HelloMessage" xml:space="preserve">
    <value>Hello, World!</value>
</data>
\`\`\`

## Use Fluent UI font icons

1. Add the font file:
   1. Download the [Fluent UI](https://github.com/microsoft/fluentui-system-icons/tree/main/fonts) \`.ttf\` font file.
   2. Put the font file in the \`Resources/Fonts\` folder of your project.
   3. Make sure that the build action of the font file is \`MauiFont\`.
2. In \`MauiProgram.cs\`, register the font with the \`ConfigureFonts\` method:

   \`\`\`csharp
   public static class MauiProgram
   {
       public static MauiApp CreateMauiApp()
       {
           var builder = MauiApp.CreateBuilder();
           builder
               .UseMauiApp<App>()
               .ConfigureFonts(fonts =>
               {
                   fonts.AddFont("FluentSystemIcons-Regular.ttf", "FluentSystemIconsRegular");
               });

           return builder.Build();
       }
   }
   \`\`\`

3. Use [IconFont2Code](https://andreinitescu.github.io/IconFont2Code/) to generate a class with the Unicode values of the icons. Save the class in your project, for example in the \`App.Resources.Fonts\` namespace:

   \`\`\`csharp
   namespace App.Resources.Fonts
   {
       // Generated by IconFont2Code: https://andreinitescu.github.io/IconFont2Code
       // If you change the class to 'public' in order to use it outside its assembly
       // you should also change the fields from 'static readonly' to 'public static readonly'
       public static class FluentUI
       {
           public static readonly string FontFamily = "FluentSystemIconsRegular";

           public static readonly string access_time_20_regular = "";
           public static readonly string timer_20_regular = "";
           // Add other icons as needed
       }
   }
   \`\`\`

4. To use an icon in XAML, add the namespace as an attribute of the root element (for example, \`ContentPage\`). Then use the Unicode value:

   \`\`\`xml
   <ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
                xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
                xmlns:fonts="clr-namespace:App.Resources.Fonts">
   \`\`\`

   \`\`\`xml
   <Label
       Text="{Binding Source={x:Static fonts:FluentUI.timer_20_regular}}"
       FontFamily="FluentSystemIconsRegular"
       FontSize="20" />
   \`\`\`

5. To use an icon in C#, set the same values in code:

   \`\`\`csharp
   var label = new Label
   {
       Text = App.Resources.Fonts.FluentUI.timer_20_regular,
       FontFamily = "FluentSystemIconsRegular",
       FontSize = 20
   };
   \`\`\`

## File handling

Read a file from the app package:

\`\`\`csharp
using var stream = await FileSystem.OpenAppPackageFileAsync("myfile.txt");
using var reader = new StreamReader(stream);
var content = await reader.ReadToEndAsync();
\`\`\`

Write to a file in the app data folder:

\`\`\`csharp
var filePath = Path.Combine(FileSystem.AppDataDirectory, "myfile.txt");
await File.WriteAllTextAsync(filePath, "Hello, MAUI!");
\`\`\`

## Networking

\`\`\`csharp
var httpClient = new HttpClient();
var response = await httpClient.GetAsync("https://api.example.com/data");
var content = await response.Content.ReadAsStringAsync();
\`\`\`

For connection checks, see [Internet connection checks and dark or light themes in .NET MAUI](doc:maui-cheatsheet-connectivity-theming).

## Preferences

\`\`\`csharp
// Save a preference
Preferences.Set("username", "JohnDoe");

// Retrieve a preference
var username = Preferences.Get("username", "default_value");
\`\`\`

## Local notifications

\`NotificationRequest\` and \`LocalNotificationCenter\` come from the \`Plugin.LocalNotification\` NuGet package. Install the package before you use this sample.

\`\`\`csharp
var notification = new NotificationRequest
{
    Title = "Test Notification",
    Description = "This is a test notification",
    ReturningData = "Dummy data"
};

await LocalNotificationCenter.Current.Show(notification);
\`\`\`

## Debugging

- Write debug messages with \`Debug.WriteLine\`:

  \`\`\`csharp
  Debug.WriteLine("This is a debug message");
  \`\`\`

- Set breakpoints in your code. Run the app in debug mode to examine variables and step through the code.

## Unit testing

\`\`\`csharp
[Test]
public void TestMethod()
{
    var result = MyClass.MyMethod();
    Assert.AreEqual(expectedValue, result);
}
\`\`\`

> **NOTE:** Dated (checked November 2026): NUnit 4 moved \`Assert.AreEqual\` to \`ClassicAssert.AreEqual\` (namespace \`NUnit.Framework.Legacy\`). The current style is \`Assert.That(result, Is.EqualTo(expectedValue));\`.

## Performance tips and common pitfalls

| Topic | Rule |
| --- | --- |
| Custom controls | Use \`BindableObject\` for custom controls to get data binding. |
| UI thread load | Do not do heavy calculations on the UI thread. Use \`Task.Run\` for background operations. |
| Lists | Use \`CollectionView\` with \`DataTemplate\` for efficient list rendering. |
| Memory leaks | Unsubscribe from events and dispose of resources correctly. |
| UI updates | Always update the UI on the main thread with \`MainThread.BeginInvokeOnMainThread\`. |

## Useful NuGet packages

| Package | Use |
| --- | --- |
| CommunityToolkit.Maui | Additional controls and helpers. |
| Refit | Easier REST API calls. |
| Shiny | Background tasks, notifications, and more. |

For more libraries, see [.NET MAUI resources and libraries](doc:maui-cheatsheet-resources).

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| The build uses old output. | Cached build artifacts. | Run \`dotnet clean\` to remove the cached build artifacts. |
| Compile errors continue after \`dotnet clean\`. | Old files in the output folders. | Delete the \`bin/\` and \`obj/\` folders to force a full rebuild. |
| Debugging does not start in VS Code. | Incorrect launch settings. | Check \`launch.json\`. Verify the \`preLaunchTask\` setting. |
| The build uses the wrong .NET SDK or workloads. | Incorrect SDK or workload installation. | Run \`dotnet --info\` to verify the installed SDK and workloads. |
| Some builds fail with XAML Hot Reload. | XAML Hot Reload. | Disable XAML Hot Reload. |
| \`AppShell\` does not work on iOS 26 ([issue 31982](https://github.com/dotnet/maui/issues/31982)). | Known .NET MAUI issue. | Update the NuGet packages to .NET 9.0.110 or .NET 10. |

## Related links

- [.NET MAUI documentation](https://docs.microsoft.com/en-us/dotnet/maui/)
- [.NET MAUI GitHub repository](https://github.com/dotnet/maui)
- [.NET MAUI discussions](https://github.com/dotnet/maui/discussions)
- [.NET MAUI resources and libraries](doc:maui-cheatsheet-resources)
- [C# cheat sheet](doc:csharp-cheatsheet)
`;export{e as default};