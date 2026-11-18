---
title: Use the Azure Blob Storage REST API from X++
summary: List, copy, move, and delete Azure blobs with the REST API, Shared Key or OAuth 2.0 app registration authentication, and X++ helper classes.
category: Dynamics 365
order: 90
---

# Use the Azure Blob Storage REST API from X++

This article shows how to call the [Azure Blob Storage REST API](https://learn.microsoft.com/en-us/rest/api/storageservices/blob-service-rest-api) with `curl` and with X++. Use it to list, copy, move, and delete blobs from D365 F&O.

## Before you start

- An Azure Storage account and a blob container.
- For OAuth 2.0: permission to create an app registration in Microsoft Entra ID (formerly Azure AD) and to assign roles on the storage account.

## List blobs with Shared Key authentication

This generic `curl` example lists the blobs in a folder of a container. It uses Shared Key authentication.

```bash
curl -X GET "https://<storage-account>.blob.core.windows.net/<container-name>?restype=container&comp=list&prefix=<folder-path>/" \
  -H "x-ms-date: <RFC-1123-date>" \
  -H "x-ms-version: 2021-10-04" \
  -H "Authorization: SharedKey <storage-account>:<signature>"
```

| Placeholder | Value |
| --- | --- |
| `<storage-account>` | The name of your Azure Storage account. |
| `<container-name>` | The name of your blob container. |
| `<folder-path>` | The virtual folder path in the container. |
| `<RFC-1123-date>` | The current date in RFC 1123 format, for example `Thu, 02 Oct 2025 09:28:00 GMT`. |
| `<signature>` | The HMAC-SHA256 signature of the string-to-sign, made with your storage account key. |

## Authenticate with an app registration

To use an app registration instead of Shared Key, use OAuth 2.0 with Microsoft Entra ID.

### Create an app registration

1. Go to the [Azure Portal](https://portal.azure.com).
2. Go to **Microsoft Entra ID > App registrations > New registration**.
3. Give the app a name and register it.
4. Write down the **Application (client) ID** and the **Directory (tenant) ID**.

### Create a client secret

1. In the app registration, go to **Certificates & secrets**.
2. Select **New client secret**. Give it a name and set an expiry.
3. Copy the secret value immediately. You cannot see it again.

### Assign an RBAC role to the app

1. Go to your **Storage Account > Access Control (IAM)**.
2. Select **Add role assignment**.
3. Select a role:
   - `Storage Blob Data Reader` for read-only access.
   - `Storage Blob Data Contributor` for read and write access.
4. Assign the role to your app registration. Search for it by name.

### Get an OAuth token

Use `curl` or Postman to get a token:

```bash
curl -X POST https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<client-id>&scope=https://storage.azure.com/.default&client_secret=<client-secret>&grant_type=client_credentials"
```

**Result:** The response contains an `access_token`.

### List blobs with the token

```bash
curl -X GET "https://<storage-account>.blob.core.windows.net/<container>?restype=container&comp=list&prefix=<folder-path>/" \
  -H "Authorization: Bearer <access_token>" \
  -H "x-ms-version: 2025-07-05"
```

## Move a blob

Blob Storage does not have a move operation. Copy the blob, then delete the original.

1. Copy the blob to the new location. Use the `Copy Blob` operation: a `PUT` with the `x-ms-copy-source` header. This starts a server-side copy to the new path (the path simulates a folder).

   ```http
   PUT https://<storage-account>.blob.core.windows.net/<container>/<new-folder>/<blob-name>
   x-ms-copy-source: https://<storage-account>.blob.core.windows.net/<container>/<old-folder>/<blob-name>
   ```

2. `Copy Blob` can run asynchronously. Make sure that the `x-ms-copy-status` response header is `success`. Then use the `Delete Blob` operation to remove the original blob:

   ```http
   DELETE https://<storage-account>.blob.core.windows.net/<container>/<old-folder>/<blob-name>
   ```

## Code

The X++ version has two classes:

- `ListBlobContract` holds the properties of one blob and parses the XML response of `List Blobs`.
- `AzureBlobUtility` gets the OAuth token and lists, copies, and deletes blobs.

### ListBlobContract

```xpp
class ListBlobContract
{
    str name;
    utcDateTime creationTime;
    utcDateTime lastModified;
    str etag;
    int64 contentLength;
    str contentType;
    str contentEncoding;
    str contentLanguage;
    str contentCRC64;
    str contentMD5;
    str cacheControl;
    str contentDisposition;
    str blobType;
    str accessTier;
    boolean accessTierInferred;
    str leaseStatus;
    str leaseState;
    boolean serverEncrypted;

    public str parmName(str _name = name)
    {
        name = _name;
        return name;
    }

    public utcDateTime parmCreationTime(utcDateTime _creationTime = creationTime)
    {
        creationTime = _creationTime;
        return creationTime;
    }

    public utcDateTime parmLastModified(utcDateTime _lastModified = lastModified)
    {
        lastModified = _lastModified;
        return lastModified;
    }

    public str parmEtag(str _etag = etag)
    {
        etag = _etag;
        return etag;
    }

    public int64 parmContentLength(int64 _contentLength = contentLength)
    {
        contentLength = _contentLength;
        return contentLength;
    }

    public str parmContentType(str _contentType = contentType)
    {
        contentType = _contentType;
        return contentType;
    }

    public str parmContentEncoding(str _contentEncoding = contentEncoding)
    {
        contentEncoding = _contentEncoding;
        return contentEncoding;
    }

    public str parmContentLanguage(str _contentLanguage = contentLanguage)
    {
        contentLanguage = _contentLanguage;
        return contentLanguage;
    }

    public str parmContentCRC64(str _contentCRC64 = contentCRC64)
    {
        contentCRC64 = _contentCRC64;
        return contentCRC64;
    }

    public str parmContentMD5(str _contentMD5 = contentMD5)
    {
        contentMD5 = _contentMD5;
        return contentMD5;
    }

    public str parmCacheControl(str _cacheControl = cacheControl)
    {
        cacheControl = _cacheControl;
        return cacheControl;
    }

    public str parmContentDisposition(str _contentDisposition = contentDisposition)
    {
        contentDisposition = _contentDisposition;
        return contentDisposition;
    }

    public str parmBlobType(str _blobType = blobType)
    {
        blobType = _blobType;
        return blobType;
    }

    public str parmAccessTier(str _accessTier = accessTier)
    {
        accessTier = _accessTier;
        return accessTier;
    }

    public boolean parmAccessTierInferred(boolean _accessTierInferred = accessTierInferred)
    {
        accessTierInferred = _accessTierInferred;
        return accessTierInferred;
    }

    public str parmLeaseStatus(str _leaseStatus = leaseStatus)
    {
        leaseStatus = _leaseStatus;
        return leaseStatus;
    }

    public str parmLeaseState(str _leaseState = leaseState)
    {
        leaseState = _leaseState;
        return leaseState;
    }

    public boolean parmServerEncrypted(boolean _serverEncrypted = serverEncrypted)
    {
        serverEncrypted = _serverEncrypted;
        return serverEncrypted;
    }

    public static List parseListBlobsXml(str xmlResponse)
    {
        System.Xml.XmlNodeList      blobNodes;
        System.Xml.XmlNode          blobNode, propNode, prefixNode;
        System.Xml.XmlNode          node;
        str                         nodeInnerText, prefixNodeInnerText;
        ListBlobContract            listBlobContract;
        int                         i, blobCount;
        Filename                    fileName, fileType, filePath;
        System.Xml.XmlDocument      xmlDoc = new System.Xml.XmlDocument();
        List                        blobList = new List(Types::Class);

        xmlDoc.LoadXml(xmlResponse);
        
        prefixNode = xmlDoc.SelectSingleNode("//Prefix");
        if (prefixNode != null) { prefixNodeInnerText = prefixNode.get_InnerText(); }
        
        blobNodes = xmlDoc.SelectNodes("//Blob");
        blobCount = blobNodes.get_Count();

        for (i = 0; i < blobCount; i++)
        {
            blobNode = blobNodes.Item(i);
            propNode = blobNode.SelectSingleNode("Properties");

            listBlobContract = new ListBlobContract();

            node = blobNode.SelectSingleNode("Name");
            if (node != null) { listBlobContract.parmName(node.get_InnerText()); }
            
            [fileName, fileType, filePath] = Docu::splitFilename(listBlobContract.parmName());
            
            prefixNodeInnerText = (substr(prefixNodeInnerText, strlen(prefixNodeInnerText), 1) == '/') 
                ? substr(prefixNodeInnerText, 1, strlen(prefixNodeInnerText) - 1) 
                : prefixNodeInnerText;  // Remove a trailing slash
            
            filePath = (substr(filePath, strlen(filePath), 1) == '/') 
                ? substr(filePath, 1, strlen(filePath) - 1) 
                : filePath; // Remove a trailing slash
            
            if (strLen(listBlobContract.parmName()) > 0 && strCmp(strLwr(prefixNodeInnerText), strLwr(filePath)) == 0 ) // To avoid listing blobs from subfolders
            {
                node = propNode.SelectSingleNode("Creation-Time");
                if (node != null) { nodeInnerText = node.get_InnerText(); listBlobContract.parmCreationTime(System.DateTime::Parse(nodeInnerText)); }

                node = propNode.SelectSingleNode("Last-Modified");
                if (node != null) { nodeInnerText = node.get_InnerText(); listBlobContract.parmLastModified(System.DateTime::Parse(nodeInnerText)); }

                node = propNode.SelectSingleNode("Etag");
                if (node != null) { listBlobContract.parmEtag(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-Length");
                if (node != null) { nodeInnerText = node.get_InnerText(); listBlobContract.parmContentLength(str2int64(nodeInnerText)); }

                node = propNode.SelectSingleNode("Content-Type");
                if (node != null) { listBlobContract.parmContentType(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-Encoding");
                if (node != null) { listBlobContract.parmContentEncoding(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-Language");
                if (node != null) { listBlobContract.parmContentLanguage(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-CRC64");
                if (node != null) { listBlobContract.parmContentCRC64(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-MD5");
                if (node != null) { listBlobContract.parmContentMD5(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Cache-Control");
                if (node != null) { listBlobContract.parmCacheControl(node.get_InnerText()); }

                node = propNode.SelectSingleNode("Content-Disposition");
                if (node != null) { listBlobContract.parmContentDisposition(node.get_InnerText()); }

                node = propNode.SelectSingleNode("BlobType");
                if (node != null) { listBlobContract.parmBlobType(node.get_InnerText()); }

                node = propNode.SelectSingleNode("AccessTier");
                if (node != null) { listBlobContract.parmAccessTier(node.get_InnerText()); }

                node = propNode.SelectSingleNode("AccessTierInferred");
                if (node != null) { nodeInnerText = node.get_InnerText(); listBlobContract.parmAccessTierInferred(nodeInnerText == "true"); }

                node = propNode.SelectSingleNode("LeaseStatus");
                if (node != null) { listBlobContract.parmLeaseStatus(node.get_InnerText()); }

                node = propNode.SelectSingleNode("LeaseState");
                if (node != null) { listBlobContract.parmLeaseState(node.get_InnerText()); }

                node = propNode.SelectSingleNode("ServerEncrypted");
                if (node != null) { nodeInnerText = node.get_InnerText(); listBlobContract.parmServerEncrypted(nodeInnerText == "true"); }

                blobList.addEnd(listBlobContract);
            }
        }

        return blobList;
    }
}
```

### AzureBlobUtility

```xpp
class AzureBlobUtility
{
    public static str getAccessToken()
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
        str                                                   scope        = "https://storage.azure.com/.default";
        str                                                   tokenEndpoint;

        try
        {
            tokenEndpoint = strFmt(
                "https://login.microsoftonline.com/%1/oauth2/v2.0/token",
                tenantId
            );

            webClient = new System.Net.WebClient();
            values = new System.Collections.Specialized.NameValueCollection();
            values.Add("client_id",     clientId);
            values.Add("scope",         scope);
            values.Add("client_secret", clientSecret);
            values.Add("grant_type",    "client_credentials");

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

    public static List listBlobs(str storageAccount, str containerName, str folderPath, str accessToken, int maxResults = 5000)
    {
        str                             url;
        List                            list;
        str                             responseStr, nextMarker;
        System.Exception                exception;
        System.Xml.XmlNode              nextMarkerNode;
        System.Net.WebHeaderCollection  headers     = new System.Net.WebHeaderCollection();
        System.Net.WebClient            webClient   = new System.Net.WebClient();
        System.Xml.XmlDocument          xmlDoc      = new System.Xml.XmlDocument();
        try
        {
            url = strFmt("https://%1.blob.core.windows.net/%2?restype=container&comp=list&prefix=%3&maxresults=%4",
                storageAccount, containerName, folderPath, maxResults
            );

            headers.Add("Authorization", strFmt("Bearer %1", accessToken));
            headers.Add("x-ms-version", "2025-07-05");

            webClient.set_Headers(headers);
            responseStr = webClient.DownloadString(url);
            
            xmlDoc.LoadXml(responseStr);
            nextMarkerNode = xmlDoc.SelectSingleNode("//NextMarker");
            if (nextMarkerNode != null) { nextMarker = nextMarkerNode.get_InnerText(); } // A string value that identifies the portion of the list to be returned with the next list operation. 
                                                                                        // The operation returns a marker value within the response body if the list returned was not complete.
            
            list = ListBlobContract::parseListBlobsXml(responseStr);
            return list;
        }
        catch (Exception::CLRError)
        {
            exception = CLRInterop::getLastException();
            error(exception.ToString());
            return new List(Types::Class);
        }
    }

    public static boolean copyBlob(str storageAccount, str containerName, str oldFolder, str newFolder, str blobName, str accessToken)
    {
        str                             sourceUrl;
        str                             destUrl;
        System.Exception                exception;
        System.Net.WebHeaderCollection  headers     = new System.Net.WebHeaderCollection();
        System.Net.WebClient            webClient   = new System.Net.WebClient();

        try
        {
            sourceUrl = strFmt("https://%1.blob.core.windows.net/%2/%3/%4", storageAccount, containerName, oldFolder, blobName);
            destUrl   = strFmt("https://%1.blob.core.windows.net/%2/%3/%4", storageAccount, containerName, newFolder, blobName);

            headers.Add("Authorization", strFmt("Bearer %1", accessToken));
            headers.Add("x-ms-version", "2025-07-05");
            headers.Add("x-ms-copy-source", sourceUrl);

            webClient.set_Headers(headers);
            webClient.UploadString(destUrl, "PUT", "");

            return true;
        }
        catch (Exception::CLRError)
        {
            exception = CLRInterop::getLastException();
            error(exception.ToString());
            return false;
        }
    }

    public static boolean deleteBlob(str storageAccount, str containerName, str folder, str blobName, str accessToken)
    {
        str                             url;
        System.Exception                exception;
        System.Net.WebHeaderCollection  headers     = new System.Net.WebHeaderCollection();
        System.Net.WebClient            webClient   = new System.Net.WebClient();

        try
        {
            url = strFmt("https://%1.blob.core.windows.net/%2/%3/%4", storageAccount, containerName, folder, blobName);

            headers.Add("Authorization", strFmt("Bearer %1", accessToken));
            headers.Add("x-ms-version", "2025-07-05");

            webClient.set_Headers(headers);
            webClient.UploadString(url, "DELETE", "");

            return true;
        }
        catch (Exception::CLRError)
        {
            exception = CLRInterop::getLastException();
            error(exception.ToString());
            return false;
        }
    }

    public static void main(Args _args)
    {
        CLRObject                                   clrException;
        str                                         accessToken;
        ListEnumerator                              listEnumerator;
        List                                        list;
        ListBlobContract                            listBlobContract;
        Filename                                    fileName, fileNameWithoutExt, fileType, filePath;

        try
        {
            accessToken         = AzureBlobUtility::getAccessToken(); // Valid for 1 hour
            list                = AzureBlobUtility::listBlobs("storage-account", "container-name", "root-folder/sub-folder1", accessToken);
            listEnumerator      = list.getEnumerator();

            while (listEnumerator.moveNext())
            {
                listBlobContract = listEnumerator.current();
                fileName = System.IO.Path::GetFileName(listBlobContract.parmName());
                [fileNameWithoutExt, fileType, filePath] = Docu::splitFilename(listBlobContract.parmName());
                
                if (strCmp(strLwr(fileName), strLwr("file.pdf")) == 0)
                {
                    info(listBlobContract.parmName());
                    AzureBlobUtility::copyBlob("storage-account", "container-name", "root-folder/sub-folder1", "root-folder/sub-folder2", fileName, accessToken);
                    AzureBlobUtility::deleteBlob("storage-account", "container-name", "root-folder/sub-folder1", fileName, accessToken);
                }
            }
        }
        catch (Exception::CLRError)
        {
            clrException = CLRInterop::getLastException();
            error(clrException.ToString());
        }
    }
}
```

## How to use it

1. Fill in `tenantId`, `clientId`, and `clientSecret` in `AzureBlobUtility::getAccessToken`.
2. In `AzureBlobUtility::main`, replace `storage-account`, `container-name`, the folder paths, and `file.pdf` with your values.
3. Run the class. `main` moves `file.pdf` from `root-folder/sub-folder1` to `root-folder/sub-folder2`.

## How it works

- The access token is valid for 1 hour.
- `listBlobs` returns a maximum of 5000 blobs by default (`maxResults`). If the list is not complete, the response contains a `NextMarker` value. The code reads the marker but does not request the next page.
- `parseListBlobsXml` removes a trailing slash from the prefix and from each blob folder path. It adds a blob only if its folder agrees with the prefix. Thus, it does not list blobs from subfolders.
- `copyBlob` sends a `PUT` with the `x-ms-copy-source` header (`Copy Blob`). `deleteBlob` sends a `DELETE`. Together they move a blob. `main` does not check `x-ms-copy-status` before the delete. For large blobs, check the copy status first.
- If the response has no property element, the code skips that property.

> **NOTE:** Dated (checked November 2026): `System.Net.WebClient` is obsolete in .NET 6 and later (warning SYSLIB0014). D365 F&O runs on .NET Framework, where it still works. For new .NET code, use `HttpClient`.

## Related links

- [Blob service REST API](https://learn.microsoft.com/en-us/rest/api/storageservices/blob-service-rest-api)
- [Azure App Registration for D365 F&O API access](doc:d365-fo-azure-app-registration)
- [D365 F&O development processes](doc:d365-fo-development-processes)
