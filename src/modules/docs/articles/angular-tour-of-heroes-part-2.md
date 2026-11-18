---
title: Angular Tour of Heroes, part 2: Display a selection list
summary: Show a list of mock heroes with ngFor, style the list, select a hero with a click event, and show its details with ngIf.
category: Angular
order: 130
---

# Angular Tour of Heroes, part 2: Display a selection list

In this part, you expand the Tour of Heroes application to show a list of heroes. Users can select a hero and see the details of that hero.

## Before you start

- Complete [Angular Tour of Heroes, part 1: The hero editor](doc:angular-tour-of-heroes-part-1).
- To see the code of this part, use the `toh-pt2` live example in the Angular documentation.

## Create mock heroes

First, create some heroes to show.

1. Create a file named `mock-heroes.ts` in the `src/app/` directory.
2. Define a `HEROES` constant as an array of 10 heroes and export it.

   Example code: `toh-pt2/src/app/mock-heroes.ts`.

## Show the heroes

1. Open the `HeroesComponent` class file and import the mock `HEROES`.

   Example code: `toh-pt2/src/app/heroes/heroes.component.ts`, region `import-heroes`.

2. In the `HeroesComponent` class, define a component property named `heroes` that exposes the `HEROES` array for binding.

   Example code: `toh-pt2/src/app/heroes/heroes.component.ts`, region `component`.

### List heroes with ngFor

1. In the `HeroesComponent` component file, import the `NgFor` directive and add it to the `imports` array.

   Example code: `toh-pt2/src/app/heroes/heroes.component.ts`, region `import-ngfor`.

   This step and the `NgIf` import below apply to a standalone `HeroesComponent`. In a project with `NgModule` (as in the rest of this series), `BrowserModule` in the `AppModule` already makes `NgFor` and `NgIf` available. Verify which type of component you have before you do this step.

2. Open the `HeroesComponent` template file and make these changes:
   1. Add an `<h2>` at the top.
   2. Below the `<h2>`, add a `<ul>` element.
   3. In the `<ul>` element, add an `<li>`.
   4. In the `<li>`, put a `<button>` that shows properties of a `hero` in `<span>` elements.
   5. Add CSS classes to style the component.

   Example code: `toh-pt2/src/app/heroes/heroes.component.1.html`, region `list`.

   This shows an error, because the `hero` property does not exist.

3. To get access to each hero and list all of them, add an `*ngFor` to the `<li>` that iterates through the list of heroes.

   Example code: `toh-pt2/src/app/heroes/heroes.component.1.html`, region `li`.

**Result:** After the browser refreshes, the list of heroes shows.

