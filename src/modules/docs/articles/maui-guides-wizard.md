---
title: .NET MAUI guide: Wizard control for multistep forms
summary: Build a multistep wizard in .NET MAUI with a Grid-based step control, slide animations, step lifecycle methods, and Shell navigation.
category: .NET MAUI
order: 200
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI guide: Wizard control for multistep forms

This guide shows a wizard (step-wise form) in .NET MAUI. The wizard moves between content views with slide animations and keeps the state between steps. Use it when a form has too many fields for one page.

## Before you start

- A .NET MAUI project. The sample uses the namespace `MauiWizard`.
- The fonts `OpenSans-Regular.ttf` and `OpenSans-Semibold.ttf` (the default MAUI template has them).
- The sample code uses primary constructors and collection expressions, which need C# 12 or later.

## Components

| Component | Purpose |
| --- | --- |
| `MauiProgram.cs` | Sets up the app and the dependency injection container. |
| `WizardStepsControl` | The core control. It manages the step navigation and the animations. |
| `WizardView` | The base class for each step view. |
| `MainViewModel` | Holds the step views, the commands, and the state. |
| `MainPage` | The host page. It contains the wizard and the navigation buttons. |
| `NewContent1`, `NewContent2`, `NewContent3` | Sample wizard steps. |
| `AppShell`, `NewPage1`, `NewPage2` | Shell navigation and sample content pages outside the wizard. |

## Register the services

`MauiProgram.cs` creates the app builder, sets the default fonts, and adds debug logging in DEBUG builds. It also registers `IPageService`, `IShellNavigationService`, `MainViewModel`, `MainPage`, and `NewPage2` in the dependency injection container.

```csharp
using Microsoft.Extensions.Logging;

namespace MauiWizard
{
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
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                });

#if DEBUG
            builder.Logging.AddDebug();
#endif

            builder.Services.AddSingleton<IPageService, PageService>();
            builder.Services.AddSingleton<IShellNavigationService, ShellNavigationService>();
            // builder.Services.AddSingleton<MainViewModel>();
            builder.Services.AddTransient<MainViewModel>();
            builder.Services.AddTransient<MainPage>();
            builder.Services.AddTransient<NewPage2>();

            return builder.Build();
        }
    }
}
```

> **NOTE:** The code registers `MainViewModel` as transient. The comment shows the singleton registration as an alternative.

## Create the step control

`WizardStepsControl` inherits from `Grid`, so it can hold all the step views. Only one child view is visible at a time.

