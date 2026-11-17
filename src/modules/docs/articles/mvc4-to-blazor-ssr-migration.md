---
title: Migrate ASP.NET MVC 4 to SSR-only Blazor on .NET 10
summary: Templates, prompts, and code patterns to move an ASP.NET MVC 4 app with Kendo UI to SSR-only Blazor, MudBlazor, and a separate Web API.
category: ASP.NET and Blazor
order: 30
gist: 6df2bb072e716fab6714a7c5b6965324
---

# Migrate ASP.NET MVC 4 to SSR-only Blazor on .NET 10

This guide gives reusable templates and code patterns to migrate an ASP.NET MVC 4 web application with Kendo UI to a static server-side rendered (SSR) Blazor Web App on .NET 10. The new solution uses MudBlazor for the UI and a separate ASP.NET Core Web API. It also gives AI prompts that generate migration code for one object or for a full module.

## Before you start

| Item | Value |
| --- | --- |
| Source application | ASP.NET MVC 4 with Kendo UI for ASP.NET MVC wrappers, Razor views, controllers, view models, DTOs, services, data access layers, and client-side scripts |
| Target framework | .NET 10 (`net10.0`), C# 14 |
| UI library | `MudBlazor` 8.* |
| HTTP client | `Microsoft.Extensions.Http` 10.* |
| API validation | `FluentValidation.AspNetCore` 11.* |
| API documentation | `Swashbuckle.AspNetCore` 7.* |
| Data access | EF Core with SQL Server |
| Template version | 1.0, 2026-05-27 |

The target solution follows these rules:

- Blazor uses static SSR only. There is no WebAssembly, no Interactive Auto, and no Server interactivity.
- There is no SignalR interactivity and there are no Blazor Server circuits.
- There is no custom JavaScript, no third-party JavaScript library, and no `IJSRuntime`. The only permitted script is `_framework/blazor.web.js`.
- The API keeps the existing routes, parameter names, payload structures, and response formats. This prevents breaks in existing integrations.

> **NOTE:** Dated (checked November 2026): `FluentValidation.AspNetCore` (automatic MVC validation) is no longer maintained by the FluentValidation project. Use the `FluentValidation` package and call the validators manually. Since .NET 9, the Web API template uses `Microsoft.AspNetCore.OpenApi` (`AddOpenApi()` and `MapOpenApi()`) instead of Swashbuckle. `Swashbuckle.AspNetCore` still works. Check the current major versions of MudBlazor, FluentValidation, and Swashbuckle before you pin `8.*`, `11.*`, and `7.*`.

> **NOTE:** Verify that the MudBlazor input components (`MudTextField`, `MudSelect`, `MudSwitch`, `MudCheckBox`, `MudNumericField`) post their values in static SSR forms. MudBlazor documents most input components for interactive render modes, and this guide does not load `MudBlazor.min.js`. If a value does not post, use the Blazor input components (`InputText`, `InputSelect`, `InputCheckbox`) or plain HTML inputs with a `name` attribute.

## Migration prompt template

