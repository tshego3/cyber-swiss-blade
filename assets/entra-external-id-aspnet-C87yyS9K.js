var e=`---
title: External identity for ASP.NET web apps with Microsoft Entra External ID
summary: Move ASP.NET portals and APIs from custom JWT or Azure AD B2C sign-in to Microsoft Entra External ID, with admin-created accounts.
category: Identity and APIs
order: 10
---

# External identity for ASP.NET web apps with Microsoft Entra External ID

This article shows how to set up Microsoft Entra External ID as the identity provider for external users of ASP.NET portals and their APIs. Use it to move from custom JWT authentication or from Azure AD B2C. The last part keeps the Azure AD B2C steps as a legacy reference.

## Before you start

### Tenant

- You cannot convert an Azure AD B2C tenant into an External ID tenant. Create a new external tenant.
- Register the apps again in the new tenant. App registrations and admin consents do not move from B2C.
- B2C custom policies do not move. Rebuild them or federate the B2C tenant to External ID.
- Microsoft supports Azure AD B2C until at least May 2030. Keep the B2C tenant until the migration is complete.

### Cost

- External ID charges per monthly active user (MAU). An MAU is a unique user who signs in during a calendar month.
- The first 50,000 MAU are free. Above 50,000 MAU, each extra MAU has a fee. See [External ID pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-entra-external-id/) for the current rate.
- Each user counts as 1 MAU per month, if the user signs in 1 time or many times. A password reset does not add an MAU.
- The free tier counts active users, not total accounts. The tenant can hold more than 50,000 accounts at no cost if fewer than 50,000 users sign in during a month.
- Microsoft adds the MAU of all tenants that are linked to the same subscription, workforce tenants included. B2B guest users in a linked workforce tenant count toward the same 50,000. Admins in the external tenant also count.
- Before you select the subscription, check the number of guest sign-ins in the tenants that are already linked to it.
- Add-ons have no free tier. The add-ons for external tenants are SMS phone authentication, M2M authentication, and Go-Local data residency.
- This article uses no add-ons:
  - Password reset uses an email one-time passcode. Email passcodes are not an add-on. Only SMS has a charge.
  - The portals call the APIs on behalf of the signed-in user. M2M authentication (the OAuth 2.0 client credentials flow, an app that calls an API without a user) has a charge for each token request. Do not use client credentials unless you accept this cost.
- Other Azure resources have their own cost:
  - Azure Key Vault for the client secrets.
  - An Azure Function (or other endpoint that you host), only for just-in-time password migration.
  - Redis or SQL Server, only for a distributed token cache.
- The B2C tenant continues to charge separately for its own users until you remove it.
- For production, link the external tenant to an Azure subscription. The 30-day trial tenant needs no subscription.
- After you link the subscription, set a budget alert in **Cost Management** at a low amount (for example, $1). The alert sends an email if an add-on or extra MAU causes a charge.

### Roles

| Task | Minimum role |
| --- | --- |
| Create the external tenant | **Tenant Creator** |
| Register portals and APIs | **Application Administrator** or **Application Developer** |
| Disable sign-up on the user flow | **External ID User Flow Administrator** |
| Enable self-service password reset | **Security Administrator** |
| Create external users | **User Administrator** |

## Create the external tenant

The external tenant is the central identity provider for all external users: service providers, business partners, and clients. Do not add external users to the existing AD. The existing AD holds internal employees only.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) with at least the **Tenant Creator** role.
2. Select **Entra ID > Overview > Manage tenants > Create**.
3. Select **External**, then select **Continue**.
4. Select **Use Azure Subscription**.
5. On the **Basics** tab, enter these values:
   - Tenant Name (for example, \`My External Tenant\`).
   - Domain Name (for example, \`myexternaltenant\`). This value is the tenant subdomain.
   - Country/Region. You cannot change this value later.
6. On the **Add a subscription** tab, select the subscription and the resource group.
7. Select **Review + Create**, then select **Create**. Tenant creation can take up to 30 minutes.
8. Switch to the external tenant with **Settings > Directories + subscriptions**. Do all remaining steps in this tenant.
9. In **Tenant overview**, record these values:
   - Tenant ID
   - Primary domain: \`<tenant-subdomain>.onmicrosoft.com\`
   - Authority: \`https://<tenant-subdomain>.ciamlogin.com/\`

## Register each portal

Register 1 app for each custom web portal. Register the pilot portal first. Register the other portals when you connect them. All portals and APIs use this tenant for authentication, so an external user signs in to all portals with 1 identity.

1. Get the **Application Administrator** or **Application Developer** role.
2. Select **Entra ID > App registrations > New registration**, then enter these values:
   - Name: the portal name (for example, \`PartnerPortal\`).
   - Supported account types: **Accounts in this organizational directory only**.
   - Redirect URI (Web): \`https://localhost:5001/signin-oidc\`. Add the URL for each environment later.
3. Record the **Application (client) ID**.
4. In **Authentication**, set the front-channel logout URL to \`https://localhost:5001/signout-oidc\`.
5. In **Certificates & secrets**, create a client secret. Store it in Azure Key Vault.
6. Set a reminder before the secret expires. The [troubleshooting](#troubleshooting) section shows what occurs when a secret expires.

## Configure sign-in without self-registration

External users cannot register themselves. Only internal administrators create external accounts (see [Provision external users](#provision-external-users)).

All portals use the **Email with password** sign-in method:

- Administrators create each account with a password.
- Entra fixes the sign-in method of a user when it creates the account. If the method of a user flow changes later, existing users keep their original method.
- Thus, 1 method for all portals gives each user the same sign-in on every portal.

Use 1 user flow for all portals. One user flow can serve many applications. An application can have only 1 user flow.

### Create the user flow

1. Select **Entra ID > External Identities > User flows > New user flow**, then enter these values:
   - Name: \`PortalSignIn\`
   - Identity providers: select the **Email Accounts** check box, then select **Email with password**.
   - Do not add social identity providers.
2. Select **Create**.
3. Open the user flow. Under **Use**, select **Applications > Add application**, then add the pilot portal.

### Disable sign-up

The admin center has no option to disable sign-up on the user flow. Use Microsoft Graph.

1. In the user flow, select **Applications**. Copy the **Application (client) ID** of the pilot portal.
2. Get the user flow ID with this request:

   \`\`\`http
   GET https://graph.microsoft.com/beta/identity/authenticationEventsFlows?$filter=microsoft.graph.externalUsersSelfServiceSignUpEventsFlow/conditions/applications/includeApplications/any(appId:appId/appId eq '<portal-client-id>')
   \`\`\`

3. Disable sign-up with this request:

   \`\`\`http
   PATCH https://graph.microsoft.com/beta/identity/authenticationEventsFlows/<user-flow-id>
   {
     "@odata.type": "#microsoft.graph.externalUsersSelfServiceSignUpEventsFlow",
     "onInteractiveAuthFlowStart": {
       "@odata.type": "#microsoft.graph.onInteractiveAuthFlowStartExternalUsersSelfServiceSignUp",
       "isSignUpAllowed": false
     }
   }
   \`\`\`

The GET request needs the \`EventListener.Read.All\` permission. The PATCH request needs \`EventListener.ReadWrite.All\`. The least-privileged admin role is **External ID User Flow Administrator**.

### Enable self-service password reset

Users need self-service password reset to set their own password (see [Migrate existing external users](#migrate-existing-external-users)).

1. Sign in with at least the **Security Administrator** role.
2. Select **Entra ID > Authentication methods > Policies > Email OTP**.
3. Under **Enable and Target**, turn on **Email OTP**. Under **Include**, select **All users**.
4. Select **Save**.

**Result:** The sign-in page shows a **Forgot password?** link. Entra sends a one-time passcode to the user email, then the user sets a new password.

## Provision external users

Internal administrators create and manage all external users. You need at least the **User Administrator** role.

### Create one user

1. Select **Entra ID > Users > New user > Create new external user**.
2. Next to **Identities**, set **Sign-in method** to **Email**. Enter the user email address in **Value**.
3. Enter the **Display name** (first and last name).
4. Copy the autogenerated password from the **Password** box.
5. Select **Review + create**.

### Create many users

To create many users (for example, for migration), use Microsoft Graph:

\`\`\`http
POST https://graph.microsoft.com/v1.0/users
{
  "displayName": "Jane Smith",
  "mail": "jane@example.com",
  "identities": [
    {
      "signInType": "emailAddress",
      "issuer": "<tenant-subdomain>.onmicrosoft.com",
      "issuerAssignedId": "jane@example.com"
    }
  ],
  "passwordProfile": { "password": "<temporary-password>", "forceChangePasswordNextSignIn": false },
  "passwordPolicies": "DisablePasswordExpiration"
}
\`\`\`

- This request needs the \`User.ReadWrite.All\` permission in the external tenant.
- The response contains the user \`id\`. This value is the object ID that the portals store.
- Give the password to the user for the first sign-in. Or tell the user to select **Forgot password?** and set a new password.

## Link Entra identities to SQL users

Each portal keeps its existing SQL Server user table and its own database. You do not have to merge the portal databases.

1. Add a nullable column to the user table of each portal. Add it to all portals before the migration.

   \`\`\`sql
   ALTER TABLE dbo.Users ADD EntraObjectId UNIQUEIDENTIFIER NULL;
   CREATE UNIQUE INDEX UX_Users_EntraObjectId ON dbo.Users (EntraObjectId) WHERE EntraObjectId IS NOT NULL;
   \`\`\`

2. Store the Entra object ID (the \`oid\` claim) in this column.

Match users on \`oid\`, not on email. An email address can change. The object ID does not change. The \`oid\` value of a user is the same in all applications of the tenant. Thus, each portal record for 1 person stores the same \`EntraObjectId\`.

## Configure the pilot .NET portal

Phase 1 covers the .NET portals. Start with 1 portal as the pilot. Phase 2 covers the JavaScript applications. This article does not cover Phase 2.

The portal signs users in with OpenID Connect. Entra authenticates the user and issues the tokens.

1. Install the NuGet packages:

   \`\`\`bash
   dotnet add package Microsoft.Identity.Web
   dotnet add package Microsoft.Identity.Web.UI
   \`\`\`

2. Update \`appsettings.json\`. Keep the secret in Key Vault or user secrets. Do not put it in source control.

   \`\`\`json
   "AzureAd": {
     "Authority": "https://<tenant-subdomain>.ciamlogin.com/",
     "ClientId": "<portal-client-id>",
     "ClientCredentials": [
       { "SourceType": "ClientSecret", "ClientSecret": "<from-key-vault>" }
     ],
     "CallbackPath": "/signin-oidc",
     "SignedOutCallbackPath": "/signout-callback-oidc"
   }
   \`\`\`

3. Update \`Program.cs\`. Entra authenticates the user. The portal authorizes the user from its own SQL record.

   \`\`\`csharp
   builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

   builder.Services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
   {
       var existing = options.Events.OnTokenValidated;
       options.Events.OnTokenValidated = async context =>
       {
           if (existing is not null) await existing(context);

           var objectId = context.Principal!.GetObjectId();
           var userStore = context.HttpContext.RequestServices.GetRequiredService<IPortalUserStore>();
           var portalUser = await userStore.FindByEntraObjectIdAsync(objectId);

           // No SQL record means no access to this portal. Do not create one automatically.
           if (portalUser is null)
           {
               context.Fail("No portal account is linked to this identity.");
               return;
           }

           var identity = (ClaimsIdentity)context.Principal.Identity!;
           identity.AddClaim(new Claim("portal_user_id", portalUser.Id.ToString()));
           foreach (var role in portalUser.Roles)
               identity.AddClaim(new Claim(ClaimTypes.Role, role));
       };
   });

   builder.Services.AddControllersWithViews().AddMicrosoftIdentityUI();
   \`\`\`

4. Implement \`IPortalUserStore\` with the existing user table and roles of the portal. \`IPortalUserStore\` is a placeholder name.

## Protect the portal APIs

The APIs accept OAuth 2.0 access tokens. Entra issues these tokens as JWTs.

1. Register the API in the external tenant.
2. In **Expose an API**, set the Application ID URI. Accept the default value \`api://<api-client-id>\`. Add a scope (for example, \`access_as_user\`).
3. In the registration of each portal, select **API permissions**. Add the scope, then select **Grant admin consent**.
4. Add the API registration values to \`appsettings.json\` in the API project:

   \`\`\`json
   "AzureAd": {
     "Instance": "https://<tenant-subdomain>.ciamlogin.com/",
     "TenantId": "<tenant-id>",
     "ClientId": "<api-client-id>"
   }
   \`\`\`

5. Add this code to \`Program.cs\` in the API project:

   \`\`\`csharp
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApi(builder.Configuration);
   \`\`\`

The API validates the JWT from Entra. Then it finds the \`oid\` of the caller in its SQL user table. The API uses this SQL record for authorization. The portal uses the same rule.

## Call the API from the portal

The portal gets an access token for the signed-in user, then sends it to the API. Microsoft.Identity.Web gets, caches, and refreshes the token. The portal needs a client credential for this step. The client secret from [Register each portal](#register-each-portal) is sufficient.

1. Install the NuGet package in the portal project:

   \`\`\`bash
   dotnet add package Microsoft.Identity.Web.DownstreamApi
   \`\`\`

2. Add the API to \`appsettings.json\` in the portal project:

   \`\`\`json
   "DownstreamApis": {
     "PortalApi": {
       "BaseUrl": "https://<api-host>",
       "Scopes": [ "api://<api-client-id>/access_as_user" ]
     }
   }
   \`\`\`

3. In \`Program.cs\`, add token acquisition to the sign-in code from [Configure the pilot .NET portal](#configure-the-pilot-net-portal):

   \`\`\`csharp
   builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
       .EnableTokenAcquisitionToCallDownstreamApi()
       .AddInMemoryTokenCaches();

   builder.Services.AddDownstreamApis(builder.Configuration.GetSection("DownstreamApis"));
   \`\`\`

4. Call the API from a controller. \`[AuthorizeForScopes]\` signs the user in again if the token cache is empty (for example, after an app restart).

   \`\`\`csharp
   [Authorize]
   [AuthorizeForScopes(ScopeKeySection = "DownstreamApis:PortalApi:Scopes:0")]
   public class OrdersController : Controller
   {
       private readonly IDownstreamApi _downstreamApi;

       public OrdersController(IDownstreamApi downstreamApi)
       {
           _downstreamApi = downstreamApi;
       }

       public async Task<IActionResult> Index()
       {
           var orders = await _downstreamApi.GetForUserAsync<IEnumerable<Order>>(
               "PortalApi",
               options => options.RelativePath = "api/orders");

           return View(orders);
       }
   }
   \`\`\`

5. Change \`OrdersController\`, \`Order\`, and \`api/orders\` to the controllers and API routes of the portal. They are examples.

> **NOTE:** The in-memory token cache is lost when the app restarts, and servers do not share it. If the portal runs on more than 1 server, use \`AddDistributedTokenCaches()\` with Redis or SQL Server.

## Test the pilot

1. Start the pilot portal and open a protected page.
2. Make sure that these results occur:
   - The browser goes to the \`ciamlogin.com\` sign-in page. The page has no sign-up option.
   - A provisioned user with a linked SQL record signs in and gets the portal roles.
   - The portal denies access to a provisioned user without a linked SQL record.
   - The **Forgot password?** link sends a passcode and lets the user set a new password.
   - The portal calls the API with the user token. The API returns data only for users with a linked SQL record.

> **IMPORTANT:** Do not migrate the existing users until the pilot works.

## Migrate existing external users

Entra cannot import the existing password hashes directly. Before the migration starts, select 1 of these options for the passwords:

| Option | How it works |
| --- | --- |
| Password reset | Create each user with a random temporary password. On first sign-in, the user selects **Forgot password?** and sets a new password. |
| Just-in-time password migration | Users keep their current passwords. At first sign-in, Entra sends the password to an endpoint that you build. The endpoint checks the password against the existing SQL user table. If the password is correct, Entra stores it. See [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time). |

If you use just-in-time password migration, keep the existing user tables available during the migration period. Build and test the endpoint before the first migrated user signs in.

Do these steps in sequence:

1. Export the external users from each portal database.
2. Remove duplicate users across portals. Match them by email. Each person gets 1 Entra identity.
3. Create each user in Entra with the Graph request in [Create many users](#create-many-users).
4. Write the returned object ID to \`EntraObjectId\` in each portal record for that person.
5. Tell the users how to sign in.

## Connect the remaining portals

After the migration, connect the other .NET portals 1 at a time. For each portal, do these steps:

1. Register the portal (see [Register each portal](#register-each-portal)).
2. Add the portal to the \`PortalSignIn\` user flow (see [Create the user flow](#create-the-user-flow)). The flow already has sign-up disabled.
3. Configure the portal with the same code as the pilot. If the portal calls an API, also do the steps in [Call the API from the portal](#call-the-api-from-the-portal).
4. Do the pilot tests again on this portal.

## Retire the custom JWT authentication

1. When all portals and APIs use Entra tokens, remove the custom JWT issuer.
2. Remove the custom JWT validation code from each portal and API.
3. Keep the SQL user records. The portals and APIs still use them for authorization.

## Legacy reference: Azure AD B2C

The steps in this section describe Azure AD B2C. They are not the target design. If a step conflicts with the Entra External ID decisions above, the decisions above apply.

> **NOTE:** Dated (checked November 2026): Since May 1, 2025, new customers cannot buy Azure AD B2C. Existing tenants continue to work. Use Microsoft Entra External ID for new projects.

### Create an Azure AD B2C tenant

1. Go to the [Azure Portal](https://portal.azure.com).
2. Search for **Azure AD B2C**, then select **Create a new B2C tenant**.
3. Complete the wizard. Then link the tenant to your subscription.

### Register the web app in B2C

1. In your B2C tenant, select **App registrations > New registration**.
2. Enter these values:
   - Name: \`MyWebApp\`
   - Redirect URI: \`https://localhost:5001/signin-oidc\`. Change it to your app URL.
3. Record the **Application (client) ID**.
4. In **Authentication**, add the Web platform:
   - Set the redirect URI.
   - Enable ID tokens.

### Create a sign-up and sign-in user flow

1. Select **User flows > New user flow**.
2. Select **Sign up and sign in**.
3. Name: \`B2C_1_signupsignin\`
4. Select the identity providers (for example, Email, Google).
5. Add claims (for example, \`email\`, \`name\`).

> **NOTE:** Entra External ID difference: External users cannot register themselves. Internal administrators create each external user. Do not enable self-service sign-up or social identity providers (for example, Google) for the portals. Users sign in only with an account that an administrator created.

### Configure the ASP.NET app

1. Install the NuGet package:

   \`\`\`bash
   dotnet add package Microsoft.AspNetCore.Authentication.AzureADB2C.UI
   \`\`\`

2. Update \`appsettings.json\`:

   \`\`\`json
   "AzureAdB2C": {
     "Instance": "https://<your-tenant-name>.b2clogin.com",
     "ClientId": "<your-web-app-client-id>",
     "Domain": "<your-tenant-name>.onmicrosoft.com",
     "SignUpSignInPolicyId": "B2C_1_signupsignin"
   }
   \`\`\`

3. Update \`Startup.cs\`:

   \`\`\`csharp
   services.AddAuthentication(AzureADB2CDefaults.AuthenticationScheme)
           .AddAzureADB2C(options => Configuration.Bind("AzureAdB2C", options));
   \`\`\`

> **NOTE:** Dated (checked November 2026): ASP.NET Core 6 and later templates have no \`Startup.cs\`. Put the service registration in \`Program.cs\` (with \`builder.Services\` and \`builder.Configuration\`), as in [Configure the pilot .NET portal](#configure-the-pilot-net-portal).

> **NOTE:** Entra External ID difference: The \`Microsoft.AspNetCore.Authentication.AzureADB2C.UI\` package is deprecated. Use \`Microsoft.Identity.Web\` with the External ID authority (\`https://<tenant-subdomain>.ciamlogin.com/\`). The app uses the Entra JWT for authentication only. Each portal keeps its own authorization. It maps the \`oid\` claim to its SQL Server user record.

### Test the sign-in

1. Start your app.
2. Open a protected page.

**Result:** The browser goes to the B2C sign-in page.

> **NOTE:** Entra External ID difference: After sign-in, the portal must find a SQL user record for the Entra identity. If no record exists, deny access. Do not create a portal user automatically.

### Secure API access for external clients

When sign-in works, you can do these steps:

- Protect your API with \`[Authorize]\`.
- Register a separate app for external clients.
- Use the **Client Credentials flow** to get tokens with \`curl\`.

#### Register the API in Azure AD B2C

1. In the Azure Portal, open the B2C tenant. Select **App registrations > New registration**.
2. Enter these values:
   - Name: \`MyWebAPI\`
   - Supported account types: **Accounts in this organizational directory only**
   - Redirect URI: leave blank.
3. Select **Expose an API**.
4. Set the Application ID URI (for example, \`https://mywebapi\`).
5. Add a scope with these values:
   - Scope name: \`access_as_user\`
   - Admin consent display name: \`Access My Web API\`
   - Admin consent description: \`Allows access to My Web API\`
   - State: Enabled
6. Select **Manifest**. In \`appRoles\`, add an app role with \`"allowedMemberTypes": ["Application"]\`. The client credentials flow uses app roles (application permissions), not delegated scopes. See [Set up OAuth 2.0 client credentials flow in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/client-credentials-grant-flow).
7. Select **Save**.

#### Register the external client app

1. Select **App registrations > New registration**.
2. Enter these values:
   - Name: \`ExternalClientApp\`
   - Supported account types: same as the API
3. Select **Certificates & secrets**.
4. Create a client secret. Copy the value.
5. Select **API permissions > Add a permission**.
6. Select **My APIs**, then select \`MyWebAPI\`.
7. Select **Application permissions**, then select the app role that you added to \`MyWebAPI\`.
8. Select **Add permissions**, then select **Grant admin consent**.

#### Get a token with curl

Replace the placeholders with the values from your B2C tenant and app registrations. Replace \`<policy>\` with the name of a user flow or custom policy in the tenant (for example, \`B2C_1_signupsignin\`). All user flows and custom policies support the client credentials flow.

\`\`\`bash
curl -X POST https://<your-b2c-tenant>.b2clogin.com/<your-b2c-tenant>.onmicrosoft.com/<policy>/oauth2/v2.0/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=<external-client-app-id>" \\
  -d "scope=https://mywebapi/.default" \\
  -d "client_secret=<client-secret>" \\
  -d "grant_type=client_credentials"
\`\`\`

The scope is the Application ID URI of the API with \`/.default\`. The token contains the app roles that an administrator granted to the client app.

**Result:** The response is JSON that contains an \`access_token\`.

#### Call the API with curl

Send the token in the \`Authorization\` header:

\`\`\`bash
curl -X GET https://<your-api-endpoint>/api/values \\
  -H "Authorization: Bearer <access_token>"
\`\`\`

### Federation to external identity providers

B2C also supports **custom policies** (Identity Experience Framework). With custom policies, users can sign in with an external Azure AD or Entra ID tenant (for example, a partner or corporate directory). This sign-in can replace a local account or add to it.

Your custom policy (for example, \`B2C_1A_signupsignin\`) defines a user journey. The journey has 1 or more **OIDC technical profiles**. Each technical profile federates to a different upstream tenant. It contains these values:

| Value | Meaning |
| --- | --- |
| \`client_id\` | The app registration for this federation in the **upstream tenant**. It is not your web app registration. It is not a shared "portal" registration. |
| \`METADATA\` URL | Shows the upstream tenant of that registration. |
| \`<Key Id="client_secret" StorageReferenceId="B2C_1A_<ProviderName>Secret" />\` | The **policy key** that holds the client secret for the upstream tenant. |

Each federated provider uses these registrations:

- Your app: a **public client**. It has no secret and usually uses PKCE. This is normal for SPAs and mobile apps.
- 1 **federation app registration** for each upstream tenant: a confidential client. It has a secret.
- Your app registration does not hold this secret. A shared "portal" registration does not hold it.

B2C does not read the federation secret from the app registration. B2C keeps its own copy in a policy key. An administrator uploads this copy manually. This fact is important for the [troubleshooting](#troubleshooting) section.

Example mapping for an app with 2 federated corporate sign-in options:

| Sign-in button | Technical profile | Secret location (upstream app registration) | B2C policy key |
| --- | --- | --- | --- |
| Sign in with Provider A | \`AAD-OpenIdConnect\` | Tenant of Provider A | \`B2C_1A_ProviderASecret\` |
| Sign in with Provider B | \`AAD-OpenIdConnect-ProviderB\` | Tenant of Provider B | \`B2C_1A_ProviderBSecret\` |

## Troubleshooting

| Error | Meaning | First check |
| --- | --- | --- |
| \`AADB2C90289\` | A federated IdP rejected B2C as a client. | Expired or mismatched secret between the federation app registration and its B2C policy key. |

### AADB2C90289 invalid_client on a federated sign-in

#### Symptom

Interactive sign-in opens the browser and goes to a federated sign-in option. Then it fails with this error:

\`\`\`text
AADB2C90289: We encountered an 'invalid_client' error connecting to the identity provider.
\`\`\`

Your MSAL client code shows the error (for example, an \`AcquireTokenInteractive()\` call). The failure is **server-side**. It occurs in the federation between the B2C tenant and the upstream IdP. The failure is not an app code bug.

#### Cause

- The client secret on the **federation app registration** has expired. This registration is in the upstream tenant.
- Client secrets expire after a maximum of 24 months.
- B2C sent the expired secret to the upstream tenant. The upstream tenant rejected B2C as an invalid client.
- B2C shows this rejection as \`AADB2C90289\`.
- To confirm, check the \`updatedUtc\` value of the policy key. If the value is 1 to 2 years old, the secret has probably expired.

#### Diagnosis

1. Make sure that the app uses your B2C custom policy, not a plain user flow. If it does, the failure is probably in the federation, not in your app.
2. In **Azure Portal > Azure AD B2C > Identity Experience Framework > Custom policies**, download these files: the relying-party file, \`TrustFrameworkBase\`, and \`TrustFrameworkExtensions\`.
3. In \`TrustFrameworkExtensions\`, find the sign-up/sign-in journey and its OIDC technical profile.
4. Record the \`client_id\`, the \`METADATA\` URL (the tenant), and the \`StorageReferenceId\` of the \`client_secret\` key.
5. In the upstream tenant, open **App registrations > (the federation app) > Certificates & secrets**. Check if the secret has expired.

#### Fix

1. In the **upstream tenant**, open **App registrations > (the federation app) > Certificates & secrets**.
2. Create a **new client secret**. Copy the value immediately. You cannot see it again later.
3. In the **B2C tenant**, go to portal.azure.com. The Identity Experience Framework blades do not show in entra.microsoft.com.
4. Select **Azure AD B2C > Identity Experience Framework > Policy keys**. Open the policy key from the technical profile (for example, \`B2C_1A_<ProviderName>Secret\`).
5. Use the **manual upload** option to add a new key version:
   - Paste the new secret value.
   - Key usage: **Signature** (default).
   - Activation and expiration dates are optional. If you leave them blank, the key is active immediately and does not expire in B2C.
6. Do **not** use the Generate, RSA, or Certificate options. The key must be a plain secret (\`kty: oct\`). Other key types break the OIDC profile.
7. Test the federated sign-in again. The policy reads the key live, so the fix applies immediately. You do not have to rebuild or redeploy the app.

#### Notes on the fix

- The JSON view of the policy key is **read-only**. It never shows the secret value (\`k\` is always omitted). You cannot fix the key in the JSON view.
- If the key container has no upload button, use 1 of these alternatives:
  - Delete the key and create it again with the same name.
  - Use the Graph API:

    \`\`\`http
    POST https://graph.microsoft.com/beta/trustFramework/keySets/<PolicyKeyName>/uploadSecret
    { "use": "sig", "k": "<new secret value>" }
    \`\`\`

- The Graph request needs the \`TrustFrameworkKeySet.ReadWrite.All\` permission in the B2C tenant.
- In Graph Explorer, add \`?tenant=<your-b2c-tenant>.onmicrosoft.com\` to select the correct tenant. If you do not, the trustFramework endpoint returns 404.

#### Prevention

- Set a calendar reminder a few weeks before each federation secret expires.
- To rotate a secret, create the new secret on the federation app registration **first**. Then upload it as a new version of the matching policy key.
- If you rotate only the app registration secret, sign-in breaks without a warning. B2C uses its stored copy until you update the policy key.
- Each upstream tenant has its own secret and policy key. If you federate to many tenants, check all of them, not only the broken one.

## Related links

- [Microsoft Entra admin center](https://entra.microsoft.com)
- [Azure Portal](https://portal.azure.com)
- [External ID pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-entra-external-id/)
- [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time)
- [Azure AD B2C OAuth 2.0 with Postman](doc:azure-ad-b2c-oauth-postman)
- [cURL commands for REST API calls](doc:curl-rest-api-examples)
`;export{e as default};