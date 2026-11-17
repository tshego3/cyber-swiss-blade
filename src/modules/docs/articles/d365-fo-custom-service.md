---
title: Create a custom service in D365 F&O
summary: Create the request, response, and service classes, the service and service group objects, and the security privilege, then call the custom service.
category: Dynamics 365
order: 100
gist: 4143abbf2ae6a49f115d90ace5f76ecb
---

# Create a custom service in D365 F&O

A custom service runs X++ code in Dynamics 365 Finance and Operations when an external system calls it. This tutorial is based on [Create a custom service in D365](https://dynamics365musings.com/create-a-custom-service-in-d365/).

A data entity creates or reads data in tables. A service runs code. Use a service, for example, to get a value that is not in a table, or to run a process and return the result.

## Before you start

A custom service has these parts:

1. A **request** class. The system maps the incoming data to the variables of this class. The operation uses this class.
2. A **response** class. The code sets the variables of this class to the data that the caller gets. D365 converts these values to JSON.
3. A **service** class. Its method reads the request object, runs a process, and fills the response object.
4. A **service** object that points to the service class. It tells D365 that an external system can call the class.
5. A **service group** that holds the service object.

## Create the request classes

The request class must have a variable for each item of data that the caller sends.

1. In Visual Studio, create a new class, for example `rsmTutRequestSimple`.
2. Add the `[DataContractAttribute]` attribute above the class declaration.
3. Add a variable, for example `dataAreaId`.
4. Add a parm method for the variable. Put the `[DataMember("")]` attribute above the method.

```xpp
[DataContractAttribute]
class rsmTutRequestSimple
{
    private str dataAreaId;

    [DataMember("DataAreaId")]
    public str parmDataAreaId(str _value = dataAreaId)
    {
        if (!prmIsDefault(_value))
        {
            dataAreaId = _value;
        }

        return dataAreaId;
    }
}
```

To accept more than one request in a call, add a list class. The `AifCollectionTypeAttribute` attributes tell the system that the list holds `rsmTutRequestSimple` objects. The first argument is the name of the method parameter (`_value`) or `return`.

```xpp
[DataContractAttribute]
class rsmTutRequestList
{
    private List requests;

    [DataMemberAttribute("Requests"),
        AifCollectionTypeAttribute("_value", Types::Class, classStr(rsmTutRequestSimple)),
        AifCollectionTypeAttribute("return", Types::Class, classStr(rsmTutRequestSimple))]
    public List parmRequests(List _value = requests)
    {
        if (!prmIsDefault(_value))
        {
            requests = _value;
        }

        return requests;
    }
}
```

## Create the response class

The response class must have a variable for each item of data that the caller gets back.

1. In Visual Studio, create a new class, for example `rsmTutResponse`.
2. Add the `[DataContractAttribute]` attribute above the class definition.
3. Add the variables for the returned data, for example `success`, `errorMessage`, and `debugMessage`.
4. Add a parm method for each variable. Put the `[DataMember("")]` attribute above each method. The value in the attribute is the name of the JSON tag.

```xpp
[DataContractAttribute]
class rsmTutResponse
{
    private boolean     success;
    private str         errorMessage;
    private str         debugMessage;

    [DataMember("ErrorMessage")]
    public str parmErrorMessage(str _value = errorMessage)
    {
        if (!prmIsDefault(_value))
        {
            errorMessage = _value;
        }

        return errorMessage;
    }

    [DataMember("Success")]
    public Boolean parmSuccess(Boolean _value = success)
    {
        if (!prmIsDefault(_value))
        {
            success = _value;
        }

        return success;
    }

    [DataMember("DebugMessage")]
    public str parmDebugMessage(str _value = debugMessage)
    {
        if (!prmIsDefault(_value))
        {
            debugMessage = _value;
        }

        return debugMessage;
    }

}
```

## Create the service class

The service class reads the values from the request object, runs a process, and sets the values on the response object.

1. In Visual Studio, create a new class, for example `rsmTutServiceSimple`.
2. Add a method with a name of your choice, for example `create`. The parameter type is the request class. The return type is the response class: `public rsmTutResponse create(rsmTutRequestList _requestList)`.
3. Add the code for your process in the method.

In this example, the method reads the `dataAreaId` of each request and changes to that company. It stores "Hello World" in the response and inserts a record. If the process throws an error, the `catch` blocks put the error message in the response.

```xpp
class rsmTutServiceSimple
{
    public rsmTutResponse create(rsmTutRequestList _requestList)
    {
        System.Exception        interopException;
        RsmTutTable             rsmTutTable;
        ListEnumerator          listEnumerator;
        SysInfologEnumerator    sysInfologEnumerator;
        SysInfologMessageStruct sysInfologMessageStruct;
        RsmTutRequestSimple     request;
        str                     retMsg;
        RsmTutResponse          response = new rsmTutResponse();
        boolean                 ret = true;
        
        listEnumerator = _requestList.parmRequests().getEnumerator();

        while (listEnumerator.moveNext())
        {
            request = listEnumerator.current();

            changecompany(request.parmDataAreaId())
            {
                try
                {
                    response.parmSuccess(ret);
                    response.parmDebugMessage("Hello World");
                    
                    rsmTutTable.clear();
                    rsmTutTable.initValue();
                    rsmTutTable.DebugMessage           = response.parmDebugMessage();
                    rsmTutTable.Success                = response.parmSuccess();

                    if (rsmTutTable.validateWrite())
                    {
                        ttsbegin;
                        rsmTutTable.insert();
                        ttscommit;
                    }
                }
                catch (Exception::DuplicateKeyException)
                {
                    retMsg              = strFmt("@SYS339391", 
                                            "",
                                            "",
                                            "",
                                            "",
                                            "");
                    ret                 = checkFailed(retMsg);

                    response.parmSuccess(ret);
                    response.parmErrorMessage(retMsg);

                    break;
                }
                catch (Exception::Error)
                {
                    sysInfologEnumerator = SysInfologEnumerator::newData(infolog.cut());

                    while (sysInfologEnumerator.moveNext())
                    {
                        sysInfologMessageStruct = new SysInfologMessageStruct(sysInfologEnumerator.currentMessage());
                        interopException        = sysInfologEnumerator.currentException();

                        retMsg                  = strfmt("@SYS109465 %1 %2", interopException, sysInfologMessageStruct.message());
                        ret                     = checkFailed(retMsg);
                    }

                    response.parmSuccess(ret);
                    response.parmErrorMessage(retMsg);

                    break;
                }
                catch (Exception::CLRError)
                {
                    interopException    = CLRInterop::getLastException();
                    ret                 = checkFailed(interopException.ToString());
                    retMsg              = interopException.ToString();
                    
                    response.parmSuccess(ret);
                    response.parmErrorMessage(retMsg);

                    break;
                }
            }
        }

        return response;
    }
}
```

> **NOTE:** `RsmTutTable` is a sample table with the fields `DebugMessage` and `Success`. Replace it with your own table.

## Create the service object

The service object exposes the service class. An external system with the correct authentication can then call it.

1. In Visual Studio, right-click your project and select **Add New Item**. Then select **Service**.

   ![Add a new Service item](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-6.png?resize=694%2C340&ssl=1)

2. Give the item a name, for example `rsmTutServiceSimple`.
3. Open the object. Right-click it and select **Properties**.

   ![Service object properties](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-7.png?resize=464%2C243&ssl=1)

4. Set the **Class** property to the name of the service class, `rsmTutServiceSimple` (the same name as the service object).
5. Set the **External Name** property to the same value. You can use a different value, but the same value is simpler.

   ![Class and External Name properties](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-9.png?resize=324%2C235&ssl=1)

6. Right-click the **Service Operations** node and select **New Service Operation**.

   ![New Service Operation](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-10.png?resize=365%2C185&ssl=1)

7. Select the new node. In the properties, set these values:
   - **Method**: the name of the method in the service class, for example `create`.
   - **Name**: the same value as **Method**. You can use a different value, but the same value is simpler.
   - **Enable Idempotence**: `Yes`.
   - **Subscriber access level**: `Invoke`.

   ![Service operation properties](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-11.png?resize=285%2C208&ssl=1)

## Create the service group

A service group holds one or more services. It organizes operations that are related.

1. In Visual Studio, right-click the project and select **Add > New Item**.
2. Select **Service Group** and give the object a name, for example `rsmTutServiceGroupSimple`.

   ![Add a Service Group item](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-13.png?resize=681%2C303&ssl=1)

3. Open the service group. Right-click the main node and select **New Service**.

   ![New Service](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-14.png?resize=526%2C251&ssl=1)

4. Select the new node. In the properties, set **Name** and **Service** to the name of the service object, `rsmTutServiceSimple`.
5. Set **Auto Deploy** to `Yes`.

   ![Service group properties](https://i0.wp.com/dynamics365musings.com/wp-content/uploads/2020/12/image-15.png?resize=312%2C158&ssl=1)

## Create the security privilege

1. In Visual Studio, open the AOT (Application Object Tree).
2. Go to `Security > Privileges`.
3. Create a new privilege with a clear name (for example `rsmTutServiceSimple`) and a description.
4. Right-click the privilege and add a new entry point:
   1. Select **Service Operation** as the type.
   2. Select the service operation (for example `rsmTutServiceSimple`).
5. Set the access level of the service operation entry point to `Invoke`. If the service only reads data, give its table permissions only the Read access level.
6. Add the privilege to a duty, and add the duty to a role. Then synchronize the database.

Examples of permissions:

| Permission type | Purpose | Reference | Access level |
| --- | --- | --- | --- |
| Table permission | The service operation can read `CustTable`. | `CustTable` | Read |
| Data entry permission | The service operation can update customer records in `CustTable`. | `CustTable` | Update |
| Form control permission | When a form exposes the service operation, only permitted controls are available. For example, allow access to the Customer Name field and restrict access to the Credit Limit field. | `CustTableForm` | Read/Update |

## Call the service from Postman

For the Postman setup, read [Setup Postman to call D365 services](https://dynamics365musings.com/setup-postman-to-call-d365-services/). The service URL has this format:

```text
https://<D365 URL>/api/services/rsmTutServiceGroupSimple/rsmTutServiceSimple/create
```

| URL part | Meaning |
| --- | --- |
| `https://` | The call is secure. |
| `<D365 URL>` | The URL of your D365 environment, for example `https://usnconeboxax1aos.cloud.onebox.dynamics.com`. |
| `api/services` | The call goes to a service. |
| `rsmTutServiceGroupSimple` | The name of the service group. |
| `rsmTutServiceSimple` | The name of the service. |
| `create` | The name of the method on the service class. |

### Get an access token

- **URL:** `POST https://login.microsoftonline.com/{YourTenantID}/oauth2/v2.0/token`
- **Headers:** `Content-Type: application/x-www-form-urlencoded`
- **Body (x-www-form-urlencoded):**
  - `client_id`: the client ID of your Azure AD application
  - `client_secret`: the client secret of your Azure AD application
  - `grant_type`: `client_credentials`
  - `scope`: `https://usnconeboxax1aos.cloud.onebox.dynamics.com/.default`

For the app registration, refer to [Azure App Registration for D365 F&O API access](doc:d365-fo-azure-app-registration).

### Send the request

- **URL:** `https://usnconeboxax1aos.cloud.onebox.dynamics.com/api/services/rsmTutServiceGroupSimple/rsmTutServiceSimple/create`
- **Method:** POST. A service operation call always uses POST. A GET request on `/api/services` returns only the service metadata.
- **Headers:** `Authorization: Bearer <YourAccessToken>`
- **Body:** The JSON payload in the structure of the request class.

In this example, the Postman body is below. The outer key is the parameter name of the service method (`_requestList`). The inner key is the `DataMember` name (`Requests`). The names are case-sensitive.

```json
{
    "_requestList": {
        "Requests" : [
            {
                "DataAreaId": "USRT"
            }
        ]
    }
}
```

## Related links

- [Create a custom service in D365](https://dynamics365musings.com/create-a-custom-service-in-d365/)
- [Setup Postman to call D365 services](https://dynamics365musings.com/setup-postman-to-call-d365-services/)
- [Using Custom Services (AX 2012)](https://learn.microsoft.com/nl-nl/previous-versions/dynamicsax-2012/appuser-itpro/using-custom-services)
- [Azure App Registration for D365 F&O API access](doc:d365-fo-azure-app-registration)
- [D365 F&O development processes](doc:d365-fo-development-processes)
