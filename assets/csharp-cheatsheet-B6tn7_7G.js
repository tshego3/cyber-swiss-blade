var e=`---
title: C# cheat sheet
summary: C# examples for concurrent collections, LINQ, logging, async calls, partial classes, batch queues, parameter passing, reflection, controllers, and safe collection changes.
category: C# and .NET
order: 10
---

# C# cheat sheet

This cheat sheet holds short C# examples for common tasks. Use it as a quick reference when you write console, library, or ASP.NET code.

## Before you start

| Item | Used by |
| --- | --- |
| .NET 6 or later | \`Parallel.ForEachAsync\`, \`Chunk\`, \`required\` members, file-scoped namespaces |
| \`Microsoft.Extensions.Logging\` and \`Microsoft.Extensions.Logging.Console\` | The logger example (\`AddConsole\`) |
| \`Newtonsoft.Json\` | The JSON examples and the MVC controller example |
| \`System.Web.Http\` (ASP.NET Web API) | The \`ApiController\` example |
| \`System.Web.Mvc\` (classic ASP.NET MVC) or \`Microsoft.AspNetCore.Mvc\` | The \`Controller\` example |

## Thread-safe collections

In a multi-threaded application, standard collections such as \`Dictionary\` or \`List\` can crash or corrupt data if more than one thread uses them at the same time. The \`System.Collections.Concurrent\` namespace gives thread-safe alternatives.

\`TryAdd\` returns \`false\` if the key is already in the collection.

\`\`\`csharp
using System;
using System.Collections.Concurrent;

// Example 0: Concurrent Example
// In a multi-threaded environment, standard collections like Dictionary or List can crash or corrupt data if multiple threads access them at once. The System.Collections.Concurrent namespace provides thread-safe alternatives.
class Program
{
    static void Main()
    {
        // 1. Initialize a thread-safe dictionary
        ConcurrentDictionary<string, string> inventory = new ConcurrentDictionary<string, string>();

        string key = "Laptop";
        string value = "MacBook Pro";

        // 2. First attempt to add the item
        Console.WriteLine($"Attempting to add {key}...");
        
        if (inventory.TryAdd(key, value))
        {
            Console.WriteLine("Success: Item added to inventory.");
        }
        else
        {
            Console.WriteLine("Failure: Item already exists.");
        }

        // 3. Second attempt to add the EXACT same key
        Console.WriteLine($"\\nAttempting to add {key} again...");
        // inventory.TryRemove(key, out _);

        if (inventory.TryAdd(key, "Dell XPS"))
        {
            Console.WriteLine("Success: Item added.");
        }
        else
        {
            // This block will run because "Laptop" is already a key
            Console.WriteLine("Failure: Could not add. The key already exists in the collection.");
        }

        // 4. Display the final count
        Console.WriteLine($"\\nFinal Inventory Count: {inventory.Count}");
    }
}
\`\`\`

## LINQ and lambda examples

The examples in this section and in the next 2 sections are one file. The \`using\` directives in the first block apply to all of them.

| Example | What it shows |
| --- | --- |
| 1 | \`Concat\` combines 2 lists, as a spread operator does in other languages. |
| 2 | \`Select\` with a lambda block and an explicit \`return\` makes anonymous objects. |
| 3 | A \`Where().All()\` chain returns a \`bool\`, not a list. |
| 4 | A lambda that you call immediately gives a fallback value if the code fails. |

> **NOTE:** Anonymous types are best for temporary or read-only projections. For data that you must change, use named classes or record types with mutable properties.

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

// Example 1: Combining collections using Concat (simulate spread operator)
class Example1
{
    public static void Run()
    {
        List<int> listA = new List<int> { 1, 2 };
        List<int> listB = new List<int> { 3, 4 };
        var combinedList = listA.Concat(listB).ToList();
        Console.WriteLine("Combined List using Concat (simulate spread operator): " + string.Join(", ", combinedList));
        // Output: 1, 2, 3, 4
    }
}

// Example 2: Updating a list using .Select with a return statement in a lambda block.
// Anonymous types are best for temporary or read-only projections. For mutable or updatable data (especially in collections), use named classes or record types with mutable properties.
class Example2
{
    public static void Run()
    {
        List<int> numbers = new List<int> { 10, 20, 30 };
        var mappedList = numbers.Select(num =>
        // var mappedList = numbers.Select((num, index) =>
        {
            // Using block syntax with an explicit return statement to create an anonymous object.
            return new { Original = num, Double = num * 2 };
        }).ToList();
        Console.WriteLine("\\nMapped List using Select with a return key:");
        foreach (var item in mappedList)
        {
            Console.WriteLine($"Original: {item.Original}, Double: {item.Double}");
        }
        // Output: Anonymous objects printed for each number.
    }
}

// Example 3: Chained syntax "Where().All().ToList()"
class Example3
{
    public static void Run()
    {
        List<int> numberList = new List<int> { 2, 4, 6, 8 };
        // Note: The original example's \`.ToList().All()\` would result in a boolean for \`filteredList\`.
        // If you intended to keep the list and then check 'All' as a separate step,
        // you would assign the ToList() result to a variable first.
        // For demonstration purposes, I'm showing the boolean result as implied by original chain.
        bool allEven = numberList
            .Where(n => n > 0) // Filter: keep numbers > 0
            .All(n => n % 2 == 0); // Check: if all numbers are even

        Console.WriteLine("\\nResult of Where().All() chain: " + allEven);
        // Output: Result of Where().All() chain: True
    }
}

// Example 4: Using a lambda with fallback logic
class Example4
{
    public static void Run(object mappedList)
    {
        string result = new Func<string>(() =>
        {
            try
            {
                // Uncomment the next line to test the fallback value
                // throw new Exception();
                // Assuming mappedList is accessible and not null, otherwise "Alternate value" will be used.
                // In a real scenario, you'd pass mappedList or define it within this scope.
                return (mappedList as List<object>)?.FirstOrDefault()?.ToString() ?? "Alternate value";
            }
            catch
            {
                return "Alternate value";
            }
        })();
        Console.WriteLine($"\\n{result}");
        // Output: Either "{ Original = 10, Double = 20 }" or "Alternate value" based on the state and exception.
    }
}
\`\`\`

## Create a logger manually

Use \`LoggerFactory.Create\` when you do not have dependency injection. Make one factory and create loggers from it. Do not call \`new LoggerFactory()\` each time, because that makes a new factory every time.

\`\`\`csharp
// Example 5: Manually Creating the Logger
public class MyClassService
{
    private readonly ILogger<MyClassService> _logger;

    public MyClassService(ILogger<MyClassService> logger)
    {
        _logger = logger;
        _logger.LogInformation("MyClassService initialized.");
    }

    public void DoSomething()
    {
        _logger.LogInformation("Doing something important.");
    }
}

class Example5
{
    public static void Run()
    {
        var loggerFactory = LoggerFactory.Create(builder =>
        {
            // Configure logging providers
            builder.AddConsole();
            // Optionally add more providers here (e.g., Debug, EventSource)
        });

        ILogger<MyClassService> logger = loggerFactory.CreateLogger<MyClassService>();
        // ILogger<MyClassService> logger = new LoggerFactory().CreateLogger<MyClassService>(); // This would create a new factory every time

        // Now you can pass this logger to your service
        var myClassService = new MyClassService(logger);
        myClassService.DoSomething();
    }
}
\`\`\`

## Rethrow exceptions and call async code

The \`Program\` class runs the examples above. It also shows how to rethrow an exception and how to call an async method from a method that is not async.

### Rethrow an exception

- Use \`throw;\` in a \`catch\` block. It keeps the original stack trace.
- Do not use \`throw ex;\`. It resets the stack trace to the \`catch\` block, and you lose the origin of the error.

### Options to call an async method

| Option | Use it for | Problems |
| --- | --- | --- |
| Fire and forget: \`_ = DoSomethingAsync();\` | Background tasks that are not critical and that handle their exceptions internally | No completion notification. Exceptions are not observed if the task does not handle them, so failures are silent. |
| \`Task.Run(async () => await DoSomethingAsync())\` | CPU-bound work that you move off the main thread, fire and forget | The same exception problems as fire and forget. A small thread overhead. |
| \`ContinueWith\` | Completion or error handling for a fire-and-forget task, without blocking | More complexity. Less readable than \`async\` and \`await\`. Manual error handling. |
| \`.GetAwaiter().GetResult()\` | Blocking until the method completes. It unwraps exceptions. | It blocks the thread and can cause deadlocks. Not suitable for UI code. |
| \`.Wait()\` or \`.Result\` | Do not use | It blocks the calling thread, which makes the application unresponsive and can cause deadlocks. It wraps exceptions in \`AggregateException\`. |

> **WARNING:** A deadlock is a common risk in UI and ASP.NET applications. If the async method uses \`await\` on a context that needs the current thread, and \`.Wait()\` blocks that thread, the application stops.

Rules:

- Use \`await\` where possible. It gives true asynchronous, non-blocking execution.
- Use \`async void\` only for event handlers, and handle exceptions in the handler.
- For other \`void\` methods, use fire and forget with internal error handling. If you cannot use \`await\`, use \`ContinueWith\` to observe completion and errors.

\`\`\`csharp
class Program
{
    static void Main(string[] args)
    {
        try
        {
            Example1.Run();
            Example2.Run();
            // For Example 4, we need to pass a list (or simulate it)
            // Let's create a dummy list for Example 4 based on Example 2's output structure
            List<object> dummyMappedList = new List<object>
            {
                new { Original = 10, Double = 20 } // Simulating an item from mappedList
            };
            Example4.Run(dummyMappedList);
            Example3.Run(); // Changed order to make Example 3's output clearer after previous runs
            Example5.Run();
        }
        catch (Exception ex)
        {
            // 1. Catch the error
            Console.Error.WriteLine($"[LOG] An error occurred in Main: {ex.Message}");
            // You might log more details, like ex.StackTrace, to a file or monitoring system here.

            // 2. Re-throw the original exception
            // IMPORTANT: Just 'throw;' preserves the original stack trace.
            // 'throw ex;' (BAD) would reset the stack trace to this point, losing origin info.
            throw;
        }

        Console.WriteLine("--- Demonstrating Alternatives and Why .Wait() Is Bad ---");

        var demo = new AsyncAlternatives();

        Console.WriteLine("\\n--- 1. Fire and Forget (Ignoring the Task) ---");
        // Good for truly background, non-critical tasks where exceptions are handled internally.
        // Bad for: No completion notification, unobserved exceptions if not handled internally.
        demo.FireAndForgetCall();
        Console.WriteLine("Main thread continues immediately after FireAndForgetCall.");
        Task.Delay(500).Wait(); // Give async task a moment to start
        Console.WriteLine("--------------------------------------------\\n");

        Console.WriteLine("--- 2. Task.Run() (Offloading to Thread Pool) ---");
        // Good for: Moving CPU-bound work off the main thread, fire-and-forget.
        // Bad for: Same unobserved exception issues as pure fire-and-forget, slight overhead.
        demo.TaskRunCall();
        Console.WriteLine("Main thread continues immediately after TaskRunCall.");
        Task.Delay(500).Wait(); // Give async task a moment to start
        Console.WriteLine("----------------------------------------------\\n");

        Console.WriteLine("--- 3. ContinueWith (For Completion/Error Handling) ---");
        // Good for: Observing completion or handling exceptions from a fire-and-forget task without blocking.
        // Bad for: Can add complexity, less readable than async/await.
        demo.ContinueWithCall();
        Console.WriteLine("Main thread continues immediately after ContinueWithCall.");
        Task.Delay(3000).Wait(); // Give async task and continuation a moment to complete
        Console.WriteLine("-----------------------------------------------\\n");

        Console.WriteLine("--- Why .Wait() Is Bad (and .Result too) ---");
        // .Wait() blocks the calling thread, leading to unresponsiveness and deadlocks.
        // It also wraps exceptions in AggregateException, making error handling clunky.
        try
        {
            Console.WriteLine("Attempting to use .Wait() - This will block the current thread.");
            demo.DoSomethingAsync().Wait(); // BAD: Blocks the Main thread
            Console.WriteLine("If this were a UI app, the UI would freeze here.");
            Console.WriteLine("If this were ASP.NET, a request thread would be tied up.");
        }
        catch (AggregateException ex)
        {
            Console.WriteLine($"Caught an AggregateException from .Wait(): {ex.InnerExceptions[0].Message}");
            // Better error handling: foreach (var inner in ex.InnerExceptions) { Console.WriteLine(inner.Message); }
        }
        // DEADLOCK POTENTIAL (common in UI/ASP.NET):
        // If DoSomethingAsync internally used await on a context that requires the current thread,
        // and that thread is blocked by .Wait(), it would deadlock.

        Console.WriteLine("\\n--- Conclusion ---");
        Console.WriteLine("Prefer 'await' whenever possible to enable true asynchronous, non-blocking execution.");
        Console.WriteLine("Only use 'async void' for event handlers, with internal exception handling.");
        Console.WriteLine("For other 'void' methods, consider fire-and-forget with internal error handling,");
        Console.WriteLine("or 'ContinueWith' for observing completion/errors if not awaiting is an absolute must.");
    }

    class AsyncAlternatives
    {
        // A simulated async task for demonstrations
        public async Task DoSomethingAsync()
        {
            Console.WriteLine("    [Async] DoSomethingAsync started.");
            await Task.Delay(1000); // Simulate network call or I/O
            // Uncomment the line below to see exception handling in action for different scenarios
            // throw new InvalidOperationException("Simulated error in async task!");
            Console.WriteLine("    [Async] DoSomethingAsync finished.");
        }

        // 1. Fire and Forget - Calls async method and discards the Task using _ =. Silent failures.
        public void FireAndForgetCall()
        {
            Console.WriteLine("    Calling DoSomethingAsync() and discarding the Task.");
            _ = DoSomethingAsync(); // Use '_' discard operator for clarity
        }

        // 2. Task.Run() - Wraps async method in Task.Run to run on thread pool. Adds thread overhead.
        public void TaskRunCall()
        {
            Console.WriteLine("    Wrapping DoSomethingAsync() in Task.Run().");
            _ = Task.Run(async () => await DoSomethingAsync());
        }

        // 3. ContinueWith - Attaches continuation to the Task for post-completion logic. Manual error handling.
        public void ContinueWithCall()
        {
            Console.WriteLine("    Calling DoSomethingAsync() and attaching a ContinueWith.");
            DoSomethingAsync().ContinueWith(task =>
            {
                if (task.IsFaulted)
                {
                    foreach (var ex in task.Exception.InnerExceptions)
                    {
                        Console.Error.WriteLine($"    [ContinueWith Error] Async task failed: {ex.Message}");
                    }
                }
                else if (task.IsCompletedSuccessfully)
                {
                    Console.WriteLine("    [ContinueWith Success] Async task completed successfully.");
                }
                // Add else if (task.IsCanceled) for cancellation handling
            }, TaskScheduler.Default); // Ensures continuation runs on a thread pool thread
        }
        
        // 4. Blocking Call with .GetAwaiter().GetResult() - Blocks the thread until the async method completes and unwraps exceptions. Can cause deadlocks, blocks thread and not suitable for UI.
        public void BlockingCall()
        {
            Console.WriteLine("Blocking on DoSomethingAsync() using .GetAwaiter().GetResult().");
            try
            {
                DoSomethingAsync().GetAwaiter().GetResult();
                Console.WriteLine("[BlockingCall] Completed without exception.");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[BlockingCall Error] Exception: {ex.Message}");
            }
        }
    }
}
\`\`\`

## Partial classes

A partial class splits one class across more than one file.

- Each file must use the \`partial\` keyword.
- The compiler combines all parts into one class.

Project structure:

\`\`\`text
PartialClassExample/
├── Program.cs
├── Person.cs
└── Person.Extensions.cs
\`\`\`

\`Person.cs\`:

\`\`\`csharp
namespace PartialClassExample;

public partial class Person
{
    public string FirstName { get; set; }
    public string LastName { get; set; }

    public Person(string firstName, string lastName)
    {
        FirstName = firstName;
        LastName = lastName;
    }
}
\`\`\`

\`Person.Extensions.cs\`:

\`\`\`csharp
namespace PartialClassExample;

public partial class Person
{
    public string FullName => $"{FirstName} {LastName}";

    public void SayHello()
    {
        Console.WriteLine($"Hello, my name is {FullName}.");
    }
}
\`\`\`

\`Program.cs\`:

\`\`\`csharp
using PartialClassExample;

Person person = new Person("John", "Doe");

Console.WriteLine(person.FullName);
person.SayHello();
\`\`\`

Output:

\`\`\`text
John Doe
Hello, my name is John Doe.
\`\`\`

### Generated code and custom code

A common use is to keep generated code and custom code in different files. The generator can then replace its file without a change to your custom logic. The WinForms Designer, Entity Framework, and source generators use partial classes.

\`Customer.Generated.cs\`:

\`\`\`csharp
namespace PartialClassExample;

public partial class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}
\`\`\`

\`Customer.cs\`:

\`\`\`csharp
namespace PartialClassExample;

public partial class Customer
{
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(Name);
    }
}
\`\`\`

Usage:

\`\`\`csharp
Customer customer = new Customer
{
    Id = 1,
    Name = "Alice"
};

Console.WriteLine(customer.IsValid());
\`\`\`

Output:

\`\`\`text
True
\`\`\`

## Batch queue

A batch queue takes a large list of items and gives them back in batches of a fixed size. The examples put 4000 items into batches of 100.

### Single thread

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class Program
{
    public class BatchQueue<T>
    {
        private readonly Queue<T> _queue;
        private readonly int _batchSize;

        public BatchQueue(IEnumerable<T> items, int batchSize)
        {
            _queue = new Queue<T>(items);
            _batchSize = batchSize;
        }

        // Dequeue the next batch
        public List<T> GetNextBatch()
        {
            var batch = new List<T>(_batchSize);
            while (batch.Count < _batchSize && _queue.Count > 0)
            {
                batch.Add(_queue.Dequeue());
            }
            return batch;
        }

        public bool HasItems => _queue.Count > 0;
    }

    public static async Task<List<int>> xyzAsync(List<int> batch)
    {
        Console.WriteLine($"Processing batch of {batch.Count} items...");
        await Task.Delay(200); // simulate some async work
        foreach (int item in batch)
        {
            Console.WriteLine($"Batch item: {item}");
        }
        return batch; // could return transformed or filtered results
    }

    public static async Task Main()
    {
        var items = Enumerable.Range(1, 4000).ToList();
        var queue = new BatchQueue<int>(items, 100);
        var processedItems = new List<int>();

        while (queue.HasItems)
        {
            var batch = queue.GetNextBatch();
            var processedBatch = await xyzAsync(batch);

            processedItems.AddRange(processedBatch); // Save processed results
        }

        Console.WriteLine($"All {processedItems.Count} items processed successfully!");
    }
}
\`\`\`

### Multiple threads with Parallel.ForEachAsync

For .NET 6 and later, use the \`Parallel.ForEachAsync\` method:

\`\`\`csharp
// For .NET 6+, use Parallel.ForEachAsync Method: https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel.foreachasync?view=net-9.0
await Parallel.ForEachAsync(
    Enumerable.Range(1, 4000).Chunk(100),
    new ParallelOptions { MaxDegreeOfParallelism = Environment.ProcessorCount },
    async (batch, _) => await xyzAsync(batch.ToList())
);
\`\`\`

### Multiple threads with a thread-safe queue

This version locks the queue and runs more than one batch at the same time. Set the maximum concurrency from the type of work:

- **CPU-bound tasks** (for example compression, image processing, or encryption): limit the concurrent tasks to the number of CPU cores. More tasks overload the processor.
- **I/O-bound tasks** (network, disk, or database access): you can run 2 to 10 times more concurrent tasks than cores, because the tasks spend much of their time in a wait for I/O.

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class Program
{
    public class BatchQueue<T>
    {
        private readonly Queue<T> _queue;
        private readonly int _batchSize;

        public BatchQueue(IEnumerable<T> items, int batchSize)
        {
            _queue = new Queue<T>(items);
            _batchSize = batchSize;
        }

        // Dequeue the next batch (thread-safe)
        public List<T> GetNextBatch()
        {
            lock (_queue)
            {
                var batch = new List<T>(_batchSize);
                while (batch.Count < _batchSize && _queue.Count > 0)
                {
                    batch.Add(_queue.Dequeue());
                }
                return batch;
            }
        }

        public bool HasItems
        {
            get { lock (_queue) return _queue.Count > 0; }
        }
    }

    public static async Task<List<int>> xyzAsync(List<int> batch)
    {
        Console.WriteLine($"Processing batch of {batch.Count} items on thread {Thread.CurrentThread.ManagedThreadId}...");
        await Task.Delay(200); // This simulates I/O (network, disk, or database) async work
        foreach (int item in batch)
        {
            Console.WriteLine($"Batch item: {item}");
        }
        return batch;
    }

    public static async Task Main()
    {
        var items = Enumerable.Range(1, 4000).ToList();
        var queue = new BatchQueue<int>(items, 100);
        var processedItems = new List<int>();

        // CPU-bound tasks: Limit concurrent tasks to the number of CPU cores to avoid overloading the processor (e.g., for compression, image processing, or encryption).
        // I/O-bound tasks: You can run many more concurrent tasks than cores (2x to 10x) since tasks spend much of their time waiting on I/O operations like network, disk, or database access.
        bool isCpuBound = false; // set based on your workload
        int maxConcurrency = 0;
        #if DEBUG 
            maxConcurrency = Environment.ProcessorCount;
        #else
            maxConcurrency = Math.Max(1, Environment.ProcessorCount * (isCpuBound ? 1 : Environment.ProcessorCount));
        #endif
        
        var tasks = new List<Task<List<int>>>();

        while (queue.HasItems)
        {
            // Launch up to N batches in parallel
            while (tasks.Count < maxConcurrency && queue.HasItems)
            {
                var batch = queue.GetNextBatch();
                tasks.Add(xyzAsync(batch));
            }

            // Wait for at least one to finish
            var finished = await Task.WhenAny(tasks);
            tasks.Remove(finished);
            processedItems.AddRange(await finished);
        }

        // Finish remaining batches
        processedItems.AddRange((await Task.WhenAll(tasks)).SelectMany(x => x));

        Console.WriteLine($"All {processedItems.Count} items processed successfully!");
    }
}
\`\`\`

> **NOTE:** In a build that is not \`DEBUG\`, I/O-bound work gets the number of cores multiplied by itself. This is 2 to 10 times the cores only on machines with 2 to 10 cores. Change the multiplier to suit your hardware and workload.

## Pass by value and pass by reference

| Method | Keyword | Result |
| --- | --- | --- |
| \`PassByValue(a)\` | none | The method changes a copy. \`a\` stays \`10\`. |
| \`PassByRef(ref b)\` | \`ref\` | The method changes the variable. \`b\` changes to \`20\`. |
| \`PassByOut(out c)\` | \`out\` | You do not initialize \`c\`. The method sets it to \`30\`. |
| \`ModifyList(numbers)\` | none | \`List<T>\` and \`ObservableCollection<T>\` are reference types. The method gets a copy of the reference, so changes to the elements change the original list. To replace the list object itself, use \`ref\` (\`PassListByRef\`). |

> **NOTE:** In a \`foreach\` loop, the loop variable is a read-only copy of each element. A change to it does not change the original list. Use a \`for\` loop with an index to change the elements.

\`\`\`csharp
using System;
using System.Linq;
using System.Collections.Generic;

public class Program
{
    public static void Main()
    {
        // Initialize variables
        int a = 10;      // Used for Pass by Value
        int b = 10;      // Used for Pass by ref
        int c;           // Used for Pass by out (no need to initialize)
        List<int> numbers = new List<int> { 1, 2, 3 };  // Reference type: the reference is passed by value

        Console.WriteLine("Before:");
        Console.WriteLine($"a (Pass by Value)     = {a}");
        Console.WriteLine($"b (Pass by ref)       = {b}");
        Console.WriteLine($"c (Pass by out)       = (uninitialized)");
        Console.WriteLine($"numbers (Pass by ref) = {string.Join(", ", numbers)}");

        // Call methods
        PassByValue(a);
        PassByRef(ref b);
        PassByOut(out c);
        ModifyList(numbers); // Pass the reference by value - modify list items

        Console.WriteLine("\\nAfter:");
        Console.WriteLine($"a (Pass by Value)     = {a}");   // Still 10
        Console.WriteLine($"b (Pass by ref)       = {b}");   // Changed to 20
        Console.WriteLine($"c (Pass by out)       = {c}");   // Set to 30
        Console.WriteLine($"numbers (Pass by ref) = {string.Join(", ", numbers)}"); // Changed
        
        PassListByRef(ref numbers);
        Console.WriteLine($"numbers (Pass by ref, after) = {string.Join(", ", numbers)}"); // Changed
        
        PassListItemByRef(ref numbers);
        Console.WriteLine($"numbers (Pass by ref, final) = {string.Join(", ", numbers)}"); // Changed
    }

    static void PassByValue(int x)
    {
        x = 100;
    }

    static void PassByRef(ref int y)
    {
        y = 20;
    }
    
    static void PassListByRef(ref List<int> y)
    {
        for (int i = 0; i < y.Count; i++)
        {
            y[i] *= 100;  // Modify each item in the list
        }
    }
    
    static void PassListItemByRef(ref List<int> y)
    {
        y[2] *= 1000;
    }

    static void PassByOut(out int z)
    {
        z = 30;
    }

    // List and ObservableCollection are a reference type; changes to its elements affect the original list
    static void ModifyList(List<int> list)
    // static void ModifyList(ObservableCollection<int> list)
    {
        for (int i = 0; i < list.Count; i++) // foreach is a read-only copy of each element. So trying to modify it won't affect the original list.
        {
            list[i] *= 10;  // Modify each item in the list
        }
    }
}
\`\`\`

## Inheritance and extension methods

This example shows a derived class (\`Dog : Animal\`), an extension method (\`PrintInfo\`), and an anonymous type (\`d2\`). \`GetJsonValue\` puts 2 values of any type into a JSON payload.

| Payload type | When to use it | JSON property names |
| --- | --- | --- |
| \`Dictionary<string, object>\` | The keys are known only at run time. | The dictionary keys |
| Anonymous type (read-only) | The payload shape is fixed and known at compile time. This is the simplest option. | The property names |
| Tuple | You want named slots without a class. | \`Item1\`, \`Item2\` |

> **NOTE:** Tuples lose their custom field names during JSON serialization. The names are only syntactic sugar, and the metadata does not keep them.

\`\`\`csharp
using Newtonsoft.Json;
using System;
using System.Collections.Generic;

public class Animal
{
    public string Name { get; set; }
    public int Age { get; set; }
    public void DisplayInfo()
    {
        Console.WriteLine($"Name: {Name}, Age: {Age}");
    }
}

public class Dog : Animal
{
    public string Breed { get; set; }
    public bool IsVaccinated { get; set; }
    public void Bark()
    {
        Console.WriteLine($"{Name} is barking.");
    }
}

public static class AnimalExtensions
{
    public static void PrintInfo(this Animal animal)
    {
        Console.WriteLine($"Animal Info - Name: {animal.Name}, Age: {animal.Age}");
    }
}

public class Program
{
    private static string GetJsonValue<T1, T2>(T1 _paramOne, T2 _paramTwo)
    {
        Dictionary<string, object> model = new Dictionary<string, object>();
        model.Add("_paramOne", _paramOne);
        model.Add("_paramTwo", _paramTwo);
        
        // Anonymous type (read-only) is simplest when your payload shape is fixed and known at compile time.
        // var model = new
        // {
        //     _paramOne = _paramOne,
        //     _paramTwo = _paramTwo
        // };
        // JSON representation
        // {
        //   "_paramOne": "",
        //   "_paramTwo": ""
        // }

        // Tuple gives you named slots without a class.
        // var model = Tuple.Create(_paramOne, _paramTwo);
        // var model = (
        //     _paramOne : _paramOne,
        //     _paramTwo : _paramTwo
        // );
        // JSON representation (Tuples lose their custom field names during JSON serialization because those names aren't preserved in metadata; they're just syntactic sugar.)
        // {
        //   "Item1": "",
        //   "Item2": ""
        // }
        
        return JsonConvert.SerializeObject(model);
    }

    public static void Main()
    {
        Dog d1 = new Dog
        {
            Name = "Buddy",
            Age = 3,
            Breed = "Golden Retriever",
            IsVaccinated = true
        };
        var d2 = new
        {
            Name = "Danger",
            Age = 4,
            Breed = "Pit Bull",
            IsVaccinated = false
        };
        d1.DisplayInfo();
        d1.Bark();
        d1.PrintInfo(); // Using the extension method
        Console.WriteLine(GetJsonValue(d1, d2));
    }
}
\`\`\`

## Null and populated property inspector

\`DtoChecker.CheckDtoProperties\` uses reflection to sort the public properties of an object into 2 lists: properties that are null or empty, and properties that have a value.

- A string is empty if it is null or white space.
- A value type is empty if it has its default value (for example \`0\` for \`int\`).
- If \`checkNonRequired\` is \`false\`, the method skips nullable properties (reference types and \`Nullable<T>\`).

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Reflection;

public class Program
{
    public static void Main()
    {
        try
        {
            PersonDto person = new PersonDto(birthDate: DateTime.Now, email: ""){ Name = "User"};
            var (nullProps, populatedProps) = DtoChecker.CheckDtoProperties(person, checkNonRequired: true);

            Console.WriteLine("Null/Empty Properties: " + string.Join(", ", nullProps));
            Console.WriteLine("Populated Properties: " + string.Join(", ", populatedProps));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking DTO: {ex.Message}");
        }
    }
}

public class PersonDto
{
    public required string Name { get; set; }
    public int Age { get; set; }
    public DateTime? BirthDate { get; set; }
    public string? Email { get; set; }
    public List<string> Contacts { get; set; }

    public PersonDto(string name = "User", int age = 0, DateTime? birthDate = null, string email = "user@example.com", List<string> contacts = default)
    {
        Name = name;
        Age = age;
        BirthDate = birthDate;
        Email = email;
        Contacts = contacts;
    }
}

public class DtoChecker
{
    public static (List<string> NullProps, List<string> PopulatedProps) 
        CheckDtoProperties(object dto, bool checkNonRequired = true)
    {
        var nullProps = new List<string>();
        var populatedProps = new List<string>();

        try
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto), "DTO object cannot be null.");

            var props = dto.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

            foreach (var prop in props)
            {
                var type = prop.PropertyType;
                var value = prop.GetValue(dto);

                if (!checkNonRequired && IsNullable(type))
                    continue;

                if (IsEmpty(value, type))
                    nullProps.Add(prop.Name);
                else
                    populatedProps.Add(prop.Name);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking DTO: {ex.Message}");
        }

        return (nullProps, populatedProps);
    }

    private static bool IsNullable(Type type) =>
        !type.IsValueType || Nullable.GetUnderlyingType(type) != null;

    private static bool IsEmpty(object value, Type type)
    {
        if (value == null) return true;
        if (type == typeof(string) && string.IsNullOrWhiteSpace((string)value)) return true;
        if (type.IsValueType && Activator.CreateInstance(type)?.Equals(value) == true) return true;
        return false;
    }
}
\`\`\`

## Controller and ApiController

| Base class | Framework | Returns |
| --- | --- | --- |
| \`ApiController\` | ASP.NET Web API | JSON or XML. Use it for APIs only. |
| \`Controller\` | ASP.NET MVC | Views or data (for example JSON). Use it for web pages. |

### ApiController (Web API)

\`\`\`csharp
using System.Threading.Tasks;
using System.Web.Http;

public class ProductsController : ApiController
{
    [HttpPost]
    public async Task<IHttpActionResult> AddProduct(Product product)
    {
        await Task.Delay(100); // simulate async work
        return Ok(new { message = "Product added", product });
    }
}

public class Product { public string Name { get; set; } }
\`\`\`

\`\`\`bash
curl -X POST https://localhost:5001/api/products \\
    -H "Content-Type: application/json" \\
    -d '{"name":"Book"}'
\`\`\`

### Controller (MVC)

In classic ASP.NET MVC, the action reads the request body from \`Request.InputStream\`. The commented code shows the ASP.NET Core version, which uses \`[FromBody]\`. The \`[Route]\` attribute is optional. It makes the action reachable at an external route.

\`\`\`csharp
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.IO;
using System.Web.Mvc; // Classic ASP.NET MVC
// using Microsoft.AspNetCore.Mvc; // ASP.NET MVC (.NET Core)
using System.Threading.Tasks;

public class ProductsController : Controller
{
    [HttpPost]
    [Route("products/add")] // Optional - Reachable Externally
    public async Task<ActionResult> AddProduct() // Classic ASP.NET MVC
    {
        using (StreamReader reader = new StreamReader(Request.InputStream))
        {
            string body = await reader.ReadToEndAsync();
            Product product = JsonConvert.DeserializeObject<Product>(body);
            return Json(new { message = "Product added", product });
        }
    }
    // public async Task<IActionResult> AddProduct([FromBody]Product product) // ASP.NET MVC (.NET Core)
    // {
    //     await Task.Delay(100);
    //     return Json(new { message = "Product added", product });
    // }
}

public class Product { public string Name { get; set; } }
\`\`\`

\`\`\`bash
curl -X POST https://localhost:5001/products/add \\
    -H "Content-Type: application/json" \\
    -d '{"name":"Book"}'
\`\`\`

## Async property in a sealed class

A C# property cannot be \`async\`. To get a value from async code, make the property return a \`Task<T>\` and \`await\` the property. The example also shows a static async method with an optional parameter. For a method that is not async, return \`Task.FromResult<int>(13)\`.

\`\`\`csharp
// https://blog.stephencleary.com/2013/01/async-oop-3-properties.html
using System;
using System.Threading.Tasks;

public class Program
{
    public static async Task Main()
    {
        Console.WriteLine(await new MyClass().MyProperty);
        Console.WriteLine(await MyClass.MyParamProperty());
        Console.WriteLine(await MyClass.MyParamProperty(3000));
    }
}

public sealed class MyClass
{
    private async Task<int> GetMyProperty()
    {
        await Task.Delay(1000);
        return 1000;
    }
    public Task<int> MyProperty
    {
        get { return GetMyProperty(); }
    }
    public static async Task<int> MyParamProperty(Nullable<int> param = null)
    {
        await Task.Delay(1000);

        if (param.HasValue == false)
        {
            // For Non-Async Method
            // return Task.FromResult<int>(13);
            return 2000;
        }
        else
        {
            return param.Value;
        }
    }
}
\`\`\`

## Avoid "Collection was modified" exceptions

This runtime error is common in C#:

\`\`\`text
System.InvalidOperationException: Collection was modified; enumeration operation may not execute.
\`\`\`

The error occurs when you add, remove, or replace items in a collection (for example a \`List<T>\`) while a \`foreach\` loop iterates through it.

Problem code:

\`\`\`csharp
foreach (var item in myCollection)
{
    if (item.ShouldBeRemoved)
    {
        // ERROR: This modifies the collection directly causing the iterator to become invalid
        myCollection.Remove(item); 
    }
    
    // OR modifying via reference in a way that updates the underlying structure
    if (item.NeedsUpdate)
    {
        // If this method internally modifies 'myCollection', it will also throw
        ProcessAndSave(item, myCollection);
    }

    // ERROR: Replacing an object in the collection also invalidates the enumerator
    // int index = myCollection.IndexOf(item);
    // myCollection[index] = modifiedItem; // Throws InvalidOperationException
}
\`\`\`

### Iterate over a copy

To change a collection safely in a loop, iterate over a snapshot (a copy) of the collection. \`.ToList()\` is the simplest way to make the copy.

\`\`\`csharp
// .ToList() creates a separate copy solely for the loop to iterate through
foreach (var item in myCollection.ToList())
{
    if (item.ShouldBeRemoved)
    {
        // Safe: We are modifying 'myCollection', but iterating over the temporary list copy
        myCollection.Remove(item); 
    }
}
\`\`\`

### Iterate backwards with a for loop

This is the recommended \`for\` loop for removals. Iterate from \`Count - 1\` down to \`0\`. Then a removal does not move the indexes of the items that you did not process yet.

\`\`\`csharp
for (int i = myCollection.Count - 1; i >= 0; i--)
{
    var item = myCollection[i];
    if (item.ShouldBeRemoved)
    {
        myCollection.RemoveAt(i); // Safe and efficient
    }
}
\`\`\`

### Iterate forwards with a for loop

If you iterate forwards and remove an item, decrease the index \`i\`. If you do not, the loop skips the next element. This approach causes more errors.

\`\`\`csharp
for (int i = 0; i < myCollection.Count; i++)
{
    var item = myCollection[i];
    if (item.ShouldBeRemoved)
    {
        myCollection.RemoveAt(i);
        i--; // CRITICAL: Adjust index to account for the shift
    }
}
\`\`\`

## Related links

- [Parallel.ForEachAsync method](https://learn.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallel.foreachasync?view=net-9.0)
- [Async OOP 3: Properties (Stephen Cleary)](https://blog.stephencleary.com/2013/01/async-oop-3-properties.html)
- [Essential algorithms with C#](doc:csharp-essential-algorithms)
`;export{e as default};