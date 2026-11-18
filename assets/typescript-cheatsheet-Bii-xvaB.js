var e=`---
title: TypeScript cheat sheet
summary: TypeScript types, functions, classes, generics, enums, advanced types, modules, decorators, MVVM CRUD examples, and interview questions, with notes for C# developers.
category: TypeScript and JavaScript
order: 10
---

# TypeScript cheat sheet

This cheat sheet collects the basic TypeScript features in one place. It also helps C# developers who move to TypeScript, with a focus on \`async\` and \`await\` with \`Promise<T>\` and on MVVM and CRUD patterns.

> **NOTE:** Some features are part of ES201x (JavaScript), but TypeScript code uses them frequently.

The cheat sheet comes from the [typescript-cheatsheet repository](https://github.com/delprzemo/typescript-cheatsheet.git). Trainers at [foreach.pl](https://foreach.pl) made it for their students.

## For C# developers

Use \`async\` and \`await\` with \`Promise<T>\`, not \`void\`, as you do in C#. This gives correct error handling and lets callers chain the call. \`Promise<T>\` is the TypeScript equivalent of \`Task<T>\` in C#.

| C# | TypeScript | Notes |
| --- | --- | --- |
| \`Task<T>\` | \`Promise<T>\` | Always use it for async operations. |
| \`async Task<T>\` | \`async (...): Promise<T>\` | Use it, not a \`void\` return. |
| \`await task\` | \`await promise\` | The syntax is the same. |
| \`public/private\` | \`public/private\` | TypeScript has the same access modifiers. |
| \`IInterface\` | \`interface\` | The naming convention is different (no \`I\` prefix). |
| \`abstract class\` | \`abstract class\` | The concept is the same. |
| \`sealed class\` | Not available | Use module exports to control access. |
| \`List<T>\` | \`T[]\` or \`Array<T>\` | Arrays are the primary collection. |
| \`Dictionary<K, V>\` | \`{ [key: string]: V }\` or \`Map<K, V>\` | Use an object or a \`Map\`, as the use case needs. |
| \`Enum\` | \`enum\` or a \`type\` with a union | Enums work almost the same as in C#. |

## Basic variable types

| Type | Example | Notes |
| --- | --- | --- |
| number | \`let myNumber: number = 6\` | All numbers: integer, float, hex, and other formats. |
| string | \`let fullName: string = "Bob Bobbington"\` | Text, with all text functions (\`indexOf\`, \`replace\`, and others). |
| boolean | \`let isTrue: boolean = true\` | A true or false value. |
| Array | \`let list: Array<number> = [1, 2, 3]\` | Shorter version: \`let list: number[] = [1, 2, 3];\` |
| Tuple | \`let x: [string, number] = ['test', 2];\` | An array with items of different types. |
| any | \`let x: any = 2;\` | You can assign all values to a variable of type \`any\`. |
| Enum | \`enum Color {Red, Blue }\` | Usage: \`let c: Color = Color.Blue;\` |
| Never | \`function fail(): never {while(true) {}}\` | Shows that something must never occur. |
| Null or undefined | \`let u: undefined = undefined;\` | TypeScript has a dedicated type for \`null\` and for \`undefined\`. |
| Object | \`let x:Object = {id: 2};\` | Any object. |
| Function | \`let myFn:Function = function() {...}\` | Any function. |
| void | \`function log(): void {}\` | **Do not use it. Use \`Promise<void>\`.** |

## Destructuring and spread

This is an ES feature.

### Spread

Use spread to merge 2 objects or 2 arrays:

\`\`\`ts
let first = [1, 2];
let second = [3, 4];
let both = [0, ...first, ...second, 5];
\`\`\`

\`both\` is \`[0, 1, 2, 3, 4, 5]\`.

Spread works the same for objects:

\`\`\`ts
let first = { id: 2 };
let second = { name: "test", ...first };
\`\`\`

\`second\` is \`{name: "test", id: 2 }\`.

### Destructuring

Destructuring is the opposite of spread. It splits one object into more than one variable.

\`\`\`ts
let input = [1, 2];
let [first, second] = input;
\`\`\`

\`first\` is \`1\` and \`second\` is \`2\`.

You can also use the \`...\` operator:

\`\`\`ts
let input = [1, 2, 3];
let [first, ...rest] = input;
\`\`\`

\`first\` is \`1\`. \`rest\` is \`[2, 3]\`.

## Array functions

This is an ES feature.

\`\`\`ts
var numArray: Array<number> = [1, 2, 3]; // number[] can be used instead of Array<number> 
var numArray2: Array<number> = [4,5];
var stringArray: Array<string> = ["a", "b", "c"];

var objectArray: Array<User> = [
  {name: "Iva", age: 31},
  {name: "John", age: 39},
  {name: "Monica", age: 22}
]; 
\`\`\`

| Function | Result | Notes |
| --- | --- | --- |
| concat | \`numArray.concat(numArray2)\` returns \`[1,2,3,4,5]\` | Adds the values of one array to another and returns a new array. |
| every | \`objectArray.every(x=> x.age > 20)\` returns \`true\` | Checks if all items pass the condition. |
| some | \`objectArray.some(x=> x.age > 30)\` returns \`true\` | Checks if one or more items pass the condition. |
| filter | \`objectArray.filter(x=> x.age >= 35)\` returns \`[{name: "John", age: 39}]\` | Gets only the items that pass the condition. |
| forEach | \`numArray.forEach(x=> console.log(x))\` | Runs logic for each array item. |
| join | \`stringArray.join(",")\` returns \`"a,b,c"\` | Merges text items into one value, with \`,\` between them. |
| indexOf | \`stringArray.indexOf("b")\` returns \`1\` | Returns the index (position) of an array item. |
| map | \`stringArray.map(x => x + "1")\` returns \`["a1", "b1", "c1"]\` | Makes a new array or object with logic applied to each element. |
| push | \`stringArray.push("d")\` gives \`["a", "b", "c", "d"]\` | Adds an element to the end of the array and returns the new length. |
| unshift | \`stringArray.unshift("d")\` gives \`["d", "a", "b", "c"]\` | Adds an element to the start of the array. |
| reduce | \`numArray.reduce((x, y) => x + y)\` returns \`6\` | Merges the array into one value with logic applied on the way. |
| shift | \`numArray.shift()\` returns \`1\` and leaves \`[2, 3]\` | Removes the first element from an array and returns it. |
| sort | \`["b", "c", "a"].sort((x, y) => x.localeCompare(y))\` gives \`["a", "b", "c"]\` | Sorts the array with your logic. |

## Functions

This is an ES feature.

| Type | Example |
| --- | --- |
| Named function | \`function add(x: number, y:number): number {}\` |
| Anonymous function | \`let myAdd = function(x: number, y: number = 1): number\` |
| Arrow function | \`myArrowAdd = (x: number, y:number): number\` |

### Async, await, and promises

This is the most important part for C# developers. Use \`Promise<T>\` with \`async\` and \`await\` as you use \`Task<T>\`.

\`\`\`ts
// AVOID: Function returns void
function fetchUserBad(): void {
  fetch('/api/user').then(r => r.json());
}

// GOOD: Function returns Promise<User>
async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  return response.json();
}

// Explicit Promise syntax (like Task in C#)
function fetchUserExplicit(): Promise<User> {
  return fetch('/api/user').then(r => r.json());
}

// Error handling (like try-catch in C#)
async function fetchUserSafe(): Promise<User | null> {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Promise.all (like Task.WhenAll)
async function fetchMultiple(): Promise<[User, Post[], Comment[]]> {
  return Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
}

// Promise chaining (alternative to async/await)
function fetchUserChain(): Promise<User> {
  return fetch('/api/user')
    .then(response => response.json())
    .then(user => user)
    .catch(error => {
      console.error(error);
      throw error;
    });
}
\`\`\`

## Classes

Sample class:

\`\`\`ts
class NewGreeter {
   private greeting: string; 
   constructor(message: string) { 
    this.greeting = message;
   }

   greet() {
    return "Hello, " + this.greeting;
   }
}

var greeter = new NewGreeter('friend');
\`\`\`

Notes:

1. A class has only one constructor implementation. You can declare more than one overload signature for it.
2. \`constructor(public message: string)\` automatically creates the \`message\` property and sets it to the value of the \`message\` parameter.
3. You can use \`public\` or \`protected\` in place of \`private\`.

### Inheritance

\`\`\`ts
class MyObject {
   protected value = 0;
   static staticValue = 0;

   getValue() {
    return this.value;
   }
}
class ChildObject extends MyObject {
   getParentValue() {
    return this.value;
   }
 }
\`\`\`

### Accessors

TypeScript supports getters and setters to intercept access to a member of an object. Use them to add logic when code reads or changes the property value.

\`\`\`ts
private _value = 0;
get value(): number {
    return this._value;
}
set value(newValue: number) {
    this._value = newValue;
}
\`\`\`

### Abstract class

An abstract class is a base class for other classes. You cannot make an instance of it directly. An abstract class can contain implementation details for its members. An interface cannot.

\`\`\`ts
abstract class MyAbstractObject {
    constructor(public value: string) { }
    abstract getValue(): string; 
}
\`\`\`

Derived classes must implement the \`getValue\` function. A derived class must also call \`super()\` in its constructor:

\`\`\`ts
class MyDerivedObject extends MyAbstractObject {
    constructor() {
       super("test value");
    }
    getValue(): string {
       // some logic here
       return this.value;
    }
}
\`\`\`

## Interfaces

A class or object that implements an interface must implement the members that the interface defines. The interface is only the skeleton for the classes that implement it.

### Interface for an object

\`\`\`ts
interface MyObject {
     label: string 
}

function MyFunction(obj: MyObject) {}
\`\`\`

The \`obj\` parameter must contain the \`label\` property.

### Interface for a class

\`\`\`ts
interface ComesFromString {
    name: string;
}

class MadeFromString implements ComesFromString {
    constructor (public name: string) {

    }
}
\`\`\`

The \`MadeFromString\` class must contain the \`name\` property.

### Index signature

Use an index signature to let an object or class contain many different properties of the same type. For example, \`MyObject\` implements this interface:

\`\`\`ts
interface MyObject {
    [propName: string]: string
}
\`\`\`

A correct implementation of \`MyObject\`:

\`\`\`ts
let MyObject: MyObject  = {
    firstName: 'test',
    lastName: 'test'
}
\`\`\`

An incorrect implementation of \`MyObject\`:

\`\`\`ts
let MyObject: MyObject  = {
    firstName: 'test',
    age: 2
}
\`\`\`

It is incorrect because \`age\` is a number, and the index signature says that all properties are strings.

## Generics

Use a generic type when the same function, class, or object must work with different types, and you do not want to tie it to one type.

\`\`\`ts
function changeUndefinedToNull<T>(value: T): T | null {
    return (typeof value !== "undefined") ? value : null;
}
\`\`\`

Now you can use it with different types for the \`value\` parameter:

\`\`\`ts
const result = changeUndefinedToNull<string>("Test");
\`\`\`

\`\`\`ts
const result = changeUndefinedToNull<number>(21);
\`\`\`

\`\`\`ts
const result = changeUndefinedToNull<Object>({name: "Test"});
\`\`\`

You can use more than one generic type:

\`\`\`ts
function doSth<T,Y> (value: T, category: Y) {}
\`\`\`

### Extending generics

A generic type can extend an interface or object type. Use this when you expect that the object contains some properties or functions that the code uses later.

\`\`\`ts
function mySubStr<T extends string>(arg: T): string {
    return arg.substr(1, 10);
}
\`\`\`

\`arg\` must be a \`string\` or an object that extends \`string\`, for example:

\`\`\`ts
interface ExtendedString extends String{
    newStringFunction(): number
}

mySubStr(arg: ExtendedString);
\`\`\`

> **NOTE:** \`mySubStr(arg: ExtendedString)\` only shows the parameter type. It is not a valid call.

> **NOTE:** Dated (checked November 2026): \`String.prototype.substr\` is deprecated. Use \`substring(1, 11)\` or \`slice(1, 11)\` for the same characters.

Another example: the code must use the \`length\` property of the object, so the property must exist. Create the \`ILengthwise\` interface:

\`\`\`ts
interface ILengthwise {
   length: number
}
\`\`\`

Then use it to make sure that the generic type contains the \`length\` property:

\`\`\`ts
function doSthWithLength<T extends ILengthwise>(arg: T): number {
    return arg.length;  // we can be sure that length property exists here
}
\`\`\`

## Enums

An enum defines a set of named constants. You can then use them as a dictionary.

\`\`\`ts
enum Direction {
    Up,
    Down = 1,  // custom values can be assigned to enums
    Left,
    Right,
}
\`\`\`

Usage:

\`\`\`ts
function move(direction: Direction): void {
    if(direction == Direction.Up) {
        // some code here
    }
}
\`\`\`

### Constant and computed enum members

The compiler calculates constant members at compile time. Computed members get their value at run time.

\`\`\`ts
enum FileAccess {
    // constant members
    None,
    Read    = 1 << 1,
    Write   = 1 << 2,
    ReadWrite  = Read | Write,
    F = Read + Write,
    // computed member
    G = "123".length
}
\`\`\`

### Reverse enum member

\`\`\`ts
enum MyEnum {
    A, 
    B
}
const member = MyEnum[0];
\`\`\`

\`member\` is \`"A"\`.

## Advanced types

### Intersection and union types

**Intersection**

\`\`\`ts
interface Type1 {name: string;}
interface Type2 {age: number}

let myObject: Type1 & Type2
\`\`\`

\`Type1 & Type2\` means that the object contains the properties of both \`Type1\` and \`Type2\`.

A correct \`myObject\` value:

\`\`\`ts
myObject = {name: "test", age: 33}
\`\`\`

Incorrect \`myObject\` values:

\`\`\`ts
myObject = {name: "test"}
\`\`\`

\`\`\`ts
myObject = {name: "test", age: "test"}
\`\`\`

**Union**

\`\`\`ts
let value: string | boolean;
\`\`\`

The value can be a \`string\` or a \`boolean\`.

These values are correct:

\`\`\`ts
value = "Test";
\`\`\`

\`\`\`ts
value = true
\`\`\`

This value is incorrect:

\`\`\`ts
value = 2
\`\`\`

### Type guards

A type guard tells TypeScript the type of a value in a specific block of code.

A type guard implementation:

\`\`\`ts
function isNumber(x: any): x is number {
    return (<number>x).toPrecision !== undefined;
}
\`\`\`

A type guard usage:

\`\`\`ts
function doSth<T>(value: T) {
    if (isNumber(value)) {
    return value.toPrecision; // it's ok as TypeScript know that here value is number
    } else {
    return value.toPrecision; // Error - we don't have access to toPrecision here
    } 
}
\`\`\`

Because of \`x is number\`, TypeScript knows in which scope you have access to \`toPrecision\`.

### Type aliases

You can declare your own types:

\`\`\`ts
type MyType<T> = { parameter: T};
\`\`\`

Usage:

\`\`\`ts
let myString: MyType<string> = {parameter: "Test"}
let myNumber: MyType<number> = {parameter: 2}
\`\`\`

### Types and interfaces

**Types**

A type can make a tree structure for an object. An interface cannot, because it does not have intersection (\`&\`).

\`\`\`ts
type Tree<T> = T & { parent: Tree<T> };
\`\`\`

A type can limit a variable to a small set of values. Interfaces do not have union (\`|\`).

\`\`\`ts
type Choice = "A" | "B" | "C"
\`\`\`

With types, you can declare a \`NonNullable\` type with a conditional mechanism:

\`\`\`ts
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

**Interfaces**

Use an interface for OOP. Use \`implements\` to define the skeleton of an object or class.

\`\`\`ts
interface UserBase {
    user: string;
    password: string;
    login: (user: string, password: string) => boolean;
}

class User implements UserBase {
    user = "user1"
    password = "password1"

    login(user: string, password: string) {
        return (this.user == user && this.password == password)
    }
}
\`\`\`

An interface can extend other interfaces:

\`\`\`ts
interface MyObject {
    label: string,
}

interface MyObjectWithSize extends MyObject {
    size?: number
}
\`\`\`

### Conditional types

A generic type can change with a condition:

\`\`\`ts
type MyStringType<T> = T extends string ? string : Text;
\`\`\`

If \`T\` extends \`string\` (it contains all string properties and functions), the type is \`string\`. If not, the type is the custom \`Text\` type.

Another example:

\`\`\`ts
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

The \`NonNullable\` type checks that a value is not \`null\` or \`undefined\`. It must never be \`null\` or \`undefined\`.

### Index types

The \`keyof\` keyword gives all keys of an object:

\`\`\`ts
type testType = keyof {id: "test", age: 2};
\`\`\`

You can assign only \`"id"\` or \`"age"\` to a variable of the \`testType\` type.

Example 2:

\`\`\`ts
interface IMyInterface {
    id: number;
    name: string;
}

type Keys = {id: 1, name: "T" }[keyof IMyInterface];
\`\`\`

\`[keyof ...]\` after the object, not \`keyof\` before it, reverses the \`keyof\` behavior. Now you can assign only \`1\` and \`"T"\` (the values, not the property keys) to a value of the \`Keys\` type.

Example 3:

\`\`\`ts
type Key<T> = { [K in keyof T]: K }[keyof T];
\`\`\`

This type points to all keys in the \`T\` object, the same as \`keyof T\`. But you can use this construction to check the type of the keys:

\`\`\`ts
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
\`\`\`

This type accepts only the keys of \`T\` whose values are functions.

### Infer

From the TypeScript documentation: "Within the extends clause of a conditional type, it is now possible to have infer declarations that introduce a type variable to be inferred. Such inferred type variables may be referenced in the true branch of the conditional type. It is possible to have multiple infer locations for the same type variable."

\`\`\`ts
type MyUnionTypesBase<T> = T extends Array<infer U> ? U : never;
let myValue: MyUnionTypesBase<[number, string, boolean]>;
\`\`\`

\`myValue\` can be of type \`number | string | boolean\`.

## Symbols

You can use a predefined symbol, assigned to a variable, as an object key in place of a normal string key:

\`\`\`ts
const getSthSymbol = Symbol("getSth");

class SampleClass {
    [getSthSymbol](){
    return "something";
    }
}
\`\`\`

Symbols are unique:

\`\`\`ts
let sym2 = Symbol("key");
let sym3 = Symbol("key");
\`\`\`

\`sym2\` is not equal to \`sym3\` (\`sym2 != sym3\`).

## Modules

Modules are the import and export mechanism between files and objects.

The \`data.ts\` file:

\`\`\`ts
export class DataClass {
    ...
}
export interface Operations {
    ...
}
\`\`\`

Import from another file:

\`\`\`ts
import {DataClass as ImportedDataClass} from './data'
\`\`\`

Import all:

\`\`\`ts
import * as Data from './data'
\`\`\`

### Namespaces

A namespace is an encapsulated scope for classes, objects, functions, interfaces, and other items.

\`\`\`ts
namespace UserArea {
    export interface IUser {}
    export class User {}
    class Person {}
}
let user = UserArea.User;
\`\`\`

### Ambient modules

An ambient module is an encapsulated scope for classes, objects, functions, interfaces, and other items that you can export and import. From the TypeScript documentation: "We call declarations that don't define an implementation "ambient". Typically, these are defined in .d.ts files."

\`\`\`ts
declare module "path" {
    export function normalize(p: string): string;
    export function join(...paths: any[]): string;
    export var sep: string;
}
\`\`\`

Then import it:

\`\`\`ts
import * as URL from "path"
\`\`\`

### Declare a global object

Some JavaScript functions are global, and they can be without types. Use the \`declare\` keyword for them:

\`\`\`ts
declare const System: OurSystemObject;
\`\`\`

## Decorators

From the TypeScript documentation: "Decorators provide a way to add both annotations and a meta-programming syntax for class declarations and members."

\`\`\`ts
function customMethodDecorator(value: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {  
    descriptor.value = () => {
        return "Hello, " + value;
    };
    };
}
\`\`\`

This decorator changes the return value of the decorated function. The function then returns \`"Hello, "\` plus the value from the decorator.

\`\`\`ts
@customMethodDecorator("here is hacker")
    greet() {
    return "Hello, " + this.greeting;
    }
\`\`\`

\`greet()\` returns \`"Hello, here is hacker"\`.

## Generators

A generator runs a loop one step at a time:

\`\`\`ts
function* idMaker(){
    let index = 0;
    while(index < 3)
        yield index++;
}

let gen = idMaker();

let value;
value = gen.next().value // result 0
value = gen.next().value // result 1
value = gen.next().value // result 2
\`\`\`

## MVVM and CRUD examples

These examples show MVVM patterns with CRUD operations. All operations use \`async\` and \`await\`.

### Todo app with a view model

\`\`\`ts
// Model
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// Service (Repository layer)
class TodoService {
  private baseUrl = 'https://api.example.com/todos';

  async getTodosAsync(): Promise<Todo[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  }

  async getTodoAsync(id: number): Promise<Todo> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`);
    if (!response.ok) throw new Error(\`Todo \${id} not found\`);
    return response.json();
  }

  async createTodoAsync(title: string): Promise<Todo> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, completed: false })
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
  }

  async updateTodoAsync(todo: Todo): Promise<Todo> {
    const response = await fetch(\`\${this.baseUrl}/\${todo.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
  }

  async deleteTodoAsync(id: number): Promise<void> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  }
}

// ViewModel
class TodoViewModel {
  private service: TodoService;
  private todos: Todo[] = [];
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor() {
    this.service = new TodoService();
  }

  // Getters (like C# properties)
  getTodos(): Todo[] {
    return this.todos;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getError(): string | null {
    return this.error;
  }

  // Commands (like in MVVM)
  async loadTodosAsync(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      this.todos = await this.service.getTodosAsync();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }

  async addTodoAsync(title: string): Promise<void> {
    try {
      const newTodo = await this.service.createTodoAsync(title);
      this.todos.push(newTodo);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to add todo';
    }
  }

  async toggleTodoAsync(id: number): Promise<void> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    try {
      todo.completed = !todo.completed;
      await this.service.updateTodoAsync(todo);
    } catch (err) {
      todo.completed = !todo.completed; // Revert on error
      this.error = err instanceof Error ? err.message : 'Failed to update todo';
    }
  }

  async removeTodoAsync(id: number): Promise<void> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return;

    const removed = this.todos[index];
    this.todos.splice(index, 1);

    try {
      await this.service.deleteTodoAsync(id);
    } catch (err) {
      this.todos.splice(index, 0, removed); // Revert on error
      this.error = err instanceof Error ? err.message : 'Failed to delete todo';
    }
  }
}

// Usage
async function runApp(): Promise<void> {
  const viewModel = new TodoViewModel();

  // Load todos
  await viewModel.loadTodosAsync();
  console.log('Todos:', viewModel.getTodos());

  // Add new todo
  await viewModel.addTodoAsync('Learn TypeScript');

  // Toggle todo
  if (viewModel.getTodos().length > 0) {
    await viewModel.toggleTodoAsync(viewModel.getTodos()[0].id);
  }

  // Remove todo
  if (viewModel.getTodos().length > 0) {
    await viewModel.removeTodoAsync(viewModel.getTodos()[0].id);
  }

  if (viewModel.getError()) {
    console.error('Error:', viewModel.getError());
  }
}
\`\`\`

### User management with a generic repository

The abstract \`Repository<T>\` class works as \`IRepository<T>\` does in C#.

\`\`\`ts
// Base generic repository (like C# IRepository<T>)
abstract class Repository<T extends { id: number }> {
  protected baseUrl: string = '';

  async getAllAsync(): Promise<T[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error(\`Failed to fetch items\`);
    return response.json();
  }

  async getByIdAsync(id: number): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`);
    if (!response.ok) throw new Error(\`Item \${id} not found\`);
    return response.json();
  }

  async createAsync(item: Omit<T, 'id'>): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to create item');
    return response.json();
  }

  async updateAsync(item: T): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}/\${item.id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
  }

  async deleteAsync(id: number): Promise<void> {
    const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete item');
  }
}

// Concrete implementation
interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

class UserRepository extends Repository<User> {
  constructor() {
    super();
    this.baseUrl = 'https://api.example.com/users';
  }

  async findByEmailAsync(email: string): Promise<User | null> {
    const users = await this.getAllAsync();
    return users.find(u => u.email === email) || null;
  }

  async findByRoleAsync(role: 'user' | 'admin'): Promise<User[]> {
    const users = await this.getAllAsync();
    return users.filter(u => u.role === role);
  }
}

// ViewModel using repository
class UserManagementViewModel {
  private repository: UserRepository;
  private users: User[] = [];
  private isLoading: boolean = false;
  private error: string | null = null;

  constructor() {
    this.repository = new UserRepository();
  }

  async initializeAsync(): Promise<void> {
    try {
      this.isLoading = true;
      this.users = await this.repository.getAllAsync();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Initialization failed';
    } finally {
      this.isLoading = false;
    }
  }

  async createUserAsync(name: string, email: string): Promise<void> {
    try {
      const newUser = await this.repository.createAsync({
        name,
        email,
        role: 'user'
      });
      this.users.push(newUser);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create user';
      throw err;
    }
  }

  async updateUserAsync(user: User): Promise<void> {
    try {
      const updated = await this.repository.updateAsync(user);
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users[index] = updated;
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to update user';
      throw err;
    }
  }

  async deleteUserAsync(id: number): Promise<void> {
    try {
      await this.repository.deleteAsync(id);
      this.users = this.users.filter(u => u.id !== id);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to delete user';
      throw err;
    }
  }

  async promoteToAdminAsync(id: number): Promise<void> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');

    user.role = 'admin';
    await this.updateUserAsync(user);
  }

  getUsers(): User[] {
    return this.users;
  }

  getAdmins(): Promise<User[]> {
    return this.repository.findByRoleAsync('admin');
  }

  getError(): string | null {
    return this.error;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }
}
\`\`\`

## Interview questions

**What is a tuple type?**

An array that contains items of different types. Refer to [Basic variable types](#basic-variable-types).

**When is the never type useful?**

\`never\` tells that a part of the code must not be reachable. For example, this function has an infinite loop:

\`\`\`ts
function loopForever(): never {
    while (true) {}
}
\`\`\`

\`never\` is more useful when you create advanced types, to show what a type is not. For example, declare your own \`NonNullable\` type:

\`\`\`ts
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

The type checks if \`T\` is \`null\` or \`undefined\`. If it is, the type says that this must never occur. Usage:

\`\`\`ts
let value: NonNullable<string>;
value = "Test";
value = null; // error
\`\`\`

**What is the difference between named, anonymous, and arrow functions?**

Refer to [Functions](#functions).

**How many constructors can a class have?**

Only one constructor implementation. You can declare more than one overload signature, but all signatures share the one implementation.

**What is the difference between extends and implements?**

A class can extend other classes or objects. A class implements an interface.

For \`MyObject\`:

\`\`\`ts
class ChildObject extends MyObject 
\`\`\`

For \`IMyObject\`:

\`\`\`ts
class ChildObject implements IMyObject 
\`\`\`

**What is the difference between types and interfaces?**

Refer to [Types and interfaces](#types-and-interfaces).

**What is keyof?**

The \`keyof\` keyword gives all keys of an object. For \`type testType = keyof {id: "test", age: 2};\`, \`testType\` is \`"id" | "age"\`. Refer to [Index types](#index-types).

**What is the tsconfig.json file?**

The file specifies the root files and the compiler options that are necessary to compile the project.

**What is a computed enum value?**

A computed member gets its value at run time, not at compile time. Constant members get their value at compile time. Refer to [Constant and computed enum members](#constant-and-computed-enum-members).

**What are files with the d.ts extension for?**

They are usually module template files that keep the typings for JavaScript code.

**Which conditional types does TypeScript predefine?**

| Type | Description |
| --- | --- |
| \`Exclude<T, U>\` | Excludes from \`T\` the types that you can assign to \`U\`. |
| \`Extract<T, U>\` | Extracts from \`T\` the types that you can assign to \`U\`. |
| \`NonNullable<T>\` | Excludes \`null\` and \`undefined\` from \`T\`. |
| \`ReturnType<T>\` | Gets the return type of a function type. |
| \`InstanceType<T>\` | Gets the instance type of a constructor function type. |

Refer to the [TypeScript 2.8 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html).

**What is the type of box here?**

\`\`\`ts
interface MyInterface {
   name: string;
}

interface MyInterface {
   age: number;
}

let box: MyInterface 
\`\`\`

The type is \`{name: string, age: number};\`.

**What is the unknown type?**

\`unknown\` is the least-capable type in TypeScript. It does not allow the typical operations of a specific type.

\`\`\`ts
function f10(x: unknown) {
    x == 5;
    x = "5";
    x = x + 1; // not allowed
    x = null; 
    x > 0  // not allowed
    x.Test() // not allowed
}
\`\`\`

**Can you use TypeScript without JavaScript?**

No. The compiler compiles TypeScript to JavaScript, so you cannot use TypeScript without it.

**What is the DefinitelyTyped repository?**

It is a GitHub repository with types for most popular JavaScript libraries. Install them with npm with the \`@types\` prefix, for example \`npm install @types/node\`.

**What is a Promise, and how does it relate to Task in C#?**

\`Promise<T>\` is the TypeScript equivalent of \`Task<T>\` in C#. It is an asynchronous operation that resolves to a value or rejects with an error.

\`\`\`ts
// C# Task<string>
// async Task<string> GetUserAsync() { ... }

// TypeScript Promise<User>
async function getUserAsync(): Promise<User> {
  // ...
}
\`\`\`

**Can a function return void?**

Usually, no. For async functions, return \`Promise<void>\`, not \`void\`. Then callers can await the operation and handle errors correctly.

\`\`\`ts
// BAD
function saveAsync(): void {
  fetch('/api/save');
}

// GOOD
async function saveAsync(): Promise<void> {
  const response = await fetch('/api/save');
  if (!response.ok) throw new Error('Save failed');
}
\`\`\`

**What is the difference between any and unknown?**

\`any\` stops all type checks. \`unknown\` makes you narrow the type before you use the value. Use \`unknown\`, because it is safer.

\`\`\`ts
function process(value: any): void {
  value.foo(); // allowed (but unsafe)
}

function processUnknown(value: unknown): void {
  value.foo(); // error
  
  if (typeof value === 'object' && value !== null && 'foo' in value) {
    (value as { foo: () => void }).foo(); // now safe
  }
}
\`\`\`

**How do you handle errors with async and await?**

Use \`try\` and \`catch\` blocks, as in C#:

\`\`\`ts
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('HTTP error');
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error; // Re-throw or return default value
  }
}
\`\`\`

**How do you structure a React component with TypeScript and async data?**

Use a view model or a custom hook for state management:

\`\`\`ts
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
}

function UserComponent(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async (): Promise<void> => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

> **NOTE:** Dated (checked November 2026): The React 19 types removed the global \`JSX\` namespace. Use \`React.JSX.Element\` (import \`React\` or the \`JSX\` type from \`react\`) as the return type.

## Related links

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [typescript-cheatsheet repository](https://github.com/delprzemo/typescript-cheatsheet.git)
- [Angular cheat sheet (delprzemo)](https://github.com/delprzemo/angular-cheatsheet)
- [ReactJS cheat sheet (delprzemo)](https://github.com/delprzemo/react-cheatsheet)
- [Angular in 90ish minutes: developer guide](doc:angular-in-90-minutes)
`;export{e as default};