---
title: .NET MAUI guide: Image file helpers and the drawing view
summary: Helper classes to downsize images, convert PNG to JPEG, draw text on images, save images to the device gallery, and capture drawings.
category: .NET MAUI
order: 220
---

# .NET MAUI guide: Image file helpers and the drawing view

This guide gives two helper classes for image files in .NET MAUI and a drawing view layout. Use `FileHelper` to make image files smaller, convert PNG to JPEG, and write text on an image. Use `ImageSaveHelper` to save an image on Windows, Android, iOS, or Mac Catalyst.

## Before you start

- The `SkiaSharp` NuGet package for the text drawing methods.
- `Microsoft.Maui.Graphics.Platform` for `PlatformImage`.
- The .NET MAUI Community Toolkit (`CommunityToolkit.Maui`) for the drawing view.
- A `Settings` class with these members: `FileMaxSizeBytes`, `FileMaxWidthResolution`, `FileMaxHeightResolution`, and `MediaSetting`.
- A `Constants` class with the `Error` and `Okay` texts for the alerts.

## File helper

`FileHelper` reduces file sizes, converts PNG images to JPEG, and draws text on images. If a method fails, it shows an alert and returns `null`.

```csharp
using SkiaSharp;
using Microsoft.Maui.Graphics.Platform;

namespace Maui.Helpers
{
    public static class FileHelper
    {
        public static async Task<byte[]?> DownSizeFileStream(FileResult? file)
        {
            try
            {
                if (file == null)
                    return null;

                byte[]? result = null;

                using (Stream stream = await file.OpenReadAsync())
                {
                    if (stream.Length > Settings.FileMaxSizeBytes)
                    {
                        Microsoft.Maui.Graphics.IImage image = PlatformImage.FromStream(stream);
                        if (image != null && image.Width > Settings.FileMaxWidthResolution && image.Height > Settings.FileMaxHeightResolution)
                        {
                            Microsoft.Maui.Graphics.IImage newImage = image.Downsize(Settings.FileMaxWidthResolution, Settings.FileMaxHeightResolution, false);
                            result = await newImage.AsBytesAsync();
                        }
                        else if (image != null)
                        {
                            result = await image.AsBytesAsync();
                        }
                    }
                    else
                    {
                        result = await PlatformImage.FromStream(stream).AsBytesAsync();
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<byte[]?> DownSizeFileStream(Stream? stream)
        {
            try
            {
                if (stream == null)
                    return null;

                byte[]? result = null;

                using (stream)
                {
                    if (stream.Length > Settings.FileMaxSizeBytes)
                    {
                        Microsoft.Maui.Graphics.IImage image = PlatformImage.FromStream(stream);
                        if (image != null && image.Width > Settings.FileMaxWidthResolution && image.Height > Settings.FileMaxHeightResolution)
                        {
                            Microsoft.Maui.Graphics.IImage newImage = image.Downsize(Settings.FileMaxWidthResolution, Settings.FileMaxHeightResolution, false);
                            result = await newImage.AsBytesAsync();
                        }
                        else if (image != null)
                        {
                            result = await image.AsBytesAsync();
                        }
                    }
                    else
                    {
                        result = await PlatformImage.FromStream(stream).AsBytesAsync();
                    }
                }

                return result;
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<byte[]?> ConvertPngToJpegByteArray(Stream pngStream, float quality = 1f)
        {
            try
            {
                if (pngStream == null || pngStream.Length == 0)
                    return null;

                Microsoft.Maui.Graphics.IImage image = PlatformImage.FromStream(pngStream);
                if (image == null)
                    return null;

                MemoryStream jpegStream = new MemoryStream();
                await image.SaveAsync(jpegStream, ImageFormat.Jpeg, quality: quality);
                jpegStream.Position = 0;

                return jpegStream.ToArray();
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<MemoryStream?> ConvertPngToJpegStream(Stream pngStream, float quality = 1f)
        {
            try
            {
                if (pngStream == null || pngStream.Length == 0)
                    return null;

                Microsoft.Maui.Graphics.IImage image = PlatformImage.FromStream(pngStream);
                if (image == null)
                    return null;

                MemoryStream jpegStream = new MemoryStream();
                await image.SaveAsync(jpegStream, ImageFormat.Jpeg, quality: quality);

                jpegStream.Position = 0;
                return jpegStream;
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<byte[]?> ConvertPngToJpeg(FileResult? pngFile, float quality = 1f)
        {
            try
            {
                if (pngFile == null)
                    return null;

                Stream stream = await pngFile.OpenReadAsync();
                return await ConvertPngToJpegByteArray(stream, quality);
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<MemoryStream?> DrawTextOnImageAsync(FileResult? imageFile, string[] textLines)
        {
            try
            {
                if (imageFile == null)
                    return null;

                using var stream = await imageFile.OpenReadAsync();
                using var originalBitmap = SKBitmap.Decode(stream);
                if (originalBitmap == null)
                    return null;

                int width = originalBitmap.Width;
                int height = originalBitmap.Height;

                var imageInfo = new SKImageInfo(width, height);
                using var surface = SKSurface.Create(imageInfo);
                SKCanvas canvas = surface.Canvas;

                canvas.Clear(SKColors.White);
                canvas.DrawBitmap(originalBitmap, 0, 0);

                float fontSize = 14f;
                float margin = 20f;
                float lineSpacing = 4f;

                using var font = new SKFont(SKTypeface.Default, fontSize)
                {
                    Edging = SKFontEdging.Antialias
                };

                using var fillPaint = new SKPaint
                {
                    Color = SKColors.White,
                    IsAntialias = true,
                    Style = SKPaintStyle.Fill
                };

                using var strokePaint = new SKPaint
                {
                    Color = SKColors.Black,
                    IsAntialias = true,
                    Style = SKPaintStyle.Stroke,
                    StrokeWidth = 2
                };

                float textY = height - margin;

                for (int i = textLines.Length - 1; i >= 0; i--)
                {
                    string line = textLines[i];
                    using var blob = SKTextBlob.Create(line, font);
                    var bounds = blob!.Bounds;
                    float textX = width - margin;

                    textY -= bounds.Height + lineSpacing;

                    canvas.DrawText(line, textX, textY, SKTextAlign.Right, font, strokePaint);
                    canvas.DrawText(line, textX, textY, SKTextAlign.Right, font, fillPaint);
                }

                canvas.Flush();

                using var image = surface.Snapshot();
                using var data = image.Encode(SKEncodedImageFormat.Png, 100);

                if (Settings.MediaSetting.Equals(true))
                {
                    var fileName = imageFile.FileName;
                    var filePath = Path.Combine(FileSystem.Current.AppDataDirectory, fileName);
                    using (var fileStream = File.Create(filePath))
                    {
                        data.SaveTo(fileStream);
                    }
                }

                var ms = new MemoryStream();
                data.SaveTo(ms);
                ms.Seek(0, SeekOrigin.Begin);

                return ms;
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }

        public static async Task<MemoryStream?> DrawTextOnStreamAsync(Stream? stream, string[] textLines, string fileName = "")
        {
            try
            {
                if (stream == null)
                    return null;

                using var originalBitmap = SKBitmap.Decode(stream);
                if (originalBitmap == null)
                    return null;

                int width = originalBitmap.Width;
                int height = originalBitmap.Height;

                var imageInfo = new SKImageInfo(width, height);
                using var surface = SKSurface.Create(imageInfo);
                SKCanvas canvas = surface.Canvas;

                canvas.Clear(SKColors.White);
                canvas.DrawBitmap(originalBitmap, 0, 0);

                float fontSize = 14f;
                float margin = 20f;
                float lineSpacing = 4f;

                using var font = new SKFont(SKTypeface.Default, fontSize)
                {
                    Edging = SKFontEdging.Antialias
                };

                using var fillPaint = new SKPaint
                {
                    Color = SKColors.White,
                    IsAntialias = true,
                    Style = SKPaintStyle.Fill
                };

                using var strokePaint = new SKPaint
                {
                    Color = SKColors.Black,
                    IsAntialias = true,
                    Style = SKPaintStyle.Stroke,
                    StrokeWidth = 2
                };

                float textY = height - margin;

                for (int i = textLines.Length - 1; i >= 0; i--)
                {
                    string line = textLines[i];
                    using var blob = SKTextBlob.Create(line, font);
                    var bounds = blob!.Bounds;
                    float textX = width - margin;

                    textY -= bounds.Height + lineSpacing;

                    canvas.DrawText(line, textX, textY, SKTextAlign.Right, font, strokePaint);
                    canvas.DrawText(line, textX, textY, SKTextAlign.Right, font, fillPaint);
                }

                canvas.Flush();

                using var image = surface.Snapshot();
                using var data = image.Encode(SKEncodedImageFormat.Png, 100);

                if (Settings.MediaSetting.Equals(true) && string.IsNullOrEmpty(fileName).Equals(false))
                {
                    var filePath = Path.Combine(FileSystem.Current.AppDataDirectory, fileName);
                    using (var fileStream = File.Create(filePath))
                    {
                        data.SaveTo(fileStream);
                    }
                }

                var ms = new MemoryStream();
                data.SaveTo(ms);
                ms.Seek(0, SeekOrigin.Begin);

                return ms;
            }
            catch (Exception ex)
            {
                await Shell.Current.CurrentPage.DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                return null;
            }
        }
    }
}
```

