var e=`---
title: React cheat sheet
summary: React basics in one place: JSX, components, routing, state, forms, tests, hooks, TypeScript, and React Native todo apps with Expo.
category: React
order: 10
---

# React cheat sheet

This cheat sheet collects the basic React features in one place, from JSX to hooks, tests, and TypeScript. It also contains React Native todo apps (with and without Expo) and folder structures. The base is the [React Cheatsheet by delprzemo](https://github.com/delprzemo/react-cheatsheet), which [foreach.pl](https://foreach.pl) trainers made for training participants.

## Documentation and libraries

### React and web

| Name | Link | Notes |
| --- | --- | --- |
| React documentation | [react.dev/learn](https://react.dev/learn) | |
| React Navigation | [reactnavigation.org](https://reactnavigation.org/docs/getting-started) | |
| Next.js | [nextjs.org/docs](https://nextjs.org/docs) | |
| Capacitor | [capacitorjs.com](https://capacitorjs.com/docs/basics/workflow) | Workflow basics |
| React and React Native, 5th Edition | [GitHub](https://github.com/PacktPublishing/React-and-React-Native-5E) | Book: build cross-platform JavaScript and TypeScript apps for the web, desktop, and mobile |
| Full-stack React, Prisma, and PostgreSQL with Podman | [Article](doc:react-prisma-postgresql-podman) | Tutorial |

### UI libraries

| Name | Link |
| --- | --- |
| Fluent UI | [react.fluentui.dev](https://react.fluentui.dev) |
| Chakra UI | [chakra-ui.com](https://www.chakra-ui.com) |
| Mantine | [mantine.dev](https://mantine.dev) |
| shadcn/ui | [ui.shadcn.com](https://ui.shadcn.com) |
| Ant Design | [ant.design](https://ant.design) |
| React Aria | [react-aria.adobe.com](https://react-aria.adobe.com) |
| Radix UI | [radix-ui.com](https://www.radix-ui.com) |
| Material UI | [mui.com](https://mui.com/material-ui/getting-started/) |

### React Native and Expo

| Name | Link | Notes |
| --- | --- | --- |
| React Native documentation | [reactnative.dev](https://reactnative.dev/docs/getting-started) | |
| React Native Directory | [reactnative.directory](https://reactnative.directory) | Library catalog |
| React Native Paper | [reactnativepaper.com](https://reactnativepaper.com) | |
| Async Storage | [react-native-async-storage.github.io](https://react-native-async-storage.github.io/2.0/) | Version 2.0 documentation |
| Expo documentation | [docs.expo.dev](https://docs.expo.dev) | |
| Expo UI | [docs.expo.dev](https://docs.expo.dev/versions/latest/sdk/ui/) | |
| Expo React Native RSS Feed Reader app | [GitHub](https://github.com/tshego3/ExpoFeedReader) | Sample app |

## Basic React commands

| Command | Notes |
| --- | --- |
| \`npx create-react-app@latest {app name} --template @fluentui/cra-template@latest\` | Create a React app with the Fluent UI template. |
| \`npx create-react-app@latest {app name} --template typescript@latest\` | Create a React app with TypeScript. |
| \`npm install\` | Download and set up all project dependencies in the \`node_modules\` folder. |
| \`npm run dev\` | Run a custom command from the \`scripts\` in \`package.json\`. |
| \`npm start\` | Run the project locally. |
| \`npm test\` | Run the tests. |
| \`npm run eject\` | Remove the single build dependency from the project. |
| \`npm cache clean --force\` | Clean the cache. |
| \`npm uninstall @packageName\` | Uninstall a package. |

> **NOTE:** Dated (checked November 2026): The React team deprecated Create React App in February 2025. For new projects, use a framework or a build tool such as Vite (\`npm create vite@latest\`).

## JSX

JSX lets you write HTML elements in JavaScript and put them in the DOM. JSX changes HTML tags into React elements.

### Inject JavaScript into HTML

\`\`\`js
 const value = 'Hello world';
 return (<div>{value}</div>);
\`\`\`

React shows "Hello world" in the \`<div>\` element.

### Element declaration

\`\`\`js
 const value = 'Hello World';
 const element = <div className="App">{value}</div>;
 return (element);
\`\`\`

You can assign a DOM fragment to a variable (\`element\`) and use it again in other places.

### Function injection

\`\`\`js
 function addNumbers(x1, x2) {
   return x1 + x2;
 }
 const element = <div className="App">{addNumbers(2, 5)}</div>
\`\`\`

You can inject more than string values. The result is a \`div\` that contains 7.

### Attributes

\`\`\`js
  const avatarUrl = "img/picture.jpg"
  const element = <img src={avatarUrl}></img>;
\`\`\`

You can also use JavaScript for the properties and events of DOM elements.

### Fragments

JSX must have one top parent element. If you do not want to wrap the HTML in a \`div\` or another element, use a fragment. React does not render the fragment in the HTML.

\`\`\`js
<React.Fragment>
   <td>val1</td>
   <td>val2</td>
</React.Fragment>
\`\`\`

The short syntax:

\`\`\`js
<>
  <td>val1</td>
  <td>val2</td>
</>
\`\`\`

### References

A reference lets JavaScript code use an HTML element.

1. Declare a reference:

   \`\`\`js
   this.element = React.createRef();
   \`\`\`

2. Assign the reference to an element:

   \`\`\`js
   <div ref={this.element}></div>
   \`\`\`

3. Use the reference to interact with the element:

   \`\`\`js
   this.element.current.focus();
   \`\`\`

> **TIP:** \`createRef\` works in class components. In function components, use the \`useRef\` hook. See [Other hooks](#other-hooks).

### Spread operator

The spread operator (spread syntax) in JavaScript and TypeScript extends or overrides parts of an object without a full rewrite. For example, you can keep a theme consistent with the defaults and change only the values that you need.

\`\`\`js
const base = { a: 1, b: 2 };
const extended = { ...base, b: 99, c: 3 };

console.log(extended);
// { a: 1, b: 99, c: 3 }
\`\`\`

## Components

The old React documentation said: "React lets you define components as classes or functions. Components defined as classes currently provide more features".

> **NOTE:** Dated (checked November 2026): Hooks give function components the same features as classes. The React documentation now recommends function components for new code.

### Function component

\`\`\`js
function App() {
  return <div>Hello World</div>;
}
export default App;
\`\`\`

A component with parameters (props):

\`\`\`js
function Welcome(props) {
    return <h1>Hello, {props.name}</h1>;
}
\`\`\`

\`\`\`js
<Welcome name="Sara" />
\`\`\`

### Class component

\`\`\`js
class App extends React.Component  {
  render() {
    return <div>Hello World</div>;
  }
}
export default App;
\`\`\`

A component with parameters:

\`\`\`js
class Welcome extends React.Component  {
  render() {
    return <div>Hello {this.props.name}</div>;
  }
}
export default Welcome;
\`\`\`

\`\`\`js
<Welcome name="Sara" />
\`\`\`

### Events

An \`onClick\` event on an element:

\`\`\`js
<a href="#" onClick={this.onClick}> Click me </a>
\`\`\`

The \`onClick\` function:

\`\`\`js
onClick(e) {
    e.preventDefault();
    // some logic here
}
\`\`\`

To use \`this\` in an event handler, use one of these methods:

1. Bind \`this\`:

   \`\`\`js
   this.onClick = this.onClick.bind(this);
   \`\`\`

2. Use an arrow function. An arrow function does not need a bind, because it keeps \`this\` from the surrounding scope (the compiled code uses a \`_this = this\` variable).

   \`\`\`js
   onClick = (e) => {
       e.preventDefault();
       console.log(this);
   }
   \`\`\`

   Or use an arrow function in the JSX:

   \`\`\`js
    <a href="#" onClick={(e) => this.onClick(e)}> Click me</a>
   \`\`\`

### Child events

A child component can call a function in the parent component.

In the child component:

\`\`\`js
this.props.onChange(val1, val2,...)
\`\`\`

In the parent component:

\`\`\`js
 <Child onChange={hasChanged} />
\`\`\`

\`\`\`js
function hasChanged(val1, val2,...) {
 // some logic here
}
\`\`\`

### Conditional element

These options show an element only when a condition is true.

Option 1:

\`\`\`js
function SomeElement(props) {
   const show = props.isShowed;
   if(show) {
      return <div>Here is element</div>;
   }         
}
\`\`\`

\`\`\`js
<SomeElement isShowed = {true} />
\`\`\`

Option 2: put the element in a variable, then use the variable in the JSX.

\`\`\`js
let element;      
if(this.state.isShown) {
    element  = <div> Here is element </div>;
} 
\`\`\`

Option 3: the conditional (ternary) operator.

\`\`\`js
{this.state.isShow  ?  <div> Here is element </div> : 'No element'}
\`\`\`

Option 4: the logical AND operator.

\`\`\`js
{this.state.isShow  &&  <div> Here is element </div>}
\`\`\`

### List of elements

Use the \`map\` function to show a list of the same components:

\`\`\`js
const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((number, index) =>
  <li key={number.toString()}>
    {number}
  </li>
);
\`\`\`

Then use \`listItems\` in the JSX. The \`key\` property is mandatory. It identifies each row in the list.

### Content projection

Content projection injects HTML from a parent component into a child component.

Parent component:

\`\`\`js
<MyElement><h1>Hello world</h1></MyElement>
\`\`\`

Child component (\`MyElement\`):

\`\`\`js
<div>
   {this.props.children}
</div>
\`\`\`

React puts \`<h1>Hello world</h1>\` where the child uses \`{this.props.children}\`. The result is:

\`\`\`js
<div>
   <h1>Hello world</h1>
</div>
\`\`\`

### Higher-order component

A higher-order component (HOC) is a parameterized component. You can use it again in different ways.

\`\`\`js
const myHoc = settings => WrappedComponent => {
    return class DecoratingComponent extends React.Component {
        render() {
            return (<div className={settings}><WrappedComponent {...this.props} /></div>)
        }
    }
}
\`\`\`

Usage:

\`\`\`js
const MyWrappedComponent = myHoc('test')(SomeComponent);
<MyWrappedComponent/>
\`\`\`

React injects \`test\` into \`className\`.

## Routing

These examples use the \`react-router-dom\` library.

\`\`\`bash
npm install react-router-dom 
\`\`\`

> **NOTE:** Dated (checked November 2026): These examples use the React Router v5 API (\`Switch\`, \`Redirect\`, \`component\`, and \`match\`). React Router v6 and later use \`Routes\`, \`Navigate\`, the \`element\` prop, and the \`useParams\` hook.

An area that renders the component that matches the current URL:

\`\`\`js
<Router>
   <Switch>
     <Route path="/help"><Help /></Route>
     <Route path="/list"><List /></Route>
     <Route path="/"><Home /></Route>
   </Switch>
 </Router>
\`\`\`

A link that changes the current URL:

\`\`\`js
<Link className="nav-link" to="/list">List</Link>
\`\`\`

> **TIP:** \`Route\` and \`Link\` must be in the same \`Router\` element.

### Nested routing

Parent:

\`\`\`js
<Route path="/some" component={SomeComponent}></Route>
\`\`\`

\`SomeComponent\`:

\`\`\`js
function  SomeComponent({ match }) {
    return (
        <Router>
            <Switch>
                <Route path={\`\${match.path}/child\`}><Child /></Route>
            </Switch>
        </Router>
    )
}
\`\`\`

### Routing with parameters

\`\`\`js
<Route path="/some/:id" component={SomeComponent}></Route>
\`\`\`

\`SomeComponent\` can then read the parameter:

\`\`\`js
{match.params.id}
\`\`\`

### Authentication

Create a custom route component that shows a component only when your authentication logic passes:

\`\`\`js
function PrivateRoute({ component: Component, ...rest }) {
    return (
        <Route {...rest} render={(props) => (_isAuthentictedLogic_) ?
            (<Component {...props} />) :
            (<Redirect to={{ pathname: "/noAccess", state: { from: props.location } }} />
            )}
        />
    );
}
\`\`\`

Then use \`PrivateRoute\` in place of \`Route\`:

\`\`\`js
<PrivateRoute path="/list" component={List}></PrivateRoute>
\`\`\`

## State and life cycle

### State

The state controls the updates of a component. When the state changes, React renders the component again.

Declare the initial state:

\`\`\`js
constructor(props) {
    super(props);
    this.state = { userId: 2, userName: "Jannice"};
}
\`\`\`

Use the state:

\`\`\`js
<div> {this.state.userName} </div>
\`\`\`

Update the state. After \`setState\`, React renders the component again.

\`\`\`js
this.setState({ userId: 3, userName: "Tom"});
\`\`\`

### Life cycle

| Life cycle method | Notes |
| --- | --- |
| \`componentDidMount\` | Called at the start of the component life, after the component renders. |
| \`componentWillUnmount\` | Called before React unmounts the component. |
| \`componentWillUpdate\` | Called before React renders the component again (after a change). |
| \`componentDidUpdate\` | Called after React renders the component again (after a change). |
| \`componentDidCatch\` | Called when a descendant component throws an error. |
| \`shouldComponentUpdate\` | Decides if the component updates after a change. |
| \`getDerivedStateFromProps\` | Called at the start of the component life and when props or state change. |
| \`getSnapshotBeforeUpdate\` | Called immediately before React renders the component again, to save state. |

> **NOTE:** Dated (checked November 2026): React 16.3 deprecated \`componentWillUpdate\`. The legacy name is now \`UNSAFE_componentWillUpdate\`. In new code, use \`componentDidUpdate\` together with \`getSnapshotBeforeUpdate\`.

\`\`\`js
componentDidMount() {
    console.log("componentDidMount")
    // some logic here
}

componentWillUnmount() {
    console.log("componentWillUnmount")
    // some logic here
}
\`\`\`

## Forms

\`\`\`js
onValueChange  = (event) => {
    this.setState({ value:  event.target.value  });
}
\`\`\`

\`\`\`js
onSubmit = (e) => {
	e.preventDefault();
	// Submit logic
}
\`\`\`

\`\`\`js
<form onSubmit={this.onSubmit}>
    <input type="text"
        value={this.state.value}
        onChange={this.onValueChange}
    />
    
    <input type="submit" value="Send" />
</form>
\`\`\`

For form validation, see [this article](https://webfellas.tech/#/article/5).

## HTTP requests

You can use the Axios library to call a backend API.

\`\`\`bash
npm install axios
\`\`\`

GET request:

\`\`\`js
axios.get('/user', {
params: {ID: 12345}
}).then(function (response) {
   //some logic here
})
.catch(function (error) {
   //some logic here
})
.finally(function () {
   //some logic here
}); 
\`\`\`

POST request:

\`\`\`js
axios.post('/user', {
    firstName: 'Fred',
    id: 2
}).then(function (response) {
    //some logic here
})
.catch(function (error) {
    //some logic here
});
\`\`\`

Async call:

\`\`\`js
const response = await axios.get('/user?ID=12345');
\`\`\`

## Tests

| Command | Use |
| --- | --- |
| \`npm install --save-dev jest\` | Run tests. |
| \`npm install --save-dev @testing-library/react\` | Functions that help you test React components. |

Sample test:

\`\`\`js
let container = null;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  container = null;
});
it("renders menu with Help", () => {
  act(() => {
    render(<Router><SomeComponent /></Router>, container);
  });
  expect(container.textContent).toBe("Some text inside");
});
\`\`\`

> **NOTE:** Dated (checked November 2026): React 18 deprecated \`render(element, container)\` and \`unmountComponentAtNode\` from \`react-dom\`, and React 19 removed them. Use \`render\` from \`@testing-library/react\`. It returns the container and cleans up after each test.

### Interaction

Import \`fireEvent\`:

\`\`\`js
import { fireEvent } from '@testing-library/react'
\`\`\`

Click an element:

\`\`\`js
fireEvent.click(container.querySelector('.some-class'));
\`\`\`

Change the value of an input:

\`\`\`js
fireEvent.change(container.querySelector('.some-class'), {
    target: { value: "12345" }
});
\`\`\`

Check if an element has a class:

\`\`\`js
expect(someEl.classList.contains('disabled')).toBe(false);
\`\`\`

### Mocking HTTP

\`\`\`bash
npm install axios-mock-adapter --save-dev
\`\`\`

\`\`\`js
var axios = require('axios');
var MockAdapter = require('axios-mock-adapter');
var mock = new MockAdapter(axios);
\`\`\`

\`\`\`js
mock.onGet('/users').reply(200, {
  users: [
    { id: 1, name: 'John Smith' }
  ]
});
\`\`\`

With a specific parameter:

\`\`\`js
mock.onGet('/users', { params: { searchText: 'John' } }).reply()
\`\`\`

### Mocking components

\`\`\`js
jest.mock("./SomeComponent", () => {
  return function DummyComponent(props) {
    return (
      <div data-testid="square">
        here is square
      </div>
    );
  };
});
\`\`\`

## Context

A context holds data that a tree of components shares.

Declare the context. \`'red'\` is the default value.

\`\`\`js
import React from 'react';
export const ColorContext = React.createContext('red');
\`\`\`

Provide the context to child components:

\`\`\`js
const { Provider } = ColorContext;
return (
    <Provider value={this.state.color}>
    	<SomeComponent />
    </Provider>
);
\`\`\`

Use the context in a child component:

\`\`\`js
const { Consumer } = ColorContext;
return (
   <Consumer>
	{value => <div>{value}</div>}
   </Consumer>
)
\`\`\`

Use the context in a class component outside the \`render\` function:

\`\`\`js
static contextType = ColorContext;

render() {
    let value = this.context;
    // use value here
}
\`\`\`

With \`contextType\`, \`this.context\` is the context value itself.

## Hooks

Hooks let function components use React features that were only for classes before, such as state.

### Basic hooks

#### useState

\`useState\` can replace state management in a class.

\`\`\`js
const [count, setCount] = useState(0);
\`\`\`

- \`count\` reads the value.
- \`0\` is the default value of \`count\`.
- \`setCount(10)\` changes the value of \`count\`.

#### useEffect

\`useEffect\` can replace \`componentDidMount\`, \`componentDidUpdate\`, \`componentWillUnmount\`, and other life cycle methods.

In place of \`componentDidMount\` and \`componentDidUpdate\`:

\`\`\`js
useEffect(() => {
    document.title = \`Clicked \${count}\`;
});
\`\`\`

In place of \`componentWillUnmount\`, return a cleanup function:

\`\`\`js
useEffect(() => {
    return () => {/*unsubscribe*/};
});
\`\`\`

#### useContext

The hook for context. See [Context](#context).

Parent:

\`\`\`js
const CounterContext = React.createContext(counter);
// counter is the default value; define it before this line

function App() {
  return (
    <CounterContext.Provider value={10}>
      <ChildComponent />
    </CounterContext.Provider>
  );
}
\`\`\`

Child:

\`\`\`js
const counter = useContext(CounterContext);
\`\`\`

### Other hooks

| Hook | Usage | Notes |
| --- | --- | --- |
| \`useReducer\` | \`const [state, dispatch] = useReducer(reducer, initialArg, init);\` | State with a reducer, in the Redux style. |
| \`useCallback\` | \`const memoizedCallback = useCallback(() => {doSomething(a, b);},[a, b],);\` | Returns a memoized callback. |
| \`useMemo\` | \`const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);\` | Returns a memoized value. |
| \`useRef\` | \`const refContainer = useRef(initialValue);\` | A reference to an element. |
| \`useDebugValue\` | \`useDebugValue(value)\` | Shows information in React DevTools. |

### Custom hook

You can make your own hooks:

\`\`\`js
function useColor(initialColor) {
    const [color, changeColor] = useState(initialColor);
    function change(color) {
        changeColor(color);
    }
    useEffect(() => {
        console.log('Color changed');
    });
    return [color, change];
}
\`\`\`

## TypeScript in React

### Add TypeScript to a project

| Command | Use |
| --- | --- |
| \`npx create-react-app my-app --template typescript\` | Create an app with TypeScript (Create React App is deprecated, see [Basic React commands](#basic-react-commands)). |
| \`npm install --save typescript @types/node @types/react @types/react-dom @types/jest\` | Add TypeScript to a project. |
| \`npx tsc --init\` | Create \`tsconfig.json\`. |

### Add a type for a custom DOM element

\`\`\`ts
declare namespace JSX {
    interface IntrinsicElements {foo: any}
}
<foo />; // ok
<bar />; // error
\`\`\`

## Interview questions

| Question | Answer |
| --- | --- |
| How do you declare a component? | Use a class that extends \`React.Component\`, or a function with the \`React.FC\` type that returns JSX. |
| What is the difference between a function component and a class component? | Classes used to have more features. Hooks give function components the same features. |
| In which type of component can you use hooks? | Function components. |
| How do you inject HTML from a parent component into a child component? | Use content projection: \`this.props.children\` contains the HTML from the parent. See [Content projection](#content-projection). |
| What does the \`useEffect\` hook do? | It can replace \`componentDidMount\`, \`componentDidUpdate\`, \`componentWillUnmount\`, and other life cycle methods. See [Basic hooks](#basic-hooks). |
| What is the difference between state and props? | The state controls the updates of a component. When the state changes, React renders the component again. Props are parameters that a parent component sends to a child component. |
| What is a higher-order component? | A parameterized component that you can use again in many ways. See [Higher-order component](#higher-order-component). |
| What is JSX? | JSX lets you write HTML elements in JavaScript and put them in the DOM. It changes HTML tags into React elements. See [JSX](#jsx). |
| How do you create a React app? | Run \`npx create-react-app {app name}\`. Create React App is deprecated. For new apps, use Vite (\`npm create vite@latest\`) or a framework. |
| What is the result of \`npm run eject\`? | React no longer manages the Webpack configuration for you. You get access to the Webpack configuration files and can change them. |

## React Native development environment on macOS

Install these tools before you make the React Native todo apps in the next sections.

### Homebrew, Node.js, and Watchman

\`\`\`bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Check your version
brew --version
# Uninstall Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"

# Install Node.js (v18 or newer, this also updates Homebrew and Node.js)
brew install node
# Check your version
node -v && npm -v
# Uninstall Node.js
brew uninstall node
# Cleanup Node.js global packages
npm list -g --depth=0
npm uninstall -g <package-name>  # Replace with actual package name

# Install Watchman (for file watching)
brew install watchman
# Check your version
watchman --version
# Uninstall Watchman
brew uninstall watchman
\`\`\`

### Shell paths

1. Open the \`.zshrc\` file in a text editor. The command opens the default text editor (usually TextEdit on macOS).

   \`\`\`bash
   open ~/.zshrc
   \`\`\`

2. Add these lines at the bottom of the file, then save and close it:

   \`\`\`bash
   export PATH="/opt/homebrew/bin:$PATH" # This ensures the CocoaPods CLI tools like pod are available in your terminal
   export PATH=$PATH:~/Library/Android/sdk # This ensures the Android SDK tools like adb are available in your terminal
   export PATH=$PATH:~/Library/Android/sdk/platform-tools
   export PATH=$PATH:~/Library/Android/sdk/emulator
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export GEM_HOME=$HOME/.gem
   export PATH=$GEM_HOME/bin:$PATH
   \`\`\`

3. Apply the changes:

   \`\`\`bash
   source ~/.zshrc
   \`\`\`

### Ruby

\`\`\`bash
# Install a newer Ruby version
brew install ruby # brew reinstall ruby
# Open your .zshrc file in a text editor
open ~/.zshrc
# Add this to your .zshrc file
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
# Apply the changes
source ~/.zshrc
# Check your version
ruby -v
\`\`\`

### TypeScript, React Native CLI, and Expo CLI

| Tool | Install | Check the version | Uninstall |
| --- | --- | --- | --- |
| TypeScript | \`npm install -g typescript\` | \`tsc --version\` | \`npm uninstall -g typescript\` |
| React Native CLI | \`npm install -g @react-native-community/cli\` | \`npx @react-native-community/cli --version\` | \`npm uninstall -g @react-native-community/cli\` |
| Expo CLI | \`npm install -g @expo/cli\` | \`npx expo --version\` | \`npm uninstall -g @expo/cli\` |

If an install command fails because of permissions, use \`sudo\`.

### CocoaPods for iOS

CocoaPods is necessary for iOS tests on macOS.

\`\`\`bash
brew install cocoapods
# Check version
pod --version # If failed: brew link --overwrite cocoapods
# Uninstall CocoaPods
brew uninstall cocoapods
\`\`\`

### Java Development Kit

If Android Studio is not installed, install the Azul Zulu OpenJDK distribution with Homebrew. Azul Zulu has JDKs for Apple silicon and Intel Macs.

\`\`\`bash
brew install --cask zulu@17 # brew reinstall zulu@17
# Open your .zshrc file in a text editor
open ~/.zshrc
# Add this to your .zshrc file
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
# Apply the changes
source ~/.zshrc
# Check your version
java -version
\`\`\`

### Xcode tools and devices

\`\`\`bash
# Install or update command-line tools (prompts a GUI installer if needed)
xcode-select --install
# Ensure Xcode path is correctly set
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
# Accept Xcode license
sudo xcodebuild -license accept # sudo xcodebuild -license
# Test simctl
xcrun simctl help

# List available iOS simulators and their UDIDs
xcrun simctl list devices
# JSON output (easier to parse programmatically)
xcrun simctl list devices --json
# List available physical devices connected to your Mac and their UDIDs
xcrun xctrace list devices

# List connected Android devices/emulators
adb devices
\`\`\`

## React Native todo app with Expo

This app uses Expo, a React Native framework. Users log in with the dummyjson.com mock API and manage todos from the JSONPlaceholder API.

### Create the Expo project

The \`default\` template is for multi-screen apps. It includes the recommended tools, such as Expo CLI and the Expo Router library, and it enables TypeScript. It is suitable for most apps.

\`\`\`bash
# expo init TodoApp --template blank-typescript
npx create-expo-app@latest TodoApp --template default # use sudo if required
cd TodoApp
# Run the following command in your project's root directory:
npx expo install expo-dev-client
# Installs the CocoaPods dependencies listed in your Podfile. These are native iOS libraries your app depends on
cd ios
pod install --repo-update --ansi # use sudo and --allow-root if required
# Navigate back to the parent directory
cd ..
\`\`\`

### Run the Expo app

\`\`\`bash
# Start the development server
npx expo start

# Or run directly on specific platform
npx expo start --ios # npm run ios
npx expo run:ios --device 51F0082E-AC8D-4BD9-AD37-2A7811EA22A8
npx expo start --android # npm run android
npx expo run:android --device emulator-5554
npx expo start --web # npm run web

# When deploying on physical devices use the release configuration, as the debug configuration requires a development server
npx expo run:ios --device 00008140-00062D3122D0801C --configuration Release
    
# Clean cache if errors occur
npm cache clean --force # use sudo if required 
# Clear Expo cache directory
rm -rf ~/.expo
\`\`\`

### Expo project structure

\`\`\`text
TodoApp/
├── app.json               # Expo configuration
├── package.json
├── tsconfig.json
├── App.tsx               # Main app entry point
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ActivityIndicator.tsx
│   │   │   └── SafeAreaView.tsx
│   │   ├── login/
│   │   │   └── LoginForm.tsx
│   │   ├── todos/
│   │   │   ├── TodoList.tsx
│   │   │   └── TodoDetail.tsx
│   │   └── navigation/
│   │       └── AppNavigator.tsx
│   ├── models/
│   │   ├── TodoItem.ts
│   │   ├── User.ts
│   │   └── TokenResponse.ts
│   ├── services/
│   │   └── TodoService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTodos.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── utils/
│   │   ├── storage.ts
│   │   └── converters.ts
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── TodoListScreen.tsx
│       └── TodoDetailScreen.tsx
└── assets/               # Images, fonts, etc.
\`\`\`

> **NOTE:** The structure lists some files (for example \`SafeAreaView.tsx\`, \`LoginForm.tsx\`, \`AuthContext.tsx\`, and \`converters.ts\`) that this cheat sheet does not show.

### Expo package.json

\`\`\`json
{
  "name": "todoapp",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@expo/vector-icons": "^13.0.0",
    "expo-secure-store": "~12.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "react-native-screens": "~3.22.0",
    "react-native-safe-area-context": "4.6.3"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.0",
    "typescript": "^5.1.0"
  }
}
\`\`\`

> **NOTE:** Dated (checked November 2026): Expo SDK 49 and React Native 0.72 are from 2023. Create the project with \`npx create-expo-app@latest\`, then run \`npx expo install --fix\` to get the package versions that match the current Expo SDK.

### Expo configuration

\`app.json\`:

\`\`\`json
{
  "expo": {
    "name": "TodoApp",
    "slug": "todoapp",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-secure-store"
    ]
  }
}
\`\`\`

### TypeScript models

Both todo apps (with Expo and without a framework) use these models.

\`\`\`ts
// src/models/TokenResponse.ts
export interface TokenResponse {
  token_type?: string;
  expires_in: number;
  ext_expires_in: number;
  access_token?: string;
}
\`\`\`

\`\`\`ts
// src/models/TodoItem.ts
export interface TodoItem {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
\`\`\`

\`\`\`ts
// src/models/User.ts
export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
}

export interface UserResponse {
  users: User[];
}
\`\`\`

The service and hooks import the models from \`'../models'\`. Add an index file that exports them:

\`\`\`ts
// src/models/index.ts
export * from './TodoItem';
export * from './User';
export * from './TokenResponse';
\`\`\`

### Storage utility with Expo SecureStore

\`\`\`ts
// src/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

export const Storage = {
  // Username
  getUsername: async (): Promise<string> => {
    return (await SecureStore.getItemAsync('username')) || '';
  },
  setUsername: async (username: string): Promise<void> => {
    await SecureStore.setItemAsync('username', username);
  },

  // Password
  getPassword: async (): Promise<string> => {
    return (await SecureStore.getItemAsync('password')) || '';
  },
  setPassword: async (password: string): Promise<void> => {
    await SecureStore.setItemAsync('password', password);
  },

  // Access Token
  getAccessToken: async (): Promise<string> => {
    return (await SecureStore.getItemAsync('accessToken')) || '';
  },
  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync('accessToken', token);
  },

  // Token Expiration
  getAccessTokenExpiration: async (): Promise<Date> => {
    const expiration = await SecureStore.getItemAsync('accessTokenExpiration');
    return expiration ? new Date(expiration) : new Date();
  },
  setAccessTokenExpiration: async (expiration: Date): Promise<void> => {
    await SecureStore.setItemAsync('accessTokenExpiration', expiration.toISOString());
  },

  // Clear all storage (logout)
  clearAll: async (): Promise<void> => {
    await SecureStore.deleteItemAsync('username');
    await SecureStore.deleteItemAsync('password');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('accessTokenExpiration');
  },
};
\`\`\`

### Todo service

The service does the HTTP operations. Both todo apps use this service. The \`login\` method uses dummyjson.com for mock authentication.

\`\`\`ts
// src/services/TodoService.ts
import { TodoItem, UserResponse } from '../models';

export class TodoService {
  private baseUrl = 'https://jsonplaceholder.typicode.com';
  private dummyJsonUrl = 'https://dummyjson.com';

  async login(username: string, password: string): Promise<boolean> {
    try {
      // Using dummyjson.com for mock authentication
      const response = await fetch(\`\${this.dummyJsonUrl}/users\`);
      const userResponse: UserResponse = await response.json();

      if (userResponse.users) {
        const user = userResponse.users.find(
          u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );
        return user !== undefined;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }

    return false;
  }

  async getTodos(): Promise<TodoItem[]> {
    try {
      const response = await fetch(\`\${this.baseUrl}/todos\`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      return [];
    }
  }

  async getTodo(id: number): Promise<TodoItem | null> {
    try {
      const response = await fetch(\`\${this.baseUrl}/todos/\${id}\`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch todo:', error);
      return null;
    }
  }

  async createTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem | null> {
    try {
      const response = await fetch(\`\${this.baseUrl}/todos\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create todo:', error);
      return null;
    }
  }

  async updateTodo(id: number, todo: Partial<TodoItem>): Promise<TodoItem | null> {
    try {
      const response = await fetch(\`\${this.baseUrl}/todos/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todo),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update todo:', error);
      return null;
    }
  }

  async deleteTodo(id: number): Promise<boolean> {
    try {
      const response = await fetch(\`\${this.baseUrl}/todos/\${id}\`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      return false;
    }
  }
}
\`\`\`

### Custom hooks

The \`useAuth\` hook for Expo stores the credentials and a mock token (\`expo-mock-token\`) that expires after 1 hour. \`logout\` clears all stored values.

\`\`\`ts
// src/hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { TodoService } from '../services/TodoService';
import { Storage } from '../utils/storage';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const todoService = new TodoService();

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!username || !password) {
      return false;
    }

    setIsLoading(true);
    try {
      const isAuthenticated = await todoService.login(username, password);
      
      if (isAuthenticated) {
        await Storage.setUsername(username);
        await Storage.setPassword(password);
        await Storage.setAccessToken('expo-mock-token');
        await Storage.setAccessTokenExpiration(new Date(Date.now() + 3600000));
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await Storage.clearAll();
  }, []);

  return {
    isLoading,
    login,
    logout,
  };
};
\`\`\`

The \`useTodos\` hook loads the todos on mount. Both todo apps use this hook.

\`\`\`ts
// src/hooks/useTodos.ts
import { useState, useCallback, useEffect } from 'react';
import { TodoItem } from '../models';
import { TodoService } from '../services/TodoService';

export const useTodos = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const todoService = new TodoService();

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTodos = await todoService.getTodos();
      setTodos(fetchedTodos);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTodo = useCallback(async (id: number): Promise<TodoItem | null> => {
    return await todoService.getTodo(id);
  }, []);

  const createTodo = useCallback(async (todo: Omit<TodoItem, 'id'>): Promise<void> => {
    const newTodo = await todoService.createTodo(todo);
    if (newTodo) {
      setTodos(prev => [...prev, newTodo]);
    }
  }, []);

  const updateTodo = useCallback(async (id: number, todo: Partial<TodoItem>): Promise<void> => {
    const updatedTodo = await todoService.updateTodo(id, todo);
    if (updatedTodo) {
      setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updatedTodo } : t));
    }
  }, []);

  const deleteTodo = useCallback(async (id: number): Promise<void> => {
    const success = await todoService.deleteTodo(id);
    if (success) {
      setTodos(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  // Load todos on mount
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  return {
    todos,
    isLoading,
    loadTodos,
    getTodo,
    createTodo,
    updateTodo,
    deleteTodo,
  };
};
\`\`\`

### Activity indicator

\`\`\`ts
// src/components/common/ActivityIndicator.tsx
import React from 'react';
import { ActivityIndicator as ExpoActivityIndicator, StyleSheet, View } from 'react-native';

interface Props {
  isLoading: boolean;
}

export const ActivityIndicator: React.FC<Props> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <ExpoActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});
\`\`\`

### Login screen

The login screen checks the user name and password with \`useAuth\`. If the login succeeds, it replaces the screen with the todo list.

\`\`\`ts
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator } from '../components/common/ActivityIndicator';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login failed', 'Username and password are required.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigation.replace('TodoList');
    } else {
      Alert.alert('Login failed', 'Invalid username or password.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ActivityIndicator isLoading={isLoading} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Todo App</Text>
        <Text style={styles.subtitle}>Manage your tasks efficiently</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          autoCapitalize="none"
        />
        
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.demoText}>
          Demo credentials:{"\\n"}
          username: emilys{"\\n"}
          password: emilyspass
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  demoText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
});
\`\`\`

### Todo list screen

The list shows each todo with its status. Pull down to load the todos again (\`RefreshControl\`).

\`\`\`ts
// src/screens/TodoListScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTodos } from '../hooks/useTodos';
import { ActivityIndicator } from '../components/common/ActivityIndicator';
import { TodoItem } from '../models';

export const TodoListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { todos, isLoading, loadTodos } = useTodos();

  const renderTodoItem = ({ item }: { item: TodoItem }) => (
    <TouchableOpacity
      style={[
        styles.todoItem,
        item.completed && styles.todoItemCompleted
      ]}
      onPress={() => navigation.navigate('TodoDetail', { todo: item })}
    >
      <View style={styles.todoContent}>
        <Text style={[
          styles.todoTitle,
          item.completed && styles.todoTitleCompleted
        ]}>
          {item.title}
        </Text>
        <View style={[
          styles.statusBadge,
          item.completed ? styles.statusCompleted : styles.statusPending
        ]}>
          <Text style={styles.statusText}>
            {item.completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.todoId}>
        <Text style={styles.todoIdText}>#{item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator isLoading={isLoading} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Todos</Text>
        <Text style={styles.headerSubtitle}>
          {todos.length} tasks total
        </Text>
      </View>
      
      <FlatList
        data={todos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadTodos}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  todoItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  todoItemCompleted: {
    borderLeftColor: '#34C759',
    opacity: 0.8,
  },
  todoContent: {
    flex: 1,
    marginRight: 12,
  },
  todoTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: '#34C75920',
  },
  statusPending: {
    backgroundColor: '#FF3B3020',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  todoId: {
    backgroundColor: '#f1f2f6',
    padding: 8,
    borderRadius: 6,
  },
  todoIdText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
\`\`\`

### Todo detail screen

The detail screen lets the user change the title and the status, save the changes, or delete the todo.

\`\`\`ts
// src/screens/TodoDetailScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTodos } from '../hooks/useTodos';

export const TodoDetailScreen: React.FC<{ navigation: any; route: any }> = ({ 
  navigation, 
  route 
}) => {
  const { todo: initialTodo } = route.params;
  const [todo, setTodo] = useState(initialTodo);
  const { updateTodo, deleteTodo } = useTodos();

  const handleSave = async () => {
    try {
      await updateTodo(todo.id, {
        title: todo.title,
        completed: todo.completed,
      });
      Alert.alert('Success', 'Todo updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteTodo(todo.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={todo.title}
          onChangeText={(text) => setTodo({ ...todo, title: text })}
          multiline
        />
        
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.switchWrapper}>
            <Text style={[
              styles.statusText,
              todo.completed ? styles.statusCompleted : styles.statusPending
            ]}>
              {todo.completed ? 'Completed' : 'Pending'}
            </Text>
            <Switch
              value={todo.completed}
              onValueChange={(value) => setTodo({ ...todo, completed: value })}
              trackColor={{ false: '#f1f2f6', true: '#34C759' }}
              thumbColor={todo.completed ? '#fff' : '#fff'}
            />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Todo ID</Text>
            <Text style={styles.infoValue}>#{todo.id}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>#{todo.userId}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Todo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back to List</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    marginBottom: 20,
  },
  switchWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusCompleted: {
    color: '#34C759',
  },
  statusPending: {
    color: '#FF3B30',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#8e8e93',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
\`\`\`

### Navigation

\`\`\`ts
// src/components/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../screens/LoginScreen';
import { TodoListScreen } from '../../screens/TodoListScreen';
import { TodoDetailScreen } from '../../screens/TodoDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  TodoList: undefined;
  TodoDetail: { todo: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TodoList" 
          component={TodoListScreen}
          options={{ 
            title: 'My Todos',
            headerBackVisible: false,
          }}
        />
        <Stack.Screen 
          name="TodoDetail" 
          component={TodoDetailScreen}
          options={{ title: 'Todo Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
\`\`\`

### Main app component

\`\`\`ts
// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/components/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
\`\`\`

### Expo benefits for .NET developers

| Benefit | Description |
| --- | --- |
| Simple setup | Basic development does not need Android Studio or Xcode. |
| Expo Go app | Scan a QR code to test on a physical device. |
| Managed workflow | Expo manages the native build configuration. |
| Expo SDK | Prebuilt modules for common mobile features, such as the camera and location. |
| Over-the-air updates | Update your app without a new app store submission. |
| TypeScript | Expo supports TypeScript without extra setup. |

### Demo credentials

The app uses the dummyjson.com mock API. Use these credentials:

- User name: \`emilys\`
- Password: \`emilyspass\`

## React Native todo app without a framework

This version of the todo app uses the React Native CLI without Expo. It uses AsyncStorage in place of Expo SecureStore, and simpler screens. The comments compare the code with .NET MAUI and Xamarin concepts.

### Create the React Native project

\`\`\`bash
sudo npx react-native init TodoApp --template react-native-template-typescript
cd TodoApp
\`\`\`

> **NOTE:** Dated (checked November 2026): React Native 0.75 deprecated \`react-native init\`, and the command stopped working at the end of 2024. New projects use TypeScript by default, so \`react-native-template-typescript\` is deprecated. Use \`npx @react-native-community/cli@latest init TodoApp\`. The React Native documentation now also recommends a framework such as Expo.

### Run the app

\`\`\`bash
# Install dependencies
npm install

# For iOS
npx react-native run-ios

# For Android
npx react-native run-android
\`\`\`

### Project structure

\`\`\`text
TodoApp/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ActivityIndicator.tsx
│   │   │   └── SafeAreaView.tsx
│   │   ├── login/
│   │   │   └── LoginForm.tsx
│   │   ├── todos/
│   │   │   ├── TodoList.tsx
│   │   │   └── TodoDetail.tsx
│   │   └── navigation/
│   │       └── AppNavigator.tsx
│   ├── models/
│   │   ├── TodoItem.ts
│   │   ├── User.ts
│   │   └── TokenResponse.ts
│   ├── services/
│   │   └── TodoService.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTodos.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── utils/
│   │   ├── storage.ts
│   │   └── converters.ts
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── TodoListScreen.tsx
│       └── TodoDetailScreen.tsx
├── App.tsx
├── package.json
├── tsconfig.json
└── metro.config.js
\`\`\`

### Shared code

This app uses the same code as the Expo app for these files:

- [TypeScript models](#typescript-models)
- [Todo service](#todo-service) (\`src/services/TodoService.ts\`)
- The \`useTodos\` hook in [Custom hooks](#custom-hooks)

### Storage utility with AsyncStorage

This utility is the equivalent of \`Settings.cs\` in a .NET app. It uses AsyncStorage and has no \`clearAll\` method.

\`\`\`ts
// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
  // Username
  getUsername: async (): Promise<string> => {
    return (await AsyncStorage.getItem('username')) || '';
  },
  setUsername: async (username: string): Promise<void> => {
    await AsyncStorage.setItem('username', username);
  },

  // Password
  getPassword: async (): Promise<string> => {
    return (await AsyncStorage.getItem('password')) || '';
  },
  setPassword: async (password: string): Promise<void> => {
    await AsyncStorage.setItem('password', password);
  },

  // Access Token
  getAccessToken: async (): Promise<string> => {
    return (await AsyncStorage.getItem('accessToken')) || '';
  },
  setAccessToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem('accessToken', token);
  },

  // Token Expiration
  getAccessTokenExpiration: async (): Promise<Date> => {
    const expiration = await AsyncStorage.getItem('accessTokenExpiration');
    return expiration ? new Date(expiration) : new Date();
  },
  setAccessTokenExpiration: async (expiration: Date): Promise<void> => {
    await AsyncStorage.setItem('accessTokenExpiration', expiration.toISOString());
  },
};
\`\`\`

### The useAuth hook with AsyncStorage

Custom hooks are the React equivalent of view models. This \`useAuth\` hook stores \`mock-token\`, and \`logout\` removes the keys with \`AsyncStorage.multiRemove\`.

\`\`\`ts
// src/hooks/useAuth.ts
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoService } from '../services/TodoService';
import { Storage } from '../utils/storage';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const todoService = new TodoService();

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!username || !password) {
      return false;
    }

    setIsLoading(true);
    try {
      const isAuthenticated = await todoService.login(username, password);
      
      if (isAuthenticated) {
        await Storage.setUsername(username);
        await Storage.setPassword(password);
        // In a real app, you'd store the actual token
        await Storage.setAccessToken('mock-token');
        await Storage.setAccessTokenExpiration(new Date(Date.now() + 3600000)); // 1 hour
      }
      
      return isAuthenticated;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await AsyncStorage.multiRemove(['username', 'password', 'accessToken', 'accessTokenExpiration']);
  }, []);

  return {
    isLoading,
    login,
    logout,
  };
};
\`\`\`

### Activity indicator without Expo

This version imports the indicator as \`RNActivityIndicator\`, uses the color \`#0000ff\`, and uses a background opacity of 0.7.

\`\`\`ts
// src/components/common/ActivityIndicator.tsx
import React from 'react';
import { ActivityIndicator as RNActivityIndicator, StyleSheet, View } from 'react-native';

interface Props {
  isLoading: boolean;
}

export const ActivityIndicator: React.FC<Props> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.container}>
      <RNActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
});
\`\`\`

### Simple screens

The login screen has no \`KeyboardAvoidingView\` and no demo credentials text:

\`\`\`ts
// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator } from '../components/common/ActivityIndicator';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { isLoading, login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Login failed', 'Username and password are required.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigation.replace('TodoList');
    } else {
      Alert.alert('Login failed', 'Invalid username or password.');
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator isLoading={isLoading} />
      
      <Text style={styles.title}>Todo App</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
\`\`\`

The todo list screen has no pull-to-refresh:

\`\`\`ts
// src/screens/TodoListScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTodos } from '../hooks/useTodos';
import { ActivityIndicator } from '../components/common/ActivityIndicator';
import { TodoItem } from '../models';

export const TodoListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { todos, isLoading } = useTodos();

  const renderTodoItem = ({ item }: { item: TodoItem }) => (
    <TouchableOpacity
      style={styles.todoItem}
      onPress={() => navigation.navigate('TodoDetail', { todo: item })}
    >
      <Text style={styles.todoTitle}>{item.title}</Text>
      <Text style={[
        styles.todoStatus,
        item.completed ? styles.completed : styles.pending
      ]}>
        {item.completed ? 'Completed' : 'Pending'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ActivityIndicator isLoading={isLoading} />
      
      <Text style={styles.header}>My Todos</Text>
      
      <FlatList
        data={todos}
        renderItem={renderTodoItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  todoItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  todoTitle: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  todoStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  completed: {
    color: '#34C759',
  },
  pending: {
    color: '#FF3B30',
  },
});
\`\`\`

The todo detail screen only shows the todo. It does not save changes:

\`\`\`ts
// src/screens/TodoDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export const TodoDetailScreen: React.FC<{ navigation: any; route: any }> = ({ 
  navigation, 
  route 
}) => {
  const { todo } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Todo Details</Text>
      
      <View style={styles.detailCard}>
        <Text style={styles.label}>Title:</Text>
        <TextInput
          style={styles.input}
          value={todo.title}
          onChangeText={() => {}} // In a real app, you'd update the state
        />
        
        <Text style={styles.label}>Status:</Text>
        <Text style={[
          styles.status,
          todo.completed ? styles.completed : styles.pending
        ]}>
          {todo.completed ? 'Completed' : 'Pending'}
        </Text>
        
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{todo.userId}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to List</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  detailCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#666',
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  input: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  status: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
  },
  completed: {
    color: '#34C759',
  },
  pending: {
    color: '#FF3B30',
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
\`\`\`

### Navigation without Expo

The only difference from the Expo version is the \`TodoList\` screen options: the title is \`Todo List\`, and the back button is visible.

\`\`\`ts
// src/components/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../screens/LoginScreen';
import { TodoListScreen } from '../../screens/TodoListScreen';
import { TodoDetailScreen } from '../../screens/TodoDetailScreen';

export type RootStackParamList = {
  Login: undefined;
  TodoList: undefined;
  TodoDetail: { todo: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TodoList" 
          component={TodoListScreen}
          options={{ title: 'Todo List' }}
        />
        <Stack.Screen 
          name="TodoDetail" 
          component={TodoDetailScreen}
          options={{ title: 'Todo Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
\`\`\`

### Main app component without Expo

This version uses \`StatusBar\` from \`react-native\`, not from \`expo-status-bar\`.

\`\`\`ts
// App.tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/components/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </>
  );
};

export default App;
\`\`\`

### Package dependencies

Update \`package.json\`:

\`\`\`json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-native-async-storage/async-storage": "^1.18.0",
    "react-native-safe-area-context": "^4.6.0",
    "react-native-screens": "^3.22.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

> **NOTE:** Dated (checked November 2026): React Native 0.71 and later include their own TypeScript types, so \`@types/react-native\` is deprecated. Remove it. React Native 0.72 is from 2023; use the versions that the current React Native template installs.

### React Native concepts for .NET developers

| Concept | React Native | .NET MAUI or Xamarin equivalent |
| --- | --- | --- |
| Components and pages | Function components. Each screen is a component that returns JSX. | XAML pages |
| Hooks and view models | \`useState\` replaces property change notifications. \`useEffect\` replaces the \`OnAppearing\` life cycle method. Custom hooks replace view models. | ViewModels |
| Navigation | React Navigation. A stack navigator manages the screen transitions. | XAML Shell navigation |
| State management | \`useState\` for local state of a component. Custom hooks for shared business logic. | |
| Styling | The StyleSheet API with a Flexbox-based layout. | XAML styles |
| Data storage | AsyncStorage, with async and await for asynchronous operations. | Xamarin Essentials Preferences |

## React TypeScript folder structure for D365

These folder structures organize a React TypeScript web app in the style of the Dynamics 365 (D365) Application Object Tree (AOT).

### AOT-style structure

This structure has folders for D365 AOT classes, forms, and menus:

\`\`\`text
react-d365-app/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/               # Static assets like images, fonts, etc.
│
├── src/
│   ├── components/           # Reusable components
│   │   ├── Button/           # Example reusable component
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.css
│   │   │   └── index.ts
│   │   └── ...               # Other reusable components
│   │
│   ├── classes/              # Classes from D365 AOT
│   │   ├── ClassName1.ts
│   │   ├── ClassName2.ts
│   │   └── ...               # Other classes
│   │
│   ├── forms/                # Forms from D365 AOT
│   │   ├── FormName1/
│   │   │   ├── FormName1.tsx
│   │   │   ├── FormName1.css
│   │   │   └── index.ts
│   │   ├── FormName2/
│   │   │   ├── FormName2.tsx
│   │   │   ├── FormName2.css
│   │   │   └── index.ts
│   │   └── ...               # Other forms
│   │
│   ├── menus/                # Menus from D365 AOT
│   │   ├── MenuName1/
│   │   │   ├── MenuName1.tsx
│   │   │   └── index.ts
│   │   ├── MenuName2/
│   │   │   ├── MenuName2.tsx
│   │   │   └── index.ts
│   │   └── ...               # Other menus
│   │
│   ├── services/             # API services and business logic
│   │   ├── apiService.ts
│   │   ├── dataService.ts
│   │   └── ...               # Other services
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useCustomHook.ts
│   │   └── ...
│   │
│   ├── contexts/             # Context providers
│   │   ├── AuthContext.tsx
│   │   └── ...
│   │
│   ├── utils/                # Utility functions
│   │   ├── helpers.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx               # Main app component
│   ├── index.tsx             # Entry point
│   └── styles/               # Global styles
│       ├── index.css
│       └── ...
│
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

### MVC structure

This structure separates the models, views, and controllers (MVC):

\`\`\`text
react-mvc-d365-app/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/               # Static assets like images, fonts, etc.
│
├── src/
│   ├── models/               # Data models
│   │   ├── UserModel.ts
│   │   ├── ProductModel.ts
│   │   └── ...               # Other models
│   │
│   ├── views/                # UI components (Views)
│   │   ├── HomeView/
│   │   │   ├── HomeView.tsx
│   │   │   ├── HomeView.css
│   │   │   └── index.ts
│   │   ├── UserView/
│   │   │   ├── UserView.tsx
│   │   │   ├── UserView.css
│   │   │   └── index.ts
│   │   └── ...               # Other views
│   │
│   ├── controllers/          # Controllers handling logic
│   │   ├── UserController.ts
│   │   ├── ProductController.ts
│   │   └── ...               # Other controllers
│   │
│   ├── components/           # Reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.css
│   │   │   └── index.ts
│   │   └── ...               # Other reusable components
│   │
│   ├── services/             # API services and business logic
│   │   ├── apiService.ts
│   │   ├── dataService.ts
│   │   └── ...               # Other services
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useCustomHook.ts
│   │   └── ...
│   │
│   ├── contexts/             # Context providers
│   │   ├── AuthContext.tsx
│   │   └── ...
│   │
│   ├── utils/                # Utility functions
│   │   ├── helpers.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx               # Main app component
│   ├── index.tsx             # Entry point
│   └── styles/               # Global styles
│       ├── index.css
│       └── ...
│
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## React TypeScript app with Material UI

1. Create the app and install Material UI, the Roboto font, and the icons:

   \`\`\`bash
   npx create-react-app@latest cyberswissblade --template typescript@latest
   npm install @mui/material @emotion/react @emotion/styled
   npm install @fontsource/roboto
   npm install @mui/icons-material
   \`\`\`

   > **NOTE:** Dated (checked November 2026): Create React App is deprecated. For a new Material UI app, use Vite or a framework.

2. To download the official Material UI example for Create React App with TypeScript, run:

   \`\`\`bash
   curl https://codeload.github.com/mui/material-ui/tar.gz/master | tar -xz --strip=2 material-ui-master/examples/material-ui-cra-ts
   \`\`\`

   > **NOTE:** Verify that the \`examples/material-ui-cra-ts\` folder still exists in the Material UI repository. Material UI moved its examples to Vite and Next.js, and the Create React App example can be gone.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| \`npm start\` shows \`[DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE] DeprecationWarning: 'onAfterSetupMiddleware' option is deprecated.\` | The Create React App dev server uses a webpack-dev-server option that is deprecated. | Use the \`setupMiddlewares\` option. To see where the warning comes from, run \`node --trace-deprecation ...\`. |
| \`npm start\` shows \`[DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE] DeprecationWarning: 'onBeforeSetupMiddleware' option is deprecated.\` | Same cause. | Use the \`setupMiddlewares\` option. |
| \`pod --version\` fails after you install CocoaPods | Homebrew did not link CocoaPods. | Run \`brew link --overwrite cocoapods\`. |
| Expo shows errors that do not go away | Old cached files. | Run \`npm cache clean --force\` and \`rm -rf ~/.expo\`. |
| A debug build on a physical iOS device does not start | The debug configuration needs a development server. | Use \`npx expo run:ios --device <UDID> --configuration Release\`. |

## Related links

- [React Cheatsheet by delprzemo](https://github.com/delprzemo/react-cheatsheet)
- [React documentation](https://react.dev/learn)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo documentation](https://docs.expo.dev)
- [Material UI](https://mui.com/material-ui/getting-started/)
- [Form validation article](https://webfellas.tech/#/article/5)
- [Angular cheat sheet](doc:angular-cheatsheet)
- [TypeScript cheat sheet](doc:typescript-cheatsheet)
- [Full-stack React, Prisma, and PostgreSQL with Podman](doc:react-prisma-postgresql-podman)
`;export{e as default};