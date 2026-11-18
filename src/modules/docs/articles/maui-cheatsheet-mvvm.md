---
title: ObservableObject and INotifyPropertyChanged in .NET MAUI
summary: Compare ObservableObject and INotifyPropertyChanged in .NET 9 MAUI, with nullable-safe view models, a login and notes example, and command parameters.
category: .NET MAUI
order: 90
---

# ObservableObject and INotifyPropertyChanged in .NET MAUI

This article compares 2 ways to send property change notifications in .NET 9 MAUI view models. It also gives a full login and notes example that follows nullable standards and uses command parameters.

## Before you start

- .NET 9 and a .NET MAUI project.
- The `CommunityToolkit.Mvvm` NuGet package (for `ObservableObject`, `RelayCommand`, and the other attributes).
- The `CommunityToolkit.Maui` NuGet package (for `UseMauiCommunityToolkit` and `InverseBooleanConverter`).
- Nullable reference types enabled in the `.csproj` file:

  ```xml
  <PropertyGroup>
      <Nullable>enable</Nullable>
  </PropertyGroup>
  ```

## Key differences

| Approach | Description |
| --- | --- |
| `ObservableObject` | Part of the CommunityToolkit.Mvvm package. It is a base implementation of `INotifyPropertyChanged` and `INotifyPropertyChanging`. Attributes such as `[ObservableProperty]` and `[RelayCommand]` generate the properties and commands automatically. This decreases boilerplate code. |
| `INotifyPropertyChanged` | An interface that you implement to tell clients that a property value changed. This is the traditional method. You write the notifications manually, so the code is longer and errors are more likely. |

The 2 approaches are both valid. `ObservableObject` can decrease the quantity of code that you write and maintain.

## Use ObservableObject

1. Install the CommunityToolkit.Mvvm and CommunityToolkit.Maui NuGet packages:

   ```bash
   dotnet add package CommunityToolkit.Mvvm
   dotnet add package CommunityToolkit.Maui
   ```

2. In `MauiProgram.cs`, add the lines that start with `+`:

   ```csharp
   + using CommunityToolkit.Maui;

   public static class MauiProgram
   {
      public static MauiApp CreateMauiApp()
      {
          var builder = MauiApp.CreateBuilder();
          builder
              .UseMauiApp<App>()
   +          .UseMauiCommunityToolkit()
              .ConfigureFonts(fonts =>
              {
                  fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                  fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
              });

   #if DEBUG
          builder.Logging.AddDebug();
   #endif

          return builder.Build();
      }
   }
   ```

3. Create a view model that uses `ObservableObject`:

   ```csharp
   using CommunityToolkit.Mvvm.ComponentModel;
   using CommunityToolkit.Mvvm.Input;

   public partial class MainPageViewModel : ObservableObject
   {
       [ObservableProperty]
       private string? _username;

       [ObservableProperty]
       private bool _isBusy;

       [RelayCommand]
       private void Submit()
       {
           IsBusy = true;
           // Simulate a long-running task
           Task.Delay(2000).ContinueWith(_ => IsBusy = false);
       }
   }
   ```