### Methods

| Method | Input | Output | Notes |
| --- | --- | --- | --- |
| `DownSizeFileStream` | `FileResult?` | `byte[]?` | Opens the file and disposes the stream. |
| `DownSizeFileStream` | `Stream?` | `byte[]?` | Disposes the stream that you give it. |
| `ConvertPngToJpegByteArray` | `Stream`, `quality` | `byte[]?` | Returns `null` if the stream is empty. |
| `ConvertPngToJpegStream` | `Stream`, `quality` | `MemoryStream?` | Sets the position of the returned stream to 0. |
| `ConvertPngToJpeg` | `FileResult?`, `quality` | `byte[]?` | Opens the file and calls `ConvertPngToJpegByteArray`. |
| `DrawTextOnImageAsync` | `FileResult?`, `string[]` | `MemoryStream?` | If `Settings.MediaSetting` is `true`, it saves the result in `AppDataDirectory` with the name of the input file. |
| `DrawTextOnStreamAsync` | `Stream?`, `string[]`, `fileName` | `MemoryStream?` | It saves the result only if `Settings.MediaSetting` is `true` and `fileName` is not empty. |

### How it works

- The two `DownSizeFileStream` methods have the same logic. If the stream is larger than `Settings.FileMaxSizeBytes` and the width and the height are larger than the limits, the method downsizes the image. In all other cases, it returns the image bytes with no change in size. If the image cannot be read, the method returns `null`.
- The default JPEG `quality` is `1f`.
- The two text methods have the same drawing logic. They write the lines from the bottom right corner up, with a font size of 14, a margin of 20, and a line spacing of 4. Each line has a black outline (stroke width 2) and a white fill. The result is a PNG at quality 100, with the position set to 0. `File.Create` replaces a saved file that has the same name.

