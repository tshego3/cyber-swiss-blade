---
title: .NET MAUI guide: Scan South African license disc barcodes
summary: Scan and decode the PDF-417 barcode on South African vehicle license discs in .NET MAUI with ZXing.Net.Maui or BarcodeScanning.Native.Maui.
category: .NET MAUI
order: 210
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI guide: Scan South African license disc barcodes

This guide shows how to scan the barcode on a South African vehicle license disc and decode it into a typed object. The barcode uses the PDF-417 format. The guide has two variants: one with ZXing.Net.Maui and one with BarcodeScanning.Native.Maui.

## Before you start

| Variant | Packages | Notes |
| --- | --- | --- |
| ZXing.Net.Maui | `ZXing.Net.Maui`, `ZXing.Net.Maui.Controls` | A scan page in XAML. The page returns the result through a `TaskCompletionSource`. |
| BarcodeScanning.Native.Maui | `BarcodeScanning.Native.Maui` | A `ContentView` control built in code. It uses Google ML Kit on Android and the Apple Vision framework on iOS. |

- Both variants need camera permission. See [Configure the camera permission](#configure-the-camera-permission).
- The parent view model sample uses `[RelayCommand]` from the CommunityToolkit.Mvvm package.

## License disc data

A South African license disc barcode contains these data:

- The vehicle registration number
- The license disc number
- The vehicle make and model
- The color
- The VIN and the engine number
- The expiry date
- More control numbers and document identifiers

Percent signs (`%`) separate the fields:

```text
%DocumentType%Unknown1%LicenseNum%Unknown2%ControlNum%LicenceNum%RegNum%Description%Make%Model%Color%VIN%EngineNum%ExpiryDate%
```

The `RSALicenseDisc` class holds the decoded fields. Both variants use it.

```csharp
public class RSALicenseDisc
{
    public string? DocumentType { get; set; }
    public string? UnknownField1 { get; set; }
    public string? LicenseNumber { get; set; }
    public string? UnknownField2 { get; set; }
    public string? ControlNumber { get; set; }
    public string? LicenceNumber { get; set; }
    public string? VehicleRegistrationNumber { get; set; }
    public string? VehicleDescription { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? VIN { get; set; }
    public string? EngineNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
}
```

## Scan with ZXing.Net.Maui

### Install the packages

```bash
dotnet add package ZXing.Net.Maui
dotnet add package ZXing.Net.Maui.Controls
```

### Configure MauiProgram.cs

Call `UseBarcodeReader()` to initialize ZXing.Net.Maui.

```csharp
using ZXing.Net.Maui.Controls;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseBarcodeReader(); // Initialize ZXing.Net.Maui

        return builder.Build();
    }
}
```

### Create the scan page

The page reads two-dimensional barcodes, uses only the PDF-417 results, and stops at the first valid license disc. Then it sets the result on the `TaskCompletionSource` and closes the page.

```csharp
using System.Globalization;
using ZXing.Net.Maui;

public partial class BarCodeScanPage : ContentPage
{
    private TaskCompletionSource<RSALicenseDisc>? _taskCompletionSource;

    public BarCodeScanPage(TaskCompletionSource<RSALicenseDisc> taskCompletionSource)
    {
        InitializeComponent();
        _taskCompletionSource = taskCompletionSource;

        CameraBarcodeReaderView.BarcodesDetected += OnBarcodesDetectedHandler;
        CameraBarcodeReaderView.Options = new BarcodeReaderOptions
        {
            Formats = BarcodeFormats.TwoDimensional, // Read all 2D formats. OnBarcodesDetected keeps only PDF-417.
            AutoRotate = true,
            Multiple = true,
            TryHarder = true
        };
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        CameraBarcodeReaderView.IsDetecting = true;
    }

    protected override void OnDisappearing()
    {
        CameraBarcodeReaderView.IsDetecting = false;
        CameraBarcodeReaderView.BarcodesDetected -= OnBarcodesDetectedHandler;
        base.OnDisappearing();
    }

    private async void OnBarcodesDetectedHandler(object? sender, BarcodeDetectionEventArgs e)
    {
        await OnBarcodesDetected(sender!, e);
    }

    private async Task OnBarcodesDetected(object sender, BarcodeDetectionEventArgs e)
    {
        try
        {
            RSALicenseDisc rsaLicenseDisc = new();

            foreach (var barcode in e.Results)
            {
                if (barcode.Format == BarcodeFormat.Pdf417)
                {
                    rsaLicenseDisc = await ParseRSALicenseDisc(barcode.Value);
                    if (IsValidLicenseDisc(rsaLicenseDisc))
                    {
                        break;
                    }
                }
            }

            _taskCompletionSource?.TrySetResult(rsaLicenseDisc);
            await Navigation.PopAsync();
        }
        catch (Exception ex)
        {
            await DisplayAlert("Error", ex.Message, "OK");
        }
    }

    private bool IsValidLicenseDisc(RSALicenseDisc disc)
    {
        return !string.IsNullOrEmpty(disc.VehicleRegistrationNumber) &&
               !string.IsNullOrEmpty(disc.Make) &&
               !string.IsNullOrEmpty(disc.Color) &&
               disc.ExpiryDate > DateTime.MinValue;
    }

    private async Task<RSALicenseDisc> ParseRSALicenseDisc(string barcodeData)
    {
        try
        {
            var result = new RSALicenseDisc();
            var segments = barcodeData.Split('%')
                .Where(s => !string.IsNullOrEmpty(s))
                .ToArray();

            if (segments.Length >= 14)
            {
                result.DocumentType = segments[0];
                result.UnknownField1 = segments[1];
                result.LicenseNumber = segments[2];
                result.UnknownField2 = segments[3];
                result.ControlNumber = segments[4];
                result.LicenceNumber = segments[5];
                result.VehicleRegistrationNumber = segments[6];
                result.VehicleDescription = segments[7];
                result.Make = segments[8];
                result.Model = segments[9];
                result.Color = segments[10];
                result.VIN = segments[11];
                result.EngineNumber = segments[12];

                if (DateTime.TryParseExact(segments[13], "yyyy-MM-dd",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var expiryDate))
                {
                    result.ExpiryDate = expiryDate;
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            await DisplayAlert("Error", ex.Message, "OK");
            return new RSALicenseDisc();
        }
    }
}
```

`IsValidLicenseDisc` checks that the registration number, the make, and the color have a value and that the expiry date is set. `ParseRSALicenseDisc` splits the data at `%`, removes the empty segments, and needs 14 segments or more. It reads the expiry date in the `yyyy-MM-dd` format.

The page adds and removes the same named handler (`OnBarcodesDetectedHandler`), so the handler does not stay subscribed after the page closes.

The XAML shows the camera view and a red frame of 300 x 150 in the center as a scan guide.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:zxing="clr-namespace:ZXing.Net.Maui.Controls;assembly=ZXing.Net.MAUI.Controls"
             x:Class="YourNamespace.BarCodeScanPage"
             Title="Scan License Disc">

    <Grid>
        <zxing:CameraBarcodeReaderView x:Name="CameraBarcodeReaderView"
                                      IsDetecting="True" />

        <Grid HorizontalOptions="Center"
              VerticalOptions="Center"
              WidthRequest="300"
              HeightRequest="150">

            <BoxView Color="Red"
                    HeightRequest="2"
                    VerticalOptions="Start"
                    HorizontalOptions="Fill"/>

            <BoxView Color="Red"
                    WidthRequest="2"
                    VerticalOptions="Fill"
                    HorizontalOptions="Start"/>

            <BoxView Color="Red"
                    WidthRequest="2"
                    VerticalOptions="Fill"
                    HorizontalOptions="End"/>

            <BoxView Color="Red"
                    HeightRequest="2"
                    VerticalOptions="End"
                    HorizontalOptions="Fill"/>
        </Grid>
    </Grid>
</ContentPage>
```

### Call the scan page from a view model

`GetBarCodeValues` pushes the scan page and waits for the result of the `TaskCompletionSource`.

```csharp
[RelayCommand]
public async Task ScanBarCode()
{
    try
    {
        LicenseDiscDetails = await GetBarCodeValues();

        // Process the scanned data
        if (!string.IsNullOrEmpty(LicenseDiscDetails?.VehicleRegistrationNumber))
        {
            // Update UI or process the data further
        }
    }
    catch (Exception ex)
    {
        await Shell.Current.CurrentPage.DisplayAlert("Error", ex.Message, "OK");
    }
}

public async Task<RSALicenseDisc> GetBarCodeValues()
{
    try
    {
        var taskCompletionSource = new TaskCompletionSource<RSALicenseDisc>();
        await Shell.Current.Navigation.PushAsync(new BarCodeScanPage(taskCompletionSource));
        return await taskCompletionSource.Task;
    }
    catch (Exception ex)
    {
        await Shell.Current.CurrentPage.DisplayAlert("Error", ex.Message, "OK");
        return new RSALicenseDisc();
    }
}
```

## Scan with BarcodeScanning.Native.Maui

This variant puts the camera in a reusable `BarCodeScanControl`. The control has buttons for back, camera switch, torch, vibration, and pause. It draws the detected barcodes on a `GraphicsView` overlay and changes its size when the display orientation changes.

### Create the scan control

```csharp
using BarcodeScanning;
using DemoApp.Models;
using DemoApp.Resources.Fonts;
using Microsoft.Maui.Layouts;
using System.Globalization;

namespace DemoApp.Controls
{
    public class BarCodeScanControl : ContentView
    {
        private readonly AbsoluteLayout _absoluteLayout = new();
        private readonly BarcodeDrawable _drawable = new();
        private readonly List<string> _qualitys = new();
        private readonly CameraView _barcode;
        private readonly GraphicsView _graphics;
        private readonly Button _backButton, _cameraSwitchButton, _torchButton, _phoneVibrateButton, _pauseButton;
        public event EventHandler<RSALicenseDisc>? OnBarCodeDetected;
        public event EventHandler<bool>? OnDisappearingDetected;

        public BarCodeScanControl()
        {
            _barcode = new CameraView
            {
                CaptureQuality = CaptureQuality.High,
                ForceInverted = true,
                TapToFocusEnabled = true,
                BarcodeSymbologies = BarcodeFormats.All,
                AimMode = true,
                CameraEnabled = true
            };

            _graphics = new GraphicsView
            {
                InputTransparent = true,
                Drawable = _drawable
            };

            _absoluteLayout.HeightRequest = _scanLicenseDiscService.GridHeight();
            _absoluteLayout.WidthRequest = _scanLicenseDiscService.GridWidth();

            AbsoluteLayout.SetLayoutBounds(_barcode, new Rect(0, 0, 1, 1));
            AbsoluteLayout.SetLayoutFlags(_barcode, AbsoluteLayoutFlags.All);

            AbsoluteLayout.SetLayoutBounds(_graphics, new Rect(0, 0, 1, 1));
            AbsoluteLayout.SetLayoutFlags(_graphics, AbsoluteLayoutFlags.All);

            Grid grid = new Grid
            {
                ColumnDefinitions = new ColumnDefinitionCollection
                {
                    new ColumnDefinition(), new ColumnDefinition(), new ColumnDefinition(),
                    new ColumnDefinition(), new ColumnDefinition(), new ColumnDefinition()
                }
            };
            AbsoluteLayout.SetLayoutBounds(grid, new Rect(0, 0, 1, 0.1));
            AbsoluteLayout.SetLayoutFlags(grid, AbsoluteLayoutFlags.All);

            _backButton = CreateIconButton(FluentUI.arrow_left_20_regular, "FluentSystemIconsRegular");
            _cameraSwitchButton = CreateIconButton(FluentUI.camera_switch_20_regular, "FluentSystemIconsRegular");
            _torchButton = CreateIconButton(FluentUI.lightbulb_20_regular, "FluentSystemIconsRegular");
            _phoneVibrateButton = CreateIconButton(FluentUI.phone_vibrate_20_regular, "FluentSystemIconsRegular");
            _pauseButton = CreateIconButton(FluentUI.pause_20_regular, "FluentSystemIconsRegular");

            grid.Add(_backButton, 0, 0);
            grid.Add(_cameraSwitchButton, 1, 0);
            grid.Add(_torchButton, 2, 0);
            grid.Add(_phoneVibrateButton, 3, 0);
            grid.Add(_pauseButton, 4, 0);

            _absoluteLayout.Children.Add(_barcode);
            _absoluteLayout.Children.Add(_graphics);
            _absoluteLayout.Children.Add(grid);

            Content = _absoluteLayout;

            SetupEvents();
        }

        private Button CreateIconButton(string glyph, string fontFamily, bool inputTransparent = false)
        {
            return new Button
            {
                WidthRequest = 50,
                HeightRequest = 50,
                CornerRadius = 25,
                InputTransparent = inputTransparent,
                ImageSource = new FontImageSource
                {
                    Glyph = glyph,
                    FontFamily = fontFamily,
                    Size = 20
                }
            };
        }

        private void SetupEvents()
        {
            _qualitys.Add(Utils.Constants.Low);
            _qualitys.Add(Utils.Constants.Medium);
            _qualitys.Add(Utils.Constants.High);
            _qualitys.Add(Utils.Constants.Highest);

            DeviceDisplay.Current.MainDisplayInfoChanged += async (s, e) => await OnDisplayInfoChanged(s, e);
            _barcode.OnDetectionFinished += async (s, e) => await OnBarcodesDetected(s, e);

            _backButton.Clicked += async (s, e) => await BackButton_Clicked(s, e);
            _cameraSwitchButton.Clicked += async (s, e) => await CameraButton_Clicked(s, e);
            _torchButton.Clicked += async (s, e) => await TorchButton_Clicked(s, e);
            _phoneVibrateButton.Clicked += async (s, e) => await VibrateButton_Clicked(s, e);
            _pauseButton.Clicked += async (s, e) => await PauseButton_Clicked(s, e);
        }

        private Task BackButton_Clicked(object sender, EventArgs e)
        {
            OnDisappearingDetected?.Invoke(this, true);
            return Task.CompletedTask;
        }

        private Task CameraButton_Clicked(object sender, EventArgs e)
        {
            if (_barcode.CameraFacing == CameraFacing.Back)
                _barcode.CameraFacing = CameraFacing.Front;
            else
                _barcode.CameraFacing = CameraFacing.Back;

            return Task.CompletedTask;
        }

        private Task TorchButton_Clicked(object sender, EventArgs e)
        {
            if (_barcode.TorchOn)
                _barcode.TorchOn = false;
            else
                _barcode.TorchOn = true;

            return Task.CompletedTask;
        }

        private Task VibrateButton_Clicked(object sender, EventArgs e)
        {
            if (_barcode.VibrationOnDetected)
                _barcode.VibrationOnDetected = false;
            else
                _barcode.VibrationOnDetected = true;

            return Task.CompletedTask;
        }

        private Task PauseButton_Clicked(object sender, EventArgs e)
        {
            if (_barcode.PauseScanning)
                _barcode.PauseScanning = false;
            else
                _barcode.PauseScanning = true;

            return Task.CompletedTask;
        }

        private async Task OnDisplayInfoChanged(object sender, DisplayInfoChangedEventArgs e)
        {
            try
            {
                double layoutWidth = 0;
                double layoutHeight = 0;

                if (e.DisplayInfo.Orientation == DisplayOrientation.Landscape)
                {
                    layoutWidth = DeviceDisplay.Current.MainDisplayInfo.Width * 0.3;
                    layoutHeight = DeviceDisplay.Current.MainDisplayInfo.Height * 0.2;
                }
                else if (e.DisplayInfo.Orientation == DisplayOrientation.Portrait)
                {
                    layoutWidth = DeviceDisplay.Current.MainDisplayInfo.Width * 0.3;
                    layoutHeight = DeviceDisplay.Current.MainDisplayInfo.Height * 0.3;
                }
                else
                {
                    layoutWidth = DeviceDisplay.Current.MainDisplayInfo.Width * 0.3;
                    layoutHeight = DeviceDisplay.Current.MainDisplayInfo.Height * 0.3;
                }

                if (layoutWidth > 0 || layoutHeight > 0)
                {
                    _absoluteLayout.WidthRequest = layoutWidth;
                    _absoluteLayout.HeightRequest = layoutHeight;
                    _absoluteLayout.Layout(new Rect(0, 0, layoutWidth, layoutHeight));
                    _barcode.Layout(new Rect(0, 0, layoutWidth, layoutHeight));
                    _graphics.Layout(new Rect(0, 0, layoutWidth, layoutHeight));
                    _absoluteLayout.InvalidateMeasure();
                    _barcode.InvalidateMeasure();
                    _graphics.InvalidateMeasure();
                    _graphics.Invalidate();
                    InvalidateMeasure();           
                }
            }
            catch (Exception ex)
            {
                await Shell.Current.DisplayAlert(Utils.Constants.Error, ex.Message, Utils.Constants.Okay);
            }
        }

        private async Task OnBarcodesDetected(object sender, OnDetectionFinishedEventArg e)
        {
            try
            {
                RSALicenseDisc? rsaLicenseDisc = null;

                _drawable.barcodeResults = e.BarcodeResults;
                foreach (var barcode in e.BarcodeResults)
                {
                    if (barcode.BarcodeFormat == BarcodeScanning.BarcodeFormats.Pdf417)
                    {
                        rsaLicenseDisc = await ParseRSALicenseDisc(barcode.DisplayValue);
                        if (IsValidLicenseDisc(rsaLicenseDisc))
                        {
                            break;
                        }
                    }
                }

                if (rsaLicenseDisc is not null)
                {
                    OnBarCodeDetected?.Invoke(this, rsaLicenseDisc);
                }
                else
                {
                    _graphics.Invalidate();
                }
            }
            catch (Exception ex)
            {
                await Shell.Current.DisplayAlert(Utils.Constants.Error, ex.Message, Utils.Constants.Okay);
            }
        }

        // Add IsValidLicenseDisc and ParseRSALicenseDisc here (see the note below).
    }
}
```

> **NOTE:** `IsValidLicenseDisc` and `ParseRSALicenseDisc` in this control are the same as in the [ZXing.Net.Maui scan page](#create-the-scan-page), with one difference. The `catch` block in `ParseRSALicenseDisc` calls `await Shell.Current.DisplayAlert(Utils.Constants.Error, ex.Message, Utils.Constants.Okay);` in place of `await DisplayAlert("Error", ex.Message, "OK");`.

Differences from the ZXing.Net.Maui variant:

- The control reads `barcode.DisplayValue` and compares `barcode.BarcodeFormat` with `BarcodeScanning.BarcodeFormats.Pdf417`.
- The control sends the result with the `OnBarCodeDetected` event. If no barcode gives a result, it redraws the overlay.
- The back button sends the `OnDisappearingDetected` event.
- In landscape orientation, the control uses 30% of the display width and 20% of the display height. In other orientations, it uses 30% of both.
- The control uses `FluentUI` glyphs with the `FluentSystemIconsRegular` font, and texts from `Utils.Constants`.

### Host the control on a page

The page asks for the camera permission with `BarcodeScanning.Methods.AskForRequiredPermissionAsync()`. If the user gives the permission, the page adds the control to `BarCodeScanStackControl` and subscribes to its events.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="DemoApp.Views.BarCodeScanPage"
             xmlns:fonts="clr-namespace:DemoApp.Resources.Fonts"
             xmlns:utils="clr-namespace:DemoApp.Utils"
             xmlns:controls="clr-namespace:DemoApp.Controls"
             Title="Bar Code Scan Page">
        <VerticalStackLayout>
              <VerticalStackLayout x:Name="BarCodeScanStackControl" />
       </VerticalStackLayout>
</ContentPage>
```

```csharp
using DemoApp.Controls;
using DemoApp.Models;
using DemoApp.Utils;
using DemoApp.ViewModels;

namespace DemoApp.Views;

public partial class BarCodeScanPage : ContentPage
{
    private readonly BarCodeScanControl _barCodeScanControl = new();

    public BarCodeScanPage()
    {
        InitializeComponent();
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        bool barcodeScanningPermission = await BarcodeScanning.Methods.AskForRequiredPermissionAsync();
        if (barcodeScanningPermission == true)
        {
            if (BarCodeScanStackControl.Children.Contains(_barCodeScanControl) == false)
            {
                BarCodeScanStackControl.Children.Add(_barCodeScanControl);
                _barCodeScanControl.OnBarCodeDetected += async (s, e) => await OnBarCodeDetectedAsync(s, e);
                _barCodeScanControl.OnDisappearingDetected += async (s, e) => await OnDisappearingDetectedAsync(s, e);
            }
        }
        else
        {
            await Shell.Current.DisplayAlert(Constants.CameraPermissionRequired, Constants.AllowBarcodeScannerDeviceSettings, Constants.Okay);
        }
    }

    public async Task OnBarCodeDetectedAsync(object sender, RSALicenseDisc e)
    {
        RSALicenseDisc rSALicense = e;
    }

    public Task OnDisappearingDetectedAsync(object sender, bool e)
    {
        bool close = e;
        return Task.CompletedTask;
    }
}
```

> **NOTE:** The control uses a `_scanLicenseDiscService` field with `GridHeight()` and `GridWidth()` methods, but the source does not declare it or give its type. Declare this service in the control (for example, inject it through the constructor), or set fixed values for `HeightRequest` and `WidthRequest`. Verify the values in your app.

## Configure the camera permission

For Android, add this line to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

For iOS, add this key to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required to scan license disc barcodes</string>
```

## How it works

| Feature | Description |
| --- | --- |
| Targeted scanning | The code uses only the PDF-417 format of South African license discs. |
| Structured data | The code parses the barcode data into a typed `RSALicenseDisc` object. |
| Validation | The code checks that the essential fields have a value. |
| Async pattern | In the ZXing.Net.Maui variant, a `TaskCompletionSource` returns the result to the caller. |
| Error handling | Each step catches exceptions and shows an alert. |

## Related links

- [Google ML Kit](https://developers.google.com/ml-kit)
- [Google ML Kit: Barcode scanning](https://developers.google.com/ml-kit/vision/barcode-scanning)
- [Apple Vision framework](https://developer.apple.com/documentation/vision)
- [Apple Vision: DetectBarcodesRequest](https://developer.apple.com/documentation/vision/detectbarcodesrequest)
