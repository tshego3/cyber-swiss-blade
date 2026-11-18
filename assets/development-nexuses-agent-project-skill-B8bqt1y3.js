var e=`---
title: Agent project skill for .NET 10 Blazor SSR
summary: The logic and architecture skill file for AI coding agents: layer rules, delivery skills, code patterns, 4-branch state management, and tests.
category: Reference
order: 60
---

# Agent project skill for .NET 10 Blazor SSR

This article is the content of the logic and architecture skill file that AI coding agents (GitHub Copilot and Google AntiGravity) read. The file is \`.agents/skills/project-expert.md\`. Put a copy or a symbolic link of it under \`.github/skills/\`. The folder layout and the setup are in [Agent global rules](doc:development-nexuses-agent-global-rules), and the UI rules are in [Agent design system](doc:development-nexuses-agent-design-system).

The file tells what an AI coding agent must do well in this repository.

> **IMPORTANT:** The rules have 3 enforcement levels. The [top 5 non-negotiables](#top-5-non-negotiables) are **MUST** rules: a violation is a blocker. The rules in the other sections are **SHOULD** rules: follow them unless a documented exception applies. Inline suggestions ("prefer", "consider") are **MAY** rules: use your judgment.

## Top 5 non-negotiables

When the agent processes a feature request, these rules have absolute priority:

1. **4-branch rendering (Interactive Server only).** Each Interactive Server component that loads data asynchronously must render exactly 4 states in this order: Loading → Error → Data → Empty. See [Gold standard state management](#gold-standard-state-management-for-interactive-server-components). SSR-only pages use the 2-branch pattern (HasData / Empty) with try/catch error handling.
2. **\`[Authorize]\` on all data controllers.** There are no exceptions. A missing attribute is a production blocker.
3. **Layer boundaries.** Never bypass the Clean Architecture layers. The UI never references Domain or Application directly.
4. **Domain type ownership.** All entity, DTO, and record types live in \`Domain\`. Do not make duplicates in other layers.
5. **SSR-only by default.** Pages use no \`@rendermode\`, no SignalR, and no custom JS, unless Interactive Server is justified. A new greenfield feature can use Interactive Server only if it needs real-time UI updates or sub-second feedback that form POST round-trips cannot give. Examples: real-time data grids with inline editing, collaborative editing, live dashboards. Write the justification in a code comment.

All other rules in this file give more detail about these principles.


> **NOTE:** Verify the rules for layer boundaries and Domain type ownership together. If the UI never references Domain, it cannot use the Domain DTOs and records. Decide if Presentation can reference Domain types (DTOs and records only) and make the rules agree.

## Architecture overview

The project uses **Clean Architecture** with strict layer boundaries. Each layer can reference only the layers **below** it:

\`\`\`text
Domain (entities, pure logic) - NO dependencies
    ↑
Application (CQRS, DTOs, validation) - references Domain
    ↑
Infrastructure (EF, services) - references Domain + Application
    ↑
API (controllers, auth) - references all above; creates MediatR requests
    ↑
Presentation (Blazor, pages) - HTTP calls to API **ONLY** - never references Application/Domain
    ↑
Tests (xUnit, InMemory DB) - mirrors Application structure
\`\`\`

**Golden rule:** Never bypass a layer. Business logic stays in Domain and Application. The UI never contains logic.

**Domain type rule:** Never create entity, DTO, or record types outside \`Domain\`. Define all shared types (entities, classes, value objects) in Domain. Reference them directly from each layer that needs them. Do not make local copies in Presentation, API, or other layers.

For a full procedure to add a new entity, see the feature guide documentation.

## Core delivery skills

1. Implement full vertical features across Presentation, Application, Domain, Infrastructure, and tests.
2. Work with Blazor Web App SSR (default) and Interactive Server components (greenfield features only). Do not break auth, antiforgery, or routing. Interactive Server is justified only if the feature needs real-time UI updates or sub-second feedback that form POST round-trips cannot give (for example, collaborative editing, live dashboards, inline grid editing).
3. Use dependency injection consistently: registrations in Program.cs and constructor injection.
4. Build reliable HTTP integrations with typed clients, delegating handlers, and centralized error handling.
5. Keep the architecture clean. Keep the boundaries between domain logic, infrastructure, and UI.
6. Apply the project design system consistently with MudBlazor and the brand configuration from appsettings.
7. Do a mandatory compliance pass before completion. Make sure that the changes agree with \`.github/copilot-instructions.md\`, the related \`.github/skills/\` guidance, and the applicable standards in \`docs/\`.

## Blazor SSR interaction skills

1. Know the difference between SSR-only pages and interactive pages. Select the correct render mode.
2. Use controller POST endpoints for cookie sign-in and sign-out, where the code must write headers.
3. Use antiforgery correctly for all form posts that change state.
4. Handle route authorization with Authorize attributes and route-level redirect patterns.
5. Do not add interactive behavior where server-rendered behavior is necessary.
6. **Select the correct rendering pattern for the page type.** For Interactive Server, see [Gold standard state management](#gold-standard-state-management-for-interactive-server-components) for the full specification and examples. SSR-only pages use the 2-branch pattern (HasData / Empty) with try/catch error handling in \`OnInitializedAsync\`.

## Authentication and security skills

1. Implement cookie-based authentication flows with explicit login and logout endpoints.
2. Keep the secure defaults: HttpOnly cookies, a correct SameSite policy, HSTS in production, and secure headers.
3. Keep the privacy, crawler shield, and compliance behavior when you change middleware.
4. Make sure that anonymous users cannot open protected pages. Redirect them safely to the login page.
5. Keep the privacy-consent workflows (for example, login, then privacy, then dashboard) without bypass paths.

## Data and domain skills

1. Add and change domain entities. Do not let infrastructure concerns go into domain classes.
2. Extend repository implementations. Keep the repository contracts.
3. Keep DTO mapping and API access isolated in the infrastructure and application layers.
4. Use output caching intentionally. Invalidate by tag when necessary.

## UI and design system skills

1. Make layouts that look premium and enterprise-grade, not generic dashboard boilerplate.
2. Follow the no-line sectioning rule: use tonal surfaces, not compositions with many 1 px borders.
3. Align the typography with the Public Sans hierarchy and high-density data readability.
4. Read brand colors from the configuration. Do not hard-code colors that drift from the design system.
5. Do not use scoped \`.razor.css\` files or \`<style>\` blocks in \`.razor\` components for styling. Use the MudBlazor component API and the global baseline styles only.
6. Do not hard-code colors in \`.razor\` or \`.cs\` files. Use \`BrandingConfig\` and the MudBlazor theme variables (\`var(--mud-palette-*)\`).
7. Read the [MudBlazor documentation](https://mudblazor.com/docs/overview) first. Use native props, variants, density, and theming before custom style logic.
8. For new components, keep the view and the logic in different files: \`.razor\` and \`.razor.cs\` code-behind.
9. Keep the control flow flat. Do not use deeply nested syntax. Use guard clauses with early returns.
10. **Select the correct rendering pattern for async data by page type.** Interactive Server uses the 4-branch gold standard pattern (Loading → Error → Data → Empty). SSR-only pages use the 2-branch pattern (HasData / Empty).

For the full design system specification (color tokens, typography scale, spacing, elevation, component styles), see \`.agents/skills/design-system.md\` ([Agent design system](doc:development-nexuses-agent-design-system)).

## Quality and maintenance skills

1. Build after each important change. Fix compiler and analyzer errors before you finish.
2. Add or update tests when behavior changes, especially for the auth flow, controllers, and repository behavior.
3. Keep edits minimal, scoped, and in the same style as the nearby code.
4. Do not do unrelated refactors while you implement the requested changes.
5. Treat compile-time warnings as errors. Fix the warnings that you add before completion.
6. Use explicit types and return types in implementation code. Use implicit typing only if the code stays clear.
7. Use \`async Task\` or \`async Task<T>\`, not \`async void\`. Use \`async void\` only for event handlers that the framework requires.
8. Use generics for reusable, type-safe abstractions. Do not duplicate type-specific implementations when a constrained generic design is applicable.
9. Keep implementations simple and direct. Do not use complex designs when a direct approach is sufficient.
10. Use direct, descriptive, and consistent names in the full codebase.
11. Apply DRY: use and extend related functionality that exists before you add a duplicate path.
12. Make sure that each failure shows a descriptive, user-safe reason and a clear next step (for example, retry, refresh, or contact support). Do not show generic error text.
13. If code is hard to understand without comments, make the implementation simpler first. Use comments for context, not to explain complexity that you can prevent.
14. Use low-boilerplate implementations: small methods, small diffs, and direct control flow that give high impact with minimal code.
15. Keep logging short and useful. Log the intent, the result, and failures with structured properties. Do not write long multi-line logging blocks when one clear statement is sufficient.
16. Use small helper methods or constants again for repeated error text or repeated computation. This keeps feature methods easy to read.

## Typical skill applications

1. Implement the login, privacy consent, and conditional logout flow from end to end.
2. Add dashboard widgets and list pages with the repository and service patterns that exist.
3. Add new domain entities and connect them through the repository, DI, and UI layers.
4. Apply white-label design updates from appsettings and the design token guidance.

## Reliability, testability, and data modeling skills

1. Follow the NASA JPL Power of 10 style constraints: simple control flow, deterministic loops, bounded function size, and explicit handling of return values.
2. Apply the 2 AM production rules: exceptions with context, defensive structured logging, guard clauses, idempotency, and mandatory timeouts.
3. Pass \`CancellationToken\` through async paths. Do not use empty \`catch {}\` blocks.
4. Use constructor injection for services and handlers. Do not use a service locator (\`IServiceProvider\`) in application code. Exception: Blazor components use \`[Inject]\` property injection because the framework requires it (see [Gold standard state management](#gold-standard-state-management-for-interactive-server-components)).
5. Use composition, not inheritance. Seal classes by default, unless explicit extensibility is necessary.
6. Use records for DTOs, events, and value objects. Use classes for DI services and I/O logic.
7. Keep records immutable. Use \`with\` expressions for changes, and use value equality in tests.
8. Use test builders and AutoFixture patterns for resilient tests and stable constructor changes.
9. For immutable Domain records that forms use, put the default or empty construction on the record (for example, \`CreateEmpty()\`). Call that factory from UI pages. Do not write local model builders in pages.

## Practical development patterns

### Domain entity pattern

\`\`\`csharp
// Domain/Entities/Product.cs: no dependencies, pure logic
public class Product : AuditableEntity
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Domain guard clauses (pure logic, testable without EF)
    public bool IsAvailable() => IsActive && Price > 0;
}
\`\`\`

### CQRS command pattern

Put the command, the handler, and the validator in one file.

\`\`\`csharp
// Application/Features/Products/Commands/CreateProduct/CreateProductCommand.cs
// Command + Handler + Validator all in ONE file

public sealed class CreateProductCommand : IRequest<Result<Guid>>
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
}

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(c => c.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters.");

        RuleFor(c => c.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero.");
    }
}

public sealed class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateProductCommandHandler> _logger;

    public CreateProductCommandHandler(
        IApplicationDbContext context,
        ILogger<CreateProductCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(
        CreateProductCommand request, CancellationToken cancellationToken)
    {
        Product product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System" // Should come from ICurrentUserService in real code
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Product {ProductId} created.", product.Id);
        return Result<Guid>.Success(product.Id);
    }
}
\`\`\`

### API controller pattern

Each data controller must have the \`[Authorize]\` attribute.

\`\`\`csharp
// Controllers/ProductsController.cs: MUST have [Authorize]
[Authorize]  // REQUIRED: all data controllers must be authorized
[Route("api/[controller]")]
[ApiController]
public class ProductsController : BaseApiController
{
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> Create(CreateProductCommand command)
    {
        Result<Guid> result = await Mediator.Send(command);
        return result.Succeeded
            ? CreatedAtAction(nameof(GetById), new { id = result.Data }, result.Data)
            : BadRequest(result.Errors);
    }

    [HttpGet]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Client, VaryByQueryKeys = ["*"])]
    public async Task<ActionResult<PaginatedList<ProductBriefDto>>> GetAll(
        [FromQuery] GetAllProductsQuery query)
    {
        PaginatedList<ProductBriefDto> result = await Mediator.Send(query);
        return Ok(result);
    }
}
\`\`\`

> **NOTE:** \`CreatedAtAction(nameof(GetById), ...)\` needs a \`GetById\` action on the same controller. This article does not show it. Add a \`GetById(Guid id)\` action that returns \`ProductDetailDto\`, to match \`ProductApiClient.GetByIdAsync\`.

### Typed API client pattern

\`\`\`csharp
// Presentation/Services/ProductApiClient.cs
public class ProductApiClient : BaseApiClient
{
    public ProductApiClient(HttpClient httpClient, ILogger<ProductApiClient> logger)
        : base(httpClient, logger) { }

    public Task<PaginatedList<ProductBriefDto>?> GetAllAsync(int pageNumber = 1, int pageSize = 10) =>
        GetAsync<PaginatedList<ProductBriefDto>>(
            $"api/products{BuildQueryString(new() { 
                ["pageNumber"] = pageNumber.ToString(), 
                ["pageSize"] = pageSize.ToString() 
            })}");

    public Task<ProductDetailDto?> GetByIdAsync(Guid id) =>
        GetAsync<ProductDetailDto>($"api/products/{id}");

    public Task<bool> CreateAsync(CreateProductRequest model) =>
        PostAsync("api/products", model);

    public Task<bool> UpdateAsync(UpdateProductRequest model) =>
        PutAsync($"api/products/{model.Id}", model);

    public Task<bool> DeleteAsync(Guid id) =>
        DeleteAsync($"api/products/{id}");
}
\`\`\`

### Interactive Server page pattern with 4-branch state management

> **NOTE:** This pattern applies **only** to pages and components that use \`@rendermode InteractiveServer\`. An SSR-only page gets its data one time in \`OnInitializedAsync\` and does not render again on the client. It renders one time after \`OnInitializedAsync\` completes, and it cannot use event callbacks such as \`OnClick\` or \`@bind-Value\`.

The **4-branch rendering pattern** is mandatory for Interactive Server components that load data asynchronously: Loading → Error → Data → Empty. The pattern gives consistent UX feedback and clear error recovery, and it prevents visual jank.

| Branch | State | What it shows |
| --- | --- | --- |
| 1 | Loading | A progress indicator while the page gets data from the API. |
| 2 | Error | A user-safe error message with a "Try Again" button. |
| 3 | Data | The table or content, only when the data is not empty. |
| 4 | Empty | A helpful message when no results match the filters or no data exists. |

The page template:

\`\`\`html
@* Presentation/Components/Pages/Products.razor: Interactive Server (requires @rendermode) *@
@page "/products"
@rendermode InteractiveServer
@attribute [Authorize]
@inject ProductApiClient ApiClient
@inject ILogger<Products> Logger

<PageTitle>Products</PageTitle>

<div style="display: flex; flex-direction: column; gap: 16px;">
    <MudText Typo="Typo.h5">Products</MudText>

    @if (Loading)
    {
        <!-- Branch 1: Loading State: Show progress while fetching -->
        <MudProgressCircular Indeterminate="true" />
    }
    else if (HasError)
    {
        <!-- Branch 2: Error State: Show error with retry -->
        <MudAlert Severity="Severity.Error" Icon="@Icons.Material.Filled.ErrorOutline">
            <MudStack Row="false" Spacing="2">
                <MudText Typo="Typo.body2">@ErrorMessage</MudText>
                <MudButton Variant="Variant.Text" Size="Size.Small" Color="Color.Error" OnClick="RefreshAsync">
                    Try Again
                </MudButton>
            </MudStack>
        </MudAlert>
    }
    else if (_products.Any())
    {
        <!-- Branch 3: Data State: Show table with controls -->
        <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
            <MudTextField @bind-Value="_searchText" Placeholder="Search by name..." 
                Variant="Variant.Outlined" Margin="Margin.Dense" 
                Adornment="Adornment.End" AdornmentIcon="@Icons.Material.Filled.Search" 
                Style="flex: 0 1 300px;" />
            <MudButton Variant="Variant.Text" Size="Size.Small" OnClick="ResetSearch">
                Clear
            </MudButton>
            <MudSpacer />
            <MudButton Variant="Variant.Filled" Color="Color.Primary" 
                StartIcon="@Icons.Material.Filled.Add" Size="Size.Small"
                href="/products/create">
                New Product
            </MudButton>
        </div>

        <MudTable Items="@FilteredProducts" Hover="true" Breakpoint="Breakpoint.Sm">
            <HeaderContent>
                <MudTh>Name</MudTh>
                <MudTh>Description</MudTh>
                <MudTh Style="text-align: right;">Actions</MudTh>
            </HeaderContent>
            <RowTemplate>
                <MudTd DataLabel="Name">@context.Name</MudTd>
                <MudTd DataLabel="Description">@context.Description</MudTd>
                <MudTd DataLabel="Actions" Style="text-align: right;">
                    <MudButton Variant="Variant.Text" Color="Color.Primary" Size="Size.Small"
                        href="@($"/products/{context.Id}")">
                        View
                    </MudButton>
                </MudTd>
            </RowTemplate>
            <NoRecordsContent>
                <MudText Typo="Typo.body2">No products match your search.</MudText>
            </NoRecordsContent>
        </MudTable>

    }
    else
    {
        <!-- Branch 4: Empty State: Show helpful message -->
        <MudAlert Severity="Severity.Info" Icon="@Icons.Material.Filled.Info">
            <MudStack Row="false" Spacing="2">
                <MudText>No products found.</MudText>
                <MudText Typo="Typo.body2">
                    @if (!string.IsNullOrEmpty(_searchText))
                    {
                        <span>Try adjusting your search filters or <MudLink Href="javascript:void(0)" OnClick="ResetSearch">clear all filters</MudLink>.</span>
                    }
                    else
                    {
                        <span>Create your first product to get started.</span>
                    }
                </MudText>
                <MudButton Variant="Variant.Filled" Color="Color.Primary" 
                    StartIcon="@Icons.Material.Filled.Add" Size="Size.Small"
                    href="/products/create">
                    Create Product
                </MudButton>
            </MudStack>
        </MudAlert>
    }
</div>
\`\`\`

> **NOTE:** The \`View\` link uses the route \`/products/{id}\`. Make sure that it matches the \`@page\` route of your details page.

The code-behind with the state management:

\`\`\`csharp
// Presentation/Components/Pages/Products.razor.cs: code-behind with state management
using Microsoft.AspNetCore.Authorization;

public partial class Products
{
    private List<ProductBriefDto> _products = new();
    private string _searchText = string.Empty;
    
    public bool Loading { get; set; } = true;
    public bool HasError { get; set; }
    public string? ErrorMessage { get; set; }

    public IEnumerable<ProductBriefDto> FilteredProducts =>
        _products
            .Where(p => string.IsNullOrEmpty(_searchText) || 
                        p.Name.Contains(_searchText, StringComparison.OrdinalIgnoreCase))
            .ToList();

    protected override async Task OnInitializedAsync()
    {
        try
        {
            Loading = true;
            HasError = false;
            ErrorMessage = null;
            
            PaginatedList<ProductBriefDto>? result = await ApiClient.GetAllAsync();
            _products = result?.Items ?? new List<ProductBriefDto>();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to load products");
            HasError = true;
            ErrorMessage = "Failed to load products. Please try again.";
            _products = new List<ProductBriefDto>();
        }
        finally
        {
            Loading = false;
        }
    }

    private void ResetSearch()
    {
        _searchText = string.Empty;
    }

    private async Task RefreshAsync()
    {
        await OnInitializedAsync();
    }
}
\`\`\`

## Gold standard state management for Interactive Server components

> **NOTE:** This section applies **only** to pages and components that use \`@rendermode InteractiveServer\`. An SSR-only page gets its data one time in \`OnInitializedAsync\` and does not render again on the client. Thus users never see a Loading state on an SSR-only page, and the page cannot use event callbacks.

The gold standard state management is a consistent, production-grade pattern for Interactive Server Blazor components that get and show data. It gives predictable behavior, clear error handling, and a reliable user experience in the full application.

### State structure checklist

Each component that uses the 4-branch pattern must include these parts:

\`\`\`csharp
public partial class YourComponentName
{
    // ============ INJECTED DEPENDENCIES ============
    [Inject] public YourApiClient ApiClient { get; set; } = null!;
    [Inject] public ILogger<YourComponentName> Logger { get; set; } = null!;

    // ============ PRIVATE FIELDS (Data Storage) ============
    // Raw data from API: never displayed directly
    private List<YourDto> _data = new();
    
    // User input for filtering/searching
    private string _searchText = string.Empty;
    private string? _selectedCategory = null;

    // ============ PUBLIC PROPERTIES (State) ============
    // THREE MANDATORY STATE FLAGS
    public bool Loading { get; set; } = true;
    public bool HasError { get; set; }
    public string? ErrorMessage { get; set; }

    // ============ COMPUTED PROPERTIES (Derived State) ============
    // Always recalculate: never cache these
    public IEnumerable<YourDto> FilteredData =>
        _data
            .Where(item => ApplySearchFilter(item))
            .Where(item => ApplyStatusFilter(item))
            .ToList();

    public int ResultCount => FilteredData.Count();
    public bool HasSourceData => _data.Any();

    // ============ LIFECYCLE ============
    protected override async Task OnInitializedAsync()
    {
        await LoadDataAsync();
    }

    // ============ PRIVATE METHODS (Internal Logic) ============
    private async Task LoadDataAsync()
    {
        try
        {
            // Reset state before fetch
            Loading = true;
            HasError = false;
            ErrorMessage = null;

            // Fetch from API
            PaginatedList<YourDto>? result = await ApiClient.GetAsync();
            _data = result?.Items ?? new List<YourDto>();

            Logger.LogInformation("Loaded {Count} items.", _data.Count);
        }
        catch (HttpRequestException ex)
        {
            HasError = true;
            ErrorMessage = "Network error. Please check your connection and try again.";
            Logger.LogError(ex, "Network error loading data");
            _data = new List<YourDto>();
        }
        catch (Exception ex)
        {
            HasError = true;
            ErrorMessage = "Failed to load data. Please try again or contact support.";
            Logger.LogError(ex, "Unexpected error loading data");
            _data = new List<YourDto>();
        }
        finally
        {
            Loading = false;
        }
    }

    private bool ApplySearchFilter(YourDto item) =>
        string.IsNullOrEmpty(_searchText) ||
        item.Name.Contains(_searchText, StringComparison.OrdinalIgnoreCase) ||
        item.Description?.Contains(_searchText, StringComparison.OrdinalIgnoreCase) == true;

    private bool ApplyStatusFilter(YourDto item) =>
        _selectedCategory == null || item.Category == _selectedCategory;

    private void ResetFilters()
    {
        _searchText = string.Empty;
        _selectedCategory = null;
        HasError = false;
        ErrorMessage = null;
    }

    private void ClearSearch()
    {
        _searchText = string.Empty;
    }

    // ============ PUBLIC METHODS (User Actions) ============
    public async Task RefreshAsync()
    {
        await LoadDataAsync();
    }
}
\`\`\`

### Razor template with 4-branch rendering

Always check the states in this order: Loading → Error → Data → Empty. This template adds a category filter, a result counter, and a status column to the page pattern above.

\`\`\`html
@* Always check in this exact order: Loading → Error → Data → Empty *@

@if (Loading)
{
    <!-- BRANCH 1: LOADING STATE -->
    <MudProgressCircular Indeterminate="true" />
}
else if (HasError)
{
    <!-- BRANCH 2: ERROR STATE -->
    <MudAlert Severity="Severity.Error" Icon="@Icons.Material.Filled.ErrorOutline">
        <MudStack Row="false" Spacing="2">
            <MudText Typo="Typo.body2">@ErrorMessage</MudText>
            <MudButton Variant="Variant.Text" Size="Size.Small" Color="Color.Error" OnClick="RefreshAsync">
                <MudIcon Icon="@Icons.Material.Filled.Refresh" Size="Size.Small" />
                Try Again
            </MudButton>
        </MudStack>
    </MudAlert>
}
else if (HasSourceData)
{
    <!-- BRANCH 3: DATA STATE: Controls + Table + Results -->
    
    <!-- Toolbar with Search, Filters, Actions -->
    <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center; flex-wrap: wrap;">
        <MudTextField @bind-Value="_searchText" Placeholder="Search..." 
            Variant="Variant.Outlined" Margin="Margin.Dense" 
            Adornment="Adornment.End" AdornmentIcon="@Icons.Material.Filled.Search" 
            Class="flex-grow-1" />
        
        <MudSelect @bind-Value="_selectedCategory" Label="Category" 
            Variant="Variant.Outlined" Margin="Margin.Dense" 
            Dense="true" Style="min-width: 200px;" ClearButton="true">
            <MudSelectItem Value="@((string?)null)">All</MudSelectItem>
            <MudSelectItem Value="Active">Active</MudSelectItem>
            <MudSelectItem Value="Archived">Archived</MudSelectItem>
        </MudSelect>

        <MudSpacer />

        <div style="display: flex; gap: 8px;">
            <MudButton Variant="Variant.Text" Size="Size.Small" OnClick="ClearSearch">
                Clear Filters
            </MudButton>
            <MudButton Variant="Variant.Filled" Color="Color.Primary" 
                StartIcon="@Icons.Material.Filled.Add" Size="Size.Small"
                href="/your-component/create">
                New Item
            </MudButton>
        </div>
    </div>

    <!-- Results Counter -->
    <MudText Typo="Typo.caption" Class="mb-3">
        Showing @ResultCount result@(ResultCount != 1 ? "s" : "")
    </MudText>

    <!-- Data Table -->
    <MudTable Items="@FilteredData" Hover="true" Breakpoint="Breakpoint.Sm" Dense="true">
        <HeaderContent>
            <MudTh>Name</MudTh>
            <MudTh>Category</MudTh>
            <MudTh>Status</MudTh>
            <MudTh Style="text-align: right;">Actions</MudTh>
        </HeaderContent>
        <RowTemplate>
            <MudTd DataLabel="Name">@context.Name</MudTd>
            <MudTd DataLabel="Category">@context.Category</MudTd>
            <MudTd DataLabel="Status">
                <MudChip Variant="Variant.Text" Color="@GetStatusColor(context)">
                    @context.Status
                </MudChip>
            </MudTd>
            <MudTd DataLabel="Actions" Style="text-align: right;">
                <MudButton Variant="Variant.Text" Color="Color.Primary" Size="Size.Small"
                    href="@GetDetailUrl(context)">
                    View
                </MudButton>
            </MudTd>
        </RowTemplate>
        <NoRecordsContent>
            <MudText Typo="Typo.body2">No results match your filters.</MudText>
            <MudButton Variant="Variant.Text" Size="Size.Small" OnClick="ResetFilters">Clear All Filters</MudButton>
        </NoRecordsContent>
    </MudTable>
}
else
{
    <!-- BRANCH 4: EMPTY STATE -->
    <MudAlert Severity="Severity.Info" Icon="@Icons.Material.Filled.Info">
        <MudStack Row="false" Spacing="2">
            <MudText Typo="Typo.body2">
                @if (!string.IsNullOrEmpty(_searchText) || _selectedCategory != null)
                {
                    <span>No results match your filters.</span>
                }
                else
                {
                    <span>No items yet.</span>
                }
            </MudText>
            <MudText Typo="Typo.caption">
                @if (!string.IsNullOrEmpty(_searchText))
                {
                    <span>Try clearing your search or filters to see all items.</span>
                }
                else
                {
                    <span>Create your first item to get started.</span>
                }
            </MudText>
            @if (!string.IsNullOrEmpty(_searchText) || _selectedCategory != null)
            {
                <MudButton Variant="Variant.Text" Size="Size.Small" Color="Color.Info" OnClick="ResetFilters">
                    Clear All Filters
                </MudButton>
            }
            else
            {
                <MudButton Variant="Variant.Filled" Color="Color.Primary" 
                    StartIcon="@Icons.Material.Filled.Add" Size="Size.Small"
                    href="/your-component/create">
                    Create Item
                </MudButton>
            }
        </MudStack>
    </MudAlert>
}
\`\`\`

> **NOTE:** The template calls \`GetStatusColor(context)\` and \`GetDetailUrl(context)\`. The sample does not define them. Add these 2 methods to the code-behind: one returns a MudBlazor \`Color\` for the status, and one returns the detail page route.

### Gold standard rules checklist

When you implement state management, apply these non-negotiable rules:

1. **Initialization**
   - Set \`Loading = true\` at the start of \`OnInitializedAsync\`.
   - Set \`Loading = false\` **only in the finally block**. This makes sure that the flag is always set, also after an error.
   - Initialize all fields to safe defaults (empty collections, null strings).
2. **Error handling**
   - Use **3 error levels**: Network (\`HttpRequestException\`), Business (known exceptions), and Unexpected (catch-all). The sample shows the network and unexpected levels. Add a \`catch\` block for your known business exceptions before the catch-all block.
   - **Always set a user-safe error message.** Never show stack traces or internal details.
   - Log all errors with \`ILogger.LogError()\` and the exception, as the global rules require.
   - Show a "Try Again" button in the error state.
3. **Computed properties**
   - Make all filter and search results computed properties (not cached). They calculate again on each render.
   - Use \`@if (HasSourceData)\` to select the data branch. Do not select it from the filtered rows (\`FilteredData.Any()\`). If a filter has zero matches, the table shows \`NoRecordsContent\`, so the user can clear the filters.
   - Never cache computed results in fields. Always derive them from the source data.
4. **State branches, in this exact order**
   1. \`@if (Loading)\`: show the spinner.
   2. \`@else if (HasError)\`: show the error and the retry button.
   3. \`@else if (HasSourceData)\`: show the table and the controls.
   4. \`@else\`: show the empty state and guidance.
5. **Filtering and search**
   - Keep user input in **private fields** (\`_searchText\`, \`_selectedCategory\`).
   - Put the filter logic in **private methods** that return \`bool\` (pure functions).
   - Show the filter state in the UI (for example, "Showing X results" and a "Clear Filters" button).
   - Show contextual guidance in the empty state when filters are active.
6. **User actions**
   - Supply \`ResetFilters()\` to clear all filters and the error state.
   - Supply \`ClearSearch()\` for the search field.
   - Supply \`RefreshAsync()\` for a data reload that the user starts.
   - Show the result count when the page shows data.
7. **Dependency injection**
   - Inject \`ApiClient\` as an \`[Inject]\` property. Blazor components do not support constructor injection.
   - Inject \`ILogger<T>\` for diagnostics.
   - Inject \`NavigationManager\` only if the component needs it for routing.
8. **Private and public members**
   - **Private:** raw data (\`_data\`), user input (\`_searchText\`), and internal methods.
   - **Public:** state flags (\`Loading\`, \`HasError\`, \`ErrorMessage\`) and computed results (\`FilteredData\`).
   - Computed properties have no public setters. They are read-only.
9. **Null safety**
   - Always initialize collections to \`new()\`. Never leave them null.
   - Use \`?? new List<T>()\` when the API returns null.
   - Check \`string.IsNullOrEmpty()\` before the UI shows user input.
10. **Performance**
    - Do not call \`StateHasChanged()\`. Let Blazor do the rendering automatically.
    - Keep the component-level state minimal. Move shared state to a parent component or a service.
    - Use the \`@key\` directive only for large dynamic lists (tables with many rows).

### Anti-patterns to avoid

| Do not | Do this |
| --- | --- |
| Show \`_data\` directly in the template. | Use the \`FilteredData\` computed property. |
| Set \`Loading = false\` in more than one place. | Use try/catch/finally. |
| Keep the API result in a property that changes unexpectedly. | Use a consistent data flow. |
| Catch exceptions silently without logging. | Always log errors. |
| Show raw error messages to users. | Change them into safe messages that tell the user what to do. |
| Render without a check of \`Loading\`, \`HasError\`, or \`HasSourceData\`. | Always use the 4 branches. |
| Mix filter logic into the template. | Keep LINQ in the code-behind. |
| Forget to initialize the state flags to safe defaults. | Expect that the first load is always in the Loading state. |
| Hard-code retry logic. | Show a "Try Again" button in the error state. |
| Use \`OnAfterRender\` for the initial data load. | Use \`OnInitializedAsync\` only. |

### Test the gold standard state management

\`\`\`csharp
[Fact]
public async Task OnInitializedAsync_WithSuccessfulApiCall_PopulatesDataAndSetsLoadingFalse()
{
    // Arrange
    Mock<YourApiClient> mockClient = new Mock<YourApiClient>();
    Mock<ILogger<YourComponent>> mockLogger = new Mock<ILogger<YourComponent>>();
    mockClient.Setup(c => c.GetAsync())
        .ReturnsAsync(new PaginatedList<YourDto> { Items = new() { new YourDto { Name = "Test" } } });

    YourComponent component = new YourComponent
    {
        ApiClient = mockClient.Object,
        Logger = mockLogger.Object
    };

    // Act
    await component.RefreshAsync();

    // Assert
    component.Loading.Should().BeFalse();
    component.HasError.Should().BeFalse();
    component.ResultCount.Should().Be(1);
    mockClient.Verify(c => c.GetAsync(), Times.Once);
}

[Fact]
public async Task OnInitializedAsync_WithApiException_SetsErrorMessageAndLoggingError()
{
    // Arrange
    Mock<YourApiClient> mockClient = new Mock<YourApiClient>();
    Mock<ILogger<YourComponent>> mockLogger = new Mock<ILogger<YourComponent>>();
    mockClient.Setup(c => c.GetAsync())
        .ThrowsAsync(new HttpRequestException("Network failed"));

    YourComponent component = new YourComponent
    {
        ApiClient = mockClient.Object,
        Logger = mockLogger.Object
    };

    // Act
    await component.RefreshAsync();

    // Assert
    component.Loading.Should().BeFalse();
    component.HasError.Should().BeTrue();
    component.ErrorMessage.Should().Contain("Network error");
    mockLogger.Verify(l => l.Log(
        LogLevel.Error,
        It.IsAny<EventId>(),
        It.IsAny<It.IsAnyType>(),
        It.IsAny<Exception>(),
        It.IsAny<Func<It.IsAnyType, Exception?, string>>()), Times.Once);
}

[Fact]
public void FilteredData_WithActiveSearchText_ReturnsOnlyMatchingItems()
{
    // Arrange
    YourComponent component = new YourComponent();
    component._data = new()
    {
        new YourDto { Name = "Alpha Item" },
        new YourDto { Name = "Beta Item" },
        new YourDto { Name = "Gamma Item" }
    };
    component._searchText = "Alpha";

    // Act
    IEnumerable<YourDto> result = component.FilteredData;

    // Assert
    result.Should().HaveCount(1);
    result.First().Name.Should().Be("Alpha Item");
}
\`\`\`

> **NOTE:** The third test sets the private fields \`_data\` and \`_searchText\`, so it does not compile as written. Verify the approach for your project: make the fields \`internal\` and add \`InternalsVisibleTo\` for the test project, or render the component with bUnit and set the search text through the UI.

### Testing rules for the gold standard

- Test the initial load on the success path and on the error path (happy path and sad path).
- Make sure that \`Loading\` is false after completion (success or error).
- Make sure that \`HasError\` and \`ErrorMessage\` have the correct values after an exception.
- Make sure that the filtered results match the filter criteria exactly.
- Mock \`ILogger\` and make sure that the component writes error logs on exceptions.
- Make sure that \`ResetFilters()\` clears all state (search, category, error).
- Never mock \`ApiClient\` methods without return values.
- Use \`It.IsAny<T>()\` for logger assertions when the exact values are not important.

### Command handler test pattern

This example tests a command handler with xUnit, FluentAssertions, and an in-memory database.

\`\`\`csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

public sealed class CreateProductCommandHandlerTests
{
    private static readonly ILogger<CreateProductCommandHandler> Logger =
        NullLoggerFactory.Instance.CreateLogger<CreateProductCommandHandler>();

    private static MockApplicationDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<MockApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())  // ← isolation per test
            .Options);

    [Fact]
    public async Task Handle_WithValidCommand_ReturnsSuccessWithNewGuid()
    {
        // Arrange
        await using MockApplicationDbContext context = CreateContext();
        CreateProductCommandHandler handler = new CreateProductCommandHandler(context, Logger);
        CreateProductCommand command = new CreateProductCommand { Name = "Widget", Price = 9.99m };

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Succeeded.Should().BeTrue();
        result.Data.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task Handle_WithValidCommand_PersistsToDatabase()
    {
        // Arrange
        await using MockApplicationDbContext context = CreateContext();
        CreateProductCommandHandler handler = new CreateProductCommandHandler(context, Logger);
        CreateProductCommand command = new CreateProductCommand { Name = "Widget", Price = 9.99m };

        // Act
        Result<Guid> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Product? saved = await context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == result.Data);

        saved.Should().NotBeNull();
        saved!.Name.Should().Be(command.Name);
    }

    [Fact]
    public async Task Handle_WithEmptyName_ReturnsValidationFailure()
    {
        // Arrange
        CreateProductCommandValidator validator = new CreateProductCommandValidator();
        CreateProductCommand command = new CreateProductCommand { Name = "", Price = 9.99m };

        // Act
        FluentValidation.Results.ValidationResult result = await validator.ValidateAsync(command);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CreateProductCommand.Name));
    }
}
\`\`\`

Testing rules:

- Use \`UseInMemoryDatabase(Guid.NewGuid().ToString())\` in each test for full isolation.
- Never mock \`DbSet<T>\`. Use a real in-memory context, because Moq cannot intercept the EF Core async methods.
- Use \`NullLoggerFactory\` for \`ILogger\`. It reduces noise, and the log is not a contract to assert.
- Name tests \`[Method]_[Scenario]_[ExpectedResult]\` so that they are easy to read.
- Assert one behavior in each test. This makes a failure easier to diagnose.
- Use \`await using MockApplicationDbContext context = CreateContext()\` to make sure that the context is disposed.

## Security and compliance in development

When you implement a feature, always check the security guidelines for these items:

| Severity | Items |
| --- | --- |
| Critical | JWT secrets, Auth attributes, CORS, health checks, file uploads |
| High | Log injection, HttpClient pooling, OTP rate limiting, CSP headers |
| Medium | Tenant isolation, ownership checks, caching strategy |

Key reminders when you write code:

1. All data controllers **must** have the \`[Authorize]\` attribute.
2. Each CQRS query handler must enforce the tenant ID through \`ICurrentUserService.TenantId\`.
3. File uploads must validate the magic bytes, not only the \`Content-Type\` header.
4. Use \`IHttpClientFactory\` in services. Never use \`new HttpClient()\`.
5. Do NOT put JWT secrets in \`appsettings.json\`. Use User Secrets (development) and Key Vault (production).

## Reference documentation

| Document | Purpose |
| --- | --- |
| **copilot-instructions.md** | Core engineering rules, architecture layers, and the feature checklist. |
| **project-expert.md** (this file) | Agent capabilities, practical code patterns, and testing strategies. |

For fast onboarding, follow this path:

1. Read the architecture layers section and the new feature checklist in **copilot-instructions.md**. See [Agent global rules](doc:development-nexuses-agent-global-rules).
2. Read the security guidelines when you change auth, data, or file handling.
3. Use the patterns in this file as copy-paste templates.

## Related links

- [Agent global rules](doc:development-nexuses-agent-global-rules): the folder layout, the setup, and the global rules file.
- [Agent design system](doc:development-nexuses-agent-design-system): the UI and design system rules.
- [MudBlazor documentation](https://mudblazor.com/docs/overview)
`;export{e as default};