var e=`---
title: C# settings validator
summary: A C# class that uses reflection to check if any property of a settings object is null or empty.
category: C# and .NET
order: 60
---

# C# settings validator

\`SettingsValidations\` checks a settings object before the application uses it. Use \`IsAnySettingsNullOrEmpty\` to find out if a setting is missing.

## Code

\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace SettingsValidator
{
    public class SettingsValidations
    {
        // Validates if the passed parameter's child nodes are null or empty
        public bool IsAnySettingsNullOrEmpty(object obj)
        {
            foreach (PropertyInfo pi in obj.GetType().GetProperties())
            {
                try
                {
                    string value = pi.GetValue(obj).ToString();
                    if (string.IsNullOrEmpty(value.ToString()))
                    {
                        return true;
                    }
                }
                catch 
                {
                    return true;
                }
            }
            return false;
        }
        
        // Returns the passed value. The return statement cannot throw, so this does not validate the data type.
        public static T ResultHandler<T>(T value)
        {
            try 
            { 
                return value; 
            } 
            catch 
            { 
                return default;
            }
        }
    }
}
\`\`\`

## How to use it

\`\`\`csharp
var validator = new SettingsValidations();

if (validator.IsAnySettingsNullOrEmpty(appSettings))
{
    throw new InvalidOperationException("One or more settings are missing.");
}
\`\`\`

## How it works

- \`IsAnySettingsNullOrEmpty\` reads each public property with reflection and converts the value to a string.
- The method returns \`true\` at the first empty string. If a value is \`null\`, \`ToString()\` throws an exception, and the \`catch\` block also returns \`true\`.
- The method checks only the properties of the object itself, not the properties of nested objects.
- \`ResultHandler<T>\` returns the value that you give it. The \`return value;\` statement cannot throw an exception, so the method does not validate the data type.
`;export{e as default};