```csharp
namespace MauiWizard
{
    public class StepChangedEventArgs(int previousStepIndex, int stepIndex) : EventArgs()
    {
        public int PreviousStepIndex { get; } = previousStepIndex;
        public int StepIndex { get; } = stepIndex;
    }

    public partial class WizardStepsControl : Grid
    {
        public static readonly BindableProperty TitleProperty =
            BindableProperty.Create(nameof(Title), typeof(string), typeof(WizardStepsControl), string.Empty);

        public string Title
        {
            get { return (string)GetValue(TitleProperty); }
            set { SetValue(TitleProperty, value); }
        }

        public event EventHandler<StepChangedEventArgs>? StepChanged;

        public int GetCurrentIndex()
        {
            for (var i = 0; i < Children.Count; i++)
            {
                if (Children[i] is VisualElement ve && ve.IsVisible)
                    return i;
            }

            return -1;
        }

        public bool CanGoBack()
        {
            var currentIndex = GetCurrentIndex();

            return currentIndex > 0;
        }

        public bool CanGoForward()
        {
            var currentIndex = GetCurrentIndex();
            var nextIndex = currentIndex + 1;

            return nextIndex < Children.Count;
        }

        private void SetCurrentTitle(IView view)
        {
            if (view is WizardView wizardView)
                Title = wizardView.Title!;
        }

        protected override void OnChildAdded(Element child)
        {
            SetCurrentTitle(Children.FirstOrDefault()!);

            if (child is VisualElement ve)
            {
                ve.IsVisible = false;

                if (GetCurrentIndex() < 0)
                {
                    ve.IsVisible = true;
                }
            }

            base.OnChildAdded(child);
        }

        public async Task Back()
        {
            var c = GetCurrentIndex();

            var currentIndex = c;
            var nextIndex = c - 1;

            if (nextIndex < 0)
                return;
            if (currentIndex == nextIndex)
                return;

            var currentView = Children[currentIndex] as VisualElement;
            var nextView = Children[nextIndex] as VisualElement;

            if (currentView is WizardView currentWizardView)
            {
                await currentWizardView.OnStepDisappearingAsync();
            }

            nextView!.TranslationX = -1 * this.Width;
            nextView!.IsVisible = true;

            await Task.WhenAll(
                nextView!.TranslateTo(0, 0, 500, Easing.CubicInOut),
                currentView!.TranslateTo(this.Width, 0, 500, Easing.CubicInOut));

            currentView!.IsVisible = false;
            currentView!.TranslationX = 0;

            if (nextView is WizardView nextWizardView)
            {
                await nextWizardView.OnStepAppearingAsync();
            }

            SetCurrentTitle(nextView);
            StepChanged?.Invoke(this, new StepChangedEventArgs(currentIndex, nextIndex));
        }

        public async Task Forward()
        {
            var c = GetCurrentIndex();

            var currentIndex = c;
            var nextIndex = c + 1;

            if (nextIndex >= Children.Count)
                nextIndex = 0;
            if (currentIndex == nextIndex)
                return;

            var currentView = Children[currentIndex] as VisualElement;
            var nextView = Children[nextIndex] as VisualElement;

            if (currentView is WizardView currentWizardView)
            {
                await currentWizardView.OnStepDisappearingAsync();
            }

            nextView!.TranslationX = this.Width;
            nextView!.IsVisible = true;

            await Task.WhenAll(
                nextView!.TranslateTo(0, 0, 500, Easing.CubicInOut),
                currentView!.TranslateTo(-1 * this.Width, 0, 500, Easing.CubicInOut));

            currentView!.IsVisible = false;
            currentView!.TranslationX = 0;

            if (nextView is WizardView nextWizardView)
            {
                await nextWizardView.OnStepAppearingAsync();
            }

            SetCurrentTitle(nextView);
            StepChanged?.Invoke(this, new StepChangedEventArgs(currentIndex, nextIndex));
        }

        public async Task GoToFirstPage()
        {
            var currentIndex = GetCurrentIndex();
            if (currentIndex <= 0) return;

            var firstPageIndex = 0;
            await GoToPage(firstPageIndex);
        }

        public async Task GoToPage(int pageIndex)
        {
            if (pageIndex < 0 || pageIndex >= Children.Count)
                throw new ArgumentOutOfRangeException(nameof(pageIndex), "Page index is out of range");

            var currentIndex = GetCurrentIndex();
            if (currentIndex == pageIndex) return;

            var currentView = Children[currentIndex] as VisualElement;
            var nextView = Children[pageIndex] as VisualElement;

            if (currentView is WizardView currentWizardView)
            {
                await currentWizardView.OnStepDisappearingAsync();
            }

            nextView!.TranslationX = pageIndex > currentIndex ? this.Width : -1 * this.Width;
            nextView!.IsVisible = true;

            await Task.WhenAll(
                nextView!.TranslateTo(0, 0, 500, Easing.CubicInOut),
                currentView!.TranslateTo(
                    pageIndex > currentIndex ? -1 * this.Width : this.Width,
                    0,
                    500,
                    Easing.CubicInOut));

            currentView!.IsVisible = false;
            currentView!.TranslationX = 0;

            if (nextView is WizardView nextWizardView)
            {
                await nextWizardView.OnStepAppearingAsync();
            }

            SetCurrentTitle(nextView);
            StepChanged?.Invoke(this, new StepChangedEventArgs(currentIndex, pageIndex));
        }
    }
}
```

The control does these tasks:

- `Back()`, `Forward()`, `GoToFirstPage()`, and `GoToPage(int)` move between the steps.
- Each move slides the current view out and the next view in with `TranslateTo` (500 ms, `Easing.CubicInOut`).
- `GetCurrentIndex()`, `CanGoBack()`, and `CanGoForward()` find the current step and check the navigation.
- The `StepChanged` event gives the previous and the new step index.
- The `Title` property gets the title of the current `WizardView`.
- `OnChildAdded` hides each new child, except the first one.
- `Forward()` goes back to step 0 after the last step. `GoToPage` throws `ArgumentOutOfRangeException` if the index is not valid.

## Create the step base class

`WizardView` inherits from `ContentView`. It adds a `Title` property to identify each step, and two lifecycle methods that the step control calls.

