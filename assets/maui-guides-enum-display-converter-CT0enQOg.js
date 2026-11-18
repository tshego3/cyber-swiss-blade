var e=`---
title: .NET MAUI guide: Show enum display names with a value converter
summary: Create a value converter that shows the Display(Name) attribute of an enum value in .NET MAUI XAML bindings.
category: .NET MAUI
order: 230
---

# .NET MAUI guide: Show enum display names with a value converter

This guide shows how to show the \`[Display(Name = "...")]\` attribute value of an enum in a .NET MAUI XAML page. A value converter changes the enum value to its display name.

## Create the value converter

The converter reads the \`DisplayAttribute\` of the enum field. If the value is \`null\`, it returns an empty string. If the value is not an enum or has no \`DisplayAttribute\`, it returns \`value.ToString()\`.

\`\`\`csharp
using System.ComponentModel.DataAnnotations;
using System.Globalization;

public sealed class EnumDisplayConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is null)
        {
            return string.Empty;
        }

        if (!value.GetType().IsEnum)
        {
            return value.ToString() ?? string.Empty;
        }

        var fieldInfo = value.GetType().GetField(value.ToString() ?? string.Empty);
        if (fieldInfo is null)
        {
            return value.ToString() ?? string.Empty;
        }

        var displayAttribute = fieldInfo
            .GetCustomAttributes(typeof(DisplayAttribute), false)
            .FirstOrDefault() as DisplayAttribute;

        return displayAttribute?.Name ?? value.ToString() ?? string.Empty;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        return Activator.CreateInstance(targetType) ?? throw new InvalidOperationException("Cannot create default enum value");
    }
}
\`\`\`

\`ConvertBack\` returns the default value of the target type. It does not convert a display name back to an enum value.

## Add the converter to the resources

Add the converter as a resource in the XAML page or in \`App.xaml\`.

\`\`\`xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:YourNamespace"
             x:Class="YourNamespace.YourPage">

    <ContentPage.Resources>
        <ResourceDictionary>
            <local:EnumDisplayConverter x:Key="EnumDisplayConverter" />
        </ResourceDictionary>
    </ContentPage.Resources>

    <!-- Your content here -->
</ContentPage>
\`\`\`

## Use the converter in XAML

Bind to the enum property and set the converter:

\`\`\`xml
<Label Text="{Binding YourStatusProperty, Converter={StaticResource EnumDisplayConverter}}" />
\`\`\`
`;export{e as default};