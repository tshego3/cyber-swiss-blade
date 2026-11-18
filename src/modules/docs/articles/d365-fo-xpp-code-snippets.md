---
title: D365 F&O and AX X++ code snippets
summary: Reusable X++ samples for JSON, files, AOT resources, form refresh, display method caching, maps, companies, direct SQL, .NET interop, and TLS 1.2.
category: Dynamics 365
order: 70
---

# D365 F&O and AX X++ code snippets

This article collects short X++ samples for D365 F&O and AX 2012. Some samples also show the C# version. Copy a sample and change the names and values for your solution.

## Caesar cipher

These methods shift each character of a string by a number of positions. A positive shift encrypts and a negative shift decrypts. A value past the end of the character range (0 to 65535) wraps around to the other end.

### X++ version

```xpp
private static str str2Caesar(str _source, int64 _shift = 1)
{ 
    int maxChar = 65535;
    int minChar = 0;

    System.String _str   = _source;
    System.Char[] buffer = _str.ToCharArray();

    for (int i = 0; i < buffer.Length; i++)
    {
        int shifted = System.Convert::ToInt32(buffer.GetValue(i)) + _shift;

        if (shifted > maxChar)
        {
            shifted -= maxChar + 1;
        }
        else if (shifted < minChar)
        {
            shifted += maxChar + 1;
        }

        buffer.SetValue(System.Convert::ToChar(shifted), i);
    }

    str ret = new System.String(buffer);

    return ret;
}
```

### C# version

```csharp
private static string StringToCaesar(string source, Int16 shift = -1)
{
    var maxChar = Convert.ToInt32(char.MaxValue);
    var minChar = Convert.ToInt32(char.MinValue);

    var buffer = source.ToCharArray();

    for (var i = 0; i < buffer.Length; i++)
    {
        var shifted = Convert.ToInt32(buffer[i]) + shift;

        if (shifted > maxChar)
        {
            shifted -= maxChar + 1;
        }
        else if (shifted < minChar)
        {
            shifted += maxChar + 1;
        }

        buffer[i] = Convert.ToChar(shifted);
    }

    return new string(buffer);
}
```

## File extension list and validation

`getFileExtensionList` builds a list of file extensions from the `#File` and `#ModelFile` macros. It removes the leading dot from each extension.

```xpp
public List getFileExtensionList()
{
    #File
    #ModelFile
    
    ListEnumerator              enumContainers;
    container                   current;
    int                         i;
    str                         ext;
    
    List extensionList = new List(Types::String);
    container part1 = [#txt, #htm, #html, #rtf, #pdf, #dat, #def, #xpr, #xpo, #cfg, #log, #xml,
                       #config, #xsl, #asg, #chm, #ahd, #ald, #hlp, #dll, #exe, #msi, #sql, #awc];
    container part2 = [#wsdl, #xls, #prf, #tiff, #mhtml, #wordDocumentExt, #wordTemplateExt,
                       #excelDocumentExt, #excelTemplateExt, #xlsx, #csv, #etl, #ias, #rdf, #eml,
                       #xslt, #tmp, #zip, #docx, #dotx, #odt, #ppt, #pptx, #pptm, #pot, #potx];
    container part3 = [#odp, #xlsm, #ods, #odg, #jpg, #jpeg, #png, #gif, #bmp, #svg, #webp, #ico,
                       #psd, #ai, #eps, #tga, #mp3, #wav, #aac, #flac, #ogg, #m4a, #wma, #mid, #midi];
    container part4 = [#mp4, #avi, #mov, #wmv, #flv, #mkv, #webm, #mpg, #mpeg, #_3gp, #mts,
                       #7z, #rar, #tar, #gz, #bz2, #xz, #iso, #dmg, #vmdk, #vdi, #vhd];
    container part5 = [#js, #ts, #jsx, #tsx, #css, #scss, #less, #json, #jsonc, #yaml, #yml,
                       #md, #markdown, #php, #py, #rb, #java, #cs, #cpp, #c, #h, #go, #swift,
                       #sh, #bat, #ps1];
    container part6 = [#db, #sqlite, #sqlite3, #mdb, #accdb, #dbf, #ttf, #otf, #woff, #woff2, #eot,
                       #ini, #conf, #cnf, #properties, #lock, #cache, #pid, #crt, #pem, #cer, #key,
                       #pfx, #msg, #pst, #ost, #vcf, #ics, #rss, #atom, #apk, #deb, #rpm];

    List containers = new List(Types::Container);
    containers.addEnd(part1);
    containers.addEnd(part2);
    containers.addEnd(part3);
    containers.addEnd(part4);
    containers.addEnd(part5);
    containers.addEnd(part6);

    enumContainers = containers.getEnumerator();

    while (enumContainers.moveNext())
    {
        current = enumContainers.current();
        for (i = 1; i <= conLen(current); i++)
        {
            ext = conPeek(current, i);
            if (strStartsWith(ext, '.'))
            {
                ext = subStr(ext, 2, strLen(ext) - 1);
            }
            extensionList.addEnd(ext);
        }
    }

    return extensionList;
}
```