4. Bind the view model to the view. See [Bind the view model to the view](#bind-the-view-model-to-the-view).

## Use INotifyPropertyChanged

1. Create a view model that implements `INotifyPropertyChanged`:

   ```csharp
   using System.Windows.Input;
   using System.ComponentModel;
   using System.Runtime.CompilerServices;

   public class MainPageViewModel : INotifyPropertyChanged
   {
       private string? _username;
       public string? Username
       {
           get => _username;
           set
           {
               if (_username != value)
               {
                   _username = value;
                   OnPropertyChanged();
               }
           }
       }

       private bool _isBusy;
       public bool IsBusy
       {
           get => _isBusy;
           set
           {
               if (_isBusy != value)
               {
                   _isBusy = value;
                   OnPropertyChanged();
               }
           }
       }

       public ICommand SubmitCommand => new Command(() =>
       {
           IsBusy = true;
           // Simulate a long-running task
           Task.Delay(2000).ContinueWith(_ => IsBusy = false);
       }).ToSafeCommand();

       public event PropertyChangedEventHandler? PropertyChanged;

       protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
       {
           PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
       }
   }
   ```

   Put the `ToSafeCommand` extension method in a separate static class:

   ```csharp
   // Helpers/CommandExtensions.cs
   using System.Windows.Input;

   public static class CommandExtensions
   {
       public static ICommand ToSafeCommand(this ICommand command)
       {
           return command;
       }
   }
   ```

2. Bind the view model to the view. See the next section.

## Bind the view model to the view

The 2 view models use the same XAML. `InverseBooleanConverter` comes from CommunityToolkit.Maui. Declare it as a page resource before you use it as a `StaticResource`.

```xml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:toolkit="http://schemas.microsoft.com/dotnet/2022/maui/toolkit"
             xmlns:vm="clr-namespace:YourNamespace"
             x:Class="YourNamespace.MainPage">

    <ContentPage.Resources>
        <toolkit:InverseBooleanConverter x:Key="InverseBooleanConverter" />
    </ContentPage.Resources>

    <ContentPage.BindingContext>
        <vm:MainPageViewModel />
    </ContentPage.BindingContext>

    <StackLayout>
        <Entry Text="{Binding Username}" Placeholder="Enter your username" />
        <Button Text="Submit" Command="{Binding SubmitCommand}" IsEnabled="{Binding IsBusy, Converter={StaticResource InverseBooleanConverter}}" />
    </StackLayout>
</ContentPage>
```

## Login and notes example

This example has a login screen that uses `ObservableObject`. After a successful login, the app opens a screen that shows notes. The example uses command parameters and `CanExecute` methods.

### User model

```csharp
public class User
{
    public string? Username { get; set; }
    public string? Password { get; set; }
}
```

### LoginViewModel

This class uses `ObservableObject` and contains the login logic.

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;

public partial class LoginViewModel : ObservableObject
{
    public LoginViewModel()
    {
        PropertyChanged += (s, e) =>
        {
            if (e.PropertyName == nameof(Username))
            {
                LoginCommand.NotifyCanExecuteChanged(); // Renamed from LoginAsyncCommand to LoginCommand
            }
            else if (e.PropertyName == nameof(Password))
            {
                LoginCommand.NotifyCanExecuteChanged(); // Renamed from LoginAsyncCommand to LoginCommand
            }
        };
    }

    [ObservableProperty]
    [Required(ErrorMessage = "Username is required")]
    private string? _username;

    [ObservableProperty]
    [Required(ErrorMessage = "Password is required")]
    private string? _password;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(LoginCommand))]
    private bool _allowLogin = true;

    // This method determines whether the LoginCommand can execute
    private bool CanLoginExecute() => !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password) && AllowLogin.Equals(true);

    [RelayCommand(CanExecute = nameof(CanLoginExecute))]
    private async Task LoginAsync()
    {
        // Simulate a login process
        if (Username == "admin" && Password == "password")
        {
            ErrorMessage = null;
            // await Shell.Current.GoToAsync("//notes");
            await Shell.Current.Navigation.PushAsync(new Views.NotesPage());
        }
        else
        {
            ErrorMessage = "Invalid username or password.";
        }
    }

    // This method is called whenever Username or Password changes
    partial void OnUsernameChanged(string? value) => LoginCommand.NotifyCanExecuteChanged();
    partial void OnPasswordChanged(string? value) => LoginCommand.NotifyCanExecuteChanged();
}
```

> **NOTE:** The `[Required]` attributes have no effect in a class that inherits from `ObservableObject`. To validate them, inherit from `ObservableValidator` and add `[NotifyDataErrorInfo]` to the fields, or call `ValidateAllProperties()`. The `CanLoginExecute` method does the empty check in this example.

### LoginPage.xaml

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:vm="clr-namespace:YourNamespace.ViewModels"
             x:Class="YourNamespace.Views.LoginPage"
             Title="Login">

    <ContentPage.BindingContext>
        <vm:LoginViewModel />
    </ContentPage.BindingContext>

    <StackLayout Padding="20">
        <Entry Placeholder="Username" Text="{Binding Username}" />
        <Entry Placeholder="Password" Text="{Binding Password}" IsPassword="True" />
        <Label Text="{Binding ErrorMessage}" TextColor="Red" />
        <Button Text="Login" Command="{Binding LoginCommand}" />
    </StackLayout>
</ContentPage>
```

### NotesViewModel

This class contains the logic of the notes screen.

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;

public partial class NotesViewModel : ObservableObject
{
    public NotesViewModel()
    {
        PropertyChanged += (s, e) =>
        {
            if (e.PropertyName == nameof(CurrentNote))
            {
                AddNoteCommand.NotifyCanExecuteChanged();
            }
        };
    }

