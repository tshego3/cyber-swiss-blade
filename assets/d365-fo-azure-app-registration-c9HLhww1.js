var e=`---
title: Azure App Registration for D365 F&O API access
summary: Register an Entra ID app, map it to a D365 F&O user, get an OAuth token, call the OData APIs, and fix the invalid user error.
category: Dynamics 365
order: 130
---

# Azure App Registration for D365 F&O API access

External systems (Postman, Logic Apps, Power Automate, C# applications, and others) need an Azure App Registration to call D365 Finance and Operations APIs. You configure the app in the Azure Portal and in D365 F&O. The integration then uses OAuth 2.0 authentication.

## Before you start

- Access to the [Azure Portal](https://portal.azure.com/) with permission to create app registrations.
- An Entra ID admin who can grant admin consent.
- A D365 F&O user with the System administrator role, to add the app in D365 F&O.

## Create an app registration

1. Go to the [Azure Portal](https://portal.azure.com/).
2. Go to **Microsoft Entra ID** (formerly Azure AD) **> App registrations > New registration**.
3. Fill in these details:
   - **Name**: a descriptive name, for example \`D365FO-External-API-Client\`.
   - **Supported account types**: "Accounts in this organizational directory only".
   - **Redirect URI**: leave it empty for service-to-service authentication.
4. Select **Register**.
5. Write down the **Application (client) ID** and the **Directory (tenant) ID**.

## Create a client secret

1. In the app registration, go to **Certificates & secrets**.
2. Select **New client secret**.
3. Give a description, for example \`D365FO API Secret\`.
4. Set an expiry period. The recommended period is 12-24 months.
5. Select **Add**.
6. Copy the secret value immediately. You cannot see it again.

## Configure API permissions

1. In the app registration, go to **API permissions**.
2. Select **Add a permission > Dynamics ERP**.
3. Select the permission type for your scenario:
   - **Delegated permissions**: for scenarios in a user context.
   - **Application permissions**: for service-to-service scenarios. This type is recommended for external integrations.
4. Select the permissions that you need, for example **CustomService.FullAccess** (custom services) or **Odata.FullAccess** (OData entities).
5. Select **Add permissions**.
6. Select **Grant admin consent for [Your Organization]**.

> **IMPORTANT:** If you do not grant admin consent, the authentication fails.

> **NOTE:** Verify the permission list in the Azure portal before you use it. The source named a permission \`CustomService.FullAccess.All\`, which does not appear to exist. Dynamics ERP shows delegated permissions such as \`CustomService.FullAccess\`, \`Odata.FullAccess\`, and \`AX.FullAccess\`. For the client credentials flow, D365 F&O authorizes the app through the **Microsoft Entra ID applications** form, and an application permission can be unavailable.

## Register the app in D365 F&O

This record connects the Azure App Registration to the internal security of D365 F&O.

1. Log in to your D365 F&O environment.
2. Go to \`System Administration > Setup > Microsoft Entra ID applications\`.
3. Select **New**.
4. Fill in these fields:
   - **Client ID**: the **Application (client) ID** from the Azure Portal.
   - **Name**: a descriptive name, for example \`External API Integration\`.
   - **User ID**: a valid D365 user. The integration runs as this user. The permissions of this user control what the API can access. Make sure that the user has the correct security roles.

## Verify the user configuration

1. Go to \`System Administration > Users > Users\`.
2. Find the **User ID** that you assigned to the app.
3. Make sure that these values are correct:
   - **Enabled**: **Yes**.
   - **Security roles**: the correct roles, for example *Data Management functional user*, *System administrator*, or custom roles.
   - **Default company**: the legal entity that the API uses most.
   - **Telemetry ID**: it must have a value. If it is empty, refer to [Troubleshooting](#troubleshooting).

## Get an OAuth token

### With cURL

\`\`\`bash
curl -X POST https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=<client-id>&scope=<d365-url>/.default&client_secret=<client-secret>&grant_type=client_credentials"
\`\`\`

### With Postman

1. Create a new request.
2. Go to the **Authorization** tab.
3. Select **OAuth 2.0**.
4. Set these values:
   - **Grant Type**: Client Credentials
   - **Access Token URL**: \`https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token\`
   - **Client ID**: your Application (client) ID
   - **Client Secret**: your client secret value
   - **Scope**: \`https://<your-d365-environment>.operations.dynamics.com/.default\`
5. Select **Get New Access Token**.

> **IMPORTANT:** Do not put a trailing slash \`/\` at the end of the D365 URL.

### With X++ in D365

\`\`\`xpp
public static str getAccessToken()
{
    System.Net.WebClient                                  webClient;
    System.Collections.Specialized.NameValueCollection    values;
    System.Text.UTF8Encoding                              encoding;
    System.Byte[]                                         responseBytes;
    str                                                   responseText;
    Newtonsoft.Json.Linq.JObject                          json;
    System.Object                                         accessTokenObj;
    str                                                   tenantId     = "<your-tenant-id>";
    str                                                   clientId     = "<your-client-id>";
    str                                                   clientSecret = "<your-client-secret>";
    str                                                   scope        = "https://<your-d365-url>/.default";
    str                                                   tokenEndpoint;

    try
    {
        tokenEndpoint = strFmt("https://login.microsoftonline.com/%1/oauth2/v2.0/token", tenantId);

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
        error(CLRInterop::getLastException().ToString());
        return "";
    }
}
\`\`\`

## Call the D365 F&O OData endpoints

When you have the access token, call the OData endpoints.

### Get customers

\`\`\`bash
curl -X GET "https://<your-d365-url>/data/Customers?cross-company=true" \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json"
\`\`\`

### Create a sales order

\`\`\`bash
curl -X POST "https://<your-d365-url>/data/SalesOrders" \\
  -H "Authorization: Bearer <access-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataAreaId": "USMF",
    "CustomerAccount": "US-001",
    "OrderDate": "2026-02-17T00:00:00Z"
  }'
\`\`\`

## Troubleshooting

The error "Please verify that the user is valid and set up correctly" usually occurs **after** Microsoft Entra ID gives a token, but **before** D365 F&O lets the request access data. Do these checks in sequence.

### Check the Entra ID registration

The trust relationship between the app registration and the F&O environment is a frequent cause.

- **Client ID and secret:** Make sure that the \`Client ID\` and \`Client Secret\` in the request agree exactly with the app registration in the Azure Portal.
- **Resource URL:** Make sure that the \`Resource\` (or \`Audience\`) parameter of the token request is exactly your F&O URL, for example \`https://your-env.operations.dynamics.com\`. Do not put a trailing slash \`/\` at the end of the URL.
- **API permissions:** In the app registration, under **API Permissions**, make sure that **Microsoft Dynamics ERP** has "Delegated" or "Application" permissions for your flow. Make sure that you selected **Grant admin consent for [Company]**.

### Check the mapping in F&O

A valid token does not work if F&O cannot map the Client ID to an internal user.

1. Go to \`System Administration > Setup > Microsoft Entra ID applications\`.
2. Make sure that the **Client ID** of your app registration is in the list.
3. Make sure that the **Name** is descriptive and that the **User ID** is a valid user.
4. Go to \`System Administration > Users > Users\` and find this User ID. The integration uses this identity.
5. Make sure that the user is enabled (**Enabled** = Yes).
6. Make sure that the user has a **Telemetry ID**. If it is empty, the user can be "invalid".

### Check data and security access

If the user is valid but cannot see the data, you can still get unclear "invalid user" errors.

- **Security roles:** Make sure that the user has the correct security roles, for example *Data Management functional user* or the roles for the OData entity.
- **Legal entity access:** Integration calls often use the default company of the user. For example, the call targets data in \`USMF\`, the default company is \`DAT\`, and the user has no access to \`USMF\`. Then the call can fail. To fix it, add \`?cross-company=true\` to the OData URL, or give the user access to the target legal entity.

### Repair an invalid user

Recent versions (v10.0.39+) of F&O have a tool to find user sync problems.

> **NOTE:** Verify the page name, the action name, and the version in your environment. The **Invalid users** page and the **Repair telemetry IDs** action are not confirmed against Microsoft Learn.

1. Go to \`System Administration > Users > Invalid users\`.
2. If your service user is in the list, its **Object ID** in Entra ID does not agree with the **Telemetry ID** in F&O.
3. Select the user and select **Repair telemetry IDs**.
4. If the repair fails, delete the user from F&O and import the user again from Entra ID.

On a development box (on-premises or dev), also check if **Maintenance Mode** is on. Configuration key changes can stop user validation for some time.

### Quick reference

| Checkpoint | Path or location | Frequent cause |
| --- | --- | --- |
| **Token request** | Postman or integration app | Trailing slash \`/\` on the resource URL. |
| **Entra ID app** | \`portal.azure.com\` | No admin consent for the permissions. |
| **Mapping form** | \`System Admin > Setup > Entra ID apps\` | The Client ID is missing or maps to the wrong user. |
| **User status** | \`System Admin > Users > Users\` | The user is disabled or has no roles. |
| **ID sync** | \`System Admin > Users > Invalid users\` | Telemetry ID mismatch after a database refresh. |

## Related links

- [Microsoft Entra ID authentication for D365 F&O](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/services-home-page)
- [Service endpoints for D365 F&O](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata)
- [Troubleshoot service authentication](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/troubleshoot-service-authentication)
- [Create a custom service in D365 F&O](doc:d365-fo-custom-service)
- [D365 F&O development processes](doc:d365-fo-development-processes)
`;export{e as default};