The [`*ngFor`](https://angular.io/guide/built-in-directives#ngFor) is the Angular *repeater* directive. It repeats the host element for each element in a list.

| Syntax | Details |
| --- | --- |
| `<li>` | The host element. |
| `heroes` | Holds the mock heroes list from the `HeroesComponent` class. |
| `hero` | Holds the current hero object for each iteration through the list. |

> **IMPORTANT:** Put the asterisk `*` in front of `ngFor`. It is a critical part of the syntax.

> **TIP:** In the `<li>` element, a `<button>` element wraps the details of the hero and makes the hero clickable. To improve accessibility, use HTML elements that are interactive by default. Do not add an event listener to an element that is not interactive. Here, the interactive `<button>` element gets the event, not the `<li>` element. For more details, see [Accessibility in Angular](https://angular.io/guide/accessibility).

### Style the heroes

The heroes list must look good and must respond visually when users hover over a hero and select a hero from the list.

In [part 0](doc:angular-tour-of-heroes-part-0#add-application-styles), you set the basic styles for the full application in `styles.css`. That style sheet does not include styles for this list of heroes.

You can add more styles to `styles.css` and make that style sheet larger as you add components. Alternatively, define private styles for a specific component. Then the code, the HTML, and the CSS of the component are together in one place. This makes it easier to use the component in a different place and to keep the intended appearance of the component, also when the global styles are different.

You define private styles inline in the `@Component.styles` array, or as style sheet files in the `@Component.styleUrls` array.

When `ng generate` created the `HeroesComponent`, it created an empty `heroes.component.css` style sheet for the `HeroesComponent`. It referred to that file in `@Component.styleUrls`.

Example code: `toh-pt2/src/app/heroes/heroes.component.ts`, region `metadata`.

1. Open the `heroes.component.css` file.
2. Paste in the private CSS styles for the `HeroesComponent` from the [final code review](#final-code-review).

> **IMPORTANT:** Styles and style sheets in the `@Component` metadata apply only to that specific component. The `heroes.component.css` styles apply only to the `HeroesComponent`. They have no effect on the outer HTML or on the HTML in other components.

## Show the details

When the user clicks a hero in the list, the component must show the details of the selected hero at the bottom of the page. The code in this section listens for the click event on the hero item, and shows or updates the hero details.

### Add a click event binding

1. Add a click event binding to the `<button>` in the `<li>`.

   Example code: `toh-pt2/src/app/heroes/heroes.component.1.html`, region `selectedHero-click`.

This is an example of the Angular [event binding](https://angular.io/guide/event-binding) syntax.

The parentheses around `click` tell Angular to listen for the `click` event of the `<button>` element. When the user clicks the `<button>`, Angular runs the `onSelect(hero)` expression.

In the next section, you define an `onSelect()` method in `HeroesComponent` that shows the hero from the `*ngFor` expression.

### Add the click event handler

1. Change the name of the `hero` property of the component to `selectedHero`. Do not assign a value to it, because there is no *selected hero* when the application starts.
2. Add the `onSelect()` method. It assigns the clicked hero from the template to the `selectedHero` of the component.

   Example code: `toh-pt2/src/app/heroes/heroes.component.ts`, region `on-select`.

### Add a details section

The component template has a list. To show details about a hero when you click the name in the list, add a section in the template that shows the details.

1. Add the details section to `heroes.component.html`, below the list section.

   Example code: `toh-pt2/src/app/heroes/heroes.component.html`, region `selectedHero-details`.

2. Show the hero details only when a hero is selected. When Angular first creates the component, there is no selected hero. Import the `NgIf` directive in your component (the same as `NgFor`).
3. Add the `*ngIf` directive to the `<div>` that wraps the hero details. This directive tells Angular to show the section only when `selectedHero` is defined, after the user clicks a hero.

> **IMPORTANT:** Put the asterisk `*` in front of `ngIf`. It is a critical part of the syntax.

### Style the selected hero

To help users identify the selected hero, use the `.selected` CSS class in the [styles that you added before](#style-the-heroes). To apply the `.selected` class when the user clicks a hero, use a class binding.

![Selected hero with dark background and light text that differentiates it from unselected list items](https://angular.io/generated/images/guide/toh/heroes-list-selected.png)

The Angular [class binding](https://angular.io/guide/class-binding) adds and removes a CSS class conditionally. Add `[class.some-css-class]="some-condition"` to the element that you want to style.

1. Add the `[class.selected]` binding to the `<button>` in the `HeroesComponent` template.

   Example code: `toh-pt2/src/app/heroes/heroes.component.1.html`, region `class-selected`.

If the hero of the current row is the same as `selectedHero`, Angular adds the `selected` CSS class. If the 2 heroes are different, Angular removes the class.

The finished `<li>` is in the example code: `toh-pt2/src/app/heroes/heroes.component.html`, region `li`.

## Final code review

These are the code files of this page, with the `HeroesComponent` styles:

| File | Example code |
| --- | --- |
| `src/app/mock-heroes.ts` | `toh-pt2/src/app/mock-heroes.ts` |
| `src/app/heroes/heroes.component.ts` | `toh-pt2/src/app/heroes/heroes.component.ts` |
| `src/app/heroes/heroes.component.html` | `toh-pt2/src/app/heroes/heroes.component.html` |
| `src/app/heroes/heroes.component.css` | `toh-pt2/src/app/heroes/heroes.component.css` |

## Summary

- The Tour of Heroes application shows a list of heroes with a detail view.
- The user can select a hero and see the details of that hero.
- You used `*ngFor` to show a list.
- You used `*ngIf` to include or exclude a block of HTML conditionally.
- You can toggle a CSS style class with a `class` binding.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [Built-in directives: ngFor](https://angular.io/guide/built-in-directives#ngFor)
- [Accessibility in Angular](https://angular.io/guide/accessibility)
- [Event binding](https://angular.io/guide/event-binding)
- [Class binding](https://angular.io/guide/class-binding)
- Next: [Angular Tour of Heroes, part 3: Create a feature component](doc:angular-tour-of-heroes-part-3)
