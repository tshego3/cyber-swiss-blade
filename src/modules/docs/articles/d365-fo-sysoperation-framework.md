---
title: Create a batch job with the SysOperation framework
summary: Create the contract, service, controller, and action menu item that run an X++ process in the background with the D365 SysOperation framework.
category: Dynamics 365
order: 80
---

# Create a batch job with the SysOperation framework

The SysOperation framework runs a process in the background in Dynamics 365 Finance and Operations. This tutorial shows the minimum classes for a SysOperation job. It is based on [SysOperation Framework in D365](https://dynamics365musings.com/sysoperation-framework-in-d365/).

## When to use the SysOperation framework

- **Process a set of records.** For example, a data entity or a service brings data into a staging table. A job then loops through each record and creates functional data in the system.
- **Run a single-record process on many records.** A process that usually runs on one record in a form can run on a group of records. The job loops through the records and calls the existing code for each record.
- **Move slow work off a button.** If a button starts a process that does not complete instantly, and the user does not need the result immediately, send the work to a SysOperation job. For example, a process takes 15 s. Without the job, the user waits 15 s. With the job, the user gets control back immediately and can continue to work.

## Create the contract

The contract class holds the data that the process needs.

1. Create a new class with the `[DataContractAttribute]` attribute at the top. By convention, the class name ends with `Contract`.
2. Add a member variable and a parm method for each value that the process needs. For example, add a From Date and a To Date.

In the simplest scenarios, the contract class can be empty.

```xpp
[DataContractAttribute]
class rsmTutSysOperationsContract
{
    private int retentionDays;

    [DataMember,
    SysOperationLabel(literalStr("Retention days")),
    SysOperationHelpText(literalStr("Data older than the retention days will be cleaned up.")),
    SysOperationDisplayOrder('1')]
    public int parmRetentionDays(int _retentionDays = retentionDays)
    {
        retentionDays = _retentionDays;
        return retentionDays;
    }
}
```

## Create the service

The service class contains the code that does the processing.

1. Create a new class that extends `SysOperationServiceBase`. By convention, the class name ends with `Service`.
2. Add a public method with a name of your choice. The method takes one parameter of the type of the contract class.

```xpp
class rsmTutSysOperationsService extends SysOperationServiceBase
{
    public void process(rsmTutSysOperationsContract _contract)
    {
        //Do something
        int retentionDays = _contract.parmRetentionDays();

        Info(strFmt("Retention days: %1", retentionDays));
    }
}
```

## Create the controller

The controller class configures the SysOperation process.

1. Create a new class that extends `SysOperationServiceController`:

   ```xpp
   class rsmTutSysOperationsController extends SysOperationServiceController
   {

   }
   ```

2. Add a `new` method that calls `super`. Give it the name of the service class, the name of the method on the service class, and the execution mode:

   ```xpp
   protected void new()
   {
       super(classStr(rsmTutSysOperationsService), methodStr(rsmTutSysOperationsService, process), SysOperationExecutionMode::Synchronous);
   }
   ```

3. Add a `defaultCaption` method. It overrides the base method and returns the name of the job:

   ```xpp
   public ClassDescription defaultCaption()
   {
       return "Process Job";
   }
   ```

4. Add a `construct` method. It creates the controller and sets the execution mode:

   ```xpp
   public static rsmTutSysOperationsController construct(SysOperationExecutionMode _executionMode = SysOperationExecutionMode::Synchronous)
   {
       rsmTutSysOperationsController controller;
       controller = new rsmTutSysOperationsController();
       controller.parmExecutionMode(_executionMode);
       return controller;
   }
   ```

5. Add a `main` method. The menu item always calls `main`. The method calls `startOperation`, which calls the method on the service class:

   ```xpp
   public static void main(Args _args)
   {
       rsmTutSysOperationsController controller;
       controller = rsmTutSysOperationsController::construct();
       controller.parmArgs(_args);
       controller.startOperation();
   }
   ```

## Create the action menu item

1. Create a new action menu item that calls the controller class. Give it the same name as the controller class, for example `rsmTutSysOperationsController`.
2. In the properties, set **Object Type** to `Class`.
3. Set **Object** to the name of the controller class.

   ![SysOperation Framework action menu item](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-19.png?resize=500%2C191&ssl=1)

4. Set the **Label** property.
5. Add the menu item to a menu.

> **TIP:** To run a runnable class or a SysOperation class from the browser, open `https://{d365ffo-url}/?cmp={company}&mi=SysClassRunner&cls=placeholder`. Replace `placeholder` with the class name.

## Add parameters, defaults, validation, and lookups

These articles show more SysOperation framework functions:

| Topic | Link | Notes |
| --- | --- | --- |
| Parameters | [D365 SysOperation Framework Parameters](https://dynamics365musings.com/d365-sysoperation-framework-parameters/) | Add parameters to a batch job. |
| Lookups | [D365 SysOperation Framework Override Lookups](https://dynamics365musings.com/d365-sysoperation-framework-lookup/) | Override a drop-down list to show only valid options. |
| Default values | [D365 SysOperation Framework default value](https://dynamics365musings.com/d365-sysoperation-framework-default) | Give a parameter an initial value. |
| Validation | [D365 SysOperation Framework Validation](https://dynamics365musings.com/d365-sysoperation-framework-validation) | Validate the parameters. |
| Mandatory parameters | [D365 SysOperation Framework mandatory parameters](https://dynamics365musings.com/d365-sysoperation-framework-mandatory) | Show a red outline and a star on a field that must have a value. |
| Cheat sheet | [SysOperation framework cheat sheet](https://devmusings.blog/2018/03/02/sysoperation-framework-cheat-sheet/) | Another reference for the SysOperation classes. |

## Related links

- [SysOperation Framework in D365](https://dynamics365musings.com/sysoperation-framework-in-d365/)
- [D365 F&O and AX 2012 tips and navigation paths](doc:d365-fo-tips-and-navigation)
- [D365 F&O development processes](doc:d365-fo-development-processes)