Give this prompt to an AI assistant to generate migration templates and conversion code. For prompts that do one type of migration only, see [Specialized prompts](#specialized-prompts).

```text
Act as a Senior ASP.NET Architect and SSR-ONLY Blazor Developer with deep expertise in:

* ASP.NET MVC 4
* ASP.NET Core / .NET 10
* SSR-only Blazor Web Apps (NO WebAssembly, NO Interactive Auto, NO Server interactivity)
* MudBlazor
* Kendo UI for ASP.NET MVC
* Client-side to server-side C# migration strategies
* Clean Architecture
* REST API design
* Enterprise modernization and legacy migration

Your task is to generate reusable migration templates and production-ready conversion patterns for migrating/recreating an existing ASP.NET MVC 4 Web Application that uses:

* Kendo UI MVC wrappers
* Client-side scripting (to be fully eliminated)
* Razor Views
* Controllers
* ViewModels
* DTOs
* Services
* Data access layers

Into a modern architecture consisting of:

1. SSR-only Blazor Web App (.NET 10)
2. Separate ASP.NET Core .NET 10 Web API
3. MudBlazor UI components
4. Clean separation of concerns

Requirements:

* SSR ONLY Blazor rendering
* No SignalR interactivity
* No Blazor Server circuits
* No WebAssembly
* No interactive render modes
* NO custom JavaScript of any kind (only the standard `_framework/blazor.web.js` is permitted)
* No third-party JS libraries
* No `IJSRuntime` usage
* Use static SSR patterns only
* Support both:

  * single object migration
  * batch migration of multiple objects/modules
* Generated code must fit into existing or newly created Blazor solutions
* Preserve existing API contract compatibility
* Match existing endpoint routes, parameter names, payload structures, and response formats to avoid breaking existing integrations
* Maintain backward compatibility whenever possible

Coding standards:

* NEVER use `var`
* Always use explicit types
* Use modern C# 14 / .NET 10 patterns
* Use async/await everywhere appropriate
* Use dependency injection
* Use nullable reference types
* Use clean architecture principles
* Use strongly typed DTOs
* Use repository/service abstraction patterns where appropriate
* Avoid code duplication
* Produce maintainable enterprise-grade code

For each migration, generate:

1. Original MVC object analysis
2. Migration strategy
3. New architecture mapping
4. Blazor component/page
5. MudBlazor replacement mapping
6. API controller
7. DTOs
8. Services
9. Validation
10. Client-side to C# SSR replacement strategy
11. Routing compatibility notes
12. Authentication/authorization considerations
13. Performance considerations
14. SSR constraints and workarounds
15. Batch migration recommendations
16. Folder/project structure
17. Full code examples

When converting Kendo UI components:

* Replace with MudBlazor equivalents where possible
* Explain unsupported feature alternatives
* Replace ALL client-side logic with pure C# server-side patterns:

  * SSR form patterns (`<EditForm>` with `FormName` and `[SupplyParameterFromForm]`)
  * Separate pages for confirmations, cascading selections, and multi-step flows
  * URL query strings and form POSTs for all state changes
  * CSS-only solutions for show/hide and visual state
  * Download endpoints for clipboard-like functionality
  * NO custom JavaScript whatsoever

Output format:

* Use clearly separated sections
* Include migration checklists
* Include architectural notes
* Include warnings for SSR-only limitations
* Include reusable templates
* Include copy-paste-ready production code

Prioritize:

* Stability
* Maintainability
* SSR compatibility
* API compatibility
* Enterprise scalability
* Low-risk incremental migration paths

You can also create specialized variants of this prompt, such as:

* "Controller-to-API migration only"
* "Kendo Grid to MudTable migration"
* "MVC Razor View to Blazor SSR component"
* "Client-side heavy page modernization to pure C# SSR"
* "Batch legacy module migration"
* "Authentication migration"
* "Report/dashboard migration"
* "CRUD scaffold migration"

Example specialization:

> Convert this ASP.NET MVC 4 Kendo Grid View into an SSR-only Blazor .NET 10 MudBlazor page with matching API endpoints, no interactive render modes, and no custom JavaScript.
```

## Architecture

### Source architecture

The ASP.NET MVC 4 application has these parts:

- Controllers with mixed UI and API logic.
- Views with Razor and Kendo UI MVC wrappers.
- View models.
- Models and DTOs.
- Services.
- Data access with EF, ADO.NET, or stored procedures.
- JavaScript and jQuery. The migration removes all of it.
- Content: CSS and Kendo themes.

### Target architecture

The solution `YourApp.sln` has these projects:

| Project | Contents | Depends on |
| --- | --- | --- |
| `YourApp.Web` | Blazor app, .NET 10, MudBlazor, static SSR only | `YourApp.Api` (over HTTP), `YourApp.Shared` |
| `YourApp.Api` | ASP.NET Core Web API, .NET 10, controllers, minimal APIs (optional) | `YourApp.Application`, `YourApp.Shared` |
| `YourApp.Shared` | DTOs and contracts | None |
| `YourApp.Application` | Services and interfaces | `YourApp.Infrastructure` |
| `YourApp.Infrastructure` | EF Core and repositories | `YourApp.Domain` |
| `YourApp.Domain` | Entities and value objects | None |

### Key principles

| Principle | Implementation |
| --- | --- |
| SSR only | Do not use `@rendermode`. Do not use `InteractiveServer`, `InteractiveWebAssembly`, or `InteractiveAuto`. |
| No SignalR | No persistent connections. Each interaction is a full HTTP request. |
| No circuits | No Blazor Server circuits. The server renders the pages and sends them as HTML. |
| Form handling | `<EditForm>` with `FormName` and `[SupplyParameterFromForm]`. |
| Navigation | Standard `<a href>` links, or `NavigationManager.NavigateTo()` with `forceLoad: true`. |
| State | URL query strings, cookies, TempData, or server-side session. |
| API communication | The Blazor pages get an `HttpClient` through DI and call the separate Web API. |

## Solution structure

### Folder layout

```text
YourApp.sln
│
├── src/
│   ├── YourApp.Domain/
│   │   ├── Entities/
│   │   │   ├── Customer.cs
│   │   │   ├── Order.cs
│   │   │   └── Product.cs
│   │   ├── ValueObjects/
│   │   ├── Enums/
│   │   ├── Exceptions/
│   │   └── Interfaces/
│   │       ├── ICustomerRepository.cs
│   │       └── IUnitOfWork.cs
│   │
│   ├── YourApp.Application/
│   │   ├── Interfaces/
│   │   │   ├── ICustomerService.cs
│   │   │   └── IOrderService.cs
│   │   ├── Services/
│   │   │   ├── CustomerService.cs
│   │   │   └── OrderService.cs
│   │   ├── Validators/
│   │   │   ├── CustomerValidator.cs
│   │   │   └── OrderValidator.cs
│   │   ├── Mappings/
│   │   │   └── MappingProfile.cs
│   │   └── DependencyInjection.cs
│   │
│   ├── YourApp.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/
│   │   │   │   └── CustomerConfiguration.cs
│   │   │   └── Migrations/
│   │   ├── Repositories/
│   │   │   ├── CustomerRepository.cs
│   │   │   └── BaseRepository.cs
│   │   ├── ExternalServices/
│   │   └── DependencyInjection.cs
│   │
│   ├── YourApp.Shared/
│   │   ├── DTOs/
│   │   │   ├── CustomerDto.cs
│   │   │   ├── CustomerCreateDto.cs
│   │   │   ├── CustomerUpdateDto.cs
│   │   │   └── PagedResultDto.cs
│   │   ├── Requests/
│   │   │   └── CustomerSearchRequest.cs
│   │   ├── Responses/
│   │   │   └── ApiResponse.cs
│   │   └── Constants/
│   │       └── ApiRoutes.cs
│   │
│   ├── YourApp.Api/
│   │   ├── Controllers/
│   │   │   ├── CustomersController.cs
│   │   │   └── OrdersController.cs
│   │   ├── Filters/
│   │   │   └── ApiExceptionFilter.cs
│   │   ├── Middleware/
│   │   ├── appsettings.json
│   │   └── Program.cs
│   │
│   └── YourApp.Web/
│       ├── Components/
│       │   ├── Layout/
│       │   │   ├── MainLayout.razor
│       │   │   ├── NavMenu.razor
│       │   │   └── MainLayout.razor.css
│       │   ├── Pages/
│       │   │   ├── Customers/
│       │   │   │   ├── Index.razor
│       │   │   │   ├── Create.razor
│       │   │   │   ├── Edit.razor
│       │   │   │   └── Details.razor
│       │   │   └── Orders/
│       │   │       └── Index.razor
│       │   ├── Shared/
│       │   │   ├── Pagination.razor
│       │   │   ├── ConfirmDialog.razor
│       │   │   └── LoadingIndicator.razor
│       │   ├── _Imports.razor
│       │   └── App.razor
│       ├── Services/
│       │   ├── ICustomerApiClient.cs
│       │   └── CustomerApiClient.cs
│       ├── wwwroot/
│       │   └── css/
│       ├── appsettings.json
│       └── Program.cs
│
└── tests/
    ├── YourApp.Application.Tests/
    ├── YourApp.Api.Tests/
    └── YourApp.Web.Tests/
```

### Project files

`YourApp.Web.csproj` (Blazor SSR app):

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MudBlazor" Version="8.*" />
    <PackageReference Include="Microsoft.Extensions.Http" Version="10.*" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\YourApp.Shared\YourApp.Shared.csproj" />
  </ItemGroup>

</Project>
```

`YourApp.Api.csproj` (Web API):

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.*" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="7.*" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\YourApp.Application\YourApp.Application.csproj" />
    <ProjectReference Include="..\YourApp.Infrastructure\YourApp.Infrastructure.csproj" />
    <ProjectReference Include="..\YourApp.Shared\YourApp.Shared.csproj" />
  </ItemGroup>

</Project>
```

### Program.cs for the Blazor SSR app

```csharp
using MudBlazor.Services;
using YourApp.Web.Components;
using YourApp.Web.Services;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add MudBlazor
builder.Services.AddMudServices();

// Add Razor Components (SSR only - no interactive modes)
builder.Services.AddRazorComponents();

// Register HttpClient for API communication
builder.Services.AddHttpClient<ICustomerApiClient, CustomerApiClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiSettings:BaseUrl"]!);
});

// Add authentication if needed
builder.Services.AddAuthentication()
    .AddCookie();
builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();

WebApplication app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

// Map Razor Components - NO interactive render modes
app.MapRazorComponents<App>();

app.Run();
```

`UseAntiforgery` must come after `UseAuthentication` and `UseAuthorization`. The `using YourApp.Web.Components;` directive makes the `App` component available to `MapRazorComponents<App>()`.

> **NOTE:** Dated (checked November 2026): Since .NET 9, the Blazor Web App template uses `app.MapStaticAssets()` instead of `app.UseStaticFiles()`. `UseStaticFiles()` still works.

### Program.cs for the Web API

```csharp
using YourApp.Application;
using YourApp.Infrastructure;
using YourApp.Api.Filters;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Clean Architecture DI registration
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// Add controllers
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ApiExceptionFilter>();
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS for Blazor app
builder.Services.AddCors(options =>
{
    options.AddPolicy("BlazorApp", policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

WebApplication app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("BlazorApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### App.razor

The root component for SSR only:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
    <link href="_content/MudBlazor/MudBlazor.min.css" rel="stylesheet" />
    <HeadOutlet />
</head>
<body>
    <Routes />
    @* Include only the standard Blazor framework script for enhanced navigation *@
    <script src="_framework/blazor.web.js" suppress-error="BL9992"></script>
</body>
</html>
```

> **IMPORTANT:** The only permitted script is `_framework/blazor.web.js`. It enables enhanced navigation and form handling. Do not add other script tags, custom JavaScript files, or third-party JavaScript libraries. Do not use MudBlazor components that need JavaScript interactivity, for example dialogs and autocomplete. Use only SSR-compatible MudBlazor components.

### _Imports.razor

`Microsoft.AspNetCore.Authorization` is necessary for `@attribute [Authorize]` in the pages.

```html
@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using Microsoft.AspNetCore.Authorization
@using Microsoft.AspNetCore.Components.Authorization
@using MudBlazor
@using YourApp.Web.Components
@using YourApp.Web.Components.Layout
@using YourApp.Web.Components.Shared
@using YourApp.Web.Services
@using YourApp.Shared.DTOs
@using YourApp.Shared.Requests
@using YourApp.Shared.Responses
```

## Migration checklist

### Before the migration

- [ ] Make a list of all MVC controllers and their actions.
- [ ] Make a list of all Razor views and their Kendo UI components.
- [ ] Make a list of all client-side dependencies (JavaScript and jQuery) to remove.
- [ ] Document all API endpoints that AJAX calls use now.
- [ ] Document the authentication and authorization scheme.
- [ ] Find the shared view models and map them to DTOs.
- [ ] Find the data access patterns (EF, ADO.NET, stored procedures).
- [ ] Document the URL routing scheme for backward compatibility.
- [ ] Find the session and state management patterns.

### During the migration

- [ ] Create the solution structure with all projects.
- [ ] Migrate the domain entities.
- [ ] Create shared DTOs that match the existing API contracts.
- [ ] Implement the infrastructure (repositories, `DbContext`).
- [ ] Implement the application services.
- [ ] Create API controllers that keep the existing routes.
- [ ] Create Blazor SSR pages with MudBlazor.
- [ ] Create API client services in the Blazor project.
- [ ] Migrate authentication and authorization.
- [ ] Replace all Kendo UI components with MudBlazor equivalents.
- [ ] Replace all client-side logic with C# SSR patterns. Custom JavaScript is not permitted.
- [ ] Implement form validation (FluentValidation and data annotations).
- [ ] Test the backward compatibility of the API.
- [ ] Test all SSR form submissions.
- [ ] Do performance tests and optimize.

### After the migration

- [ ] Make sure that all routes resolve correctly.
- [ ] Make sure that no interactive render modes are in the code.
- [ ] Make sure that there are no custom script tags. Only `_framework/blazor.web.js` is permitted.
- [ ] Make sure that the API contracts are compatible with the existing consumers.
- [ ] Do load tests.
- [ ] Do a security audit.

## Kendo UI to MudBlazor component mapping

| Kendo UI component | MudBlazor equivalent | SSR notes |
| --- | --- | --- |
| `@(Html.Kendo().Grid<T>())` | `<MudTable Items="@items">` | Server-side paging through a form post or the query string |
| `@(Html.Kendo().DropDownList())` | `<MudSelect T="string">` | Works in SSR with `<EditForm>` |
| `@(Html.Kendo().DatePicker())` | `<input type="date">` or `<MudDatePicker>` | Use the native HTML date input for full SSR compatibility |
| `@(Html.Kendo().NumericTextBox())` | `<MudNumericField T="int">` | Fully SSR compatible |
| `@(Html.Kendo().TextBox())` | `<MudTextField T="string">` | Fully SSR compatible |
| `@(Html.Kendo().TextArea())` | `<MudTextField T="string" Lines="5">` | Fully SSR compatible |
| `@(Html.Kendo().ComboBox())` | `<MudSelect T="string">` | Use a select with server-side filtering through a form post |
| `@(Html.Kendo().MultiSelect())` | `<MudSelect T="string" MultiSelection="true">` | Fully SSR compatible |
| `@(Html.Kendo().TabStrip())` | Separate pages for each tab | Use navigation links for each tab: `/orders/pending`, `/orders/completed` |
| `@(Html.Kendo().Window())` | Separate page | Go to a dedicated page for the dialog content |
| `@(Html.Kendo().Upload())` | `<MudFileUpload T="IBrowserFile">` | Use the standard `<InputFile>` in an SSR form |
| `@(Html.Kendo().Chart())` | `<MudChart>` | Static charts only in SSR |
| `@(Html.Kendo().TreeView())` | Nested `<MudList>`, expanded | Render all nodes expanded, or use a separate page for each level |
| `@(Html.Kendo().Notification())` | Query string messages or TempData | No toast in pure SSR |
| `@(Html.Kendo().Tooltip())` | `title` attribute or `<MudTooltip>` | Limited in SSR |
| `@(Html.Kendo().Scheduler())` | Custom table layout | No direct equivalent in SSR |
| `@(Html.Kendo().Editor())` | `<MudTextField Lines="10">` | Plain text only. There is no rich text editor in SSR. |
| `@(Html.Kendo().ListView())` | `<MudList>` or `@foreach` | Fully SSR compatible |
| `@(Html.Kendo().PanelBar())` | Separate sections or pages | Use links that expand or collapse through the query string: `?section=details` |
| `@(Html.Kendo().Menu())` | `<MudMenu>` or `<MudNavMenu>` | The navigation menu works in SSR |
| `@(Html.Kendo().Button())` | `<MudButton>` | Fully SSR compatible |
| `@(Html.Kendo().Switch())` | `<MudSwitch>` in a form | Submit the form to send the change |
| `@(Html.Kendo().Slider())` | `<MudNumericField>` | Use a numeric input with a form submit instead |
| `@(Html.Kendo().ProgressBar())` | `<MudProgressLinear>` | Static display only |

### SSR workarounds for UI features

| Feature | SSR workaround |
| --- | --- |
| Client-side sorting | Server-side sort through the query string: `?sort=Name&dir=asc` |
| Client-side filtering | Server-side filter through a form post or query parameters |
| Client-side paging | Server-side paging through `?page=2&pageSize=20` |
| Inline editing | A separate Edit page or a form-based inline pattern |
| Drag and drop | Not possible in pure SSR. Use up and down buttons. |
| Real-time updates | Polling with meta refresh, or manual refresh |
| Modal dialogs | A separate page, or a CSS-only modal with the `:target` selector |
| Toast notifications | A TempData message that shows on the next page load |
| Autocomplete search | A form submit for the search, with server-side filtering |
| Cascading dropdowns | A form submit that reloads the page with the filtered options |

## Migrate a controller to an API controller

### Legacy MVC controller

```csharp
// LEGACY: ASP.NET MVC 4 Controller
public class CustomerController : Controller
{
    private readonly ICustomerService _customerService;

    public CustomerController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    // GET: /Customer
    public ActionResult Index(int? page, string searchTerm)
    {
        var customers = _customerService.Search(searchTerm, page ?? 1, 20);
        ViewBag.SearchTerm = searchTerm;
        return View(customers);
    }

    // GET: /Customer/Details/5
    public ActionResult Details(int id)
    {
        var customer = _customerService.GetById(id);
        if (customer == null)
            return HttpNotFound();
        return View(customer);
    }

    // GET: /Customer/Create
    public ActionResult Create()
    {
        return View(new CustomerViewModel());
    }

    // POST: /Customer/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public ActionResult Create(CustomerViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        _customerService.Create(model);
        return RedirectToAction("Index");
    }

    // POST: /Customer/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public ActionResult Edit(int id, CustomerViewModel model)
    {
        if (!ModelState.IsValid)
            return View(model);

        _customerService.Update(id, model);
        return RedirectToAction("Index");
    }

    // POST: /Customer/Delete/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public ActionResult Delete(int id)
    {
        _customerService.Delete(id);
        return RedirectToAction("Index");
    }

    // AJAX endpoint used by Kendo Grid
    [HttpPost]
    public JsonResult GridData(DataSourceRequest request)
    {
        var result = _customerService.GetGridData(request);
        return Json(result);
    }
}
```

### Migrated API controller

The API controller keeps the legacy routes. It also keeps the Kendo Grid data endpoint for backward compatibility.

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YourApp.Application.Interfaces;
using YourApp.Shared.DTOs;
using YourApp.Shared.Requests;
using YourApp.Shared.Responses;

namespace YourApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(
        ICustomerService customerService,
        ILogger<CustomersController> logger)
    {
        _customerService = customerService;
        _logger = logger;
    }

    /// <summary>
    /// Search customers with pagination.
    /// Preserves legacy route: GET /api/customers?searchTerm=x&page=1&pageSize=20
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<CustomerDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "asc")
    {
        CustomerSearchRequest request = new()
        {
            SearchTerm = searchTerm,
            Page = page,
            PageSize = pageSize,
            SortBy = sortBy,
            SortDirection = sortDirection
        };

        PagedResultDto<CustomerDto> result = await _customerService.SearchAsync(request);

        return Ok(ApiResponse<PagedResultDto<CustomerDto>>.Success(result));
    }

    /// <summary>
    /// Get customer by ID.
    /// Preserves legacy route: GET /api/customers/5
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        CustomerDto? customer = await _customerService.GetByIdAsync(id);

        if (customer is null)
        {
            return NotFound(ApiResponse<CustomerDto>.Fail($"Customer with ID {id} not found."));
        }

        return Ok(ApiResponse<CustomerDto>.Success(customer));
    }

    /// <summary>
    /// Create a new customer.
    /// Preserves legacy route: POST /api/customers
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CustomerCreateDto dto)
    {
        CustomerDto created = await _customerService.CreateAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = created.Id },
            ApiResponse<CustomerDto>.Success(created));
    }

    /// <summary>
    /// Update an existing customer.
    /// Preserves legacy route: PUT /api/customers/5
    /// </summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateDto dto)
    {
        CustomerDto? updated = await _customerService.UpdateAsync(id, dto);

        if (updated is null)
        {
            return NotFound(ApiResponse<CustomerDto>.Fail($"Customer with ID {id} not found."));
        }

        return Ok(ApiResponse<CustomerDto>.Success(updated));
    }

    /// <summary>
    /// Delete a customer.
    /// Preserves legacy route: DELETE /api/customers/5
    /// </summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        bool deleted = await _customerService.DeleteAsync(id);

        if (!deleted)
        {
            return NotFound(ApiResponse<object>.Fail($"Customer with ID {id} not found."));
        }

        return NoContent();
    }

    /// <summary>
    /// Legacy Kendo Grid data endpoint - maintained for backward compatibility.
    /// POST /api/customers/grid-data
    /// </summary>
    [HttpPost("grid-data")]
    [ProducesResponseType(typeof(KendoDataSourceResponse<CustomerDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GridData([FromBody] KendoDataSourceRequest request)
    {
        _logger.LogInformation("Legacy Kendo grid endpoint called - consider migrating consumers");

        PagedResultDto<CustomerDto> result = await _customerService.SearchAsync(new CustomerSearchRequest
        {
            Page = request.Take > 0 ? (request.Skip / request.Take) + 1 : 1,
            PageSize = request.Take,
            SearchTerm = request.Filter?.Filters?.FirstOrDefault()?.Value?.ToString(),
            SortBy = request.Sort?.FirstOrDefault()?.Field,
            SortDirection = request.Sort?.FirstOrDefault()?.Dir
        });

        // Return in Kendo-compatible format for backward compatibility
        KendoDataSourceResponse<CustomerDto> response = new()
        {
            Data = result.Items,
            Total = result.TotalCount
        };

        return Ok(response);
    }
}
```

### Backward-compatible Kendo request and response DTOs

```csharp
namespace YourApp.Shared.Requests;

/// <summary>
/// Maintains backward compatibility with Kendo DataSource transport.read requests.
/// </summary>
public sealed class KendoDataSourceRequest
{
    public int Skip { get; set; }
    public int Take { get; set; } = 20;
    public KendoSort[]? Sort { get; set; }
    public KendoFilter? Filter { get; set; }
}

public sealed class KendoSort
{
    public string Field { get; set; } = string.Empty;
    public string Dir { get; set; } = "asc";
}

public sealed class KendoFilter
{
    public string? Logic { get; set; }
    public KendoFilterDescriptor[]? Filters { get; set; }
}

public sealed class KendoFilterDescriptor
{
    public string? Field { get; set; }
    public string? Operator { get; set; }
    public object? Value { get; set; }
}
```

```csharp
namespace YourApp.Shared.Responses;

/// <summary>
/// Kendo-compatible DataSource response format for backward compatibility.
/// </summary>
public sealed class KendoDataSourceResponse<T>
{
    public IReadOnlyList<T> Data { get; set; } = [];
    public int Total { get; set; }
    public object? AggregateResults { get; set; }
    public object? Errors { get; set; }
}
```

## Migrate a Razor view to a Blazor SSR page

### Legacy Razor view

In the legacy view, Edit used inline script navigation and Delete used an AJAX POST. The migrated page replaces both with server-side C# patterns.

```html
@model PagedList<CustomerViewModel>

@{
    ViewBag.Title = "Customers";
}

<h2>Customers</h2>

<div class="toolbar">
    @using (Html.BeginForm("Index", "Customer", FormMethod.Get))
    {
        @Html.TextBox("searchTerm", ViewBag.SearchTerm as string, new { @class = "k-textbox", placeholder = "Search..." })
        <button type="submit" class="k-button">Search</button>
    }
    @Html.ActionLink("Create New", "Create", null, new { @class = "k-button k-primary" })
</div>

@(Html.Kendo().Grid(Model)
    .Name("customerGrid")
    .Columns(columns =>
    {
        columns.Bound(c => c.Name);
        columns.Bound(c => c.Email);
        columns.Bound(c => c.Phone);
        columns.Bound(c => c.CreatedDate).Format("{0:yyyy-MM-dd}");
        columns.Command(cmd =>
        {
            cmd.Custom("Edit").Click("onEdit");
            cmd.Custom("Delete").Click("onDelete");
        });
    })
    .Pageable()
    .Sortable()
    .DataSource(ds => ds
        .Ajax()
        .Read(read => read.Action("GridData", "Customer"))
        .PageSize(20)
    )
)

@* Legacy pattern: Edit was via inline script navigation, Delete was via AJAX POST *@
@* Both are now replaced with server-side C# patterns in the migrated version below *@
```

### Migrated Blazor SSR page

```html
@page "/customers"
@attribute [Authorize]
@inject ICustomerApiClient CustomerApi
@inject NavigationManager Navigation

<PageTitle>Customers</PageTitle>

<MudText Typo="Typo.h4" Class="mb-4">Customers</MudText>

@* Search Form - plain GET form (EditForm needs a Model and is for POST) *@
<form method="get" action="/customers">
    <MudGrid Class="mb-4">
        <MudItem xs="12" md="6">
            <MudTextField T="string"
                          Name="searchTerm"
                          Value="@SearchTerm"
                          Placeholder="Search customers..."
                          Adornment="Adornment.End"
                          AdornmentIcon="@Icons.Material.Filled.Search"
                          Immediate="false" />
        </MudItem>
        <MudItem xs="12" md="6">
            <MudButton ButtonType="ButtonType.Submit"
                       Variant="Variant.Filled"
                       Color="Color.Primary"
                       Class="mr-2">
                Search
            </MudButton>
            <MudButton Href="/customers/create"
                       Variant="Variant.Filled"
                       Color="Color.Secondary">
                Create New
            </MudButton>
        </MudItem>
    </MudGrid>
</form>

@* Data Table - fully server-rendered *@
@if (PagedResult is not null)
{
    <MudTable Items="@PagedResult.Items"
              Hover="true"
              Striped="true"
              Dense="true"
              Elevation="2">
        <HeaderContent>
            <MudTh>
                <MudTableSortLabel T="CustomerDto"
                                   SortLabel="Name">
                    <a href="/customers?searchTerm=@SearchTerm&page=@Page&sortBy=Name&sortDir=@ToggleSortDir("Name")">
                        Name
                    </a>
                </MudTableSortLabel>
            </MudTh>
            <MudTh>Email</MudTh>
            <MudTh>Phone</MudTh>
            <MudTh>Created Date</MudTh>
            <MudTh>Actions</MudTh>
        </HeaderContent>
        <RowTemplate>
            <MudTd DataLabel="Name">@context.Name</MudTd>
            <MudTd DataLabel="Email">@context.Email</MudTd>
            <MudTd DataLabel="Phone">@context.Phone</MudTd>
            <MudTd DataLabel="Created Date">@context.CreatedDate.ToString("yyyy-MM-dd")</MudTd>
            <MudTd>
                <MudIconButton Href="@($"/customers/edit/{context.Id}")"
                               Icon="@Icons.Material.Filled.Edit"
                               Size="Size.Small"
                               Color="Color.Primary"
                               Title="Edit" />
                <MudIconButton Href="@($"/customers/delete/{context.Id}")"
                               Icon="@Icons.Material.Filled.Delete"
                               Size="Size.Small"
                               Color="Color.Error"
                               Title="Delete" />
            </MudTd>
        </RowTemplate>
    </MudTable>

    @* Server-side Pagination *@
    <MudGrid Class="mt-4" Justify="Justify.Center">
        <MudItem>
            @if (Page > 1)
            {
                <MudButton Href="@GetPageUrl(Page - 1)"
                           Variant="Variant.Outlined"
                           Size="Size.Small"
                           Class="mr-2">
                    Previous
                </MudButton>
            }
            <MudText Typo="Typo.body2" Class="d-inline mx-4">
                Page @Page of @TotalPages (@PagedResult.TotalCount total records)
            </MudText>
            @if (Page < TotalPages)
            {
                <MudButton Href="@GetPageUrl(Page + 1)"
                           Variant="Variant.Outlined"
                           Size="Size.Small"
                           Class="ml-2">
                    Next
                </MudButton>
            }
        </MudItem>
    </MudGrid>
}
else
{
    <MudAlert Severity="Severity.Info">No customers found.</MudAlert>
}

@* Success/Error Messages via TempData or Query String *@
@if (!string.IsNullOrEmpty(Message))
{
    <MudAlert Severity="@MessageSeverity" Class="mt-4">@Message</MudAlert>
}

@code {
    [SupplyParameterFromQuery(Name = "searchTerm")]
    public string? SearchTerm { get; set; }

    [SupplyParameterFromQuery(Name = "page")]
    public int Page { get; set; } = 1;

    [SupplyParameterFromQuery(Name = "pageSize")]
    public int PageSize { get; set; } = 20;

    [SupplyParameterFromQuery(Name = "sortBy")]
    public string? SortBy { get; set; }

    [SupplyParameterFromQuery(Name = "sortDir")]
    public string? SortDir { get; set; } = "asc";

    [SupplyParameterFromQuery(Name = "msg")]
    public string? Message { get; set; }

    [SupplyParameterFromQuery(Name = "msgType")]
    public string? MessageType { get; set; }

    private PagedResultDto<CustomerDto>? PagedResult { get; set; }
    private int TotalPages => PagedResult is not null
        ? (int)Math.Ceiling((double)PagedResult.TotalCount / PageSize)
        : 0;

    private Severity MessageSeverity => MessageType switch
    {
        "error" => Severity.Error,
        "warning" => Severity.Warning,
        _ => Severity.Success
    };

    protected override async Task OnInitializedAsync()
    {
        if (Page < 1) Page = 1;

        PagedResult = await CustomerApi.SearchAsync(
            SearchTerm, Page, PageSize, SortBy, SortDir);
    }

    private string GetPageUrl(int targetPage)
    {
        return $"/customers?searchTerm={Uri.EscapeDataString(SearchTerm ?? "")}&page={targetPage}&pageSize={PageSize}&sortBy={SortBy}&sortDir={SortDir}";
    }

    private string ToggleSortDir(string column)
    {
        if (SortBy == column && SortDir == "asc")
            return "desc";
        return "asc";
    }
}
```

The Delete button is a link to the [delete confirmation page](#delete-confirmation-page). An `OnClick` handler does not run in static SSR, and an `EditForm` without a `Model` throws an exception. For this reason, the search uses a plain GET `<form>`.

In pure SSR, a delete with confirmation needs one of these patterns:

1. A separate confirmation page (`/customers/delete/5`). It shows "Are you sure?" and sends a form POST.
2. A CSS-only modal with the `:target` pseudo-class.
3. An inline form that renders a confirmation section on the same page after a POST.

### Delete confirmation page

```html
@page "/customers/delete/{Id:int}"
@attribute [Authorize]
@inject ICustomerApiClient CustomerApi
@inject NavigationManager Navigation

<PageTitle>Confirm Delete</PageTitle>

@if (Customer is not null)
{
    <MudCard Class="mx-auto" Style="max-width: 500px;">
        <MudCardHeader>
            <MudText Typo="Typo.h5">Confirm Delete</MudText>
        </MudCardHeader>
        <MudCardContent>
            <MudAlert Severity="Severity.Warning" Class="mb-4">
                Are you sure you want to delete this customer?
            </MudAlert>
            <MudText><strong>Name:</strong> @Customer.Name</MudText>
            <MudText><strong>Email:</strong> @Customer.Email</MudText>
        </MudCardContent>
        <MudCardActions>
            <EditForm method="post" FormName="ConfirmDelete" OnValidSubmit="ExecuteDelete" Enhance>
                <AntiforgeryToken />
                <MudButton ButtonType="ButtonType.Submit"
                           Variant="Variant.Filled"
                           Color="Color.Error"
                           Class="mr-2">
                    Yes, Delete
                </MudButton>
            </EditForm>
            <MudButton Href="/customers"
                       Variant="Variant.Outlined"
                       Color="Color.Default">
                Cancel
            </MudButton>
        </MudCardActions>
    </MudCard>
}
else
{
    <MudAlert Severity="Severity.Error">Customer not found.</MudAlert>
}

@code {
    [Parameter]
    public int Id { get; set; }

    private CustomerDto? Customer { get; set; }

    protected override async Task OnInitializedAsync()
    {
        Customer = await CustomerApi.GetByIdAsync(Id);
    }

    private async Task ExecuteDelete()
    {
        bool success = await CustomerApi.DeleteAsync(Id);
        string msg = success ? "Customer deleted." : "Delete failed.";
        string msgType = success ? "success" : "error";
        Navigation.NavigateTo($"/customers?msg={Uri.EscapeDataString(msg)}&msgType={msgType}", forceLoad: true);
    }
}
```

## Migrate a Kendo Grid to a MudTable

### Reusable paginated table component

`Shared/ServerPaginatedTable.razor`:

```html
@typeparam TItem

<MudTable Items="@Items"
          Hover="true"
          Striped="true"
          Dense="@Dense"
          Elevation="@Elevation"
          Loading="@Loading"
          LoadingProgressColor="Color.Primary">
    <HeaderContent>
        @HeaderContent
    </HeaderContent>
    <RowTemplate>
        @RowTemplate(context)
    </RowTemplate>
    <NoRecordsContent>
        <MudAlert Severity="Severity.Info">@NoRecordsMessage</MudAlert>
    </NoRecordsContent>
</MudTable>

@if (TotalCount > 0)
{
    <MudGrid Class="mt-4 align-center" Justify="Justify.SpaceBetween">
        <MudItem xs="12" md="4">
            <MudText Typo="Typo.body2">
                Showing @(((CurrentPage - 1) * PageSize) + 1)-@Math.Min(CurrentPage * PageSize, TotalCount) of @TotalCount
            </MudText>
        </MudItem>
        <MudItem xs="12" md="8" Class="d-flex justify-end">
            @if (CurrentPage > 1)
            {
                <MudButton Href="@GetPageUrl(1)"
                           Variant="Variant.Text"
                           Size="Size.Small"
                           StartIcon="@Icons.Material.Filled.FirstPage">
                    First
                </MudButton>
                <MudButton Href="@GetPageUrl(CurrentPage - 1)"
                           Variant="Variant.Text"
                           Size="Size.Small"
                           StartIcon="@Icons.Material.Filled.ChevronLeft">
                    Previous
                </MudButton>
            }

            @for (int i = StartPage; i <= EndPage; i++)
            {
                int pageNum = i;
                <MudButton Href="@GetPageUrl(pageNum)"
                           Variant="@(pageNum == CurrentPage ? Variant.Filled : Variant.Text)"
                           Color="@(pageNum == CurrentPage ? Color.Primary : Color.Default)"
                           Size="Size.Small"
                           Class="mx-1">
                    @pageNum
                </MudButton>
            }

            @if (CurrentPage < TotalPages)
            {
                <MudButton Href="@GetPageUrl(CurrentPage + 1)"
                           Variant="Variant.Text"
                           Size="Size.Small"
                           EndIcon="@Icons.Material.Filled.ChevronRight">
                    Next
                </MudButton>
                <MudButton Href="@GetPageUrl(TotalPages)"
                           Variant="Variant.Text"
                           Size="Size.Small"
                           EndIcon="@Icons.Material.Filled.LastPage">
                    Last
                </MudButton>
            }
        </MudItem>
    </MudGrid>
}

@code {
    [Parameter, EditorRequired]
    public IReadOnlyList<TItem> Items { get; set; } = [];

    [Parameter, EditorRequired]
    public RenderFragment HeaderContent { get; set; } = default!;

    [Parameter, EditorRequired]
    public RenderFragment<TItem> RowTemplate { get; set; } = default!;

    [Parameter]
    public int TotalCount { get; set; }

    [Parameter]
    public int CurrentPage { get; set; } = 1;

    [Parameter]
    public int PageSize { get; set; } = 20;

    [Parameter]
    public string BaseUrl { get; set; } = "";

    [Parameter]
    public string? AdditionalQueryParams { get; set; }

    [Parameter]
    public bool Dense { get; set; } = true;

    [Parameter]
    public int Elevation { get; set; } = 2;

    [Parameter]
    public bool Loading { get; set; }

    [Parameter]
    public string NoRecordsMessage { get; set; } = "No records found.";

    [Parameter]
    public int MaxVisiblePages { get; set; } = 5;

    private int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);

    private int StartPage => Math.Max(1, CurrentPage - MaxVisiblePages / 2);
    private int EndPage => Math.Min(TotalPages, StartPage + MaxVisiblePages - 1);

    private string GetPageUrl(int page)
    {
        string url = $"{BaseUrl}?page={page}&pageSize={PageSize}";
        if (!string.IsNullOrEmpty(AdditionalQueryParams))
        {
            url += $"&{AdditionalQueryParams}";
        }
        return url;
    }
}
```

### Use the table component

```html
<ServerPaginatedTable TItem="CustomerDto"
                      Items="@PagedResult.Items"
                      TotalCount="@PagedResult.TotalCount"
                      CurrentPage="@Page"
                      PageSize="@PageSize"
                      BaseUrl="/customers"
                      AdditionalQueryParams="@($"searchTerm={SearchTerm}&sortBy={SortBy}&sortDir={SortDir}")">
    <HeaderContent>
        <MudTh><a href="@GetSortUrl("Name")">Name</a></MudTh>
        <MudTh><a href="@GetSortUrl("Email")">Email</a></MudTh>
        <MudTh>Phone</MudTh>
        <MudTh>Actions</MudTh>
    </HeaderContent>
    <RowTemplate>
        <MudTd>@context.Name</MudTd>
        <MudTd>@context.Email</MudTd>
        <MudTd>@context.Phone</MudTd>
        <MudTd>
            <MudIconButton Href="@($"/customers/edit/{context.Id}")"
                           Icon="@Icons.Material.Filled.Edit"
                           Size="Size.Small" />
        </MudTd>
    </RowTemplate>
</ServerPaginatedTable>
```

## CRUD scaffold templates

### DTOs

```csharp
namespace YourApp.Shared.DTOs;

public sealed class CustomerDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public DateTime CreatedDate { get; init; }
    public DateTime? ModifiedDate { get; init; }
    public bool IsActive { get; init; }
}

