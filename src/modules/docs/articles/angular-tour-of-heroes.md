---
title: Angular Tour of Heroes
summary: Overview of the Angular Tour of Heroes tutorial series: what the finished app does, what you learn, and links to parts 0 to 6.
category: Angular
order: 100
---

# Angular Tour of Heroes

In the *Tour of Heroes* tutorial, you build your own Angular application from the start. The tutorial shows a typical development process and teaches Angular application-design concepts, tools, and terms. This page gives an overview of the series and links to each part.

## Before you start

- A local Angular development environment. Part 0 shows how to set it up.
- The [Angular CLI](https://angular.io/cli).
- If you are new to Angular, do the [Try it now](https://angular.io/start) quick-start application first. It is based on a ready-made, partially completed project. You edit the application in StackBlitz and see the results in real time. It covers the same main subjects (components, template syntax, routing, services, and data access with HTTP) in a short format and follows best practices.

> **NOTE:** This tutorial comes from the Angular documentation (reviewed between 2022 and 2023). It includes its code samples from the Angular documentation example project. Each part of this series gives the example file and region for each code step, for example `toh-pt1/src/app/hero.ts`. Find these files in the `toh-pt0` to `toh-pt6` folders of the [Angular documentation examples](https://github.com/angular/angular/tree/17.3.x/aio/content/examples).

> **NOTE:** Verify the Angular documentation examples link. It is not in the original tutorial. It points to the `17.3.x` branch, the last branch with the angular.io documentation sources.

> **NOTE:** Dated (checked November 2026): the current Angular documentation is on [angular.dev](https://angular.dev). The angular.io links and images in this series are for Angular 17 and earlier and can redirect or stop working. The angular.dev tutorials replace the Tour of Heroes tutorial.

> **IMPORTANT:** Starting in Angular version 17, new projects are standalone by default. The tutorial uses `NgModule`. To create a project with `NgModule`, use `ng new --no-standalone`. See [Angular Tour of Heroes, part 0: Create a new project](doc:angular-tour-of-heroes-part-0).

## What the application does

The *Tour of Heroes* application helps a staffing agency manage its stable of heroes. The application has many of the features of a typical data-driven application.

The finished application:

- Gets a list of heroes.
- Shows the heroes in a list.
- Edits the details of a selected hero.
- Navigates between different views of hero data.

## What you learn

The tutorial shows how to:

- Set up your local Angular development environment.
- Use the [Angular CLI](https://angular.io/cli) to develop an application.
- Use Angular [directives](https://angular.io/guide/glossary#directive) to show and hide elements and to show lists of hero data.
- Create Angular [components](https://angular.io/guide/glossary#component) to show hero details and an array of heroes.
- Use one-way [data binding](https://angular.io/guide/glossary#data-binding) for read-only data.
- Add editable fields that update a model with two-way data binding.
- Bind component methods to user events, for example keystrokes and clicks.
- Let users select a hero from a list and edit that hero in the details view.
- Format data with [pipes](https://angular.io/guide/glossary#pipe).
- Create a shared [service](https://angular.io/guide/glossary#service) that collects the heroes.
- Use [routing](https://angular.io/guide/glossary#router) to navigate among different views and their components.

After you complete all parts, the application is the same as the `toh-pt6` live example in the Angular documentation.

## Design of the application

This image shows the result of the tutorial: the Dashboard view and the top heroes.

![Output of heroes dashboard](https://angular.io/generated/images/guide/toh/heroes-dashboard-1.png)

- Click the **Dashboard** and **Heroes** links in the dashboard to navigate between the views.
- Click the dashboard hero "Magneta". The router opens a "Hero Details" view, where you can change the name of the hero.

![Details of hero in application](https://angular.io/generated/images/guide/toh/hero-details-1.png)

- Click the "Back" button to go back to the Dashboard.
- Use the links at the top to go to one of the main views.
- Click "Heroes". The application shows the "Heroes" list view.

![Output of heroes list application](https://angular.io/generated/images/guide/toh/heroes-list-2.png)

- Click a different hero name. The read-only mini detail below the list shows the new choice.
- Click the "View Details" button to open the editable details of the selected hero.

This diagram shows the navigation options:

![View navigations](https://angular.io/generated/images/guide/toh/nav-diagram.png)

This animation shows the application in action:

![Tour of Heroes in Action](https://angular.io/generated/images/guide/toh/toh-anim.gif)

## Parts of the tutorial

| Part | Subject |
| --- | --- |
| [Part 0](doc:angular-tour-of-heroes-part-0) | Create a new project. |
| [Part 1](doc:angular-tour-of-heroes-part-1) | The hero editor. |
| [Part 2](doc:angular-tour-of-heroes-part-2) | Display a selection list. |
| [Part 3](doc:angular-tour-of-heroes-part-3) | Create a feature component. |
| [Part 4](doc:angular-tour-of-heroes-part-4) | Add services. |
| [Part 5](doc:angular-tour-of-heroes-part-5) | Add navigation with routing. |
| [Part 6](doc:angular-tour-of-heroes-part-6) | Get data from a server. |

## Related links

- [Angular Tour of Heroes, part 0: Create a new project](doc:angular-tour-of-heroes-part-0) (next)
- [Try it now quick-start application](https://angular.io/start)
- [Angular CLI command reference](https://angular.io/cli)
- [Angular glossary](https://angular.io/guide/glossary)
- [Angular documentation examples](https://github.com/angular/angular/tree/17.3.x/aio/content/examples)
