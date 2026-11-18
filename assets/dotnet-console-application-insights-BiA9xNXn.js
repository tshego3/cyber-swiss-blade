var e=`---
title: .NET console worker with Application Insights
summary: A .NET console app that runs as a Windows service and starts one background worker for each task, with logging and an Application Insights TelemetryClient.
category: C# and .NET
order: 110
---

# .NET console worker with Application Insights

This \`Program.cs\` file makes a .NET console application that runs as a Windows service. It starts one \`BackgroundService\` worker for each task in a list. Each worker gets a logger, the configuration, and an Application Insights \`TelemetryClient\`.

## Before you start

| Item | Notes |
| --- | --- |
| .NET 6 or later console template | The file uses the implicit \`using\` directives of the template, for example for \`Task\`, \`CancellationToken\`, and LINQ. Refer to [New C# console template](https://aka.ms/new-console-template). |
| \`Microsoft.Extensions.Hosting\` | \`Host\`, \`IHostedService\`, and \`BackgroundService\` |
| \`Microsoft.Extensions.Hosting.WindowsServices\` | \`UseWindowsService()\` |
| \`Microsoft.ApplicationInsights.WorkerService\` | \`TelemetryClient\` and \`AddApplicationInsightsTelemetryWorkerService()\`. Put the connection string in \`ApplicationInsights:ConnectionString\` in \`appsettings.json\`. |

## Code

\`\`\`csharp
// See https://aka.ms/new-console-template for more information
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace ConsoleApp1
{
    public class Program
    {
        public static List<TestModule> testModules = new List<TestModule>();

        static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseWindowsService()
                .ConfigureServices((hostContext, services) =>
                {
                    services.AddApplicationInsightsTelemetryWorkerService();
                    testModules.Add(new TestModule { Id = 30000, Name = "Task 1" });
                    testModules.Add(new TestModule { Id = 60000, Name = "Task 2" });
                    foreach (var task in testModules)
                    {
                        services.AddSingleton<IHostedService>(provider => new TestWorker(task, provider.GetService<ILogger<TestWorker>>(), provider.GetService<IConfiguration>(), provider.GetService<TelemetryClient>()));
                    }
                });
    }
}

public class TestModule
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

public class TestWorker : BackgroundService
{
    public List<int> intList = new List<int>();

    private readonly ILogger<TestWorker> _logger;
    private readonly IConfiguration _iconfiguration;
    private TelemetryClient _telemetryClient;
    public TestModule _testModule { get; set; }

    public TestWorker(TestModule testModule, ILogger<TestWorker> logger, IConfiguration iconfiguration, TelemetryClient telemetryClient)
    {
        _testModule = testModule;
        _logger = logger;
        _iconfiguration = iconfiguration;
        _telemetryClient = telemetryClient;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            intList.Add(1);
            _logger.LogInformation($"Task {_testModule.Name} Worker running at: {DateTimeOffset.Now} Counter: {intList.Sum()}");
            await Task.Delay(_testModule.Id, stoppingToken);
        }
    }
}
\`\`\`

## How to use it

1. Add a \`TestModule\` to \`testModules\` for each worker that you need. Set \`Id\` to the delay between runs in milliseconds.
2. Run the application from the console, or install it as a Windows service.

**Result:** Each worker writes a log line in a loop. "Task 1" writes every 30 s and "Task 2" writes every 60 s. The counter increases by 1 on each run.

## How it works

- \`UseWindowsService()\` lets the application run as a Windows service. It also runs as a normal console application.
- The code registers one \`IHostedService\` singleton for each \`TestModule\`. The host starts all of them.
- Each worker gets its services from the service provider with \`GetService\`. \`GetService\` returns \`null\` for a service that is not registered.
- \`AddApplicationInsightsTelemetryWorkerService()\` registers \`TelemetryClient\`, so each worker gets a working client.

> **NOTE:** Dated (checked November 2026): Ingestion with an instrumentation key ended on March 31, 2025. Use a connection string. For new applications, Microsoft recommends the Azure Monitor OpenTelemetry Distro.
- \`Task.Delay\` uses the \`stoppingToken\`, so the worker stops immediately when the host shuts down.

## Related links

- [New C# console template](https://aka.ms/new-console-template)
`;export{e as default};