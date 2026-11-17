---
title: Angular Tour of Heroes, part 5: Add navigation with routing
summary: Add an AppRoutingModule, a router outlet, a dashboard, default and parameterized routes, and a routable hero detail view with a back button.
category: Angular
order: 160
gist: eabb3f133b8a7fb6fd139763edcae064
source: toh-pt5.md
---

# Angular Tour of Heroes, part 5: Add navigation with routing

In this part, you add the Angular router to the Tour of Heroes application. The application gets these new requirements:

- Add a *Dashboard* view.
- Let users navigate between the *Heroes* and *Dashboard* views.
- When users click a hero name in one of the views, navigate to a detail view of the selected hero.
- When users click a *deep link* in an email, open the detail view for a specific hero.

## Before you start

- Complete [Angular Tour of Heroes, part 4: Add services](doc:angular-tour-of-heroes-part-4).
- To see the code of this part, use the `toh-pt5` live example in the Angular documentation.

When you are done, users can navigate the application like this:

![View navigations](https://angular.io/generated/images/guide/toh/nav-diagram.png)

## Add the AppRoutingModule

In Angular, the best practice is to load and configure the router in a separate, top-level module. This module is only for routing, and the root `AppModule` imports it.

By convention, the module class name is `AppRoutingModule`, and the module is in `app-routing.module.ts` in the `src/app` directory.

> **NOTE:** Dated (checked November 2026): standalone applications (the default since Angular 17) have no `AppRoutingModule`. They define the routes in `app.routes.ts` and register them with `provideRouter(routes)` in `app.config.ts`. This part uses the `NgModule` approach.

1. Run `ng generate` to create the application routing module:

   ```bash
   ng generate module app-routing --flat --module=app
   ```

   **Result:** `ng generate` creates the file. Example code: `toh-pt5/src/app/app-routing.module.0.ts` (generated).

2. Replace the file contents with the updated version.

   Example code: `toh-pt5/src/app/app-routing.module.1.ts` (updated).

| Parameter | Details |
| --- | --- |
| `--flat` | Puts the file in `src/app`, not in its own directory. |
| `--module=app` | Tells `ng generate` to register it in the `imports` array of the `AppModule`. |

First, the `app-routing.module.ts` file imports `RouterModule` and `Routes`, so that the application has routing capability. The next import, `HeroesComponent`, gives the router a destination after you configure the routes.

The `CommonModule` references and the `declarations` array are not necessary, so they are no longer part of `AppRoutingModule`. The next sections explain the rest of the `AppRoutingModule`.

### Routes

The next part of the file configures your routes. *Routes* tell the router which view to show when a user clicks a link or pastes a URL into the browser address bar.

`app-routing.module.ts` already imports `HeroesComponent`, so you can use it in the `routes` array.

Example code: `toh-pt5/src/app/app-routing.module.ts`, region `heroes-route`.

A typical Angular `Route` has 2 properties:

| Property | Details |
| --- | --- |
| `path` | A string that matches the URL in the browser address bar. |
| `component` | The component that the router creates when it navigates to this route. |

This tells the router to match that URL to `path: 'heroes'`, and to show the `HeroesComponent` when the URL is similar to `localhost:4200/heroes`.

### RouterModule.forRoot()

The `@NgModule` metadata initializes the router and starts it to listen for changes to the browser location.

This line adds the `RouterModule` to the `AppRoutingModule` `imports` array. It also configures the module with the `routes` in one step when it calls `RouterModule.forRoot()`.

Example code: `toh-pt5/src/app/app-routing.module.ts`, region `ngmodule-imports`.

> **NOTE:** The method name is `forRoot()` because you configure the router at the root level of the application. The `forRoot()` method supplies the service providers and directives that routing needs. It also does the initial navigation based on the current browser URL.

Next, `AppRoutingModule` exports `RouterModule`, so that it is available in all of the application.

Example code: `toh-pt5/src/app/app-routing.module.ts`, region `export-routermodule` (exports array).

## Add RouterOutlet

1. Open the `AppComponent` template and replace the `<app-heroes>` element with a `<router-outlet>` element.

   Example code: `toh-pt5/src/app/app.component.html`, region `outlet`.

The `AppComponent` template does not need `<app-heroes>` anymore, because the application shows the `HeroesComponent` only when the user navigates to it.

The `<router-outlet>` tells the router where to show routed views.

> **NOTE:** `RouterOutlet` is one of the router directives that became available to the `AppComponent`, because `AppModule` imports `AppRoutingModule`, which exported `RouterModule`. The `ng generate` command that you ran at the start of this part added this import because of the `--module=app` flag. If you did not use `ng generate` to create `app-routing.module.ts`, import `AppRoutingModule` into `app.module.ts` and add it to the `imports` array of the `NgModule`.

### Try the router outlet

1. If you do not serve your application now, run `ng serve` to see the application in the browser.

   **Result:** The browser refreshes and shows the application title, but not the list of heroes.

2. Look at the address bar of the browser. The URL ends in `/`. The route path to `HeroesComponent` is `/heroes`.
3. Add `/heroes` to the end of the URL in the address bar.

   **Result:** The heroes overview and detail view shows.

4. Remove `/heroes` from the URL in the address bar.

   **Result:** The browser refreshes and shows the application title, but not the list of heroes.

## Add a navigation link with routerLink

Users must be able to click a link to navigate, and not paste a route URL into the address bar.

1. Add a `<nav>` element. In it, add an anchor element that navigates to the `HeroesComponent` when the user clicks it.

   Example code for the revised `AppComponent` template: `toh-pt5/src/app/app.component.html`, region `heroes` (heroes RouterLink).

   **Result:** The browser refreshes and shows the application title and the heroes link, but not the heroes list.

2. Click the link.

   **Result:** The address bar changes to `/heroes` and the list of heroes shows.

The `routerLink` attribute is set to `"/heroes"`. The router matches this string to the route to `HeroesComponent`. `routerLink` is the selector for the [`RouterLink` directive](https://angular.io/api/router/RouterLink), which changes user clicks into router navigations. It is another public directive in the `RouterModule`.

> **TIP:** To make this navigation link and future navigation links look better, add private CSS styles to `app.component.css`. Find them in the [final code review](#appcomponent).

## Add a dashboard view

Routing is more useful when your application has more than one view. The *Tour of Heroes* application has only the heroes view.

1. To add a `DashboardComponent`, run `ng generate`:

   ```bash
   ng generate component dashboard
   ```

   **Result:** `ng generate` creates the files for the `DashboardComponent` and declares it in `AppModule`.

2. Replace the default content in these files:

| File | Example code |
| --- | --- |
| `src/app/dashboard/dashboard.component.html` | `toh-pt5/src/app/dashboard/dashboard.component.1.html` |
| `src/app/dashboard/dashboard.component.ts` | `toh-pt5/src/app/dashboard/dashboard.component.ts` |
| `src/app/dashboard/dashboard.component.css` | `toh-pt5/src/app/dashboard/dashboard.component.css` |

The *template* shows a grid of hero name links:

- The `*ngFor` repeater creates one link for each hero in the `heroes` array of the component.
- The `dashboard.component.css` styles the links as colored blocks.
- The links do not go anywhere yet.

The *class* is similar to the `HeroesComponent` class:

- It defines a `heroes` array property.
- The constructor expects Angular to inject the `HeroService` into a private `heroService` property.
- The `ngOnInit()` lifecycle hook calls `getHeroes()`.

This `getHeroes()` returns the list of heroes sliced at positions 1 and 5. It returns only heroes 2, 3, 4, and 5.

Example code: `toh-pt5/src/app/dashboard/dashboard.component.ts`, region `getHeroes`.

### Add the dashboard route

To navigate to the dashboard, the router needs a route for it.

1. Import the `DashboardComponent` in the `app-routing.module.ts` file.

   Example code: `toh-pt5/src/app/app-routing.module.ts`, region `import-dashboard`.

2. Add a route to the `routes` array that matches a path to the `DashboardComponent`.

   Example code: `toh-pt5/src/app/app-routing.module.ts`, region `dashboard-route`.

### Add a default route

When the application starts, the address bar of the browser points to the root of the web site. That does not match a route, so the router does not navigate anywhere. The space below the `<router-outlet>` is blank.

1. To make the application navigate to the dashboard automatically, add the default route to the `routes` array.

   Example code: `toh-pt5/src/app/app-routing.module.ts`, region `redirect-route`.

This route redirects a URL that fully matches the empty path to the route with the path `'/dashboard'`.

**Result:** After the browser refreshes, the router loads the `DashboardComponent`, and the address bar shows the `/dashboard` URL.

### Add a dashboard link to the shell

Users must be able to navigate between the `DashboardComponent` and the `HeroesComponent` with links in the navigation area near the top of the page.

1. Add a dashboard navigation link to the `AppComponent` shell template, immediately above the *Heroes* link.

   Example code: `toh-pt5/src/app/app.component.html`.

**Result:** After the browser refreshes, you can navigate between the 2 views with the links.

## Navigate to hero details

The `HeroDetailComponent` shows the details of a selected hero. At the moment, the `HeroDetailComponent` shows only at the bottom of the `HeroesComponent`.

Users must be able to get to these details in 3 ways:

1. Click a hero in the dashboard.
2. Click a hero in the heroes list.
3. Paste a "deep link" URL that identifies the hero into the address bar of the browser.

In this section, you enable navigation to the `HeroDetailComponent` and separate it from the `HeroesComponent`.

### Delete hero details from HeroesComponent

When the user clicks a hero in `HeroesComponent`, the application must navigate to the `HeroDetailComponent`. The hero detail view replaces the heroes list view. The heroes list view must not show hero details anymore.

1. Open `heroes/heroes.component.html` and delete the `<app-hero-detail>` element from the bottom.

Now a click on a hero item does nothing. You fix that after you enable routing to the `HeroDetailComponent`.

### Add a hero detail route

A URL like `~/detail/11` is a good URL to navigate to the *Hero Detail* view of the hero with the `id` `11`.

1. Open `app-routing.module.ts` and import `HeroDetailComponent`.

   Example code: `toh-pt5/src/app/app-routing.module.ts`, region `import-herodetail`.

2. Add a *parameterized* route to the `routes` array. It matches the path pattern to the *hero detail* view.

   Example code: `toh-pt5/src/app/app-routing.module.ts`, region `detail-route`.

The colon character (`:`) in the `path` shows that `:id` is a placeholder for a specific hero `id`.

Now all application routes are in place. Example code: `toh-pt5/src/app/app-routing.module.ts`, region `routes` (all routes).

### DashboardComponent hero links

The `DashboardComponent` hero links do nothing at the moment. The router now has a route to `HeroDetailComponent`.

1. Fix the dashboard hero links so that they navigate with the *parameterized* dashboard route.

   Example code: `toh-pt5/src/app/dashboard/dashboard.component.html`, region `click` (hero links).

You use Angular [interpolation binding](https://angular.io/guide/interpolation) in the `*ngFor` repeater to put the `hero.id` of the current iteration into each [`routerLink`](#add-a-navigation-link-with-routerlink).

### HeroesComponent hero links

The hero items in the `HeroesComponent` are `<li>` elements. Their click events bind to the `onSelect()` method of the component.

Example code: `toh-pt4/src/app/heroes/heroes.component.html`, region `list` (list with onSelect).

1. Remove the inner HTML of the `<li>`.
2. Wrap the badge and the name in an anchor element (`<a>`).
3. Add a `routerLink` attribute to the anchor, the same as in the dashboard template.

   Example code: `toh-pt5/src/app/heroes/heroes.component.html`, region `list` (list with links).

4. Fix the private style sheet in `heroes.component.css`, so that the list looks as it did before. The revised styles are in the [final code review](#heroescomponent).

#### Remove dead code (optional)

The `HeroesComponent` class still works, but the `onSelect()` method and the `selectedHero` property are not used anymore. Clean up the code for your future self.

Example code for the class without the dead code: `toh-pt5/src/app/heroes/heroes.component.ts`, region `class` (cleaned up).

## Make HeroDetailComponent routable

Before, the parent `HeroesComponent` set the `HeroDetailComponent.hero` property, and the `HeroDetailComponent` showed the hero.

`HeroesComponent` does not do that anymore. Now the router creates the `HeroDetailComponent` in response to a URL such as `~/detail/12`.

The `HeroDetailComponent` needs a new way to get the hero to show. This section explains how to:

- Get the route that created it.
- Extract the `id` from the route.
- Get the hero with that `id` from the server with the `HeroService`.

1. Add the new imports.

   Example code: `toh-pt5/src/app/hero-detail/hero-detail.component.ts`, region `added-imports`.

2. Inject the `ActivatedRoute`, `HeroService`, and `Location` services into the constructor. Keep their values in private fields.

   Example code: `toh-pt5/src/app/hero-detail/hero-detail.component.ts`, region `ctor`.

| Service | Purpose |
| --- | --- |
| [`ActivatedRoute`](https://angular.io/api/router/ActivatedRoute) | Holds information about the route to this instance of the `HeroDetailComponent`. This component uses the route parameters extracted from the URL. The "id" parameter is the `id` of the hero to show. |
| [`HeroService`](doc:angular-tour-of-heroes-part-4) | Gets hero data from the remote server. This component uses it to get the hero to show. |
| [`location`](https://angular.io/api/common/Location) | An Angular service that interacts with the browser. It lets you navigate back to the previous view. |

### Extract the id route parameter

1. In the `ngOnInit()` [lifecycle hook](https://angular.io/guide/lifecycle-hooks#oninit), call `getHero()` and define it as in the example.

   Example code: `toh-pt5/src/app/hero-detail/hero-detail.component.ts`, region `ngOnInit`.

The `route.snapshot` is a static image of the route information shortly after Angular created the component.

The `paramMap` is a dictionary of route parameter values extracted from the URL. The `"id"` key returns the `id` of the hero to get.

Route parameters are always strings. The JavaScript `Number` function changes the string to a number, which is the correct type for a hero `id`.

The browser refreshes and the application stops with a compiler error, because `HeroService` does not have a `getHero()` method. Add it now.

### Add HeroService.getHero()

1. Open `HeroService` and add the `getHero()` method with the `id`, after the `getHeroes()` method.

   Example code: `toh-pt5/src/app/hero.service.ts`, region `getHero` (getHero).

> **IMPORTANT:** The backtick characters (`` ` ``) define a JavaScript [template literal](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals) that embeds the `id`.

Like [`getHeroes()`](doc:angular-tour-of-heroes-part-4#observable-heroservice), `getHero()` has an asynchronous signature. It returns a *mock hero* as an `Observable` with the RxJS `of()` function.

You can write `getHero()` again as a real `Http` request and not change the `HeroDetailComponent` that calls it.

### Try the detail view

**Result:** The browser refreshes and the application works again. Click a hero in the dashboard or in the heroes list to navigate to the detail view of that hero.

If you paste `localhost:4200/detail/12` in the address bar of the browser, the router navigates to the detail view for the hero with `id: 12`, **Dr Nice**.

### Find the way back

The back button of the browser takes you to the previous page. This can be the hero list or the dashboard view, which opened the detail view. A button on the `HeroDetail` view that does the same is useful.

1. Add a *go back* button to the bottom of the component template and bind it to the `goBack()` method of the component.

   Example code: `toh-pt5/src/app/hero-detail/hero-detail.component.html`, region `back-button` (back button).

2. Add a `goBack()` *method* to the component class. It navigates back one step in the history stack of the browser with the `Location` service that you [injected before](#make-herodetailcomponent-routable).

   Example code: `toh-pt5/src/app/hero-detail/hero-detail.component.ts`, region `goBack` (goBack).

3. Refresh the browser and start to click.

   **Result:** Users can navigate around the application with the new buttons.

The details look better when you add the private CSS styles to `hero-detail.component.css`. Find them in the [final code review](#herodetailcomponent).

## Final code review

These are the code files of this page.

### AppRoutingModule, AppModule, and HeroService

| File | Example code |
| --- | --- |
| `src/app/app.module.ts` | `toh-pt5/src/app/app.module.ts` |
| `src/app/app-routing.module.ts` | `toh-pt5/src/app/app-routing.module.ts` |
| `src/app/hero.service.ts` | `toh-pt5/src/app/hero.service.ts` |

### AppComponent

| File | Example code |
| --- | --- |
| `src/app/app.component.html` | `toh-pt5/src/app/app.component.html` |
| `src/app/app.component.ts` | `toh-pt5/src/app/app.component.ts` |
| `src/app/app.component.css` | `toh-pt5/src/app/app.component.css` |

### DashboardComponent

| File | Example code |
| --- | --- |
| `src/app/dashboard/dashboard.component.html` | `toh-pt5/src/app/dashboard/dashboard.component.html` |
| `src/app/dashboard/dashboard.component.ts` | `toh-pt5/src/app/dashboard/dashboard.component.ts` |
| `src/app/dashboard/dashboard.component.css` | `toh-pt5/src/app/dashboard/dashboard.component.css` |

### HeroesComponent

| File | Example code |
| --- | --- |
| `src/app/heroes/heroes.component.html` | `toh-pt5/src/app/heroes/heroes.component.html` |
| `src/app/heroes/heroes.component.ts` | `toh-pt5/src/app/heroes/heroes.component.ts` |
| `src/app/heroes/heroes.component.css` | `toh-pt5/src/app/heroes/heroes.component.css` |

### HeroDetailComponent

| File | Example code |
| --- | --- |
| `src/app/hero-detail/hero-detail.component.html` | `toh-pt5/src/app/hero-detail/hero-detail.component.html` |
| `src/app/hero-detail/hero-detail.component.ts` | `toh-pt5/src/app/hero-detail/hero-detail.component.ts` |
| `src/app/hero-detail/hero-detail.component.css` | `toh-pt5/src/app/hero-detail/hero-detail.component.css` |

## Summary

- You added the Angular router to navigate among different components.
- You changed the `AppComponent` into a navigation shell with `<a>` links and a `<router-outlet>`.
- You configured the router in an `AppRoutingModule`.
- You defined routes, a redirect route, and a parameterized route.
- You used the `routerLink` directive in anchor elements.
- You changed a tightly coupled main/detail view into a routed detail view.
- You used router link parameters to navigate to the detail view of a hero that the user selected.
- You shared the `HeroService` with other components.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [RouterLink API](https://angular.io/api/router/RouterLink)
- [ActivatedRoute API](https://angular.io/api/router/ActivatedRoute)
- [Location API](https://angular.io/api/common/Location)
- [Interpolation](https://angular.io/guide/interpolation)
- [Lifecycle hooks: ngOnInit](https://angular.io/guide/lifecycle-hooks#oninit)
- [Template literals (MDN)](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals)
- Next: [Angular Tour of Heroes, part 6: Get data from a server](doc:angular-tour-of-heroes-part-6)
