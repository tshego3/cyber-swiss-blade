var e=`---
title: Angular cheat sheet
summary: Angular CLI commands, components, routing, services, pipes, directives, forms, tests, and interview answers in one reference.
category: Angular
order: 10
---

# Angular cheat sheet

This cheat sheet collects the basic Angular features in one place. Use it as a quick reference when you write Angular code or prepare for an interview. The content comes from the [Angular Cheatsheet](https://github.com/delprzemo/angular-cheatsheet.git) repository, with thanks to http://foreach.pl for their contribution.

## Before you start

- Node.js and npm.
- The Angular CLI (see [Angular CLI](#angular-cli)).

## Angular CLI

The Angular CLI is the command-line interface for Angular. It gives a set of commands that help you during development.

### Setup

| Command | Description |
| --- | --- |
| \`npm install -g @angular/cli\` | Install the Angular CLI globally. |
| \`ng new {app-name}\` | Create a new app. |

### Update the CLI and the project

1. Install the latest Angular CLI globally:

   \`\`\`bash
   npm install -g @angular/cli@latest
   \`\`\`

2. If you must remove a previous version of the Angular CLI, run these commands:

   \`\`\`bash
   npm uninstall -g @angular/cli angular-cli
   npm cache clean --force
   npm install -g @angular/cli@latest
   \`\`\`

3. Go to your project directory in the terminal.
4. Update the project dependencies to their latest versions:

   \`\`\`bash
   ng update
   \`\`\`

5. To update only the Angular core packages, run this command:

   \`\`\`bash
   ng update @angular/core
   \`\`\`

6. Update other libraries and packages (for example, RxJS or Angular Material) one by one. Find the list of dependencies in \`package.json\` and update them with \`npm install\`.
7. Read the official Angular update guide or the release notes for breaking changes in the new version. Change your code where necessary.

### New application

| Command | Description |
| --- | --- |
| \`ng new best-practises --dry-run\` | Simulate \`ng new\` only. |
| \`ng new best-practises --skip-install\` | Do not run \`npm install\`. |
| \`ng new best-practises --prefix best\` | Set the prefix to \`best\`. |
| \`ng new --help\` | Show the list of available commands. |

### Lint

Lint makes sure that the code has no code smells and no bad formatting.

| Command | Description |
| --- | --- |
| \`ng lint my-app --help\` | Show the list of available commands. |
| \`ng lint my-app --format stylish\` | Show the lint results in the \`stylish\` output format. |
| \`ng lint my-app --fix\` | Fix code smells. |
| \`ng lint my-app\` | Show warnings. |

> **NOTE:** Dated (checked November 2026): since Angular 12, new projects have no linter. TSLint is deprecated. Add ESLint with \`ng add @angular-eslint/schematics\` before you use \`ng lint\`. The available options come from ESLint.

### Blueprints

| Command or option | Description |
| --- | --- |
| \`ng g c my-component --flat true\` | Do not create a new folder for this component. |
| \`--inline-template\` (\`-t\`) | Put the template in the \`.ts\` file. |
| \`--inline-style\` (\`-s\`) | Put the style in the \`.ts\` file. |
| \`--spec\` | Generate a spec file. |
| \`--prefix\` | Assign your own prefix. |
| \`ng g d directive-name\` | Create a directive. |
| \`ng g s service-name\` | Create a service. |
| \`ng g cl models/customer\` | Create a \`customer\` class in the \`models\` folder. |
| \`ng g i models/person\` | Create an interface in the \`models\` folder. |
| \`ng g e models/gender\` | Create a \`gender\` enum in the \`models\` folder. |
| \`ng g p init-caps\` | Create a pipe. |

> **NOTE:** Dated (checked November 2026): the \`--spec\` option was replaced by \`--skip-tests\`. The CLI generates a spec file by default. Use \`--skip-tests\` to not generate it.

### Build and serve

| Command | Description |
| --- | --- |
| \`ng build\` | Build the app to the \`/dist\` folder. |
| \`ng build --aot\` | Build the app without the code that it does not need (optimization). |
| \`ng build --prod\` | Build for production. |
| \`ng serve -o\` | Serve the app and open a browser. |
| \`ng serve --live-reload\` | Reload when changes occur. |
| \`ng serve --ssl\` | Serve the app with SSL. |

> **NOTE:** Dated (checked November 2026): \`ng build --prod\` is deprecated since Angular 12 and removed in later versions. Use \`ng build --configuration production\`. Since Angular 12, \`ng build\` uses the production configuration by default. AOT compilation is the default since Angular 9, so \`--aot\` is not necessary.

### Add new capabilities

| Command | Description |
| --- | --- |
| \`ng add @angular/material\` | Add Angular Material to the project. |
| \`ng g @angular/material:material-nav --name nav\` | Create a Material navigation component. |

## Components and templates

Components are the most basic UI building block of an Angular app. An Angular app contains a tree of Angular components.

### Sample component

\`\`\`ts
import { Component } from '@angular/core';

@Component({
	// component attributes
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.less']
})

export class AppComponent {
	title = 'my-dogs-training';
}
\`\`\`

### Component attributes

| Attribute | Description |
| --- | --- |
| \`changeDetection\` | The change-detection strategy for this component. |
| \`viewProviders\` | The set of injectable objects that are visible to the view DOM children. |
| \`moduleId\` | The module ID of the module that contains the component. |
| \`encapsulation\` | An encapsulation policy for the template and the CSS styles. |
| \`interpolation\` | Overrides the default start and end delimiters (\`{{\` and \`}}\`). |
| \`entryComponents\` | A set of components to compile together with this component. |
| \`preserveWhitespaces\` | \`true\` keeps and \`false\` removes unnecessary whitespace characters from the compiled template. |

> **NOTE:** Dated (checked November 2026): \`entryComponents\` is deprecated since Angular 9, because the Ivy engine does not need it. \`moduleId\` has no effect in current Angular versions. Do not use these attributes in new code.

### Component lifecycle

| Lifecycle hook | Description |
| --- | --- |
| \`ngOnInit\` | Called one time, after the first \`ngOnChanges()\`. |
| \`ngOnChanges\` | Called before \`ngOnInit()\` and each time an input property changes. |
| \`ngOnDestroy\` | Called immediately before Angular destroys the directive or component. |
| \`ngDoCheck\` | Called during each change detection run. |
| \`ngAfterContentChecked\` | Called after \`ngAfterContentInit()\` and after each subsequent \`ngDoCheck()\`. |
| \`ngAfterViewChecked\` | Called after \`ngAfterViewInit()\` and after each subsequent \`ngAfterContentChecked()\`. |
| \`ngAfterContentInit\` | Called one time, after the first \`ngDoCheck()\`. |
| \`ngAfterViewInit\` | Called one time, after the first \`ngAfterContentChecked()\`. |

### Template syntax

| Syntax | Description |
| --- | --- |
| \`{{user.name}}\` | Interpolation: shows the user name here. |
| \`<img [src] = "user.imageUrl">\` | Property binding: binds the image URL of the user to the \`src\` attribute. |
| \`<button (click)="do()" ... />\` | Event binding: assigns a function to the click event. |
| \`<button *ngIf="user.showSth" ... />\` | Shows the button when \`user.showSth\` is true. |
| \`*ngFor="let item of items"\` | Iterates through the \`items\` list. |
| \`<div [ngClass]="{green: isTrue(), bold: itTrue()}"/>\` | The Angular \`ngClass\` attribute. |
| \`<div [ngStyle]="{'color': isTrue() ? '#bbb' : '#ccc'}"/>\` | The Angular \`ngStyle\` attribute. |

### Input and output

Use \`@Input()\` to pass a value into a child component.

Child component:

\`\`\`ts
export class SampleComponent {
	@Input() value: any; // any, string, object, …
	...
}
\`\`\`

Parent component template:

\`\`\`html
<app-sample-component [value]="myValue"></app-sample-component>
\`\`\`

Use \`@Output()\` to send an event to the parent component.

Child component:

\`\`\`ts
@Output() myEvent: EventEmitter<MyModel> = new EventEmitter();
onRemoved(item: MyModel) {
	this.myEvent.emit(item);
}
\`\`\`

Parent component template:

\`\`\`html
<app-my-component 
(myEvent)="someFunction()"></app-my-component>
\`\`\`

When \`onRemoved\` runs in the child component, it calls \`someFunction\` in the parent component.

### Content projection

Content projection puts inner HTML into a child component.

Parent component template:

\`\`\`html
<component>
	<div>
		(some html here)
	</div>
</component>
\`\`\`

Child component template:

\`\`\`html
<ng-content></ng-content>
\`\`\`

Angular puts \`(some html here)\` into \`<ng-content></ng-content>\`.

To project 2 different HTML parts, mark each part in the parent:

\`\`\`html
<component>
	<div well-title>
		(some html here)
	</div>
	<div well-body>
		(some html here)
	</div>
</component>
\`\`\`

Then select each part in the child with an attribute selector:

\`\`\`html
<ng-content select="[well-title]"></ng-content> 
<ng-content select="[well-body]"></ng-content>
\`\`\`

### ViewChild decorator

Use \`@ViewChild\` to get access to a child component, directive, or element.

\`\`\`ts
@ViewChild(NumberComponent)
private numberComponent: NumberComponent;
increase() {
this.numberComponent.increaseByOne(); //method from child component
}
decrease() {
this.numberComponent.decreaseByOne();  //method from child component
}
\`\`\`

Example for an element. HTML:

\`\`\`html
<div #myElement></div>
\`\`\`

Component:

\`\`\`ts
@ViewChild('myElement') myElement: ElementRef
\`\`\`

You can use a specific element type instead of \`ElementRef\`, for example \`FormControl\` for forms.

Refer to the element in HTML:

\`\`\`html
<button (click)="doSth(myElement)"></button>
\`\`\`

## Routing

The Angular Router lets users go from one view to the next as they do application tasks.

Sample routing file:

\`\`\`ts
const appRoutes: Routes = [
  { path: 'crisis-center', component: CrisisListComponent },
  { path: 'hero/:id',      component: HeroDetailComponent },
  {
    path: 'heroes',
    component: HeroListComponent,
    data: { title: 'Heroes List' }
  },
  { path: '',
    redirectTo: '/heroes',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];
\`\`\`

Add the routes to the \`imports\` of the Angular module:

\`\`\`ts
RouterModule.forRoot(appRoutes)
\`\`\`

To log routing events to the console, add \`enableTracing\`:

\`\`\`ts
imports: [
   RouterModule.forRoot(
     routes,
     {enableTracing: true}
    )
],
\`\`\`

Usage in a template:

\`\`\`html
  <a routerLink="/crisis-center" routerLinkActive="active">Crisis Center</a>	
\`\`\`

\`routerLinkActive="active"\` adds the \`active\` class to the element when the route of the link becomes active.

\`\`\`ts
//Navigate from code
this.router.navigate(['/heroes']);

// with parameters													
this.router.navigate(['/heroes', { id: heroId, foo: 'foo' }]);

// Receive parameters without Observable
let id = this.route.snapshot.paramMap.get('id');										
\`\`\`

### CanActivate and CanDeactivate

A class can implement \`CanActivate\` to be a guard that decides if a route can activate. If all guards return \`true\`, the navigation continues.

\`\`\`ts
class AlwaysAuthGuard implements CanActivate {	
	canActivate() {
		return true;
	}
}
\`\`\`

Assign the guard in the routing module:

\`\`\`ts
 {
    path: 'artist/:artistId',
    component: ArtistComponent,
    canActivate: [AlwaysAuthGuard], 
    children: [
      {path: '', redirectTo: 'tracks', pathMatch: 'full'},
      {path: 'tracks', component: ArtistTrackListComponent},
      {path: 'albums', component: ArtistAlbumListComponent},
    ]
  }
\`\`\`

## Modules

Angular apps are modular. Angular has its own modularity system, NgModules. An NgModule is a container for a cohesive block of code for an application domain, a workflow, or a closely related set of capabilities.

### Sample module with comments

\`\`\`ts
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
	declarations: [AppComponent], // components, pipes, directives
	imports: [BrowserModule, AppRoutingModule], // other modules
	providers: [], // services
	bootstrap: [AppComponent] // top component
})
export class AppModule { }
\`\`\`

> **NOTE:** Dated (checked November 2026): since Angular 17, \`ng new\` creates standalone components by default, without an \`AppModule\`. A standalone component lists its dependencies in its own \`imports\` array. NgModules still work.

## Services

Components must not get or save data directly, and they must not knowingly show fake data. Components show data and give data access to a service.

Sample service with one function:

\`\`\`ts
@Injectable()
export class MyService {
	public items: Item[];
	constructor() { }
	
	getSth() {
		// some implementation
	}
}
\`\`\`

Inject the service before you use it:

\`\`\`ts
constructor(private dogListService: MyService) 
\`\`\`

Add the service to the module:

\`\`\`ts
providers: [MyService]
\`\`\`

### HttpClient

\`HttpClient\` sends and receives HTTP requests.

1. Add the import to the module:

   \`\`\`ts
   import { HttpClientModule} from "@angular/common/http";
   \`\`\`

2. Use the client:

   \`\`\`ts
   import {HttpClient} from '@angular/common/http';

   ...

   // GET
   public getData(): Observable<MyResponseModel> {
   	return this.http.get<MyResponseModel>('api/users/2');
   }

   // POST
   public send(val1: any, val2: any): Observable<any> {
   	const object = new SendModel(val1, val2);
   	const options = {headers: new HttpHeaders({'Content-type': 'application/json'})};
   	return this.http.post<string>(environment.apiUrl + 'api/login', object, options);
   }
   \`\`\`

> **NOTE:** Dated (checked November 2026): \`HttpClientModule\` is deprecated since Angular 18. Add \`provideHttpClient()\` to the providers of the application configuration (or of the module) instead.

### Dependency injection

Inject a class into another class:

\`\`\`ts
@Injectable({
	providedIn: 'root',
})
export class SomeService {}
\`\`\`

\`providedIn\` accepts \`'root'\` or any module of your application.

### Declare global values

Class:

\`\`\`ts
import {InjectionToken} from '@angular/core';
export const CONTROLS_GLOBAL_CONFIG = new InjectionToken<ControlsConfig>('global-values');
export interface ControlsConfig {firstGlobalValue: string;}
\`\`\`

Module:

\`\`\`ts
providers: [{provide: CONTROLS_GLOBAL_CONFIG, useValue: {firstGlobalValue : 'Some value' }},
\`\`\`

Usage, for example in a component:

\`\`\`ts
constructor(@Optional() @Inject(CONTROLS_GLOBAL_CONFIG) globalVlues: ControlsConfig) {
\`\`\`

## Pipes

A pipe changes data or a value to a specific format. For example, this shows a date in the \`shortDate\` format:

\`\`\`html
{{model.birthsDay | date:'shortDate'}}
\`\`\`

Pipe implementation:

\`\`\`ts
@Pipe({name: 'uselessPipe'})
export class uselessPipe implements PipeTransform {
  transform(value: string, before: string, after: string): string {
    let newStr = \`\${before} \${value} \${after}\`;
    return newStr;
  }
}
\`\`\`

Usage:

\`\`\`html
{{ user.name | uselessPipe:"Mr.":"the great" }}
\`\`\`

## Directives

An attribute directive changes the appearance or the behavior of a DOM element. For example, \`[ngStyle]\` is a directive.

Custom directive:

\`\`\`ts
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective {

  constructor(private el: ElementRef) { }

  @Input('appHighlight') highlightColor: string;
  @Input('otherPar') otherPar: any;     //it will be taken from other attribute named [otherPar]

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.highlightColor || 'red');
  }

  private highlight(color: string) {
    this.el.nativeElement.style.backgroundColor = color;
  }
}
\`\`\`

Usage:

\`\`\`html
<p [appHighlight]="color" [otherPar]="someValue">Highlight me!</p>
\`\`\`

## Animations

An animation moves from one style state to another style state. Before you start, add \`BrowserModule\` and \`BrowserAnimationsModule\` to the module.

Implementation:

\`\`\`ts
  animations: [
      trigger('openClose', [
        state('open', style({
          height: '400px',
          opacity: 1,
        })),
        state('closed', style({
          height: '100px',
          opacity: 0.5,
        })),
        transition('open => closed', [
          animate('1s')
        ]),
        transition('closed => open', [
          animate('1s')
        ])
      ])
    ]
\`\`\`

Usage:

\`\`\`html
<div [@openClose]="isShowed ? 'open' : 'closed'">
\`\`\`

## Angular forms

### Template-driven forms

The template keeps the form logic (validation and properties).

Sample HTML:

\`\`\`html
<form name="form" (ngSubmit)="f.form.valid && onSubmit()" #f="ngForm" novalidate>
    <div class="form-group">
        <label for="firstName">First Name</label>
        <input type="text" class="form-control" name="firstName" [(ngModel)]="model.firstName" #firstName="ngModel" [ngClass]="{ 'is-invalid': f.submitted && firstName.invalid }" required />
        <div *ngIf="f.submitted && firstName.invalid" class="invalid-feedback">
            <div *ngIf="firstName.errors.required">First Name is required</div>
        </div>
    </div>
    <div class="form-group">
        <button class="btn btn-primary">Register</button>
    </div>
</form>
\`\`\`

Sample component:

\`\`\`ts
@ViewChild("f") form: any;
firstName: string = "";
langs: string[] = ["English", "French", "German"];

onSubmit() {
	if (this.form.valid) {
		console.log("Form Submitted!");
		this.form.reset();
	}
}
\`\`\`

### Reactive forms

The component keeps the form logic (validation and properties).

Sample HTML:

\`\`\`html
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
	<div class="form-group">
		<label>Email</label>
		<input type="text" formControlName="email" class="form-control" [ngClass]="{ 'is-invalid': submitted && f.email.errors }" />
		<div *ngIf="submitted && f.email.errors" class="invalid-feedback">
			<div *ngIf="f.email.errors.required">Email is required</div>
			<div *ngIf="f.email.errors.email">Email must be a valid email address</div>
		</div>
	</div>

	<div class="form-group">
		<button [disabled]="loading" class="btn btn-primary">Register</button>
	</div>
</form>
\`\`\`

Sample component:

\`\`\`ts
registerForm: FormGroup;
submitted = false;

constructor(private formBuilder: FormBuilder) { }

ngOnInit() {
	this.registerForm = this.formBuilder.group({
		firstName: ['' /* here default value */, Validators.required],
		lastName: ['', Validators.required],
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required, Validators.minLength(6)]]
	});
}

// convenience getter for easy access to form fields
get f() { return this.registerForm.controls; }

 onSubmit() {
	 this.submitted = true;

	// stop here if form is invalid
	if (this.registerForm.invalid) {
		return;
	}

	alert('SUCCESS!! :-)')
}
\`\`\`

### Custom validator for reactive forms

Function:

\`\`\`ts
validateUrl(control: AbstractControl) {
    if (!control.value || control.value.includes('.png') || control.value.includes('.jpg')) {
      return null;
    }
    return { validUrl: true };
  }
\`\`\`

Usage:

\`\`\`ts
this.secondFormGroup = this._formBuilder.group({
      imageCtrl: ['', [Validators.required, this.validateUrl]]
});
\`\`\`

Validation of more than one field:

\`\`\`ts
validateNameShire(group: FormGroup) {
    if (group) {
      if (group.get('isShireCtrl').value && !group.get('nameCtrl').value.toString().toLowerCase().includes('shire')) {
	return { nameShire : true };
      }
    }
    return null;
 }
\`\`\`

Usage of the multi-field validator:

\`\`\`ts
this.firstFormGroup.setValidators(this.validateNameShire);
\`\`\`

Error handling in the template:

\`\`\`html
<div *ngIf="firstFormGroup.controls.nameCtrl.errors.maxlength">Name is too long</div>				
<div *ngIf="firstFormGroup.errors.nameShire">Shire dogs should have "shire" in name</div>
\`\`\`

### Custom validator directive for template-driven forms

Register the custom validation directive with the \`NG_VALIDATORS\` service as shown below. The \`multi\` parameter adds \`CustomValidator\` to \`NG_VALIDATORS\` and does not override \`NG_VALIDATORS\`.

\`\`\`ts
@Directive({
	selector: '[CustomValidator]',
	providers: [{provide: NG_VALIDATORS, useExisting: CustomValidator, multi:true}]						
})
\`\`\`

Example:

\`\`\`ts
@Directive({
	selector: '[customValidation]',
	providers: [{provide: NG_VALIDATORS, useExisting: CustomValidation, multi: true}]
})
export class CustomValidation implements Validator {
	constructor() { }
	validate(control: AbstractControl): ValidationErrors {
	return (control.value && control.value.length <= 300) ? 
		{myValue : true } : null;
	}
}
\`\`\`

> **NOTE:** Verify the condition in \`validate\` before you use it. It returns the \`myValue\` error when the value has 300 characters or fewer, and no error for longer values. If you want a maximum length of 300, invert the condition.

For more than one field:

\`\`\`ts
validate(formGroup: FormGroup): ValidationErrors {
	const passwordControl = formGroup.controls["password"];
	const emailControl = formGroup.controls["login"];
	if (!passwordControl || !emailControl || !passwordControl.value || !emailControl.value) {
		return null;
	}

	if (passwordControl.value.length > emailControl.value.length) {
		passwordControl.setErrors({ tooLong: true });
	} else {
		passwordControl.setErrors(null);
	}
	return formGroup;
}
\`\`\`

### ngModel in custom component

1. Add the provider to the module:

   \`\`\`ts
   providers: [
   	{
   		provide: NG_VALUE_ACCESSOR,
   		useExisting: forwardRef(() => TextAreaComponent),
   		multi: true
   	}
   ]
   \`\`\`

2. Implement the \`ControlValueAccessor\` interface:

   \`\`\`ts
   interface ControlValueAccessor {
   	writeValue(obj: any): void
   	registerOnChange(fn: any): void
   	registerOnTouched(fn: any): void
   	setDisabledState?(isDisabled: boolean): void
   }
   \`\`\`

| Function | Description |
| --- | --- |
| \`registerOnChange\` | Registers a function that tells Angular when the value of the input changes. |
| \`registerOnTouched\` | Registers a function that tells Angular when the input was touched. |
| \`writeValue\` | Tells Angular how to write a value to the input. |

Sample implementation:

\`\`\`ts
@Component({
  selector: 'app-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaComponent),
      multi: true
    }
  ]
})
export class TextAreaComponent implements ControlValueAccessor, OnInit {
  @Input() value: string;

  private _onChange = (data: any) => { console.log('changed: ' + data); };
  private _onTouched = (data?: any) => {console.log('touched: ' + data); };

  ngOnInit(): void {
    const self = this;
  }

  constructor() {}

  writeValue(obj: any): void {
    this.value = obj;
  }

  registerOnChange(fn) {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
}
\`\`\`

## Tests

### Unit tests

Service test:

\`\`\`ts
describe('MyService', () => {
	let service: MyService;
	beforeEach(() => service = new MyService());
	it('#fetch should update data', () => {
		service.fetchData();
		expect(service.data.length).toBe(4);
		expect(service.data[0].id).toBe(1);
	});
});
\`\`\`

For async functions, call \`done\`. It prevents the test from finishing before the data arrives.

\`\`\`ts
it('#fetch should update data', (done: DoneFn) => {    
	// some code
	done();  // we need 'done' to avoid test finishing before data was received
	// some code
});
\`\`\`

Example async test:

\`\`\`ts
it('http client works', (done: DoneFn) => {
    service.getUser().subscribe((data) => {
      expect(data).toBe('test');
      done();
    });
 });
\`\`\`

#### Spy and stub

Spy:

\`\`\`ts
// create spied object by copy getDataAsync from HttpService
const valueServiceSpy =
jasmine.createSpyObj('HttpService', ['getDataAsync']);
\`\`\`

Stub:

\`\`\`ts
const stubValue = of('StubValue');
valueServiceSpy.getDataAsync.and.returnValue(stubValue);
\`\`\`

#### TestBed

\`TestBed\` mocks the full module or environment for unit tests.

\`\`\`ts
beforeEach(() => {
	let httpClientMock = TestBed.configureTestingModule({ providers: [{ provide: MyService, useValue: new MyService(httpClientMock)}] });
});
\`\`\`

> **NOTE:** Verify this sample before you use it. It uses \`httpClientMock\` in its own initializer, so \`httpClientMock\` is undefined when \`new MyService(httpClientMock)\` runs. Create the mock first (for example, with \`jasmine.createSpyObj\`) and then call \`TestBed.configureTestingModule\`.

Then get the tested object (for example, a service) like this:

\`\`\`ts
service = TestBed.get(MyService);
\`\`\`

> **NOTE:** Dated (checked November 2026): \`TestBed.get\` is deprecated since Angular 9. Use \`TestBed.inject(MyService)\`.

You can add \`schemas: [NO_ERRORS_SCHEMA]\`. Then you do not have to mock the dependencies of the child components of this component, because Angular does not show errors for them.

## Other features

### HTTP interceptor

An interceptor catches and handles an \`HttpRequest\` or an \`HttpResponse\`.

Class:

\`\`\`ts
@Injectable()
export class MyInterceptor implements HttpInterceptor {

	constructor() { }

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// do sth (like check and throw error)
		return next.handle(request); //if want continue
	}
}
\`\`\`

Module:

\`\`\`ts
{ provide: HTTP_INTERCEPTORS, useClass: MyInterceptor, multi: true },
\`\`\`

### Host

These selectors refer to the host element or component.

| Value | Description |
| --- | --- |
| \`:host(selector) { ... }\` | Matches attributes and classes on the host element and adds styles to it. |
| \`:host-context(selector) { ... }\` | Matches elements and classes on parent components and adds styles to it. |
| \`:host ::ng-deep\` | Applies the styles to all child components too. |

## Interview questions

### When do you use the useFactory provider method?

With \`useFactory\`, a factory decides at runtime which kind of service to return when another class requests it. Also use it when you must parameterize the construction of a service.

\`\`\`ts
export function sampleFactory() {
  return new Service1();
}

export class Service1 {}

@Injectable({
  providedIn: 'root',
  useFactory: sampleFactory
})
export class Service2 {}
\`\`\`

Angular injects \`Service1\` into the other class.

### What is router-outlet?

\`<router-outlet>\` is a placeholder that Angular fills dynamically from the current router state. Usually, Angular generates your main app component in place of \`<router-outlet>\`.

### How do you declare a global value?

Use \`InjectionToken\`. See [Declare global values](#declare-global-values).

### Which decorator injects a service registered with an injection token?

Use \`@Inject\`. For example:

\`\`\`ts
 @Inject(CONTROLS_GLOBAL_CONFIG) globalVlues: ControlsConfig
\`\`\`

### How do you mimic the environment for components and services in tests?

Use \`TestBed\`. See [Unit tests](#unit-tests).

### What is the Resolve interface?

A class can implement \`Resolve\` to be a data provider for a component during routing. Use it to load data for a component before the component shows.

\`\`\`ts
@Injectable()
class UserResolver implements Resolve<User> {
  constructor(private service: MySampleService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    return this.service.fetchData(route.params.id);
  }
}

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: 'user/:id',
        component: UserComponent,
        resolve: {
          userData: UserResolver
        }
      }
    ])
  ],
  providers: [UserResolver]
})
\`\`\`

### How do you start validation after the user enters a value and pauses?

Use \`debounceTime\`. For example:

\`\`\`ts
this.formCtrlSub = this.firstNameControl.valueChanges
      .debounceTime(1000)
      .subscribe(newValue => this.firstName = newValue);
\`\`\`

> **NOTE:** Dated (checked November 2026): this is RxJS 5 operator chaining. Since RxJS 6, use pipeable operators: \`this.firstNameControl.valueChanges.pipe(debounceTime(1000)).subscribe(...)\`, with \`import { debounceTime } from 'rxjs';\` (RxJS 7.2 or later) or \`from 'rxjs/operators'\`.

### What is valueChanges in a form control?

\`valueChanges\` catches value changes, so you can add logic to the observable result. See the example above.

### How do you run canActivate when a child route changes?

Use \`canActivateChild\`.

### What are the compilation types in Angular?

| Type | Description |
| --- | --- |
| AoT | Ahead of time. Compiles the full application or module when the application opens. Used mainly in production. |
| JiT | Just in time. Compiles a specific element when it opens. Used mainly during development. |
| Ivy | Opt-in preview in Angular 8, default since Angular 9. An engine based on the Incremental DOM concept. |

### What is ng-content in Angular?

See [Content projection](#content-projection).

### How do you create an application with a custom prefix?

\`\`\`bash
ng new app-name --prefix my-custom-prefix
\`\`\`

### What is module lazy loading?

Angular does not load all modules when the app starts. It loads a module only when the app needs it. Big apps use this to improve performance.

\`\`\`ts
const routes: Routes = [
  {
    path: 'users',
    loadChildren: () => import('./users/users.module').then(m => m.UserModule)
  }
\`\`\`

### Why use ngIf instead of ngClass or ngStyle to hide an element?

If the condition is false, \`ngIf\` does not generate the element, so the HTML is lighter. \`ngClass\` and \`ngStyle\` only hide the element, and the element stays in the DOM.

### What is the done() function in tests?

\`done\` prevents the test from finishing before the data arrives. See [Unit tests](#unit-tests).

### What do imports, providers, and declarations mean in NgModule?

\`\`\`ts
declarations: [AppComponent], // components, pipes, directives
imports: [BrowserModule, AppRoutingModule], // other modules
providers: [], // services
\`\`\`

See [Sample module with comments](#sample-module-with-comments).

### What is the difference between the constructor and ngOnInit?

- The constructor is a method of the class. JavaScript calls it when it creates the class object.
- \`ngOnInit\` is part of the component lifecycle. It depends on the current state of the view initialization.
- The constructor runs before \`ngOnInit\`.

### What is the difference between ElementRef and TemplateRef?

\`ElementRef\` refers to a specific element. \`TemplateRef\` can refer to a full \`ng-template\`.

\`\`\`html
<ng-template #test>
   Test
</ng-template>
\`\`\`

\`\`\`ts
export class SthComponent  { 
	@ViewChild('test')
	private testTempRef : TemplateRef<any>
}
\`\`\`

### What are the data binding types for an element?

| Binding type | Example |
| --- | --- |
| Property binding | \`[src]="this.src"\` |
| Event binding | \`(click)="this.doSth()"\` |
| Two-way data binding | \`[(ngModel)]="this.form.userName"\` |

### How do you handle the ngModel property in a custom component?

Implement the \`ControlValueAccessor\` interface. See [ngModel in custom component](#ngmodel-in-custom-component).

### What is the difference between the default and the OnPush change detector?

- The default change detector checks the bindings in the full application component tree after an event.
- The \`OnPush\` change detector tells Angular that the bindings of the component depend on its input parameters. It checks only the subtree that contains the component, not the full application.

### Why are pure pipes better than functions in a template view?

You can calculate a value, for example the user age, with a function in the template:

\`\`\`html
{{this.getUserAge(user.birthDate)}}
\`\`\`

Angular calculates this value each time the change detector runs, which can decrease performance. Use a pipe instead:

\`\`\`html
{{user.birthDate | calculateAge}}
\`\`\`

Now Angular does the age calculation less frequently.

### How do you detect a change for any @Input property?

Use the \`ngOnChanges\` hook.

\`\`\`ts
ngOnChanges(values) {
  // logic here
}
\`\`\`

### How do you detect a change for a specific @Input in a component?

Use a \`set\` accessor.

\`\`\`ts
@Input() set name(value) {
  // some logic here
}
\`\`\`

## Related links

- [Angular Cheatsheet repository](https://github.com/delprzemo/angular-cheatsheet.git)
- [TypeScript cheatsheet](https://github.com/delprzemo/typescript-cheatsheet)
- [ReactJS cheatsheet](https://github.com/delprzemo/react-cheatsheet)
- [Learning Angular, fourth edition](doc:learning-angular-fourth-edition)
- [Angular in 90ish minutes: developer guide](doc:angular-in-90-minutes)
`;export{e as default};