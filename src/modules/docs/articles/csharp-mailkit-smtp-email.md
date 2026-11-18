---
title: Send SMTP email with MailKit in C#
summary: Send email with MailKit, read POP3 and IMAP mailboxes with OAuth 2.0 in C# and AX 2012 X++, and add NuGet packages manually.
category: C# and .NET
order: 90
---

# Send SMTP email with MailKit in C#

This article shows how to send email over SMTP with MailKit and MimeKit in a .NET Framework 4.7.2 application. It also shows how to read a mailbox over POP3 and IMAP with an OAuth 2.0 token, from C# and from X++ in AX 2012.

## Before you start

| Requirement | Notes |
| --- | --- |
| [MailKit](https://www.nuget.org/packages/MailKit) | NuGet package for SMTP, POP3, and IMAP |
| [MimeKit](https://www.nuget.org/packages/MimeKit) | NuGet package for MIME messages |
| `Newtonsoft.Json` | Reads the token response |
| .NET Framework 4.7.2 | The C# sample targets this version. |
| Tenant ID, client ID, and client secret | For the OAuth 2.0 token request to `login.microsoftonline.com` |
| A shared mailbox with POP3 or IMAP enabled on Microsoft Exchange | For the POP3 and IMAP samples |

## Send and read email in C#

The `Main` method calls `SendMessage`. To read a mailbox, remove the comment from `RetrieveMessagesViaPop3()` or `RetrieveMessagesIMAP()`.

- `SendMessage` connects to the SMTP server with the default port and no authentication. The commented lines show how to connect on port 587 with `StartTls`, how to authenticate, and how to skip the certificate checks.
- `GetAccessToken` gets an OAuth 2.0 token with the `password` grant type and the `IMAP.AccessAsUser.All` and `POP.AccessAsUser.All` scopes. Fill in `tenantId`, `clientId`, and `clientSecret`.
- POP3 connects on port 995 and IMAP connects on port 993, both with SSL.
- The POP3 and IMAP methods authenticate with `SaslMechanismOAuth2` and write the subjects of the first 10 messages.

> **NOTE:** Dated (checked November 2026): Microsoft does not recommend the resource owner password credentials (`password`) grant, and it fails for accounts with multifactor authentication. For a mailbox without a user, use the client credentials grant with the `https://outlook.office365.com/.default` scope and the `IMAP.AccessAsApp` or `POP.AccessAsApp` application permission. For a user, use an interactive flow with MSAL.

```csharp
using MailKit;
using MailKit.Net.Imap;
using MailKit.Net.Pop3;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System;
using System.Diagnostics;

namespace TestMailboxClient {
    public class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                SendMessage();
                // RetrieveMessagesViaPop3();
                // RetrieveMessagesIMAP();
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }

        private static string GetAccessToken(string username, string password)
        {
            try
            {
                string tenantId = "";
                string clientId = "";
                string clientSecret = "";
                string scope = "email openid offline_access https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/POP.AccessAsUser.All";
                string tokenEndpoint = string.Format("https://login.microsoftonline.com/{0}/oauth2/v2.0/token", tenantId);

                using (System.Net.WebClient client = new System.Net.WebClient())
                {
                    System.Collections.Specialized.NameValueCollection values = new System.Collections.Specialized.NameValueCollection();
                    values["username"] = username;
                    values["password"] = password;
                    values["client_id"] = clientId;
                    values["scope"] = scope;
                    values["client_secret"] = clientSecret;
                    values["grant_type"] = "password";

                    byte[] response = client.UploadValues(tokenEndpoint, "POST", values);
                    string responseText = System.Text.Encoding.UTF8.GetString(response);

                    Newtonsoft.Json.Linq.JObject json = Newtonsoft.Json.Linq.JObject.Parse(responseText);
                    return json["access_token"].ToString();
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                return string.Empty;
            }
        }

        private static void SendMessage()
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("Support", "info@support.com"));
                message.To.Add(new MailboxAddress("Test Mail", "testmail@contoso.co.za"));
                message.Subject = "Test Mail";
                message.Body = new TextPart("plain") { Text = @"Hi, This is a Test. Kind regards, Test App" };

                using (var client = new SmtpClient())
                {
                    //client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                    //client.CheckCertificateRevocation = false;
                    //client.Connect("mailserver.contoso.co.za", 587, MailKit.Security.SecureSocketOptions.StartTls);
                    client.Connect("mailserver.contoso.co.za");
                    //client.Authenticate("info@support.com", "PWD");

                    Debug.WriteLine(client.Send(message));
                    client.Disconnect(true);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }

        private static void RetrieveMessagesViaPop3()
        {
            try
            {
                using (var client = new Pop3Client())
                {
                    //client.Connect("webmail.contoso.co.za", 995, false);
                    //client.Authenticate("testmail@contoso.co.za", "PWS");

                    string accessToken = GetAccessToken("testmail@contoso.co.za", "PWS"); // Make sure this is a shared mailbox and that POP3 is enabled on MS Exchange.
                    client.Connect("outlook.office365.com", 995, true);
                    SaslMechanismOAuth2 oauth2 = new SaslMechanismOAuth2("testmail@contoso.co.za", accessToken);
                    client.Authenticate(oauth2);

                    for (int i = 0; i < 10; i++)
                    {
                        var message = client.GetMessage(i);
                        Debug.WriteLine(string.Format("Subject: {0}", message.Subject));
                    }

                    client.Disconnect(true);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }

        private static void RetrieveMessagesIMAP()
        {
            try
            {
                using (var client = new ImapClient())
                {
                    //client.Connect("webmail.contoso.co.za", 993, false);
                    //client.Authenticate("testmail@contoso.co.za", "PWS");

                    string accessToken = GetAccessToken("testmail@contoso.co.za", "PWS"); // Make sure this is a shared mailbox and that IMAP is enabled on MS Exchange.
                    client.Connect("outlook.office.com", 993, true);
                    SaslMechanismOAuth2 oauth2 = new SaslMechanismOAuth2("testmail@contoso.co.za", accessToken);
                    client.Authenticate(oauth2);

                    var inbox = client.Inbox;
                    inbox.Open(FolderAccess.ReadOnly);

                    Debug.WriteLine("Total messages: {0}", inbox.Count);
                    Debug.WriteLine("Recent messages: {0}", inbox.Recent);

                    for (int i = 0; i < 10; i++)
                    {
                        var message = inbox.GetMessage(i);
                        Debug.WriteLine(string.Format("Subject: {0}", message.Subject));
                    }

                    client.Disconnect(true);
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }
    }
}
```

## Read email with X++ in AX 2012

> **NOTE:** Dated (checked November 2026): Extended support for Dynamics AX 2012 R3 ended on January 10, 2023. Dynamics 365 Finance and Operations is the replacement.

The X++ version calls MailKit through .NET interop (`CLRInterop`). It gets the same OAuth 2.0 token, connects to `outlook.office.com` on port 993 with TLS 1.2, and searches the inbox for all messages delivered after the minimum date.

- The sample authenticates with a `NetworkCredential` that holds the access token. The commented lines show the `SaslMechanismOAuth2` alternative.

> **NOTE:** Verify the authentication step. MailKit can use the token from a `NetworkCredential` as a password, which Exchange Online rejects. If the authentication fails, use the commented `SaslMechanismOAuth2` lines, as the C# version does.
- The message read in the loop is commented out. The code shows 3 options to load a message from its `UniqueId`.

```xpp
class TestMailboxClient
{
}

private static str getAccessToken(str username, str password)
{
    System.Net.WebClient                                  webClient;
    System.Collections.Specialized.NameValueCollection    values;
    System.Text.UTF8Encoding                              encoding;
    System.Byte[]                                         responseBytes;
    str                                                   responseText;
    Newtonsoft.Json.Linq.JObject                          json;
    System.Object                                         accessTokenObj;
    CLRObject                                             clrException;
    str                                                   tenantId     = "";
    str                                                   clientId     = "";
    str                                                   clientSecret = "";
    str                                                   scope        = "email openid offline_access https://outlook.office.com/IMAP.AccessAsUser.All";
    str                                                   tokenEndpoint;

    try
    {
        tokenEndpoint = strFmt(
            "https://login.microsoftonline.com/%1/oauth2/v2.0/token",
            tenantId
        );

        webClient = new System.Net.WebClient();
        values = new System.Collections.Specialized.NameValueCollection();
        values.Add("username",      username);
        values.Add("password",      password);
        values.Add("client_id",     clientId);
        values.Add("scope",         scope);
        values.Add("client_secret", clientSecret);
        values.Add("grant_type",    "password");

        responseBytes = webClient.UploadValues(tokenEndpoint, "POST", values);

        encoding = new System.Text.UTF8Encoding();
        responseText = encoding.GetString(responseBytes);

        json = Newtonsoft.Json.Linq.JObject::Parse(responseText);
        accessTokenObj = json.get_Item("access_token");
        return accessTokenObj.ToString();
    }
    catch (Exception::CLRError)
    {
        clrException = CLRInterop::getLastException();
        error(clrException.ToString());
        return "";
    }
}

private static void retrieveMessagesIMAP()
{
    MailKit.Net.Imap.ImapClient                 imapClient;
    MailKit.IMailFolder                         mailFolder;
    MailKit.Security.SaslMechanismOAuth2        oauth2;
    MimeKit.MimeMessage                         message;
    ClrObject                                   list;
    System.Collections.IEnumerator              listEnumerator;
    MailKit.UniqueId                            uniqueId;
    MailKit.Search.SearchQuery                  searchQuery;
    str                                         accessToken;
    CLRObject                                   clrException;
    System.Threading.CancellationToken          cancellationToken;
    System.IO.Stream                            mailStream;
    System.Uri                                  uri;
    System.Net.NetworkCredential                creds;
    System.DateTime                             dateTime;
    utcdatetime                                 utcDateTimeMin;
    int                                         i, totalMails;

    try
    {
        imapClient = new MailKit.Net.Imap.ImapClient();
        imapClient.set_SslProtocols(
            System.Security.Authentication.SslProtocols::Tls12
        );

        accessToken = TestMailboxClient::getAccessToken(
            "testmail@contoso.co.za",
            "PWS"
        );

        cancellationToken = new System.Threading.CancellationToken(false);
        imapClient.Connect("outlook.office.com", 993, true, cancellationToken);

        uri = new System.Uri("imap://outlook.office.com");
        creds = new System.Net.NetworkCredential("testmail@contoso.co.za", accessToken);
        imapClient.Authenticate(creds, cancellationToken);
        // oauth2 = new MailKit.Security.SaslMechanismOAuth2(uri, creds);
        // imapClient.Authenticate(oauth2, cancellationToken);

        mailFolder = imapClient.get_Inbox();
        mailFolder.Open(MailKit.FolderAccess::ReadOnly, cancellationToken);

        totalMails = mailFolder.get_Count();
        info(strFmt(
            "Total messages: %1",
            int2str(totalMails)
        ));

        utcDateTimeMin = DateTimeUtil::minValue();
        searchQuery = MailKit.Search.SearchQuery::DeliveredAfter(utcDateTimeMin);
        list = mailFolder.Search(searchQuery, cancellationToken);
        listEnumerator = list.GetEnumerator();

        while (listEnumerator.MoveNext())
        {
            try
            {
                uniqueId = listEnumerator.get_Current();

                // Option 1
                // mailStream = mailFolder.GetStream(
                //     uniqueId, 0, 
                //     2147483647, // System.Int32::get_MaxValue()
                //     cancellationToken, null
                // );
                // message = MimeKit.MimeMessage::Load(null, mailStream, false, cancellationToken);

                // Option 2
                // message = mailFolder.GetMessage(uniqueId, cancellationToken, null);
                // If a .NET type has more than one GetMessage(...) overload,
                    // GetMethod("GetMessage") fails because it can't pick between them.
                // Consider creating a C# class library wrapper that exposes a single,
                    // unambiguous method signature for GetMessage.
                // This wrapper can simplify interop and ensure predictable behavior when called from X++.

                // Option 3
                // message = System.Reflection.MethodBase::GetCurrentMethod().
                //     DeclaringType.GetMethod("GetMessage", 
                //     new Type[] 
                //     { 
                //         CLRInterop::getType("MailKit.UniqueId"),
                //         CLRInterop::getType("System.Threading.CancellationToken"),
                //         CLRInterop::getType("System.Threading.CancellationToken?")
                //     }).
                //     Invoke(mailFolder, new Object[] { uniqueId, cancellationToken, null });

                // info(message.get_Subject());
            }
            catch (Exception::CLRError)
            {
                clrException = CLRInterop::getLastException();
                error(clrException.ToString());
                continue;
            }
        }

        imapClient.Disconnect(true, cancellationToken);
    }
    catch (Exception::CLRError)
    {
        clrException = CLRInterop::getLastException();
        error(clrException.ToString());
    }
}

public static void main(Args _args)
{
    CLRObject                                   clrException;
    
    try
    {
        TestMailboxClient::retrieveMessagesIMAP();
    }
    catch (Exception::CLRError)
    {
        clrException = CLRInterop::getLastException();
        error(clrException.ToString());
    }
}
```

## Add a NuGet package manually in Visual Studio 2013

Use this procedure to add a downloaded NuGet package, for example `MimeKit.4.13.0.nupkg`, to a .NET Framework 4.7.2 project in Visual Studio 2013. You must add the package manually for 2 reasons:

- Visual Studio 2013 does not support NuGet v3 and later well.
- The project targets a newer .NET Framework version (4.7.2) than the versions that Visual Studio 2013 was designed for.

> **NOTE:** Dated (checked November 2026): Support for Visual Studio 2013 ended on April 9, 2024. Visual Studio 2022 supports NuGet v3 and `PackageReference`, and installs MimeKit and MailKit without these manual steps.

### Make sure that the package is compatible

Make sure that the package supports .NET Framework 4.7.2. `MimeKit.4.13.0.nupkg` supports it, as its official specifications show.

### Extract the package

A `.nupkg` file is a ZIP archive.

1. Change the name of `MimeKit.4.13.0.nupkg` to `MimeKit.4.13.0.zip`.
2. Extract it with a ZIP tool (for example 7-Zip or WinRAR).

**Result:** The extracted folder contains folders such as `lib\net472\`.

### Add the DLL reference

1. Open your .NET 4.7.2 project in Visual Studio 2013.
2. Right-click **References** and select **Add Reference...**.
3. Click **Browse** and go to `lib\net472\MimeKit.dll` in the extracted folder.
4. Add the DLL.

> **TIP:** If your code uses `BouncyCastle` or `MailKit`, add references to them too. The `.nuspec` file in the package lists the dependencies.

### Copy the dependencies

If the package needs more DLLs (for example `BouncyCastle.Crypto.dll` or `System.Buffers.dll`):

1. Copy them into the `bin` or `lib` folder of your project.
2. Add references to them, as in the previous procedure.

### Add binding redirects

If MimeKit or its dependencies use newer versions of common assemblies (for example `System.Buffers`), add binding redirects to `App.config` or `Web.config`:

> **NOTE:** Verify the `newVersion` values. They must be the assembly versions of the DLLs in your `bin` folder, which can be different from the NuGet package versions.

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <startup>
    <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.7.2"/>
  </startup>
  <runtime>
    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
      <!-- System.Memory -->
      <dependentAssembly>
        <assemblyIdentity name="System.Memory" publicKeyToken="cc7b13ffcd2ddd51" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-4.0.5.0" newVersion="4.0.5.0" />
      </dependentAssembly>
      <!-- System.Buffers -->
      <dependentAssembly>
        <assemblyIdentity name="System.Buffers" publicKeyToken="cc7b13ffcd2ddd51" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-4.0.5.0" newVersion="4.0.5.0" />
      </dependentAssembly>
      <!-- System.Runtime.CompilerServices.Unsafe -->
      <dependentAssembly>
        <assemblyIdentity name="System.Runtime.CompilerServices.Unsafe" publicKeyToken="b03f5f7f11d50a3a" culture="neutral" />
        <bindingRedirect oldVersion="0.0.0.0-6.0.0.0" newVersion="6.0.0.0" />
      </dependentAssembly>
    </assemblyBinding>
  </runtime>
</configuration>
```

### Set Copy Local

This step is optional. In the **Properties** window, set **Copy Local** to `True` for the referenced DLLs. Then the build copies them to the output directory.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `Install-Package` fails in Visual Studio 2013 | The NuGet client is old. It does not support v3 sources or newer `.nuspec` formats. | Add the package manually. Refer to [Add a NuGet package manually in Visual Studio 2013](#add-a-nuget-package-manually-in-visual-studio-2013). |
| `GetMethod("GetMessage")` fails in X++ | The .NET type has more than one `GetMessage(...)` overload, and interop cannot select one. | Make a C# class library wrapper with one clear `GetMessage` signature. The wrapper makes interop simpler and the behavior predictable from X++. |

You can try to install the package from a local folder in the Package Manager Console. This is not recommended for Visual Studio 2013:

```powershell
Install-Package MimeKit -Source "C:\Path\To\Folder\Containing\Package"
```

## Related links

- [MailKit on NuGet](https://www.nuget.org/packages/MailKit)
- [MimeKit on NuGet](https://www.nuget.org/packages/MimeKit)
- [CLRInterop.staticInvoke method](https://learn.microsoft.com/en-us/dotnet/api/microsoft.dynamics.ax.xpp.clrinterop.staticinvoke?view=dyn-finops-dotnet)
