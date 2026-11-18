---
title: .NET MAUI example: List rows as partial views with the MVVM Toolkit
summary: Build a .NET MAUI list that shows each row in a partial view, with a row button that sends the row object to a ViewModel command.
category: .NET MAUI
order: 100
---

# .NET MAUI example: List rows as partial views with the MVVM Toolkit

This tutorial builds a .NET MAUI app with the MVVM (Model-View-ViewModel) pattern. The app shows a list in which each row is a partial view, and each row has a button that sends the row object to the ViewModel as a command parameter. The Community Toolkit for MVVM makes the ViewModel code shorter.

## Before you start

- The .NET SDK with the MAUI workload.
- The NuGet packages `CommunityToolkit.Maui`, `CommunityToolkit.Mvvm`, and `Newtonsoft.Json`. The first task installs them.

## Set up the project

1. Create a new .NET MAUI project:

   ```bash
   dotnet new maui -n MauiListApp
   cd MauiListApp
   ```

2. Install the Community Toolkit packages and Newtonsoft.Json:

   ```bash
   dotnet add package CommunityToolkit.Maui
   dotnet add package CommunityToolkit.Mvvm
   dotnet add package Newtonsoft.Json
   ```

## Define the model

Create a model class that holds the data for one row.

```csharp
// Models/Item.cs
using Newtonsoft.Json;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace MauiListApp.Models
{
    public class Item : INotifyPropertyChanged
    {
        [JsonIgnore]
        private string? _name;
        [JsonIgnore]
        public string? Name
        {
            get => _name;
            set
            {
                if (_name != value)
                {
                    _name = value;
                    OnPropertyChanged();
                }
            }
        }

        [JsonIgnore]
        private string? _description;
        [JsonIgnore]
        public string? Description
        {
            get => _description;
            set
            {
                if (_description != value)
                {
                    _description = value;
                    OnPropertyChanged();
                }
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

## Define the ViewModel

Create a ViewModel that holds the list and handles the button click and the pull-to-refresh. `[RelayCommand]` generates a command from each method. It removes the `On` prefix and the `Async` suffix from the method name and adds `Command`. `OnItemClicked` gives `ItemClickedCommand`, and `Refresh` gives `RefreshCommand`.

```csharp
// ViewModels/ItemViewModel.cs
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using MauiListApp.Models;
using System.Collections.ObjectModel;

namespace MauiListApp.ViewModels
{
    public partial class ItemViewModel : ObservableObject
    {
        [ObservableProperty]
        private ObservableCollection<Item> _items;

        [ObservableProperty]
        private bool _isRefresh;

        public ItemViewModel()
        {
            Items = new ObservableCollection<Item>
            {
                new Item { Name = "Item 1", Description = "Description 1" },
                new Item { Name = "Item 2", Description = "Description 2" },
                new Item { Name = "Item 3", Description = "Description 3" }
            };
        }

        [RelayCommand]
        private async Task OnItemClicked(Item item)
        {
            // Handle the button click event
            // For example, display an alert with the item's name
            await Task.Delay(1000);
            await Shell.Current.DisplayAlert("Item Clicked", $"You clicked {item.Name}", "OK");
        }

        [RelayCommand]
        private async Task Refresh()
        {
            IsRefresh = true;
            // Handle the refresh event
            await Task.Delay(1000);
            IsRefresh = false;
        }
    }
}
```

## Create the partial view for each row

Create a partial view (a `ContentView` that the list uses in its `DataTemplate`) for one row. The button binds to the `ItemClickedCommand` of the ancestor `ItemViewModel` and sends the row object (`{Binding .}`) as the parameter.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- Views/ItemView.xaml -->
<ContentView xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:viewModels="clr-namespace:MauiListApp.ViewModels"
             x:Class="MauiListApp.Views.ItemView">
    <Grid Padding="10">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*" />
            <ColumnDefinition Width="Auto" />
        </Grid.ColumnDefinitions>

        <VerticalStackLayout>
            <Label Text="{Binding Name}" FontSize="16" FontAttributes="Bold" />
            <Label Text="{Binding Description}" FontSize="14" />
        </VerticalStackLayout>

        <Button Grid.Column="1"
                Text="Click Me"
                Command="{Binding Source={RelativeSource AncestorType={x:Type viewModels:ItemViewModel}}, Path=ItemClickedCommand}"
                CommandParameter="{Binding .}" />
    </Grid>
</ContentView>
```

## Create the main view

Create the main view. It shows the list of items and uses the partial view for each row.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- Views/MainPage.xaml -->
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:viewModels="clr-namespace:MauiListApp.ViewModels"
             xmlns:views="clr-namespace:MauiListApp.Views"
             x:Class="MauiListApp.Views.MainPage"
             Title="MAUI List App">

    <ContentPage.BindingContext>
        <viewModels:ItemViewModel />
    </ContentPage.BindingContext>

    <RefreshView IsRefreshing="{Binding IsRefresh}" Command="{Binding RefreshCommand}">
        <CollectionView ItemsSource="{Binding Items}">
            <CollectionView.ItemTemplate>
                <DataTemplate>
                    <views:ItemView />
                </DataTemplate>
            </CollectionView.ItemTemplate>
        </CollectionView>
    </RefreshView>
</ContentPage>
```

The `x:Class` of the page is `MauiListApp.Views.MainPage`, the same namespace as the code-behind. If `AppShell.xaml` refers to `MainPage`, use the `MauiListApp.Views` namespace there too.

The code-behind gets the `ItemViewModel` from the service container and sets it as the binding context. This replaces the instance that the XAML creates:

```csharp
// Views/MainPage.xaml.cs
using MauiListApp.ViewModels;

namespace MauiListApp.Views
{
    public partial class MainPage : ContentPage
    {
        public MainPage()
        {
            InitializeComponent();

            ItemViewModel ItemViewModel = IPlatformApplication.Current!.Services.GetService<ItemViewModel>();
            BindingContext = ItemViewModel;
        }
    }
}
```

## Register the views and ViewModels

If necessary, register the views and ViewModels in `MauiProgram.cs`.

```csharp
// MauiProgram.cs
using CommunityToolkit.Maui;
using MauiListApp.ViewModels;
using MauiListApp.Views;

namespace MauiListApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Register ViewModels and Views
        builder.Services.AddSingleton<ItemViewModel>();
        builder.Services.AddSingleton<MainPage>();

        return builder.Build();
    }
}
```

## Run the application

> **NOTE:** Dated (checked November 2026): In .NET 10, `DisplayAlert` is obsolete. Use `DisplayAlertAsync` with the same parameters.


1. Run the application.

   **Result:** The main page shows a list of items. Each item has a button.

2. Click the button on a row.

   **Result:** An alert shows the name of the item.

## How it works

| Part | Role |
| --- | --- |
| Model | `Item` holds the data. |
| ViewModel | `ItemViewModel` holds the list of items and handles the button click. |
| View | `MainPage.xaml` is the main view. `ItemView.xaml` is the partial view for each row. |
| Community Toolkit MVVM | `ObservableObject`, `ObservableProperty`, and `RelayCommand` make the MVVM code shorter. |

This setup keeps the concerns separate.

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