`isValidExtension` does a linear search of the list. The comparison ignores case.

```xpp
private boolean isValidExtension(str targetExt)
{
    List                extensionList   = this.getFileExtensionList();
    ListEnumerator      enumerator      = extensionList.getEnumerator();

    // Linear Search
    while (enumerator.moveNext())
    {
        if (strLwr(enumerator.current()) == strLwr(targetExt))
        {
            return true;
        }
    }

    return false;
}
```

## Get all AOT resources

These samples list the resources of a model. For background, read [Use D365FO metadata API in .NET](https://pedrotornich.com/a/2019/09/26/use-d365fo-metadata-api-in-net/) and [How to get AOT objects that belong to a model in AX7](https://stackoverflow.com/questions/45598166/how-to-get-aot-objects-tables-for-example-belongs-to-a-model-in-ax7) ([answer](https://stackoverflow.com/a/45712653)).

### C# console application

```csharp
// C#
    
// Required references:
// C:\AOSService\webroot\bin\Microsoft.Dynamics.ApplicationPlatform.Environment.dll
// C:\AOSService\webroot\bin\Microsoft.Dynamics.AX.Metadata.dll
// C:\AOSService\webroot\bin\Microsoft.Dynamics.AX.Metadata.Core.dll
// C:\AOSService\webroot\bin\Microsoft.Dynamics.AX.Metadata.Storage.dll
    
using Microsoft.Dynamics.AX.Metadata.Storage;
using Microsoft.Dynamics.AX.Metadata.Storage.Runtime;
using System;
using System.Diagnostics;

namespace ConsoleApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            try
            {
                var environment = Microsoft.Dynamics.ApplicationPlatform.Environment.EnvironmentFactory.GetApplicationEnvironment();
                var runtimeConfiguration = new RuntimeProviderConfiguration(environment.Aos.PackageDirectory);
                var metadataProvider = new MetadataProviderFactory().CreateRuntimeProviderWithExtensions(runtimeConfiguration);
                var aotResources = metadataProvider.Resources.ListObjectsForModel("ModelPrefix");
                foreach (var resource in aotResources)
                {
                    Debug.WriteLine(string.Concat("Resource Name: ", resource));
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

### X++ for AX 2012

```xpp
static void getAllAOTResources(Args _args)
{
    #AOT
    TreeNode                treeNode;
    TreeNode                resourcesNode;
    TreeNodeIterator        iterator;

    // resourcesNode        = TreeNode::findNode(@"\Resources");
    resourcesNode           = TreeNode::findNode(#ResourcesPath);
    iterator                = resourcesNode.AOTiterator();
    treeNode                = iterator.next();

    while (treeNode)
    {
        info(treeNode.AOTname());
        treeNode = iterator.next();
    }
}
```

### X++ for D365

This version also reads the content of the resources whose names start with one of three prefixes and whose file names end with a suffix. Replace `potentialStart1`, `potentialStart2`, `potentialStart3`, and `potentialEnd` with your values.

```xpp
public final class GetAllAOTResources
{
    public static void main(Args _args)
    {
        var environment                 = Microsoft.Dynamics.ApplicationPlatform.Environment.EnvironmentFactory::GetApplicationEnvironment();
        var runtimeConfiguration        = new Microsoft.Dynamics.AX.Metadata.Storage.Runtime.RuntimeProviderConfiguration(environment.get_Aos().get_PackageDirectory());
        var metadataProviderFactory     = new Microsoft.Dynamics.AX.Metadata.Storage.MetadataProviderFactory();
        var metadataProvider            = metadataProviderFactory.CreateRuntimeProvider(runtimeConfiguration);
        var aotResources                = metadataProvider.Resources.ListObjectsForModel("ModelPrefix");

        System.Collections.IEnumerator enumerator = aotResources.GetEnumerator();
        while (enumerator.MoveNext()) 
        { 
            str resourceName = enumerator.Current;

            if (strStartsWith(resourceName, "potentialStart1") || strStartsWith(resourceName, "potentialStart2") || strStartsWith(resourceName, "potentialStart3"))
            {
                ResourceNode        resourceNode        = SysResource::getResourceNode(resourceName);

                if(resourceNode && strEndsWith(resourceNode.filename(), "potentialEnd"))
                {
                    BinData         binData             = new BinData();
                    container       resourceNodeData    = SysResource::getResourceNodeData(resourceNode);

                    binData.setData(resourceNodeData);
                    str result = binData.getStrData();
                    info(result);
                }
            }
        }
    }
}
```

The C# version uses `CreateRuntimeProviderWithExtensions`. The D365 X++ version uses `CreateRuntimeProvider`.

## Construct and read JSON

This job shows three tasks with `Newtonsoft.Json`:

- Read a value from a nested JSON object.
- Loop through a JSON array and log the `Name` and `Model` of each item.
- Write a JSON object from a `Map` with `JsonTextWriter`, with a nested `Email` object.

```xpp
static void jsonConstructTutorial(Args _args)
{
    System.IO.StringWriter                              strWriter;
    Newtonsoft.Json.JsonTextWriter                      jsonWriter;
    System.Exception                                    exception;
    str                                                 jsonBody;
    Map                                                 jsonBodyMap;
    MapEnumerator                                       jsonBodyEnumer;
    str                                                 jsonBodyMapName;
    str                                                 jsonBodyMapValue;

    // JSON Array Deconstruct Tutorial - Begin
    int                                                 i, arrayLength;
    str                                                 txtName, txtModel;
    Newtonsoft.Json.Linq.JObject                        jObject;
    Newtonsoft.Json.Linq.JToken                         sName, sModel;
    // JSON Array Deconstruct Tutorial - End

    // JSON Array Deconstruct Tutorial - Begin
    str jsString = '[{"Name": "BMW", "Model": "325IS"}, {"Name": "VW", "Model": "City Golf"}]';
    Newtonsoft.Json.Linq.JArray jArry = Newtonsoft.Json.Linq.JArray::Parse(jsString);
    // JSON Array Deconstruct Tutorial - End

    // JSON Deconstruct Tutorial - Begin
    str jsonString = '{"Name": "Jack Moose", "Age": 30, "Cars": [{"Name": "BMW", "Model": "325IS"}, {"Name": "VW", "Model": "City Golf"}]}';
    Newtonsoft.Json.Linq.JObject jObjct = Newtonsoft.Json.Linq.JObject::Parse(jsonString);
    Newtonsoft.Json.Linq.JToken jToken = jObjct.get_Item('Cars');
    Newtonsoft.Json.Linq.JArray jArray = jToken as Newtonsoft.Json.Linq.JArray;
    Newtonsoft.Json.Linq.JObject subObjct = jArray.get_First();
    Newtonsoft.Json.Linq.JToken subName = subObjct.get_Item('Name');
    Newtonsoft.Json.Linq.JToken subModel = subObjct.get_Item('Model');
    info(subModel.ToString());
    // JSON Deconstruct Tutorial - End

    // JSON Array Deconstruct Tutorial - Begin
    // Loop through each item in the array and log the "Name" and "Model" elements
    arrayLength = jArry.get_Count();
    for (i = 0; i < arrayLength; i++)
    {
        jObject = jArry.get_Item(i);
        sName = jObject.get_Item('Name');
        sModel = jObject.get_Item('Model');
        txtName = sName.ToString();
        txtModel = sModel.ToString();
        info(strFmt("Name: %1 Model: %2", txtName, txtModel));
    }
    // JSON Array Deconstruct Tutorial - End

    // JSON Construct Tutorial
    try
    {
        strWriter       = new System.IO.StringWriter();
        jsonWriter      = new Newtonsoft.Json.JsonTextWriter(strWriter);
        jsonBody        = strMax();

        jsonBodyMap = new Map(Types::String, Types::String);
        jsonBodyMap.insert("ScopeEmail", "email");
        jsonBodyMap.insert("ScopeOpenId", "openid");
        jsonBodyMap.insert("ScopeOfflineAccess", "offline_access");
        jsonBodyMap.insert("ScopeImap", "https://outlook.office.com/IMAP.AccessAsUser.All");
        jsonBodyMap.insert("ScopeSmtp", "https://outlook.office.com/SMTP.Send");
        jsonBodyMap.insert("SmtpHost", "smtp.office365.com");
        jsonBodyMap.insert("SmtpPort", "");
        jsonBodyMap.insert("ImapHost", "outlook.office365.com");
        jsonBodyMap.insert("ImapPort", "993");
        jsonBodyMap.insert("TenantId", "");
        jsonBodyMap.insert("AppId", "");
        jsonBodyMap.insert("AppSecret", "");
        jsonBodyMap.insert("Username", "");
        jsonBodyMap.insert("Password", "");

        jsonWriter.WriteStartObject();

            jsonBodyEnumer = jsonBodyMap.getEnumerator();
            while (jsonBodyEnumer.moveNext())
            {
                jsonBodyMapName = jsonBodyEnumer.currentKey();
                jsonBodyMapValue = jsonBodyEnumer.currentValue();

                jsonWriter.WritePropertyName(jsonBodyMapName);
                jsonWriter.WriteValue(jsonBodyMapValue);
            }

            jsonWriter.WritePropertyName("Email");
            jsonWriter.WriteStartObject();
                jsonWriter.WritePropertyName("To");
                jsonWriter.WriteValue("tyre@contoso.co.za");
                jsonWriter.WritePropertyName("Subject");
                jsonWriter.WriteValue("Test Email");
                jsonWriter.WritePropertyName("Body");
                jsonWriter.WriteValue("Hello world!");
            jsonWriter.WriteEndObject();

        jsonWriter.WriteEndObject();
        jsonBody = strWriter.ToString();
        info(jsonBody);
    }
    catch
    {
        error("@EXD32721");
        exception = ClrInterop::getLastException();
        if (exception != null)
        {
            exception = exception.get_InnerException();
            if (exception != null)
            {
                error("\n" +  clr2XppStr(exception.ToString()));
            }
        }
    }
}
```

## Refresh a form data source from a button

This extension of the `RefreshForm` control on the `LogisticsPostalAddress` form gets the caller form and calls `reread()` and `research()` on its data source. The comments show other options. For a comparison of refresh, reread, research, and executeQuery, read [Tutorial: refresh, reread, research, executeQuery, which one to use](https://d365ffo.com/2021/04/02/d365ffo-ax-x-tutorial-refresh-reread-research-executequery-which-one-to-use/comment-page-1/).

```xpp
[ExtensionOf(formcontrolstr(LogisticsPostalAddress, RefreshForm))]
final class LogisticsPostalAddress_RefreshForm_FC_Extension
{
    void clicked()
    {
        // https://d365ffo.com/2021/04/02/d365ffo-ax-x-tutorial-refresh-reread-research-executequery-which-one-to-use/comment-page-1/
            
        FormRun                         formRun;
        FormControl                     formControl;
        // FormDataObject               formDataObject;
        FormDataSource                  formDataSource;

        next clicked();

        // formControl                  = this.formRun().design().controlName("FormControlName") as FormControl;
        // formControl                  = this.formRun().design().controlName(formControlStr(FormName, FormControlName)) as FormControl;
        formControl                     = any2Object(this) as FormControl;
        // formDataObject               = any2Object(this) as FormDataObject;
        formRun                         = formControl.formRun().args().caller();
        // formRun                      = formDataObject.datasource().formRun();
        formDataSource                  = formRun.dataSource();

        formDataSource.reread();
        formDataSource.research();
        // formRun.doRefresh();
        // element.redraw();
        // element.reload();
    }
}
```

## Cache display methods

There are two options.

Option 1: Add a call to `cacheAddMethod` in the `init()` method of the form data source. Always put the call in `init()`.

```xpp
public void init()
{
    super();
    this.cacheAddMethod(tableMethodStr(DirPartyPostalAddressView,locationRoles));
}
```

Option 2: Set the `SysClientCacheDataMethodAttribute` attribute on the display method of the table.

```xpp
[SysClientCacheDataMethodAttribute(true)]
public client server display ExternalItemId defaultExternalItemId()
{
    return this.defaultCustVendExternalItemDescription().externalItemId();
}
```

## Convert a map to a container and back

Convert a map to a container. The container holds the key and the value of each entry, one after the other.

```xpp
static void MapToContainerExample(Args _args)
{
    Map mapExample = new Map(Types::String, Types::Integer);
    container conExample = conNull();
    
    mapExample.insert('Apple', 5);
    mapExample.insert('Banana', 3);
    mapExample.insert('Orange', 2);
    
    // Iterate over the map and convert it into a container
    MapEnumerator enumerator = mapExample.getEnumerator();
    while (enumerator.moveNext())
    {
        conExample += [enumerator.currentKey(), enumerator.currentValue()];
    }
    
    // Show the container
    info(strFmt('Container contents: %1', conExample));
}
```

Convert a container of key and value pairs to a map. Each odd index holds a key and each even index holds a value.

```xpp
static void ContainerToMapExample(Args _args)
{
    container conExample = ["Apple", 5, "Banana", 3, "Orange", 2];
    Map mapExample = null;
    int index;
    
    mapExample = new Map(Types::String, Types::Integer);
    
    // Iterate through the container, assuming key-value pairs in odd/even indices
    for (index = 1; index <= conLen(conExample) / 2; index++)
    {
        // Every odd index is a key, and every even index is a value
        mapExample.insert(conPeek(conExample, 2 * index - 1), conPeek(conExample, 2 * index));
    }
    
    // Retrieve and display the map values
    info(strFmt('Apple count: %1', mapExample.lookup('Apple')));
    info(strFmt('Banana count: %1', mapExample.lookup('Banana')));
    info(strFmt('Orange count: %1', mapExample.lookup('Orange')));
}
```

## Check for an interactive session

`Global::hasGUI()` tells if the code runs on an interactive client. In AX 2012, use the commented line with `xGlobal::clientKind()`.

```xpp
static void checkInteractiveClientJob(Args _args)
{
    if (Global::hasGUI() == true)
    // if (xGlobal::clientKind() == ClientType::Client) // For AX 2012
    {
        info("This code is running on an interactive client.");
    }
    else
    {
        info("This code is not running on an interactive client.");
    }
}
```

## Cross-company and change-company selects

This job finds a case in all companies with `crossCompany`. Then it uses `changeCompany` to select the case in its own company and shows the generated SQL statement.

```xpp
static void crossCompanyCaseDetailExampleJob(Args _args)
{
    CaseDetailBase caseDetailBase;

    while select crossCompany * from caseDetailBase
        order by caseDetailBase.RecId desc
        where caseDetailBase.CaseId == 'CASE123'
    {
        if (caseDetailBase)
        {
            changeCompany(caseDetailBase.dataAreaId)
            // changeCompany(curExt()) 
            {
                select generateOnly firstOnly * from caseDetailBase
                    where caseDetailBase.CaseId == 'CASE123';

                info(strFmt("Case ID: %1, Company: %2", caseDetailBase.CaseId, caseDetailBase.dataAreaId));
                info(caseDetailBase.getSQLStatement());
            }
        }
    }
}
```

## Split a file path

`Docu::splitFilename` returns the file name, the file type, and the folder path. The `System.IO.Path` methods return each part separately.

```xpp
public void fileNameSplit()
{
    Filename fileName, fileType, filePath;
    [fileName, fileType, filePath] = Docu::splitFilename(@"C:\Users\YourUser\Documents\example.txt");

    System.String fullPath = @"C:\Users\YourUser\Documents\example.txt";

    // Get file name with extension
    System.String fileNameWithExt = System.IO.Path::GetFileName(fullPath);

    // Get file name without extension
    System.String fileNameWithoutExt = System.IO.Path::GetFileNameWithoutExtension(fullPath);

    // Get file extension
    System.String fileExtension = System.IO.Path::GetExtension(fullPath);

    // Get directory path
    System.String directoryPath = System.IO.Path::GetDirectoryName(fullPath);
}
```

## Call an async .NET method from X++

The C# class has an async method `FetchRef`:

```csharp
public class MyService
{
    public async Task<string> FetchRef()
    {
        // Simulate async work
        await Task.Delay(500);
        return "Reference_123";
    }
}
```

X++ cannot use `await`. Call the method, then call `Wait()` on the returned task to block until it completes. Then read the result.

> **NOTE:** Verify before use: `clrTask` is declared as the non-generic `System.Threading.Tasks.Task`, which has no `Result` property, so `get_Result()` can fail to compile. `FetchRef` returns `Task<string>`. A safe option is a synchronous C# wrapper method (for example `public string FetchRefSync() => FetchRef().GetAwaiter().GetResult();`) that X++ calls directly.

```xpp
static void main(Args _args)
{
    System.Threading.Tasks.Task clrTask;
    str result;

    // Create instance of the C# class
    MyService service = new MyService();

    // Call the async method
    clrTask = service.FetchRef();

    // Wait for completion and get the result
    clrTask.Wait(); // Blocks until finished
    result = clrTask.get_Result(); // Retrieve the returned string

    info(strFmt("Fetched reference: %1", result));
}
```

## Run direct SQL with the Statement class

This sample uses the `Connection`, `Statement`, and `ResultSet` classes. It asserts `SqlStatementExecutePermission` before it runs the query. For the API, read [Dynamics.AX.Application Statement class](https://learn.microsoft.com/en-us/dotnet/api/dynamics.ax.application.statement?view=dyn-finops-dotnet#remarks).

```xpp
static void example() 
{ 
    Connection Con; 
    Statement Stmt; 
    ResultSet R; 
    SqlStatementExecutePermission perm; 
    str sql = 'SELECT VALUE FROM SQLSYSTEMVARIABLES'; 
    Con = new Connection(); 
    Stmt = Con.createStatement(); 
    perm = new SqlStatementExecutePermission(sql); 
    perm.assert();

    // SELECT
    R = Stmt.executeQuery(sql);
    // R = stmt.executeQueryWithParameters(sql, null);
    while ( R.next() ) 
    { 
        print R.getString(1); 
    }

    // DELETE, INSERT or UPDATE
    // Stmt.executeUpdate(sql);
    // stmt.executeUpdateWithParameters(sql, null);
    
    CodeAccessPermission::revertAssert();
}
```

> **WARNING:** Direct SQL can be open to SQL injection. Use parameterized queries. Refer to [Validate SQL statements against injection in X++](doc:d365-fo-sql-injection-validation).

## Force TLS 1.2 for an external HTTPS call

If an external HTTPS REST endpoint requires TLS 1.2, set `ServicePointManager.SecurityProtocol` to `Tls12` before the call.

```xpp
public static void callExternalService()
{
    InteropPermission                       interopPermission;
    System.Net.WebHeaderCollection          webHeaders;
    System.Net.WebClient                    webClient;
    str                                     url;

    System.Net.ServicePointManager::set_SecurityProtocol(System.Net.SecurityProtocolType::Tls12);
    interopPermission = new InteropPermission(InteropKind::ClrInterop);
    interopPermission.assert();

    try
    {
        webClient = new System.Net.WebClient();
        webHeaders = new System.Net.WebHeaderCollection();
        url = strFmt("https://api.example.com/data");

        webHeaders.Add("Authorization", strFmt("Bearer %1", "accessToken"));
        webHeaders.Add("x-ms-version", "2025-07-05");

        webClient.set_Headers(webHeaders);
        webClient.UploadString(url, "DELETE", "");
        CodeAccessPermission::revertAssert();
    }
    catch (Exception::CLRError)
    {
        error(CLRInterop::getLastException().ToString());
    }
}
```

> **NOTE:** Replace the URL, the method, the headers, and the `accessToken` text with the values of your endpoint.

## Related links

- [X++ session run time functions](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/xpp-session-run-time-functions)
- [X++ container runtime functions](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/xpp-container-run-time-functions)
- [AES encryption in AX 2012, D365, and C#](doc:d365-fo-aes-encryption)
- [D365 F&O development processes](doc:d365-fo-development-processes)