## Image save helper

`ImageSaveHelper.SaveImage` saves a byte array as an image file. It uses conditional compilation for each platform.

```csharp
using System.Diagnostics;
using System.Net.Mime;

namespace Maui.Helpers
{
    public class ImageSaveHelper
    {
        private static string GetMimeTypeFromName(string fileName)
        {
            string extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".txt" => MediaTypeNames.Text.Plain,
                ".html" or ".htm" => MediaTypeNames.Text.Html,
                ".css" => "text/css",
                ".js" => "application/javascript",
                ".json" => "application/json",
                ".xml" => MediaTypeNames.Text.Xml,
                ".png" => "image/png",
                ".jpg" or ".jpeg" => MediaTypeNames.Image.Jpeg,
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".tiff" or ".tif" => "image/tiff",
                ".svg" => "image/svg+xml",
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".mp4" => "video/mp4",
                ".mpeg" or ".mpg" => "video/mpeg",
                ".avi" => "video/x-msvideo",
                ".pdf" => "application/pdf",
                ".zip" => "application/zip",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".ppt" => "application/vnd.ms-powerpoint",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                _ => "application/octet-stream",
            };
        }

        private static string GetMimeTypeFromPath(string filePath)
        {
            return GetMimeTypeFromName(Path.GetFileName(filePath));
        }

        public static Task SaveImage(byte[] bytes, string fileName)
        {
            try
            {
#if WINDOWS
                System.IO.File.WriteAllBytes(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyPictures), fileName), bytes);
#elif ANDROID
                var context = Platform.CurrentActivity;

                if (OperatingSystem.IsAndroidVersionAtLeast(29))
                {
                    Android.Content.ContentResolver resolver = context.ContentResolver;
                    Android.Content.ContentValues contentValues = new();
                    contentValues.Put(Android.Provider.MediaStore.IMediaColumns.DisplayName, fileName);
                    contentValues.Put(Android.Provider.MediaStore.IMediaColumns.MimeType, GetMimeTypeFromPath(fileName));
                    contentValues.Put(Android.Provider.MediaStore.IMediaColumns.RelativePath, string.Format("DCIM/{0}", AppInfo.Current.Name));
                    Android.Net.Uri imageUri = resolver.Insert(Android.Provider.MediaStore.Images.Media.ExternalContentUri, contentValues);
                    var os = resolver.OpenOutputStream(imageUri);
                    Android.Graphics.BitmapFactory.Options options = new();
                    options.InJustDecodeBounds = true;
                    MemoryStream memoryStream = new MemoryStream(bytes);
                    memoryStream.Position = 0;
                    var bitmap = Android.Graphics.BitmapFactory.DecodeStream(new MemoryStream(bytes));
                    bitmap.Compress(Android.Graphics.Bitmap.CompressFormat.Png, 100, os);
                    os.Flush();
                    os.Close();
                }
                else
                {
                    Java.IO.File storagePath = Android.OS.Environment.GetExternalStoragePublicDirectory(Android.OS.Environment.DirectoryPictures);
                    string path = System.IO.Path.Combine(storagePath.ToString(), fileName);
                    System.IO.File.WriteAllBytes(path, bytes);
                    var mediaScanIntent = new Android.Content.Intent(Android.Content.Intent.ActionMediaScannerScanFile);
                    mediaScanIntent.SetData(Android.Net.Uri.FromFile(new Java.IO.File(path)));
                    context.SendBroadcast(mediaScanIntent);
                }
#elif IOS || MACCATALYST
                var image = new UIKit.UIImage(Foundation.NSData.FromArray(bytes));
                image.SaveToPhotosAlbum((image, error) =>
                {
                });
#endif
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                return Task.CompletedTask;
            }
        }
    }
}
```