```csharp
namespace MauiWizard
{
    public partial class WizardView : ContentView
    {
        public string? Title { get; set; }

        public virtual Task OnStepAppearingAsync()
        {
            return Task.CompletedTask;
        }

        public virtual Task OnStepDisappearingAsync()
        {
            return Task.CompletedTask;
        }
    }
}
```

## Create the services and the view model

`CommandExtensions.ToSafeCommand` returns the command as it is. It is an extension point for command wrappers.

```csharp
using System.Windows.Input;

namespace MauiWizard
{
    public static class CommandExtensions
    {
        public static ICommand ToSafeCommand(this ICommand command)
        {
            return command;
        }
    }
}
```

`IPageService` supplies the step views. `PageService` returns the three sample steps.

```csharp
namespace MauiWizard
{
    public interface IPageService
    {
        Task<List<IView>> GetPagesAsync();
    }
}
```

```csharp
namespace MauiWizard
{
    public class PageService : IPageService
    {
        Task<List<IView>> IPageService.GetPagesAsync()
        {
            List<IView> views = [new NewContent1(), new NewContent2(), new NewContent3()];

            return Task.FromResult(views);
        }
    }
}
```

`IShellNavigationService` wraps Shell navigation. `ShellNavigationService` calls `Shell.Current.GoToAsync`.

```csharp
namespace MauiWizard
{
    public interface IShellNavigationService
    {
        Task NavigateToPageWithParameters(string route, Dictionary<string, object> parameters);
        Task NavigateToPage(string route);
        Task GoBack();
    }
}
```

```csharp
namespace MauiWizard
{
    public class ShellNavigationService : IShellNavigationService
    {
        public async Task NavigateToPageWithParameters(string route, Dictionary<string, object> parameters)
        {
            await Shell.Current.GoToAsync(route, parameters);
        }

        public async Task NavigateToPage(string route)
        {
            await Shell.Current.GoToAsync(route);
        }

        public async Task GoBack()
        {
            await Shell.Current.GoToAsync("..");
        }
    }
}
```