public sealed class CustomerCreateDto
{
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Address { get; init; }
}

public sealed class CustomerUpdateDto
{
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public bool IsActive { get; init; }
}

public sealed class PagedResultDto<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public bool HasNextPage => Page * PageSize < TotalCount;
    public bool HasPreviousPage => Page > 1;
}
```

### API response wrapper

```csharp
namespace YourApp.Shared.Responses;

public sealed class ApiResponse<T>
{
    public bool IsSuccess { get; init; }
    public T? Data { get; init; }
    public string? ErrorMessage { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static ApiResponse<T> Success(T data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public static ApiResponse<T> Fail(string errorMessage) => new()
    {
        IsSuccess = false,
        ErrorMessage = errorMessage
    };

    public static ApiResponse<T> Fail(IReadOnlyList<string> errors) => new()
    {
        IsSuccess = false,
        Errors = errors,
        ErrorMessage = string.Join("; ", errors)
    };
}
```

### Search request

```csharp
namespace YourApp.Shared.Requests;

public sealed class CustomerSearchRequest
{
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; } = "asc";
}
```

### Application service

The interface:

```csharp
namespace YourApp.Application.Interfaces;

public interface ICustomerService
{
    Task<PagedResultDto<CustomerDto>> SearchAsync(CustomerSearchRequest request);
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CustomerCreateDto dto);
    Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
```

The implementation:

```csharp
using YourApp.Application.Interfaces;
using YourApp.Domain.Entities;
using YourApp.Domain.Interfaces;
using YourApp.Shared.DTOs;
using YourApp.Shared.Requests;

namespace YourApp.Application.Services;

public sealed class CustomerService : ICustomerService
{
    private readonly ICustomerRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(
        ICustomerRepository repository,
        IUnitOfWork unitOfWork,
        ILogger<CustomerService> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<PagedResultDto<CustomerDto>> SearchAsync(CustomerSearchRequest request)
    {
        (IReadOnlyList<Customer> customers, int totalCount) = await _repository
            .SearchAsync(
                request.SearchTerm,
                request.Page,
                request.PageSize,
                request.SortBy,
                request.SortDirection);

        IReadOnlyList<CustomerDto> items = customers
            .Select(MapToDto)
            .ToList();

        return new PagedResultDto<CustomerDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        Customer? customer = await _repository.GetByIdAsync(id);
        return customer is not null ? MapToDto(customer) : null;
    }

    public async Task<CustomerDto> CreateAsync(CustomerCreateDto dto)
    {
        Customer customer = new()
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            CreatedDate = DateTime.UtcNow,
            IsActive = true
        };

        await _repository.AddAsync(customer);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Customer created with ID {CustomerId}", customer.Id);

        return MapToDto(customer);
    }

