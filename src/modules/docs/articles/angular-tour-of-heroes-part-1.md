---
title: Angular Tour of Heroes, part 1: The hero editor
summary: Create the HeroesComponent, show a Hero object, format it with UppercasePipe, and edit it with two-way binding and FormsModule.
category: Angular
order: 120
gist: eabb3f133b8a7fb6fd139763edcae064
source: toh-pt1.md
---

# Angular Tour of Heroes, part 1: The hero editor

The application now has a basic title. In this part, you create a new component that shows hero information, and you put that component in the application shell.

## Before you start

- Complete [Angular Tour of Heroes, part 0: Create a new project](doc:angular-tour-of-heroes-part-0).
- To see the code of this part, use the `toh-pt1` live example in the Angular documentation.

## Create the heroes component

1. Use `ng generate` to create a new component named `heroes`:

   ```bash
   ng generate component heroes
   ```

   **Result:** `ng generate` creates a new directory, `src/app/heroes/`, and generates the 3 files of the `HeroesComponent` and a test file.

The initial `HeroesComponent` class file is in the example code: `toh-pt1/src/app/heroes/heroes.component.ts`, region `v1`.

You always import the `Component` symbol from the Angular core library and annotate the component class with `@Component`. `@Component` is a decorator function that specifies the Angular metadata for the component.

`ng generate` created 3 metadata properties:

| Property | Details |
| --- | --- |
| `selector` | The CSS element selector of the component. |
| `templateUrl` | The location of the template file of the component. |
| `styleUrls` | The location of the private CSS styles of the component. |