`MainViewModel` implements `INotifyPropertyChanged` for data binding and `IQueryAttributable` to receive Shell query parameters. It holds the step views in `Views` and exposes the navigation commands. The page sets the `OnBack`, `OnForward`, `OnGoToFirstPage`, and `OnGoToPage` delegates, and the commands call them.

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace MauiWizard
{
    public partial class MainViewModel : INotifyPropertyChanged, IQueryAttributable
    {
        private readonly IPageService _pageService;
        private readonly IShellNavigationService _shellNavigationService;

        public MainViewModel(IPageService pageService, IShellNavigationService shellNavigationService)
        {
            _pageService = pageService;
            _shellNavigationService = shellNavigationService;

            BackCommand = new Command(async () =>
            {
                if (OnBack is not null)
                    await OnBack.Invoke();
            }).ToSafeCommand();

            ForwardCommand = new Command(async () =>
            {
                if (OnForward is not null)
                    await OnForward.Invoke();
            }).ToSafeCommand();

            GoToFirstPageCommand = new Command(async () =>
            {
                if (OnGoToFirstPage is not null)
                    await OnGoToFirstPage.Invoke();
            }).ToSafeCommand();

            GoToPageCommand = new Command<int>(async (pageIndex) =>
            {
                if (OnGoToPage is not null)
                    await OnGoToPage.Invoke(pageIndex);
            }).ToSafeCommand();

            ShellNavigateToPage = new Command<string>(async (route) =>
            {
                await _shellNavigationService.NavigateToPage(route);
            }).ToSafeCommand();
        }

        public void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query == null) { return; }

            if (query.TryGetValue("Message", out var messageObj) && messageObj is string message)
            {
                Message = message;
                OnPropertyChanged("Message");
            }
        }

        public string Message { get; set; } = string.Empty;

        public Func<Task>? OnBack { get; set; }
        public Func<Task>? OnForward { get; set; }
        public Func<Task>? OnGoToFirstPage { get; set; }
        public Func<int, Task>? OnGoToPage { get; set; }

        public ICommand BackCommand { get; }
        public ICommand ForwardCommand { get; }
        public ICommand GoToFirstPageCommand { get; }
        public ICommand GoToPageCommand { get; }
        public ICommand ShellNavigateToPage { get; }

        private List<IView>? _views;
        public List<IView>? Views
        {
            get => _views;
            set
            {
                if (_views != value)
                {
                    _views = value;
                    OnPropertyChanged();
                }
            }
        }

        public async Task Initialize()
        {
            Views = await _pageService.GetPagesAsync();
        }

        public async Task ShellNavigateToPageAsync(string route, string message = "Hello!")
        {
            await _shellNavigationService.NavigateToPage(route);
            // Dictionary<string, object> navigationParameters = new Dictionary<string, object>
            // {
            //     { "Message", message }
            // };
            // await _shellNavigationService.NavigateToPageWithParameters(route, navigationParameters);
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

## Create the host page

`MainPage` gets the view model from dependency injection. In `OnAppearing`, it loads the steps into the step control, connects the view model delegates to the control, and sets the button states and the page title. The `StepChanged` handler updates the title and the buttons after each move.

```csharp
namespace MauiWizard
{
    public partial class MainPage : ContentPage
    {
        public MainPage(MainViewModel viewModel)
        {
            InitializeComponent();
            BindingContext = viewModel;
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();

            if (BindingContext is MainViewModel viewModel)
            {
                await viewModel.Initialize();

                StepControl.Children.Clear();

                foreach (IView view in viewModel.Views!)
                {
                    StepControl.Add(view);
                }

                viewModel.OnBack = async () => await StepControl.Back();
                viewModel.OnForward = async () => await StepControl.Forward();
                viewModel.OnGoToFirstPage = async () => await StepControl.GoToFirstPage();
                viewModel.OnGoToPage = async (pageIndex) => await StepControl.GoToPage(pageIndex);

                Title = StepControl.Title;
                BackButton.IsEnabled = StepControl.CanGoBack();
                ForwardButton.IsEnabled = StepControl.CanGoForward();
                StepControl.StepChanged += StepControl_StepChanged!;

                //await Dispatcher.DispatchAsync(async () =>
                //{
                if (StepControl.Children.FirstOrDefault() is WizardView initialView)
                {
                    await initialView.OnStepAppearingAsync();
                }
                //});
            }
        }

        protected override void OnDisappearing()
        {
            base.OnDisappearing();
            StepControl.StepChanged -= StepControl_StepChanged!;
        }

        private void StepControl_StepChanged(object sender, StepChangedEventArgs e)
        {
            Title = StepControl.Title;
            BackButton.IsEnabled = StepControl.CanGoBack();
            ForwardButton.IsEnabled = StepControl.CanGoForward();
        }
    }
}
```

The XAML puts the `WizardStepsControl` in a `ScrollView` and the navigation buttons at the bottom of a `Grid`. The comment in the control shows the alternative: add the steps in XAML.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiWizard"
             x:DataType="local:MainViewModel"
             x:Class="MauiWizard.MainPage">

    <Grid Padding="20">
        <ScrollView>
            <local:WizardStepsControl x:Name="StepControl" x:FieldModifier="public">
                <!--<local:NewContent1 />
                <local:NewContent2 />
                <local:NewContent3 />-->
            </local:WizardStepsControl>
        </ScrollView>

        <Grid VerticalOptions="End">
            <Button x:Name="BackButton"
                    Text="Back"
                    HeightRequest="20"
                    FontAttributes="Bold"
                    HorizontalOptions="Start"
                    Command="{Binding BackCommand}" />
            <Button x:Name="ForwardButton"
                    Text="Next"
                    HeightRequest="20"
                    FontAttributes="Bold"
                    HorizontalOptions="End"
                    Command="{Binding ForwardCommand}" />
        </Grid>
    </Grid>
</ContentPage>
```

## Create the wizard steps

Each step inherits from `WizardView`, sets a unique `Title`, and uses a `VerticalStackLayout`. The three samples differ:

| Step | Difference |
| --- | --- |
| `NewContent1` | A button goes to the third step with `OnGoToPage(2)`. A second button opens a Shell page with the `ShellNavigateToPage` command. |
| `NewContent2` | It shows an alert in `OnStepAppearingAsync`. It has no buttons. |
| `NewContent3` | It shows an alert in `OnStepAppearingAsync`. A button goes back to the first step with `OnGoToFirstPage`. |

### NewContent1

```csharp
using System.Diagnostics;

namespace MauiWizard;

public partial class NewContent1 : WizardView
{
	public NewContent1()
	{
        InitializeComponent();
        btnGoTo3rdView.Clicked += async (sender, e) => await GotTo3rdView(sender!, e);
    }

    public override async Task OnStepAppearingAsync()
    {
        await base.OnStepAppearingAsync();

        // Your async initialization code here
        await Task.Delay(500); // Simulate async work
        Debug.WriteLine("NewContent1 is now appearing!");

        // You can update UI here too
        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            await Task.Delay(0);
            // Update UI elements
            //await Dispatcher.DispatchAsync(async () =>
            //{
            //    await Shell.Current.CurrentPage.DisplayAlert("Test", "From 1", "Okay");
            //});
        });
    }

    public override async Task OnStepDisappearingAsync()
    {
        await base.OnStepDisappearingAsync();

        // Cleanup code here
        Debug.WriteLine("NewContent1 is disappearing!");
    }

    private async Task GotTo3rdView(object sender, EventArgs e)
    {
        if (BindingContext is MainViewModel viewModel)
        {
            if (viewModel.OnGoToPage != null)
                await viewModel.OnGoToPage.Invoke(2);
        }
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<local:WizardView xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiWizard"
             x:Class="MauiWizard.NewContent1"
             Title="NewContent1">
    <VerticalStackLayout>
        <Label
            Text="Welcome to .NET MAUI 1!"
            VerticalOptions="Center"
            HorizontalOptions="Center" />
        <Button
            x:Name="btnGoTo3rdView"
            Text="Go to 3rd View" />
        <Button
            Text="Go to Content Page 2"
            Command="{Binding ShellNavigateToPage}"
            CommandParameter="//Page2" />
    </VerticalStackLayout>
</local:WizardView>
```

### NewContent2

```csharp
using System.Diagnostics;

namespace MauiWizard;

public partial class NewContent2 : WizardView
{
    public NewContent2()
    {
        InitializeComponent();
    }

    public override async Task OnStepAppearingAsync()
    {
        await base.OnStepAppearingAsync();

        // Your async initialization code here
        await Task.Delay(500); // Simulate async work
        Debug.WriteLine("NewContent2 is now appearing!");

        // You can update UI here too
        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            // Update UI elements
            await Shell.Current.CurrentPage.DisplayAlert("Test", "From 2", "Okay");
        });
    }

    public override async Task OnStepDisappearingAsync()
    {
        await base.OnStepDisappearingAsync();

        // Cleanup code here
        Debug.WriteLine("NewContent2 is disappearing!");
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<local:WizardView xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiWizard"
             x:Class="MauiWizard.NewContent2"
             Title="NewContent2">
    <VerticalStackLayout>
        <Label
            Text="Welcome to .NET MAUI 2!"
            VerticalOptions="Center"
            HorizontalOptions="Center" />
    </VerticalStackLayout>
</local:WizardView>
```

### NewContent3

```csharp
using System.Diagnostics;

namespace MauiWizard;

public partial class NewContent3 : WizardView
{
	public NewContent3()
	{
        InitializeComponent();
        btnGoTo1stView.Clicked += async (sender, e) => await GotTo1stView(sender!, e);
    }

    public override async Task OnStepAppearingAsync()
    {
        await base.OnStepAppearingAsync();

        // Your async initialization code here
        await Task.Delay(500); // Simulate async work
        Debug.WriteLine("NewContent3 is now appearing!");

        // You can update UI here too
        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            // Update UI elements
            await Shell.Current.CurrentPage.DisplayAlert("Test", "From 3", "Okay");
        });
    }

    public override async Task OnStepDisappearingAsync()
    {
        await base.OnStepDisappearingAsync();

        // Cleanup code here
        Debug.WriteLine("NewContent3 is disappearing!");
    }

    private async Task GotTo1stView(object sender, EventArgs e)
    {
        if (BindingContext is MainViewModel viewModel)
        {
            if (viewModel.OnGoToFirstPage != null)
                await viewModel.OnGoToFirstPage.Invoke();
        }
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<local:WizardView xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiWizard"
             x:Class="MauiWizard.NewContent3"
             Title="NewContent3">
    <VerticalStackLayout>
        <Label
            Text="Welcome to .NET MAUI 3!"
            VerticalOptions="Center"
            HorizontalOptions="Center" />
        <Button
            x:Name="btnGoTo1stView"
            Text="Go to 1st View" />
    </VerticalStackLayout>
</local:WizardView>
```

## Create the Shell and content pages

`AppShell` has a flyout with the wizard page (route `Page0` in the `Home` tab) and two content pages (routes `Page1` and `Page2`). The content pages inherit from `ContentPage`, not from `WizardView`.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<Shell
    x:Class="MauiWizard.AppShell"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
    xmlns:local="clr-namespace:MauiWizard"
    Shell.FlyoutBehavior="Flyout"
    Title="MauiWizard">

    <Shell.FlyoutHeaderTemplate>
        <DataTemplate>
            <Grid HeightRequest="200">
                <Label Text="Maui Wizard App"
                   FontAttributes="Bold"
                   HorizontalTextAlignment="Center"
                   VerticalTextAlignment="Center" />
            </Grid>
        </DataTemplate>
    </Shell.FlyoutHeaderTemplate>

    <Shell.FlyoutFooterTemplate>
        <DataTemplate>
            <StackLayout>
                <Label Text="Maui Wizard"
                       FontAttributes="Bold"
                       HorizontalOptions="Center" />
            </StackLayout>
        </DataTemplate>
    </Shell.FlyoutFooterTemplate>

    <FlyoutItem Route="App"
                FlyoutDisplayOptions="AsMultipleItems">

        <Tab Title="Home"
             Route="Home">
            <ShellContent
                Title="Home"
                ContentTemplate="{DataTemplate local:MainPage}"
                Route="Page0" />
        </Tab>

        <ShellContent Route="Page1"
                      Title="New Page 1"
                      ContentTemplate="{DataTemplate local:NewPage1}" />
        <ShellContent Route="Page2"
                      Title="New Page 2"
                      ContentTemplate="{DataTemplate local:NewPage2}" />
    </FlyoutItem>

</Shell>
```

```csharp
namespace MauiWizard
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();
            //Navigated += OnShellNavigated!;
        }

        /*private void OnShellNavigated(object sender, ShellNavigatedEventArgs e)
        {
            if (e.Current?.Location?.OriginalString == "//App/Home/Page0")
            {
                Current.CurrentItem = Current.Items[0];
            }
        }*/
    }
}
```

### NewPage1

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MauiWizard.NewPage1"
             Title="NewPage1">
    <VerticalStackLayout>
        <Label
            Text="Welcome to .NET MAUI Page 1!"
            VerticalOptions="Center"
            HorizontalOptions="Center" />
    </VerticalStackLayout>
</ContentPage>
```

### NewPage2

`NewPage2` gets `MainViewModel` from dependency injection. Its button goes back to the wizard page with the absolute route `//App/Home/Page0`.

```csharp
namespace MauiWizard;

public partial class NewPage2 : ContentPage
{
	public NewPage2(MainViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
```

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiWizard"
             x:DataType="local:MainViewModel"
             x:Class="MauiWizard.NewPage2"
             Title="NewPage2">
    <VerticalStackLayout>
        <Label
            Text="Welcome to .NET MAUI Page 2!"
            VerticalOptions="Center"
            HorizontalOptions="Center" />
        <Button
            Text="Go to Content Main Page"
            Command="{Binding ShellNavigateToPage}"
            CommandParameter="//App/Home/Page0" />
    </VerticalStackLayout>
</ContentPage>
```

## How it works

| Area | Details |
| --- | --- |
| Navigation animation | `TranslateTo` moves the views horizontally. The control sets the visibility of the views during each transition. |
| State management | The control tracks the current step index and checks if the user can go back or forward. The page updates the button states. |
| Events | `StepChanged` tells consumers about each move. The event arguments include the previous and the current step index. |
| Flexible content | You can add the steps in XAML or in code. The current code adds them from the view model. |
| Layout | MAUI layout controls set the size and the position. A `ScrollView` holds content that is larger than the screen. |

## Use the wizard

1. To add a step, create a class that inherits from `WizardView`, add MAUI controls as content, and set the `Title` property.
2. Add the step to `PageService.GetPagesAsync`, or add it in XAML inside `WizardStepsControl`.
3. To move between steps, call `Forward()` or `Back()`. To check a move first, call `CanGoForward()` or `CanGoBack()`.
4. To react to a move, subscribe to the `StepChanged` event and update the UI for the current step.

## Extend the wizard

| Extension | How |
| --- | --- |
| Custom animations | Change the `Forward()` and `Back()` methods. Change the duration or the easing function. |
| More navigation controls | Add a step progress indicator. Add direct navigation to specific steps. |
| Validation | Validate a step before the user can move. Show the validation errors. |
| Data persistence | Keep the state across the steps. Collect the data from all steps at the end. |

## Related links

- [Alex: Maui Wizard Demo](https://github.com/Axemasta/MauiWizardDemo)
- [Redth: Building a Step-by-Step / Wizard Control in .NET MAUI](https://redth.codes/building-a-step-by-step-wizard-control-in-net-maui)
