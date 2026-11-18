var e=`---
title: T-SQL debugger in SSMS and Visual Studio
summary: Set breakpoints, step through T-SQL code, and inspect variables with the Transact-SQL debugger in SSMS and in SSDT for Visual Studio.
category: DevOps and tools
order: 20
---

# T-SQL debugger in SSMS and Visual Studio

The Transact-SQL (T-SQL) debugger lets you set breakpoints, step through T-SQL code, and inspect variables during execution. Use it to debug complex stored procedures, functions, or scripts in SQL Server Management Studio (SSMS) or in SQL Server Data Tools (SSDT) for Visual Studio.

## Before you start

| Requirement | SSMS | SSDT for Visual Studio |
| --- | --- | --- |
| Tool | SSMS, in a version that supports the debugger. | Visual Studio with SSDT. SSDT is usually available in Visual Studio 2017 and later. |
| SQL Server | An instance that supports debugging, usually SQL Server 2005 and later. | Access to a SQL Server instance where the scripts run. |
| Permissions | A login that is a member of the **sysadmin** fixed server role. Only sysadmin members can debug. | A login that is a member of the **sysadmin** fixed server role. You also need permission to execute the scripts. |

SSDT is a Visual Studio extension. It gives the tools to develop SQL Server databases, T-SQL debugging included.

The debugger works only with SQL Server instances. It does not support Azure SQL Database, Azure SQL Managed Instance, or SQL database in Fabric. Debug on a test server, not on a production server: a debug session can hold locks for a long time.

> **NOTE:** Dated (checked November 2026): SSMS 18.0 and later do not include the T-SQL debugger. The SSMS steps in this article apply to SSMS 17.9.1 and earlier. For current tools, use SSDT for Visual Studio.

## Debug in SSMS

### Connect and enable debugging

1. Start SSMS and connect to your SQL Server instance.
2. If debugging is not enabled, go to **Tools** > **Options**.
3. In the **Options** dialog, go to **Query Execution** > **SQL Server** > **Advanced**.
4. Make sure that **Enable Transact-SQL Debugging** is selected.

### Prepare the script

Open the T-SQL script (for example, a stored procedure, function, or query) that you want to debug. You can also debug an existing stored procedure or script.

Example:

\`\`\`sql
CREATE PROCEDURE MyProcedure
AS
BEGIN
    DECLARE @counter INT = 0;
    -- GO
    WHILE @counter < 10
    BEGIN
        PRINT @counter;
        SET @counter = @counter + 1;
    END
END;
\`\`\`

### Set breakpoints

A breakpoint stops execution at a line, so that you can inspect variable values and the control flow.

1. In the **Query Editor**, find the line where you want a breakpoint.
2. Click in the **left margin** next to the line number. Or put the cursor on the line and press **F9**.

**Result:** A red circle shows the breakpoint.

### Start debugging

1. Select the **Debug** button (green play button with a bug icon) in the SSMS toolbar, or press **Alt + F5**. You can also right-click in the Query Editor and select **Debug**.

**Result:** SSMS executes the T-SQL code. Execution pauses at the first breakpoint.

### Step through the code and inspect values

When the debugger pauses at a breakpoint, use the keys in [Debugger commands](#debugger-commands) to control the execution. Use the windows in [Debugger windows](#debugger-windows) to inspect variables and the result set. You can also hover over a variable in the code to see its current value.

To debug a stored procedure, set breakpoints in the procedure body. Then use **Step Into** to go into the procedure when the code calls it.

### Manage breakpoints

Go to **Debug** > **Windows** > **Breakpoints**. In the **Breakpoints** window, you can enable, disable, or delete breakpoints.

### Stop debugging

Select the **Stop Debugging** button (red square in the toolbar), or press **Shift + F5**.

## Debug in SSDT for Visual Studio

### Install SSDT

If SSDT is not installed, install it from the Visual Studio Installer or download it from Microsoft.

1. Open the Visual Studio Installer.
2. Select **Modify** on your installed version of Visual Studio.
3. Under **Workloads**, select **Data storage and processing**.
4. Select **Modify** to install SSDT.

### Open the SQL project

1. Start Visual Studio.
2. Create or open an **SQL Server Database Project**. This project type usually contains T-SQL scripts, for example stored procedures and functions.

You can also open a single SQL file (with the \`.sql\` extension) that you want to debug.

### Configure the SQL Server connection

1. In the **Server Explorer** window, right-click **Data Connections** and select **Add Connection**.
2. Enter the connection details for the SQL Server instance that you want to debug against.
3. Make sure that you have permission to execute the scripts on this SQL Server instance.

### Set breakpoints

1. Open the T-SQL script (for example, a stored procedure or query) that you want to debug.
2. Click in the left margin next to the line where you want to pause execution. Or put the cursor on the line and press \`F9\`.

> **TIP:** You can set many breakpoints in different locations in your code.

### Set the target platform

If the project target platform is newer than your SQL Server version, deployment fails. Set the **Target Platform** to the correct version. See [Deploy72002 target platform error](#deploy72002-target-platform-error).

### Start debugging

1. Select **Debug** > **Start Debugging** in the top menu, or press \`Alt + F5\`. You can also select **Execute with Debugger** from the context menu.

**Result:** Visual Studio deploys the script to your SQL Server instance and attaches the debugger.

### Step through the code and inspect values

When the code stops at a breakpoint, use the keys in [Debugger commands](#debugger-commands). Use the windows in [Debugger windows](#debugger-windows) to inspect values.

If the code has an error or does not work as expected, use these windows:

- **Error List**: shows the error messages.
- **Output**: shows more detailed logs of the script execution.

### Stop debugging

Select **Debug** > **Stop Debugging**, or press \`Shift + F5\`.

## Debugger commands

| Command | Key | Action | Tool |
| --- | --- | --- | --- |
| Start debugging | \`Alt + F5\` | Starts the debugger. | SSMS, Visual Studio |
| Toggle breakpoint | \`F9\` | Sets a breakpoint on the line with the cursor. | SSMS, Visual Studio |
| Step Into | \`F11\` | Goes to the next line of code, or into a called stored procedure or function. | SSMS, Visual Studio |
| Step Over | \`F10\` | Goes to the next line in the current scope. If the line calls a procedure or function, the debugger executes it without going into it. | SSMS, Visual Studio |
| Step Out | \`Shift + F11\` | Goes out of the current procedure or batch and back to the calling code. | SSMS, Visual Studio |
| Run to Cursor | \`Ctrl + F10\` | Runs the script to the cursor location and skips the breakpoints between. | SSMS |
| Continue | \`Alt + F5\` | Continues execution until the next breakpoint or until the script ends. | SSMS, Visual Studio |
| Stop Debugging | \`Shift + F5\` | Stops the debug session. | SSMS, Visual Studio |

## Debugger windows

| Window | Use | How to open it in SSMS | Tool |
| --- | --- | --- | --- |
| Locals | Shows the current values of the local variables in the current scope. | **Debug** > **Windows** > **Locals** | SSMS, Visual Studio |
| Watch | Shows the values of the variables or expressions that you add. | **Debug** > **Windows** > **Watch** | SSMS, Visual Studio |
| Immediate | Executes T-SQL statements while you debug and shows the results immediately. In Visual Studio, you can also call functions or procedures manually. | Not given | SSMS, Visual Studio |
| Call Stack | Shows the call stack of the current execution thread, the sequence of calls to the current line. | Not given | Visual Studio |
| Breakpoints | Enables, disables, or deletes breakpoints. | **Debug** > **Windows** > **Breakpoints** | SSMS, Visual Studio |

> **NOTE:** Verify the Immediate window row. The Microsoft T-SQL debugger documentation lists the Locals, Watch, QuickWatch, Breakpoints, Call Stack, and Output windows. It does not say that the Immediate window can run T-SQL statements.

## Troubleshooting

### Deploy72002 target platform error

The deployment fails with this error:

\`\`\`text
Deploy72002: A project which specifies SQL Server 2022 or Azure SQL Database Managed Instance as the target platform cannot be published to SQL Server 2019
\`\`\`

1. Open the project properties.
2. Go to the **Project Settings** tab.
3. Set **Target Platform** to **SQL Server 2019** (or the version that you use).

## Related links

- [Transact-SQL debugger](https://learn.microsoft.com/en-us/sql/ssdt/debugger/transact-sql-debugger)
- [Run the Transact-SQL debugger](https://learn.microsoft.com/en-us/sql/ssdt/debugger/run-transact-sql-debugger?view=sql-server-ver17)
- [Install SQL Server Data Tools (SSDT) for Visual Studio](https://learn.microsoft.com/en-us/sql/ssdt/download-sql-server-data-tools-ssdt?view=sql-server-ver17&tabs=vs2022)
`;export{e as default};