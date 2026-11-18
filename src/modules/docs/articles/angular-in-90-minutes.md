---
title: Angular in 90ish minutes: developer guide
summary: Build a first standalone Angular 18 app with components, signals, inputs, outputs, routes, an HTTP service, a directive, and pipes.
category: Angular
order: 20
---

# Angular in 90ish minutes: developer guide

This guide follows the video [Angular in 90ish Minutes](https://youtu.be/oUmVFHlwZsI?si=1_55gdjGQN2uBl7R) and builds the `first-ng-app` project step by step. The project uses Angular CLI version [18.2.7](https://www.npmjs.com/package/@angular/cli/v/18.2.7). For the full code, see the [GitHub repository](https://github.com/AhsanAyaz/angular-in-90ish/tree/main/first-ng-app).

## Before you start

Know these subjects:

- The basics of HTML, CSS, JavaScript, and TypeScript.
- Git and basic programming concepts (loops, variables, functions).

Install these tools:

| Tool | Link |
| --- | --- |
| Visual Studio Code | [code.visualstudio.com](https://code.visualstudio.com/) |
| Node.js | [nodejs.org](https://nodejs.org/) |
| Angular CLI | [Install the Angular CLI](https://angular.dev/tools/cli/setup-local#install-the-angular-cli) |
| Angular Language Service extension for VS Code | [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template) |

> **NOTE:** Each code sample in this guide shows the full file after the change. A line above each sample gives the file path in the project.

> **NOTE:** Dated (checked November 2026): since Angular 19, components, directives, and pipes are standalone by default. You can remove `standalone: true` from the samples in Angular 19 and later. Angular 18 needs it.

## About Angular

Angular development started in 2013. Google develops Angular, an open-source framework based on TypeScript. Developers use it mainly to build dynamic single-page web applications. This guide uses practices and tools from Angular experts, for example John Papa, and from the Angular community.

Angular has these characteristics:

- It supports single-page applications (SPAs).
- It has a large, active community and much documentation.
- Several Google applications use it (for example, Google Analytics).

### Benefits of Angular

- Faster development with less code.
- Built-in unit testing.
- Consistent coding standards, because the structure is opinionated.
- More reuse through components, services, and pipes.
- CLI tools for faster code generation and deployment.

### Angular and React

| Feature | Angular | React |
| --- | --- | --- |
| Type | Framework | Library |
| CLI | Built-in | Requires additional tools |
| Built-in tools | Many (for example, forms and HTTP) | Few (requires external libraries) |
| Opinionated | Yes | No |

### Myths about Angular

| Myth | Fact |
| --- | --- |
| Angular is hard to learn. | Not true. Modern Angular has much documentation and is easy to use. |
| Angular has frequent breaking changes. | Angular releases 2 updates each year, and most changes are incremental. |
| Angular is slow. | Recent benchmarks show that Angular performance is equal to Vue.js and React. |

### Angular Cookbook

The latest [Angular Cookbook](https://ng-cookbook.com/) has more than 90 practical projects. Its main subjects are:

- Component communication.
- Directives and control flows.
- RxJS and NgRx for state management.
- Routing, forms, and animations.
- Unit testing and performance optimization.

## Create the application

Use the Angular CLI to create and manage projects.

1. Make sure that Node.js is installed. Run `node -v` and `npm -v` in your terminal.
2. Install the Angular CLI globally. Run only one of these commands: the version of this guide, the latest version, or a different specific version:

   ```bash
   npm install -g @angular/cli@18.2.7
   # OR the latest version
   npm install -g @angular/cli
   # OR a different specific version
   npm install -g @angular/cli@18.2.0
   ```

3. Check the installation:

   ```bash
   ng --version
   ```

4. Create a new Angular project:

   ```bash
   ng new first-ng-app
   ```

5. Go to the project directory and serve the application:

   ```bash
   cd first-ng-app
   ng serve
   ```

   **Result:** The app runs at `http://localhost:4200`.

The CLI generates a project structure with the necessary files. `ng serve` runs the development server.

## Create components

Components are the building blocks of Angular applications. A component has these parts:

| Part | Purpose |
| --- | --- |
| TypeScript | Logic and data binding. |
| HTML | The template. |
| SCSS | Styles for this component only. |

Run one of these Angular CLI commands:

```bash
ng g c header # short form
ng generate component header # full form
# creates inside the `src/app` folder

# OR (in a nested directory)
ng g c components/header 
# creates HeaderComponent 
# inside the `src/app/components` folder

ng g c home
# creates the HomeComponent
```

The command generates these component files:

- `header.component.ts` (logic)
- `header.component.html` (template)
- `header.component.scss` (styles)

Example of a basic component. File `first-ng-app/src/app/components/header/header.component.html`:

```html
<h1>My first Angular app</h1>
```

File `first-ng-app/src/app/components/header/header.component.ts`:

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
}
```

For the full implementation, see the [header component code](https://github.com/AhsanAyaz/angular-in-90ish/tree/main/first-ng-app/src/app/components/header).

## Bind data

Data binding connects the TypeScript class of the component and the template of the component.

### Bind data with signals

Modern Angular uses [signals](https://angular.dev/guide/signals#what-are-signals). A signal is a wrapper around a value. It tells interested consumers when the value changes. A signal can contain any value, from primitives to complex data structures.

1. In `header.component.html`, replace the static heading with the signal value:

   ```html
   <h1>{{ title() }}</h1>
   ```

2. In `header.component.ts`, import `signal` and add the `title` signal:

   ```ts
   import { Component, signal } from '@angular/core';

   @Component({
     selector: 'app-header',
     standalone: true,
     imports: [],
     templateUrl: './header.component.html',
     styleUrl: './header.component.scss',
   })
   export class HeaderComponent {
     title = signal('My first Angular app');
   }
   ```

### Bind data without signals

This is the traditional way.

1. In `header.component.html`, bind to the property:

   ```html
   <h1>{{ title }}</h1>
   ```

2. In `header.component.ts`, add a plain `title` property:

   ```ts
   import { Component } from '@angular/core';

   @Component({
     selector: 'app-header',
     standalone: true,
     imports: [],
     templateUrl: './header.component.html',
     styleUrl: './header.component.scss',
   })
   export class HeaderComponent {
     title = 'My first Angular app';
   }
   ```

### Binding types

Angular supports these binding types:

- One-way data binding shows data in templates:

  ```html
  <p>{{ title }}</p>
  ```

- Two-way data binding keeps the model and the view the same:

  ```html
  <input [(ngModel)]="title" />
  ```

  `ngModel` comes from `FormsModule`. Add `FormsModule` to the `imports` array of the component before you use `[(ngModel)]`. The [Use pipes](#use-pipes) section shows an example.

## Pass data from parent to child

A component declares [inputs](https://angular.dev/guide/components/inputs) for the data that it accepts. In this section, the home page passes a greeting message to a child component.

1. Generate the components:

   ```bash
   ng g c home
   # generates in `src/app`

   ng g c components/greeting
   # generates in `src/app/components`
   ```

2. Change `first-ng-app/src/app/components/header/header.component.html` to this:

   ```html
   <header>
     <nav>
         {{ title }}
     </nav>
   </header>
   ```

   The `HeaderComponent` class keeps `title = 'My first Angular app';` from [Bind data without signals](#bind-data-without-signals).

3. Change `first-ng-app/src/app/components/greeting/greeting.component.html` to this:

   ```html
   <h2>Greetings!</h2>
   <p>{{ message() }}</p>
   ```

4. In `first-ng-app/src/app/components/greeting/greeting.component.ts`, import `input` and declare the `message` input:

   ```ts
   import { Component, input } from '@angular/core';

   @Component({
     selector: 'app-greeting',
     standalone: true,
     imports: [],
     templateUrl: './greeting.component.html',
     styleUrl: './greeting.component.scss',
   })
   export class GreetingComponent {
     message = input('Hello hello!');
   }
   ```

5. In `first-ng-app/src/app/home/home.component.html`, pass a value to the input:

   ```html
   <app-greeting [message]="homeMessage()" />
   ```

6. In `first-ng-app/src/app/home/home.component.ts`, import `GreetingComponent` and add the `homeMessage` signal:

   ```ts
   import { Component, signal } from '@angular/core';
   import { GreetingComponent } from '../components/greeting/greeting.component';

   @Component({
     selector: 'app-home',
     standalone: true,
     imports: [GreetingComponent],
     templateUrl: './home.component.html',
     styleUrl: './home.component.scss',
   })
   export class HomeComponent {
     homeMessage = signal('Hello, world!');
   }
   ```

7. In `first-ng-app/src/app/app.component.html`, add the header:

   ```html
   <app-header />
   ```

8. In `first-ng-app/src/app/app.component.ts`, import `HeaderComponent`:

   ```ts
   import { Component } from '@angular/core';
   import { HeaderComponent } from './components/header/header.component';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [HeaderComponent],
     templateUrl: './app.component.html',
     styleUrl: './app.component.scss',
   })
   export class AppComponent {
     title = 'first-ng-app';
   }
   ```

## Listen to events

1. In `first-ng-app/src/app/home/home.component.html`, add an input with a `keyup` event listener:

   ```html
   <app-greeting [message]="homeMessage()" />
   <input
     placeholder="Type something..."
     type="text"
     (keyup)="keyUpHandler($event)"
   />
   ```

2. In `first-ng-app/src/app/home/home.component.ts`, add the `keyUpHandler` method:

   ```ts
   import { Component, signal } from '@angular/core';
   import { GreetingComponent } from '../components/greeting/greeting.component';

   @Component({
     selector: 'app-home',
     standalone: true,
     imports: [GreetingComponent],
     templateUrl: './home.component.html',
     styleUrl: './home.component.scss',
   })
   export class HomeComponent {
     homeMessage = signal('Hello, world!');

     keyUpHandler(event: KeyboardEvent) {
       console.log(`user pressed the ${event.key} key`);
     }
   }
   ```

## Create a counter component

The counter has increment, decrement, and reset functions.

1. Generate the component:

   ```bash
   ng g c components/counter
   ```

2. Change `first-ng-app/src/app/components/counter/counter.component.html` to this:

   ```html
   <p>Counter value: {{ counterValue() }}</p>

   <div>
    <button (click)="increment()">Increment</button>
    <button (click)="reset()">Reset</button>
    <button (click)="decrement()">Decrement</button>
   </div>
   ```

3. Change `first-ng-app/src/app/components/counter/counter.component.ts` to this:

   ```ts
   import { Component, signal } from '@angular/core';

   @Component({
     selector: 'app-counter',
     standalone: true,
     imports: [],
     templateUrl: './counter.component.html',
     styleUrl: './counter.component.scss',
   })
   export class CounterComponent {
     counterValue = signal(0);
     increment() {
       this.counterValue.update((val) => val + 1);
     }

     decrement() {
       this.counterValue.update((val) => val - 1);
     }

     reset() {
       this.counterValue.set(0);
     }
   }
   ```

4. In `first-ng-app/src/app/home/home.component.html`, add `<app-counter />`:

   ```html
   <app-greeting [message]="homeMessage()" />
   <app-counter />
   <input
     placeholder="Type something..."
     type="text"
     (keyup)="keyUpHandler($event)"
   />
   ```

5. In `first-ng-app/src/app/home/home.component.ts`, import `CounterComponent`:

   ```ts
   import { Component, signal } from '@angular/core';
   import { GreetingComponent } from '../components/greeting/greeting.component';
   import { CounterComponent } from '../components/counter/counter.component';

   @Component({
     selector: 'app-home',
     standalone: true,
     imports: [GreetingComponent, CounterComponent],
     templateUrl: './home.component.html',
     styleUrl: './home.component.scss',
   })
   export class HomeComponent {
     homeMessage = signal('Hello, world!');

     keyUpHandler(event: KeyboardEvent) {
       console.log(`user pressed the ${event.key} key`);
     }
   }
   ```

## Create routes

An Angular app is a single-page application. With routes, you can still define different pages for the user. The browser loads only the bundles for the route that the user opens. This improves the performance of the app and the user experience.

1. Create a component to use as the page for the todo list:

   ```bash
   ng g c todos
   # this will be the page for todos' list
   ```

2. Create a component for each todo item:

   ```bash
   ng g c components/todo-item
   ```

3. In `first-ng-app/src/app/app.routes.ts`, replace the empty `routes` array (`export const routes: Routes = [];`) with this:

   ```ts
   import { Routes } from '@angular/router';

   export const routes: Routes = [
     {
         path: '',
         pathMatch: 'full',
         loadComponent: () => {
             return import('./home/home.component').then((m) => m.HomeComponent);
         },
     },
     {
         path: 'todos',
         loadComponent: () => {
             return import('./todos/todos.component').then((m) => m.TodosComponent);
         },
     },
   ];
   ```

4. In `first-ng-app/src/app/app.component.html`, add the router outlet:

   ```html
   <app-header />
   <main>
     <router-outlet />
   </main>
   ```

5. In `first-ng-app/src/app/app.component.ts`, import `RouterOutlet`:

   ```ts
   import { Component } from '@angular/core';
   import { RouterOutlet } from '@angular/router';
   import { HeaderComponent } from './components/header/header.component';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [RouterOutlet, HeaderComponent],
     templateUrl: './app.component.html',
     styleUrl: './app.component.scss',
   })
   export class AppComponent {
     title = 'first-ng-app';
   }
   ```

6. In `first-ng-app/src/app/components/header/header.component.html`, add the navigation links:

   ```html
   <header>
     <nav>
       <span routerLink="/">{{ title }}</span>
       <ul>
         <li routerLink="/todos">Todos</li>
       </ul>
     </nav>
   </header>
   ```

7. In `first-ng-app/src/app/components/header/header.component.ts`, import `RouterLink`:

   ```ts
   import { Component } from '@angular/core';
   import { RouterLink } from '@angular/router';

   @Component({
     selector: 'app-header',
     standalone: true,
     imports: [RouterLink],
     templateUrl: './header.component.html',
     styleUrl: './header.component.scss',
   })
   export class HeaderComponent {
     title = 'My first Angular app';
   }
   ```

8. Open `http://localhost:4200`.

   **Result:** The Home page shows.