    public async Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto)
    {
        Customer? customer = await _repository.GetByIdAsync(id);

        if (customer is null)
        {
            return null;
        }

        customer.Name = dto.Name;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;
        customer.IsActive = dto.IsActive;
        customer.ModifiedDate = DateTime.UtcNow;

        _repository.Update(customer);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Customer updated with ID {CustomerId}", customer.Id);

        return MapToDto(customer);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        Customer? customer = await _repository.GetByIdAsync(id);

        if (customer is null)
        {
            return false;
        }

        _repository.Delete(customer);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Customer deleted with ID {CustomerId}", id);

        return true;
    }

    private static CustomerDto MapToDto(Customer customer) => new()
    {
        Id = customer.Id,
        Name = customer.Name,
        Email = customer.Email,
        Phone = customer.Phone,
        Address = customer.Address,
        CreatedDate = customer.CreatedDate,
        ModifiedDate = customer.ModifiedDate,
        IsActive = customer.IsActive
    };
}
```

### Blazor API client

This typed client is in the Web project:

```csharp
using System.Net.Http.Json;
using YourApp.Shared.DTOs;
using YourApp.Shared.Responses;

namespace YourApp.Web.Services;

public interface ICustomerApiClient
{
    Task<PagedResultDto<CustomerDto>> SearchAsync(
        string? searchTerm, int page, int pageSize, string? sortBy, string? sortDir);
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto?> CreateAsync(CustomerCreateDto dto);
    Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}

