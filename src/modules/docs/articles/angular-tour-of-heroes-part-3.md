---
title: Angular Tour of Heroes, part 3: Create a feature component
summary: Move the hero details into a reusable HeroDetailComponent with an @Input() hero property and bind it from the HeroesComponent.
category: Angular
order: 140
gist: eabb3f133b8a7fb6fd139763edcae064
source: toh-pt3.md
---

# Angular Tour of Heroes, part 3: Create a feature component

The `HeroesComponent` shows the list of heroes and the details of the selected hero. If you keep all features in one component as the application grows, the component becomes difficult to maintain. In this part, you split a large component into smaller subcomponents, each for a specific task or workflow.

You move the hero details into a separate, reusable `HeroDetailComponent`. At the end, you have:

- A `HeroesComponent` that shows the list of heroes.
- A `HeroDetailComponent` that shows the details of a selected hero.

## Before you start

- Complete [Angular Tour of Heroes, part 2: Display a selection list](doc:angular-tour-of-heroes-part-2).
- To see the code of this part, use the `toh-pt3` live example in the Angular documentation.

## Make the HeroDetailComponent

1. Use `ng generate` to create a new component named `hero-detail`:

   ```bash
   ng generate component hero-detail
   ```

   **Result:** The command creates the directory `src/app/hero-detail`. In that directory, it creates 4 files:

   - A CSS file for the component styles.
   - An HTML file for the component template.
   - A TypeScript file with a component class named `HeroDetailComponent`.
   - A test file for the `HeroDetailComponent` class.

### Write the template

1. Cut the HTML for the hero detail from the bottom of the `HeroesComponent` template.
2. Paste it over the boilerplate content in the `HeroDetailComponent` template.
3. The pasted HTML refers to `selectedHero`. The new `HeroDetailComponent` can show *any* hero, not only a selected hero. Replace `selectedHero` with `hero` in all places in the template.

   Example code for the finished template: `toh-pt3/src/app/hero-detail/hero-detail.component.html`.

### Add the @Input() hero property

The `HeroDetailComponent` template binds to the `hero` property of the component, which has the type `Hero`.

The `hero` property [must be an `Input` property](https://angular.io/guide/inputs-outputs), annotated with the `@Input()` decorator, because the *external* `HeroesComponent` [binds to it](#update-the-heroescomponent-template). Example code: `toh-pt3/src/app/heroes/heroes.component.html`, region `hero-detail-binding`.

1. Open the `HeroDetailComponent` class file and import the `Hero` symbol.

   Example code: `toh-pt3/src/app/hero-detail/hero-detail.component.ts`, region `import-hero`.

2. Change the `@angular/core` import statement to include the `Input` symbol.

   Example code: `toh-pt3/src/app/hero-detail/hero-detail.component.ts`, region `import-input`.

3. Add a `hero` property with the `@Input()` decorator in front of it.

   Example code: `toh-pt3/src/app/hero-detail/hero-detail.component.ts`, region `input-hero`.

This is the only change to the `HeroDetailComponent` class. There are no more properties and there is no presentation logic. This component only receives a hero object through its `hero` property and shows it.

## Show the HeroDetailComponent

Before you removed that part of the template, the `HeroesComponent` showed the hero details itself. In this section, you give that task to the `HeroDetailComponent`.

The 2 components have a parent/child relation. The parent, `HeroesComponent`, controls the child, `HeroDetailComponent`. It sends a new hero to the child each time the user selects a hero from the list.

Do not change the `HeroesComponent` *class*. Change its *template*.

### Update the HeroesComponent template

The `HeroDetailComponent` selector is `'app-hero-detail'`.

1. Add an `<app-hero-detail>` element near the bottom of the `HeroesComponent` template, where the hero detail view was before.
2. Bind `HeroesComponent.selectedHero` to the `hero` property of the element.

   Example code: `toh-pt3/src/app/heroes/heroes.component.html`, region `hero-detail-binding`.

`[hero]="selectedHero"` is an Angular [property binding](https://angular.io/guide/property-binding). It is a *one-way* data binding from the `selectedHero` property of the `HeroesComponent` to the `hero` property of the target element. That property maps to the `hero` property of the `HeroDetailComponent`.

When the user clicks a hero in the list, `selectedHero` changes. When `selectedHero` changes, the *property binding* updates `hero`, and the `HeroDetailComponent` shows the new hero.

Example code for the revised `HeroesComponent` template: `toh-pt3/src/app/heroes/heroes.component.html`.

**Result:** The browser refreshes and the application works again as before.

## What changed

As [before](doc:angular-tour-of-heroes-part-2), when a user clicks a hero name, the hero detail shows below the hero list. Now the `HeroDetailComponent` shows those details, not the `HeroesComponent`.

The split of the original `HeroesComponent` into 2 components gives these benefits, now and in the future:

1. The `HeroesComponent` has fewer responsibilities.
2. You can develop the `HeroDetailComponent` into a rich hero editor and not change the parent `HeroesComponent`.
3. You can develop the `HeroesComponent` and not change the hero detail view.
4. You can use the `HeroDetailComponent` again in the template of a future component.

## Final code review

These are the code files of this page:

| File | Example code |
| --- | --- |
| `src/app/hero-detail/hero-detail.component.ts` | `toh-pt3/src/app/hero-detail/hero-detail.component.ts` |
| `src/app/hero-detail/hero-detail.component.html` | `toh-pt3/src/app/hero-detail/hero-detail.component.html` |
| `src/app/heroes/heroes.component.html` | `toh-pt3/src/app/heroes/heroes.component.html` |

## Summary

- You created a separate, reusable `HeroDetailComponent`.
- You used a [property binding](https://angular.io/guide/property-binding) to give the parent `HeroesComponent` control over the child `HeroDetailComponent`.
- You used the [`@Input` decorator](https://angular.io/guide/inputs-outputs) to make the `hero` property available for binding by the external `HeroesComponent`.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [Input and output properties](https://angular.io/guide/inputs-outputs)
- [Property binding](https://angular.io/guide/property-binding)
- Next: [Angular Tour of Heroes, part 4: Add services](doc:angular-tour-of-heroes-part-4)
