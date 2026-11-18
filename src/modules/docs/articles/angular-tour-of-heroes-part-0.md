---
title: Angular Tour of Heroes, part 0: Create a new project
summary: Set up the environment, create the Tour of Heroes workspace with ng new, serve it, and change the title and global styles.
category: Angular
order: 110
---

# Angular Tour of Heroes, part 0: Create a new project

In this part, you use the `ng new` command to start the *Tour of Heroes* application. You set up your environment, create a new workspace and an initial application project, serve the application, and make changes to it.

## Before you start

- Read the series overview: [Angular Tour of Heroes](doc:angular-tour-of-heroes).
- To see the code of this part, use the `toh-pt0` live example in the Angular documentation.

> **IMPORTANT:** Starting in Angular version 17, new projects are [standalone by default](https://angular.io/guide/standalone-components). This tutorial uses `NgModule`. To create a project with `NgModule`, use the option `ng new --no-standalone`.

## Set up your environment

Follow the instructions in [Local Environment Setup](https://angular.io/guide/setup-local).

## Create a new workspace and an initial application

You develop applications in an Angular [workspace](https://angular.io/guide/glossary#workspace). A *workspace* contains the files for one or more [projects](https://angular.io/guide/glossary#project). A *project* is the set of files that make an application or a library.

1. Make sure that you are not in an Angular workspace directory. For example, if you are in the Getting Started workspace from an earlier exercise, go to its parent directory.
2. Run `ng new` with the application name:

   ```bash
   ng new angular-tour-of-heroes
   ```

3. `ng new` asks for the features to include in the initial project. Press Enter or Return to accept the defaults.

`ng new` installs the necessary `npm` packages and other dependencies for Angular. This can take a few minutes.

`ng new` also creates these workspace and starter project files:

- A new workspace, with a root directory named `angular-tour-of-heroes`.
- An initial skeleton application project in the `src/app` subdirectory.
- Related configuration files.

The initial application project contains a simple application that is ready to run.

## Serve the application

1. Go to the workspace directory and start the application:

   ```bash
   cd angular-tour-of-heroes
   ng serve --open
   ```

   **Result:** The application runs in your browser.

The `ng serve` command:

- Builds the application.
- Starts the development server.
- Watches the source files.
- Builds the application again when you make changes.

The `--open` flag opens a browser at `http://localhost:4200`.

## Angular components

The page that you see is the *application shell*. An Angular **component** named `AppComponent` controls the shell.

*Components* are the basic building blocks of Angular applications. They show data on the screen, listen for user input, and do actions based on that input.

## Make changes to the application

Open the project in your editor or IDE. Go to the `src/app` directory to edit the starter application. These files make the `AppComponent`:

| File | Details |
| --- | --- |
| `app.component.ts` | The component class code, written in TypeScript. |
| `app.component.html` | The component template, written in HTML. |
| `app.component.css` | The private CSS styles of the component. |

> **IMPORTANT:** When you ran `ng new`, Angular created test specifications for your new application. The changes in this tutorial break these specifications. This is not a problem, because Angular testing is not part of this tutorial. To learn more about testing with Angular, see [Testing](https://angular.io/guide/testing).

### Change the application title

1. Open `app.component.ts` and change the value of the `title` property to `'Tour of Heroes'`.

   Example code: `toh-pt0/src/app/app.component.ts`, region `set-title` (class title property).

2. Open `app.component.html` and delete the default template that `ng new` created. Replace it with the template from the example.

   Example code: `toh-pt0/src/app/app.component.html` (template).

The double curly braces are the Angular *interpolation binding* syntax. This interpolation binding shows the value of the `title` property of the component in the HTML header tag.

**Result:** The browser refreshes and shows the new application title.

### Add application styles

Most apps have a consistent look across the application. `ng new` created an empty `styles.css` for this purpose. Put your application-wide styles there.

1. Open `src/styles.css` and add the styles from the example.

   Example code: `toh-pt0/src/styles.1.css` (excerpt).

## Final code review

These are the code files of this page:

| File | Example code |
| --- | --- |
| `src/app/app.component.ts` | `toh-pt0/src/app/app.component.ts` |
| `src/app/app.component.html` | `toh-pt0/src/app/app.component.html` |
| `src/styles.css` (excerpt) | `toh-pt0/src/styles.1.css` |

## Summary

- You created the initial application structure with `ng new`.
- Angular components show data.
- The double curly braces of interpolation show the application title.

## Related links

- [Angular Tour of Heroes](doc:angular-tour-of-heroes) (series overview)
- [Standalone components](https://angular.io/guide/standalone-components)
- [Local Environment Setup](https://angular.io/guide/setup-local)
- [Testing](https://angular.io/guide/testing)
- Next: [Angular Tour of Heroes, part 1: The hero editor](doc:angular-tour-of-heroes-part-1)
