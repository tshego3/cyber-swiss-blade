---
title: Reusable components in .NET MAUI
summary: Create a reusable ContentView control with bindable properties, show it in XAML, repeat it in a CollectionView or a loop, and follow good practices.
category: .NET MAUI
order: 70
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# Reusable components in .NET MAUI

Reusable components prevent duplicate code and keep the architecture clean. This article shows how to create a reusable component and how to repeat it for a list of data.

## Create a reusable component

Create a custom control (for example, a reusable card) as a subclass of `ContentView`. A `BindableProperty` makes the `Title` property available for data binding.

```csharp
public class CardView : ContentView
{
    public static readonly BindableProperty TitleProperty =
        BindableProperty.Create(nameof(Title), typeof(string), typeof(CardView), string.Empty);

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public CardView()
    {
        var titleLabel = new Label
        {
            FontSize = 18,
            TextColor = Colors.Black,
            VerticalOptions = LayoutOptions.Center
        };
        titleLabel.SetBinding(Label.TextProperty, new Binding(nameof(Title), source: this));

        Content = new StackLayout
        {
            Padding = 10,
            Children = { titleLabel }
        };
    }
}
```

## Use the component in XAML

Register the namespace and add the custom control:

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MyMauiApp"
             x:Class="MyMauiApp.MainPage">

    <StackLayout>
        <local:CardView Title="Card 1" />
        <local:CardView Title="Card 2" />
    </StackLayout>
</ContentPage>
```

## Repeat the component for a list

1. Use a `CollectionView` or a `ListView` to make 1 component for each item:

   ```xml
   <CollectionView ItemsSource="{Binding Cards}">
       <CollectionView.ItemTemplate>
           <DataTemplate>
               <local:CardView Title="{Binding Title}" />
           </DataTemplate>
       </CollectionView.ItemTemplate>
   </CollectionView>
   ```

2. Define a `Card` model and a view model that holds the data:

   ```csharp
   public class Card
   {
       public string Title { get; set; }
   }

   public class MainViewModel
   {
       public ObservableCollection<Card> Cards { get; set; }

       public MainViewModel()
       {
           Cards = new ObservableCollection<Card>
           {
               new Card { Title = "Card 1" },
               new Card { Title = "Card 2" },
               new Card { Title = "Card 3" }
           };
       }
   }
   ```

3. Set the `BindingContext` in the page:

   ```csharp
   public partial class MainPage : ContentPage
   {
       public MainPage()
       {
           InitializeComponent();
           BindingContext = new MainViewModel();
       }
   }
   ```

> **NOTE:** Dated (checked November 2026): .NET 10 marks `ListView` as obsolete. Use `CollectionView` for new code.

## Create components in code

To create components in code (for example, in a loop), add them to a layout:

```csharp
var stackLayout = new StackLayout();

foreach (var card in cards)
{
    var cardView = new CardView { Title = card.Title };
    stackLayout.Children.Add(cardView);
}

Content = stackLayout;
```

## Add lifecycle events to a component

This reusable component changes its label text when it loads and unloads. `ContentView` has no `Appearing` or `Disappearing` events, so the component uses the `Loaded` and `Unloaded` events of `VisualElement`:

```csharp
public class LifecycleAwareCard : ContentView
{
    public LifecycleAwareCard()
    {
        var label = new Label { Text = "Lifecycle Card" };
        Content = label;

        // Simulate lifecycle awareness
        this.Loaded += (sender, e) => label.Text = "Card Appeared";
        this.Unloaded += (sender, e) => label.Text = "Card Disappeared";
    }
}
```

Use it in XAML:

```xml
<local:LifecycleAwareCard />
```

For the page and app lifecycle events (`OnAppearing`, `OnDisappearing`, `OnStart`, `OnSleep`, and `OnResume`), see [Use lifecycle events](doc:maui-cheatsheet-project-structure#use-lifecycle-events).

## Best practices

| Practice | Rule |
| --- | --- |
| Encapsulation | Keep the logic and the UI of the component in the component. |
| Bindable properties | Use `BindableProperty` to make components flexible and available for data binding. |
| Performance | Do not do heavy calculations in reusable components. Use data binding and `ObservableCollection` for dynamic updates. |
| Reusability | Make components generic, so that different parts of the app can use them. |
| Loops | Use `CollectionView` (or `ListView` in older code) to make components from a list of data. |

## Related links

- [Reusable ContentView (Stack Overflow)](https://stackoverflow.com/questions/75414755/reusable-contentview-net-maui)
- [.NET MAUI project structure and lifecycle](doc:maui-cheatsheet-project-structure)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
