---
title: D365 F&O and AX SQL queries
summary: T-SQL queries and templates for the D365 F&O and AX databases, including dictionary lookups, paging, functions, sync fixes, and SharingView.
category: Dynamics 365
order: 60
---

# D365 F&O and AX SQL queries

This article collects T-SQL queries for the D365 F&O and Dynamics AX databases. Use them to examine data, find metadata, and fix database synchronization errors.

> **TIP:** If a SQL function or procedure does not return the data that you expect, put the table join filters or the `WHERE` clauses in comments. Also try to change `INNER JOIN` to `LEFT OUTER JOIN`. This shows rows that do not have related data.

## Show object source and structure

```sql
-- Displays the SQL source code of a stored procedure, view, function, or trigger. [View SQL code]
EXEC sp_helptext 'object_name'
-- Displays object details such as columns, data types, indexes, and constraints. [View table structure]
EXEC sp_help 'object_name'
```

## Metadata lookups

### Get the table ID of a table

```sql
SELECT TOP 1 TABLEID, NAME 
FROM SQLDICTIONARY 
WHERE NAME = N'DIRPARTYTABLE' 
    AND FIELDID = 0; -- Ensures you're getting the record for the table itself, not its fields.
```

### Find a table name by table ID

This query finds a table name by `TABLEID` (`REFTABLEID`) in Dynamics AX. If the table does not exist, it returns empty JSON.

```sql
DECLARE @CURRENTTABLEID NVARCHAR(MAX) = N'<TABLEID>';
IF EXISTS (
    SELECT 1
    FROM dbo.SQLDICTIONARY
    WHERE TABLEID = @CURRENTTABLEID
        AND FIELDID = 0
)
BEGIN
    SELECT (
        SELECT [NAME]
        FROM dbo.SQLDICTIONARY
        WHERE TABLEID = @CURRENTTABLEID
            AND FIELDID = 0
        FOR JSON PATH
    ) AS RESULT;
END
ELSE
BEGIN
    SELECT (
        SELECT N'' AS [NAME]
        FOR JSON PATH
    ) AS RESULT;
END
```

### Get a class by name and ID

```sql
SELECT TOP 100 * FROM MODELELEMENT
WHERE ELEMENTTYPE = 45 /*45 CORRESPONDS TO CLASSES*/ 
AND NAME = 'CaseDetailForm' AND ELEMENTHANDLE = 157680;
```

### List system enum definitions and values

```sql
SELECT *
FROM [DBO].[ENUMIDTABLE] E
    INNER JOIN [DBO].[ENUMVALUETABLE] EV
        ON E.ID = EV.ENUMID
-- WHERE E.[NAME] = N'CaseCategoryType'
ORDER BY E.[NAME], EV.ENUMVALUE ASC;
```

## Query patterns

### Use an index hint

```sql
SELECT DPT.RecId ,DPT.PartyNumber ,CP.RecId ,CP.ContactPersonId ,CP.ContactForPARTY ,LEA.RecId ,LEA.[Locator] ,* 
FROM DirPartyTable AS DPT WITH(INDEX(I_2303RECID,I_2303PARTYNUMBERIDX))
LEFT OUTER JOIN LogisticsElectronicAddress AS LEA ON LEA.RecId = DPT.PrimaryContactEmail
LEFT OUTER JOIN ContactPerson AS CP ON CP.Party = DPT.RecId
WHERE LEA.[Locator] = N'Email' AND DPT.PartyNumber = N'0';
```

### Page results

The short form uses fixed values:

```sql
SELECT * FROM CASEDETAILBASE ORDER BY RECID OFFSET 1000 ROWS FETCH NEXT 1000 ROWS ONLY;
```

The long form calculates the offset from a page number and a page size:

```sql
DECLARE @PageNumber INT = 3;
DECLARE @PageSize INT = 50;
DECLARE @Offset INT;

SET @Offset = (@PageNumber - 1) * @PageSize;

SELECT
    RECID,
    ITEMID,
    NAME
FROM INVENTTABLE
ORDER BY RECID
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
```

### Split a comma-separated list with a cursor

