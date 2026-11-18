var e=`---
title: .NET MAUI example: Send multiple parameters to a RelayCommand with MultiBinding
summary: Send more than one value from a view to a RelayCommand in a ViewModel with a MultiBinding and a converter that returns an object array.
category: .NET MAUI
order: 150
---

# .NET MAUI example: Send multiple parameters to a RelayCommand with MultiBinding

A command parameter holds one value. This example sends more than one value from a view to a \`RelayCommand\` in a ViewModel. A \`MultiBinding\` collects the values, and a converter returns them as an \`object[]\`.

## Before you start

- A .NET MAUI project, here \`DemoApp\`.
- The \`CommunityToolkit.Mvvm\` NuGet package for \`ObservableObject\` and \`RelayCommand\`.

## Create the converter

The converter returns the array of bound values with no change.

\`\`\`csharp
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
\`\`\`

## Register the converter

Add the converter to the application resources.

\`\`\`xml
<?xml version = "1.0" encoding = "UTF-8" ?>
<!-- /DemoApp/App.xaml -->
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
\`\`\`

## Create the ViewModel

The command gets the \`object[]\` and reads the 3 values by position. The third value is the binding context of the button. On this page, that is the \`DemoViewModel\`. In a \`DataTemplate\`, it is the row item: cast it to your item type.

> **NOTE:** Dated (checked November 2026): In .NET 10, \`DisplayAlert\` is obsolete. Use \`DisplayAlertAsync\` with the same parameters.

\`\`\`csharp
// /DemoApp/ViewModels/DemoViewModel.cs
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Diagnostics;

namespace DemoApp.ViewModels
{
    public partial class DemoViewModel : ObservableObject
    {
        [RelayCommand]
        public async Task Clicked(object parameter)
        {
            if (parameter is object[] paramArray && paramArray.Length == 3)
            {
                Microsoft.Maui.Controls.Label label = (Microsoft.Maui.Controls.Label)paramArray[0];
                string? note = paramArray[1] as string;
                object dtoItem = paramArray[2];

                Debug.WriteLine($"Text1: {label.Text}, Note: {note}, DtoItem: {dtoItem}");
                await Shell.Current.DisplayAlert("Clicked!", $"Text1: {label.Text}, Note: {note}, DtoItem: {dtoItem}", "OK");
            }
        }
    }
}
\`\`\`

## Create the view

The \`MultiBinding\` in \`Button.CommandParameter\` sends 3 values: the \`Label1\` control, the text of the \`NewNoteEntry\` entry, and the current binding context (\`Path="."\`, or an empty \`<Binding />\`).

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- /DemoApp/Views/DemoView.xaml -->
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
        <Label x:Name="Label1" Text="Hello from label" />
        <Entry x:Name="NewNoteEntry" Placeholder="Add a new note" Text="Demo" />
        <Button Text="Click Me"
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
\`\`\`

## Related links

- [Multi-bindings (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/maui/fundamentals/data-binding/multibinding?view=net-maui-9.0&viewFallbackFrom=net-maui-7.0)
- [Passing multiple parameters from View to a RelayCommand inside a ViewModel (Stack Overflow)](https://stackoverflow.com/questions/77938656/passing-multiple-parameters-from-view-to-a-relaycommand-inside-a-viewmodel-net)
`;export{e as default};