9. Open `http://localhost:4200/todos`.

   **Result:** The Todos page shows.

For the full routing setup, see [app.routes.ts](https://github.com/AhsanAyaz/angular-in-90ish/blob/main/first-ng-app/src/app/app.routes.ts) in the repository.

## Create a service and make HTTP calls

Angular services hold data, make HTTP calls, or do other tasks that are not directly about how the app shows data (in the opinion of the guide author).

To make HTTP calls in a service:

- Provide the HTTP providers in the app configuration with `provideHttpClient()`.
- Inject the `HttpClient` service.
- Use the HTTP methods.

1. Create the service:

   ```bash
   ng g service services/todos
   # creates todos.service.ts inside `src/app/services`
   ```

2. Create `first-ng-app/src/app/model/todo.type.ts`:

   ```ts
   export type Todo = {
     userId: number;
     completed: boolean;
     title: string;
     id: number;
   };
   ```

3. In `first-ng-app/src/app/services/todos.service.ts`, remove the empty constructor and inject `HttpClient`:

   ```ts
   import { inject, Injectable } from '@angular/core';
   import { Todo } from '../model/todo.type';
   import { HttpClient } from '@angular/common/http';

   @Injectable({
     providedIn: 'root',
   })
   export class TodosService {
     http = inject(HttpClient);
     getTodosFromApi() {
       const url = `https://jsonplaceholder.typicode.com/todos`;
       return this.http.get<Array<Todo>>(url);
     }
   }
   ```

4. Change `first-ng-app/src/app/components/todo-item/todo-item.component.html` to this:

   ```html
   <li>
    <input
      id="todo-{{ todo().id }}"
      type="checkbox"
      [checked]="todo().completed"
      (change)="this.todoClicked()"
    />
    <label for="todo-{{ todo().id }}">{{ todo().title }}</label>
   </li>
   ```

5. Change `first-ng-app/src/app/components/todo-item/todo-item.component.ts` to this:

   ```ts
   import { Component, input, output } from '@angular/core';
   import { Todo } from '../../model/todo.type';

   @Component({
     selector: 'app-todo-item',
     standalone: true,
     imports: [],
     templateUrl: './todo-item.component.html',
     styleUrl: './todo-item.component.scss',
   })
   export class TodoItemComponent {
     todo = input.required<Todo>();
     todoToggled = output<Todo>();

     todoClicked() {
       this.todoToggled.emit(this.todo());
     }
   }
   ```

6. Change `first-ng-app/src/app/todos/todos.component.html` to this:

   ```html
   <h3>Todos List</h3>

   <ul>
    <app-todo-item (todoToggled)="updateTodoItem($event)" [todo]="todoItems()[0]" />
   </ul>
   ```

7. Change `first-ng-app/src/app/todos/todos.component.ts` to this:

   ```ts
   import { Component, inject, OnInit, signal } from '@angular/core';
   import { TodosService } from '../services/todos.service';
   import { Todo } from '../model/todo.type';
   import { TodoItemComponent } from '../components/todo-item/todo-item.component';

   @Component({
     selector: 'app-todos',
     standalone: true,
     imports: [TodoItemComponent],
     templateUrl: './todos.component.html',
     styleUrl: './todos.component.scss',
   })
   export class TodosComponent implements OnInit {
     todoService = inject(TodosService);
     todoItems = signal<Array<Todo>>([]);

     ngOnInit(): void {
       this.todoService
         .getTodosFromApi()
         .subscribe((todos) => {
           this.todoItems.set(todos);
         });
     }

     updateTodoItem(todoItem: Todo) {
       this.todoItems.update((todos) => {
         return todos.map((todo) => {
           if (todo.id === todoItem.id) {
             return {
               ...todo,
               completed: !todo.completed,
             };
           }
           return todo;
         });
       });
     }
   }
   ```

8. In `first-ng-app/src/app/app.config.ts`, add `provideHttpClient()` to the providers:

   ```ts
   import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
   import { provideRouter } from '@angular/router';

   import { routes } from './app.routes';
   import { provideHttpClient } from '@angular/common/http';

   export const appConfig: ApplicationConfig = {
     providers: [
       provideHttpClient(),
       provideZoneChangeDetection({ eventCoalescing: true }),
       provideRouter(routes),
     ],
   };
   ```

## Create a directive

Angular directives add behavior to elements in an Angular application. There are 3 types of directives:

| Type | Examples |
| --- | --- |
| Components | Each component is a directive. |
| Attribute directives | `[style.backgroundColor]` |
| Structural directives | `*ngIf` or `@if`, `*ngFor` or `@for` |

In this section, you create a directive that highlights completed todos.

1. Generate the directive:

   ```bash
   ng g directive directives/highlight-completed-todo
   ```

2. In `first-ng-app/src/app/todos/todos.component.html`, show a loading message and show all todo items with `@for`:

   ```html
   <h3>Todos List</h3>

   @if (!todoItems().length) {
     <p>Loading...</p>
   }

   <ul>
   @for (todo of todoItems(); track todo.id) {
     <app-todo-item (todoToggled)="updateTodoItem($event)" [todo]="todo" />
   }
   </ul>
   ```

3. In `first-ng-app/src/app/directives/highlight-completed-todo.directive.ts`, remove the empty constructor and add the input and the effect:

   ```ts
   import { Directive, input, effect, inject, ElementRef } from '@angular/core';

   @Directive({
     selector: '[appHighlightCompletedTodo]',
     standalone: true,
   })
   export class HighlightCompletedTodoDirective {
     isCompleted = input(false);
     el = inject(ElementRef);
     stylesEffect = effect(() => {
       if (this.isCompleted()) {
         this.el.nativeElement.style.textDecoration = 'line-through';
         this.el.nativeElement.style.backgroundColor = '#d3f9d8';
         this.el.nativeElement.style.color = '#6c757d';
       } else {
         this.el.nativeElement.style.textDecoration = 'none';
         this.el.nativeElement.style.backgroundColor = '#fff';
         this.el.nativeElement.style.color = '#000';
       }
     });
   }
   ```

4. In `first-ng-app/src/app/components/todo-item/todo-item.component.html`, add the `appHighlightCompletedTodo` attribute and the `[isCompleted]` binding to the `<li>` element:

   ```html
   <li appHighlightCompletedTodo [isCompleted]="todo().completed" >
       <input
           id="todo-{{ todo().id }}"
           type="checkbox"
           [checked]="todo().completed"
           (change)="this.todoClicked()"
       />
       <label for="todo-{{ todo().id }}">{{ todo().title }}</label>
   </li>
   ```

5. In `first-ng-app/src/app/components/todo-item/todo-item.component.ts`, import the directive:

   ```ts
   import { Component, input, output } from '@angular/core';
   import { Todo } from '../../model/todo.type';
   import { HighlightCompletedTodoDirective } from '../../directives/highlight-completed-todo.directive';

   @Component({
     selector: 'app-todo-item',
     standalone: true,
     imports: [HighlightCompletedTodoDirective],
     templateUrl: './todo-item.component.html',
     styleUrl: './todo-item.component.scss',
   })
   export class TodoItemComponent {
     todo = input.required<Todo>();
     todoToggled = output<Todo>();

     todoClicked() {
       this.todoToggled.emit(this.todo());
     }
   }
   ```

## Use pipes

Angular pipes change data directly in the templates. In this section, you use the built-in `uppercase` pipe and create a pipe that filters todos.

1. Generate the pipe:

   ```bash
   ng g pipe pipes/filter-todos
   ```

2. In `first-ng-app/src/app/pipes/filter-todos.pipe.ts`, replace the generated `transform` method with this code:

   ```ts
   import { Pipe, PipeTransform } from '@angular/core';
   import { Todo } from '../model/todo.type';

   @Pipe({
     name: 'filterTodos',
     standalone: true,
   })
   export class FilterTodosPipe implements PipeTransform {
     transform(todos: Todo[], searchTerm: string): Todo[] {
       if (!searchTerm) {
         return todos;
       }
       const text = searchTerm.toLowerCase();
       return todos.filter((todo) => {
         return todo.title.toLowerCase().includes(text);
       });
     }
   }
   ```

3. In `first-ng-app/src/app/components/todo-item/todo-item.component.html`, add the `uppercase` pipe to the label:

   ```html
   <li appHighlightCompletedTodo [isCompleted]="todo().completed" >
       <input
           id="todo-{{ todo().id }}"
           type="checkbox"
           [checked]="todo().completed"
           (change)="this.todoClicked()"
       />
       <label for="todo-{{ todo().id }}">{{ todo().title | uppercase }}</label>
   </li>
   ```

4. In `first-ng-app/src/app/components/todo-item/todo-item.component.ts`, import `UpperCasePipe`:

   ```ts
   import { Component, input, output } from '@angular/core';
   import { Todo } from '../../model/todo.type';
   import { HighlightCompletedTodoDirective } from '../../directives/highlight-completed-todo.directive';
   import { UpperCasePipe } from '@angular/common';

   @Component({
     selector: 'app-todo-item',
     standalone: true,
     imports: [HighlightCompletedTodoDirective, UpperCasePipe],
     templateUrl: './todo-item.component.html',
     styleUrl: './todo-item.component.scss',
   })
   export class TodoItemComponent {
     todo = input.required<Todo>();
     todoToggled = output<Todo>();

     todoClicked() {
       this.todoToggled.emit(this.todo());
     }
   }
   ```

5. In `first-ng-app/src/app/todos/todos.component.html`, add the filter form and apply the `filterTodos` pipe in the `@for` loop:

   ```html
   <h3>Todos List</h3>

   @if (!todoItems().length) {
   <p>Loading...</p>
   }

   <form>
    <label>Filter Todos</label>
    <input
      name="searchTerm"
      [(ngModel)]="searchTerm"
      placeholder="Search todos..."
    />
   </form>

   <ul class="todos">
   @for (todo of todoItems() | filterTodos : searchTerm(); track todo.id) {
       <app-todo-item (todoToggled)="updateTodoItem($event)" [todo]="todo" />
     }
   </ul>
   ```

6. In `first-ng-app/src/app/todos/todos.component.ts`, import `catchError`, `FormsModule`, and `FilterTodosPipe`, add the `searchTerm` signal, and catch HTTP errors:

   ```ts
   import { Component, inject, OnInit, signal } from '@angular/core';
   import { TodosService } from '../services/todos.service';
   import { Todo } from '../model/todo.type';
   import { catchError } from 'rxjs';
   import { TodoItemComponent } from '../components/todo-item/todo-item.component';
   import { FormsModule } from '@angular/forms';
   import { FilterTodosPipe } from '../pipes/filter-todos.pipe';

   @Component({
     selector: 'app-todos',
     standalone: true,
     imports: [TodoItemComponent, FormsModule, FilterTodosPipe],
     templateUrl: './todos.component.html',
     styleUrl: './todos.component.scss',
   })
   export class TodosComponent implements OnInit {
     todoService = inject(TodosService);
     todoItems = signal<Array<Todo>>([]);
     searchTerm = signal('');

     ngOnInit(): void {
       this.todoService
         .getTodosFromApi()
         .pipe(
           catchError((err) => {
             console.log(err);
             throw err;
           })
         )
         .subscribe((todos) => {
           this.todoItems.set(todos);
         });
     }

     updateTodoItem(todoItem: Todo) {
       this.todoItems.update((todos) => {
         return todos.map((todo) => {
           if (todo.id === todoItem.id) {
             return {
               ...todo,
               completed: !todo.completed,
             };
           }
           return todo;
         });
       });
     }
   }
   ```

## Next steps

Learn more advanced subjects. Improve your skills with practical projects and with the Angular community.

## Related links

- [Angular in 90ish Minutes (video)](https://youtu.be/oUmVFHlwZsI?si=1_55gdjGQN2uBl7R)
- [angular-in-90ish repository, first-ng-app](https://github.com/AhsanAyaz/angular-in-90ish/tree/main/first-ng-app)
- [Angular signals](https://angular.dev/guide/signals#what-are-signals)
- [Angular component inputs](https://angular.dev/guide/components/inputs)
- [Angular Cookbook](https://ng-cookbook.com/)
- [Angular cheat sheet](doc:angular-cheatsheet)
- [Learning Angular, fourth edition](doc:learning-angular-fourth-edition)
