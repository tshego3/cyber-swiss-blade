var e=`---
title: Validate SQL statements against injection in X++
summary: An X++ method that accepts only stored procedure calls without dangerous keywords, with a SQL test setup and 15 test cases.
category: Dynamics 365
order: 120
---

# Validate SQL statements against injection in X++

This D365 X++ class checks a SQL statement before you run a stored procedure with direct SQL. It returns \`true\` only if the statement is safe. It blocks [SQL injection](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/query-with-parameters) and commands such as update and delete.

> **IMPORTANT:** The recommended approach is [parameterized queries](https://stackoverflow.com/questions/14376473/what-are-good-ways-to-prevent-sql-injection). Use this check as an extra layer.

## Before you start

Run this script in the database to create the test table and the test stored procedures:

\`\`\`sql
DROP PROCEDURE IF EXISTS sp_TM_Test_MyProcCreateReport, sp_TM_Test_MyProc; DROP TABLE IF EXISTS TM_Test_Table;
CREATE TABLE TM_Test_Table (col NVARCHAR(100)); INSERT INTO TM_Test_Table VALUES ('dummy1'), ('dummy2'), ('dummy3');
GO
CREATE PROCEDURE sp_TM_Test_MyProc @param NVARCHAR(50) = 'dummy1' AS BEGIN SELECT T.* FROM (SELECT TOP 1 * FROM TM_Test_Table WHERE col = @param FOR JSON PATH) AS T(RESULT); END;
GO
CREATE PROCEDURE sp_TM_Test_MyProcCreateReport AS BEGIN SELECT T.* FROM (SELECT COUNT(*) AS TotalRows, MAX(col) AS MaxValue FROM TM_Test_Table FOR JSON PATH) AS T(RESULT); END;
\`\`\`

## Code

\`\`\`xpp
class TestSqlInjection
{
    public static boolean isSqlStatementSafe(str sqlStatement)
    {
        // Normalize input
        List list;
        ListIterator listIterator;

        sqlStatement = sqlStatement ? sqlStatement : "";
        sqlStatement = strLwr(sqlStatement);

        // Mandatory whitelist: only allow stored-proc execution
        if (!strStartsWith(sqlStatement, "exec "))
        {
            return false;
        }

        // Blacklist of dangerous tokens
        list = new List(Types::String);
        list.addEnd("create ");
        list.addEnd("update ");
        list.addEnd("delete ");
        list.addEnd("insert ");
        list.addEnd("drop ");
        list.addEnd("alter ");
        list.addEnd("truncate ");
        list.addEnd("--");
        list.addEnd("/*");
        list.addEnd("*/");
        // forbiddenTokens.addEnd(";");
        // forbiddenTokens.addEnd("xp_");
        // forbiddenTokens.addEnd("sp_executesql");

        // Scan for each forbidden token
        listIterator = new ListIterator(list);
        while (listIterator.more())
        {
            if (strScan(sqlStatement, listIterator.value(), 0, strLen(sqlStatement)) > 0)
            {
                return false;
            }
            listIterator.next();
        }

        return true;
    }

    public static void testSqlInjection(str testName, str sql, boolean expected)
    {
        boolean actual = TestSqlInjection::isSqlStatementSafe(sql);

        if (actual == expected)
        {
            info(strFmt('%1: PASS   | SQL=\`%2\`', testName, sql));
        }
        else
        {
            error(strFmt('%1: FAIL   | SQL=\`%2\` | expected=%3 got=%4', testName, sql, expected, actual));
        }
    }

    public static void runSqlInjectionTest()
    {
        TestSqlInjection::testSqlInjection('1. Valid stored proc', "EXEC sp_TM_Test_MyProc @Param=N'dummy1'", true);
        TestSqlInjection::testSqlInjection('2. Lowercase exec', 'exec sp_TM_Test_MyProc', true);
        TestSqlInjection::testSqlInjection('3. Safe "create" in proc name', 'EXEC sp_TM_Test_MyProcCreateReport', true);
        TestSqlInjection::testSqlInjection('4. Missing exec prefix', 'sp_TM_Test_MyProc', false);
        TestSqlInjection::testSqlInjection('5. Plain SELECT', 'select * from TM_Test_Table', false);
        TestSqlInjection::testSqlInjection('6. Inline comment attack', 'EXEC sp_TM_Test_MyProc -- drop TM_Test_Table', false);
        TestSqlInjection::testSqlInjection('7. Block comment attack', 'EXEC sp_TM_Test_MyProc /* malicious */', false);
        TestSqlInjection::testSqlInjection('8. DML keyword in body: UPDATE', "EXEC sp_TM_Test_MyProc update TM_Test_Table set Col=N'InjectionTest'", false);
        TestSqlInjection::testSqlInjection('9. DML keyword in body: DELETE', 'EXEC sp_TM_Test_MyProc delete from TM_Test_Table', false);
        TestSqlInjection::testSqlInjection('10. TRUNCATE in body', 'EXEC sp_TM_Test_MyProc truncate table TM_Test_Table', false);
        TestSqlInjection::testSqlInjection('11. DROP in body', 'EXEC sp_TM_Test_MyProc drop table TM_Test_Table', false);
        TestSqlInjection::testSqlInjection('12. ALTER in body', 'EXEC sp_TM_Test_MyProc alter table TM_Test_Table add Col bit', false);
        TestSqlInjection::testSqlInjection('13. Empty string', '', false);
        TestSqlInjection::testSqlInjection('14. Whitespace only', '    ', false);
        TestSqlInjection::testSqlInjection('15. Semicolon attack (disabled)', 'EXEC sp_TM_Test_MyProc; DROP TABLE TM_Test_Table', false);
    }

    public static void main(Args _args)
    {
        TestSqlInjection::runSqlInjectionTest();
    }
}
\`\`\`

## How to use it

1. Call \`TestSqlInjection::isSqlStatementSafe(sqlStatement)\` before you run the statement with direct SQL.
2. If the method returns \`false\`, do not run the statement.
3. To run the tests, run the class. \`main\` calls \`runSqlInjectionTest\`, which shows \`PASS\` or \`FAIL\` in the Infolog for each case.

## How it works

- The method changes the statement to lowercase. An empty statement becomes \`""\`.
- **Allow list:** The statement must start with \`exec \`. All other statements fail.
- **Block list:** The statement must not contain \`create \`, \`update \`, \`delete \`, \`insert \`, \`drop \`, \`alter \`, \`truncate \`, \`--\`, \`/*\`, or \`*/\`. The tokens end with a space. Thus, a procedure name such as \`sp_TM_Test_MyProcCreateReport\` passes (test 3).
- The tokens \`;\`, \`xp_\`, and \`sp_executesql\` are in comments. To block them, uncomment the lines and change \`forbiddenTokens\` to \`list\`.

## Related links

- [Mitigate a SQL injection attack](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/query-with-parameters)
- [What are good ways to prevent SQL injection?](https://stackoverflow.com/questions/14376473/what-are-good-ways-to-prevent-sql-injection)
- [D365 F&O and AX X++ code snippets](doc:d365-fo-xpp-code-snippets)
- [D365 F&O development processes](doc:d365-fo-development-processes)
`;export{e as default};