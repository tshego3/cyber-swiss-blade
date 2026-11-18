var e=`---
title: Flutter cheat sheet
summary: Flutter and Dart reference: CLI commands, widgets, common snippets, networking recipes, MVVM samples, and fixes for common setup errors.
category: Flutter and Android
order: 10
---

# Flutter cheat sheet

This cheat sheet collects Flutter CLI commands, widget basics, Dart snippets, networking recipes from the Flutter cookbook, and two MVVM samples. Use it as a quick reference when you build or debug a Flutter app.

## Before you start

- The Flutter SDK, with its \`bin\` folder in the \`Path\` environment variable. The Dart SDK is in \`flutter\\bin\\cache\\dart-sdk\\bin\`.
- For Android builds: a JDK, Gradle, and the Android SDK command-line tools. See [Android SDK manual setup](doc:android-sdk-manual-setup).
- For the networking recipes: the \`http\` package. For the WebSocket recipe: the \`web_socket_channel\` package. For the MVVM samples: the \`provider\` package.

## Reference links

| Name | Link | Notes |
| --- | --- | --- |
| Flutter cheat sheet | [onecompiler.com](https://onecompiler.com/cheatsheets/flutter) | The source of the common snippets |
| Dart cheat sheet | [dart.dev](https://dart.dev/resources/dart-cheatsheet) | |
| Flutter Cookbook | [docs.flutter.dev](https://docs.flutter.dev/cookbook) | |
| Flutter Cookbook source | [GitHub](https://github.com/flutter/website/tree/main/src/content/cookbook) | |
| Flutter Templates | [fluttertemplates.dev](https://www.fluttertemplates.dev/) | |
| iOS components | [Cupertino widgets](https://docs.flutter.dev/ui/widgets/cupertino) | |
| Android components | [Material widgets](https://docs.flutter.dev/ui/widgets/material) | |
| Flutter samples | [flutter.github.io](https://flutter.github.io/samples/) | |
| Flutter package repository | [pub.dev](https://pub.dev/) | |
| Scaffold class | [api.flutter.dev](https://api.flutter.dev/flutter/material/Scaffold-class.html) | |
| Scaffold class in Flutter with examples | [geeksforgeeks.org](https://www.geeksforgeeks.org/scaffold-class-in-flutter-with-examples/) | |
| Using MVVM for your application's architecture | [docs.flutter.dev](https://docs.flutter.dev/get-started/fundamentals/state-management#using-mvvm-for-your-applications-architecture) | |
| Start building Flutter Android apps on Windows | [docs.flutter.dev](https://docs.flutter.dev/get-started/install/windows/mobile) | |

## Flutter CLI

The \`flutter\` command-line tool is the interface between developers (or IDEs) and Flutter. For Dart commands, use the [\`dart\`](https://dart.dev/tools/dart-tool) command-line tool. For the full reference, see the [flutter CLI reference page](https://docs.flutter.dev/reference/flutter-cli).

Create, analyze, test, and run an app:

\`\`\`bash
flutter create my_app
cd my_app
flutter analyze
flutter test
flutter run lib/main.dart
\`\`\`

Run [\`pub\`](https://dart.dev/tools/dart-pub) commands with the \`flutter\` tool:

\`\`\`bash
flutter pub get
flutter pub outdated
flutter pub upgrade
\`\`\`

Show all the commands that \`flutter\` supports:

\`\`\`bash
flutter --help --verbose
\`\`\`

Show the current version of the Flutter SDK, with its framework, engine, and tools:

\`\`\`bash
flutter --version
\`\`\`

### Commands

| Command | Example | Description |
| --- | --- | --- |
| analyze | \`flutter analyze\` | Analyzes the Dart source code of the project. Use it in place of [\`dart analyze\`](https://dart.dev/tools/dart-analyze). |
| assemble | \`flutter assemble -o <DIRECTORY>\` | Assembles and builds Flutter resources. |
| attach | \`flutter attach -d <DEVICE_ID>\` | Attaches to a running application. |
| bash-completion | \`flutter bash-completion\` | Writes the setup scripts for command-line shell completion. |
| build | \`flutter build <SUBCOMMAND>\` | Flutter build commands, for example \`apk\`, \`appbundle\`, \`ios\`, or \`web\`. |
| channel | \`flutter channel <CHANNEL_NAME>\` | Lists or changes Flutter channels. |
| clean | \`flutter clean\` | Deletes the \`build/\` and \`.dart_tool/\` directories. |
| config | \`flutter config --build-dir=<DIRECTORY>\` | Configures Flutter settings. To remove a setting, set it to an empty string. |
| create | \`flutter create <DIRECTORY>\` | Creates a new project. |
| custom-devices | \`flutter custom-devices list\` | Adds, deletes, lists, and resets custom devices. |
| devices | \`flutter devices -d <DEVICE_ID>\` | Lists all connected devices. |
| doctor | \`flutter doctor\` | Shows information about the installed tools. |
| downgrade | \`flutter downgrade\` | Downgrades Flutter to the last active version for the current channel. |
| drive | \`flutter drive\` | Runs Flutter Driver tests for the current project. |
| emulators | \`flutter emulators\` | Lists, starts, and creates emulators. |
| gen-l10n | \`flutter gen-l10n <DIRECTORY>\` | Generates localizations for the Flutter project. |
| install | \`flutter install -d <DEVICE_ID>\` | Installs a Flutter app on an attached device. |
| logs | \`flutter logs\` | Shows the log output of running Flutter apps. |
| precache | \`flutter precache <ARGUMENTS>\` | Fills the Flutter tool cache of binary artifacts. |
| pub | \`flutter pub <PUB_COMMAND>\` | Works with packages. Use it in place of [\`dart pub\`](https://dart.dev/tools/dart-pub). |
| run | \`flutter run <DART_FILE>\` | Runs a Flutter program. |
| screenshot | \`flutter screenshot\` | Takes a screenshot of a Flutter app on a connected device. |
| symbolize | \`flutter symbolize --input=<STACK_TRACE_FILE>\` | Symbolizes a stack trace from an AOT-compiled Flutter application. |
| test | \`flutter test [<DIRECTORY or DART_FILE>]\` | Runs the tests in this package. Use it in place of [\`dart test\`](https://dart.dev/tools/dart-test). |
| upgrade | \`flutter upgrade\` | Upgrades your copy of Flutter. |

For more help on a command, enter \`flutter help <command>\`. You can also get details on \`pub\` commands, for example \`flutter help pub outdated\`.

## Create an offline Visual Studio layout

This command creates an offline Visual Studio layout in \`c:\\localVSlayout\`. The layout contains the native desktop (C++) workload, the VC.Tools.142 x86 and x64 component group, and the optional components, in English (en-US).

1. In the folder that contains \`vs_enterprise.exe\`, press Shift and right-click.
2. Select **Open PowerShell window here**.
3. In the PowerShell window, type \`start cmd\` and press Enter.
4. In the new Command Prompt window, run this command:

   \`\`\`cmd
   vs_enterprise.exe --layout c:\\localVSlayout --add Microsoft.VisualStudio.Workload.NativeDesktop --add Microsoft.VisualStudio.ComponentGroup.VC.Tools.142.x86.x64 --includeOptional --lang en-US
   \`\`\`

## App structure

This is a minimal Flutter program:

\`\`\`dart
import 'package:flutter/material.dart';

void main() {
    runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hello world!',
      home: Scaffold(
        body: Center(
          child: Text('Hello world'),
        ),
      ),
    );
  }
}
\`\`\`

| Element | Description |
| --- | --- |
| \`import\` | Imports the assets of the specified library from the \`pubspec.yaml\` file. |
| \`void main()\` | The main function. It runs first each time the app starts. |
| \`class MyApp extends StatelessWidget {}\` | A class (similar to a Java class) that creates a stateless widget. |
| \`@override\` | Marks an instance member that overrides a superclass member with the same name. |
| \`build(BuildContext context)\` | \`BuildContext\` is a locator that tracks each widget and its position in the widget tree. Flutter passes the \`BuildContext\` of each widget to its \`build\` method. |
| \`Scaffold()\` | A class that supplies many widgets and APIs, for example \`Drawer\`, \`SnackBar\`, and \`BottomNavigationBar\`. |
| \`body:\` | The body of the app, inside a \`Scaffold\`. You can use many widgets in it to lay out a UI. |
| \`Center()\` | Wraps a widget and moves it to the center of the screen or of the parent widget. |
| \`child:\` | A property of the parent widget that holds a child widget. Nested children make the widget tree. |
| \`Text()\` | A widget that shows text on the screen. |

## Widgets and state

The state is information that Flutter can read synchronously when it builds the widget. The state can change during the lifetime of the widget. It is the data that the widget properties (parameters) hold when Flutter paints the widget on the screen. For example, the color of an \`ElevatedButton\` widget (previously \`RaisedButton\`) can change when the user pushes it.

### Stateless widget

A stateless widget does not change: it is immutable. Its appearance and properties stay the same for the lifetime of the widget. Flutter cannot redraw a stateless widget while the app runs. Examples: \`Icon\`, \`IconButton\`, and \`Text\`.

\`\`\`dart
class MyCounter extends StatelessWidget {
  final int count;
  const MyCounter({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    return Text('$count');
  }
}
\`\`\`

### Stateful widget

A stateful widget changes its properties at run time: it is mutable. Flutter can draw it many times during its lifetime. It can change its appearance when the user interacts with it or when it receives data. Examples: \`Checkbox\`, \`Radio\`, \`Slider\`, \`InkWell\`, \`Form\`, and \`TextField\`.

\`\`\`dart
class MyCounter extends StatefulWidget {
  const MyCounter({super.key});

  @override
  State<MyCounter> createState() => _MyCounterState();
}

class _MyCounterState extends State<MyCounter> {
  int count = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Count: $count'),
        TextButton(
          onPressed: () {
            setState(() {
              count++;
            });
          },
          child: Text('Increment'),
        )
      ],
    );
  }
}
\`\`\`

### Inherited widget

If you pass data down the widget tree manually, the code becomes long and has boilerplate. \`InheritedWidget\` keeps data in a parent widget, and child widgets can get the data without a field.

To use \`InheritedWidget\`:

1. Extend the \`InheritedWidget\` class.
2. Add a static \`of()\` method that calls \`dependOnInheritedWidgetOfExactType\`.
3. Call \`of()\` from the \`build()\` method of the widget that needs the shared state.

When a widget calls \`of()\` in a \`build\` method, the Flutter framework records a dependency. When the \`InheritedWidget\` rebuilds with new data and \`updateShouldNotify\` returns \`true\`, all the dependent widgets rebuild.

\`\`\`dart
class MyState extends InheritedWidget {
  const MyState({
    super.key,
    required this.data,
    required super.child,
  });

  final String data;

  static MyState of(BuildContext context) {
    // This method looks for the nearest \`MyState\` widget ancestor.
    final result = context.dependOnInheritedWidgetOfExactType<MyState>();

    assert(result != null, 'No MyState found in context');

    return result!;
  }

  @override
  // This method should return true if the old widget's data is different
  // from this widget's data. If true, any widgets that depend on this widget
  // by calling \`of()\` will be re-built.
  bool updateShouldNotify(MyState oldWidget) => data != oldWidget.data;
}

// Next, call the of() method from the build() method of the widget that needs access to the shared state:

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    var data = MyState.of(context).data;
    return Scaffold(
      body: Center(
        child: Text(data),
      ),
    );
  }
}
\`\`\`

## Common snippets

### Required and default properties

\`\`\`dart
import 'package:flutter/material.dart';

class SomeComponent extends StatelessWidget {
  SomeComponent({
    @required this.foo,
    this.bar = 'some string',
  });

  final String foo;
  final String bar;

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Text('$foo $bar'),
    );
  }
}
\`\`\`

> **NOTE:** Dated (checked November 2026): Dart null safety (Dart 2.12) replaced the \`@required\` annotation with the \`required\` keyword. Write \`required this.foo\`.

### Android ink effect

\`\`\`dart
InkWell(
  child: Text('Button'),
  onTap: _onTap,
  onLongPress: _onLongPress,
  onDoubleTap: _onDoubleTap,
  onTapCancel: _onTapCancel,
);
\`\`\`

### Gesture detection

\`\`\`dart
GestureDetector(
  onTap: _onTap,
  onLongPress: _onLongPress,
  child: Text('Button'),
);
\`\`\`

### Loading indicator

\`\`\`dart
class SomeWidget extends StatefulWidget {
  @override
  _SomeWidgetState createState() => _SomeWidgetState();
}

class _SomeWidgetState extends State<SomeWidget> {
  late Future future;

  @override
  void initState() {
    future = Future.delayed(Duration(seconds: 1));
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: future,
      builder: (context, snapshot) {
        return snapshot.connectionState == ConnectionState.done
            ? Text('Loaded')
            : CircularProgressIndicator();
      },
    );
  }
}
\`\`\`

### Platform-specific code

\`\`\`dart
import 'dart:io' show Platform;

if (Platform.isIOS) {
  doSmthIOSSpecific();
}

if (Platform.isAndroid) {
  doSmthAndroidSpecific();
}
\`\`\`

### Hide the status bar

\`\`\`dart
import 'package:flutter/services.dart';

void main() {
    SystemChrome.setEnabledSystemUIOverlays([]);
}
\`\`\`

> **NOTE:** Dated (checked November 2026): \`SystemChrome.setEnabledSystemUIOverlays\` is deprecated. Use \`SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: [])\`.

### Lock the orientation

\`\`\`dart
import 'package:flutter/services.dart';

void main() async {
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  runApp(App());
}
\`\`\`

### HTTP request

Add the dependency to \`pubspec.yaml\`:

\`\`\`yaml
dependencies:
  http: ^1.6.0
\`\`\`

Send the request:

\`\`\`dart
import 'dart:convert' show json;
import 'package:http/http.dart' as http;

http.get(Uri.parse(API_URL)).then((http.Response res) {
    final data = json.decode(res.body);
    print(data);
});
\`\`\`

### Async and await

\`\`\`dart
Future<int> doSmthAsync() async {
  final result = await Future.value(42);
  return result;
}

class SomeClass {
  method() async {
    final result = await Future.value(42);
    return result;
  }
}
\`\`\`

### JSON

\`\`\`dart
import 'dart:convert' show json;

json.decode(someString);
json.encode(encodableObject);
\`\`\`

### Check for development mode

The assignment in \`assert\` runs only in debug mode, so \`isDev\` is \`true\` only in debug builds. You can also use \`kDebugMode\` from \`package:flutter/foundation.dart\`.

\`\`\`dart
bool isDev = false;
assert(isDev = true);

if (isDev) {
    doSmth();
}
\`\`\`

### Navigation

\`\`\`dart
import 'package:flutter/material.dart';

class FirstScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: RaisedButton(
        child: Text('Go to SecondScreen'),
        onPressed: () => Navigator.pushNamed(context, '/second'),
      ),
    );
  }
}

class SecondScreen extends StatelessWidget {
  void _pushSecondScreen(context) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => SecondScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        RaisedButton(
          child: Text('Go back!'),
          onPressed: () => Navigator.pop(context),
        ),
        RaisedButton(
          child: Text('Go to SecondScreen... again!'),
          onPressed: () => _pushSecondScreen(context),
        ),
      ],
    );
  }
}

void main() {
  runApp(MaterialApp(
    initialRoute: '/',
    routes: {
      '/': (context) => FirstScreen(),
      '/second': (context) => SecondScreen(),
    },
  ));
}
\`\`\`

> **NOTE:** Dated (checked November 2026): Flutter removed \`RaisedButton\` and \`FlatButton\` (deprecated in Flutter 2.0). Use \`ElevatedButton\` in place of \`RaisedButton\` and \`TextButton\` in place of \`FlatButton\`.

### Show an alert

\`\`\`dart
showDialog<void>(
  context: context,
  barrierDismissible: false,
  builder: (BuildContext context) {
    return AlertDialog(
      title: Text('Alert Title'),
      content: Text('My Alert Msg'),
      actions: <Widget>[
        FlatButton(
          child: Text('Ask me later'),
          onPressed: () {
            print('Ask me later pressed');
            Navigator.of(context).pop();
          },
        ),
        FlatButton(
          child: Text('Cancel'),
          onPressed: () {
            print('Cancel pressed');
            Navigator.of(context).pop();
          },
        ),
        FlatButton(
          child: Text('OK'),
          onPressed: () {
            print('OK pressed');
            Navigator.of(context).pop();
          },
        ),
      ],
    );
  },
);
\`\`\`

### List operations

\`\`\`dart
final length = items.length;

final newItems = items..addAll(otherItems);

final allEven = items.every((item) => item % 2 == 0);

final filled = List<int>.filled(3, 42);

final even = items.where((n) => n % 2 == 0).toList();

final found = items.firstWhere((item) => item.id == 42);

final index = items.indexWhere((item) => item.id == 42);

final flat = items.expand((_) => _).toList();

final mapped = items.expand((item) => [item + 1]).toList();

items.forEach((item) => print(item));

items.asMap().forEach((index, item) => print('$item, $index'));

final includes = items.contains(42);

final indexOf = items.indexOf(42);

final joined = items.join(',');

final mappedItems = items.map((item) => item + 1).toList();

final item = items.removeLast();

items.add(42);

final reduced = items.fold({}, (acc, item) {
  acc[item.id] = item;
  return acc;
});

final reversed = items.reversed;

items.removeAt(0);

final slice = items.sublist(15, 42);

final hasOdd = items.any((item) => item % 2 != 0);

items.sort((a, b) => a - b);

items.replaceRange(15, 42, [1, 2, 3]);

items.insert(0, 42);
\`\`\`

## Change the app icon

### Mobile apps

1. Make your app icon in the different sizes for the different devices. You can use an online tool such as [App Icon Generator](https://appicon.co/).
2. Add the icons to your project:
   - **iOS:** In the Flutter project, go to \`ios/Runner\`. Replace the icons in \`Assets.xcassets/AppIcon.appiconset\` with your icons.
   - **Android:** Go to \`android/app/src/main/res\`. Replace the icons in the \`mipmap\` folders (for example, \`mipmap-hdpi\` and \`mipmap-mdpi\`) with your icons.
3. If necessary, make sure that your \`pubspec.yaml\` file includes the updated assets.
4. Run the Flutter app.

   **Result:** The app shows the new icon.

### Windows desktop app

Change the icon before you package the app.

1. In the Flutter project, go to \`windows\\runner\\resources\`.
2. Replace \`app_icon.ico\` with your icon.
3. If the name of your icon is not \`app_icon.ico\`, change the \`IDI_APP_ICON\` value in \`windows\\runner\\Runner.rc\` to the new path.

## Dart loops and operators

Dart has several ways to go through a list or to apply a function to each element.

| Construct | Use |
| --- | --- |
| \`for\` loop | Goes through a list by index. Use it when you need the index or when you change the list. |
| \`forEach\` | Applies a function to each element. Use it when you need only the item, not the index. It is similar to a \`for-in\` loop, but you give the operation as a function. |
| \`map\` | Changes each element and returns a new list. |

### For loop

\`\`\`dart
void main() {
  List<String> fruits = ['Apple', 'Banana', 'Orange', 'Mango'];

  // Using for loop
  for (int i = 0; i < fruits.length; i++) {
    print(fruits[i]);
  }
}
\`\`\`

### ForEach

\`\`\`dart
void main() {
  List<String> fruits = ['Apple', 'Banana', 'Orange', 'Mango'];

  // Using forEach
  fruits.forEach((fruit) {
    print(fruit);
  });
}
\`\`\`

### Map

The \`map\` function takes a function as an argument. It returns a new list in which each element is the result of the function. This example uses \`toUpperCase()\`, but you can use any transformation.

\`\`\`dart
void main() {
  List<String> fruits = ['Apple', 'Banana', 'Orange', 'Mango'];

  // Using map
  List<String> uppercasedFruits = fruits.map((fruit) => fruit.toUpperCase()).toList();
  
  print(uppercasedFruits);  // ['APPLE', 'BANANA', 'ORANGE', 'MANGO']
}
\`\`\`

### Cascade operator

The cascade operator (\`..\`) chains many operations on one object:

\`\`\`dart
class Car {
  late String color;
  late int year;
  
  void setColor(String color) {
    this.color = color;
  }

  void setYear(int year) {
    this.year = year;
  }
}

void main() {
  var myCar = Car()
    ..setColor('Red')
    ..setYear(2021);

  print('Car color: \${myCar.color}, Year: \${myCar.year}');
}
\`\`\`

### Spread operator

The spread operator (\`...\`) combines lists:

\`\`\`dart
void main() {
  var list1 = [1, 2, 3];
  var list2 = [4, 5, 6];

  var combinedList = [...list1, ...list2];

  print(combinedList);  // Output: [1, 2, 3, 4, 5, 6]
}
\`\`\`

### Comparison with C#

C# has no direct equivalent of the cascade operator. You can get a similar result with method chaining:

\`\`\`csharp
public class Car
{
    public string Color { get; set; }
    public int Year { get; set; }

    public Car SetColor(string color)
    {
        Color = color;
        return this;
    }

    public Car SetYear(int year)
    {
        Year = year;
        return this;
    }
}

public class Program
{
    public static void Main()
    {
        var myCar = new Car()
            .SetColor("Red")
            .SetYear(2021);

        Console.WriteLine($"Car color: {myCar.Color}, Year: {myCar.Year}");
    }
}
\`\`\`

C# also has no direct equivalent of the spread operator. You can combine lists with LINQ:

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
    public static void Main()
    {
        var list1 = new List<int> { 1, 2, 3 };
        var list2 = new List<int> { 4, 5, 6 };

        var combinedList = list1.Concat(list2).ToList();

        Console.WriteLine(string.Join(", ", combinedList));  // Output: 1, 2, 3, 4, 5, 6
    }
}
\`\`\`

## Fetch data from the internet

Most apps must get data from the internet. Dart and Flutter supply tools for this work, for example the \`http\` package. Source: [Fetch data from the internet](https://docs.flutter.dev/cookbook/networking/fetch-data).

> **NOTE:** Do not use \`dart:io\` or \`dart:html\` directly to make HTTP requests. Those libraries are platform-dependent and tied to a single implementation.

### Add the http package

The [\`http\`](https://pub.dev/packages/http) package is the simplest way to get data from the internet. Add it as a dependency:

\`\`\`bash
flutter pub add http
\`\`\`

Import the package:

\`\`\`dart
import 'package:http/http.dart' as http;
\`\`\`

> **NOTE:** On some platforms, the app needs permission to use the internet. See the [Fetch data from the internet](https://docs.flutter.dev/cookbook/networking/fetch-data) recipe.

### Make a network request

This recipe gets a sample album from [JSONPlaceholder](https://jsonplaceholder.typicode.com/) with the [\`http.get()\`](https://pub.dev/documentation/http/latest/http/get.html) method.

\`\`\`dart
Future<http.Response> fetchAlbum() {
  return http.get(Uri.parse('https://jsonplaceholder.typicode.com/albums/1'));
}
\`\`\`

The \`http.get()\` method returns a \`Future\` that contains a \`Response\`.

- [\`Future\`](https://api.flutter.dev/flutter/dart-async/Future-class.html) is a core Dart class for asynchronous operations. A \`Future\` object represents a possible value or error that will be available at a later time.
- The \`http.Response\` class contains the data from a successful HTTP call.

### Convert the response into a Dart object

A raw \`Future<http.Response>\` is not convenient. Convert the \`http.Response\` into a Dart object:

1. Create an \`Album\` class that contains the data from the network request. It has a factory constructor that creates an \`Album\` from JSON. [Pattern matching](https://dart.dev/language/patterns) is only one option to convert JSON. For more information, see [JSON and serialization](https://docs.flutter.dev/data-and-backend/serialization/json).
2. Change \`fetchAlbum()\` to return a \`Future<Album>\`:
   1. Convert the response body into a JSON \`Map\` with the \`dart:convert\` package.
   2. If the server returns an OK response with status code 200, convert the JSON \`Map\` into an \`Album\` with the \`fromJson()\` factory method.
   3. If the server does not return status code 200, throw an exception. Also throw an exception for a "404 Not Found" response. Do not return \`null\`. This is important when you examine the data in \`snapshot\`.

The [complete example](#complete-fetch-example) contains the \`Album\` class and the new \`fetchAlbum()\` function.

### Fetch the data

Call \`fetchAlbum()\` in the [\`initState()\`](https://api.flutter.dev/flutter/widgets/State/initState.html) method or in the [\`didChangeDependencies()\`](https://api.flutter.dev/flutter/widgets/State/didChangeDependencies.html) method.

Flutter calls \`initState()\` one time only. If you want to reload the API when an [\`InheritedWidget\`](https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html) changes, put the call in \`didChangeDependencies()\`. For more details, see [\`State\`](https://api.flutter.dev/flutter/widgets/State-class.html).

Do not put an API call in a \`build()\` method. Flutter calls \`build()\` each time it must change something in the view, and this occurs frequently. If \`fetchAlbum()\` is in \`build()\`, it runs on each rebuild and makes the app slow. If you keep the \`fetchAlbum()\` result in a state variable, the \`Future\` runs one time only, and Flutter keeps it for the next rebuilds.

### Show the data

To show the data on the screen, use the [\`FutureBuilder\`](https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html) widget. It comes with Flutter and makes asynchronous data sources easy to use. Give it two parameters:

1. The \`Future\` to use. Here, it is the future that \`fetchAlbum()\` returns.
2. A \`builder\` function. It tells Flutter what to render for each state of the \`Future\`: loading, success, or error.

\`snapshot.hasData\` returns \`true\` only when the snapshot contains a non-null data value. Because \`fetchAlbum\` can return only non-null values, the function must throw an exception, also for a "404 Not Found" response. The exception sets \`snapshot.hasError\` to \`true\`, and you can use it to show an error message. In all other conditions, the widget shows the spinner.

### Test the fetch code

To test this function, see these recipes:

- [Introduction to unit testing](https://docs.flutter.dev/cookbook/testing/unit/introduction)
- [Mock dependencies using Mockito](https://docs.flutter.dev/cookbook/testing/unit/mocking)

### Complete fetch example

\`\`\`dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

Future<Album> fetchAlbum() async {
  final response = await http
      .get(Uri.parse('https://jsonplaceholder.typicode.com/albums/1'));

  if (response.statusCode == 200) {
    // If the server did return a 200 OK response,
    // then parse the JSON.
    return Album.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  } else {
    // If the server did not return a 200 OK response,
    // then throw an exception.
    throw Exception('Failed to load album');
  }
}

class Album {
  final int userId;
  final int id;
  final String title;

  const Album({
    required this.userId,
    required this.id,
    required this.title,
  });

  factory Album.fromJson(Map<String, dynamic> json) {
    return switch (json) {
      {
        'userId': int userId,
        'id': int id,
        'title': String title,
      } =>
        Album(
          userId: userId,
          id: id,
          title: title,
        ),
      _ => throw const FormatException('Failed to load album.'),
    };
  }
}

void main() => runApp(const MyApp());

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late Future<Album> futureAlbum;

  @override
  void initState() {
    super.initState();
    futureAlbum = fetchAlbum();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Fetch Data Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Fetch Data Example'),
        ),
        body: Center(
          child: FutureBuilder<Album>(
            future: futureAlbum,
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Text(snapshot.data!.title);
              } else if (snapshot.hasError) {
                return Text('\${snapshot.error}');
              }

              // By default, show a loading spinner.
              return const CircularProgressIndicator();
            },
          ),
        ),
      ),
    );
  }
}
\`\`\`

## Make authenticated requests

Most web services need authorization before they send data. The most common method is the \`Authorization\` HTTP header. Source: [Make authenticated requests](https://docs.flutter.dev/cookbook/networking/authenticated-requests).

The [\`http\`](https://pub.dev/packages/http) package adds headers to your requests. You can also use the [\`HttpHeaders\`](https://api.dart.dev/stable/dart-io/HttpHeaders-class.html) class from the \`dart:io\` library.

This example builds on [Fetch data from the internet](#fetch-data-from-the-internet). The \`Album\` class is the same as in the [complete fetch example](#complete-fetch-example).

\`\`\`dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

Future<Album> fetchAlbum() async {
  final response = await http.get(
    Uri.parse('https://jsonplaceholder.typicode.com/albums/1'),
    // Send authorization headers to the backend.
    headers: {
      HttpHeaders.authorizationHeader: 'Basic your_api_token_here',
    },
  );
  final responseJson = jsonDecode(response.body) as Map<String, dynamic>;

  return Album.fromJson(responseJson);
}
\`\`\`

## Send data to the internet

Most apps must send data to the internet. The \`http\` package also does this work. Source: [Send data to the internet](https://docs.flutter.dev/cookbook/networking/send-data).

### Add the http package for sending

Add the package and import it as in [Fetch data from the internet](#add-the-http-package):

\`\`\`bash
flutter pub add http
\`\`\`

\`\`\`dart
import 'package:http/http.dart' as http;
\`\`\`

### Send data to the server

This recipe creates an \`Album\`: it sends an album title to [JSONPlaceholder](https://jsonplaceholder.typicode.com/) with the [\`http.post()\`](https://pub.dev/documentation/http/latest/http/post.html) method.

Import \`dart:convert\` to get \`jsonEncode\`, which encodes the data:

\`\`\`dart
import 'dart:convert';
\`\`\`

Use \`http.post()\` to send the encoded data:

\`\`\`dart
Future<http.Response> createAlbum(String title) {
  return http.post(
    Uri.parse('https://jsonplaceholder.typicode.com/albums'),
    headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonEncode(<String, String>{
      'title': title,
    }),
  );
}
\`\`\`

The \`http.post()\` method returns a \`Future\` that contains a \`Response\`. The \`createAlbum()\` method takes a \`title\` argument and sends it to the server to create an \`Album\`.

### Convert the post response

1. Create an \`Album\` class with a factory constructor that creates an \`Album\` from JSON. This \`Album\` class has only \`id\` and \`title\`.
2. Change \`createAlbum()\` to return a \`Future<Album>\`:
   1. Convert the response body into a JSON \`Map\` with the \`dart:convert\` package.
   2. If the server returns a \`CREATED\` response with status code 201, convert the JSON \`Map\` into an \`Album\` with the \`fromJson()\` factory method.
   3. If the server does not return status code 201, throw an exception. Also throw an exception for a "404 Not Found" response. Do not return \`null\`.

### Get a title from user input

Create a \`TextField\` to enter a title and an \`ElevatedButton\` to send the data to the server. Define a \`TextEditingController\` to read the user input from the \`TextField\`.

When the user pushes **Create Data**, the app sets \`_futureAlbum\` to the value that \`createAlbum()\` returns. The app sends the data in the \`TextField\` to the server as a \`POST\` request.

### Show the response

Use a [\`FutureBuilder\`](https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html) with the \`Future\` from \`createAlbum()\` and a \`builder\` function. \`snapshot.hasData\` returns \`true\` only when the snapshot contains a non-null data value. If \`createAlbum()\` returns \`null\`, the \`CircularProgressIndicator\` shows for all time. Thus \`createAlbum()\` must throw an exception, also for a "404 Not Found" response.

### Complete send example

\`\`\`dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

Future<Album> createAlbum(String title) async {
  final response = await http.post(
    Uri.parse('https://jsonplaceholder.typicode.com/albums'),
    headers: <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: jsonEncode(<String, String>{
      'title': title,
    }),
  );

  if (response.statusCode == 201) {
    // If the server did return a 201 CREATED response,
    // then parse the JSON.
    return Album.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  } else {
    // If the server did not return a 201 CREATED response,
    // then throw an exception.
    throw Exception('Failed to create album.');
  }
}

class Album {
  final int id;
  final String title;

  const Album({required this.id, required this.title});

  factory Album.fromJson(Map<String, dynamic> json) {
    return switch (json) {
      {
        'id': int id,
        'title': String title,
      } =>
        Album(
          id: id,
          title: title,
        ),
      _ => throw const FormatException('Failed to load album.'),
    };
  }
}

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() {
    return _MyAppState();
  }
}

class _MyAppState extends State<MyApp> {
  final TextEditingController _controller = TextEditingController();
  Future<Album>? _futureAlbum;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Create Data Example',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Create Data Example'),
        ),
        body: Container(
          alignment: Alignment.center,
          padding: const EdgeInsets.all(8),
          child: (_futureAlbum == null) ? buildColumn() : buildFutureBuilder(),
        ),
      ),
    );
  }

  Column buildColumn() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        TextField(
          controller: _controller,
          decoration: const InputDecoration(hintText: 'Enter Title'),
        ),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _futureAlbum = createAlbum(_controller.text);
            });
          },
          child: const Text('Create Data'),
        ),
      ],
    );
  }

  FutureBuilder<Album> buildFutureBuilder() {
    return FutureBuilder<Album>(
      future: _futureAlbum,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return Text(snapshot.data!.title);
        } else if (snapshot.hasError) {
          return Text('\${snapshot.error}');
        }

        return const CircularProgressIndicator();
      },
    );
  }
}
\`\`\`

## Parse JSON in the background

By default, Dart apps do all their work on a single thread. Usually this model makes code simple and is fast enough, without poor performance or stuttering animations ("jank"). Source: [Parse JSON in the background](https://docs.flutter.dev/cookbook/networking/background-parsing).

An expensive computation, for example the parse of a very large JSON document, can take more than 16 ms. Then the users see jank. To prevent jank, do expensive computations in the background. On Android, this means work on a different thread. In Flutter, use a separate [Isolate](https://api.flutter.dev/flutter/dart-isolate/Isolate-class.html).

### Request the photos

Add the [\`http\`](https://pub.dev/packages/http) package:

\`\`\`bash
flutter pub add http
\`\`\`

This example gets a large JSON document with a list of 5000 photo objects from the [JSONPlaceholder REST API](https://jsonplaceholder.typicode.com) with the [\`http.get()\`](https://pub.dev/documentation/http/latest/http/get.html) method:

\`\`\`dart
Future<http.Response> fetchPhotos(http.Client client) async {
  return client.get(Uri.parse('https://jsonplaceholder.typicode.com/photos'));
}
\`\`\`

> **NOTE:** The function receives an \`http.Client\`. This makes the function easier to test and to use in different environments.

### Convert the JSON into a list of photos

As in [Fetch data from the internet](#fetch-data-from-the-internet), convert the \`http.Response\` into a list of Dart objects:

1. Create a \`Photo\` class with a \`fromJson()\` factory method that creates a \`Photo\` from a JSON object.
2. Create a \`parsePhotos()\` function that converts the response body into a \`List<Photo>\`.
3. Use \`parsePhotos()\` in \`fetchPhotos()\`.

This version runs \`parsePhotos()\` synchronously in the main isolate:

\`\`\`dart
Future<List<Photo>> fetchPhotos(http.Client client) async {
  final response = await client
      .get(Uri.parse('https://jsonplaceholder.typicode.com/photos'));

  // Synchronously run parsePhotos in the main isolate.
  return parsePhotos(response.body);
}
\`\`\`

### Move the work to a separate isolate

On a slower device, the app can stop for a short time while it parses and converts the JSON. This is jank.

To remove the jank, move the parse and the conversion to a background isolate with the [\`compute()\`](https://api.flutter.dev/flutter/foundation/compute.html) function. \`compute()\` runs an expensive function in a background isolate and returns the result. The [complete isolate example](#complete-isolate-example) runs \`parsePhotos()\` with \`compute()\`.

Isolates communicate when they send messages to each other. The messages can be primitive values (\`null\`, \`num\`, \`bool\`, \`double\`, or \`String\`) or simple objects, for example the \`List<Photo>\` in this example. If you send more complex objects between isolates, for example a \`Future\` or an \`http.Response\`, errors can occur.

For background processing, you can also use the [\`worker_manager\`](https://pub.dev/packages/worker_manager) or [\`workmanager\`](https://pub.dev/packages/workmanager) packages.

### Complete isolate example

\`\`\`dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

Future<List<Photo>> fetchPhotos(http.Client client) async {
  final response = await client
      .get(Uri.parse('https://jsonplaceholder.typicode.com/photos'));

  // Use the compute function to run parsePhotos in a separate isolate.
  return compute(parsePhotos, response.body);
}

// A function that converts a response body into a List<Photo>.
List<Photo> parsePhotos(String responseBody) {
  final parsed =
      (jsonDecode(responseBody) as List).cast<Map<String, dynamic>>();

  return parsed.map<Photo>((json) => Photo.fromJson(json)).toList();
}

class Photo {
  final int albumId;
  final int id;
  final String title;
  final String url;
  final String thumbnailUrl;

  const Photo({
    required this.albumId,
    required this.id,
    required this.title,
    required this.url,
    required this.thumbnailUrl,
  });

  factory Photo.fromJson(Map<String, dynamic> json) {
    return Photo(
      albumId: json['albumId'] as int,
      id: json['id'] as int,
      title: json['title'] as String,
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String,
    );
  }
}

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    const appTitle = 'Isolate Demo';

    return const MaterialApp(
      title: appTitle,
      home: MyHomePage(title: appTitle),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late Future<List<Photo>> futurePhotos;

  @override
  void initState() {
    super.initState();
    futurePhotos = fetchPhotos(http.Client());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: FutureBuilder<List<Photo>>(
        future: futurePhotos,
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(
              child: Text('An error has occurred!'),
            );
          } else if (snapshot.hasData) {
            return PhotosList(photos: snapshot.data!);
          } else {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }
        },
      ),
    );
  }
}

class PhotosList extends StatelessWidget {
  const PhotosList({super.key, required this.photos});

  final List<Photo> photos;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
      ),
      itemCount: photos.length,
      itemBuilder: (context, index) {
        return Image.network(photos[index].thumbnailUrl);
      },
    );
  }
}
\`\`\`

## Communicate with WebSockets

WebSockets give two-way communication with a server without polling. This example connects to a [test WebSocket server sponsored by Lob.com](https://www.lob.com/blog/websocket-org-is-down-here-is-an-alternative). The server sends back the same message that you send to it. Source: [Communicate with WebSockets](https://docs.flutter.dev/cookbook/networking/web-sockets).

The [\`web_socket_channel\`](https://pub.dev/packages/web_socket_channel) package supplies a \`WebSocketChannel\`. With it, you can listen for messages from the server and send messages to the server.

| Task | Code |
| --- | --- |
| Connect to a server | \`final channel = WebSocketChannel.connect(Uri.parse('wss://echo.websocket.events'));\` |
| Send data | \`channel.sink.add('Hello!');\` |
| Close the connection | \`channel.sink.close();\` |

### Listen for messages

Use a [\`StreamBuilder\`](https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html) widget to listen for new messages and a [\`Text\`](https://api.flutter.dev/flutter/widgets/Text-class.html) widget to show them:

\`\`\`dart
StreamBuilder(
  stream: channel.stream,
  builder: (context, snapshot) {
    return Text(snapshot.hasData ? '\${snapshot.data}' : '');
  },
)
\`\`\`

### How the WebSocket channel works

- The \`WebSocketChannel\` supplies a [\`Stream\`](https://api.flutter.dev/flutter/dart-async/Stream-class.html) of messages from the server. The \`Stream\` class is a basic part of the \`dart:async\` package. It listens to asynchronous events from a data source. A \`Future\` returns one asynchronous response, but a \`Stream\` can deliver many events over time.
- The \`StreamBuilder\` widget connects to a \`Stream\`. Each time it receives an event, it tells Flutter to rebuild with the \`builder()\` function.
- The \`WebSocketChannel\` supplies a [\`StreamSink\`](https://api.flutter.dev/flutter/dart-async/StreamSink-class.html) to send messages to the server. The \`StreamSink\` class adds synchronous or asynchronous events to a data source.

### Complete WebSocket example

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    const title = 'WebSocket Demo';
    return const MaterialApp(
      title: title,
      home: MyHomePage(
        title: title,
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({
    super.key,
    required this.title,
  });

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  final TextEditingController _controller = TextEditingController();
  final _channel = WebSocketChannel.connect(
    Uri.parse('wss://echo.websocket.events'),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Form(
              child: TextFormField(
                controller: _controller,
                decoration: const InputDecoration(labelText: 'Send a message'),
              ),
            ),
            const SizedBox(height: 24),
            StreamBuilder(
              stream: _channel.stream,
              builder: (context, snapshot) {
                return Text(snapshot.hasData ? '\${snapshot.data}' : '');
              },
            )
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _sendMessage,
        tooltip: 'Send message',
        child: const Icon(Icons.send),
      ), // This trailing comma makes auto-formatting nicer for build methods.
    );
  }

  void _sendMessage() {
    if (_controller.text.isNotEmpty) {
      _channel.sink.add(_controller.text);
    }
  }

  @override
  void dispose() {
    _channel.sink.close();
    _controller.dispose();
    super.dispose();
  }
}
\`\`\`

## MVVM architecture

MVVM (Model-View-ViewModel) is a design pattern that separates the business logic of the app from the UI. The code becomes more modular and easier to test, debug, and scale. Source: [Implementing MVVM Architecture in Flutter: A Clean Code Approach](https://medium.com/@solomongetachew112/implementing-mvvm-architecture-in-flutter-a-clean-code-approach-571eee9f70f9).

![MVVM architecture illustration](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*GJT6zOMg1JSERK_ilduFqg.jpeg)

| Component | Responsibility |
| --- | --- |
| Model | The data layer of the app, for example network requests, databases, and APIs. |
| View | The UI. It listens for changes from the ViewModel and updates the UI. |
| ViewModel | The link between the View and the Model. It holds the app logic and controls the data flow between the two. |

Flutter is reactive, so MVVM agrees well with it. Widgets are the UI. A ViewModel for each widget keeps the business logic separate from the UI. The benefits are:

- **Separation of concerns:** Each part has a distinct responsibility. Large apps are easier to manage.
- **Testability:** The ViewModel contains all the app logic. You can test it without the UI.
- **Scalability:** When the app grows, the architecture stays clean and modular.

### Create the MVVM project

1. Create a new Flutter project:

   \`\`\`bash
   flutter create mvvm_example
   \`\`\`

2. Put the code in the \`models\`, \`views\`, \`viewmodels\`, and \`services\` folders. Each component then has a clear role:

   \`\`\`text
   lib/
   │
   ├── models/
   ├── services/
   ├── viewmodels/
   ├── views/
   \`\`\`

### Create the book model

This example app gets a list of books. The model represents the book data.

\`\`\`dart
// models/book_model.dart
class Book {
  final String title;
  final String author;
  Book({required this.title, required this.author});
}
\`\`\`

### Create the book service

The service does the network requests and gives data to the ViewModel. This example simulates the network request.

\`\`\`dart
// services/book_service.dart
import 'package:mvvm_example/models/book_model.dart';
class BookService {
  Future<List<Book>> fetchBooks() async {
    // Simulating network request
    await Future.delayed(Duration(seconds: 2));
    return [      Book(title: 'Clean Code', author: 'Robert C. Martin'),
      Book(title: 'Effective Dart', author: 'Google'),
    ];
  }
}
\`\`\`

### Create the book ViewModel

The ViewModel controls the state and gets the data from the service. Then it gives the data to the View.

\`\`\`dart
// viewmodels/book_viewmodel.dart
import 'package:flutter/foundation.dart';
import 'package:mvvm_example/models/book_model.dart';
import 'package:mvvm_example/services/book_service.dart';
class BookViewModel extends ChangeNotifier {
  final BookService _bookService = BookService();
  List<Book> _books = [];
  bool _loading = false;
  List<Book> get books => _books;
  bool get loading => _loading;
  Future<void> fetchBooks() async {
    _loading = true;
    notifyListeners();
    
    _books = await _bookService.fetchBooks();
    
    _loading = false;
    notifyListeners();
  }
}
\`\`\`

### Create the book view

In Flutter, the View is a widget that listens to the ViewModel and updates when it changes. This example uses the **Provider** package to control the state.

\`\`\`dart
// views/book_view.dart
import 'package:flutter/material.dart';
import 'package:mvvm_example/viewmodels/book_viewmodel.dart';
import 'package:provider/provider.dart';
class BookView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final bookViewModel = Provider.of<BookViewModel>(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Books'),
      ),
      body: bookViewModel.loading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: bookViewModel.books.length,
              itemBuilder: (context, index) {
                final book = bookViewModel.books[index];
                return ListTile(
                  title: Text(book.title),
                  subtitle: Text(book.author),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          bookViewModel.fetchBooks();
        },
        child: Icon(Icons.refresh),
      ),
    );
  }
}
\`\`\`

### Connect the MVVM parts

In the main file, set up the \`Provider\` to control the state of the \`BookViewModel\`:

\`\`\`dart
// main.dart
import 'package:flutter/material.dart';
import 'package:mvvm_example/viewmodels/book_viewmodel.dart';
import 'package:mvvm_example/views/book_view.dart';
import 'package:provider/provider.dart';
void main() {
  runApp(MyApp());
}
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [        ChangeNotifierProvider(create: (_) => BookViewModel()),
      ],
      child: MaterialApp(
        home: BookView(),
      ),
    );
  }
}
\`\`\`

### MVVM best practices

| Practice | Description |
| --- | --- |
| Dependency injection | Inject services with packages such as **get_it** or **riverpod**. The ViewModel becomes easier to test and more modular. |
| ViewModel tests | Test the ViewModel without the UI. Mock the data layer. |
| Error handling | Handle errors in the ViewModel. Add states for errors and update the View for them. |
| Code organization | When the app grows, put ViewModels and services into folders for each feature. |

MVVM needs some setup time at the start. In return, you get better code organization, testability, and scalability.

## MVVM todo app with a REST API

This sample is a Flutter MVVM todo app with REST API CRUD operations (create, read, update, delete). It has a login screen, a list of todo items, and a detail view for each item.

### Set up the todo project

1. Create a new Flutter project:

   \`\`\`bash
   flutter create todo_app
   cd todo_app
   \`\`\`

2. Add the dependencies to \`pubspec.yaml\`:

   \`\`\`yaml
   dependencies:
     flutter:
       sdk: flutter
     provider: ^6.0.0
     http: ^1.6.0
     shared_preferences: ^2.0.6
   \`\`\`

3. Get the packages:

   \`\`\`bash
   flutter pub get
   \`\`\`

### Todo folder structure

\`\`\`text
lib/
├── models/
│   └── todo.dart
├── viewmodels/
│   ├── login_viewmodel.dart
│   └── todo_viewmodel.dart
├── views/
│   ├── login_view.dart
│   ├── todo_list_view.dart
│   └── todo_detail_view.dart
├── services/
│   ├── api_service.dart
│   └── auth_service.dart
└── main.dart
\`\`\`

### Todo model

\`models/todo.dart\`:

\`\`\`dart
class Todo {
  final int id;
  final String title;
  final int userId;
  final bool completed;

  Todo({
    required this.id,
    required this.title,
    required this.userId,
    required this.completed,
  });

  factory Todo.fromJson(Map<String, dynamic> json) {
    return Todo(
      id: json['id'],
      title: json['title'],
      userId: json['userId'],
      completed: json['completed'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'userId': userId,
      'completed': completed,
    };
  }
}
\`\`\`

### Todo services

\`services/api_service.dart\`:

\`\`\`dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/todo.dart';

class ApiService {
  final String baseUrl = 'https://jsonplaceholder.typicode.com/todos';

  Future<List<Todo>> fetchTodos() async {
    final response = await http.get(Uri.parse(baseUrl));
    if (response.statusCode == 200) {
      List jsonResponse = json.decode(response.body);
      return jsonResponse.map((todo) => Todo.fromJson(todo)).toList();
    } else {
      throw Exception('Failed to load todos');
    }
  }

  Future<Todo> fetchTodoById(int id) async {
    final response = await http.get(Uri.parse('$baseUrl/$id'));
    if (response.statusCode == 200) {
      return Todo.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load todo');
    }
  }

  Future<void> createTodo(Todo todo) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(todo.toJson()),
    );
    if (response.statusCode != 201) {
      throw Exception('Failed to create todo');
    }
  }

  Future<void> updateTodo(Todo todo) async {
    final response = await http.put(
      Uri.parse('$baseUrl/\${todo.id}'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(todo.toJson()),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update todo');
    }
  }

  Future<void> deleteTodo(int id) async {
    final response = await http.delete(Uri.parse('$baseUrl/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete todo');
    }
  }
}
\`\`\`

\`services/auth_service.dart\`:

\`\`\`dart
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  Future<void> login(String username, String password) async {
    // Simulate a login API call
    if (username == 'user' && password == 'password') {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isLoggedIn', true);
    } else {
      throw Exception('Invalid credentials');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('isLoggedIn');
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('isLoggedIn') ?? false;
  }
}
\`\`\`

### Todo ViewModels

\`viewmodels/login_viewmodel.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginViewModel extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = false;

  bool get isLoading => _isLoading;

  Future<void> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _authService.login(username, password);
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
\`\`\`

\`viewmodels/todo_viewmodel.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import '../models/todo.dart';
import '../services/api_service.dart';

class TodoViewModel extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Todo> _todos = [];
  bool _isLoading = false;

  List<Todo> get todos => _todos;
  bool get isLoading => _isLoading;

  TodoViewModel() {
    fetchTodos();
  }

  Future<void> fetchTodos() async {
    _isLoading = true;
    notifyListeners();
    try {
      _todos = await _apiService.fetchTodos();
    } catch (e) {
      print(e);
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTodo(Todo todo) async {
    await _apiService.createTodo(todo);
    _todos.add(todo);
    notifyListeners();
  }

  Future<void> updateTodo(Todo todo) async {
    await _apiService.updateTodo(todo);
    final index = _todos.indexWhere((t) => t.id == todo.id);
    if (index != -1) {
      _todos[index] = todo;
      notifyListeners();
    }
  }

  Future<void> deleteTodoById(int id) async {
    await _apiService.deleteTodo(id);
    _todos.removeWhere((todo) => todo.id == id);
    notifyListeners();
  }
}
\`\`\`

### Todo views

\`views/login_view.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/login_viewmodel.dart';

class LoginView extends StatelessWidget {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<LoginViewModel>(context);

    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _usernameController,
              decoration: InputDecoration(labelText: 'Username'),
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            viewModel.isLoading
                ? CircularProgressIndicator()
                : ElevatedButton(
                    onPressed: () async {
                      try {
                        await viewModel.login(
                          _usernameController.text,
                          _passwordController.text,
                        );
                        Navigator.pushReplacementNamed(context, '/todos');
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Login failed')),
                        );
                      }
                    },
                    child: Text('Login'),
                  ),
          ],
        ),
      ),
    );
  }
}
\`\`\`

\`views/todo_list_view.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../viewmodels/todo_viewmodel.dart';
import '../models/todo.dart';

class TodoListView extends StatelessWidget {
  const TodoListView({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = Provider.of<TodoViewModel>(context);

    return Scaffold(
      appBar: AppBar(title: Text('Todo List')),
      body: viewModel.isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: viewModel.todos.length,
              itemBuilder: (context, index) {
                final todo = viewModel.todos[index];
                return ListTile(
                  title: Text(todo.title),
                  subtitle: Text(todo.userId.toString()),
                  trailing: Checkbox(
                    value: todo.completed,
                    onChanged: (bool? value) {
                      final updatedTodo = Todo(
                        id: todo.id,
                        title: todo.title,
                        userId: todo.userId,
                        completed: value ?? false,
                      );
                      viewModel.updateTodo(updatedTodo);
                    },
                  ),
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/todoDetail',
                      arguments: todo,
                    );
                  },
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.pushNamed(context, '/addTodo');
        },
        child: Icon(Icons.add),
      ),
    );
  }
}
\`\`\`

> **NOTE:** The add button opens the \`/addTodo\` route, but \`main.dart\` does not define this route. Add an add-todo view and its route, or remove the button.

\`views/todo_detail_view.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import '../models/todo.dart';

class TodoDetailView extends StatelessWidget {
  const TodoDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    final Todo todo = ModalRoute.of(context)!.settings.arguments as Todo;

    return Scaffold(
      appBar: AppBar(title: Text(todo.title)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              todo.title,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              todo.userId.toString(),
              style: TextStyle(fontSize: 18),
            ),
            SizedBox(height: 20),
            Row(
              children: [
                Text('Completed: '),
                Checkbox(
                  value: todo.completed,
                  onChanged: (bool? value) {
                    // Handle checkbox change
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
\`\`\`

### Todo main application

\`main.dart\`:

\`\`\`dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'viewmodels/login_viewmodel.dart';
import 'viewmodels/todo_viewmodel.dart';
import 'views/login_view.dart';
import 'views/todo_list_view.dart';
import 'views/todo_detail_view.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LoginViewModel()),
        ChangeNotifierProvider(create: (_) => TodoViewModel()),
      ],
      child: MaterialApp(
        title: 'Flutter MVVM Todo App',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        initialRoute: '/',
        routes: {
          '/': (context) => LoginView(),
          '/todos': (context) => TodoListView(),
          '/todoDetail': (context) => TodoDetailView(),
        },
      ),
    );
  }
}
\`\`\`

Run the app:

\`\`\`bash
flutter run
\`\`\`

You can add more features, for example user registration, better error handling, and a more advanced UI.

## Troubleshooting

### The term 'flutter' is not recognized

\`\`\`text
flutter : The term 'flutter' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
\`\`\`

1. Make sure that \`%USERPROFILE%\\flutter\\bin\` is in the \`Path\` environment variable. The Dart SDK is in \`%USERPROFILE%\\flutter\\bin\\cache\\dart-sdk\\bin\`.

   ![The flutter bin folder in the Path environment variable](https://i.sstatic.net/WcRzF.png)

2. In CMD, run these commands:

   \`\`\`cmd
   flutter doctor
   flutter doctor -v
   flutter --disable-analytics
   dart --disable-analytics
   \`\`\`

See [this Stack Overflow answer](https://stackoverflow.com/a/70134173).

### Android sdkmanager not found

\`\`\`text
flutter : Android sdkmanager not found. Update to the latest Android SDK and ensure that the cmdline-tools are installed to resolve this.
\`\`\`

1. Open Android Studio and go to **File > Settings... > Languages & Frameworks > Android SDK**.
2. Update or install **Android SDK Command-line Tools**.
3. Click **Apply** and restart Android Studio.

   ![Android SDK Command-line Tools in the Android Studio settings](https://i.sstatic.net/M6RfW3wp.png)

4. In CMD, run this command:

   \`\`\`cmd
   flutter doctor --android-licenses
   \`\`\`

See [this Stack Overflow answer](https://stackoverflow.com/a/70950986).

### Please upgrade your AGP version to at least 8.x.x

1. Find the Gradle version of the app in \`C:\\Users\\<UserName>\\source\\repos\\<FlutterApp>\\android\\gradle\\wrapper\\gradle-wrapper.properties\`:

   \`\`\`properties
   distributionUrl=https\\://services.gradle.org/distributions/gradle-x-all.zip
   \`\`\`

2. Download the latest [JDK version](https://www.oracle.com/java/technologies/downloads/) that is compatible with that Gradle version, and run the x64 installer.
3. Add the JDK \`bin\` folder to the \`Path\` environment variable: \`C:\\Program Files\\Android\\Android Studio\\jbr\\bin\` or \`C:\\Program Files\\Java\\jdk-x\\bin\`.
4. Set the \`JAVA_HOME\` environment variable to \`C:\\Program Files\\Android\\Android Studio\\jbr\` or \`C:\\Program Files\\Java\\jdk-x\`.
5. Open a Command Prompt and run \`java -version\` to make sure that Java works.
6. Download the latest [Gradle (complete) version](https://gradle.org/releases/).
7. Extract the Gradle zip file to \`%USERPROFILE%\\gradle-8.x.x\`.
8. Add \`%USERPROFILE%\\gradle-8.x.x\\bin\` to the \`Path\` environment variable.
9. Open a Command Prompt and run \`gradle -v\` to make sure that Gradle works.

Compatibility references:

- [Java versions supported by each Gradle version](https://docs.gradle.org/current/userguide/compatibility.html)
- [Android Gradle plugin and Android Studio compatibility](https://developer.android.com/studio/releases#android_gradle_plugin_and_android_studio_compatibility)
- [IDE releases based on JetBrains Runtime (JDK)](https://github.com/JetBrains/JetBrainsRuntime)
- [Android Studio download archives](https://developer.android.com/studio/archive)

See [Upgrade Gradle version professionally in Flutter](https://medium.com/@abdalla-aladhami/upgrade-gradle-version-professionally-in-flutter-5e0c16305cc0).

## Related links

- [flutter CLI reference](https://docs.flutter.dev/reference/flutter-cli)
- [dart format](https://dart.dev/tools/dart-format)
- [ConnectionState class](https://api.flutter.dev/flutter/widgets/ConnectionState-class.html)
- [Install the http package](https://pub.dev/packages/http/install)
- [A Guide to Flutter Architecture Patterns: Folder Structures for MVC, MVVM, BLoC, and More](https://medium.com/@abdullahshahid.pk/a-guide-to-flutter-architecture-patterns-folder-structures-for-mvc-mvvm-bloc-and-more-a03613b174cd)
- [Medium to Markdown](https://medium2md.nabilmansour.com/) (the tool that converted the MVVM article)
- [Android SDK manual setup](doc:android-sdk-manual-setup)
- [Debug an Android app wirelessly](doc:android-wireless-debugging)
`;export{e as default};