---
title: Angular Tour of Heroes, part 4: Add services
summary: Create an injectable HeroService that returns an Observable, inject it into components, and show app messages with a MessageService.
category: Angular
order: 150
gist: eabb3f133b8a7fb6fd139763edcae064
source: toh-pt4.md
---

# Angular Tour of Heroes, part 4: Add services

The Tour of Heroes `HeroesComponent` gets and shows fake data. In this part, you change the `HeroesComponent` so that it only supports the view. This also makes it easier to unit-test the component with a mock service.

## Before you start

- Complete [Angular Tour of Heroes, part 3: Create a feature component](doc:angular-tour-of-heroes-part-3).
- To see the code of this part, use the `toh-pt4` live example in the Angular documentation.

## Why services

Components must not get or save data directly, and they must not knowingly show fake data. Components show data and give data access to a service.

In this part, you create a `HeroService` that all application classes can use to get heroes. Do not create that service with the [`new` keyword](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/new). Use Angular [*dependency injection*](https://angular.io/guide/dependency-injection) to inject it into the `HeroesComponent` constructor.

Services are a good way to share information among classes that *do not know each other*. Next, you create a `HeroService` and inject it in the `HeroesComponent` to supply hero data.

## Create the HeroService

1. Run `ng generate` to create a service named `hero`:

   ```bash
   ng generate service hero
   ```

   **Result:** The command generates a skeleton `HeroService` class in `src/app/hero.service.ts`. Example code: `toh-pt4/src/app/hero.service.1.ts`, region `new`.

### @Injectable() services

The new service imports the Angular `Injectable` symbol and annotates the class with the `@Injectable()` decorator. This marks the class as a participant in the *dependency injection system*. The `HeroService` class supplies an injectable service, and it can also have its own injected dependencies. It does not have dependencies yet.

The `@Injectable()` decorator accepts a metadata object for the service, the same as the `@Component()` decorator for your component classes.

### Get hero data

The `HeroService` can get hero data from any source, for example a web service, local storage, or a mock data source.

When you remove data access from components, you can change the implementation at any time and not change the components. The components do not know how the service works.

The implementation in *this* tutorial continues to supply *mock heroes*.

1. Import `Hero` and `HEROES`.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `import-heroes`.

2. Add a `getHeroes` method that returns the *mock heroes*.

   Example code: `toh-pt4/src/app/hero.service.1.ts`, region `getHeroes`.

## Provide the HeroService

Before Angular can *inject* the `HeroService` into the `HeroesComponent`, you must make the service available to the dependency injection system. To do this, register a *provider*. A provider creates or delivers a service. Here, it instantiates the `HeroService` class to supply the service.

Register the provider with the *injector*. The *injector* is the object that selects the provider and injects it where the application requires it.

By default, `ng generate service` registers a provider with the *root injector* for your service. It adds provider metadata, `providedIn: 'root'`, to the `@Injectable()` decorator:

```ts
@Injectable({
  providedIn: 'root',
})
```

When you provide the service at the root level, Angular creates one shared instance of `HeroService` and injects it into each class that asks for it. When you register the provider in the `@Injectable` metadata, Angular can also optimize the application: it removes the service if no class uses it.

> **NOTE:** To learn more about providers, see the [Providers section](https://angular.io/guide/providers). To learn more about injectors, see the [Dependency Injection guide](https://angular.io/guide/dependency-injection).

The `HeroService` is now ready to connect to the `HeroesComponent`.

> **IMPORTANT:** This is an interim code sample that lets you provide and use the `HeroService`. At this point, the code is different from the `HeroService` in the [final code review](#final-code-review).

## Update HeroesComponent

1. Open the `HeroesComponent` class file.
2. Delete the `HEROES` import, because you do not need it anymore. Import the `HeroService` instead.

   Example code: `toh-pt4/src/app/heroes/heroes.component.ts`, region `hero-service-import`.

3. Replace the definition of the `heroes` property with a declaration.

   Example code: `toh-pt4/src/app/heroes/heroes.component.ts`, region `heroes`.

### Inject the HeroService

1. Add a private `heroService` parameter of the type `HeroService` to the constructor.

   Example code: `toh-pt4/src/app/heroes/heroes.component.1.ts`, region `ctor`.

The parameter defines a private `heroService` property and also identifies it as a `HeroService` injection site.

When Angular creates a `HeroesComponent`, the [Dependency Injection](https://angular.io/guide/dependency-injection) system sets the `heroService` parameter to the singleton instance of `HeroService`.

### Add getHeroes()

1. Create a method that gets the heroes from the service.

   Example code: `toh-pt4/src/app/heroes/heroes.component.1.ts`, region `getHeroes`.

### Call it in ngOnInit()

You can call `getHeroes()` in the constructor, but that is not the best practice.

Use the constructor only for minimal initialization, for example to connect constructor parameters to properties. The constructor must not *do anything* more. It must not call a function that makes HTTP requests to a remote server, as a *real* data service does.

1. Call `getHeroes()` in the [*ngOnInit lifecycle hook*](https://angular.io/guide/lifecycle-hooks). Angular calls `ngOnInit()` at an applicable time *after* it constructs a `HeroesComponent` instance.

   Example code: `toh-pt4/src/app/heroes/heroes.component.ts`, region `ng-on-init`.

**Result:** After the browser refreshes, the application runs as before. It shows a list of heroes, and a hero detail view when you click a hero name.

## Observable data

The `HeroService.getHeroes()` method has a *synchronous signature*. This means that the `HeroService` can get heroes synchronously. The `HeroesComponent` uses the `getHeroes()` result as if it can get the heroes synchronously.

Example code: `toh-pt4/src/app/heroes/heroes.component.1.ts`, region `get-heroes`.

This approach does not work in a real application that uses asynchronous calls. It works now only because your service returns *mock heroes* synchronously.

If `getHeroes()` cannot return the hero data immediately, it must not be synchronous, because that blocks the browser while it waits for the data.

`HeroService.getHeroes()` must have an *asynchronous signature*. In this tutorial, `HeroService.getHeroes()` returns an `Observable`, because it will use the Angular `HttpClient.get` method to get the heroes, and [`HttpClient.get()`](https://angular.io/guide/understanding-communicating-with-http) returns an `Observable`.

### Observable HeroService

`Observable` is one of the key classes in the [RxJS library](https://rxjs.dev).

In [part 6](doc:angular-tour-of-heroes-part-6), you see that the Angular `HttpClient` methods return RxJS `Observable` objects. In this part, you simulate data from the server with the RxJS `of()` function.

1. Open the `HeroService` file and import the `Observable` and `of` symbols from RxJS.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `import-observable`.

2. Replace the `getHeroes()` method with the version in the example.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `getHeroes-1`.

`of(HEROES)` returns an `Observable<Hero[]>` that emits *a single value*, the array of mock heroes.

> **NOTE:** [Part 6](doc:angular-tour-of-heroes-part-6) shows how to call `HttpClient.get<Hero[]>()`. That method also returns an `Observable<Hero[]>` that emits *a single value*: an array of heroes from the body of the HTTP response.

### Subscribe in HeroesComponent

The `HeroService.getHeroes` method returned a `Hero[]` before. Now it returns an `Observable<Hero[]>`. You must change the `HeroesComponent` to work with this change.

1. Find the `getHeroes` method and replace it with the new code. This table gives the new and the current version for comparison.

| Version | Example code |
| --- | --- |
| New (Observable) | `toh-pt4/src/app/heroes/heroes.component.ts`, region `getHeroes` |
| Original | `toh-pt4/src/app/heroes/heroes.component.1.ts`, region `getHeroes` |

`Observable.subscribe()` is the critical difference.

The previous version assigns an array of heroes to the `heroes` property of the component. The assignment occurs *synchronously*, as if the server can return heroes immediately, or the browser can freeze the UI while it waits for the server response.

That *does not work* when the `HeroService` sends requests to a remote server.

The new version waits for the `Observable` to emit the array of heroes. This can occur now or several minutes from now. The `subscribe()` method passes the emitted array to the callback, which sets the `heroes` property of the component.

This asynchronous approach *works* when the `HeroService` requests heroes from the server.

## Show messages

In this section, you:

- Add a `MessagesComponent` that shows application messages at the bottom of the screen.
- Create an injectable, application-wide `MessageService` that sends messages to show.
- Inject `MessageService` into the `HeroService`.
- Show a message when `HeroService` gets heroes successfully.

### Create MessagesComponent

1. Use `ng generate` to create the `MessagesComponent`:

   ```bash
   ng generate component messages
   ```

   **Result:** `ng generate` creates the component files in the `src/app/messages` directory and declares the `MessagesComponent` in `AppModule`.

2. Edit the `AppComponent` template to show the `MessagesComponent`.

   Example code: `toh-pt4/src/app/app.component.html`.

   **Result:** The default paragraph from `MessagesComponent` shows at the bottom of the page.

### Create the MessageService

1. Use `ng generate` to create the `MessageService` in `src/app`:

   ```bash
   ng generate service message
   ```

2. Open `MessageService` and replace its contents with the example.

   Example code: `toh-pt4/src/app/message.service.ts`.

The service exposes its cache of `messages` and 2 methods:

- One method to `add()` a message to the cache.
- One method to `clear()` the cache.

### Inject it into the HeroService

1. In `HeroService`, import the `MessageService`.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `import-message-service`.

2. Edit the constructor. Add a parameter that declares a private `messageService` property. Angular injects the singleton `MessageService` into that property when it creates the `HeroService`.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `ctor`.

> **NOTE:** This is a typical *service-in-service* scenario. You inject the `MessageService` into the `HeroService`, and Angular injects the `HeroService` into the `HeroesComponent`.

### Send a message from HeroService

1. Edit the `getHeroes()` method to send a message when it gets the heroes.

   Example code: `toh-pt4/src/app/hero.service.ts`, region `getHeroes`.

### Show the message from HeroService

The `MessagesComponent` must show all messages, including the message that the `HeroService` sends when it gets heroes.

1. Open `MessagesComponent` and import the `MessageService`.

   Example code: `toh-pt4/src/app/messages/messages.component.ts`, region `import-message-service`.

2. Edit the constructor. Add a parameter that declares a **public** `messageService` property. Angular injects the singleton `MessageService` into that property when it creates the `MessagesComponent`.

   Example code: `toh-pt4/src/app/messages/messages.component.ts`, region `ctor`.

The `messageService` property **must be public**, because you bind to it in the template.

> **IMPORTANT:** Angular binds only to *public* component properties.

### Bind to the MessageService

1. Replace the `MessagesComponent` template that `ng generate` created with the example.

   Example code: `toh-pt4/src/app/messages/messages.component.html`.

This template binds directly to the `messageService` of the component.

| Item | Details |
| --- | --- |
| `*ngIf` | Shows the messages area only if there are messages to show. |
| `*ngFor` | Shows the list of messages in repeated `<div>` elements. |
| Angular [event binding](https://angular.io/guide/event-binding) | Binds the click event of the button to `MessageService.clear()`. |

The messages look better after you add the private CSS styles to `messages.component.css`. Find them in the [final code review](#final-code-review).

## Add MessageService to HeroesComponent

This example shows a history of each time the user clicks a hero. This helps in the next part, [Routing](doc:angular-tour-of-heroes-part-5).

Example code: `toh-pt4/src/app/heroes/heroes.component.ts` (file `src/app/heroes/heroes.component.ts`).

1. Refresh the browser to see the list of heroes.
2. Scroll to the bottom to see the messages from the `HeroService`.

   **Result:** Each time you click a hero, a new message records the selection.

3. Use the **Clear messages** button to clear the message history.

## Final code review

These are the code files of this page:

| File | Example code |
| --- | --- |
| `src/app/hero.service.ts` | `toh-pt4/src/app/hero.service.ts` |
| `src/app/message.service.ts` | `toh-pt4/src/app/message.service.ts` |
| `src/app/heroes/heroes.component.ts` | `toh-pt4/src/app/heroes/heroes.component.ts` |
| `src/app/messages/messages.component.ts` | `toh-pt4/src/app/messages/messages.component.ts` |
| `src/app/messages/messages.component.html` | `toh-pt4/src/app/messages/messages.component.html` |
| `src/app/messages/messages.component.css` | `toh-pt4/src/app/messages/messages.component.css` |
| `src/app/app.module.ts` | `toh-pt4/src/app/app.module.ts` |
| `src/app/app.component.html` | `toh-pt4/src/app/app.component.html` |

## Summary

- You moved data access to the `HeroService` class.
- You registered the `HeroService` as the *provider* of its service at the root level, so that Angular can inject it anywhere in the application.
- You used [Angular Dependency Injection](https://angular.io/guide/dependency-injection) to inject it into a component.
- You gave the `get data` method of the `HeroService` an asynchronous signature.
- You learned about `Observable` and the RxJS `Observable` library.
- You used RxJS `of()` to return `Observable<Hero[]>`, an observable of mock heroes.
- The `ngOnInit` lifecycle hook of the component calls the `HeroService` method, not the constructor.
- You created a `MessageService` for loosely coupled communication between classes.
- The `HeroService` that Angular injects into a component gets another injected service, `MessageService`.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [The new operator (MDN)](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/new)
- [Dependency injection](https://angular.io/guide/dependency-injection)
- [Providers](https://angular.io/guide/providers)
- [Lifecycle hooks](https://angular.io/guide/lifecycle-hooks)
- [Communicating with backend services using HTTP](https://angular.io/guide/understanding-communicating-with-http)
- [RxJS](https://rxjs.dev)
- Next: [Angular Tour of Heroes, part 5: Add navigation with routing](doc:angular-tour-of-heroes-part-5)