public sealed class CustomerApiClient : ICustomerApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CustomerApiClient> _logger;

    public CustomerApiClient(HttpClient httpClient, ILogger<CustomerApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<PagedResultDto<CustomerDto>> SearchAsync(
        string? searchTerm, int page, int pageSize, string? sortBy, string? sortDir)
    {
        string url = $"api/customers?page={page}&pageSize={pageSize}";

        if (!string.IsNullOrWhiteSpace(searchTerm))
            url += $"&searchTerm={Uri.EscapeDataString(searchTerm)}";
        if (!string.IsNullOrWhiteSpace(sortBy))
            url += $"&sortBy={sortBy}&sortDirection={sortDir}";

        ApiResponse<PagedResultDto<CustomerDto>>? response =
            await _httpClient.GetFromJsonAsync<ApiResponse<PagedResultDto<CustomerDto>>>(url);

        return response?.Data ?? new PagedResultDto<CustomerDto>();
    }

    public async Task<CustomerDto?> GetByIdAsync(int id)
    {
        try
        {
            ApiResponse<CustomerDto>? response =
                await _httpClient.GetFromJsonAsync<ApiResponse<CustomerDto>>($"api/customers/{id}");

            return response?.Data;
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<CustomerDto?> CreateAsync(CustomerCreateDto dto)
    {
        HttpResponseMessage response = await _httpClient.PostAsJsonAsync("api/customers", dto);

        if (response.IsSuccessStatusCode)
        {
            ApiResponse<CustomerDto>? result =
                await response.Content.ReadFromJsonAsync<ApiResponse<CustomerDto>>();
            return result?.Data;
        }

        _logger.LogWarning("Failed to create customer. Status: {StatusCode}", response.StatusCode);
        return null;
    }

    public async Task<CustomerDto?> UpdateAsync(int id, CustomerUpdateDto dto)
    {
        HttpResponseMessage response = await _httpClient.PutAsJsonAsync($"api/customers/{id}", dto);

        if (response.IsSuccessStatusCode)
        {
            ApiResponse<CustomerDto>? result =
                await response.Content.ReadFromJsonAsync<ApiResponse<CustomerDto>>();
            return result?.Data;
        }

        _logger.LogWarning("Failed to update customer {Id}. Status: {StatusCode}", id, response.StatusCode);
        return null;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        HttpResponseMessage response = await _httpClient.DeleteAsync($"api/customers/{id}");
        return response.IsSuccessStatusCode;
    }
}
```

### Create and edit page

One page handles create and edit. If the route has an `Id`, the page is in edit mode.

```html
@page "/customers/create"
@page "/customers/edit/{Id:int}"
@attribute [Authorize]
@inject ICustomerApiClient CustomerApi
@inject NavigationManager Navigation

<PageTitle>@(IsEdit ? "Edit Customer" : "Create Customer")</PageTitle>

<MudText Typo="Typo.h4" Class="mb-4">@(IsEdit ? "Edit Customer" : "Create Customer")</MudText>

<MudCard Class="mx-auto" Style="max-width: 600px;">
    <MudCardContent>
        <EditForm method="post"
                  FormName="CustomerForm"
                  Model="@FormModel"
                  OnValidSubmit="HandleSubmit"
                  Enhance>
            <DataAnnotationsValidator />
            <AntiforgeryToken />

            <MudGrid>
                <MudItem xs="12">
                    <MudTextField T="string"
                                  @bind-Value="FormModel.Name"
                                  Label="Name"
                                  Required="true"
                                  RequiredError="Name is required"
                                  For="@(() => FormModel.Name)" />
                </MudItem>

                <MudItem xs="12">
                    <MudTextField T="string"
                                  @bind-Value="FormModel.Email"
                                  Label="Email"
                                  InputType="InputType.Email"
                                  Required="true"
                                  RequiredError="Email is required"
                                  For="@(() => FormModel.Email)" />
                </MudItem>

                <MudItem xs="12" md="6">
                    <MudTextField T="string"
                                  @bind-Value="FormModel.Phone"
                                  Label="Phone"
                                  For="@(() => FormModel.Phone)" />
                </MudItem>

                <MudItem xs="12" md="6">
                    @if (IsEdit)
                    {
                        <MudSwitch T="bool"
                                   @bind-Value="FormModel.IsActive"
                                   Label="Active"
                                   Color="Color.Primary" />
                    }
                </MudItem>

                <MudItem xs="12">
                    <MudTextField T="string"
                                  @bind-Value="FormModel.Address"
                                  Label="Address"
                                  Lines="3"
                                  For="@(() => FormModel.Address)" />
                </MudItem>

                <MudItem xs="12" Class="d-flex gap-2">
                    <MudButton ButtonType="ButtonType.Submit"
                               Variant="Variant.Filled"
                               Color="Color.Primary">
                        @(IsEdit ? "Update" : "Create")
                    </MudButton>
                    <MudButton Href="/customers"
                               Variant="Variant.Outlined"
                               Color="Color.Default">
                        Cancel
                    </MudButton>
                </MudItem>
            </MudGrid>

            <ValidationSummary />
        </EditForm>
    </MudCardContent>
</MudCard>

@if (!string.IsNullOrEmpty(ErrorMessage))
{
    <MudAlert Severity="Severity.Error" Class="mt-4">@ErrorMessage</MudAlert>
}

@code {
    [Parameter]
    public int? Id { get; set; }

    [SupplyParameterFromForm(FormName = "CustomerForm")]
    public CustomerFormModel FormModel { get; set; } = new();

    private bool IsEdit => Id.HasValue;
    private string? ErrorMessage { get; set; }

    protected override async Task OnInitializedAsync()
    {
        if (IsEdit && FormModel.Name == string.Empty)
        {
            CustomerDto? existing = await CustomerApi.GetByIdAsync(Id!.Value);

            if (existing is null)
            {
                Navigation.NavigateTo("/customers?msg=Customer+not+found&msgType=error", forceLoad: true);
                return;
            }

            FormModel = new CustomerFormModel
            {
                Name = existing.Name,
                Email = existing.Email,
                Phone = existing.Phone,
                Address = existing.Address,
                IsActive = existing.IsActive
            };
        }
    }

    private async Task HandleSubmit()
    {
        if (IsEdit)
        {
            CustomerUpdateDto dto = new()
            {
                Name = FormModel.Name,
                Email = FormModel.Email,
                Phone = FormModel.Phone,
                Address = FormModel.Address,
                IsActive = FormModel.IsActive
            };

            CustomerDto? result = await CustomerApi.UpdateAsync(Id!.Value, dto);

            if (result is null)
            {
                ErrorMessage = "Failed to update customer.";
                return;
            }
        }
        else
        {
            CustomerCreateDto dto = new()
            {
                Name = FormModel.Name,
                Email = FormModel.Email,
                Phone = FormModel.Phone,
                Address = FormModel.Address
            };

            CustomerDto? result = await CustomerApi.CreateAsync(dto);

            if (result is null)
            {
                ErrorMessage = "Failed to create customer.";
                return;
            }
        }

        string msg = IsEdit ? "Customer updated successfully." : "Customer created successfully.";
        Navigation.NavigateTo($"/customers?msg={Uri.EscapeDataString(msg)}", forceLoad: true);
    }

    public sealed class CustomerFormModel
    {
        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Name is required")]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Email is required")]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Phone]
        [System.ComponentModel.DataAnnotations.StringLength(50)]
        public string? Phone { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(500)]
        public string? Address { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
```

### FluentValidation on the API

The create and update validators use the same rules.

> **NOTE:** `AddValidatorsFromAssemblyContaining` only registers the validators. No code in this guide calls them, so `ApiExceptionFilter` never gets a `ValidationException`. Inject `IValidator<CustomerCreateDto>` and `IValidator<CustomerUpdateDto>` and call `ValidateAndThrowAsync` in the service or the controller.

```csharp
using FluentValidation;
using YourApp.Shared.DTOs;

namespace YourApp.Application.Validators;

public sealed class CustomerCreateValidator : AbstractValidator<CustomerCreateDto>
{
    public CustomerCreateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(200).WithMessage("Email must not exceed 200 characters.");

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone must not exceed 50 characters.")
            .When(x => x.Phone is not null);

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address must not exceed 500 characters.")
            .When(x => x.Address is not null);
    }
}

public sealed class CustomerUpdateValidator : AbstractValidator<CustomerUpdateDto>
{
    public CustomerUpdateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(200).WithMessage("Email must not exceed 200 characters.");

        RuleFor(x => x.Phone)
            .MaximumLength(50).WithMessage("Phone must not exceed 50 characters.")
            .When(x => x.Phone is not null);

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage("Address must not exceed 500 characters.")
            .When(x => x.Address is not null);
    }
}
```

## Replace client-side logic with C#

### Common patterns

| Legacy client-side pattern | C# SSR replacement |
| --- | --- |
| `$.ajax()` / `$.get()` / `$.post()` | Server-side `HttpClient` call in `OnInitializedAsync()`, or a form POST |
| `$(selector).show()/hide()` | Conditional rendering: `@if (condition) { ... }` |
| `$(selector).addClass()/removeClass()` | A ternary in the `class` attribute: `class="@(condition ? "active" : "")"` |
| `$(selector).val()` | `@bind-Value` on form inputs |
| `$(selector).text()` / `.html()` | A Razor expression: `@variable` |
| `$(document).ready()` | `OnInitializedAsync()` |
| `confirm()` dialog | A separate confirmation page |
| `window.location.href = url` | `NavigationManager.NavigateTo(url, forceLoad: true)` |
| Dynamic DOM changes | Render again with a different state |
| `setInterval()` / `setTimeout()` | Not applicable in SSR. For polling, use `<meta http-equiv="refresh">`. |
| Event handlers (click, change, and others) | A form submit or link navigation |
| `$(selector).attr()` | Set the attribute directly in the Razor markup |
| AJAX form submit | `<EditForm>` with `method="post"` |
| Client-side validation | `DataAnnotationsValidator` and server validation |
| `$.each()` / loops | `@foreach` in Razor |
| `$(selector).append()` | Change the list on the server and render again |

### Replace an AJAX search with an SSR form

The legacy page used client-side scripts to do these tasks:

- Debounce keyup events on a search box and send AJAX GET requests to `/Customer/Search`.
- Put the returned HTML into the results grid.
- Handle delete button clicks with `confirm()` dialogs and AJAX POST requests.
- Send anti-forgery tokens manually in request headers.

The SSR page replaces all of this with server-side C# and standard HTML forms:

```html
@page "/customers"
@inject ICustomerApiClient CustomerApi

@* Search via GET form - standard HTTP *@
<form method="get" action="/customers">
    <MudGrid Class="mb-4">
        <MudItem xs="12" md="8">
            <MudTextField T="string"
                          Name="searchTerm"
                          Value="@SearchTerm"
                          Label="Search"
                          Placeholder="Type and press Enter or click Search..."
                          Adornment="Adornment.End"
                          AdornmentIcon="@Icons.Material.Filled.Search" />
        </MudItem>
        <MudItem xs="12" md="4">
            <MudButton ButtonType="ButtonType.Submit"
                       Variant="Variant.Filled"
                       Color="Color.Primary">
                Search
            </MudButton>
            @if (!string.IsNullOrEmpty(SearchTerm))
            {
                <MudButton Href="/customers"
                           Variant="Variant.Outlined"
                           Class="ml-2">
                    Clear
                </MudButton>
            }
        </MudItem>
    </MudGrid>
</form>

@if (Results is not null)
{
    <MudText Typo="Typo.body2" Class="mb-2">
        @Results.TotalCount results found
    </MudText>
    
    @* Table renders server-side *@
    <MudTable Items="@Results.Items" Hover="true" Striped="true">
        @* ... columns ... *@
    </MudTable>
}

