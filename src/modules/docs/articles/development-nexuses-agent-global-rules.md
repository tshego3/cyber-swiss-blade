---
title: Agent global rules for .NET 10 Blazor SSR
summary: Set up one shared rules and skills folder for GitHub Copilot and Google AntiGravity, with the global engineering rules for a .NET 10 Blazor SSR solution.
category: Reference
order: 50
gist: 7d918ed092732c842802a302df4de443
---

# Agent global rules for .NET 10 Blazor SSR

This article shows one folder setup that GitHub Copilot (VS Code and Visual Studio) and Google AntiGravity can both use. The `.agents` and `.github` folders give all AI agents one source of truth. The article also gives the full content of the global rules file for a .NET 10 Blazor SSR solution.

## Before you start

- A .NET 10 solution with a Blazor Web App, ASP.NET Core, and MudBlazor.
- GitHub Copilot in VS Code or Visual Studio, or Google AntiGravity.

## Create the folder tree

Use this structure. Each IDE and agent then reads the same rules and skills.

```text
MySolution/
├── .agents/                      <-- Google AntiGravity Root
│   ├── rules/
│   │   └── global-rules.md       <-- System Instructions
│   └── skills/
│       ├── patterns
│       │   └── skills.md         <-- Logic/Architecture
│       ├── rules
│       │   └── skills.md         <-- System Instructions
│       ├── project-expert.md     <-- Logic/Architecture
│       └── design-system.md      <-- UI/UX Standards
└── .github/                      <-- GitHub Copilot Root
    ├── copilot-instructions.md    <-- Symlink or Copy of global-rules.md
    └── skills/                   <-- Symlink or Copy of .agents/skills/
```

| File | Content |
| --- | --- |
| `.agents/rules/global-rules.md` | The global rules in this article. Copy or link it as `.github/copilot-instructions.md`. |
| `.agents/skills/project-expert.md` | The logic and architecture skill. Refer to [Agent project skill for .NET 10 Blazor SSR](doc:development-nexuses-agent-project-skill). |
| `.agents/skills/design-system.md` | The UI and UX standards. Refer to [Agent design system](doc:development-nexuses-agent-design-system). |

## Set up the agents

### Google AntiGravity

- **Folder:** AntiGravity indexes the `.agents/` folder automatically.
- **Grounding:** The agent uses the YAML `description` of each skill to decide when to load DesignSystemExpert or ProjectExpert into its context window.
- **Manual call:** If the agent does not use a skill, type `@` and the skill name. Example: "Refactor this using @DesignSystemExpert".

### VS Code and GitHub Copilot

- **Folder:** Copilot reads `.github/copilot-instructions.md` and the `.github/skills/` folder.
- **Context size:** Keep the technical details in the `skills/` files. The main instructions then use fewer tokens, and the responses are faster and more relevant.
- **Check:** Ask the chat "What skills do you have access to?". Make sure that the answer includes **ProjectExpert** and **DesignSystemExpert**.

## Global rules file

The sections below are the content of `.agents/rules/global-rules.md` (also used as `copilot-instructions.md`). These rules apply to all feature work, bug fixes, and refactors in the repository.

