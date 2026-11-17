---
title: Blazor cheat sheet
summary: Blazor basics in one page: project setup, Razor syntax, project structure, data from the backend, layouts, event handling, and a folder structure.
category: ASP.NET and Blazor
order: 10
gist: f8c97d1d170ce8c6cd1f8ce4e62b7c64
---

# Blazor cheat sheet

This cheat sheet gives the basic Blazor syntax and patterns. Most examples come from the Blazing Pizza tutorial app.

## Project setup

| Task | Link |
| --- | --- |
| Download and install the .NET SDK | [Download and install](https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/install) |
| Create the app | [Create the app](https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/create) |

To create a new page, run this command:

```bash
dotnet new razorcomponent -n Todo -o Pages
```

Razor component file names must start with a capital letter. Open the `Pages` folder and make sure that the component file name starts with a capital letter.

To create a new class, add a `.cs` file.

## Basic syntax

| Syntax | Use |
| --- | --- |
| `@` | Starts C# code in a Razor file. |
| `@code` | Adds a block of C# code. Put the code between braces: `@code { ... }`. |
| `@page` | Identifies a component as a page and sets its route. Example: `@page "/todo"`. |
| `@bind` | Binds a C# variable to an HTML element. Give the variable name as a string in the HTML. |
| `@inject` | Injects a service into a component. Example: `@inject HttpClient HttpClient`. |
| `@layout` | Sets a layout for one page. Example: `@layout SomeOtherLayout`. |
| `<NavLink>` | A Blazor component that works like an anchor tag. It adds an `active` class when the current URL matches the link address. |
| `NavLinkMatch.All` | Makes a `NavLink` active only when it matches the full current URL, not only a prefix. |

To use a component in another component, add an element with the type name of the component. Add attributes for the component parameters.

To add a new item to a list with a property value, use `List<T>.Add`. For example, add a todo item with the user input as the title:

```csharp
List<T>.Add(new class<T> {property<T> = string<T>});
```

For more information about classes with properties, see [CSharpeNotes](https://github.com/Martian42/CSharpeNotes/wiki/Home/_edit#how-to-create-a-class-with-properties).

## Project structure

The Blazing Pizza solution has these projects:

| Project | Contents |
| --- | --- |
| `BlazingPizza.Client` | The Blazor project. It holds the UI components for the app. |
| `BlazingPizza.Server` | The ASP.NET Core project. It hosts the Blazor app and the backend services. |
| `BlazingPizza.Shared` | The shared model types for the app. |
| `BlazingPizza.ComponentsLibrary` | A library of components and helper code for the app. |

Set `BlazingPizza.Server` as the startup project.

## Get data from the backend

To get data, call an API on the backend. Blazor gives a preconfigured `HttpClient` through dependency injection. This `HttpClient` already has the correct base address.

To inject the `HttpClient` into the `Index` component, add the `@inject` directive after `@page "/"`:

```html
@page "/"
@inject HttpClient HttpClient
```

The first token (`HttpClient`) is the property type. The second token is the property name.

## Layouts

Layouts are also `.razor` components. They inherit from `LayoutComponentBase`. This class has a `Body` property that sets where the layout renders the page body. The layout component is usually in `Shared/MainLayout.razor`.

The `DefaultLayout` parameter of the `<Router>` component in `App.razor` sets the layout for all pages. To use a different layout for one page, add a directive such as `@layout SomeOtherLayout` at the top of the `.razor` page component.

## Event handling

To handle a DOM UI event, add the HTML attribute for the event. Then give the C# delegate to call.

In this example, a dialog opens when the user clicks a pizza card. In the dialog, the user customizes the pizza and adds it to the order.

1. Add fields to track the pizza that the user customizes and the dialog visibility:

   ```csharp
   List<PizzaSpecial> specials;     // The list of pizza specials
   Pizza configuringPizza;          // The pizza that the user customizes
   bool showingConfigureDialog;     // True when the dialog is visible
   ```

2. Add the method that runs when the user clicks a pizza special. `special` is the input. `Pizza` is a predefined class with the properties `Id`, `DefaultSize`, and `List<PizzaTopping>`.

   ```csharp
   void ShowConfigurePizzaDialog(PizzaSpecial special)
   {
       configuringPizza = new Pizza()
       {
           Special = special,
           SpecialId = special.Id,
           Size = Pizza.DefaultSize,
           Toppings = new List<PizzaTopping>(),
       };

       showingConfigureDialog = true;
   }
   ```

3. Assign the method to the click event. `ShowConfigurePizzaDialog(special)` is the method and `special` is the input.

   ```html
   <li @onclick="@(() => ShowConfigurePizzaDialog(special))" style="background-image: url('@special.ImageUrl')">
   ```

## List of cards with a foreach loop

```html
<div class="main">
    <ul class="pizza-cards">
        @if (specials != null)
        {
            @foreach (var special in specials)
            {
                <li style="background-image: url('@special.ImageUrl')">
                    <div class="pizza-info">
                        <span class="title">@special.Name</span>
                        @special.Description
                        <span class="price">@special.GetFormattedBasePrice()</span>
                    </div>
                </li>
            }
        }
    </ul>
</div>
```

## Folder structure inspired by the D365 AOT

This folder structure for a Blazor web app uses the Dynamics 365 (D365) Application Object Tree (AOT) as a model. It has folders for classes, forms, menus, and reusable components.

```text
/BlazorApp
│
├── /Components
│   ├── /Common
│   ├── /Layout
│   ├── /Forms
│   ├── /Controls
│   └── /Dialogs
│
├── /Data
│   ├── /Models
│   ├── /Services
│   └── /Repositories
│
├── /Pages
│   ├── /Home
│   ├── /About
│   ├── /Dashboard
│   └── /Settings
│
├── /Forms
│   ├── /CustomerForms
│   ├── /OrderForms
│   └── /ProductForms
│
├── /Classes
│   ├── /BusinessLogic
│   ├── /DataModels
│   └── /ViewModels
│
├── /Menus
│   ├── /MainMenu
│   ├── /SideMenu
│   └── /ContextMenu
│
├── /wwwroot
│   ├── /css
│   ├── /js
│   └── /images
│
├── /Shared
│   ├── /Layout
│   ├── /NavMenu.razor
│   └── /MainLayout.razor
│
├── /Properties
│
└── BlazorApp.csproj
```

## Related links

- [BlazorNote repository](https://github.com/Martian42/BlazorNote.git)
- [Blazor tutorial: Download and install](https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/install)
- [Blazor tutorial: Create the app](https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/create)
- [Comparison of Blazor, Angular, Flutter, and .NET MAUI](doc:blazor-angular-flutter-maui-comparison)