| Platform | Location |
| --- | --- |
| Windows | The `MyPictures` special folder. |
| Android 10 (API 29) and later | `DCIM/<app name>` through `MediaStore`. The code compresses the bitmap as PNG at quality 100. |
| Android 9 and earlier | The public `Pictures` folder. A media scanner broadcast adds the file to the gallery. |
| iOS and Mac Catalyst | The photo album, with `UIImage.SaveToPhotosAlbum`. |

`GetMimeTypeFromName` maps a file extension to a MIME type. If the extension is not in the list, it returns `application/octet-stream`. If the save fails, the method writes the error to the debug output.

> **NOTE:** On Android 10 and later, the code always compresses the bitmap as PNG, but it sets the MIME type from the file name. Use a `.png` file name, or select `Bitmap.CompressFormat.Jpeg` for `.jpg` names. On iOS, saving to the photo album needs the `NSPhotoLibraryAddUsageDescription` key in `Info.plist`.

## Drawing view

This `ContentView` uses the Community Toolkit `DrawingView` in a 105 x 105 border. The lines are black and 3 wide. The **Save** button sends the `DrawingView` to the `SaveDrawingCommand` of an ancestor view model.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentView xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:mct="http://schemas.microsoft.com/dotnet/2022/maui/toolkit"
             xmlns:viewModels="clr-namespace:.."
             x:Class="clr-namespace:..">
    <StackLayout Orientation="Vertical">
        <Border Stroke="Black" 
                Background="White"
                StrokeThickness="2"
                HeightRequest="105"
                WidthRequest="105">
            <mct:DrawingView x:Name="MctDrawing"
                IsMultiLineModeEnabled="True"
                ShouldClearOnFinish="False"
                Background="Transparent"
                BackgroundColor="Transparent"
                LineColor="Black"
                LineWidth="3"
                HeightRequest="100"
                WidthRequest="100"
                HorizontalOptions="Fill"
                VerticalOptions="Fill" />
        </Border>
        <Button Text="Clear" />
        <Button Text="Save"
                Command="{Binding Source={RelativeSource AncestorType={x:Type viewModels:..}}, Path=SaveDrawingCommand}"
                CommandParameter="{Binding Source={x:Reference MctDrawing}}">
        </Button>
    </StackLayout>
</ContentView>
```

> **NOTE:** Replace the `..` placeholders in `xmlns:viewModels`, `x:Class`, and `AncestorType` with your namespace, class, and view model type. The **Clear** button has no command in the sample.