The [CSS element selector](https://developer.mozilla.org/docs/Web/CSS/Type_selectors), `'app-heroes'`, matches the name of the HTML element that identifies this component in the template of a parent component.

Always `export` the component class, so that you can `import` it in other places, for example in the `AppModule`.

### Add a hero property

1. Add a `hero` property to the `HeroesComponent` for a hero named `Windstorm`.

   Example code: `toh-pt1/src/app/heroes/heroes.component.ts`, region `add-hero`.

### Show the hero

1. Open the `heroes.component.html` template file.
2. Delete the default text that `ng generate` created. Replace it with a data binding to the new `hero` property.

   Example code: `toh-pt1/src/app/heroes/heroes.component.1.html`, region `show-hero-1`.

## Show the HeroesComponent view

To show the `HeroesComponent`, you must add it to the template of the shell `AppComponent`. The element selector of the `HeroesComponent` is `app-heroes` (see [Create the heroes component](#create-the-heroes-component)).

1. Add an `<app-heroes>` element to the `AppComponent` template file, immediately below the title.

   Example code: `toh-pt1/src/app/app.component.html`.

**Result:** If `ng serve` is still running, the browser refreshes and shows the application title and the name of the hero.

## Create a Hero interface

A real hero is more than a name.

1. Create a `Hero` interface in its own file in the `src/app` directory. Give it `id` and `name` properties.

   Example code: `toh-pt1/src/app/hero.ts` (file `src/app/hero.ts`).

2. Go back to the `HeroesComponent` class and import the `Hero` interface.
3. Change the `hero` property of the component to the type `Hero`. Initialize it with an `id` of `1` and the name `Windstorm`.

   Example code for the revised class file: `toh-pt1/src/app/heroes/heroes.component.ts`.

The page does not show correctly now, because you changed the hero from a string to an object.

## Show the hero object

1. Update the binding in the template. Show the name of the hero, and show `id` and `name` in a details display.

   Example code: `toh-pt1/src/app/heroes/heroes.component.1.html`, region `show-hero-2`.

**Result:** The browser refreshes and shows the hero information.

## Format with the UppercasePipe

1. Edit the `hero.name` binding as shown in the example.

   Example code: `toh-pt1/src/app/heroes/heroes.component.html`, region `pipe`.

**Result:** The browser refreshes and shows the name of the hero in capital letters.

The word `uppercase` in the interpolation binding, after the pipe character (`|`), activates the built-in `UppercasePipe`.

[Pipes](https://angular.io/guide/pipes-overview) format strings, currency amounts, dates, and other display data. Angular has several built-in pipes, and you can create your own pipes.

## Edit the hero

Users must be able to edit the name of the hero in an `<input>` text box. The text box must *show* the `name` property of the hero and *update* that property as the user types. Data flows from the component class *to the screen*, and from the screen *back to the class*.

To make this data flow automatic, set up a two-way data binding between the `<input>` form element and the `hero.name` property.

### Two-way binding

1. Change the details area in the `HeroesComponent` template as shown in the example.

   Example code: `toh-pt1/src/app/heroes/heroes.component.1.html`, region `name-input`.

`[(ngModel)]` is the Angular two-way data binding syntax. Here, it binds the `hero.name` property to the HTML text box, so that data flows *in the two directions*: from the `hero.name` property to the text box, and from the text box back to `hero.name`.

### The missing FormsModule

The application stopped working when you added `[(ngModel)]`. To see the error, open the browser development tools and look in the console for a message like this:

```text
Template parse errors:
Can't bind to 'ngModel' since it isn't a known property of 'input'.
```

`ngModel` is a valid Angular directive, but it is not available by default. It belongs to the optional `FormsModule`, and you must *opt in* to use it.

## AppModule

Angular must know how the parts of your application fit together and which other files and libraries the application requires. This information is called *metadata*.

Some of the metadata is in the `@Component` decorators that you added to your component classes. Other critical metadata is in [`@NgModule`](https://angular.io/guide/ngmodules) decorators.

The most important `@NgModule` decorator annotates the top-level **AppModule** class. `ng new` created an `AppModule` class in `src/app/app.module.ts` when it created the project. You *opt in* to the `FormsModule` in this class.

### Import FormsModule

1. Open `app.module.ts` and import the `FormsModule` symbol from the `@angular/forms` library.

   Example code: `toh-pt1/src/app/app.module.ts`, region `formsmodule-js-import`.

2. Add `FormsModule` to the `imports` array in `@NgModule`. The `imports` array contains the list of external modules that the application needs.

   Example code: `toh-pt1/src/app/app.module.ts`, region `ng-imports`.

**Result:** When the browser refreshes, the application works again. You can edit the name of the hero and see the changes immediately in the `<h2>` above the text box.

### Declare HeroesComponent

You must declare each component in *exactly one* [NgModule](https://angular.io/guide/ngmodules).

You did not declare the `HeroesComponent`, but the application worked. The reason is that `ng generate` declared `HeroesComponent` in `AppModule` when it created that component.

1. Open `src/app/app.module.ts` and find the `HeroesComponent` import near the top.

   Example code: `toh-pt1/src/app/app.module.ts`, region `heroes-import`.

2. Find the `HeroesComponent` in the `@NgModule.declarations` array.

   Example code: `toh-pt1/src/app/app.module.ts`, region `declarations`.

`AppModule` declares the 2 application components, `AppComponent` and `HeroesComponent`.

## Final code review

These are the code files of this page:

| File | Example code |
| --- | --- |
| `src/app/heroes/heroes.component.ts` | `toh-pt1/src/app/heroes/heroes.component.ts` |
| `src/app/heroes/heroes.component.html` | `toh-pt1/src/app/heroes/heroes.component.html` |
| `src/app/app.module.ts` | `toh-pt1/src/app/app.module.ts` |
| `src/app/app.component.ts` | `toh-pt1/src/app/app.component.ts` |
| `src/app/app.component.html` | `toh-pt1/src/app/app.component.html` |
| `src/app/hero.ts` | `toh-pt1/src/app/hero.ts` |

## Summary

- You used `ng generate` to create a second component, `HeroesComponent`.
- You showed the `HeroesComponent` when you added it to the `AppComponent` shell.
- You applied the `UppercasePipe` to format the name.
- You used two-way data binding with the `ngModel` directive.
- You learned about the `AppModule`.
- You imported the `FormsModule` in the `AppModule`, so that Angular recognizes and applies the `ngModel` directive.
- You learned why you must declare components in the `AppModule`.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [CSS type selectors](https://developer.mozilla.org/docs/Web/CSS/Type_selectors)
- [Pipes overview](https://angular.io/guide/pipes-overview)
- [NgModules](https://angular.io/guide/ngmodules)
- Next: [Angular Tour of Heroes, part 2: Display a selection list](doc:angular-tour-of-heroes-part-2)