For a specific task, read the related section: [security](#security-and-compliance-rules), [UI](#ui-and-design-system-rules), [architecture](#architecture-layers-and-responsibilities) and [new features](#add-a-new-feature), or [testing](#testing-and-validation-rules).

### Select the rendering pattern

| Page type | Pattern |
| --- | --- |
| Interactive Server pages (new features with `@rendermode InteractiveServer`) | Use the 4-branch pattern in [Gold standard state management](#gold-standard-state-management-for-blazor-components): Loading → Error → Data → Empty. |
| SSR-only pages (default) | Use the 2-branch pattern (HasData / Empty). Add try/catch error handling in `OnInitializedAsync` and show the error through a message variable. |

SSR pages render one time, after `OnInitializedAsync` completes. Thus the user does not see a loading spinner on an SSR page.

## Platform identity

1. The stack is .NET 10, ASP.NET Core, and Blazor Web App.
2. The rendering model is SSR-only by default. Use Interactive Server render mode only when a page needs user interaction after the render that form POST round-trips cannot give (for example, real-time data grids with inline editing). Write the reason in a code comment on each interactive page.
3. The UI framework is MudBlazor.
4. The architecture has clean layers: Domain, Application, Infrastructure, and Presentation.
5. Authentication is cookie-based through server endpoints.

## Architecture rules

These rules are mandatory.

1. Keep the Domain layer pure. It must not depend on Web, UI, or infrastructure concerns.
2. Infrastructure can depend on Domain and Application abstractions. The reverse is not permitted.
3. Presentation composes application behavior. It must not contain business rules.
4. Do not call external APIs directly from Razor components. Use the abstractions.
5. Register all concrete services through DI in `Program.cs` or in dedicated dependency modules.
6. **Never create duplicate entity, DTO, or record types outside `Domain`.** Define all shared types (entities, stored-procedure result classes, value objects) in Domain and reference them directly. Do not create local copies in a different layer. If a type does not exist in Domain, add it there first.

## Dependency injection rules

1. Use constructor injection for controllers, services, and handlers.
2. Use scoped lifetimes for services that are scoped to a request or a user.
3. Use singleton only for stateless or shared services that are safe across requests.
4. In Development, keep DI validation on (`ValidateScopes` and `ValidateOnBuild`).
5. Do not use ad hoc service location in application code, unless a pattern that exists needs it.

## Blazor SSR and routing rules

1. Use SSR for all pages and components by default. Use interactivity only for a clear requirement.
2. Use SSR patterns for pages that write HTTP headers during the request (for example, authentication POST flows).
3. For authentication forms, use POST endpoints with antiforgery tokens, not interactive event handlers.
4. Keep the login and logout flows in controllers. This prevents timing problems with response header writes.
5. Use `Authorize` attributes for protected pages and make redirects deterministic.
6. **Manage async component state by render mode.** Interactive Server components that get data must use the [gold standard](#gold-standard-state-management-for-blazor-components) 4-branch pattern (Loading → HasError → HasSourceData → Empty). SSR-only pages use the 2-branch pattern (HasData / Empty). They show errors through a message variable in the single server render.

## Authentication and session rules

1. Use cookie authentication as `Program.cs` configures it.
2. Keep the secure cookie settings. Do not make the security defaults weaker without explicit approval.
3. Keep the login path, logout path, expiration, and sliding expiration consistent with the current app policy.
4. Never write tokens or sensitive claims to logs.
5. Keep the privacy acceptance flow enforceable: after login, the user accepts the privacy terms before the dashboard opens.

## API and repository rules

1. Access external APIs only through typed HTTP clients and repository or service abstractions.
2. Use delegating handlers for cross-cutting concerns, such as authentication token forwarding and error handling.
3. Translate errors in one central location (for example, `AppException` patterns). Keep the messages safe for users.
4. Do not put endpoint URLs in many locations. Read base URLs and options from the configuration.
5. Use cancellation tokens on async API operations.
6. **Legacy integration compatibility is mandatory.** When you modernize legacy routes, keep the old endpoint paths, request body contracts, and response shapes. Use backward-compatible adapters or aliases, so that integrations continue to work without changes.
7. **Do not create duplicate APIs for legacy compatibility.** Do not create separate controllers or action methods that copy functionality only to serve legacy routes. Add legacy route aliases (for example `[HttpPost("/User/Login")]`) directly on the controller actions, so that the old and new paths go to the same implementation. If an API already has the business logic, connect legacy callers to it through route attributes or thin redirect controllers. Never copy the logic into a parallel endpoint.
8. **Do not add phantom or unreferenced routes.** A known client must call each route that an endpoint exposes. Do not use more than one class-level `[Route]` attribute, because they make combinations of routes that no client calls. If an action must be available at a path outside the primary route prefix of its controller, use an absolute route template (for example `[HttpPost("/api/auth/login")]`). Before you add a route, make sure that at least one client uses it.
9. **Dynamics API contract serialization rules.** Contracts that you send to the Dynamics 365 REST API must not inherit from `XppObjectBase`. `XppObjectBase` is a god object with more than 100 properties. It adds unwanted data to serialized payloads and causes `XppServicesDeserializationException` on the Dynamics side. When you create or change contracts for Dynamics:
   1. Never inherit from `XppObjectBase`. Define directly only the properties that the contract needs.
   2. Make all enum properties non-nullable, so that they serialize as integers (for example `0`), not `null`. Dynamics cannot deserialize `null` into X++ enums.
   3. Match the legacy WCF payload format.
   4. `DateTime` fields default to `0001-01-01T00:00:00` (the C# default), not null.
   5. String properties can be null.

## Security and compliance rules

1. Keep the standard security headers active (CSP, X-Content-Type-Options, X-Frame-Options, and others).
2. Keep the crawler shield behavior, unless a product or security decision changes it.
3. Keep antiforgery on all form actions that change state.
4. Keep the privacy content and consent behavior aligned with the approved legal text.
5. Never hardcode secrets, credentials, or sensitive data for an environment.
6. **Critical: Add the `[Authorize]` attribute to all data controllers.** A missing attribute blocks production.
7. **Critical: Store JWT secrets in User Secrets locally and in Azure Key Vault in production.**
8. **High: Validate the magic bytes of uploaded files.** Do not trust the client `Content-Type` header.
9. **High: Restrict CORS to specific origins.** Never use `AllowAnyOrigin()` with credentials.
10. **High: Enforce tenant isolation in all CQRS queries.** Filter by `ICurrentUserService.TenantId`.
11. **Medium: Use `IHttpClientFactory`, not `new HttpClient()`.** This prevents socket exhaustion.
12. **Medium: Apply rate limits to OTP endpoints.** This prevents email and SMS flooding.
13. **Check all dependencies before you add them.** Before you add a NuGet package or an npm dependency:
    1. Make sure that it exists on the official package registry (nuget.org, npmjs.com).
    2. Make sure that the publisher or organization is legitimate.
    3. Look for known CVEs or security advisories.
    4. Examine the download count, the maintenance activity, and the last publish date.
    5. Prefer packages with a clear license (MIT, Apache 2.0).

    Do not trust package names that an AI suggests. The package may not exist, or it may be a typosquatted package.

## UI and design system rules

These rules come from the design system. They apply to all presentation screens.

1. Follow the White-Labeled Enterprise UI direction: premium, authoritative layouts with a high signal.
2. Apply the no-line rule for sections: use tonal surface layers, not grids with many borders.
3. Use dynamic brand colors from appsettings or configuration. Do not hard-code a different palette.
4. Align the typography to the Public Sans hierarchy, for display text and for dense operational data.
5. Use atmospheric depth (gradients, surface tiers, and subtle shadow tints), not flat blocks.
6. Keep the layout responsive on desktop and mobile, and keep it easy to read.
7. **Do not use scoped `.razor.css` files or `<style>` blocks in `.razor` components.** Use only the MudBlazor component API (props, variant, style classes, inline `Style=`) for all styles. The only exception is the global `wwwroot/app.css`, for baseline or framework-level styles that are not specific to a component. Never put CSS directly in `.razor` files.
8. **Do not hardcode colors in `.razor` or `.cs` files.** All color values must come from `BrandingConfig` (injected through `IOptions<BrandingConfig>`) or from MudBlazor theme CSS variables (`var(--mud-palette-*)`). This keeps white-labeling and dark and light mode correct automatically.
9. **Read the MudBlazor component API first.** Before you add styles or behavior to a component, read the [MudBlazor documentation](https://mudblazor.com/docs/overview) for native props and features. Use the MudBlazor theming, size and color enums, variant and density controls, and spacing utilities. Use inline `Style=` only when MudBlazor has no alternative.
10. **Keep markup and logic separate in new components.** Put the component logic, parameters, lifecycle, and event handlers in a `.razor.cs` code-behind file. Keep the `.razor` file for the view template. Example: `MyComponent.razor` and `MyComponent.razor.cs`. This makes the code easier to read, test, and maintain.
11. **Use the 4-branch rendering pattern for Interactive Server async data flows.** The [gold standard](#gold-standard-state-management-for-blazor-components) section is the authoritative specification. All Interactive Server components (with `@rendermode InteractiveServer`) that load data asynchronously must render 4 states in this order: Loading, HasError, HasSourceData, Empty. SSR-only pages use the 2-branch pattern (HasData / Empty).
12. **Keep the filter UX recoverable.** For tables with search or filters, show the toolbars and search inputs based on the unfiltered source collection (for example `_data.Any()`), not on the filtered results. If a filter has zero matches, keep the table shell and controls visible. Use `NoRecordsContent` (or a similar empty message in the table), so that users can clear or change the filters. Do not trap users in a page-level empty state.

## Performance and caching rules

1. Use output caching policies for list pages and read-heavy endpoints or pages, where applicable.
2. Use cache tags and invalidation paths when you change data that cached reads use.
3. Keep component state scoped and purposeful, so that the UI does not re-render too much.
4. Do not add middleware or per-request work that is not necessary.

## Testing and validation rules

1. Build the affected projects after code changes.
2. Fix the compile errors and the related analyzer warnings that the change causes.
3. Add or update tests for behavior changes in controllers, services, and critical flows.
4. Test for authentication and authorization regressions each time you change authentication code.
5. Test the privacy and redirect flows from end to end when you change them.

## Logging and observability rules

1. Log meaningful operational events (login success or failure, critical exceptions).
2. Do not write noisy or duplicate logs that reduce the signal.
3. Use structured logging and include context that helps the reader act.
4. Never log passwords, tokens, or raw personal information.
5. When an operation fails, always give the user a clear failure reason that tells them what to do.
6. Make user error messages clear and safe: tell what failed and the next step. Do not show sensitive internal details.

## Change management rules

1. Make small, scoped changes, not broad rewrites.
2. Do not refactor unrelated areas when you make a targeted fix.
3. Keep the names, formatting, and coding style aligned with the code around the change.
4. Document new conventions in the docs only when the behavior or standards change materially.
5. Use explicit types and return types. Do not use `void` where you can avoid it. **Never use `var`.** Always declare the explicit type, also for loop variables, LINQ results, and `new` expressions.
6. Use .NET-native and Blazor-native implementations. Use JavaScript only as a last option, when the framework has no practical alternative.
7. Do not use nested syntax. Use flat structures with guard clauses and early returns, not deep nested conditionals, loops, or list hierarchies.
8. **The AI agent compliance check is mandatory.** Before you complete changes, make sure that the implementation agrees with `.github/copilot-instructions.md`, all related guidance under `.github/skills/`, and the related guidance in `docs/`. When you run a compliance check, also audit the dependencies and security:
   1. Make sure that all packages in `.csproj` and `packages.lock.json` come from known, legitimate publishers.
   2. Look for outdated or unmaintained dependencies (last publish more than 12 months ago).
   3. Scan the current dependency versions for known vulnerabilities (CVEs, security advisories).
   4. Make sure that the source and configuration files contain no hardcoded secrets, API keys, or credentials.
   5. Make sure that all network calls use HTTPS, timeouts, and input validation.
   6. Make sure that error messages do not show internal details (stack traces, raw error descriptions, file paths).
9. Use `async Task` or `async Task<T>` by default, not `async void` or `void`. Use `async void` or `void` only for event handlers that the framework requires.
10. Use generics for reusable, type-safe abstractions. Do not write duplicate implementations for each type when a constrained generic design is applicable.
11. Keep code simple and direct. Do not use complex or clever patterns when a clear, direct implementation meets the requirement.
12. If a reader cannot understand code quickly without comments, simplify the code first. Comments give context. They must not compensate for complexity that you can avoid.
13. Use direct, descriptive, and consistent names for classes, methods, variables, and files.
14. Apply DRY: use related functionality that exists. Extend or refactor components that exist before you create parallel implementations.
15. Use implementations with little boilerplate: small methods, small diffs, and direct control flow that give a large effect with little code.
16. Keep logs short and useful. Log the intent, the result, and the failures with structured properties. Do not write long multi-line log blocks when one clear statement is sufficient.
17. Use small helper methods or constants for repeated error text or repeated calculations. This keeps feature methods easy to read.
18. For immutable Domain records that forms use, define a static factory on the record (for example `CreateEmpty()`). Use it from the UI code. Do not create local `CreateEmptyModel` helpers on each page.
19. **If you find hardcoded mock or placeholder data in components or pages, replace it before you finish.** UI generation from designs (image to code) can add sample text, dates, names, or numbers. This data must not ship. Replace it with parameter bindings, service calls, or empty-state defaults. If the backend connection is not ready, use clearly marked `// TODO:` stubs that return empty collections.
20. **Do not add unnecessary `if` statements.** Do not put code in a conditional when the condition is always true, when one expression or a null-coalescing operator is sufficient, or when the branch adds no different behavior. Use ternary expressions, pattern matching, null-coalescing (`??` and `??=`), and early returns.
21. **Code is a liability, not an asset.** Each line that you add must have a reason. Delete code where you can, and always make the smallest diff that solves the problem. If you can get the feature when you remove or simplify code, do that.

## Architecture layers and responsibilities

Each layer references only the layers below it:

```text
Presentation  ──HTTP──►  API  ──MediatR──►  Application  ──►  Domain
                          │                       │
                          └─────────────────►  Infrastructure
```

| Layer | Responsibility | Key files |
| --- | --- | --- |
| Domain | Pure business entities, value objects, and domain exceptions. **No framework dependencies.** | `Entities/`, `Exceptions/`, `Events/`, `ValueObjects/` |
| Application | CQRS commands and queries (MediatR), DTOs, validation rules (FluentValidation), and pipeline behaviors. References Domain only. | `Features/[Entity]/{Commands,Queries}`, `Common/Interfaces/` |
| Infrastructure | EF Core DbContext, migrations, and external service implementations (blob storage, email, and others). Implements the Application interfaces. | `Persistence/`, `Services/`, `Seeding/` |
| Infrastructure.Shared | Cross-cutting infrastructure: white-label branding and configuration. | `Branding/` |
| API | ASP.NET Core controllers, middleware, JWT and cookie authentication, and dependency injection setup. Sends requests through MediatR. **Must apply `[Authorize]` on data endpoints.** | `Controllers/`, `Middleware/`, `Program.cs` |
| Presentation | Blazor Web App (SSR and Interactive Server), typed HttpClient API clients, Razor pages, and authentication state. **Never reference Domain or Application directly. Call the API through HTTP only.** | `Components/Pages/`, `Services/`, `Program.cs` |
| Tests | xUnit unit and integration tests, with the same folder structure as Application. Use EF Core InMemory. Never mock `DbSet<T>`. | `Features/[Entity]/{Commands,Queries}/` |

> **NOTE:** Verify the layer rule for shared types. The architecture rules say that all layers reference the Domain types directly, and that UI code uses Domain record factories such as `CreateEmpty()`. This table says that Presentation never references Domain. Decide if Presentation can reference Domain types (DTOs and records only) and make the rules agree.

> **NOTE:** Dated (checked November 2026): MediatR changed to a commercial license from version 13 (2025). Version 12 stays free under Apache 2.0. Check the license before you add or upgrade MediatR, or use a free alternative such as a small in-house dispatcher.

## Add a new feature

1. **Domain:** Create an entity that inherits from `AuditableEntity`.
2. **Application:** Add `DbSet<Entity>` to `IApplicationDbContext`. Create the CQRS commands and queries.
3. **Infrastructure:** Register `DbSet<Entity>` in `MockApplicationDbContext`.
4. **API:** Create a controller with `[Authorize]` that sends requests to MediatR.
5. **Presentation:** Create a typed `BaseApiClient` subclass and the Blazor pages.
6. **Tests:** Add xUnit handler and validator tests that use the InMemory database.

The DI setup in `Program.cs` and the MediatR assembly scan connect all parts automatically. You do not have to register handlers or validators manually.

## NASA JPL Power of 10 rules for C#

These principles come from the strict coding standards of the NASA Jet Propulsion Laboratory for safety-critical systems. They are adapted for enterprise .NET development.

1. **Simple control flow:** Do not use complex recursion. Use iteration for a predictable stack depth.
2. **Fixed loops:** All loops must have a deterministic upper limit. Do not use infinite loops, or loops that need external state to stop without a safety break.
3. **No dynamic memory allocation after initialization:** In high-reliability paths, do not create too many objects. This prevents GC pressure and "Stop-the-World" pauses. Use `Span<T>` and `Memory<T>` where applicable.
4. **Small functions:** A function must not be longer than 60 lines of code. A longer function does too much.
5. **Low assertion density:** Use `Debug.Assert` and clear exception handling. Each function must validate its inputs.
6. **Data hiding:** Keep the scope of each variable to the smallest possible block.
7. **Check return values:** Never ignore a `Task` or a return value. Use `_ = Task.Run(...)` only for an intentional fire-and-forget call. In all other cases, always await.
8. **Minimal preprocessor use:** Do not use complex `#if` directives. Use interfaces and dependency injection for platform-specific logic.
9. **Pointer safety:** Do not use `unsafe` blocks, unless high-performance interop needs them. Use safe managed code.
10. **Compile-time warnings:** Treat all compiler warnings as errors.

## Production stability and debuggability

These rules (the "2 AM rules") help you find and fix production incidents quickly, with little guesswork, also during on-call work.

1. **Exceptions with context:** Never throw a generic `Exception`. Throw specific types and put the state (for example, the ID or the user context) in the message.
   - Bad: `throw new Exception("Failed");`
   - Good: `throw new OrderProcessingException($"Failed to process order {orderId} for customer {userId}");`
2. **Defensive logging:** Log the *intent* before an action and the *result* after it. Use structured logging (Serilog, message templates), so that you can search logs by property.
3. **Fail fast:** Check for nulls, empty strings, and invalid ranges at the start of a method (guard clauses).
4. **Idempotency by default:** Write logic (especially in background workers and Hangfire) on the assumption that it can run 2 times. Check the state before you cause side effects.
5. **CancellationToken propagation:** Each async method must accept and use a `CancellationToken`. There are no exceptions.
6. **No "ghost" errors:** Never use empty `catch {}` blocks. If you must ignore an error, log it as `Information` or `Debug`, with a comment that tells why it is safe to ignore.
7. **Mandatory timeouts:** Each external call (HTTP, database, Redis) must have a hard timeout. Never let a thread wait indefinitely.
8. **Telemetry, not debugging:** Write code that exports metrics (OpenTelemetry). At 2 AM, a dashboard is easier to use than a remote debugger.
9. **Pure logic separation:** Keep business logic in pure functions (input in, output out), separate from I/O (database, API). Pure functions are easy to unit test and to verify during a crisis.
10. **No global state:** Static variables are dangerous for thread safety. Use scoped or transient lifetimes through dependency injection.

## Testability and architecture rules

1. **Constructor injection only:** Always use constructor injection for dependencies. Do not use `internal` or `public` setters for dependencies, unless a specific framework needs them.
2. **Interface-based abstractions:** Define interfaces (`IService`, `IRepository`) for each class that does I/O or contains logic that can change. Program to the interface, not to the implementation.
3. **High cohesion, low coupling:** Give each class one responsibility. If a constructor has more than 5 dependencies, suggest that you divide the class into smaller components.
4. **Do not use `new` for logic:** Never create dependencies (for example `new HttpClient()` or `new DbContext()`) in a class. Get them from the DI container.
5. **Pure logic extraction:** Move complex algorithms into pure static methods or helper classes that do not depend on external state. These are easy to unit test.
6. **Mockability:** Make methods virtual or define them in an interface, so that Moq or NSubstitute can mock them.
7. **No service locator pattern:** Never inject `IServiceProvider`. Request the dependencies that you need in the constructor.
8. **Composition over inheritance:** Wrap functionality in a new class (Decorator or Strategy pattern). Do not create deep inheritance hierarchies.
9. **Sealed by default:** Mark classes as `sealed`, unless you design them for inheritance. This prevents accidental extensibility that breaks logic.
10. **Test data builders:** In unit tests, use the Builder pattern or the AutoFixture approach. Tests then continue to work when constructors change.

## Records and classes rules

1. **Use records for data:** Use `public record Name(Type Prop, ...);` for all DTOs, events, and value objects. Records are immutable and make unit test assertions simpler.
2. **Use classes for services:** Use `class` for each object in the DI container that contains logic or manages external resources (I/O).
3. **Do not make mutable records:** Do not use `set;` in records. If data must change, use the `with` keyword to create a new instance.
4. **Value equality in tests:** When you test logic that returns data, use record equality for assertions (for example `actualRecord.Should().Be(expectedRecord);`).
5. **Clear roles:** Give classes clear lifecycle roles. Keep records as simple data holders with little or no logic.

## Gold standard state management for Blazor components

This pattern is **mandatory** for Interactive Server components that get and show data. It gives interactive pages in the presentation layer consistent, production-grade behavior.

> **IMPORTANT:** This pattern applies **only** to pages and components that use `@rendermode InteractiveServer`. SSR-only pages get data one time in `OnInitializedAsync` and do not re-render on the client. Do **not** add Loading or HasError branches to SSR-only pages. They render one time after `OnInitializedAsync` completes, so the user never sees the Loading flag.

### State structure

Each component that loads data asynchronously **must** include these elements:

1. **Injected dependencies**
   - `[Inject] public YourApiClient ApiClient { get; set; } = null!;`
   - `[Inject] public ILogger<YourComponent> Logger { get; set; } = null!;`
2. **Private fields** (for data and user input)
   - `private List<YourDto> _data = new();`: the raw API response.
   - `private string _searchText = string.Empty;`: the user input for filters.
   - `private string? _selectedCategory = null;`: the category filter state.
3. **Public state properties** (3 mandatory flags)
   - `public bool Loading { get; set; } = true;`: true at the start.
   - `public bool HasError { get; set; }`: the error state.
   - `public string? ErrorMessage { get; set; }`: an error message that is safe for users.
4. **Computed properties** (derived state, never cached)
   - `public IEnumerable<YourDto> FilteredData => _data.Where(ApplyFilters).ToList();`
   - `public int ResultCount => FilteredData.Count();`
   - `public bool HasSourceData => _data.Any();`
5. **Initialization** (in `OnInitializedAsync`)
   - Set `Loading = true` at the start.
   - Set `Loading = false` **only in the finally block**, so that it is always set.
   - Always use try/catch/finally.
6. **Error handling** (3 levels)
   - **Network errors** (`HttpRequestException`): "Network error. Please check your connection and try again."
   - **Business errors** (known exceptions): a domain-specific message.
   - **Unexpected errors** (catch-all): "Failed to load data. Please try again or contact support."
   - Log all errors with context. Never show stack traces to users.
7. **User actions**
   - `RefreshAsync()`: the user loads the data again.
   - `ResetFilters()`: clears all filters and the error state.
   - `ClearSearch()`: clears only the search field.

### 4-branch rendering pattern

Use the branches in this order:

```text
@if (Loading)
    --> Show MudProgressCircular or MudProgressLinear
else if (HasError)
    --> Show MudAlert with error message + "Try Again" button
else if (HasSourceData)
    --> Show table + toolbar with filters + result count
else
    --> Show MudAlert empty state with contextual guidance
```

### Mandatory rules

1. **Always use try/catch/finally.** Set `Loading = false` only in the finally block.
2. **Never show raw data.** Always use the `FilteredData` computed property.
3. **Never cache computed results.** Calculate them again on each render.
4. **Always give error messages that are safe for users.** Never show internal details.
5. **Always log errors.** Use `ILogger.LogError()` with the exception.
6. **Always show the result count** when the page shows data.
7. **Always show a "Try Again" button** in the error state.
8. **Always initialize collections to `new()`.** Never leave them null.
9. **Use `@key` only for large dynamic lists.** Do not add directives that are not necessary.
10. **Never call `StateHasChanged()` manually.** Blazor re-renders automatically after lifecycle methods and event handlers.
11. **For grids with filters, never make the toolbar or table visibility depend on the filtered rows.** Use the source data to select the branch, and use `NoRecordsContent` in the table for filters with zero matches.

### Forbidden patterns

Do not do these things:

- Show `_data` directly in the template.
- Set `Loading = false` in more than one location.
- Catch an exception without a log entry (silent exception handling).
- Show raw error messages to users.
- Render without a check of `Loading` or `HasSourceData`.
- Put filter logic in the template.
- Show page-level empty states based on `FilteredData.Any()` in tables with search.
- Forget to initialize the state flags.
- Use `OnAfterRender` for the first data load. Use `OnInitializedAsync` only.
- Hardcode retry logic. Give the user a button.
- Store computed results in fields.

### Testing requirements

Test each component that uses this pattern for these paths:

1. **Happy path:** A successful API call fills the data and sets `Loading = false`.
2. **Error path:** An exception sets `HasError = true`, `ErrorMessage` is safe for users, and the error is in the log.
3. **Filter path:** `FilteredData` matches the filter criteria exactly.
4. **Empty path:** An empty result set shows the empty state with guidance for the context.
5. **Reset path:** `ResetFilters()` clears all state, including errors.

For full implementation examples, Razor templates, testing patterns, and more anti-patterns, refer to the "Gold Standard State Management" section of `.agents/skills/project-expert.md` in [Agent project skill for .NET 10 Blazor SSR](doc:development-nexuses-agent-project-skill).

## Related links

- [Agent project skill for .NET 10 Blazor SSR](doc:development-nexuses-agent-project-skill)
- [Agent design system](doc:development-nexuses-agent-design-system)
- [AI agent operational model](doc:ai-agent-operational-model)
- [MudBlazor documentation](https://mudblazor.com/docs/overview)
- [Development nexuses](doc:development-nexuses)
