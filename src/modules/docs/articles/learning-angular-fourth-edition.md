---
title: Learning Angular, fourth edition
summary: Quick-start notes for the Learning Angular book: create and run a new app, add Angular Material, and add or delete components.
category: Angular
order: 30
---

# Learning Angular, fourth edition

These notes go with the book *Learning Angular, Fourth Edition*. They show how to create and run a new Angular app, add Angular Material, and add or delete a component. The book code is in the [Learning-Angular-Fourth-Edition repository](https://www.github.com/PacktPublishing/Learning-Angular-Fourth-Edition).

## Before you start

- Node.js and npm. Use npm 8.5.0 or later. For the supported versions of Node.js and npm, see the prerequisites in [Angular versions](https://angular.io/guide/versions).
- A command-line tool on your local computer.

> **NOTE:** Dated (checked November 2026): the current Angular documentation is on angular.dev. The angular.io links in this article are for older Angular versions and can redirect. For the current Node.js and npm requirements, see [Version compatibility](https://angular.dev/reference/versions). Current Angular versions need newer Node.js versions than npm 8.5.0 implies.

## Create a new Angular app

1. Show the current version of npm:

   ```bash
   npm --version
   ```

2. If the version is earlier than 8.5.0, update Node.js and do step 1 again.
3. Create or go to the directory for your Angular app.
4. Create the new Angular app:

   ```bash
   npm init @angular myApp
   ```

5. When the command asks for a choice, press Enter to accept the default option ([SCSS](https://sass-lang.com/documentation/syntax)).

   **Result:** The command creates a new Angular app in the `myApp` directory.

6. Go to the new directory:

   ```bash
   cd myApp
   ```

7. Build and start the new app:

   ```bash
   npm start
   ```

8. When the command asks for a choice, press Enter to accept the default option.
9. Find the URL in the message in the command-line tool.
10. Open a browser on the system with the new Angular app and enter that URL in the address bar. The default URL is `http://localhost:4200`.
11. To stop `npm start`, press `CTRL+C` in the terminal or command prompt where you started it. This sends an interrupt signal that stops the process.

## Install Angular Material

1. Install the Angular CLI:

   ```bash
   npm install -g @angular/cli
   ```

2. When the installation is complete, run the `ng` command again to add the Angular Material package:

   ```bash
   ng add @angular/material
   ```

## Create a component

Use `ng generate` to create a new component:

```bash
ng generate component myComponent
```

## Delete a component

1. Go to the component folder and delete it.
2. Open the `app.module.ts` file.
3. Remove the import statement of the component.
4. Remove the component declaration from the `declarations` array of `@NgModule`.

> **NOTE:** Dated (checked November 2026): since Angular 17, new projects use standalone components and have no `app.module.ts` by default. In a standalone project, delete the component folder, then remove the component import and its entry in the `imports` array of each component or route that uses it.

## Troubleshooting

### npm ERR! code ERR_SOCKET_TIMEOUT when you create a project

See the Stack Overflow question [npm ERR! code ERR_SOCKET_TIMEOUT on creating new project using ng new appname](https://stackoverflow.com/questions/67657599/npm-err-code-err-socket-timeout-on-creating-new-project-using-ng-new-appname).

## Related links

- [Learning-Angular-Fourth-Edition repository](https://www.github.com/PacktPublishing/Learning-Angular-Fourth-Edition)
- [Angular quick start](https://angular.io/quick-start)
- [Angular versions](https://angular.io/guide/versions)
- [Sass syntax](https://sass-lang.com/documentation/syntax)
- [Angular cheat sheet](doc:angular-cheatsheet)
- [Angular in 90ish minutes: developer guide](doc:angular-in-90-minutes)
