---
title: D365 F&O and AX 2012 tips and navigation paths
summary: Navigation paths, keyboard shortcuts, security concepts, batch job and AIF port tasks, and fixes for common D365 F&O and AX 2012 errors.
category: Dynamics 365
order: 40
---

# D365 F&O and AX 2012 tips and navigation paths

This article collects navigation paths, short procedures, and error fixes for D365 F&O and Dynamics AX 2012. In the paths, `{company}` is the legal entity.

## Navigation paths

| Item | Path |
| --- | --- |
| All contacts | `{company}/Sales and marketing/Common/Contacts/All contacts` |
| All customers | `{company}/Sales ledger/Common/Customers/All customers` |
| All vendors | `{company}/Purchase ledger/Vendors/All vendors` |
| Contract serial number | `{company}/Strategic asset management/Common/Contract planning/<Contract per specific status == Active>/Registration/Serial Number` |
| AIF document logs | `{company}/System administration/Area page/Periodic/Services and Application Integration Framework/History/{Select a <Port name>}/Document logs/{Select <Process step>}/{Select <View XML>}` |
| AIF exceptions | `{company}/System administration/Area page/Periodic/Services and Application Integration Framework/Exceptions/{Select a <Exception message>}` |
| AIF inbound and outbound ports | `{company}/System administration/Area page/Setup/Services and Application Integration Framework/{Select <Inbound ports> or <Outbound ports}/{Select a <Port name>}` |
| Azure integration | `{company}/System administration/Area page/Setup/System/Azure integration` |
| Output document parameters | `{company}/Organisation administration/Area page/Setup/Document management/Output document parameters` |
| Batch jobs | `{company}/System administration/Area page/Enquires/Batch Jobs/<Job description>` |
| Customer transactions | `{company}/Sales ledger/Common/Customers/All customers/[Lookup & Select customer]/[Click Transactions on the ribbon]` |
| Document type library details | `{company}/Organisation administration/Area page/Setup/Document management/Document types/Output document parameter/<Right-Click Category Id>/<Click View details>` |
| SharePoint site collections | `{company}/ECM/Setup/ECM Parameters/SharePoint site collections` |
| All AX tables | `{company}/System administration/Area page/<Data export/import>/<Definitions groups>` |
| AX lookup multiselect dialog sample | `AOT/Classes/tutorial_LookupMultiSelectDialog` |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Esc` | Close a form. |
| `F12` | Show table and field information. |

## Add a customer relation to a user

1. Go to `{company}/System administration/Common/Users/Users`.
2. In the **Set Up** button group, select **Relations**.
3. Add the customer relation to the user and make it active.

## Run a batch job again in D365

1. Go to **System administration > Enquiries > Batch jobs**.
2. Select the job.
3. Set **Scheduled start date/time** to the time when the job must start.
4. Under **Recurrence**, set the job to run one time. Set the end date to the same day.
5. If the job status is **Ended**, use **Change status** to set the status to **Waiting**. This puts the job in the execution queue again.

## Security hierarchy in D365 F&O

The security model has four levels:

1. **Roles**: You assign roles to users. A role is a business responsibility, for example Accounts Payable Clerk.
2. **Duties**: A duty groups tasks. It is a responsibility in a role, for example Maintain vendor payments.
3. **Privileges**: The lowest level that you can configure. A privilege gives access to specific entry points (menu items, service operations, tables, and others).
4. **Entry points**: The objects in the system (forms, reports, service operations, tables).

For more information, read [Role-based security](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/role-based-security) and [Create Security In D365](https://dynamics365musings.com/create-security-in-d365/).

## Infolog messages

`InfologData` captures, stores, and restores Infolog messages in code. `SysInfologEnumerator` reads those messages (errors, warnings, info) one line at a time in X++. Use them to process, filter, or report messages.

- [Save and Restore InfoLog in Dynamics 365 FO using X++](https://d365ffo.com/2025/02/05/ax-d365fo-howto-save-and-restore-infolog-in-dynamics-365-fo-using-x/)
- [Retrieving Infolog Messages from Batch History in D365FO Using X++](https://d365ffo.com/2024/12/15/retrieving-infolog-messages-from-batch-history-in-d365fo-using-x/)

## X++ and C# syntax differences

X++ calls a static method with `::`. C# uses `.`.

```xpp
System.Net.WebRequest httpRequest = System.Net.WebRequest::Create(fileUri);
```

```csharp
System.Net.WebRequest httpRequest = System.Net.WebRequest.Create(fileUri);
```

## Feedback prompts for a Business Analyst

Use these prompts with an AI assistant to write work item updates.

### Investigation feedback update

```text
Generate a concise investigation feedback update for a Business Analyst. The investigation has been completed and the response should summarise: (1) the investigation findings, including the identified root cause or observed behaviour, (2) the proposed resolution(s), including any business, process, configuration, data, or system changes required, and (3) the estimated development effort. Use a balanced tone that is both technical and business-friendly, suitable for a project work item update. Do not include file paths or em dashes. Keep the response concise and structured as a single paragraph. State that the estimated development effort to implement the resolution is 0 hours if no development work is required.
```

### Development feedback update

```text
Generate a concise completed development feedback update for a Business Analyst. The development work has been completed and the response should summarise: (1) the solution implemented, including any business, process, configuration, data, or system changes delivered, (2) the outcome of the implementation and any key considerations or impacts, and (3) the actual development effort expended. Use a balanced tone that is both technical and business-friendly, suitable for a project work item update. Do not include file paths or em dashes. Keep the response concise and structured as a single paragraph.
```

## AX 2012 tasks

> **NOTE:** Dated (checked November 2026): Microsoft ended extended support for Dynamics AX 2012 R3 on 10 January 2023. AIF and the CIL options do not exist in D365 F&O. Use these tasks only for systems that still run AX 2012.

### Reset or change a case service status

1. Go to `{company}/Case management/Area page/Setup/Case Update/Case admin update`.
2. On the **Overview** tab, search for the case by Case ID and select it.
3. To change a service, select the service on the **Service Details** tab. Then select **Update Service Status**.
4. To change the status of a service process, go to the **Process** subtab and select the process. Then select **Edit Process**.
5. If you set a service process to "Not started", make sure that the process before it is "In progress".
6. To change the process action parameters, select **Update from setup**. This uses the most recent list version of the process action parameters.

### Fill the table name of a case service

Fill in the **Table name** parameter of the service. Then you do not have to create the record. This is the default method for the Portal.

1. Go to `{company}/Case management/Area page/Setup/Services/Service table/[Selected service]/Service details/Table name`.
2. Fill in the table name.

The field `CaseServiceRecId` must exist on the table. The system then runs `initValue` to fill in the values that it can.

### Change the URI of a disabled AIF port

1. In the AOT, go to `AOT/Data Dictionary/Tables/AifPort`, select the port name, and clear the **Enabled** field.
2. Go to `{company}/System administration/Area page/Setup/Services` and `Application Integration Framework/{Select the <Inbound port>/{Select the port name}`.
3. Change the URI of the inbound port with the drop-down list.

If the deployment or activation of the port stops, make sure that the files are in `C:\Program Files\Microsoft Dynamics AX\60\AifWebServicesTest`. A restart of the AOS can be sufficient.

### Change the WCF timeout of an AIF port

1. Go to **System Administration > Setup > Services and Application Integration Framework > Inbound Ports**.
2. Select the port. Make sure that the port is deactivated.
3. Select **Configure**, then go to **Bindings**.
4. Change the timeout values.

For the Azure Functions limit, read [Azure Function app time-out duration](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale#timeout).

### Debug X++ in interpreted mode

To debug X++ code in interpreted mode, turn off the CIL execution of business operations. For more information, read [Debugging in Microsoft Dynamics AX 2012](https://learn.microsoft.com/en-us/previous-versions/dynamicsax-2012/developer/debugging-in-microsoft-dynamics-ax-2012).

1. Open the development workspace (or any workspace).
2. Go to **Tools > Options > Development > General**.
3. Clear the **Execute business operations in CIL** check box.

### Clear AX usage data

1. In any workspace, go to **Tools > Options > Development**.
2. On the action pane, select **Usage data**.
3. On the pop-up form, select **All usage data**.
4. Select all records and delete them.

### Edit an object that another developer checked out

1. Open the table `DEVToolsLockTable`.
2. Add an `x` to the end of the name of the checked-out object.
3. Restart the client and make your changes.
4. Before you check in, remove the `x`.
5. On the deployment AOS, remove the changes that you did not make. Follow the deployment code version control standards.

### Add a .NET class library path

Use these folders for .NET class library references:

```text
C:\Program Files\Microsoft Dynamics AX\60\Server\MicrosoftDynamicsAX\bin
C:\Program Files (x86)\Microsoft Dynamics AX\60\Client\Bin
```

### Find SQL files in Azure DevOps

Use this search filter in Azure DevOps code search:

```text
file:{Name} ext:sql path:$/RepoName/Trunk/Development/Metadata/Model/Model/AxResource/ResourceContent/Data/
```

## Troubleshooting

### Team Explorer shows "The path is already mapped in workspace"

During **Team Explorer > Get and Map**, this error can occur: `The path C:\AOSService\PackagesLocalDirectory is already mapped in workspace [WorkSpaceName]\[E-Mail_Address]`.

Delete the contents of one of these folders:

- `C:\Users\%UserName%\AppData\Local\Microsoft\Team Foundation\8.0\Cache`
- `C:\Users\%UserName%\AppData\Local\Microsoft\VisualStudio\16.xxx`
- `17.xxx\ComponentModelCache`

You can also delete the subfolders of your TFS profile cache in `%localappdata%\Microsoft\Team Foundation\3.0\Cache`.

### AX 2012 shows "Could not load type 'Dynamics.Ax.Application.ClassName'"

The full error is similar to this:

```text
Faulted: System.OperationCanceledException: AIF service group not activated.  Service group: <ServiceGroupName>.  Error: Could not load type 'Dynamics.Ax.Application.<ClassName>' from assembly 'Dynamics.Ax.Application, Version=0.0.0000.000, Culture=neutral, PublicKeyToken=null'. ---> System.TypeLoadException: Could not load type 'Dynamics.Ax.Application.<ClassName>' from assembly 'Dynamics.Ax.Application, Version=0.0.0000.000, Culture=neutral, PublicKeyToken=null'.
```

To fix the error, compile the class and run an incremental CIL.

## Related links

- [Role-based security](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/role-based-security)
- [Create Security In D365](https://dynamics365musings.com/create-security-in-d365/)
- [Debugging in Microsoft Dynamics AX 2012](https://learn.microsoft.com/en-us/previous-versions/dynamicsax-2012/developer/debugging-in-microsoft-dynamics-ax-2012)
- [Azure Function app time-out duration](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale#timeout)
- [D365 F&O development processes](doc:d365-fo-development-processes)
