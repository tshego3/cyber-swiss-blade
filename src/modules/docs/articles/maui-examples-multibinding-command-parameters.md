---
title: .NET MAUI example: Send multiple parameters to a RelayCommand with MultiBinding
summary: Send more than one value from a view to a RelayCommand in a ViewModel with a MultiBinding and a converter that returns an object array.
category: .NET MAUI
order: 150
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI example: Send multiple parameters to a RelayCommand with MultiBinding

A command parameter holds one value. This example sends more than one value from a view to a `RelayCommand` in a ViewModel. A `MultiBinding` collects the values, and a converter returns them as an `object[]`.

## Before you start

- A .NET MAUI project, here `DemoApp`.
- The `CommunityToolkit.Mvvm` NuGet package for `ObservableObject` and `RelayCommand`.

> **NOTE:** In the XAML samples, a file name comment is above the XML declaration. In a real XAML file, the XML declaration must be the first line. Put the comment below it or remove it.

## Create the converter

The converter returns the array of bound values with no change.

```csharp
// /DemoApp/Converters/MultiBindingConverter.cs
using System.Globalization;

namespace DemoApp.Converters
{
    public class MultiBindingConverter : IMultiValueConverter
    {
        public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
        {
            return values;
        }

        public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
        {
            throw new NotImplementedException();
        }
    }
}
```

## Register the converter

Add the converter to the application resources.

```xml
<!-- /DemoApp/App.xaml -->
<?xml version = "1.0" encoding = "UTF-8" ?>
<Application xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
            xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
            xmlns:local="clr-namespace:DemoApp"
            x:Class="DemoApp.App"
            xmlns:converters="clr-namespace:DemoApp.Converters">
    <Application.Resources>
        <ResourceDictionary>
            <!--  Other converters -->
            <converters:MultiBindingConverter x:Key="MultiBindingConverter" />
        </ResourceDictionary>
    </Application.Resources>
</Application>
```

## Create the ViewModel

The command gets the `object[]` and reads the 3 values by position.

```csharp
// /DemoApp/ViewModels/DemoViewModel.cs
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Diagnostics;
using System.Windows;

namespace DemoApp.ViewModels
{
    public partial class DemoViewModel : ObservableObject
    {
        [RelayCommand]
        public async Task Clicked(object parameter)
        {
            if (parameter is object[] paramArray && paramArray.Length == 3)
            {
                Microsoft.Maui.Controls.Label label = paramArray[0];
                string note = paramArray[1];
                DTOItem dtoItem = paramArray[2];

                Debug.WriteLine($"Text1: {label.Text}, Note: {note}, DtoItem: {dtoItem}");
                MessageBox.Show($"Clicked! Text1: {label.Text}, Note: {note}, DtoItem: {dtoItem}");
            }
        }
    }
}
```

## Create the view

The `MultiBinding` in `Button.CommandParameter` sends 3 values: the `Label1` control, the text of the `NewNoteEntry` entry, and the current binding context (`Path="."`, or an empty `<Binding />`).

```xml
<!-- /DemoApp/Views/DemoView.xaml -->
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
            xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
            x:Class="DemoApp.Views.DemoView"
            xmlns:viewModels="clr-namespace:DemoApp.ViewModels"
            x:DataType="viewModels:DemoViewModel"
            Title="Demo View">

    <ContentPage.BindingContext>
        <viewModels:DemoViewModel />
    </ContentPage.BindingContext>

    <StackLayout Orientation="Vertical">
        <Label x:Name="Label1" Content="Hello from label" />
        <Entry x:Name="NewNoteEntry" Placeholder="Add a new note" Text="Demo" />
        <Button Content="Click Me"
                Command="{Binding ClickedCommand}">
            <Button.CommandParameter>
                <MultiBinding Converter="{StaticResource MultiBindingConverter}">
                    <Binding Source="{x:Reference Label1}" />
                    <Binding Source="{x:Reference NewNoteEntry}" Path="Text" />
                    <Binding Path="." /> <!-- OR <Binding /> -->
                </MultiBinding>
            </Button.CommandParameter>
        </Button>
    </StackLayout>
</ContentPage>
```

## Troubleshooting

The sample has parts from WPF. Fix them before you build a .NET MAUI app.

| Problem | Cause | Fix |
| --- | --- | --- |
| `MessageBox` and `System.Windows` are not found. | `MessageBox` is a WPF API. .NET MAUI does not have it. | Use `Shell.Current.DisplayAlert` and remove `using System.Windows;`. |
| The label and the button show no text. | .NET MAUI `Label` and `Button` use `Text`, not `Content`. | Change `Content` to `Text`. |
| The assignments from `paramArray` do not compile. | The array items are of type `object`. | Cast each item, for example `(string)paramArray[1]`. |
| `DTOItem` is not found. | The sample does not define `DTOItem`. In this view, `Path="."` gives the `DemoViewModel`. | Define the type, or bind the third value to the object you need. |

## Related links

- [Multi-bindings (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/maui/fundamentals/data-binding/multibinding?view=net-maui-9.0&viewFallbackFrom=net-maui-7.0)
- [Passing multiple parameters from View to a RelayCommand inside a ViewModel (Stack Overflow)](https://stackoverflow.com/questions/77938656/passing-multiple-parameters-from-view-to-a-relaycommand-inside-a-viewmodel-net)