    // private List<int> list { get; set; } = new List<int> { 1, 2, 3, 4, 5 };
    // [ObservableProperty]
    // ObservableCollection<int> _observableCollection = new ObservableCollection<int>(list);
    // ObservableCollection<int> _observableCollection = new(list);

    [ObservableProperty]
    private string? _currentNote;

    [ObservableProperty]
    private ObservableCollection<string> _notes = new ObservableCollection<string>
    {
        "Note 1",
        "Note 2",
        "Note 3"
    };

    // This method determines whether the AddNoteCommand can execute
    private bool CanAddNoteExecute() => !string.IsNullOrEmpty(CurrentNote);

    [RelayCommand(CanExecute = nameof(CanAddNoteExecute))]
    private void AddNote(string? note)
    {
        if (!string.IsNullOrWhiteSpace(note))
        {
            Notes.Add(note);
        }
    }
}
```

### NotesPage.xaml

The **Add Note** button sends the text of the `NewNoteEntry` entry as the command parameter.

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:vm="clr-namespace:YourNamespace.ViewModels"
             x:Class="YourNamespace.Views.NotesPage"
             Title="Notes">

    <ContentPage.BindingContext>
        <vm:NotesViewModel />
    </ContentPage.BindingContext>

    <StackLayout Padding="20">
        <ListView ItemsSource="{Binding Notes}">
            <ListView.ItemTemplate>
                <DataTemplate>
                    <ViewCell>
                        <Label Text="{Binding .}" />
                    </ViewCell>
                </DataTemplate>
            </ListView.ItemTemplate>
        </ListView>
        <Entry Placeholder="Add a new note" x:Name="NewNoteEntry" Text="{Binding CurrentNote}" />
        <Button Text="Add Note" Command="{Binding AddNoteCommand}" CommandParameter="{Binding Source={x:Reference NewNoteEntry}, Path=Text}" />
    </StackLayout>
</ContentPage>
```

> **NOTE:** Dated (checked November 2026): .NET 10 marks `ListView` and `ViewCell` as obsolete. Use `CollectionView` with a `DataTemplate` for new code.

### How the example works

- **CanExecute in LoginViewModel**: `CanLoginExecute` checks that `Username` and `Password` are not null or empty. The `[RelayCommand]` attribute sets `CanExecute = nameof(CanLoginExecute)`. `OnUsernameChanged` and `OnPasswordChanged` tell `LoginCommand` to evaluate its `CanExecute` state again when `Username` or `Password` changes.
- **CanExecute in NotesViewModel**: `CanAddNoteExecute` checks that `CurrentNote` is not null or empty. The `PropertyChanged` handler tells `AddNoteCommand` to evaluate its `CanExecute` state again when `CurrentNote` changes. The `[RelayCommand]` attribute sets `CanExecute = nameof(CanAddNoteExecute)`.
- **Button state**: The **Login** button is enabled only when `Username` and `Password` both have a value. The **Add Note** button is enabled only when the `Entry` field has text.

When the app runs:

1. The app starts and shows the login screen.
2. The **Login** button stays disabled until the `Username` and `Password` fields have values.
3. After the user enters the correct credentials (`admin` / `password`), the app opens the notes screen.
4. On the notes screen, the user can see the notes and add new notes. The **Add Note** button stays disabled until the `Entry` field has text.

## Find the binding context of an ancestor

This method goes up the element tree and returns the first ancestor whose `BindingContext` has the type `T`. Use it to get a parent view model, as a relative source ancestor binding does.

```csharp
private T? FindAncestorBindingContext<T>(Element element) where T : class
{
    Element currentElement = element;
    while (currentElement is not null)
    {
        if (currentElement.BindingContext is T viewModel)
        {
            return viewModel;
        }
        currentElement = currentElement.Parent;
    }
    return default;
}

private Task TestFindAncestorBindingContext()
{
    try
    {
        TodoDetailViewModel? todoDetailViewModel = FindAncestorBindingContext<TodoDetailViewModel>(this);
        if (todoDetailViewModel is not null)
        {
            todoDetailViewModel.Item = todoDetailViewModel.GetItem();
            return Task.CompletedTask;
        }
        else
        {
            return Task.CompletedTask;
        }
    }
    catch (Exception)
    {
        return Task.CompletedTask;
    }
}
```

## Related links

- [MVVM Toolkit introduction](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/)
- [Exploring MVVM and data binding (Packt, chapter 4)](https://github.com/PacktPublishing/.NET-MAUI-Cross-Platform-Application-Development-Second-edition/tree/2nd/chapter04)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
