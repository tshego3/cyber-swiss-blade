var e=`---
title: Generate a blank SQL SELECT from C# class properties
summary: A C# method that uses reflection to make a SQL SELECT with a blank default value for each public property of a class.
category: C# and .NET
order: 50
---

# Generate a blank SQL SELECT from C# class properties

\`GenerateBlankSelect<T>\` makes a SQL \`SELECT\` statement with one column for each public property of a class. Each column has a blank default value. Use it to make a placeholder row, for example for a \`UNION\` or for test data with the same columns as a model.

## Code

\`\`\`csharp
using System;
using System.Linq;
using System.Reflection;

public class Program
{
    public static void Main()
    {
        var sql = GenerateBlankSelect<TestClass>();
        Console.WriteLine(sql);
    }

    public static string GenerateBlankSelect<T>()
    {
        var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        var selectColumns = properties.Select(prop =>
        {
            var type = prop.PropertyType;
            string blankValue;

            if (type == typeof(string))
                blankValue = "''";
            else if (type == typeof(int))
                blankValue = "0";
            else if (type == typeof(Nullable<int>))
                blankValue = "0";
            else if (type == typeof(long))
                blankValue = "0";
            else if (type == typeof(Nullable<long>))
                blankValue = "0";
            else if (type == typeof(decimal))
                blankValue = "0";
            else if (type == typeof(Nullable<decimal>))
                blankValue = "0";
            else if (type == typeof(double))
                blankValue = "0";
            else if (type == typeof(short))
                blankValue = "0";
            else if (type == typeof(DateTime))
                blankValue = "GETDATE()";
            else if (type == typeof(Nullable<System.DateTime>))
                blankValue = "GETDATE()";
            else if (type == typeof(Nullable<bool>))
                blankValue = "0";
            else
                blankValue = "''"; // Fallback for other types
          
            if (prop.Name == "PropFour" || prop.Name == "PropFive")
            {
                blankValue = "'In progress'";
            }

            return $"{blankValue} AS {prop.Name}";
        });

        return $"SELECT {string.Join(",", selectColumns)}";
    }
}

public class TestClass 
{
    public string PropOne { get; set;
    }
    public int PropTwo { get; set;
    }
    public DateTime PropThree { get; set;
    }
}
\`\`\`

## How to use it

Call the method with your class as the type argument:

\`\`\`csharp
string sql = GenerateBlankSelect<TestClass>();
\`\`\`

For \`TestClass\`, the method returns:

\`\`\`sql
SELECT '' AS PropOne,0 AS PropTwo,GETDATE() AS PropThree
\`\`\`

## How it works

| Property type | Blank value |
| --- | --- |
| \`string\` | \`''\` |
| \`int\`, \`long\`, \`short\`, \`decimal\`, \`double\`, and nullable \`int\`, \`long\`, \`decimal\`, and \`bool\` | \`0\` |
| \`DateTime\` and nullable \`DateTime\` | \`GETDATE()\` (SQL Server) |
| All other types (for example \`bool\`) | \`''\` |

- The properties named \`PropFour\` and \`PropFive\` always get \`'In progress'\`. Change these names to the status columns of your class.
`;export{e as default};