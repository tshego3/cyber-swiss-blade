---
title: Angular Tour of Heroes, part 6: Get data from a server
summary: Use HttpClient and the In-memory Web API to get, add, update, delete, and search heroes, with error handling and RxJS operators.
category: Angular
order: 170
---

# Angular Tour of Heroes, part 6: Get data from a server

In this part, you add data persistence features with the Angular `HttpClient`:

- The `HeroService` gets hero data with HTTP requests.
- Users can add, edit, and delete heroes and save these changes over HTTP.
- Users can search for heroes by name.

## Before you start

- Complete [Angular Tour of Heroes, part 5: Add navigation with routing](doc:angular-tour-of-heroes-part-5).
- To see the code of this part, use the `toh-pt6` live example in the Angular documentation.

## Enable HTTP services

`HttpClient` is the Angular mechanism that communicates with a remote server over HTTP. Make `HttpClient` available in all of the application in 2 steps.

1. Import `HttpClientModule` in the root `AppModule`.

   Example code: `toh-pt6/src/app/app.module.ts`, region `import-http-client` (HttpClientModule import).

2. In the `AppModule`, add `HttpClientModule` to the `imports` array.

   Example code: `toh-pt6/src/app/app.module.ts`, region `import-httpclientmodule` (imports array excerpt).

> **NOTE:** Dated (checked November 2026): `HttpClientModule` is deprecated since Angular 18. Add `provideHttpClient()` to the `providers` array of the `AppModule` (or of the application configuration in a standalone app) instead.

## Simulate a data server

