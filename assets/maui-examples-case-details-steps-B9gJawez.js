var e=`---
title: .NET MAUI example: Case details framework with step views
summary: Build a .NET MAUI 9 framework that lists case categories, shows the steps of a category, and opens the view of a step only when it is in progress.
category: .NET MAUI
order: 180
---

# .NET MAUI example: Case details framework with step views

This tutorial builds a case details framework for .NET MAUI 9 with the MVVM pattern and the MVVM Community Toolkit. The user selects a case category, sees the steps of that category, and opens the view of a step. The app shows a step view only when the status and the visibility of the step allow it.

## Before you start

- A .NET MAUI 9 project.

> **NOTE:** Dated (checked November 2026): .NET 9 reached the end of support on November 10, 2026. Use .NET 10 (LTS). The code in this tutorial also builds on .NET 10.

- The \`CommunityToolkit.Mvvm\` NuGet package.
- Replace \`YourNamespace\` in the samples with the namespace of your project.

## Requirements

An AI prompt gave these requirements for the framework. The samples focus on the XAML views and the framework.

- A page lists the case categories.
- When the user selects a category, the case details view shows a header section with the available steps of the category.
- Each step has its own view. When the user selects a step, the app shows the view of that step. For example, the "Select Supplier" step opens the "Select Supplier" view.
- Each step has a status: not started, in progress, finished, or canceled. Only steps that are in progress are accessible. Steps with other statuses are locked.
- Each step has a visibility indicator and a string that names the view to show for the step.
- Navigate with \`await Shell.Current.Navigation.PushAsync(new NewPage());\`. Do not use \`await Shell.Current.GoToAsync(nameof(NewPage));\`.
- Create the main page in \`CreateWindow\`. Do not set \`MainPage\` in the \`App\` constructor.

> **NOTE:** The app in this tutorial uses a \`NavigationPage\`, not a Shell. Without a Shell, \`Shell.Current\` is \`null\`. For this reason, the code-behind calls \`Navigation.PushAsync\` on the page, and the ViewModel calls it on the page of the first window (\`Application.Current!.Windows[0].Page!\`). If your app uses a Shell, \`Shell.Current.Navigation.PushAsync\` works.

The two \`App\` patterns for the last requirement:

\`\`\`csharp
// Do not use
public App()
{
    InitializeComponent();
    MainPage = new MainPage();
}
\`\`\`

\`\`\`csharp
// Use
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new MainPage());
    }
}
\`\`\`

## Define the models

Define the models for the case categories and the steps.

\`\`\`csharp
public class CaseCategory
{
    public string Name { get; set; }
    public List<CaseStep> Steps { get; set; }
}

public class CaseStep
{
    public string Name { get; set; }
    public StepStatus Status { get; set; }
    public bool IsVisible { get; set; }
    public string ViewName { get; set; }
}

public enum StepStatus
{
    NotStarted,
    InProgress,
    Finished,
    Canceled
}
\`\`\`

## Create the ViewModel

Create the ViewModel that holds the categories and the selected step. \`NavigateToStepAsync\` gets the step from the button as the command parameter and makes it the selected step. It opens the view of the step only if the step is in progress and visible. It finds the view type from the \`ViewName\` of the step and creates the page with \`Activator.CreateInstance\`.

\`\`\`csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;

public partial class CaseDetailsViewModel : ObservableObject
{
    [ObservableProperty]
    private CaseCategory selectedCategory;

    [ObservableProperty]
    private CaseStep selectedStep;

    public ObservableCollection<CaseCategory> Categories { get; set; } = new ObservableCollection<CaseCategory>();

    public CaseDetailsViewModel()
    {
        // Initialize with sample data
        Categories.Add(new CaseCategory
        {
            Name = "Category 1",
            Steps = new List<CaseStep>
            {
                new CaseStep { Name = "Select Supplier", Status = StepStatus.InProgress, IsVisible = true, ViewName = "SelectSupplierView" },
                new CaseStep { Name = "Review Contract", Status = StepStatus.NotStarted, IsVisible = true, ViewName = "ReviewContractView" }
            }
        });

        // Add more categories and steps as needed
    }

    [RelayCommand]
    private async Task NavigateToStepAsync(CaseStep? step)
    {
        if (step != null)
        {
            SelectedStep = step;
        }

        if (SelectedStep != null && SelectedStep.Status == StepStatus.InProgress && SelectedStep.IsVisible)
        {
            var viewType = Type.GetType($"YourNamespace.{SelectedStep.ViewName}");
            if (viewType != null)
            {
                var page = Activator.CreateInstance(viewType) as Page;
                if (page != null)
                {
                    await Application.Current!.Windows[0].Page!.Navigation.PushAsync(page);
                }
            }
        }
    }
}
\`\`\`

## Create the category view

1. Create \`CaseCategoriesView.xaml\`. It lists all the case categories.

   \`\`\`xml
   <?xml version="1.0" encoding="utf-8" ?>
   <ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
                xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
                x:Class="YourNamespace.CaseCategoriesView"
                Title="Case Categories">
       <CollectionView ItemsSource="{Binding Categories}"
                       SelectionMode="Single"
                       SelectionChanged="OnCategorySelected">
           <CollectionView.ItemTemplate>
               <DataTemplate>
                   <Label Text="{Binding Name}" FontSize="Large" Padding="10" />
               </DataTemplate>
           </CollectionView.ItemTemplate>
       </CollectionView>
   </ContentPage>
   \`\`\`

2. Create \`CaseCategoriesView.xaml.cs\`. The constructor sets the binding context. The \`SelectionChanged\` handler opens \`CaseDetailsView\` with a new ViewModel for the selected \`CaseCategory\`, then clears the selection.

   \`\`\`csharp
   using Microsoft.Maui.Controls;

   namespace YourNamespace
   {
       public partial class CaseCategoriesView : ContentPage
       {
           public CaseCategoriesView()
           {
               InitializeComponent();
               BindingContext = new CaseDetailsViewModel(); // Set the ViewModel
           }

           private async void OnCategorySelected(object sender, SelectionChangedEventArgs e)
           {
               if (e.CurrentSelection.FirstOrDefault() is CaseCategory selectedCategory)
               {
                   // Navigate to the CaseDetailsView and pass the selected category
                   var caseDetailsView = new CaseDetailsView
                   {
                       BindingContext = new CaseDetailsViewModel { SelectedCategory = selectedCategory }
                   };

                   await Navigation.PushAsync(caseDetailsView);
               }

               // Deselect the item
               ((CollectionView)sender).SelectedItem = null;
           }
       }
   }
   \`\`\`

## Create the case details view

1. Create \`CaseDetailsView.xaml\`. It shows the steps of the selected category. The \`Go to Step\` button is active only when the \`StepStatusToBoolConverter\` returns \`true\` for the status of the step.

   \`\`\`xml
   <?xml version="1.0" encoding="utf-8" ?>
   <ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
                xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
                x:Class="YourNamespace.CaseDetailsView"
                xmlns:viewModels="clr-namespace:YourNamespace.ViewModels"
                Title="Case Details">
       <StackLayout>
           <Label Text="{Binding SelectedCategory.Name}" FontSize="Large" Padding="10" />
           <CollectionView ItemsSource="{Binding SelectedCategory.Steps}" SelectionMode="Single" SelectedItem="{Binding SelectedStep}">
               <CollectionView.ItemTemplate>
                   <DataTemplate>
                       <StackLayout>
                           <Label Text="{Binding Name}" FontSize="Medium" Padding="10" />
                           <Label Text="{Binding Status}" FontSize="Small" Padding="10" />
                           <Button Text="Go to Step"
                                   Command="{Binding Source={RelativeSource AncestorType={x:Type viewModels:CaseDetailsViewModel}}, Path=NavigateToStepCommand}"
                                   CommandParameter="{Binding .}"
                                   IsEnabled="{Binding Status, Converter={StaticResource StepStatusToBoolConverter}}" />
                       </StackLayout>
                   </DataTemplate>
               </CollectionView.ItemTemplate>
           </CollectionView>
       </StackLayout>
   </ContentPage>
   \`\`\`

2. Create \`CaseDetailsView.xaml.cs\`. It sets a default binding context. \`OnCategorySelected\` replaces it with the ViewModel for the selected category.

   \`\`\`csharp
   public partial class CaseDetailsView : ContentPage
   {
       public CaseDetailsView()
       {
           InitializeComponent();
           BindingContext = new CaseDetailsViewModel();
       }
   }
   \`\`\`

## Create the step views

Create one view for each step. The \`ViewName\` of the step must match the class name of the view, for example \`SelectSupplierView\` and \`ReviewContractView\`.

\`SelectSupplierView.xaml\`:

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="YourNamespace.SelectSupplierView"
             Title="Select Supplier">
    <StackLayout>
        <Label Text="Select Supplier View" FontSize="Large" Padding="10" />
        <!-- Add more UI elements as needed -->
    </StackLayout>
</ContentPage>
\`\`\`

\`ReviewContractView.xaml\`:

\`\`\`xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="YourNamespace.ReviewContractView"
             Title="Review Contract">
    <StackLayout>
        <Label Text="Review Contract View" FontSize="Large" Padding="10" />
        <!-- Add more UI elements as needed -->
    </StackLayout>
</ContentPage>
\`\`\`

## Create the step status converter

Create a converter that tells if a step is accessible. It returns \`true\` only for \`StepStatus.InProgress\`.

\`\`\`csharp
using System.Globalization;

public class StepStatusToBoolConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is StepStatus status)
        {
            return status == StepStatus.InProgress;
        }
        return false;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
\`\`\`

## Register the converter

Register the converter in \`App.xaml\` or in the page that uses it.

\`\`\`xml
<Application xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:local="clr-namespace:YourNamespace"
             x:Class="YourNamespace.App">
    <Application.Resources>
        <ResourceDictionary>
            <local:StepStatusToBoolConverter x:Key="StepStatusToBoolConverter" />
        </ResourceDictionary>
    </Application.Resources>
</Application>
\`\`\`

## Set up the navigation

Make sure that \`App.xaml.cs\` creates the window with a \`NavigationPage\` around \`CaseCategoriesView\`.

\`\`\`csharp
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(new NavigationPage(new CaseCategoriesView()));
    }
}
\`\`\`

## How it works

The framework keeps the case categories and their steps in a ViewModel and shows them in XAML views. The MVVM pattern and the MVVM Community Toolkit keep the concerns separate and the code easy to maintain.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| \`viewModels:CaseDetailsViewModel\` or \`CaseDetailsViewModel\` is not found. | The samples declare no namespace for the models and the ViewModel, but \`CaseDetailsView.xaml\` uses \`YourNamespace.ViewModels\`. | Put \`CaseDetailsViewModel\` in \`YourNamespace.ViewModels\`, and add \`using YourNamespace.ViewModels;\` to the code-behind files. |
| \`Type.GetType\` returns \`null\`. | The \`ViewName\` does not match the class name, or the views are not in \`YourNamespace\`. | Make the namespace in \`NavigateToStepAsync\` and the \`ViewName\` values match the step view classes. |

## Related links

- [Maui Wizard Demo (Alex, GitHub)](https://github.com/Axemasta/MauiWizardDemo)
- [Building a Step-by-Step / Wizard Control in .NET MAUI (Redth)](https://redth.codes/building-a-step-by-step-wizard-control-in-net-maui)
`;export{e as default};