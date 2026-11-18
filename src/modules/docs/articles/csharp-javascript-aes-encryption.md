---
title: AES encryption in C# compatible with JavaScript
summary: Encrypt and decrypt a string with AES in C#, with a key and IV derived from a passphrase, and decrypt a value that JavaScript encrypted.
category: C# and .NET
order: 100
gist: 455f3a9fd6ee1d2cb77006ebae984af2
---

# AES encryption in C# compatible with JavaScript

This C# program encrypts and decrypts a string with AES. It derives the key and the initialization vector (IV) from a secret key and a secret IV string. It also decrypts a Base64 value that a JavaScript client encrypted with the same secrets.

## Code

```csharp
using System;
using System.Text;
using System.IO;
using System.Security.Cryptography;

public class Program
{
    public static void Main()
    {
        string original = "hello";

        // Encrypt and decrypt the string, then decrypt a value that JavaScript encrypted.
        Console.WriteLine("Original:   {0}", original);
        Console.WriteLine("encryptedString:   {0}", Convert.ToBase64String(EncryptStringToBytes_Aes(original)));
        Console.WriteLine("decryptedString: {0}", DecryptStringFromBytes_Aes(EncryptStringToBytes_Aes(original)));
        Console.WriteLine("jsDecryptedString: {0}", DecryptStringFromBytes_Aes(Convert.FromBase64String("gwSCI8Qf74fe9egoncfZSg==")));
    }
    
    static byte[] EncryptStringToBytes_Aes(string plainText)
    {
        string secretKey = "Example Secret Key";
        string secretIV = "Example IV";
        
        // Check arguments.
        if (plainText == null || plainText.Length <= 0)
            throw new ArgumentNullException("plainText");
        byte[] encrypted;

        // Create an Aes object
        // with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            var pdb = new Rfc2898DeriveBytes(secretKey, Encoding.ASCII.GetBytes(secretIV));
            aesAlg.Key = pdb.GetBytes(32);
            aesAlg.IV = pdb.GetBytes(16);

            // Create an encryptor to perform the stream transform.
            ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

            // Create the streams used for encryption.
            using (MemoryStream msEncrypt = new MemoryStream())
            {
                using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                {
                    using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                    {
                        //Write all data to the stream.
                        swEncrypt.Write(plainText);
                    }
                    encrypted = msEncrypt.ToArray();
                }
            }
        }

        // Return the encrypted bytes from the memory stream.
        return encrypted;
    }

    static string DecryptStringFromBytes_Aes(byte[] cipherText)
    {
        string secretKey = "Example Secret Key";
        string secretIV = "Example IV";
        
        // Check arguments.
        if (cipherText == null || cipherText.Length <= 0)
            throw new ArgumentNullException("cipherText");

        // Declare the string used to hold
        // the decrypted text.
        string plaintext = null;

        // Create an Aes object
        // with the specified key and IV.
        using (Aes aesAlg = Aes.Create())
        {
            var pdb = new Rfc2898DeriveBytes(secretKey, Encoding.ASCII.GetBytes(secretIV));
            aesAlg.Key = pdb.GetBytes(32);
            aesAlg.IV = pdb.GetBytes(16);

            // Create a decryptor to perform the stream transform.
            ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

            // Create the streams used for decryption.
            using (MemoryStream msDecrypt = new MemoryStream(cipherText))
            {
                using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                {
                    using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                    {

                        // Read the decrypted bytes from the decrypting stream
                        // and place them in a string.
                        plaintext = srDecrypt.ReadToEnd();
                    }
                }
            }
        }

        return plaintext;
    }
}
```

## How to use it

Replace `"Example Secret Key"` and `"Example IV"` with your secrets in both methods. Use the same values in the JavaScript client.

Encrypt a string and send it as Base64:

```csharp
string cipher = Convert.ToBase64String(EncryptStringToBytes_Aes("hello"));
```

Decrypt a Base64 value from the JavaScript client:

```csharp
string plain = DecryptStringFromBytes_Aes(Convert.FromBase64String("gwSCI8Qf74fe9egoncfZSg=="));
```

## How it works

- `Rfc2898DeriveBytes` (PBKDF2) derives the bytes from the secret key, with the ASCII bytes of the secret IV string as the salt.
- The first 32 bytes become the AES key (AES-256). The next 16 bytes become the IV.
- Each method makes a new `Rfc2898DeriveBytes` object, so encryption and decryption get the same key and IV.
- `Aes.Create()` uses its default settings: CBC mode and PKCS7 padding.
- The constructor that the code uses applies the default PBKDF2 settings of .NET: 1000 iterations and HMAC-SHA1. The JavaScript client must use the same settings, the same key and IV order, CBC mode, and PKCS7 padding.

> **NOTE:** Dated (checked November 2026): The `Rfc2898DeriveBytes` constructors without an iteration count and a hash algorithm are obsolete in .NET 7 and later (warning SYSLIB0041). Use `Rfc2898DeriveBytes.Pbkdf2` with 1000 iterations and `HashAlgorithmName.SHA1` to stay compatible with existing JavaScript data. For new data, use more iterations and SHA-256 on both sides.

> **WARNING:** The secrets are hard-coded and the salt is fixed. Keep real secrets out of source code.

## Related links

- [AES encryption in AX 2012, D365, and C#](doc:d365-fo-aes-encryption)