@code {
    [SupplyParameterFromQuery(Name = "searchTerm")]
    public string? SearchTerm { get; set; }

    private PagedResultDto<CustomerDto>? Results { get; set; }

    protected override async Task OnInitializedAsync()
    {
        Results = await CustomerApi.SearchAsync(SearchTerm, 1, 20, null, null);
    }
}
```

### Delete confirmation

Use a separate confirmation page. See [Delete confirmation page](#delete-confirmation-page). A shorter version of the same page leaves out the Email line and the "Customer not found." alert.

### Copy to clipboard

Use a dedicated API endpoint that returns a download. In the API controller:

```csharp
// In the API Controller - returns plain text content for copying
[HttpGet("{id:int}/export-text")]
[ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
public async Task<IActionResult> ExportAsText(int id)
{
    CustomerDto? customer = await _customerService.GetByIdAsync(id);

    if (customer is null)
    {
        return NotFound();
    }

    string content = $"{customer.Name}\n{customer.Email}\n{customer.Phone}";
    byte[] bytes = System.Text.Encoding.UTF8.GetBytes(content);

    return File(bytes, "text/plain", $"customer-{id}.txt");
}
```

In the Blazor page, add a download link instead of a clipboard copy:

```html
@* In Blazor page - provide a download link instead of clipboard copy *@
<MudButton Href="@($"/api/customers/{CustomerId}/export-text")"
           Target="_blank"
           Variant="Variant.Outlined"
           StartIcon="@Icons.Material.Filled.ContentCopy">
    Export as Text
</MudButton>
```

### Print

Use a dedicated print-friendly page with CSS media queries. The user prints with the browser function (Ctrl+P or Cmd+P).

The page:

```html
@page "/customers/{Id:int}/print"
@layout PrintLayout
@inject ICustomerApiClient CustomerApi

<PageTitle>Print - @Customer?.Name</PageTitle>

@if (Customer is not null)
{
    <div class="print-content">
        <h2>@Customer.Name</h2>
        <table>
            <tr><td><strong>Email:</strong></td><td>@Customer.Email</td></tr>
            <tr><td><strong>Phone:</strong></td><td>@Customer.Phone</td></tr>
            <tr><td><strong>Address:</strong></td><td>@Customer.Address</td></tr>
        </table>
    </div>
}

@code {
    [Parameter]
    public int Id { get; set; }

    private CustomerDto? Customer { get; set; }

    protected override async Task OnInitializedAsync()
    {
        Customer = await CustomerApi.GetByIdAsync(Id);
    }
}
```

The minimal layout `PrintLayout.razor`. A layout renders inside the `<body>` of `App.razor`, so it does not have its own `<html>`, `<head>`, or `<body>` elements. `<HeadContent>` puts the styles in the page head through `<HeadOutlet />`.

```html
@* PrintLayout.razor - minimal layout with CSS print media query *@
@* Users use their browser's built-in Ctrl+P / Cmd+P to print *@
@inherits LayoutComponentBase

<HeadContent>
    <style>
        @@media print {
            .no-print { display: none; }
        }
        @@media screen {
            .print-instructions { 
                padding: 10px; 
                background: #f5f5f5; 
                border: 1px solid #ddd;
                margin-bottom: 20px;
            }
        }
        body { font-family: Arial, sans-serif; padding: 20px; }
    </style>
</HeadContent>

<div class="no-print print-instructions">
    <p>Use your browser's print function (Ctrl+P) to print this page.</p>
    <a href="/customers">Back to Customers</a>
</div>
@Body
```

### Cascading dropdowns

Use a form post round trip. The first form selects the category and reloads the page. The second form shows only after the page reloads with a selected category.

```html
@page "/orders/create"
@inject IOrderApiClient OrderApi
@inject NavigationManager Navigation

<PageTitle>Create Order</PageTitle>

@* Step 1: Select category via form post to reload page with products *@
<EditForm method="post" FormName="SelectCategory" Model="@CategoryModel" OnValidSubmit="LoadProducts" Enhance>
    <AntiforgeryToken />
    <MudSelect T="int" @bind-Value="CategoryModel.CategoryId" Label="Category">
        @foreach (CategoryDto cat in Categories)
        {
            <MudSelectItem T="int" Value="@cat.Id">@cat.Name</MudSelectItem>
        }
    </MudSelect>
    <MudButton ButtonType="ButtonType.Submit" Variant="Variant.Outlined" Size="Size.Small" Class="mt-2">
        Load Products
    </MudButton>
</EditForm>

@* Step 2: Only shown after category is selected and page reloads *@
@if (Products.Count > 0)
{
    <EditForm method="post" FormName="CreateOrder" Model="@OrderModel" OnValidSubmit="HandleCreate" Enhance>
        <AntiforgeryToken />
        <input type="hidden" name="OrderModel.CategoryId" value="@CategoryModel.CategoryId" />
        <MudSelect T="int" @bind-Value="OrderModel.ProductId" Label="Product">
            @foreach (ProductDto prod in Products)
            {
                <MudSelectItem T="int" Value="@prod.Id">@prod.Name</MudSelectItem>
            }
        </MudSelect>
        <MudButton ButtonType="ButtonType.Submit" Variant="Variant.Filled" Color="Color.Primary" Class="mt-4">
            Create Order
        </MudButton>
    </EditForm>
}

@code {
    [SupplyParameterFromForm(FormName = "SelectCategory")]
    public CategorySelection CategoryModel { get; set; } = new();

    [SupplyParameterFromForm(FormName = "CreateOrder")]
    public OrderCreateModel OrderModel { get; set; } = new();

    private List<CategoryDto> Categories { get; set; } = [];
    private List<ProductDto> Products { get; set; } = [];

    protected override async Task OnInitializedAsync()
    {
        Categories = await OrderApi.GetCategoriesAsync();

        if (CategoryModel.CategoryId > 0)
        {
            Products = await OrderApi.GetProductsByCategoryAsync(CategoryModel.CategoryId);
        }
    }

    private async Task LoadProducts()
    {
        Products = await OrderApi.GetProductsByCategoryAsync(CategoryModel.CategoryId);
    }

    private async Task HandleCreate()
    {
        await OrderApi.CreateOrderAsync(OrderModel);
        Navigation.NavigateTo("/orders?msg=Order+created", forceLoad: true);
    }

    public sealed class CategorySelection
    {
        public int CategoryId { get; set; }
    }

    public sealed class OrderCreateModel
    {
        public int CategoryId { get; set; }
        public int ProductId { get; set; }
    }
}
```

## Migrate authentication

This section replaces legacy Forms authentication with JWT bearer authentication on the API and cookie authentication in the Blazor app.

### Legacy web.config

```xml
<authentication mode="Forms">
  <forms loginUrl="~/Account/Login" timeout="2880" />
</authentication>
```

### JWT bearer authentication on the API

```csharp
// In YourApp.Api Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

### Cookie authentication in the Blazor app

```csharp
// In YourApp.Web Program.cs
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/account/login";
        options.LogoutPath = "/account/logout";
        options.AccessDeniedPath = "/account/access-denied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();
```

### Login page

```html
@page "/account/login"
@inject IAuthApiClient AuthApi
@inject NavigationManager Navigation
@using Microsoft.AspNetCore.Authentication
@using Microsoft.AspNetCore.Authentication.Cookies
@using System.Security.Claims

<PageTitle>Login</PageTitle>

<MudContainer MaxWidth="MaxWidth.Small">
    <MudCard Class="mt-8">
        <MudCardHeader>
            <MudText Typo="Typo.h4">Sign In</MudText>
        </MudCardHeader>
        <MudCardContent>
            <EditForm method="post"
                      FormName="LoginForm"
                      Model="@LoginModel"
                      OnValidSubmit="HandleLogin"
                      Enhance>
                <DataAnnotationsValidator />
                <AntiforgeryToken />

                @if (!string.IsNullOrEmpty(ErrorMessage))
                {
                    <MudAlert Severity="Severity.Error" Class="mb-4">@ErrorMessage</MudAlert>
                }

                <MudTextField T="string"
                              @bind-Value="LoginModel.Username"
                              Label="Username"
                              Required="true"
                              Class="mb-4" />

                <MudTextField T="string"
                              @bind-Value="LoginModel.Password"
                              Label="Password"
                              InputType="InputType.Password"
                              Required="true"
                              Class="mb-4" />

                <MudCheckBox T="bool"
                             @bind-Value="LoginModel.RememberMe"
                             Label="Remember me"
                             Class="mb-4" />

                <MudButton ButtonType="ButtonType.Submit"
                           Variant="Variant.Filled"
                           Color="Color.Primary"
                           FullWidth="true">
                    Sign In
                </MudButton>
            </EditForm>
        </MudCardContent>
    </MudCard>
</MudContainer>

@code {
    [SupplyParameterFromForm(FormName = "LoginForm")]
    public LoginFormModel LoginModel { get; set; } = new();

    [SupplyParameterFromQuery(Name = "returnUrl")]
    public string? ReturnUrl { get; set; }

    [CascadingParameter]
    public HttpContext? HttpContext { get; set; }

    private string? ErrorMessage { get; set; }

    private async Task HandleLogin()
    {
        // Call API to validate credentials
        AuthResult? result = await AuthApi.LoginAsync(LoginModel.Username, LoginModel.Password);

        if (result is null || !result.IsSuccess)
        {
            ErrorMessage = "Invalid username or password.";
            return;
        }

        // Create claims and sign in with cookie
        List<Claim> claims =
        [
            new Claim(ClaimTypes.Name, result.Username),
            new Claim(ClaimTypes.Email, result.Email ?? ""),
            new Claim(ClaimTypes.NameIdentifier, result.UserId.ToString()),
            .. result.Roles.Select(r => new Claim(ClaimTypes.Role, r))
        ];

        ClaimsIdentity identity = new(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new(identity);

        AuthenticationProperties authProperties = new()
        {
            IsPersistent = LoginModel.RememberMe,
            ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8)
        };

        await HttpContext!.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            authProperties);

        Navigation.NavigateTo(ReturnUrl ?? "/", forceLoad: true);
    }

    public sealed class LoginFormModel
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Username { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        public string Password { get; set; } = string.Empty;

        public bool RememberMe { get; set; }
    }
}
```

> **NOTE:** The page sends the user to `ReturnUrl` without a check. Make sure that `ReturnUrl` is a local URL (for example, it starts with `/` and not with `//`) to prevent an open redirect.

### Authorization in Blazor SSR pages

```html
@* Require authentication *@
@attribute [Authorize]

@* Require specific role *@
@attribute [Authorize(Roles = "Admin,Manager")]

@* Require specific policy *@
@attribute [Authorize(Policy = "CanEditCustomers")]

@* Conditional rendering based on auth state *@
<AuthorizeView>
    <Authorized>
        <MudText>Welcome, @context.User.Identity?.Name</MudText>
        <MudButton Href="/account/logout" Variant="Variant.Text">Logout</MudButton>
    </Authorized>
    <NotAuthorized>
        <MudButton Href="/account/login" Variant="Variant.Filled" Color="Color.Primary">Login</MudButton>
    </NotAuthorized>
</AuthorizeView>

@* Role-specific content *@
<AuthorizeView Roles="Admin">
    <Authorized>
        <MudButton Href="/admin" Variant="Variant.Outlined">Admin Panel</MudButton>
    </Authorized>
</AuthorizeView>
```

### Send the authentication to the API

A `DelegatingHandler` adds the authentication to each API call. Option 1 forwards the cookie. Option 2 generates a JWT. Option 2 is preferred for a separate API. The handler needs `IHttpContextAccessor`, so the registration calls `AddHttpContextAccessor()`.

```csharp
// DelegatingHandler to forward authentication to API
public sealed class AuthHeaderHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthHeaderHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        // Forward the user's cookie or generate a JWT for API calls
        HttpContext? httpContext = _httpContextAccessor.HttpContext;

        if (httpContext?.User.Identity?.IsAuthenticated == true)
        {
            // Option 1: Forward cookie
            string? cookie = httpContext.Request.Headers.Cookie;
            if (!string.IsNullOrEmpty(cookie))
            {
                request.Headers.Add("Cookie", cookie);
            }

            // Option 2: Generate JWT for API (preferred for separate API)
            // string token = await _tokenService.GenerateTokenForUser(httpContext.User);
            // request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return await base.SendAsync(request, cancellationToken);
    }
}

// Registration in Program.cs
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<AuthHeaderHandler>();
builder.Services.AddHttpClient<ICustomerApiClient, CustomerApiClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiSettings:BaseUrl"]!);
}).AddHttpMessageHandler<AuthHeaderHandler>();
```

> **NOTE:** The API in this guide uses JWT bearer authentication. A forwarded cookie authenticates only if the API also has the cookie scheme and shares the Data Protection keys with the Blazor app. With the JWT configuration above, use Option 2.

## Migrate a module in batch

### Pages in a module

Migrate the related pages of a module at the same time. For example, a customer management module has these pages:

- List and search (Index)
- Create
- Edit
- Details (view)
- Delete (confirmation)
- Import (file upload)
- Export (download)

### Migration sequence

For each module, do these steps in this order:

1. DTOs. All pages share them.
2. API endpoints. Use one controller for each module.
3. API client. Use one typed client for each module.
4. List page. This is the main entry point.
5. Create page. A form for a new entity.
6. Edit page. A form to change an existing entity.
7. Details page. A read-only view.
8. Delete pattern. Confirmation and action.
9. Import and export. File handling.

### Module registration

```csharp
// YourApp.Application/DependencyInjection.cs
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace YourApp.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Auto-register all validators
        services.AddValidatorsFromAssemblyContaining<DependencyInjection>();

        // Register services
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IProductService, ProductService>();
        // Add more module services here...

        return services;
    }
}
```

```csharp
// YourApp.Infrastructure/DependencyInjection.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace YourApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register repositories
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        // Add more repositories here...

        return services;
    }
}
```

### File upload

```html
@page "/customers/import"
@attribute [Authorize(Roles = "Admin")]
@inject ICustomerApiClient CustomerApi
@inject NavigationManager Navigation

<PageTitle>Import Customers</PageTitle>

<MudText Typo="Typo.h4" Class="mb-4">Import Customers</MudText>

<MudCard Style="max-width: 600px;">
    <MudCardContent>
        <EditForm method="post"
                  FormName="ImportForm"
                  Model="@ImportModel"
                  OnValidSubmit="HandleImport"
                  enctype="multipart/form-data"
                  Enhance>
            <AntiforgeryToken />

            <MudText Typo="Typo.body1" Class="mb-4">
                Upload a CSV file with columns: Name, Email, Phone, Address
            </MudText>

            <InputFile name="ImportModel.File" OnChange="HandleFileSelected" />

            @if (FileName is not null)
            {
                <MudText Typo="Typo.body2" Class="mt-2">
                    Selected: @FileName
                </MudText>
            }

            <MudButton ButtonType="ButtonType.Submit"
                       Variant="Variant.Filled"
                       Color="Color.Primary"
                       Disabled="@(FileName is null)"
                       Class="mt-4">
                Import
            </MudButton>
        </EditForm>

        @if (ImportResult is not null)
        {
            <MudAlert Severity="@(ImportResult.HasErrors ? Severity.Warning : Severity.Success)"
                      Class="mt-4">
                Imported: @ImportResult.SuccessCount | Failed: @ImportResult.ErrorCount
            </MudAlert>

            @if (ImportResult.Errors.Count > 0)
            {
                <MudList T="string" Dense="true">
                    @foreach (string error in ImportResult.Errors)
                    {
                        <MudListItem T="string" Icon="@Icons.Material.Filled.Error" IconColor="Color.Error">
                            @error
                        </MudListItem>
                    }
                </MudList>
            }
        }
    </MudCardContent>
</MudCard>

@code {
    [SupplyParameterFromForm(FormName = "ImportForm")]
    public ImportFormModel ImportModel { get; set; } = new();

    private string? FileName { get; set; }
    private ImportResultDto? ImportResult { get; set; }

    private void HandleFileSelected(InputFileChangeEventArgs e)
    {
        FileName = e.File.Name;
        ImportModel.File = e.File;
    }

    private async Task HandleImport()
    {
        if (ImportModel.File is null)
            return;

        using Stream stream = ImportModel.File.OpenReadStream(maxAllowedSize: 10 * 1024 * 1024);
        ImportResult = await CustomerApi.ImportFromCsvAsync(stream, ImportModel.File.Name);
    }

    public sealed class ImportFormModel
    {
        public IBrowserFile? File { get; set; }
    }
}
```

> **NOTE:** Verify the file upload in static SSR. `InputFile OnChange` is an interactive event and does not run in static SSR, so `FileName` stays `null` and `Disabled="@(FileName is null)"` keeps the Import button disabled. Remove `OnChange` and `Disabled`, and check that `[SupplyParameterFromForm]` binds `ImportModel.File` from the multipart form in your .NET version.

## SSR constraints and workarounds

### Features that pure SSR does not support

| Feature | Reason | Workaround |
| --- | --- | --- |
| Real-time updates | No WebSocket or SignalR | Manual page refresh or `<meta http-equiv="refresh">` |
| Client-side state | No component lifecycle between requests | URL query strings, cookies, TempData, server session |
| Live two-way binding | No Blazor circuits | A form submit for each state change |
| Component events (`onclick` with state) | No interactive runtime | A form POST or link navigation |
| Lazy loading of content | No client-side runtime | Load all data on the server in `OnInitializedAsync` |
| Drag and drop | No interactive runtime | Up and down reorder buttons with a form POST |
| Interactive modal dialogs | No interactive runtime | Separate confirmation pages or CSS `:target` modals |
| Animations and transitions | Limited without a runtime | CSS-only transitions, `@keyframes` |
| Instant client-side validation | No runtime | Server-side validation with `DataAnnotationsValidator` and a form repost |
| Infinite scroll | No interactive runtime | Usual pagination with page links |
| Auto-save or debounced input | No interactive runtime | A manual save button with a form POST |
| Clipboard operations | No interactive runtime | An endpoint that downloads a text file |
| Rich text editing | No interactive runtime | A plain `<MudTextField Lines="10">` text area |

### GET form for filters and search

Use a GET form when the request has no side effects.

```html
<form method="get" action="/items">
    <input type="text" name="search" value="@SearchTerm" />
    <input type="hidden" name="page" value="1" />
    <button type="submit">Search</button>
</form>
```

### POST form for changes

Use a POST form to create, update, or delete data.

```html
<EditForm method="post" FormName="CreateItem" Model="@Model" OnValidSubmit="HandleSubmit" Enhance>
    <AntiforgeryToken />
    <DataAnnotationsValidator />
    <InputText @bind-Value="Model.Name" />
    <button type="submit">Save</button>
</EditForm>

@code {
    [SupplyParameterFromForm(FormName = "CreateItem")]
    public ItemModel Model { get; set; } = new();
    
    private async Task HandleSubmit() { /* ... */ }
}
```

### Multiple forms on one page

Give each form a unique `FormName`.

```html
@* Each form needs a unique FormName *@
<EditForm method="post" FormName="SearchForm" Model="@SearchModel" OnValidSubmit="HandleSearch" Enhance>
    <AntiforgeryToken />
    @* search fields *@
</EditForm>

<EditForm method="post" FormName="DeleteForm" Model="@DeleteModel" OnValidSubmit="HandleDelete" Enhance>
    <AntiforgeryToken />
    <input type="hidden" name="DeleteModel.Id" value="@DeleteModel.Id" />
</EditForm>

@code {
    [SupplyParameterFromForm(FormName = "SearchForm")]
    public SearchModel SearchModel { get; set; } = new();
    
    [SupplyParameterFromForm(FormName = "DeleteForm")]
    public DeleteModel DeleteModel { get; set; } = new();
}
```

### Cascading dropdowns with a form post

See [Cascading dropdowns](#cascading-dropdowns). The shorter version of this pattern has no `<PageTitle>` and no model classes, and `HandleCreate` has no body.

## Performance

### SSR performance

```csharp
// 1. Response caching for read-heavy pages
@attribute [OutputCache(Duration = 60, VaryByQueryKeys = ["page", "searchTerm"])]

// 2. Streaming rendering for slow data loads
@attribute [StreamRendering]  // Works with the standard blazor.web.js framework script

// 3. Use IMemoryCache in API clients for repeated lookups
public sealed class CustomerApiClient : ICustomerApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        return await _cache.GetOrCreateAsync("categories", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            return await _httpClient.GetFromJsonAsync<List<CategoryDto>>("api/categories") ?? [];
        }) ?? [];
    }
}

// 4. Use minimal projections in queries
public async Task<IReadOnlyList<CustomerListDto>> GetListAsync()
{
    return await _context.Customers
        .AsNoTracking()
        .Select(c => new CustomerListDto
        {
            Id = c.Id,
            Name = c.Name,
            Email = c.Email
            // Don't load all columns for list views
        })
        .ToListAsync();
}
```

### API performance

```csharp
// 5. Response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// 6. Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.PermitLimit = 100;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
    });
});

// 7. Pagination enforcement
public sealed class PaginationFilter
{
    private const int MaxPageSize = 100;
    
    public int Page { get; set; } = 1;
    
    private int _pageSize = 20;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
}
```

> **NOTE:** These snippets need more registration. For output caching, call `builder.Services.AddOutputCache()` and `app.UseOutputCache()`. For compression, call `app.UseResponseCompression()`. For rate limiting, call `app.UseRateLimiter()` and add `.RequireRateLimiting("api")` to the endpoints, for example `app.MapControllers().RequireRateLimiting("api")`.

## Routing compatibility

### Keep legacy routes

```csharp
// Legacy MVC: /Customer/Index → Modern: /customers
// Legacy MVC: /Customer/Details/5 → Modern: /customers/5
// Legacy MVC: /Customer/Create → Modern: /customers/create
// Legacy MVC: /Customer/Edit/5 → Modern: /customers/edit/5

// If you need to maintain EXACT legacy URLs, add route aliases:
@page "/customers"
@page "/Customer/Index"  // Legacy route compatibility

// For the API, use attribute routing to match legacy AJAX endpoints:
[HttpPost("/Customer/GridData")]  // Matches legacy /Customer/GridData (a leading / ignores the controller route)
[HttpPost("grid-data")] // New kebab-case convention
```

### Redirect legacy URLs

Add this middleware to the Blazor app pipeline. It keeps bookmarks and SEO working for legacy MVC URLs.

```csharp
// Add to Blazor app pipeline for legacy URL support
app.Use(async (context, next) =>
{
    string path = context.Request.Path.Value ?? "";
    
    // Redirect legacy MVC routes to new routes
    Dictionary<string, string> redirects = new(StringComparer.OrdinalIgnoreCase)
    {
        ["/Customer/Index"] = "/customers",
        ["/Customer/Create"] = "/customers/create",
        ["/Customer/Details"] = "/customers",
        ["/Customer/Edit"] = "/customers/edit",
    };

    foreach ((string oldPath, string newPath) in redirects)
    {
        if (path.StartsWith(oldPath, StringComparison.OrdinalIgnoreCase))
        {
            string remainder = path[oldPath.Length..];
            context.Response.Redirect($"{newPath}{remainder}{context.Request.QueryString}", permanent: true);
            return;
        }
    }

    await next();
});
```

## Repository pattern

```csharp
// Domain/Interfaces/IRepository.cs
namespace YourApp.Domain.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Delete(T entity);
}

public interface ICustomerRepository : IRepository<Customer>
{
    Task<(IReadOnlyList<Customer> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        int page,
        int pageSize,
        string? sortBy,
        string? sortDirection,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByEmailAsync(string email, int? excludeId = null, CancellationToken cancellationToken = default);
}
```

```csharp
// Infrastructure/Repositories/BaseRepository.cs
using Microsoft.EntityFrameworkCore;
using YourApp.Domain.Interfaces;

namespace YourApp.Infrastructure.Repositories;

public abstract class BaseRepository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Context;
    protected readonly DbSet<T> DbSet;

    protected BaseRepository(AppDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync([id], cancellationToken);
    }

    public virtual async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet.AsNoTracking().ToListAsync(cancellationToken);
    }

    public virtual async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
    }

    public virtual void Update(T entity)
    {
        DbSet.Update(entity);
    }

    public virtual void Delete(T entity)
    {
        DbSet.Remove(entity);
    }
}
```

```csharp
// Infrastructure/Repositories/CustomerRepository.cs
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using YourApp.Domain.Entities;
using YourApp.Domain.Interfaces;

namespace YourApp.Infrastructure.Repositories;

public sealed class CustomerRepository : BaseRepository<Customer>, ICustomerRepository
{
    public CustomerRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<(IReadOnlyList<Customer> Items, int TotalCount)> SearchAsync(
        string? searchTerm,
        int page,
        int pageSize,
        string? sortBy,
        string? sortDirection,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Customer> query = DbSet.AsNoTracking();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            string term = searchTerm.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.Email.ToLower().Contains(term) ||
                (c.Phone != null && c.Phone.Contains(term)));
        }

        // Get total count before pagination
        int totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = ApplySort(query, sortBy, sortDirection);

        // Apply pagination
        IReadOnlyList<Customer> items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<bool> ExistsByEmailAsync(
        string email,
        int? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Customer> query = DbSet.Where(c => c.Email == email);

        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    private static IQueryable<Customer> ApplySort(
        IQueryable<Customer> query,
        string? sortBy,
        string? sortDirection)
    {
        bool descending = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        Expression<Func<Customer, object>> keySelector = sortBy?.ToLower() switch
        {
            "name" => c => c.Name,
            "email" => c => c.Email,
            "phone" => c => c.Phone ?? "",
            "createddate" => c => c.CreatedDate,
            _ => c => c.Id
        };

        return descending
            ? query.OrderByDescending(keySelector)
            : query.OrderBy(keySelector);
    }
}
```

## API exception filter

```csharp
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using YourApp.Shared.Responses;

namespace YourApp.Api.Filters;

public sealed class ApiExceptionFilter : IExceptionFilter
{
    private readonly ILogger<ApiExceptionFilter> _logger;
    private readonly IHostEnvironment _environment;

    public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public void OnException(ExceptionContext context)
    {
        switch (context.Exception)
        {
            case ValidationException validationException:
                IReadOnlyList<string> errors = validationException.Errors
                    .Select(e => e.ErrorMessage)
                    .ToList();

                context.Result = new BadRequestObjectResult(
                    ApiResponse<object>.Fail(errors));
                break;

            case KeyNotFoundException:
                context.Result = new NotFoundObjectResult(
                    ApiResponse<object>.Fail("Resource not found."));
                break;

            case UnauthorizedAccessException:
                context.Result = new UnauthorizedObjectResult(
                    ApiResponse<object>.Fail("Unauthorized."));
                break;

            default:
                _logger.LogError(context.Exception, "Unhandled exception occurred");

                string message = _environment.IsDevelopment()
                    ? context.Exception.Message
                    : "An unexpected error occurred.";

                context.Result = new ObjectResult(ApiResponse<object>.Fail(message))
                {
                    StatusCode = StatusCodes.Status500InternalServerError
                };
                break;
        }

        context.ExceptionHandled = true;
    }
}
```

## Main layout

`MainLayout.razor`:

```html
@inherits LayoutComponentBase

<MudLayout>
    <MudAppBar Elevation="1">
        <MudText Typo="Typo.h5" Class="ml-3">Your Application</MudText>
        <MudSpacer />
        <AuthorizeView>
            <Authorized>
                <MudText Typo="Typo.body2" Class="mr-4">@context.User.Identity?.Name</MudText>
                <MudButton Href="/account/logout" Variant="Variant.Text" Color="Color.Inherit">
                    Logout
                </MudButton>
            </Authorized>
            <NotAuthorized>
                <MudButton Href="/account/login" Variant="Variant.Text" Color="Color.Inherit">
                    Login
                </MudButton>
            </NotAuthorized>
        </AuthorizeView>
    </MudAppBar>

    <MudDrawer Open="true" Elevation="2" Variant="DrawerVariant.Mini">
        <MudNavMenu>
            <MudNavLink Href="/" Icon="@Icons.Material.Filled.Home">Home</MudNavLink>
            <MudNavLink Href="/customers" Icon="@Icons.Material.Filled.People">Customers</MudNavLink>
            <MudNavLink Href="/orders" Icon="@Icons.Material.Filled.ShoppingCart">Orders</MudNavLink>
            <MudNavLink Href="/products" Icon="@Icons.Material.Filled.Inventory">Products</MudNavLink>
            <AuthorizeView Roles="Admin">
                <Authorized>
                    <MudNavLink Href="/admin" Icon="@Icons.Material.Filled.AdminPanelSettings">Admin</MudNavLink>
                </Authorized>
            </AuthorizeView>
        </MudNavMenu>
    </MudDrawer>

    <MudMainContent Class="pt-16 px-4">
        <MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="py-4">
            @Body
        </MudContainer>
    </MudMainContent>
</MudLayout>

<MudThemeProvider />
```

## Specialized prompts

Use these prompts for one type of migration. Give the prompt to the AI assistant with the legacy code.

### Controller to API migration only

```text
Convert this ASP.NET MVC 4 Controller into an ASP.NET Core .NET 10 Web API Controller.
Preserve all route patterns, HTTP verbs, parameter names, and response formats.
Include backward-compatible endpoints for any AJAX/Kendo DataSource calls.
Use explicit types (no var), async/await, dependency injection, and FluentValidation.
Generate matching DTOs, request/response models, and service interfaces.
```

### Kendo Grid to MudTable migration

```text
Convert this Kendo Grid (with server-side DataSource) into an SSR-only MudTable in Blazor .NET 10.
Replace all client-side sorting/filtering/paging with server-side equivalents using URL query parameters.
Replace column commands (Edit/Delete buttons) with MudIconButton links and form-based delete.
Replace toolbar search with a GET form.
No interactive render modes. No SignalR. Pure SSR.
Generate the matching API endpoint that returns PagedResultDto.
```

### MVC Razor view to Blazor SSR component

```text
Convert this ASP.NET MVC 4 Razor View (.cshtml) into a Blazor SSR .razor page for .NET 10.
Replace all @Html.* helpers with MudBlazor components.
Replace all @using (Html.BeginForm()) with <EditForm method="post">.
Replace ViewBag/ViewData with [SupplyParameterFromQuery] and [SupplyParameterFromForm].
Replace @Html.ActionLink with <a href> or <MudButton Href>.
Replace @Html.Partial with component references.
Map the ViewModel to a DTO and create an API client service.
```

### Legacy client-side page modernization

```text
Analyze this ASP.NET MVC 4 page with heavy client-side logic.
Identify all interactions and categorize them:
1. Can be replaced with SSR form patterns (form submit, links)
2. Can be replaced with CSS-only solutions (show/hide, tabs)
3. Can be replaced with separate pages (confirm dialogs, cascading dropdowns)
4. Cannot be replicated in SSR (real-time updates, drag-drop) - provide server-side alternatives

Generate the SSR-only Blazor .NET 10 page with MudBlazor.
Rewrite ALL client-side logic as C# server-side code.
Eliminate all client-side dependencies entirely.
The ONLY script allowed is the standard _framework/blazor.web.js.
```

### Batch legacy module migration

```text
Migrate this entire module (List/Create/Edit/Details/Delete pages) from ASP.NET MVC 4 to:
- SSR-only Blazor .NET 10 pages with MudBlazor
- ASP.NET Core .NET 10 API Controller
- Shared DTOs
- Application service
- Repository interface
- FluentValidation validators
- API client for Blazor project

Generate all files needed for a complete working module.
Follow clean architecture. Use explicit types. No var. Async/await throughout.
Include proper folder paths for each file.
```

### Authentication migration

```text
Convert this ASP.NET MVC 4 Forms Authentication system to:
- Cookie authentication in Blazor SSR (.NET 10)
- JWT Bearer authentication for the Web API
- Login/Logout/Register Blazor SSR pages with MudBlazor
- Role-based authorization
- AuthHeaderHandler for API calls from Blazor

Pure SSR. No interactive render modes. No SignalR.
```

### Report and dashboard migration

```text
Convert this ASP.NET MVC 4 dashboard/report page (using Kendo Charts/Grids) into:
- SSR-only Blazor .NET 10 page with MudBlazor
- MudChart for simple charts (static rendering)
- MudTable for data grids
- Server-side date range filtering via GET form
- Export to CSV/Excel endpoint

No client-side interactivity. Static charts only.
For complex charts that MudChart cannot handle, suggest a server-side image generation approach.
```

### CRUD scaffold migration

```text
Given this entity/table definition, generate a complete CRUD module:
- Domain entity
- EF Core configuration
- Repository interface and implementation
- Application service interface and implementation
- DTOs (List, Detail, Create, Update)
- FluentValidation validators
- API Controller with all CRUD endpoints
- Blazor SSR pages: List (with search/pagination), Create, Edit, Details, Delete confirmation
- MudBlazor UI components
- API client service for Blazor

All SSR-only. No var. Explicit types. Clean architecture.
```

### Model migration only

```text
Convert this ASP.NET MVC 4 Model (domain entity / EF model) into a modern .NET 10 domain entity following clean architecture principles.

Requirements:
- Use explicit types (NEVER use var)
- Use nullable reference types
- Use modern C# 14 / .NET 10 patterns (records for immutable data, init-only setters where appropriate)
- Separate domain entity from persistence concerns
- Generate matching EF Core entity configuration (IEntityTypeConfiguration<T>)
- Generate corresponding DTOs (List, Detail, Create, Update) in the Shared project
- Include data annotations where appropriate on DTOs
- Include value objects for complex properties if applicable
- Include domain validation logic in the entity itself
- Preserve all existing property names and types for backward compatibility
- Document any breaking changes or type mismatches

Output:
1. Domain entity (YourApp.Domain/Entities/)
2. EF Core configuration (YourApp.Infrastructure/Data/Configurations/)
3. DTOs - List, Detail, Create, Update (YourApp.Shared/DTOs/)
4. Mapping extension methods or profile
5. Migration notes for any schema differences

Coding standards:
- No var
- Nullable reference types enabled
- Use sealed classes where inheritance is not needed
- Use required keyword for mandatory properties in DTOs
- Use init-only setters for immutable DTO properties
```

### View migration only

```text
Convert this ASP.NET MVC 4 Razor View (.cshtml) into an SSR-only Blazor .NET 10 .razor page.

Requirements:
- Replace ALL @Html.* helpers with MudBlazor components or native HTML
- Replace @using (Html.BeginForm()) with <EditForm method="post" FormName="..." Enhance>
- Replace @Html.TextBoxFor / @Html.EditorFor with <MudTextField> or <InputText>
- Replace @Html.DropDownListFor with <MudSelect> or <InputSelect>
- Replace @Html.ValidationMessageFor with <ValidationMessage For="...">
- Replace @Html.ActionLink with <a href="..."> or <MudButton Href="...">
- Replace @Html.Partial / @Html.RenderPartial with component references
- Replace @Html.AntiForgeryToken() with <AntiforgeryToken />
- Replace ViewBag/ViewData/TempData usage with [SupplyParameterFromQuery] or [SupplyParameterFromForm]
- Replace @section Scripts {} - ELIMINATE completely (no custom JS allowed)
- Replace @model with proper @code block with parameters and API client calls
- Replace @Scripts.Render / @Styles.Render with proper <link> in App.razor

Kendo UI specific replacements:
- @(Html.Kendo().Grid<T>()) → <MudTable Items="@items"> with server-side pagination
- @(Html.Kendo().DropDownList()) → <MudSelect T="string">
- @(Html.Kendo().DatePicker()) → <input type="date"> or <MudDatePicker>
- @(Html.Kendo().Window()) → Separate page navigation
- @(Html.Kendo().TabStrip()) → Separate pages per tab with nav links
- @(Html.Kendo().Upload()) → <InputFile> in an EditForm

Eliminate ALL JavaScript:
- Replace jQuery selectors and DOM manipulation with conditional Razor rendering
- Replace AJAX calls with server-side HttpClient calls in OnInitializedAsync()
- Replace client-side validation with DataAnnotationsValidator
- Replace confirm() dialogs with separate confirmation pages
- Replace dynamic show/hide with @if blocks

Output:
1. Blazor .razor page file (YourApp.Web/Components/Pages/)
2. Required @code block with all parameters and methods
3. List of MudBlazor components used
4. Any required API endpoints that must exist
5. Notes on SSR limitations encountered and workarounds applied

Pure SSR. No @rendermode. No @onclick with state. No IJSRuntime. No custom scripts.
```

### Class and service migration only

```text
Convert this ASP.NET MVC 4 class (service, utility, business logic) into a modern .NET 10 implementation following clean architecture.

Requirements:
- Use explicit types (NEVER use var)
- Use async/await for all I/O operations
- Use dependency injection (constructor injection)
- Use interface-based abstractions
- Use nullable reference types
- Use CancellationToken parameters on async methods
- Use ILogger<T> for logging (replace any legacy logging)
- Use modern exception handling patterns
- Separate interface from implementation
- Place interface in YourApp.Application/Interfaces/
- Place implementation in YourApp.Application/Services/ (or YourApp.Infrastructure/ if it has external dependencies)
- Register in DI container via extension method

Modernization rules:
- Replace static helper calls with injected services
- Replace HttpContext.Current with IHttpContextAccessor (if needed)
- Replace ConfigurationManager with IOptions<T> or IConfiguration
- Replace manual object mapping with explicit mapping methods
- Replace synchronous database calls with async equivalents
- Replace try-catch-log-rethrow with proper exception handling strategy
- Replace string concatenation for queries with parameterized queries
- Ensure thread safety for any shared state

Output:
1. Interface definition (YourApp.Application/Interfaces/)
2. Implementation class (YourApp.Application/Services/ or YourApp.Infrastructure/)
3. DI registration code
4. Any required configuration classes (IOptions<T> pattern)
5. Unit test skeleton
6. Migration notes (breaking changes, behavioral differences)

Coding standards:
- No var
- Sealed classes where inheritance is not needed
- Expression-bodied members where appropriate
- Pattern matching where it improves readability
- Guard clauses at method entry points
```

### Controller migration only

```text
Convert this ASP.NET MVC 4 Controller into BOTH:
1. An ASP.NET Core .NET 10 Web API Controller (YourApp.Api)
2. A Blazor SSR API Client service (YourApp.Web/Services/)

Requirements for API Controller:
- Use [ApiController] attribute
- Use [Route("api/[controller]")] convention
- Preserve all existing route patterns for backward compatibility
- Include legacy route aliases where the URL pattern differs
- Use async Task<IActionResult> for all actions
- Use [FromQuery], [FromBody], [FromRoute] explicitly
- Use ProducesResponseType attributes for Swagger documentation
- Use ApiResponse<T> wrapper for all responses
- Include proper HTTP status codes (200, 201, 204, 400, 404, 409)
- Use [Authorize] with appropriate roles/policies
- Include cancellation token support
- Separate read (GET) from write (POST/PUT/DELETE) concerns
- Convert any JsonResult / AJAX endpoints to proper API endpoints
- Convert Kendo DataSource endpoints to standard paged list endpoints with backward-compatible format

Requirements for Blazor API Client:
- Create typed HttpClient service (interface + implementation)
- Match all API endpoints with strongly-typed methods
- Use proper error handling (try-catch HttpRequestException)
- Use System.Net.Http.Json extensions
- Log warnings on non-success status codes
- Return null or empty defaults on 404 (not exceptions)
- Register in DI with AddHttpClient<TInterface, TImplementation>

Output:
1. API Controller (YourApp.Api/Controllers/)
2. API Client Interface (YourApp.Web/Services/I{Entity}ApiClient.cs)
3. API Client Implementation (YourApp.Web/Services/{Entity}ApiClient.cs)
4. Required DTOs if not already defined
5. DI registration code for both API and Web projects
6. Route compatibility mapping table (old route → new route)
7. Swagger/OpenAPI annotations

No var. Explicit types. Async/await. Clean architecture.
```

### Helper class migration only

```text
Convert this ASP.NET MVC 4 Helper class (HtmlHelper extensions, utility methods, static helpers) into modern .NET 10 equivalents for SSR-only Blazor.

Requirements:
- Identify the purpose of each helper method and determine the appropriate replacement:

For HtmlHelper extensions (@Html.MyCustomHelper()):
- Convert to Blazor components (.razor files) in YourApp.Web/Components/Shared/
- Use [Parameter] attributes for inputs instead of method parameters
- Use RenderFragment for content/template parameters
- Use @typeparam for generic helpers

For JavaScript/jQuery helpers:
- ELIMINATE entirely
- Replace with C# server-side logic in @code blocks
- Replace DOM manipulation with conditional Razor rendering (@if, @foreach)
- Replace AJAX calls with HttpClient service calls

For static utility/extension methods:
- Convert to injectable services if they have dependencies
- Keep as static extension methods if they are pure functions with no dependencies
- Move to YourApp.Application/Extensions/ or YourApp.Shared/Extensions/
- Use explicit types, nullable reference types

For URL/routing helpers:
- Replace with NavigationManager or simple string interpolation
- Use LinkGenerator if generating URLs in services

For formatting/display helpers:
- Convert to Blazor components for complex formatting
- Use simple inline expressions for basic formatting (@item.Date.ToString("yyyy-MM-dd"))
- Create extension methods for reusable formatting logic

For validation helpers:
- Move to FluentValidation validators (API-side)
- Use DataAnnotations on DTOs (shared)
- Use DataAnnotationsValidator in Blazor EditForms

For security/encoding helpers:
- Use built-in .NET 10 equivalents (HtmlEncoder, UrlEncoder, etc.)
- Blazor auto-encodes output by default - remove manual encoding

Output:
1. Blazor component replacements (YourApp.Web/Components/Shared/)
2. Extension method classes (YourApp.Shared/Extensions/ or YourApp.Application/Extensions/)
3. Injectable service replacements with interface + implementation
4. DI registration code
5. Migration mapping table (old helper → new equivalent)
6. List of eliminated helpers (no longer needed in Blazor/modern .NET)
7. Usage examples showing before/after

Coding standards:
- No var
- Sealed classes
- Static classes for pure extension methods
- Nullable reference types
- XML documentation on public APIs
- No custom JavaScript of any kind
```

## SSR rules

### Do

- Use `<EditForm method="post">` with `FormName` for all changes.
- Use `[SupplyParameterFromQuery]` for state in the URL.
- Use `[SupplyParameterFromForm]` to bind form data.
- Use `<AntiforgeryToken />` in each POST form.
- Use `NavigationManager.NavigateTo(url, forceLoad: true)` to redirect after a change.
- Use `OnInitializedAsync()` to load data from the API.
- Use typed `HttpClient` services to call the API.
- Use `<a href="...">` for navigation links.
- Use `@attribute [Authorize]` for protected pages.
- Use `@attribute [OutputCache]` for pages that you can cache.
- Use TempData or query strings for flash messages.

### Do not

- Do not use `@rendermode InteractiveServer`.
- Do not use `@rendermode InteractiveWebAssembly`.
- Do not use `@rendermode InteractiveAuto`.
- Do not use `@onclick` handlers that change state. They do not fire in SSR.
- Do not use `StateHasChanged()`. There is no live rendering.
- Do not use `IJSRuntime`. Custom JavaScript is not permitted.
- Do not add `<script>` tags other than `_framework/blazor.web.js`.
- Do not refer to third-party JavaScript libraries. This includes `MudBlazor.min.js`.
- Do not use `NavigationManager.NavigateTo()` without `forceLoad: true`.
- Do not use component lifecycle events other than `OnInitializedAsync`.
- Do not use `CascadingValue` for mutable state across requests.
- Do not use `EventCallback` for parent-child communication in SSR. Use form posts.
- Do not use `Timer` or background tasks in components.

## Effort estimate

| Component type | Complexity | Estimated effort for each instance |
| --- | --- | --- |
| Simple CRUD controller to API | Low | 2-4 hours |
| Simple Razor view to Blazor SSR | Low | 1-3 hours |
| Kendo Grid (server-side) to MudTable | Medium | 3-5 hours |
| Kendo Grid (client-side) to MudTable | Medium-High | 4-8 hours |
| Page with much client-side interaction | High | 8-16 hours |
| Dashboard with charts | Medium-High | 6-12 hours |
| File upload and download | Low-Medium | 2-4 hours |
| Authentication system | High | 8-16 hours |
| Complete CRUD module (5 pages) | Medium | 8-16 hours |
| Complex search with multiple filters | Medium | 4-8 hours |

## Related links

- [Blazor cheat sheet](doc:blazor-cheatsheet)
- [Build dynamic modals with the Kendo UI Window](doc:kendo-ui-dynamic-modals)
- [Create API documentation for ASP.NET Web API in .NET Framework 4.x](doc:aspnet-web-api-help-pages)
