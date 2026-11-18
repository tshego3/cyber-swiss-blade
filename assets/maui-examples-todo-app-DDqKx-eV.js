var e=`---
title: .NET MAUI example: MVVM Todo app with REST API CRUD operations
summary: Build a .NET MAUI MVVM Todo app with a login page, a list page, a detail page, Shell navigation, and HTTP CRUD calls to a REST API.
category: .NET MAUI
order: 110
---

# .NET MAUI example: MVVM Todo app with REST API CRUD operations

This tutorial builds a .NET MAUI Todo app with the MVVM pattern and REST API CRUD (create, read, update, delete) operations. It includes the folder structure, a login page, a list page, a detail page, and the HTTP requests.

## Before you start

- .NET 9 SDK.
- Visual Studio 2022 or later with the MAUI workload.
- The \`Newtonsoft.Json\` NuGet package for \`TokenResponse\`.
- Basic knowledge of C#, the MVVM pattern, and REST APIs.

The sample uses public test APIs: \`https://dummyjson.com/users\` for the login check and \`https://jsonplaceholder.typicode.com\` for the todo items.

> **NOTE:** Dated (checked November 2026): .NET 9 reached the end of support on November 10, 2026. Use the .NET 10 SDK (LTS). The code in this tutorial also builds on .NET 10.

## Create the project

1. Open Visual Studio.
2. Create a new project.
3. Select \`.NET MAUI App (Preview)\`.
4. Give the project a name, for example \`MauiTodoApp\`.
5. Click \`Create\`.

> **NOTE:** Dated (checked November 2026): The template name in Visual Studio is now \`.NET MAUI App\`, with no \`(Preview)\` suffix.

## Set up the folder structure

Use this folder structure:

\`\`\`text
MauiTodoApp/
│
├── Converters/
│   └── InverseBooleanConverter.cs
│
├── Helpers/
│   ├── CommandExtensions.cs
│   ├── Constants.cs
│   └── Settings.cs
|
├── Models/
│   └── TodoItem.cs
│   └── TokenResponse.cs
│   ├── User.cs
│   └── UserResponse.cs
│
├── ViewModels/
│   ├── LoginViewModel.cs
│   ├── TodoListViewModel.cs
│   └── TodoDetailViewModel.cs
│
├── Views/
│   ├── LoginPage.xaml
│   ├── TodoListPage.xaml
│   └── TodoDetailPage.xaml
│
├── Services/
│   └── TodoService.cs
│
├── App.xaml
├── App.xaml.cs
├── AppShell.xaml
├── AppShell.xaml.cs
└── MauiProgram.cs
\`\`\`

## Define the converters, helpers, and models

Create these classes: \`InverseBooleanConverter\`, \`Settings\`, \`CommandExtensions\`, \`Constants\`, \`TokenResponse\`, \`TodoItem\`, \`User\`, and \`UserResponse\`. The comment on the first line of each sample gives the folder.

\`\`\`csharp
// Converters/InverseBooleanConverter.cs
using System.Globalization;

namespace MauiTodoApp.Converters
{
    public class InverseBooleanConverter : IValueConverter
    {
        public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is bool boolValue)
            {
                return !boolValue;
            }
            return false;
        }

        public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        {
            if (value is bool boolValue)
            {
                return !boolValue;
            }
            return false;
        }
    }
}
\`\`\`

\`Settings\` keeps the user name, the password, the access token, and the token expiration in \`Preferences\`.

> **WARNING:** \`Preferences\` stores values as plain text. In a production app, keep the password and the access token in \`SecureStorage\`.


\`\`\`csharp
// Helpers/Settings.cs
namespace MauiTodoApp.Helpers
{
    public static class Settings
    {
        public static string Username
        {
            get
            {
                return Preferences.Default.Get("Username", "");
            }
            set
            {
                Preferences.Default.Set("Username", value);
            }
        }

        public static string Password
        {
            get
            {
                return Preferences.Default.Get("Password", "");
            }
            set
            {
                Preferences.Default.Set("Password", value);
            }
        }

        public static string AccessToken
        {
            get
            {
                return Preferences.Default.Get("AccessToken", "");
            }
            set
            {
                Preferences.Default.Set("AccessToken", value);
            }
        }

        public static DateTime AccessTokenExpiration
        {
            get
            {
                return Preferences.Default.Get("AccessTokenExpiration", DateTime.UtcNow);
            }
            set
            {
                Preferences.Default.Set("AccessTokenExpiration", value);
            }
        }
    }
}
\`\`\`

The commands in the ViewModels and in \`AppShell\` call \`ToSafeCommand\`. In this sample, it returns the same command with no change:

\`\`\`csharp
// Helpers/CommandExtensions.cs
using System.Windows.Input;

namespace MauiTodoApp.Helpers
{
    public static class CommandExtensions
    {
        public static ICommand ToSafeCommand(this ICommand command)
        {
            return command;
        }
    }
}
\`\`\`

\`AppShell\` uses \`Constants\` for the error alert texts:

\`\`\`csharp
// Helpers/Constants.cs
namespace MauiTodoApp.Helpers
{
    public static class Constants
    {
        public const string Error = "Error";
        public const string Okay = "OK";
    }
}
\`\`\`

\`\`\`csharp
// Models/TokenResponse.cs
using Newtonsoft.Json;

namespace MauiTodoApp.Models
{
    public class TokenResponse
    {
        [JsonProperty("token_type")]
        public string? TokenType { get; set; }

        [JsonProperty("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonProperty("ext_expires_in")]
        public int ExtExpiresIn { get; set; }

        [JsonProperty("access_token")]
        public string? AccessToken { get; set; }
    }
}
\`\`\`

\`\`\`csharp
// Models/TodoItem.cs
namespace MauiTodoApp.Models
{
    public class TodoItem
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Title { get; set; }
        public bool Completed { get; set; }
    }
}
\`\`\`

\`\`\`csharp
// Models/User.cs
namespace MauiTodoApp.Models
{
    public class User
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Password { get; set; }
        public string? Email { get; set; }
    }
}
\`\`\`

\`\`\`csharp
// Models/UserResponse.cs
using System.Collections.Generic;

namespace MauiTodoApp.Models
{
    public class UserResponse
    {
        public required List<User> Users { get; set; }
    }
}
\`\`\`

## Create the TodoService

Create a \`TodoService\` class in the \`Services\` folder. It sends the HTTP requests.

The active \`LoginAsync\` gets the users from \`https://dummyjson.com/users\` and looks for a user with the same user name (case-insensitive) and password. The two commented-out versions show other login methods: a POST to the \`login.microsoftonline.com\` OAuth 2.0 token endpoint that stores the access token and its expiration in \`Settings\`, and a POST to \`jsonplaceholder.typicode.com/users\`.

> **NOTE:** The commented-out token request does not work as written. The OAuth 2.0 token endpoint accepts only a form-encoded body (\`application/x-www-form-urlencoded\`) with a \`grant_type\` and the client values, not a JSON user object.

\`\`\`csharp
// Services/TodoService.cs
using MauiTodoApp.Models;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace MauiTodoApp.Services
{
    public class TodoService
    {
        private readonly HttpClient _httpClient;

        public TodoService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // public static async Task<bool> LoginAsync(string username, string password)
        // {
        //     var userModel = new User { Username = username, Password = password, Email = username };
        //     var json = JsonConvert.SerializeObject(userModel);
        //     HttpContent content = new StringContent(json);
        //     content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        //     var response = await new HttpClient().PostAsync("https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token", content);
        //     var tokenResponse = JsonConvert.DeserializeObject<TokenResponse>(await response.Content.ReadAsStringAsync());
        //     Settings.AccessToken = tokenResponse!.AccessToken!;
        //     Settings.AccessTokenExpiration = DateTime.Now.AddSeconds(tokenResponse!.ExtExpiresIn!);
        //     return string.IsNullOrEmpty(Settings.AccessToken).Equals(false);
        // }

        // public async Task<bool> LoginAsync(string username, string password)
        // {
        //     var loginRequest = new { username, password };
        //     var response = await _httpClient.PostAsJsonAsync("https://jsonplaceholder.typicode.com/users", loginRequest);

        //     return response.IsSuccessStatusCode;
        // }

        public async Task<bool> LoginAsync(string username, string password)
        {
            try
            {
                var response = await _httpClient.GetFromJsonAsync<UserResponse>("https://dummyjson.com/users");

                if (response?.Users != null)
                {
                    var user = response.Users.FirstOrDefault(u =>
                        u.Username!.Equals(username, StringComparison.OrdinalIgnoreCase) &&
                        u.Password == password);

                    return user != null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login failed: {ex.Message}");
            }

            return false;
        }

        public async Task<List<TodoItem>> GetTodosAsync()
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "token");
            return await _httpClient.GetFromJsonAsync<List<TodoItem>>("https://jsonplaceholder.typicode.com/todos") ?? new();
        }

        public async Task<TodoItem> GetTodoAsync(int id)
        {
            return await _httpClient.GetFromJsonAsync<TodoItem>($"https://jsonplaceholder.typicode.com/todos/{id}") ?? new();
        }

        public async Task<TodoItem> CreateTodoAsync(TodoItem todo)
        {
            var response = await _httpClient.PostAsJsonAsync("https://jsonplaceholder.typicode.com/todos", todo);
            return await response.Content.ReadFromJsonAsync<TodoItem>() ?? new();
        }

        public async Task UpdateTodoAsync(int id, TodoItem todo)
        {
            await _httpClient.PutAsJsonAsync($"https://jsonplaceholder.typicode.com/todos/{id}", todo);
        }

        public async Task DeleteTodoAsync(int id)
        {
            await _httpClient.DeleteAsync($"https://jsonplaceholder.typicode.com/todos/{id}");
        }
    }
}
\`\`\`

## Create the ViewModels

Create the ViewModels for the login page, the list page, and the detail page.

### LoginViewModel

If the user name or the password is empty, the login command shows an alert. If the login is correct, it goes to \`TodoListPage\`.

\`\`\`csharp
// ViewModels/LoginViewModel.cs
using MauiTodoApp.Helpers;
using MauiTodoApp.Services;
using MauiTodoApp.Views;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace MauiTodoApp.ViewModels
{
    public partial class LoginViewModel : INotifyPropertyChanged
    {
        public string? Username { get; set; }
        public string? Password { get; set; }

        private bool _isLoading;

        private readonly TodoService _todoService = new(new HttpClient());

        public bool IsLoading
        {
            get => _isLoading;
            set
            {
                _isLoading = value;
                OnPropertyChanged();
            }
        }

        public ICommand LoginCommand
        {
            get
            {
                return new Command(async () =>
                {
                    if (string.IsNullOrWhiteSpace(Username) || string.IsNullOrWhiteSpace(Password))
                    {
                        await Shell.Current.DisplayAlert("Login failed", "Username and password are required.", "OK");
                        return;
                    }

                    IsLoading = true;
                    var isAuthenticated = await _todoService.LoginAsync(Username!, Password!);

                    if (isAuthenticated)
                    {
                        await Shell.Current.GoToAsync(nameof(TodoListPage));
                        IsLoading = false;
                    }
                    else
                    {
                        IsLoading = false;
                        await Shell.Current.DisplayAlert("Login failed", "Invalid username or password.", "OK");
                    }
                }).ToSafeCommand();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
\`\`\`

### TodoListViewModel

\`\`\`csharp
// ViewModels/TodoListViewModel.cs
using MauiTodoApp.Models;
using MauiTodoApp.Services;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace MauiTodoApp.ViewModels
{
    public partial class TodoListViewModel : INotifyPropertyChanged
    {
        private readonly TodoService _todoService = new(new HttpClient());
        private List<TodoItem>? _todos;
        private bool _isLoading;

        public List<TodoItem> Todos
        {
            get => _todos!;
            set
            {
                _todos = value;
                OnPropertyChanged();
            }
        }

        public bool IsLoading
        {
            get => _isLoading;
            set
            {
                _isLoading = value;
                OnPropertyChanged();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public async Task LoadTodosAsync()
        {
            IsLoading = true;
            Todos = await _todoService.GetTodosAsync();
            IsLoading = false;
        }
    }
}
\`\`\`

### TodoDetailViewModel

\`\`\`csharp
// ViewModels/TodoDetailViewModel.cs
using MauiTodoApp.Helpers;
using MauiTodoApp.Models;
using MauiTodoApp.Views;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

namespace MauiTodoApp.ViewModels
{
    public partial class TodoDetailViewModel : INotifyPropertyChanged
    {
        private TodoItem? _todo;

        public TodoItem Todo
        {
            get { return _todo!; }
            set
            {
                _todo = value;
                OnPropertyChanged();
            }
        }

        public string GetItem()
        {
            return "Test";
        }

        public ICommand BackCommand
        {
            get
            {
                return new Command(async () =>
                {
                    await Shell.Current.GoToAsync(nameof(TodoListPage));
                }).ToSafeCommand();
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
\`\`\`

## Create the views

Create the XAML pages for the login page, the list page, and the detail page.

> **NOTE:** Dated (checked November 2026): In .NET 10, \`ListView\` and \`ViewCell\` are obsolete. Use \`CollectionView\` with a \`DataTemplate\` and the \`SelectionChanged\` event. \`DisplayAlert\` is also obsolete. Use \`DisplayAlertAsync\`.

### LoginPage

While \`IsLoading\` is true, the page shows the activity indicator. The \`InverseBooleanConverter\` hides the entries and the button at the same time.

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- Views/LoginPage.xaml -->
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiTodoApp"
             x:Class="MauiTodoApp.Views.LoginPage"
             xmlns:viewModels="clr-namespace:MauiTodoApp.ViewModels"
             x:DataType="viewModels:LoginViewModel"
             Shell.NavBarIsVisible="false"
             Title="Login">

    <ContentPage.BindingContext>
        <viewModels:LoginViewModel />
    </ContentPage.BindingContext>

    <StackLayout Orientation="Vertical">
        <ActivityIndicator IsRunning="{Binding IsLoading}" IsVisible="{Binding IsLoading}" VerticalOptions="Center" HorizontalOptions="Center" ZIndex="1" />

        <Entry Text="{Binding Username}" Placeholder="username" IsVisible="{Binding IsLoading, Converter={StaticResource InverseBooleanConverter}}" />
        <Entry Text="{Binding Password}" Placeholder="password" IsPassword="True" IsVisible="{Binding IsLoading, Converter={StaticResource InverseBooleanConverter}}" />
        <Button Command="{Binding LoginCommand}" Text="Login" IsVisible="{Binding IsLoading, Converter={StaticResource InverseBooleanConverter}}" />
    </StackLayout>
</ContentPage>
\`\`\`

\`\`\`csharp
// Views/LoginPage.xaml.cs
using MauiTodoApp.Models;

namespace MauiTodoApp.Views
{
    public partial class LoginPage : ContentPage
    {
        public LoginPage()
        {
            InitializeComponent();
        }
    }
}
\`\`\`

### TodoListPage

The page hides the Shell back button. When the user taps an item, the page opens \`TodoDetailPage\` for that item.

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- Views/TodoListPage.xaml -->
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiTodoApp"
             x:Class="MauiTodoApp.Views.TodoListPage"
             xmlns:models="clr-namespace:MauiTodoApp.Models"
             xmlns:viewModels="clr-namespace:MauiTodoApp.ViewModels"
             x:DataType="viewModels:TodoListViewModel"
             Title="Todo List">

    <ContentPage.BindingContext>
        <viewModels:TodoListViewModel />
    </ContentPage.BindingContext>

    <Shell.BackButtonBehavior>
        <BackButtonBehavior IsVisible="False" IsEnabled="False"/>
    </Shell.BackButtonBehavior>

    <StackLayout Orientation="Vertical">
        <ActivityIndicator IsRunning="{Binding IsLoading}" IsVisible="{Binding IsLoading}" VerticalOptions="Center" HorizontalOptions="Center" />

        <ListView ItemsSource="{Binding Todos}" ItemTapped="GoToTodoDetailPage_ItemTapped" IsVisible="{Binding IsLoading, Converter={StaticResource InverseBooleanConverter}}">
            <ListView.ItemTemplate>
                <DataTemplate x:DataType="models:TodoItem">
                    <ViewCell>
                        <StackLayout>
                            <Label Text="{Binding Title}"/>
                            <Label Text="{Binding Completed, StringFormat='Completed: {0}'}" />
                        </StackLayout>
                    </ViewCell>
                </DataTemplate>
            </ListView.ItemTemplate>
        </ListView>
    </StackLayout>
</ContentPage>
\`\`\`

The code-behind loads the todo items when the page appears. A dispatcher timer loads them again every 5 s. The timer stops when the page disappears. The commented-out lines show Shell navigation with \`ShellNavigationQueryParameters\` as an alternative to \`Navigation.PushAsync\`.

\`\`\`csharp
// Views/TodoListPage.xaml.cs
using MauiTodoApp.Models;
using MauiTodoApp.ViewModels;

namespace MauiTodoApp.Views
{
    public partial class TodoListPage : ContentPage
    {
        private IDispatcherTimer? _refreshTimer;

        public TodoListPage()
        {
            InitializeComponent();
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();
            if (BindingContext is TodoListViewModel viewModel)
            {
                await viewModel.LoadTodosAsync();
            }

            _refreshTimer = Dispatcher.CreateTimer();
            _refreshTimer.Interval = TimeSpan.FromSeconds(5);
            _refreshTimer.Tick += async (s, e) =>
            {
                if (BindingContext is TodoListViewModel vm)
                {
                    await vm.LoadTodosAsync();
                    // await vm.LoadTodosAsync.ExecuteAsync(null); // For RelayCommand
                }
            };
            _refreshTimer.Start();
        }

        private async void GoToTodoDetailPage_ItemTapped(object sender, ItemTappedEventArgs e)
        {
            var todo = e.Item as TodoItem;
            //var navigationParameter = new ShellNavigationQueryParameters
            //{
            //    { "Todo", todo! }
            //};
            //await Shell.Current.GoToAsync(nameof(TodoDetailPage), navigationParameter);
            await Navigation.PushAsync(new TodoDetailPage(todo));
        }

        protected override void OnDisappearing()
        {
            base.OnDisappearing();

            if (_refreshTimer != null)
            {
                _refreshTimer.Stop();
                _refreshTimer = null;
            }
        }
    }
}
\`\`\`

### TodoDetailPage

The page gets the todo item in two ways: as a constructor parameter (for \`Navigation.PushAsync\`) or as the \`Todo\` query attribute (for Shell navigation with \`IQueryAttributable\`).

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<!-- Views/TodoDetailPage.xaml -->
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MauiTodoApp.Views.TodoDetailPage"
             xmlns:viewModels="clr-namespace:MauiTodoApp.ViewModels"
             x:DataType="viewModels:TodoDetailViewModel"
             Title="Todo Details">

    <ContentPage.BindingContext>
        <viewModels:TodoDetailViewModel />
    </ContentPage.BindingContext>

    <Shell.BackButtonBehavior>
        <BackButtonBehavior Command="{Binding BackCommand}" />
    </Shell.BackButtonBehavior>

    <StackLayout Orientation="Vertical">
        <Entry Text="{Binding Todo.Title}" />
    </StackLayout>
</ContentPage>
\`\`\`

\`\`\`csharp
// Views/TodoDetailPage.xaml.cs
using MauiTodoApp.Models;
using MauiTodoApp.ViewModels;

namespace MauiTodoApp.Views
{
    public partial class TodoDetailPage : ContentPage, IQueryAttributable
    {
        public TodoDetailPage(TodoItem? todoItem = null)
        {
            InitializeComponent();

            if (todoItem != null)
            {
                var todoDetailViewModel = new TodoDetailViewModel
                {
                    Todo = todoItem!
                };
                BindingContext = todoDetailViewModel;
            }
        }

        public void ApplyQueryAttributes(IDictionary<string, object> query)
        {
            if (query.TryGetValue("Todo", out object? value))
            {
                var todoItem = value as TodoItem;

                var todoDetailViewModel = new TodoDetailViewModel
                {
                    Todo = todoItem!
                };
                BindingContext = todoDetailViewModel;
            }
        }
    }
}
\`\`\`

## Register the services, ViewModels, and views

Register the ViewModels and the views in \`MauiProgram.cs\`.

\`\`\`csharp
// MauiProgram.cs
using MauiTodoApp.Services;
using MauiTodoApp.ViewModels;
using MauiTodoApp.Views;
using Microsoft.Extensions.Logging;

namespace MauiTodoApp
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

            builder.Services.AddTransient<LoginViewModel>();
            builder.Services.AddTransient<TodoListViewModel>();
            builder.Services.AddTransient<TodoDetailViewModel>();

            builder.Services.AddTransient<LoginPage>();
            builder.Services.AddTransient<TodoListPage>();
            builder.Services.AddTransient<TodoDetailPage>();

#if DEBUG
            builder.Logging.AddDebug();
#endif

            return builder.Build();
        }
    }
}
\`\`\`

## Register the converter in App.xaml

Add the \`InverseBooleanConverter\` to the application resources. The pages use it with the \`InverseBooleanConverter\` key.

\`\`\`xml
<?xml version = "1.0" encoding = "UTF-8" ?>
<!-- App.xaml -->
<Application xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:MauiTodoApp"
             x:Class="MauiTodoApp.App"
             xmlns:viewModels="clr-namespace:MauiTodoApp.ViewModels"
             xmlns:converters="clr-namespace:MauiTodoApp.Converters">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <ResourceDictionary Source="Resources/Styles/Colors.xaml" />
                <ResourceDictionary Source="Resources/Styles/Styles.xaml" />
            </ResourceDictionary.MergedDictionaries>
            <converters:InverseBooleanConverter x:Key="InverseBooleanConverter" />
        </ResourceDictionary>
    </Application.Resources>
</Application>
\`\`\`

## Create the AppShell

Create an \`AppShell\` for the navigation. The login page has the \`LoginPage\` route and no flyout. The list page has the \`TodoListPage\` route. The \`Logout\` menu item goes back to \`//LoginPage\`. The commented-out items show how to open pages from the flyout with \`GoToPageCommand\`.

\`\`\`xml
<?xml version="1.0" encoding="UTF-8" ?>
<!-- AppShell.xaml -->
<Shell xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
       xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
       xmlns:local="clr-namespace:MauiTodoApp"
       xmlns:views="clr-namespace:MauiTodoApp.Views"
       FlyoutHeaderBehavior="CollapseOnScroll"
       x:Class="MauiTodoApp.AppShell"
       x:DataType="local:AppShell"
       x:Name="shell">
    <ShellContent Title="Login" ContentTemplate="{DataTemplate views:LoginPage}" Route="LoginPage" Shell.FlyoutBehavior="Disabled" Shell.FlyoutItemIsVisible="False" />
    <ShellContent Title="Todo List" ContentTemplate="{DataTemplate views:TodoListPage}" Route="TodoListPage" />
    <!-- <ShellContent Title="Todo Detail" ContentTemplate="{DataTemplate views:TodoDetailPage}" Route="TodoDetailPage" /> -->
    <!-- <MenuItem Text="Todo List"
              Command="{Binding GoToPageCommand}"
              CommandParameter="{x:Type views:TodoListPage}">
    </MenuItem> -->
    <!-- <MenuItem Text="Todo Detail"
              Command="{Binding GoToPageCommand}"
              CommandParameter="{x:Type views:TodoDetailPage}">
    </MenuItem> -->
    <MenuItem Text="Logout"
              Command="{Binding LogoutCommand}">
    </MenuItem>
</Shell>
\`\`\`

The code-behind registers the \`TodoDetailPage\` route. \`GetNavigationPage\` gets a page from the service container. If the container has no page of that type, it creates one with \`Activator.CreateInstance\`, and if that fails, it returns \`LoginPage\`.

\`\`\`csharp
// AppShell.xaml.cs
using System.Windows.Input;
using MauiTodoApp.Helpers;
using MauiTodoApp.Views;

namespace MauiTodoApp
{
    public partial class AppShell : Shell
    {
        public AppShell()
        {
            InitializeComponent();
            BindingContext = this;

            //Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));
            //Routing.RegisterRoute(nameof(TodoListPage), typeof(TodoListPage));
            Routing.RegisterRoute(nameof(TodoDetailPage), typeof(TodoDetailPage));
        }

        private Task<NavigationPage> GetNavigationPage(Type type)
        {
            try
            {
                if (IPlatformApplication.Current is not null
                    && IPlatformApplication.Current.Services is IServiceProvider serviceProvider)
                {
                    if (serviceProvider.GetService(type) is not null
                            && serviceProvider.GetService(type) is ContentPage contentPage)
                    {
                        return Task.FromResult(new NavigationPage(contentPage));
                    }
                    else if (Activator.CreateInstance(type) is Page page)
                    {
                        return Task.FromResult(new NavigationPage(page));
                    }
                    else
                    {
                        return Task.FromResult(new NavigationPage(new LoginPage()));
                    }
                }
                else
                {
                    return Task.FromResult(new NavigationPage(new LoginPage()));
                }
            }
            catch (Exception)
            {
                return Task.FromResult(new NavigationPage(new LoginPage()));
            }
        }

        public ICommand GoToPageCommand
        {
            get
            {
                return new Command<Type>(async (targetType) =>
                {
                    try
                    {
                        if (Current.FlyoutIsPresented is true)
                        {
                            Current.FlyoutIsPresented = false;
                        }

                        switch (targetType)
                        {
                            case Type t when t == typeof(TodoListPage):
                                await GoToAsync(nameof(TodoListPage));
                                break;
                            case Type t when t == typeof(TodoDetailPage):
                                await GoToAsync(nameof(TodoDetailPage));
                                break;
                        }
                    }
                    catch (Exception ex)
                    {
                        await DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                    }
                }).ToSafeCommand();
            }
        }

        public ICommand LogoutCommand
        {
            get
            {
                return new Command(async () =>
                {
                    try
                    {
                        await GoToAsync("//LoginPage");
                    }
                    catch (Exception ex)
                    {
                        await DisplayAlert(Constants.Error, ex.Message, Constants.Okay);
                    }
                }).ToSafeCommand();
            }
        }
    }
}
\`\`\`

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
- [DummyJSON users](https://dummyjson.com/users)
- [JSONPlaceholder todos](https://jsonplaceholder.typicode.com/todos)
`;export{e as default};