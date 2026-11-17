---
title: C# retry strategy
summary: A static C# helper that runs a sync or async action again after a fixed interval, and throws an AggregateException when all attempts fail.
category: C# and .NET
order: 70
gist: 5b86e04073fbf02714a56112f02a8f3a
---

# C# retry strategy

`RetryStrategy` runs an action again when it throws an exception. Use it for operations that can fail for a short time, for example network or database calls.

## Before you start

- Declare a `Constants.RetryAttemptsMax` constant (an `int`) in your project. The methods use it as the default number of attempts. The source does not include it.

## Code

```csharp
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace App.Shared
{
    public static class RetryStrategy
    {
        public static void Do(Action action, TimeSpan retryInterval, int maxAttemptCount = Constants.RetryAttemptsMax)
        {
            Do<object>(() => { action(); return null; }, retryInterval, maxAttemptCount);
        }

        public static T Do<T>(Func<T> action, TimeSpan retryInterval, int maxAttemptCount = Constants.RetryAttemptsMax)
        {
            var exceptions = new List<Exception>();

            for (int attempted = 0; attempted < maxAttemptCount; attempted++)
            {
                try
                {
                    if (attempted > 0)
                    {
                        Thread.Sleep(retryInterval);
                    }
                    return action();
                }
                catch (Exception ex)
                {
                    exceptions.Add(ex);
                }
            }
            throw new AggregateException(exceptions);
        }

        public static Task DoAsync(Func<Task> action, TimeSpan retryInterval, int maxAttemptCount = Constants.RetryAttemptsMax)
        {
            return DoAsync<object>(async () => { await action(); return null; }, retryInterval, maxAttemptCount);
        }

        public static async Task<T> DoAsync<T>(Func<Task<T>> action, TimeSpan retryInterval, int maxAttemptCount = Constants.RetryAttemptsMax)
        {
            var exceptions = new List<Exception>();

            for (int attempted = 0; attempted < maxAttemptCount; attempted++)
            {
                try
                {
                    if (attempted > 0)
                    {
                        await Task.Delay(retryInterval);
                    }
                    return await action();
                }
                catch (Exception ex)
                {
                    exceptions.Add(ex);
                }
            }
            throw new AggregateException(exceptions);
        }
    }
}
```

## How to use it

```csharp
// Synchronous action, 3 attempts, 2 s between attempts.
RetryStrategy.Do(() => SendReport(), TimeSpan.FromSeconds(2), 3);

// Synchronous function with a result and the default number of attempts.
string data = RetryStrategy.Do(() => ReadFile(path), TimeSpan.FromSeconds(1));

// Asynchronous function with a result.
var user = await RetryStrategy.DoAsync(() => client.GetUserAsync(id), TimeSpan.FromMilliseconds(500));
```

## How it works

- The first attempt starts immediately. Each next attempt waits for `retryInterval` first.
- `Do` waits with `Thread.Sleep`, which blocks the thread. `DoAsync` waits with `Task.Delay`, which does not block the thread.
- The method stops at the first attempt that does not throw an exception, and returns its result.
- If all attempts fail, the method throws an `AggregateException` that holds the exception of each attempt.
- The `Action` and `Func<Task>` overloads call the generic overloads and return `null` as the result.