```sql
DECLARE @CURRENTPOSITION NVARCHAR(MAX);
DECLARE @LISTTABLE TABLE (
    COLUMN1 NVARCHAR(MAX),
    COLUMN2 NVARCHAR(MAX),
    COLUMN3 NVARCHAR(MAX)
);
DECLARE LISTCURSOR CURSOR FOR
WITH [LIST] AS
(
	SELECT VALUE
	FROM STRING_SPLIT(N'INDEX1,INDEX2,INDEX3,INDEX4,INDEX5', N',')
)
SELECT [VALUE]
FROM [LIST];
OPEN LISTCURSOR;
FETCH NEXT FROM LISTCURSOR INTO @CURRENTPOSITION;
WHILE @@FETCH_STATUS = 0
	BEGIN
		BEGIN TRY
			INSERT INTO @LISTTABLE VALUES (@CURRENTPOSITION, N'COLUMN2', N'COLUMN3');
			-- INSERT INTO @LISTTABLE SELECT COLUMN1, COLUMN2, COLUMN3 FROM TABLE WHERE COLUMN1 = @CURRENTPOSITION AND COLUMN2 = N'1000';
			FETCH NEXT FROM LISTCURSOR INTO @CURRENTPOSITION;
		END TRY
		BEGIN CATCH
			PRINT CONCAT(N'ERROR NUMBER: ', ERROR_NUMBER(), N' ', N'CURRENT POSITION: ', @CURRENTPOSITION);
		END CATCH
	END;
CLOSE LISTCURSOR;
DEALLOCATE LISTCURSOR;
SELECT * FROM @LISTTABLE;
```

### IF, ELSE IF, and ELSE logic in a WHERE clause

SQL does not have `IF/ELSE` in a `WHERE` clause. Use `CASE`, or conditions with `OR` and `AND`. In this example, `@FilterType` can be `'Active'`, `'Inactive'`, or `'All'`:

```sql
SELECT AccountNum, Name, CustGroup
FROM CustTable
WHERE 
    (
        (@FilterType = 'Active' AND CustTable.Blocked = 0) OR
        (@FilterType = 'Inactive' AND CustTable.Blocked = 1) OR
        (@FilterType = 'All')
    );
```

### Switch on an enum value in a WHERE clause

The `CustVendorBlocked` enum values are 0 = NotBlocked, 1 = InvoiceBlocked, and 2 = AllBlocked.

SQL Server does not let `CASE` return a boolean condition in `WHERE`. Thus, this first version does not run:

```sql
SELECT AccountNum, Name, CustGroup
FROM CustTable
WHERE 
    CASE @BlockedStatus
        WHEN 0 THEN CustTable.CustVendorBlocked = 0
        WHEN 1 THEN CustTable.CustVendorBlocked = 1
        WHEN 2 THEN CustTable.CustVendorBlocked = 2
        ELSE 1 = 1 -- default: return all
    END;
```

Use `OR` logic (or dynamic SQL) instead:

```sql
WHERE 
    (
        (@BlockedStatus = 0 AND CustVendorBlocked = 0) OR
        (@BlockedStatus = 1 AND CustVendorBlocked = 1) OR
        (@BlockedStatus = 2 AND CustVendorBlocked = 2)
    );
```

### Query zip code records for a city

```sql
SELECT TOP (100) *
FROM [dbo].[LOGISTICSADDRESSZIPCODE]
WHERE [CITY] = N'Rooihuiskraal'
--WHERE [ZIPCODE] = N'0154' OR [ZIPCODE] = N'154'
--WHERE [ZIPCODE] = N'0157' OR [ZIPCODE] = N'157'
ORDER BY [CITY] DESC;
```

## Read-only functions

### Scalar function

This function returns the full name of a worker from `HcmWorker` by `PersonnelNumber`. Call it with `SELECT dbo.GetWorkerFullName('12345') AS FullName;`.

```sql
CREATE FUNCTION dbo.GetWorkerFullName
(
    @PersonnelNumber NVARCHAR(20)
)
RETURNS NVARCHAR(100)
AS
BEGIN
    DECLARE @FullName NVARCHAR(100)

    SELECT @FullName = FirstName + ' ' + LastName
    FROM DirPersonName as PN
    JOIN HcmWorker HW ON PN.PersonParty = HW.PersonParty
    WHERE HW.PersonnelNumber = @PersonnelNumber

    RETURN @FullName
END
GO
```

### Table-valued function

This function returns all active workers in a specific department. Call it with `SELECT Workers.PersonnelNumber, Workers.LastName FROM dbo.GetActiveWorkersByDepartment('Finance') AS Workers;`.

```sql
CREATE FUNCTION dbo.GetActiveWorkersByDepartment
(
    @DepartmentName NVARCHAR(100)
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        HW.PersonnelNumber,
        PN.FirstName,
        PN.LastName,
        OM.Name AS Department
    FROM HcmWorker HW
    JOIN DirPersonName PN ON HW.PersonParty = PN.PersonParty
    JOIN OMOperatingUnit OM ON HW.PrimaryDepartment = OM.RecId
    WHERE OM.Name = @DepartmentName
)
GO
```

