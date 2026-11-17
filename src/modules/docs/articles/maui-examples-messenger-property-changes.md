---
title: .NET MAUI example: Handle property changes with Messenger and ObservableRecipient
summary: Use the MVVM Toolkit messenger, ObservableRecipient, and NotifyPropertyChangedRecipients to run code, such as a database save, when a ViewModel property changes.
category: .NET MAUI
order: 160
gist: ed7bac37c1c65d38aedce86ba4becb5f
---

# .NET MAUI example: Handle property changes with Messenger and ObservableRecipient

This example uses the messenger of the MVVM Toolkit to handle property changes. A ViewModel that derives from `ObservableRecipient` sends a `PropertyChangedMessage` when a property with `[NotifyPropertyChangedRecipients]` changes. The same ViewModel receives the message and runs an async handler, for example a save to a database.

## Before you start

- The `CommunityToolkit.Mvvm` NuGet package.
- The `Newtonsoft.Json` NuGet package for the `JsonIgnore` attribute.

## Register the messenger

Register `WeakReferenceMessenger.Default` as the `IMessenger` service in `MauiProgram.cs`.

```csharp
// /MauiApp/ViewModels/MauiProgram

using CommunityToolkit.Mvvm.Messaging;

// ...reduced for verbosity
builder.Services.AddSingleton<IMessenger>((sp) => WeakReferenceMessenger.Default);
```

## Create the ViewModels

`Book` is an observable item. `PersonViewModel` implements `IRecipient<PropertyChangedMessage<T>>` for each property type that it sends: `string?`, `int?`, `DateTime?`, and `ObservableCollection<Book>?`. Each `Receive` method calls the same async handler.

```csharp
// /MauiApp/ViewModels/Book

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Messaging;
using Newtonsoft.Json;
using System;
using System.Threading.Tasks;

namespace MauiApp.ViewModels
{
    public partial class Book : ObservableObject
    {
        [ObservableProperty]
        private long _id; // It’s just a private field. No public property is generated.
        [ObservableProperty]
        private string author;
        [ObservableProperty]
        private string title;
        [ObservableProperty]
        private DateTime publishDate;
        [JsonIgnore]
        private int _rate;
        [JsonIgnore]
        public int Rate
        {
            get => _rate;
            set
            {
                if (_rate != value)
                {
                    _rate = value;
                    OnPropertyChanged(nameof(Rate));
                }
            }
        }
    }

    public partial class PersonViewModel : ObservableRecipient,
        IRecipient<PropertyChangedMessage<string?>>,
        IRecipient<PropertyChangedMessage<int?>>,
        IRecipient<PropertyChangedMessage<DateTime?>>,
        IRecipient<PropertyChangedMessage<ObservableCollection<Book>?>>
    {
        private readonly IMessenger _messenger;

        public PersonViewModel(IMessenger messenger)
        {
            _messenger = messenger;

            // This should be set after the relevant property is properly initialized.
            // Setting IsActive prematurely can cause contaminated property change recipients, leading to data mixing between items.
            IsActive = true; // Enables NotifyPropertyChangedRecipients
        }

        [ObservableProperty]
        [NotifyPropertyChangedRecipients]
        private string? firstname;

        [ObservableProperty]
        [NotifyPropertyChangedRecipients]
        private string? lastname;

        [ObservableProperty]
        [NotifyPropertyChangedRecipients]
        private int? age;

        [ObservableProperty]
        [NotifyPropertyChangedRecipients]
        private DateTime? dateofbirth;

        [ObservableProperty]
        [NotifyPropertyChangedRecipients]
        private ObservableCollection<Book>? _books;

        // Async handler
        private async Task DoSomethingAsync<T>(T? value)
        {
            try
            {
                await Task.Delay(500);
                Console.WriteLine($"Saved '{value}' to database.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
            }
        }

        // Messenger recipients
        public async void Receive(PropertyChangedMessage<string?> message)
            => await DoSomethingAsync(message.NewValue);

        public async void Receive(PropertyChangedMessage<int?> message)
            => await DoSomethingAsync(message.NewValue);

        public async void Receive(PropertyChangedMessage<DateTime?> message)
            => await DoSomethingAsync(message.NewValue);

        public async void Receive(PropertyChangedMessage<ObservableCollection<Book>?> message)
            => await DoSomethingAsync(message.NewValue);
    }
}
```

> **NOTE:** The comment on the `_id` field is not correct. `[ObservableProperty]` on a `_id` field generates a public `Id` property. Only a field without `[ObservableProperty]` stays private with no property.

> **WARNING:** Set `IsActive = true` only after the relevant properties have their initial values. If you set it too early, the property change recipients can get wrong values, and data from different items can mix.

## Deactivate the ViewModel on the page

Set `IsActive` to `false` in `OnDisappearing`. The ViewModel then stops receiving messages when the user leaves the page.

```csharp
// /MauiApp/Views/PersonViewPage

using MauiApp.ViewModels;

namespace MauiApp.Views
{
    public partial class PersonViewPage : ContentPage
    {
        public PersonViewPage()
        {
            InitializeComponent(PersonViewModel viewModel);
            BindingContext = viewModel;
        }

        protected override void OnDisappearing()
        {
            base.OnDisappearing();
            
            // Deactivate the view model to stop receiving messages when leaving the page
            if (BindingContext is PersonViewModel viewModel)
            {
                viewModel.IsActive = false;
            }
        }
    }
}
```

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `PersonViewPage` does not compile. | The sample puts the `PersonViewModel viewModel` parameter in the `InitializeComponent` call. | Make it a constructor parameter: `public PersonViewPage(PersonViewModel viewModel)`, then call `InitializeComponent();`. |
| `ObservableCollection` or `PropertyChangedMessage` is not found. | The `Book` file has no `using` directives for these types. | Add `using System.Collections.ObjectModel;` and `using CommunityToolkit.Mvvm.Messaging.Messages;`. |

## Related links

- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
