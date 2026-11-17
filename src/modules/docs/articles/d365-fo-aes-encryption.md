---
title: AES encryption in AX 2012, D365, and C#
summary: Encrypt and decrypt a string with AES in AX 2012 X++, D365 X++, and C# with the same key padding and a zero initialization vector.
category: Dynamics 365
order: 110
gist: 4143abbf2ae6a49f115d90ace5f76ecb
---

# AES encryption in AX 2012, D365, and C#

This article compares the same AES encryption in AX 2012, D365 Finance and Operations, and C# (.NET Core 3.1). All three versions use the same logic: **the AES algorithm, a 16-byte key (padded), and a zero-byte initialization vector (IV)**. Thus, a value that one version encrypts, another version can decrypt.

## AX 2012 X++ (direct .NET interop)

In AX 2012, use `set_PropertyName()` for .NET interop properties. You must assert `InteropPermission`.

> **NOTE:** Dated (checked November 2026): Microsoft ended extended support for Dynamics AX 2012 R3 on 10 January 2023. Use the D365 version for current work.

```xpp
static void CryptoAX2012(Args _args)
{
    str                                     myKey = "Red flower"; 
    str                                     txt   = "Secret", enc, ret;
    System.Security.Cryptography.Aes        aes   = System.Security.Cryptography.Aes::Create();
    System.Text.Encoding                    utf8  = System.Text.Encoding::get_UTF8();
    System.Byte[]                           k, iv = new System.Byte[16](), input, output;
    System.Security.Cryptography.ICryptoTransform xform;

    new InteropPermission(InteropKind::ClrInterop).assert();

    myKey = strLFix(myKey, 16, " "); // Ensure 16-byte key
    k     = utf8.GetBytes(myKey);

    aes.set_Key(k);
    aes.set_IV(iv);
    
    // Encrypt
    xform  = aes.CreateEncryptor();
    input  = utf8.GetBytes(txt);
    output = xform.TransformFinalBlock(input, 0, input.get_Length());
    enc    = System.Convert::ToBase64String(output);
    
    // Decrypt
    xform  = aes.CreateDecryptor();
    input  = System.Convert::FromBase64String(enc);
    output = xform.TransformFinalBlock(input, 0, input.get_Length());
    ret    = utf8.GetString(output);

    info(strFmt("Enc: %1 | Dec: %2", enc, ret));
    CodeAccessPermission::revertAssert();
}
```

## D365 X++ (modern interop)

In D365, `InteropPermission` is obsolete because all code runs in a managed environment. Use dot notation for properties.

```xpp
internal final class CryptoD365
{
    public static void main(Args _args)
    {
        str                                     myKey = "Red flower";
        str                                     txt   = "Secret", enc, ret;
        System.Security.Cryptography.Aes        aes   = System.Security.Cryptography.Aes::Create();
        System.Text.Encoding                    utf8  = System.Text.Encoding::UTF8;
        System.Byte[]                           k, iv = new System.Byte[16](), input, output;
        System.Security.Cryptography.ICryptoTransform xform;

        myKey = strLFix(myKey, 16, " ");
        k     = utf8.GetBytes(myKey);

        aes.Key = k;
        aes.IV  = iv;

        // Encrypt
        xform  = aes.CreateEncryptor();
        input  = utf8.GetBytes(txt);
        output = xform.TransformFinalBlock(input, 0, input.Length);
        enc    = System.Convert::ToBase64String(output);

        // Decrypt
        xform  = aes.CreateDecryptor();
        input  = System.Convert::FromBase64String(enc);
        output = xform.TransformFinalBlock(input, 0, input.Length);
        ret    = utf8.GetString(output);

        info(strFmt("Enc: %1 | Dec: %2", enc, ret));
    }
}
```

## C# (.NET Core 3.1)

The C# version uses the same byte-level logic. The `using` statements dispose of the cryptographic resources correctly.

> **NOTE:** Dated (checked November 2026): .NET Core 3.1 reached end of support on 13 December 2022. Use a supported .NET version (.NET 8 or later). The code runs without changes.

```csharp
using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    public static void Main(string[] args)
    {
        string myKey = "Red flower".PadRight(16).Substring(0, 16); // Padding logic
        string txt = "Secret";

        string enc = Crypt(txt, myKey, true);
        string dec = Crypt(enc, myKey, false);

        Console.WriteLine($"Enc: {enc}\nDec: {dec}");
    }

    static string Crypt(string input, string key, bool encrypt)
    {
        using Aes aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(key);
        aes.IV = new byte[16];

        using var xform = encrypt ? aes.CreateEncryptor() : aes.CreateDecryptor();
        byte[] buffer = encrypt ? Encoding.UTF8.GetBytes(input) : Convert.FromBase64String(input);
        byte[] output = xform.TransformFinalBlock(buffer, 0, buffer.Length);

        return encrypt ? Convert.ToBase64String(output) : Encoding.UTF8.GetString(output);
    }
}
```

## Implementation differences

| Feature | AX 2012 / D365 | C# (.NET 3.1) |
| --- | --- | --- |
| **Property access** | `aes.set_Key(k)` (AX) / `aes.Key` (D365) | `aes.Key = ...` |
| **Key padding** | `strLFix(key, 16, " ")` | `key.PadRight(16).Substring(0, 16)` |
| **Array initialization** | `new System.Byte[16]()` | `new byte[16]` |
| **Transform** | `TransformFinalBlock` | `TransformFinalBlock` |

## Related links

- [C# and JavaScript AES encryption](doc:csharp-javascript-aes-encryption)
- [D365 F&O and AX X++ code snippets](doc:d365-fo-xpp-code-snippets)
- [D365 F&O development processes](doc:d365-fo-development-processes)