## Delete duplicate records that block a unique index

If the database synchronization fails with SQL Exception Number 1505, duplicate records block a unique index. Use this template to delete them.

1. Get the table and the key columns from the failing `ALTER TABLE` or `CREATE INDEX` statement in the sync error.
2. Fill in the CONFIG block.
3. Run the script one time.
4. Run the database synchronization again.

```sql
/*  D365FO sync fix: delete the duplicate records blocking a unique index.
    Template: fill in the CONFIG block and run once.
    Source the table and key columns from the failing ALTER TABLE / CREATE
    INDEX statement in the sync error (SQL Exception Number - 1505).           */

/*--- CONFIG ---------------------------------------------------------------*/
DECLARE @Table   sysname       = 'LOGISTICSADDRESSZIPCODE',
        @KeyCols nvarchar(max) = 'PARTITION,ZIPCODE',  -- index keys
        @Keep    varchar(4)    = 'DESC';   -- DESC = keep newest RECID, ASC = oldest
/*-------------------------------------------------------------------------*/

DECLARE @cols nvarchar(max), @sql nvarchar(max);

-- CSV -> quoted column list
SELECT @cols = STUFF((SELECT ',' + QUOTENAME(LTRIM(RTRIM(n.value('.', 'sysname'))))
                      FROM (SELECT CAST('<c>' + REPLACE(@KeyCols, ',', '</c><c>')
                                        + '</c>' AS xml) AS x) q
                      CROSS APPLY q.x.nodes('/c') AS t(n)
                      FOR XML PATH('')), 1, 1, '');

SET @sql = N'
-- 1. What will go
SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY ' + @cols + N'
                            ORDER BY RECID ' + @Keep + N') AS rn
               FROM dbo.' + QUOTENAME(@Table) + N') d
WHERE rn > 1;

-- 2. Delete it
WITH d AS (SELECT ROW_NUMBER() OVER (PARTITION BY ' + @cols + N'
                      ORDER BY RECID ' + @Keep + N') AS rn
           FROM dbo.' + QUOTENAME(@Table) + N')
DELETE FROM d WHERE rn > 1;

-- 3. Must return no rows, then re-run the database synchronization
SELECT ' + @cols + N', COUNT(*) AS Cnt
FROM dbo.' + QUOTENAME(@Table) + N'
GROUP BY ' + @cols + N' HAVING COUNT(*) > 1;';

EXEC sys.sp_executesql @sql;
```

## SharingView and cross-company data sharing

A `SharingView` (for example `VENDTABLE_SharingView`) is a SQL view that the kernel generates. It enables **cross-company data sharing** for tables that store data per company but share the data logically across a group.

- **Creation:** The kernel generates the view when you activate a **Data Sharing Policy** (*System Admin > Setup > Configure Data Sharing*).
- **Target:** The kernel creates it for tables where the property **Save Data Per Company** is **Yes**.

### Data sharing types

When you configure the policy, you select how the `SharingView` handles the records:

| Sharing type | Technical behavior |
| --- | --- |
| **Duplicate** | The kernel copies the record (and its updates and deletes) to all companies in the sharing group. Each `DataAreaId` has its own physical row. |
| **Filtered** | (Rarely used) The kernel shares only the records that meet specific criteria. |

### The Save Data Per Company property

This table property in Visual Studio sets the basic architecture of the table:

- **Yes (default):** The table has a `DataAreaId` column. Records are private to a legal entity, **unless** a `SharingView` connects them.
- **No:** The table is **global** and has no `DataAreaId` (for example `DirPartyTable`). All companies see the data. The kernel **does not need or create a SharingView**.

### Query a SharingView

Standard tables show only the records for the `DataAreaId` of your session. To see the consolidated records across a sharing group, query the view:

```sql
-- Query the SharingView to see synchronized records across the sharing group
SELECT * FROM VENDTABLE_SharingView 
WHERE PARTITION = 5637144576 -- Mandatory for D365 multi-tenant architecture
```

> **WARNING:** Do not use SQL to `INSERT` into or `UPDATE` the SharingView. Use the D365 X++ API or the base table to keep the data integrity.

## Related links

- [Cross-company data sharing for developers](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/drs-srs-dev)
- [T-SQL debugger in SSMS and Visual Studio](doc:tsql-debugger-ssms-visual-studio)
- [Validate SQL statements against injection in X++](doc:d365-fo-sql-injection-validation)
- [D365 F&O development processes](doc:d365-fo-development-processes)