This tutorial sample simulates communication with a remote data server with the [In-memory Web API](https://github.com/angular/angular/tree/main/packages/misc/angular-in-memory-web-api) module.

After you install the module, the application sends requests to the `HttpClient` and receives responses from it. The application does not know that the *In-memory Web API* intercepts those requests, applies them to an in-memory data store, and returns simulated responses.

With the In-memory Web API, you do not have to set up a server to learn about `HttpClient`.

> **IMPORTANT:** The In-memory Web API module is not related to HTTP in Angular. If you read this tutorial to learn about `HttpClient`, you can [skip this step](#heroes-and-http). If you write the code as you read this tutorial, add the In-memory Web API now.

1. Install the In-memory Web API package from npm:

   ```bash
   npm install angular-in-memory-web-api --save
   ```

2. Generate the class `src/app/in-memory-data.service.ts`:

   ```bash
   ng generate service InMemoryData
   ```

3. Replace the default contents of `in-memory-data.service.ts` with the example.

   Example code: `toh-pt6/src/app/in-memory-data.service.ts`, region `init`.

4. In the `AppModule`, import the `HttpClientInMemoryWebApiModule` and the `InMemoryDataService` class.

   Example code: `toh-pt6/src/app/app.module.ts`, region `import-in-mem-stuff` (In-memory Web API imports).

5. After the `HttpClientModule`, add the `HttpClientInMemoryWebApiModule` to the `AppModule` `imports` array. Configure it with the `InMemoryDataService`.

   Example code: `toh-pt6/src/app/app.module.ts`, region `in-mem-web-api-imports` (imports array excerpt).

The `forRoot()` configuration method takes an `InMemoryDataService` class that fills the in-memory database.

The `in-memory-data.service.ts` file replaces the function of `mock-heroes.ts`. Do not delete `mock-heroes.ts` yet. You need it for some more steps of this tutorial.

When the real server is ready, remove the In-memory Web API, so that the requests of the application go through to the server.

## Heroes and HTTP

1. In the `HeroService`, import `HttpClient` and `HttpHeaders`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `import-httpclient` (import HTTP symbols).

2. In the `HeroService`, inject `HttpClient` into the constructor in a private property named `http`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `ctor`.

3. Keep the injection of the `MessageService`. Your application calls it frequently, so wrap it in a private `log()` method.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `log`.

4. Define the `heroesUrl` in the form `:base/:collectionName`, with the address of the heroes resource on the server. Here, `base` is the resource that receives the requests, and `collectionName` is the heroes data object in `in-memory-data-service.ts`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `heroesUrl`.

### Get heroes with HttpClient

The current `HeroService.getHeroes()` uses the RxJS `of()` function to return an array of mock heroes as an `Observable<Hero[]>`.

Example code: `toh-pt4/src/app/hero.service.ts`, region `getHeroes-1` (getHeroes with RxJs `of()`).

1. Change that method to use `HttpClient`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `getHeroes-1`.

2. Refresh the browser.

   **Result:** The hero data loads from the mock server.

You replaced `of()` with `http.get()`, and the application continues to work with no other changes, because the 2 functions return an `Observable<Hero[]>`.

### HttpClient methods return one value

All `HttpClient` methods return an RxJS `Observable` of something.

HTTP is a request/response protocol. You send a request, and it returns a single response.

Usually, an observable *can* return more than one value over time. An observable from `HttpClient` always emits a single value and then completes. It does not emit again.

This call to `HttpClient.get()` returns an `Observable<Hero[]>`, which is *an observable of hero arrays*. In practice, it returns only a single hero array.

### HttpClient.get() returns response data

By default, `HttpClient.get()` returns the body of the response as an untyped JSON object. The optional type specifier, `<Hero[]>`, adds TypeScript capabilities, which reduce errors during compile time.

The data API of the server sets the shape of the JSON data. The *Tour of Heroes* data API returns the hero data as an array.

> **NOTE:** Other APIs can put the data that you want deep in an object. Then you must extract that data from the `Observable` result with the RxJS `map()` operator. This tutorial does not discuss it, but the `getHeroNo404()` method in the sample source code has an example of `map()`.

### Error handling

Errors occur, especially when you get data from a remote server. The `HeroService.getHeroes()` method must catch errors and do something applicable.

To catch errors, **"pipe" the observable** result from `http.get()` through an RxJS `catchError()` operator.

1. Import the `catchError` symbol from `rxjs/operators`, together with some other operators that you use later.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `import-rxjs-operators`.

2. Extend the observable result with the `pipe()` method and give it a `catchError()` operator.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `getHeroes-2`.

> **NOTE:** Dated (checked November 2026): since RxJS 7.2, you can import the operators directly from `rxjs`. The `rxjs/operators` path still works.

The `catchError()` operator intercepts an **`Observable` that failed**. Then the operator passes the error to the error handling function.

The `handleError()` method below reports the error and then returns a harmless result, so that the application continues to work.

#### handleError

Many `HeroService` methods can share this `handleError()`, so it is general enough for their different needs.

It does not handle the error directly. It returns an error handler function to `catchError`. You configure this function with the name of the operation that failed and a safe return value.

Example code: `toh-pt6/src/app/hero.service.ts`, region `handleError`.

After the handler reports the error to the console, it makes a friendly message and returns a safe value, so that the application continues to work.

Each service method returns a different kind of `Observable` result. Thus `handleError()` takes a type parameter, so that it returns the safe value as the type that the application expects.

### Tap into the Observable

The `getHeroes()` method taps into the flow of observable values. It sends a message with the `log()` method to the message area at the bottom of the page.

The RxJS `tap()` operator gives this ability. It looks at the observable values, does something with those values, and passes them along. The `tap()` callback does not access the values themselves.

The final version of `getHeroes()`, with the `tap()` that logs the operation, is in the example code: `toh-pt6/src/app/hero.service.ts`, region `getHeroes`.

### Get hero by id

Most web APIs support a *get by id* request in the form `:baseURL/:id`.

Here, the *base URL* is the `heroesURL` that you defined in [Heroes and HTTP](#heroes-and-http) (`api/heroes`), and *id* is the number of the hero that you want to get. For example, `api/heroes/11`.

1. Update the `getHero()` method of the `HeroService` to make that request.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `getHero`.

`getHero()` has 3 important differences from `getHeroes()`:

- `getHero()` makes a request URL with the id of the hero that you want.
- The server responds with a single hero, not an array of heroes.
- `getHero()` returns an `Observable<Hero>`, which is an observable of `Hero` *objects*, not an observable of `Hero` *arrays*.

## Update heroes

Edit the name of a hero in the hero detail view. As you type, the hero name updates the heading at the top of the page. But when you click **Go back**, your changes are lost.

To keep the changes, you must write them back to the server.

1. At the end of the hero detail template, add a save button with a `click` event binding. The binding calls a new component method named `save()`.

   Example code: `toh-pt6/src/app/hero-detail/hero-detail.component.html`, region `save`.

2. In the `HeroDetail` component class, add the `save()` method. It saves the hero name changes with the `updateHero()` method of the hero service and then navigates back to the previous view.

   Example code: `toh-pt6/src/app/hero-detail/hero-detail.component.ts`, region `save`.

### Add HeroService.updateHero()

The structure of the `updateHero()` method is similar to `getHeroes()`, but it uses `http.put()` to save the changed hero on the server.

1. Add the `updateHero()` method to the `HeroService`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `updateHero` (update).

   The `HttpClient.put()` method takes 3 parameters:

   - The URL.
   - The data to update, which is the changed hero here.
   - Options.

   The URL does not change. The heroes web API looks at the `id` of the hero to know which hero to update.

   The heroes web API expects a special header in HTTP save requests. That header is in the `httpOptions` constant in the `HeroService`.

2. Add the `httpOptions` constant to the `HeroService` class.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `http-options`.

3. Refresh the browser, change a hero name, and save your change.

   **Result:** The `save()` method in `HeroDetailComponent` navigates to the previous view. The hero shows in the list with the changed name.

## Add a new hero

To add a hero, this application needs only the name of the hero. Use an `<input>` element together with an add button.

1. Put the add elements into the `HeroesComponent` template, after the heading.

   Example code: `toh-pt6/src/app/heroes/heroes.component.html`, region `add`.

2. Add the click handler, `add()`, to the `HeroesComponent` class. In response to a click event, the template calls `add()` and then clears the input field, so that it is ready for another name.

   Example code: `toh-pt6/src/app/heroes/heroes.component.ts`, region `add`.

   When the name is not blank, the handler creates an object based on the name of the hero. The handler passes the object to the `addHero()` method of the service. When `addHero()` creates a new object, the `subscribe()` callback receives the new hero and pushes it into the `heroes` list for display.

3. Add the `addHero()` method to the `HeroService` class.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `addHero` (addHero).

4. Refresh the browser and add some heroes.

`addHero()` is different from `updateHero()` in 2 ways:

- It calls `HttpClient.post()`, not `put()`.
- It expects the server to create an id for the new hero. The server returns the id in the `Observable<Hero>` to the caller.

## Delete a hero

Each hero in the heroes list must have a delete button.

1. Add the button element to the `HeroesComponent` template, after the hero name in the repeated `<li>` element.

   Example code: `toh-pt6/src/app/heroes/heroes.component.html`, region `delete`.

   The HTML for the list of heroes is now as in the example code: `toh-pt6/src/app/heroes/heroes.component.html`, region `list` (list of heroes).

2. To put the delete button at the far right of the hero entry, add some CSS from the [final code review](#heroescomponent) to `heroes.component.css`.
3. Add the `delete()` handler to the component class.

   Example code: `toh-pt6/src/app/heroes/heroes.component.ts`, region `delete`.

   The component gives hero deletion to the `HeroService`, but it stays responsible for the update of its own list of heroes. The `delete()` method of the component immediately removes the *hero to delete* from that list. It expects that the `HeroService` operation on the server is successful.

   The component has no use for the `Observable` that `heroService.deleteHero()` returns, **but it must subscribe to it**.

4. Add a `deleteHero()` method to `HeroService`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `deleteHero` (delete).

5. Refresh the browser and try the new delete function.

Key points:

- `deleteHero()` calls `HttpClient.delete()`.
- The URL is the URL of the heroes resource plus the `id` of the hero to delete.
- You do not send data as you did with `put()` and `post()`.
- You still send the `httpOptions`.

> **IMPORTANT:** If you do not call `subscribe()`, the service does not send the delete request to the server. As a rule, an `Observable` *does nothing* until something subscribes. To see this, remove the `subscribe()` temporarily, click **Dashboard**, and then click **Heroes**. The full list of heroes shows again.

## Search by name

In this last exercise, you chain `Observable` operators together. This decreases the number of similar HTTP requests and uses less network bandwidth.

### Add a heroes search feature to the dashboard

As the user types a name into a search box, your application sends repeated HTTP requests for heroes filtered by that name. The goal is to send only as many requests as necessary.

#### HeroService.searchHeroes()

1. Add a `searchHeroes()` method to the `HeroService`.

   Example code: `toh-pt6/src/app/hero.service.ts`, region `searchHeroes`.

If there is no search term, the method immediately returns an empty array. The rest of the method is almost the same as `getHeroes()`. The only important difference is the URL, which includes a query string with the search term.

### Add search to the dashboard

1. Open the `DashboardComponent` template and add the hero search element, `<app-hero-search>`, to the bottom of the markup.

   Example code: `toh-pt6/src/app/dashboard/dashboard.component.html`.

This template is similar to the `*ngFor` repeater in the `HeroesComponent` template.

For this to work, you must add a component with a selector that matches `<app-hero-search>`.

### Create HeroSearchComponent

1. Run `ng generate` to create a `HeroSearchComponent`:

   ```bash
   ng generate component hero-search
   ```

   **Result:** `ng generate` creates the 3 `HeroSearchComponent` files and adds the component to the `AppModule` declarations.

2. Replace the `HeroSearchComponent` template with an `<input>` and a list of matching search results.

   Example code: `toh-pt6/src/app/hero-search/hero-search.component.html`.

3. Add private CSS styles to `hero-search.component.css`. Find them in the [final code review](#herosearchcomponent).

As the user types in the search box, an input event binding calls the `search()` method of the component with the new search box value.

### AsyncPipe

The `*ngFor` repeats hero objects. The `*ngFor` iterates over a list named `heroes$`, not `heroes`. The `$` is a convention that shows that `heroes$` is an `Observable`, not an array.

Example code: `toh-pt6/src/app/hero-search/hero-search.component.html`, region `async`.

`*ngFor` cannot do anything with an `Observable`. Thus, use the pipe character (`|`) followed by `async`. This identifies the Angular `AsyncPipe`, which subscribes to an `Observable` automatically, so you do not have to do it in the component class.

### Edit the HeroSearchComponent class

1. Replace the `HeroSearchComponent` class and metadata with the example.

   Example code: `toh-pt6/src/app/hero-search/hero-search.component.ts`.

The class declares `heroes$` as an `Observable`. Example code: `toh-pt6/src/app/hero-search/hero-search.component.ts`, region `heroes-stream`.

You set it in [`ngOnInit()`](#chain-rxjs-operators). Before you do that, look at the definition of `searchTerms`.

### The searchTerms RxJS subject

The `searchTerms` property is an RxJS `Subject`.

Example code: `toh-pt6/src/app/hero-search/hero-search.component.ts`, region `searchTerms`.

A `Subject` is a source of observable values and also an `Observable` itself. You can subscribe to a `Subject` as to any `Observable`.

You can also push values into that `Observable` with its `next(value)` method, as the `search()` method does.

The event binding to the `input` event of the text box calls the `search()` method.

Example code: `toh-pt6/src/app/hero-search/hero-search.component.html`, region `input`.

Each time the user types in the text box, the binding calls `search()` with the text box value as a *search term*. The `searchTerms` becomes an `Observable` that emits a steady stream of search terms.

### Chain RxJS operators

If you pass each new search term directly to `searchHeroes()` after each keystroke, the application sends too many HTTP requests. This puts load on server resources and uses up data plans.

Instead, the `ngOnInit()` method pipes the `searchTerms` observable through a sequence of RxJS operators that decrease the number of calls to `searchHeroes()`. The result is an observable of timely hero search results, each of which is a `Hero[]`.

Example code: `toh-pt6/src/app/hero-search/hero-search.component.ts`, region `search`.

| Operator | What it does |
| --- | --- |
| `debounceTime(300)` | Waits until the flow of new string events pauses for 300 ms, then passes along the latest string. Requests do not occur more frequently than each 300 ms. |
| `distinctUntilChanged()` | Makes sure that the application sends a request only if the filter text changed. |
| `switchMap()` | Calls the search service for each search term that gets through `debounceTime()` and `distinctUntilChanged()`. It cancels and discards previous search observables, and returns only the latest search service observable. |

> **NOTE:** With the [`switchMap` operator](https://www.learnrxjs.io/learn-rxjs/operators/transformation/switchmap), each qualifying key event can cause an `HttpClient.get()` method call. Even with a 300 ms pause between requests, many HTTP requests can be in progress, and they can return in a different order. `switchMap()` does not keep the request order. It returns only the observable from the most recent HTTP method call, and it cancels and discards the results from earlier calls. Thus a late response to an earlier request never replaces the latest results.

> **NOTE:** When you cancel a previous `searchHeroes()` Observable, the pending HTTP request does not stop. The application discards unwanted results before they get to your application code.

The component *class* does not subscribe to the `heroes$` *observable*. The [`AsyncPipe`](#asyncpipe) in the template does that.

### Try the search

1. Run the application again.
2. In the *Dashboard*, enter some text in the search box.
3. Enter characters that match existing hero names.

   **Result:** The search results show, similar to this:

   ![Hero Search field with the letters 'm' and 'a' along with four search results that match the query displayed in a list beneath the search input](https://angular.io/generated/images/guide/toh/toh-hero-search.gif)

## Final code review

These are the code files of this page. They are in the `src/app/` directory.

### HeroService, InMemoryDataService, AppModule

| File | Example code |
| --- | --- |
| `hero.service.ts` | `toh-pt6/src/app/hero.service.ts` |
| `in-memory-data.service.ts` | `toh-pt6/src/app/in-memory-data.service.ts` |
| `app.module.ts` | `toh-pt6/src/app/app.module.ts` |

### HeroesComponent

| File | Example code |
| --- | --- |
| `heroes/heroes.component.html` | `toh-pt6/src/app/heroes/heroes.component.html` |
| `heroes/heroes.component.ts` | `toh-pt6/src/app/heroes/heroes.component.ts` |
| `heroes/heroes.component.css` | `toh-pt6/src/app/heroes/heroes.component.css` |

### HeroDetailComponent

| File | Example code |
| --- | --- |
| `hero-detail/hero-detail.component.html` | `toh-pt6/src/app/hero-detail/hero-detail.component.html` |
| `hero-detail/hero-detail.component.ts` | `toh-pt6/src/app/hero-detail/hero-detail.component.ts` |
| `hero-detail/hero-detail.component.css` | `toh-pt6/src/app/hero-detail/hero-detail.component.css` |

### DashboardComponent

| File | Example code |
| --- | --- |
| `dashboard/dashboard.component.html` | `toh-pt6/src/app/dashboard/dashboard.component.html` |
| `dashboard/dashboard.component.ts` | `toh-pt6/src/app/dashboard/dashboard.component.ts` |
| `dashboard/dashboard.component.css` | `toh-pt6/src/app/dashboard/dashboard.component.css` |

### HeroSearchComponent

| File | Example code |
| --- | --- |
| `hero-search/hero-search.component.html` | `toh-pt6/src/app/hero-search/hero-search.component.html` |
| `hero-search/hero-search.component.ts` | `toh-pt6/src/app/hero-search/hero-search.component.ts` |
| `hero-search/hero-search.component.css` | `toh-pt6/src/app/hero-search/hero-search.component.css` |

## Summary

- You added the necessary dependencies to use HTTP in the application.
- You changed `HeroService` to load heroes from a web API.
- You extended `HeroService` to support `post()`, `put()`, and `delete()` methods.
- You updated the components so that users can add, edit, and delete heroes.
- You configured an in-memory web API.
- You learned how to use observables.

This is the end of the "Tour of Heroes" tutorial. To learn more about Angular development, read the fundamentals section. Start with the [Architecture](https://angular.io/guide/architecture) guide.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [In-memory Web API](https://github.com/angular/angular/tree/main/packages/misc/angular-in-memory-web-api)
- [switchMap operator (Learn RxJS)](https://www.learnrxjs.io/learn-rxjs/operators/transformation/switchmap)
- [Architecture overview](https://angular.io/guide/architecture)
- Next: this is the last part. Go back to the [series overview](doc:angular-tour-of-heroes) or read the [Angular cheat sheet](doc:angular-cheatsheet).
