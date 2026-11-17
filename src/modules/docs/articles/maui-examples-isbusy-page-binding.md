---
title: .NET MAUI example: Bind to the page IsBusy property with x:Reference
summary: Bind controls to the IsBusy property of a ContentPage with x:Reference, and show an activity indicator while a task runs.
category: .NET MAUI
order: 140
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI example: Bind to the page IsBusy property with x:Reference

This example binds controls to the `IsBusy` property of the page itself with `{x:Reference Page}` (the `ReferenceExtension` in `Microsoft.Maui.Controls.Xaml`). Use it when a binding to `IsBusy` inside a layout such as `VerticalStackLayout` does not work as you expect.

## Before you start

Make sure that:

1. The code-behind of the `ContentPage` sets the `IsBusy` property.
2. The page reference (`x:Reference Page`) is valid.
3. An `InverseBooleanConverter` class exists in the project.

## Name the page in XAML

Set `x:Name` on the `ContentPage`, so that XAML can refer to it. The `x:Name="Page"` attribute is the new line.

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="YourNamespace.YourPage"
             x:Name="Page">
    <ContentPage.Resources>
        <ResourceDictionary>
            <local:InverseBooleanConverter x:Key="InverseBooleanConverter" />
        </ResourceDictionary>
    </ContentPage.Resources>

    <VerticalStackLayout IsVisible="{Binding Source={x:Reference Page}, Path=IsBusy, Converter={StaticResource InverseBooleanConverter}}">
        <ActivityIndicator IsRunning="{Binding Source={x:Reference Page}, Path=IsBusy}" />
        <Switch x:Name="SettingSwitch" />
    </VerticalStackLayout>
</ContentPage>
```

## Set IsBusy in the code-behind

In the code-behind, set `IsBusy` to `true` before the work and to `false` after it. The two `this.IsBusy` lines are the new lines.

```csharp
public partial class YourPage : ContentPage
{
    public YourPage()
    {
        InitializeComponent()
        SettingSwitch.IsToggled = false;
        SettingSwitch.Toggled += async (sender, e) => await OnSettingSwitchToggled(sender!, e);
    }

    private async Task OnSettingSwitchToggled(object sender, ToggledEventArgs e)
    {
        this.IsBusy = true;
        await Task.Delay(1000);
        Console.WriteLine($"Setting switched to: {e.Value}");
        this.IsBusy = false;
    }
```

## How it works

1. The `x:Name="Page"` attribute on the `ContentPage` lets the `x:Reference` binding get the `IsBusy` property.
2. The code-behind changes `IsBusy`, and the UI shows the changes.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| The code-behind does not compile. | The sample has no `;` after `InitializeComponent()` and no closing brace for the class. | Add the `;` and the `}`. |
| XAML reports that the `local` prefix is not defined. | The sample does not declare `xmlns:local`. | Add `xmlns:local="clr-namespace:YourNamespace"` (the namespace of the converter) to the `ContentPage`. |
| The converter is not found. | `InverseBooleanConverter` is not implemented or not in the resource dictionary. | Implement the converter and add it to the resource dictionary. |
| A binding error stays. | The `x:Reference` name and the `x:Name` of the page are different. | Make sure that `x:Reference Page` matches the `x:Name` on the `ContentPage`. |

## Related links

- [.NET MAUI example: MVVM Todo app](doc:maui-examples-todo-app) (contains an `InverseBooleanConverter`)
