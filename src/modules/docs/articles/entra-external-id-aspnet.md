---
title: External identity for ASP.NET web apps with Microsoft Entra External ID
summary: Move ASP.NET portals and APIs from custom JWT authentication or Azure AD B2C to Microsoft Entra External ID, with workforce sign-in for internal staff.
category: Identity and APIs
order: 10
---

# External identity for ASP.NET web apps with Microsoft Entra External ID

This article shows how to set up Microsoft Entra External ID as the identity provider for the users of ASP.NET portals and their APIs. It covers admin-created external accounts, sign-in for internal staff with their workforce (employee) accounts, and the migration of users from custom JWT authentication or from Azure AD B2C. The last part keeps the Azure AD B2C steps as a legacy reference.

Find the sections for your starting point:

| Starting point | Sections |
| --- | --- |
| Portals with custom JWT authentication and SQL user tables | [Migrate users from the portal databases](#migrate-users-from-the-portal-databases), then [Retire the custom JWT authentication](#retire-the-custom-jwt-authentication) |
| Portals that sign in through Azure AD B2C | [Migrate users from Azure AD B2C](#migrate-users-from-azure-ad-b2c), then [Retire Azure AD B2C](#retire-azure-ad-b2c) |
| Both (some portals on each) | Both rows. Migrate the SQL users and the B2C users into the same external tenant, and merge duplicate people into 1 account. |
| Internal staff | [Allow internal staff to sign in with workforce accounts](#allow-internal-staff-to-sign-in-with-workforce-accounts). It replaces staff accounts in the portal SQL tables and B2C custom policies that federate to corporate directories. |

All other sections (tenant, portal registration, user flow, portal code, and APIs) apply to both starting points.

> **NOTE:** Checked against Microsoft Learn in November 2026. Each section links to the source page. Microsoft changes these pages often, so check the linked page before you use a step in production.

## Before you start

### Tenant model

This design uses 2 tenants. Do not merge them.

| Tenant | Holds | Used for |
| --- | --- | --- |
| Workforce tenant (the existing Microsoft Entra ID tenant) | Employees, the Azure subscription, App Service, Key Vault, and SQL Server | Hosting, billing, and the employee identities |
| External tenant (new) | External users and the local accounts of internal staff who sign in through federation | Sign-in for all portals and APIs |

### Azure AD B2C status

- Since May 1, 2025, new customers cannot buy Azure AD B2C. Existing customers can continue to use it.
- Microsoft supports Azure AD B2C until at least May 2030.
- Azure AD B2C P2 was discontinued on March 15, 2026. P2 tenants moved to P1 by the end of March 2026.
- You cannot convert an Azure AD B2C tenant into an External ID tenant. Create a new external tenant. (For B2C tenants with approximately 5 million or more directory objects, see [Choose a migration approach](#choose-a-migration-approach).)
- Register the apps again in the new tenant. App registrations and admin consents do not move from B2C.
- B2C custom policies do not move. External ID uses custom authentication extensions instead. Microsoft does not guarantee one-to-one parity.
- Keep the B2C tenant until the migration is complete.

### Cost

- External ID charges per monthly active user (MAU). An MAU is a unique user who authenticates during a calendar month.
- The first 50,000 MAU of the core offer are free. Above 50,000 MAU, each extra MAU has a fee. See [External ID pricing](https://aka.ms/ExternalIDPricing) for the current rate.
- Each user counts as 1 MAU per month, if the user signs in 1 time or many times.
- The free tier counts active users, not total accounts. The tenant can hold more than 50,000 accounts at no cost if fewer than 50,000 users sign in during a month.
- MAU billing applies to all users in an external tenant, regardless of their `UserType`. Internal staff who sign in to the portals through the workforce federation are users of the external tenant, so they also count as MAU. Admins in the external tenant also count.
- Microsoft adds the MAU of all workforce and external tenants that are linked to the same subscription. B2B guest users (`UserType` = `Guest`) in a linked workforce tenant count toward the same total. Member users of your own workforce tenants do not count when they sign in to those tenants.
- Before you select the subscription, check the number of guest sign-ins in the tenants that are already linked to it.
- Premium add-ons have no free tier. The add-ons for external tenants are M2M authentication, SMS phone authentication, and Go-Local data residency (Australia and Japan only).
- This article uses no add-ons:
  - Password reset uses an email one-time passcode. Email passcodes are not an add-on. Only SMS has a charge.
  - The portals call the APIs on behalf of the signed-in user. M2M authentication (the OAuth 2.0 client credentials flow, an app that calls an API without a user) has a charge for each token request. Do not use client credentials unless you accept this cost.
- Other Azure resources have their own cost:
  - Azure Key Vault for the client secrets.
  - An Azure Function (or other endpoint that you host) and a Key Vault certificate, only for just-in-time password migration.
  - Redis or SQL Server, only for a distributed token cache.
- The B2C tenant continues to charge separately for its own users until you remove it.
- For production, link the external tenant to an Azure subscription. The 30-day trial tenant needs no subscription.
- After you link the subscription, set a budget alert in **Cost Management** at a low amount (for example, $1). The alert sends an email if an add-on or extra MAU causes a charge.

### Roles

| Task | Tenant | Minimum role |
| --- | --- | --- |
| Create the external tenant | Workforce | **Tenant Creator** |
| Register portals and APIs | External | **Application Administrator** or **Application Developer** |
| Disable sign-up on the user flow | External | **External ID User Flow Administrator** |
| Enable self-service password reset | External | **Security Administrator** |
| Create or invite users | External | **User Administrator** |
| Register the external tenant as an app for federation, and grant admin consent | Workforce | **Application Administrator** |
| Add the workforce tenant as an OpenID Connect provider | External | **External Identity Provider Administrator** |
| Set up just-in-time password migration | External | **Application Administrator**, **User Administrator**, and **Authentication Extensibility Password Administrator** |

## Create the external tenant

The external tenant is the central identity provider for all external users: service providers, business partners, and clients. Do not add external users to the existing AD. The existing AD holds internal employees only.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) of the workforce tenant with at least the **Tenant Creator** role (scoped to the subscription or a resource group).
2. Select **Entra ID > Overview > Manage tenants**, then select **Create**.
3. Select **External**, then select **Continue**.
4. Select **Use Azure Subscription**. (The 30-day free trial needs no subscription, but use a subscription for production.)
5. On the **Basics** tab, enter these values:
   - **Tenant Name** (for example, `My External Tenant`).
   - **Domain Name** (for example, `myexternaltenant`). This value is the tenant subdomain.
   - **Country/Region**. You cannot change this value later. For Australia or Japan, a **Go-Local data residency** option also shows (an add-on).
6. Select **Next: Add a subscription**. Select the **Subscription** and the **Resource group** (or select **Create new**). If **Resource group location** shows, select it.
7. Select **Next: Review + Create**, then select **Create**. Tenant creation can take up to 30 minutes. The **Notifications** pane shows the progress.
8. Select the **Settings** icon, then **Directories + subscriptions**. Find the external tenant and select **Switch**. Do all remaining steps in this tenant.
9. Under **Quick navigation**, select **Tenant overview**. On the **Overview** tab, record these values:
   - **Tenant ID**
   - **Primary domain**: `<tenant-subdomain>.onmicrosoft.com`
   - Authority (not shown, build it from the subdomain): `https://<tenant-subdomain>.ciamlogin.com/`

## Host the portals in the workforce tenant

The portals, APIs, and other Azure resources stay in the Azure subscription of the workforce tenant. You do not federate or trust the hosting tenant with the external tenant for hosting. Federation is only for staff sign-in (see [Allow internal staff to sign in with workforce accounts](#allow-internal-staff-to-sign-in-with-workforce-accounts)).

- An external tenant cannot own or manage a subscription. You link it to a subscription that a workforce tenant owns. The link is for billing only.
- To check the link, switch to the external tenant in the [Microsoft Entra admin center](https://entra.microsoft.com), select **Home**, and find the **Billing** section. If no subscription shows, select **Click here to upgrade**, then **Add Subscription**.
- You can move the external tenant to another subscription only if that subscription is in the same workforce tenant.
- An app in App Service can use an app registration from a different tenant. In App Service **Authentication**, the **External configuration** option always uses an app registration in the external tenant. This article uses `Microsoft.Identity.Web` in the portal code instead of the App Service built-in authentication, and that also needs no tenant link.
- A managed identity can replace a client secret (federated identity credential) only in the App Service **Workforce configuration**. For the external tenant, keep the client secret in Key Vault and rotate it.
- To send external tenant sign-in logs to Azure Monitor, sign in to the workforce tenant that owns the subscription. See [Azure Monitor in external tenants](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-azure-monitor).

## Register each portal

Register 1 app for each custom web portal. Register the pilot portal first. Register the other portals when you connect them. All portals and APIs use this tenant for authentication, so an external user signs in to all portals with 1 identity.

1. Get the **Application Administrator** or **Application Developer** role. Switch to the external tenant.
2. Select **Entra ID > App registrations > New registration**, then enter these values:
   - **Name**: the portal name (for example, `PartnerPortal`).
   - **Supported account types**: open the drop-down and select **Single tenant only - <external tenant name>**.
3. Select **Register**. On the **Overview** page, record the **Application (client) ID**.
4. Under **Manage**, select **Authentication**. On the **Redirect URI configuration** tab, select **Add Redirect URI**, then select the **Web** tile. Enter these values, then select **Configure**:
   - **Redirect URI**: `https://localhost:5001/signin-oidc`. Add the URL for each environment later.
   - **Front-channel logout URL**: `https://localhost:5001/signout-oidc`.
5. Select **Certificates & secrets > Client secrets > New client secret**. Enter a description, select an expiration (24 months maximum; Microsoft recommends less than 12 months), then select **Add**. Copy the **Value** immediately and store it in Azure Key Vault. The value is not shown again.
6. Select **API permissions**, then select **Grant admin consent for <tenant name>** and **Yes**. Users in an external tenant cannot consent themselves.
7. Set a reminder before the secret expires. The [troubleshooting](#troubleshooting) section shows what occurs when a secret expires.

> **NOTE:** Microsoft recommends a certificate instead of a client secret for production apps. To use a certificate, select **Certificates & secrets > Certificates > Upload certificate** (`.cer`, `.pem`, or `.crt`), and configure `Microsoft.Identity.Web` with the certificate instead of `ClientSecret`.

## Configure sign-in without self-registration

External users cannot register themselves. Only internal administrators create external accounts (see [Provision external users](#provision-external-users)).

All portals use the **Email with password** sign-in method:

- Administrators create each account with a password.
- Entra fixes the sign-in method of a user when it creates the account. If the method of a user flow changes later, existing users keep their original method.
- Thus, 1 method for all portals gives each user the same sign-in on every portal.

Use 1 user flow for all portals. One user flow can serve many applications. An application can have only 1 user flow.

### Create the user flow

1. Select **Entra ID > External Identities > User flows > New user flow**, then enter these values:
   - Name: `PortalSignIn`
   - Identity providers: select the **Email Accounts** check box, then select **Email with password**.
   - Do not add social identity providers.
2. Select **Create**.
3. Open the user flow. Under **Use**, select **Applications > Add application**, then add the pilot portal.

### Disable sign-up

The admin center has no option to disable sign-up on the user flow, and it does not show the user flow ID. Use Microsoft Graph. See [Disable sign-up in a user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-disable-sign-up-user-flow).

1. Select **Entra ID > External Identities > User flows**, then select the user flow. Under **Use**, select **Applications**. Copy the **Application (client) ID** of the pilot portal.
2. Get the user flow ID with this request:

   ```http
   GET https://graph.microsoft.com/beta/identity/authenticationEventsFlows?$filter=microsoft.graph.externalUsersSelfServiceSignUpEventsFlow/conditions/applications/includeApplications/any(appId:appId/appId eq '<portal-client-id>')
   ```

3. Disable sign-up with this request:

   ```http
   PATCH https://graph.microsoft.com/beta/identity/authenticationEventsFlows/<user-flow-id>
   {
     "@odata.type": "#microsoft.graph.externalUsersSelfServiceSignUpEventsFlow",
     "onInteractiveAuthFlowStart": {
       "@odata.type": "#microsoft.graph.onInteractiveAuthFlowStartExternalUsersSelfServiceSignUp",
       "isSignUpAllowed": false
     }
   }
   ```

The GET request needs the `EventListener.Read.All` permission. The PATCH request needs `EventListener.ReadWrite.All`. The least-privileged admin role is **External ID User Flow Administrator**. Existing users can still sign in. To enable sign-up again, send the same PATCH with `"isSignUpAllowed": true`.

### Enable self-service password reset

Users need self-service password reset to set their own password (see [Migrate users from the portal databases](#migrate-users-from-the-portal-databases)). See [Enable self-service password reset](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-enable-password-reset-customers).

1. Sign in with at least the **Security Administrator** role.
2. Select **Entra ID > External Identities > User flows**, then open `PortalSignIn`. Under **Identity providers**, make sure that **Email with password** is selected.
3. Select **Entra ID > Authentication methods**. Under **Policies > Method**, select **Email OTP**.
4. Under **Enable and Target**, turn on **Email OTP**. Under **Include**, select **All users**.
5. Select **Save**.
6. To show the link on the sign-in page, open **Company Branding**. Under **Default sign-in**, select **Edit**. On the **Sign-in form** tab, select **Show self-service password reset**, then select **Review + save** and **Save**.

**Result:** The sign-in page shows a **Forgot password?** link. Entra sends a one-time passcode to the user email, then the user sets a new password.

> **NOTE:** SMS is also a reset method, but each SMS has a charge (an add-on). This article uses Email OTP only.

## Provision external users

Internal administrators create and manage all external users. You need at least the **User Administrator** role.

### Create one user

1. Select **Entra ID > Users**, then select **New user > Create new external user**.
2. Next to **Identities**, under **Sign-in method**, select **Email**. Under **Value**, enter the user email address. It becomes the sign-in name.
3. Next to **Display name**, enter the first and last name.
4. Select **Copy to clipboard** next to the autogenerated **Password**. Give this password to the user for the first sign-in.
5. Select **Review + create**.

To reset a password, select the user, then select **Reset password**. The temporary password does not expire. The user must change it at the next sign-in.

### Create many users

To create many users (for example, for migration), use Microsoft Graph:

```http
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
```

- This request needs the `User.ReadWrite.All` permission in the external tenant.
- The response contains the user `id`. This value is the object ID that the portals store.
- Give the password to the user for the first sign-in. Or tell the user to select **Forgot password?** and set a new password.

## Allow internal staff to sign in with workforce accounts

Internal staff sign in to the portals with their existing workforce account. You add the workforce tenant to the external tenant as an OpenID Connect (OIDC) identity provider. This is federation from the external tenant to the workforce tenant. See [Add Microsoft Entra ID for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-entra-id-federation-customers).

How the federation works:

- The user always authenticates in the workforce tenant. The Conditional Access, MFA, device, and risk policies of the workforce tenant apply.
- The external tenant keeps a user object for each staff member, with a federated identity. The portals receive the `oid` of that external tenant user object, not the `oid` of the workforce user.
- External ID does not currently trust MFA from the workforce tenant. If the external tenant also requires MFA, the user does MFA again.
- Each staff member who signs in counts as 1 MAU in the external tenant.
- You can add more than 1 workforce tenant. Each one is a separate OIDC provider.

### Register the external tenant in the workforce tenant

Do these steps in the **workforce tenant**.

1. Select **Entra ID > App registrations > New registration**, then enter these values:
   - **Name**: for example, `External ID federation`.
   - **Supported account types**: select **Single tenant only - <workforce tenant name>**.
2. Select **Register**.
3. Under **Manage**, select **Authentication**. On the **Redirect URI configuration** tab, select **Add Redirect URI**, select the **Web** tile, and add these redirect URIs. If the external tenant uses a custom domain, also add `https://<tenant-subdomain>.ciamlogin.com/<custom-domain>/federation/oauth2`.

   ```text
   https://<tenant-subdomain>.ciamlogin.com/<external-tenant-ID>/federation/oauth2
   https://<tenant-subdomain>.ciamlogin.com/<tenant-subdomain>.onmicrosoft.com/federation/oauth2
   ```

4. Select **Certificates & secrets > Client secrets > New client secret**, then select **Add**. Copy the secret **Value**, not the secret ID. Set a reminder before it expires.
5. Select **Token configuration > Add optional claim**. Select the **ID** token type, select `email`, then select **Add**. External ID needs the email claim. Without it, sign-in fails with "No email address was obtained from the external OIDC identity provider."
6. Select **API permissions > Add a permission > Microsoft Graph > Delegated permissions**. Select `email`, `openid`, `profile`, and `User.Read`, then select **Add permissions**.
7. Select **Grant admin consent for <workforce tenant name>**, then select **Yes**.
8. On the **Overview** page, record the **Application (client) ID** and the **Directory (tenant) ID**.

### Add the workforce tenant as an identity provider

Do these steps in the **external tenant**, with at least the **External Identity Provider Administrator** role. See [Add OIDC for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-custom-oidc-federation-customers).

1. Select **Entra ID > External Identities > All identity providers**.
2. Select the **Custom** tab, then select **Add new > Open ID Connect**.
3. Enter these values:

| Setting | Value |
| --- | --- |
| Display name | The text on the sign-in button, for example `Sign in with your company account` |
| Well-known endpoint | `https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration` |
| OpenID Issuer URI | `https://login.microsoftonline.com/<workforce-tenant-ID>/v2.0` or `https://login.microsoftonline.com/<workforce>.onmicrosoft.com/v2.0` |
| Client ID | The application (client) ID from the workforce tenant registration |
| Client Authentication | `client_secret_post` |
| Client Secret | The secret value from the workforce tenant registration |
| Scope | `openid profile` |
| Response type | `code` |

4. Select **Next: Claims mapping**. Keep **Email** mapped. Email is required by default.
5. Select **Review + create**.

> **IMPORTANT:** In the OpenID Issuer URI, use only the workforce tenant ID (GUID) or its `onmicrosoft.com` domain. A verified custom domain (for example, `contoso.com`) is not supported as the issuer. If you plan to use `domain_hint`, use the `onmicrosoft.com` form.

> **NOTE:** The Microsoft Entra ID federation page lists the client authentication value as `client_secret`. The OIDC provider page lists `client_secret_post` and `client_secret_jwt` as the supported methods. `client_secret_basic` and `private_key_jwt` are not supported. Select the `client_secret_post` option that the admin center shows.

### Choose how staff accounts are created

Sign-up is disabled on `PortalSignIn`, so a staff member cannot create an account with the federation button. Use 1 of these documented methods.

| Method | How it works | Use it when |
| --- | --- | --- |
| Invitation with `domain_hint` (recommended) | You invite the user without the default email. Your own email links to the portal with `domain_hint`. At first sign-in, the user authenticates in the workforce tenant and External ID adds the federated identity to the invited user object. | You want admin-controlled access with sign-up disabled. The identity provider does not have to be in the user flow. |
| Federation button in the user flow | You add the provider to the user flow. The sign-in page shows a button. | Sign-up is enabled. The first sign-in creates the account automatically. |
| Create the user with Microsoft Graph | You create the user object with a federated identity before the first sign-in. | Bulk provisioning or migration of staff accounts. |

> **NOTE:** Microsoft Learn does not document what occurs when a staff member without an account selects the federation button while sign-up is disabled. Do not depend on that path. Use an invitation or Graph, and test with a non-production user flow first.

### Invite a staff member

See [Route invited users to an external identity provider](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-invite-external-identity-provider-users-customers).

1. Create the invitation without the Microsoft email:

   ```http
   POST https://graph.microsoft.com/v1.0/invitations
   Content-Type: application/json

   {
     "invitedUserEmailAddress": "jane.smith@contoso.com",
     "inviteRedirectUrl": "https://<portal-url>",
     "sendInvitationMessage": false
   }
   ```

   **Result:** External ID creates a user object with `externalUserState` set to `PendingAcceptance`. The response contains the user `id`.
2. Write the user `id` to `EntraObjectId` in the SQL record of the staff member (see [Link Entra identities to SQL users](#link-entra-identities-to-sql-users)).
3. Send your own email with a link to a portal route that starts sign-in with `domain_hint`, for example `https://<portal-url>/account/signin?domain_hint=<workforce>.onmicrosoft.com`. Use the tenant domain, not the tenant ID.
4. In the portal, pass the value to the authorization request:

   ```csharp
   builder.Services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
   {
       var existingRedirect = options.Events.OnRedirectToIdentityProvider;
       options.Events.OnRedirectToIdentityProvider = async context =>
       {
           if (existingRedirect is not null) await existingRedirect(context);

           var domainHint = context.HttpContext.Request.Query["domain_hint"].ToString();
           if (domainHint == "<workforce>.onmicrosoft.com")
               context.ProtocolMessage.DomainHint = domainHint;
       };
   });
   ```

   Accept only the domains that you federate. Do not pass any value from the query string.

**Result:** At first sign-in, External ID adds a federated identity to the user object and changes `externalUserState` to `Accepted`. Later sign-ins need no `domain_hint`: the user enters the email address and External ID redirects to the workforce tenant.

> **NOTE:** When the request has `domain_hint`, the sign-in page shows a domain confirmation dialog. You cannot hide it. You also cannot hide identity provider buttons on the sign-in page.

### Create staff accounts with Microsoft Graph

For many staff members, create the users before their first sign-in. Microsoft Learn shows this request body:

```http
POST https://graph.microsoft.com/v1.0/users
Content-type: application/json

{
  "accountEnabled": true,
  "displayName": "Jane Smith",
  "givenName": "Jane",
  "surname": "Smith",
  "mail": "jane.smith@contoso.com",
  "identities": [
    {
      "signInType": "federated",
      "issuer": "https://login.microsoftonline.com/<workforce-primary-domain>/v2.0<external-tenant-ID>",
      "issuerAssignedId": "<workforce-user-object-ID>"
    }
  ]
}
```

- `<workforce-primary-domain>` is the primary domain of the workforce tenant, for example `contoso.onmicrosoft.com`.
- `<external-tenant-ID>` is the directory ID of the external tenant.
- `<workforce-user-object-ID>` is the object ID of the user in the workforce tenant.

> **NOTE:** The `issuer` value is copied exactly from Microsoft Learn. Before a bulk run, create 1 test user, sign in with it, and make sure that sign-in matches the existing user and does not fail or create a second account.

## Link Entra identities to SQL users

Each portal keeps its existing SQL Server user table and its own database. You do not have to merge the portal databases.

1. Add a nullable column to the user table of each portal. Add it to all portals before the migration.

   ```sql
   ALTER TABLE dbo.Users ADD EntraObjectId UNIQUEIDENTIFIER NULL;
   CREATE UNIQUE INDEX UX_Users_EntraObjectId ON dbo.Users (EntraObjectId) WHERE EntraObjectId IS NOT NULL;
   ```

2. Store the Entra object ID (the `oid` claim) in this column.

Match users on `oid`, not on email. An email address can change. The object ID does not change. The `oid` value of a user is the same in all applications of the tenant. Thus, each portal record for 1 person stores the same `EntraObjectId`.

## Configure the pilot .NET portal

Phase 1 covers the .NET portals. Start with 1 portal as the pilot. Phase 2 covers the JavaScript applications. This article does not cover Phase 2.

The portal signs users in with OpenID Connect. Entra authenticates the user and issues the tokens.

1. Install the NuGet packages:

   ```bash
   dotnet add package Microsoft.Identity.Web
   dotnet add package Microsoft.Identity.Web.UI
   ```

2. Update `appsettings.json`. Keep the secret in Key Vault or user secrets. Do not put it in source control.

   ```json
   "AzureAd": {
     "Authority": "https://<tenant-subdomain>.ciamlogin.com/",
     "ClientId": "<portal-client-id>",
     "ClientCredentials": [
       { "SourceType": "ClientSecret", "ClientSecret": "<from-key-vault>" }
     ],
     "CallbackPath": "/signin-oidc",
     "SignedOutCallbackPath": "/signout-callback-oidc"
   }
   ```

3. Update `Program.cs`. Entra authenticates the user. The portal authorizes the user from its own SQL record.

   ```csharp
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
   ```

4. Implement `IPortalUserStore` with the existing user table and roles of the portal. `IPortalUserStore` is a placeholder name.

## Protect the portal APIs

The APIs accept OAuth 2.0 access tokens. Entra issues these tokens as JWTs.

1. Register the API in the external tenant: **Entra ID > App registrations > New registration**, **Supported account types**: **Single tenant only - <external tenant name>**. An API needs no redirect URI.
2. Under **Manage**, select **Owners > Add owners** and add an owner. Assign an owner to the API and to each portal registration. If the apps have no owner, the API does not show under **My APIs**.
3. Select **Expose an API**. Next to **Application ID URI**, select **Add**. Keep the default value `api://<api-client-id>`, then select **Save**.
4. Select **Add a scope** and enter these values, then select **Add scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: **Admins only**
   - **Admin consent display name**: `Access the portal API`
   - **Admin consent description**: `Allows the portal to call the API for the signed-in user.`
   - **State**: **Enabled**
5. In the registration of each portal, select **API permissions > Add a permission > My APIs**. Select the API, select **Delegated permissions**, select `access_as_user`, then select **Add permissions**.
6. Select **Grant admin consent for <tenant name>**, then select **Yes**.
7. Add the API registration values to `appsettings.json` in the API project:

   ```json
   "AzureAd": {
     "Instance": "https://<tenant-subdomain>.ciamlogin.com/",
     "TenantId": "<tenant-id>",
     "ClientId": "<api-client-id>"
   }
   ```

8. Add this code to `Program.cs` in the API project:

   ```csharp
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApi(builder.Configuration);
   ```

The API validates the JWT from Entra. Then it finds the `oid` of the caller in its SQL user table. The API uses this SQL record for authorization. The portal uses the same rule.

## Call the API from the portal

The portal gets an access token for the signed-in user, then sends it to the API. Microsoft.Identity.Web gets, caches, and refreshes the token. The portal needs a client credential for this step. The client secret from [Register each portal](#register-each-portal) is sufficient.

1. Install the NuGet package in the portal project:

   ```bash
   dotnet add package Microsoft.Identity.Web.DownstreamApi
   ```

2. Add the API to `appsettings.json` in the portal project:

   ```json
   "DownstreamApis": {
     "PortalApi": {
       "BaseUrl": "https://<api-host>",
       "Scopes": [ "api://<api-client-id>/access_as_user" ]
     }
   }
   ```

3. In `Program.cs`, add token acquisition to the sign-in code from [Configure the pilot .NET portal](#configure-the-pilot-net-portal):

   ```csharp
   builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
       .EnableTokenAcquisitionToCallDownstreamApi()
       .AddInMemoryTokenCaches();

   builder.Services.AddDownstreamApis(builder.Configuration.GetSection("DownstreamApis"));
   ```

4. Call the API from a controller. `[AuthorizeForScopes]` signs the user in again if the token cache is empty (for example, after an app restart).

   ```csharp
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
   ```

5. Change `OrdersController`, `Order`, and `api/orders` to the controllers and API routes of the portal. They are examples.

> **NOTE:** The in-memory token cache is lost when the app restarts, and servers do not share it. If the portal runs on more than 1 server, use `AddDistributedTokenCaches()` with Redis or SQL Server.

## Test the pilot

1. Start the pilot portal and open a protected page.
2. Make sure that these results occur:
   - The browser goes to the `ciamlogin.com` sign-in page. The page has no sign-up option.
   - A provisioned user with a linked SQL record signs in and gets the portal roles.
   - The portal denies access to a provisioned user without a linked SQL record.
   - The **Forgot password?** link sends a passcode and lets the user set a new password.
   - The portal calls the API with the user token. The API returns data only for users with a linked SQL record.
   - An invited staff member opens the `domain_hint` link, signs in at the workforce tenant, and gets the portal roles. A second sign-in without `domain_hint` also goes to the workforce tenant.

> **IMPORTANT:** Do not migrate the existing users until the pilot works.

## Migrate users from the portal databases

This section is for users that the portals keep in their own SQL tables (the custom JWT authentication). For users in Azure AD B2C, see [Migrate users from Azure AD B2C](#migrate-users-from-azure-ad-b2c).

Entra cannot import the existing password hashes directly. Before the migration starts, select 1 of these options for the passwords:

| Option | How it works |
| --- | --- |
| Password reset | Create each user with a random temporary password. On first sign-in, the user selects **Forgot password?** and sets a new password. |
| Just-in-time password migration | Users keep their current passwords. At first sign-in, External ID sends the encrypted password to an endpoint that you build. The endpoint checks the password against the existing SQL user table. If the password is correct, External ID stores it. See [Set up just-in-time password migration](#set-up-just-in-time-password-migration). |

If you use just-in-time password migration, keep the existing user tables available during the migration period. Build and test the endpoint before the first migrated user signs in.

Do these steps in sequence:

1. Export the external users from each portal database.
2. Remove duplicate users across portals. Match them by email. Each person gets 1 Entra identity.
3. Create each user in Entra with the Graph request in [Create many users](#create-many-users).
4. Write the returned object ID to `EntraObjectId` in each portal record for that person.
5. Tell the users how to sign in.

## Migrate users from Azure AD B2C

Use this section if users sign in through Azure AD B2C today. Microsoft calls the main path the **standard migration**: you create users in the new external tenant, migrate passwords if necessary, then move each app to External ID. See [Plan your migration from Azure AD B2C to External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/plan-your-migration-from-b2c-to-external-id) and [Migrate from Azure AD B2C to External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/migrate-from-b2c-to-external-id).

### Choose a migration approach

| Approach | Use it when | Notes |
| --- | --- | --- |
| Standard migration | Most tenants. | New external tenant, new app registrations, bulk user migration, optional password migration, then app cutover. |
| High Scale Compatibility (HSC) mode | The B2C tenant has approximately 5 million or more directory objects, and you accept the limitations. | Users and credentials stay in the B2C tenant. B2C and External ID run side by side in the same tenant, and you move apps in phases. No social identity providers, no passkeys, no age gating, no admin center experience, and limited Conditional Access. |

If the tenant is below the HSC threshold, HSC mode gives no benefit. Use the standard migration.

### Assess the B2C tenant

List the apps, user flows, custom policies, identity providers, claims, and custom logic. Then map each item:

| B2C feature | External ID equivalent |
| --- | --- |
| Custom policies (XML, Identity Experience Framework) | Custom authentication extensions |
| Hosted pages with HTML and CSS | User flows with branding, or native authentication |
| User management with Microsoft Graph | Microsoft Graph (no change) |
| Custom policy access rules and user flow conditions | Microsoft Entra Conditional Access |
| Custom claims in policies | Custom authentication extensions |

Known gaps:

- Social identity providers that a B2C custom policy configures do not move. Configure them again with the built-in External ID social providers. Third-party identity providers from custom policies are not supported.
- Age gating is not supported in External ID.
- User Insights is retired on August 31, 2026. Use Azure Monitor with Log Analytics.

### Migrate the user accounts

Bulk user migration is always necessary, also when you migrate passwords. See [Migrate users and credentials to External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-users).

1. Clean up the data before you start. Migrate only the attributes that you need. Do not migrate stale accounts. Do not store regulated data (card numbers, ID numbers, medical records) in External ID.
2. If you plan to migrate passwords, create a Boolean custom attribute that flags the users who still need migration:
   - In the external tenant, select **Entra ID > External Identities > Custom user attributes > Add**.
   - Name: `toBeMigrated`. Data Type: **Boolean**. Select **Create**.
3. Get the attribute ID. In **App registrations > All applications**, copy the **Application (client) ID** of `b2c-extensions-app`. Remove the hyphens. The attribute ID is `extension_<client-id-without-hyphens>_toBeMigrated`.
4. Read the users from the B2C tenant with Microsoft Graph.
5. Create each user in the external tenant. Use a unique, strong, random temporary password for each user. The request combines the email identity from [Create many users](#create-many-users) with the migration flag:

   ```http
   POST https://graph.microsoft.com/v1.0/users
   {
     "accountEnabled": true,
     "displayName": "Jane Smith",
     "mail": "jane@example.com",
     "identities": [
       {
         "signInType": "emailAddress",
         "issuer": "<tenant-subdomain>.onmicrosoft.com",
         "issuerAssignedId": "jane@example.com"
       }
     ],
     "passwordProfile": { "password": "<unique-random-password>", "forceChangePasswordNextSignIn": false },
     "extension_<client-id-without-hyphens>_toBeMigrated": true
   }
   ```

6. Store the new user `id` in the `EntraObjectId` column of each portal (see [Link Entra identities to SQL users](#link-entra-identities-to-sql-users)). The external tenant gives each user a new object ID, so the `oid` from B2C does not match.

> **NOTE:** Microsoft Graph throttles large imports. Send the requests in batches and retry after a throttling response. See [Microsoft Graph throttling guidance](https://learn.microsoft.com/en-us/graph/throttling).

### Choose a password option

| Option | How it works | Use it when |
| --- | --- | --- |
| No password migration | Users reset their password with self-service password reset after migration. | You accept a reset, or users move to email one-time passcode. |
| Just-in-time (JIT) migration | Apps already use External ID. At first sign-in, External ID calls your endpoint, which checks the password against B2C. If it is correct, External ID stores it. | Users must keep their passwords. The [Microsoft Entra release notes](https://learn.microsoft.com/en-us/entra/fundamentals/whats-new) list JIT password migration as generally available since March 2026. |
| B2C-initiated migration | Apps stay on B2C. A B2C custom policy calls your REST API at each sign-in, which writes the password to External ID. When enough users are migrated, the apps move. | You cannot move the apps yet. |

With JIT and B2C-initiated migration, both tenants run together for a time. Plan for these points:

- Users who never sign in do not migrate. Plan a password reset or a final bulk pass, and set a fixed cutover date.
- Profile changes, password changes, and new accounts must stay aligned in both tenants. Reconcile them at intervals.
- Keep the coexistence period short.

### Set up just-in-time password migration

This procedure is the same for B2C and for the portal databases. Only the password check in your endpoint is different. See [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time).

1. **Create the encryption certificate.** In Azure Key Vault, generate a certificate with key type **RSA**. External ID encrypts the password with its public key (RSA JWE). The private key stays in Key Vault.
2. **Host the endpoint.** Build an HTTPS endpoint, usually an Azure Function. Give it a managed identity with read access to the certificate. Deploy it in a secure identity subscription with limited RBAC.
3. **Handle the request.** External ID sends a payload like this one (shortened). The `encryptedPasswordContext` value is a JWE that contains `user-password`, `username`, and `nonce`.

   ```json
   {
     "type": "microsoft.graph.authenticationEvent.passwordSubmit",
     "data": {
       "@odata.type": "microsoft.graph.onPasswordSubmitCalloutData",
       "tenantId": "<external-tenant-ID>",
       "encryptedPasswordContext": "<5-part-JWE>",
       "authenticationContext": { "user": { "id": "<user-id>", "mail": "jane@example.com" } }
     }
   }
   ```

4. **Return an action.** Decrypt the JWE, check the password against the legacy system, then return 1 action and the same `nonce`:

   ```json
   {
     "data": {
       "@odata.type": "microsoft.graph.onPasswordSubmitResponseData",
       "actions": [ { "@odata.type": "microsoft.graph.passwordSubmit.MigratePassword" } ],
       "nonce": "<nonce-from-the-request>"
     }
   }
   ```

   | Action | When to return it | Result |
   | --- | --- | --- |
   | `microsoft.graph.passwordSubmit.MigratePassword` | The password is correct. | External ID stores the password and sets the flag to `false`. |
   | `microsoft.graph.passwordSubmit.UpdatePassword` | The password is correct but weak or expired. | The user goes through a password reset. |
   | `microsoft.graph.passwordSubmit.Retry` | The password is incorrect. | The user can try again. |
   | `microsoft.graph.passwordSubmit.Block` | Sign-in must stop, for example the legacy account is locked. | The user sees a block screen. |

5. **Register the extension app.** In the external tenant, register an app with **Supported account types**: **Single tenant only - <external tenant name>**. Under **Manage**, select **Manifest** and set `"identifierUris": ["api://<function-host>/<extension-app-client-ID>"]`. Select **API permissions > Add a permission > Microsoft Graph > Application permissions**, select `CustomAuthenticationExtension.Receive.Payload`, select **Add permissions**, then select **Grant admin consent for <tenant name>**.
6. **Add the public key.** Download the certificate in CER format, then get its Base64 value in PowerShell:

   ```powershell
   $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("<path>\jitmigrationencryptioncert.cer")
   [Convert]::ToBase64String($cert.RawData)
   ```

   Add it to the extension app. Use the same new GUID for `keyId` and `tokenEncryptionKeyId`:

   ```http
   PATCH https://graph.microsoft.com/v1.0/applications/<extension-app-object-ID>
   {
     "keyCredentials": [
       {
         "endDateTime": "<certificate-end-date>",
         "keyId": "<new-guid>",
         "startDateTime": "<certificate-start-date>",
         "type": "AsymmetricX509Cert",
         "usage": "Encrypt",
         "key": "<base64-public-key>",
         "displayName": "CN=JitMigration"
       }
     ],
     "tokenEncryptionKeyId": "<new-guid>"
   }
   ```

7. **Create the custom authentication extension:**

   ```http
   POST https://graph.microsoft.com/beta/identity/customAuthenticationExtensions
   {
     "@odata.type": "#microsoft.graph.onPasswordSubmitCustomExtension",
     "displayName": "OnPasswordSubmitCustomExtension",
     "description": "Validate password",
     "endpointConfiguration": {
       "@odata.type": "#microsoft.graph.httpRequestEndpoint",
       "targetUrl": "<function-url>"
     },
     "authenticationConfiguration": {
       "@odata.type": "#microsoft.graph.azureAdTokenAuthentication",
       "resourceId": "api://<function-host>/<extension-app-client-ID>"
     },
     "clientConfiguration": {
       "timeoutInMilliseconds": 2000,
       "maximumRetries": 1
     }
   }
   ```

8. **Connect the extension to each portal.** Create 1 listener with the client IDs of the portals:

   ```http
   POST https://graph.microsoft.com/beta/identity/authenticationEventListeners
   {
     "@odata.type": "#microsoft.graph.onPasswordSubmitListener",
     "conditions": {
       "applications": {
         "includeAllApplications": false,
         "includeApplications": [ { "appId": "<portal-client-id>" } ]
       }
     },
     "priority": 500,
     "handler": {
       "@odata.type": "#microsoft.graph.onPasswordMigrationCustomExtensionHandler",
       "migrationPropertyId": "extension_<client-id-without-hyphens>_toBeMigrated",
       "customExtension": { "id": "<custom-extension-object-ID>" }
     }
   }
   ```

9. **Test with a few users.** Make sure that the flag changes to `false` after a successful sign-in, that each action works, and that no password shows in logs.

> **WARNING:** For B2C, the official sample ([b2c-to-meeid-migration-tool](https://github.com/microsoft/b2c-to-meeid-migration-tool), marked preview and sample) checks the password with the B2C resource owner password credentials (ROPC) flow. The [B2C ROPC page](https://learn.microsoft.com/en-us/azure/active-directory-b2c/add-ropc-policy) says that server-to-server ROPC calls are not supported: B2C identity protection sees only the server IP address and can block it after repeated failures. ROPC also fails when B2C needs user interaction, for example MFA or an expired password. Test with production-like volumes, and return `Retry` or `Block` when the check fails.

> **NOTE:** External ID applies its own password complexity rules. If a correct B2C password is weaker, the user must reset it (`UpdatePassword`). The `disableStrongPassword` option relaxes only the complexity check during JIT migration (the 8-character minimum stays). Microsoft says to confirm its current configuration in the JIT page before you use it. In native authentication, a correct but weak password currently returns an error instead of the reset flow.

> **NOTE:** If you use the B2C-initiated approach instead, protect the REST API against brute-force attacks. Stop serving requests when the number of sign-in attempts passes a threshold.

### Validate and cut over

1. Test sign-in, password reset, token claims, API calls, and the custom authentication extension for each portal.
2. Move each app to the External ID authority (see [Configure the pilot .NET portal](#configure-the-pilot-net-portal)). Every app must change: the migration is not complete until the last app moves.
3. Send the sign-in logs to Azure Monitor and watch for `CustomExtensionTimedOut` and `CustomExtensionThrottlingError`.
4. After the cutover date, reset or bulk-migrate the users who did not sign in. Then remove the listener and retire the B2C tenant.

## Connect the remaining portals

After the migration, connect the other .NET portals 1 at a time. For each portal, do these steps:

1. Register the portal (see [Register each portal](#register-each-portal)).
2. Add the portal to the `PortalSignIn` user flow (see [Create the user flow](#create-the-user-flow)). The flow already has sign-up disabled.
3. Configure the portal with the same code as the pilot. If the portal calls an API, also do the steps in [Call the API from the portal](#call-the-api-from-the-portal).
   - Custom JWT portal: add the External ID sign-in next to the custom JWT code. Remove the custom JWT code later (see [Retire the custom JWT authentication](#retire-the-custom-jwt-authentication)).
   - B2C portal: replace the B2C configuration (the `b2clogin.com` instance, the B2C client ID, and the user flow or custom policy ID) with the External ID configuration. A B2C app registration does not work in the external tenant.
4. If the portal uses just-in-time password migration, add its client ID to the `includeApplications` list of the listener (see [Set up just-in-time password migration](#set-up-just-in-time-password-migration)).
5. Do the pilot tests again on this portal.

## Retire the custom JWT authentication

1. When all portals and APIs use Entra tokens, remove the custom JWT issuer.
2. Remove the custom JWT validation code from each portal and API.
3. Keep the SQL user records. The portals and APIs still use them for authorization.

## Retire Azure AD B2C

Do these steps only after all apps use External ID and the cutover date has passed (see [Validate and cut over](#validate-and-cut-over)).

1. Remove the B2C configuration and packages from each portal and API.
2. Reset or bulk-migrate the users who did not sign in during the JIT period. Then delete the JIT listener and the custom authentication extension.
3. Remove the B2C federation secrets and policy keys for corporate directories. The workforce federation in the external tenant replaces them.
4. Keep the B2C tenant until no app calls it. B2C charges for its own MAU until you remove it.
5. Delete the B2C tenant. The steps are in the [Azure AD B2C FAQ](https://learn.microsoft.com/en-us/azure/active-directory-b2c/faq) under "How do I delete my Azure AD B2C tenant?".

## Legacy reference: Azure AD B2C

The steps in this section describe Azure AD B2C. They are not the target design. If a step conflicts with the Entra External ID decisions above, the decisions above apply.

> **NOTE:** Dated (checked November 2026): Since May 1, 2025, new customers cannot buy Azure AD B2C. Existing tenants continue to work. Use Microsoft Entra External ID for new projects.

### Create an Azure AD B2C tenant

1. Go to the [Azure Portal](https://portal.azure.com).
2. Search for **Azure AD B2C**, then select **Create a new B2C tenant**.
3. Complete the wizard. Then link the tenant to your subscription.

### Register the web app in B2C

1. In the [Azure portal](https://portal.azure.com), switch to the B2C tenant, search for and select **Azure AD B2C**, then select **App registrations > New registration**.
2. Enter these values:
   - **Name**: `MyWebApp`
   - **Supported account types**: **Accounts in any identity provider or organizational directory (for authenticating users with user flows)**
   - **Redirect URI**: select **Web**, then enter `https://localhost:5001/signin-oidc`. Change it to your app URL.
   - **Permissions**: select **Grant admin consent to openid and offline_access permissions**.
3. Select **Register**, then record the **Application (client) ID**.
4. Only to test a user flow with `https://jwt.ms`: select **Authentication**. Under **Implicit grant and hybrid flows**, select **ID tokens (used for implicit and hybrid flows)**, then select **Save**. Turn it off before production.

### Create a sign-up and sign-in user flow

1. Select **User flows > New user flow**.
2. Select **Sign up and sign in**.
3. Name: `B2C_1_signupsignin`
4. Select the identity providers (for example, Email, Google).
5. Add claims (for example, `email`, `name`).

> **NOTE:** Entra External ID difference: External users cannot register themselves. Internal administrators create each external user. Do not enable self-service sign-up or social identity providers (for example, Google) for the portals. Users sign in only with an account that an administrator created.

### Configure the ASP.NET app

1. Install the NuGet package:

   ```bash
   dotnet add package Microsoft.AspNetCore.Authentication.AzureADB2C.UI
   ```

2. Update `appsettings.json`:

   ```json
   "AzureAdB2C": {
     "Instance": "https://<your-tenant-name>.b2clogin.com",
     "ClientId": "<your-web-app-client-id>",
     "Domain": "<your-tenant-name>.onmicrosoft.com",
     "SignUpSignInPolicyId": "B2C_1_signupsignin"
   }
   ```

3. Update `Startup.cs`:

   ```csharp
   services.AddAuthentication(AzureADB2CDefaults.AuthenticationScheme)
           .AddAzureADB2C(options => Configuration.Bind("AzureAdB2C", options));
   ```

> **NOTE:** Dated (checked November 2026): ASP.NET Core 6 and later templates have no `Startup.cs`. Put the service registration in `Program.cs` (with `builder.Services` and `builder.Configuration`), as in [Configure the pilot .NET portal](#configure-the-pilot-net-portal).

> **NOTE:** Entra External ID difference: The `Microsoft.AspNetCore.Authentication.AzureADB2C.UI` package is deprecated. Use `Microsoft.Identity.Web` with the External ID authority (`https://<tenant-subdomain>.ciamlogin.com/`). The app uses the Entra JWT for authentication only. Each portal keeps its own authorization. It maps the `oid` claim to its SQL Server user record.

### Test the sign-in

1. Start your app.
2. Open a protected page.

**Result:** The browser goes to the B2C sign-in page.

> **NOTE:** Entra External ID difference: After sign-in, the portal must find a SQL user record for the Entra identity. If no record exists, deny access. Do not create a portal user automatically.

### Secure API access for external clients

When sign-in works, you can do these steps:

- Protect your API with `[Authorize]`.
- Register a separate app for external clients.
- Use the **Client Credentials flow** to get tokens with `curl`.

#### Register the API in Azure AD B2C

> **NOTE:** Microsoft marks the B2C client credentials flow as public preview. See [Set up OAuth 2.0 client credentials flow in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/client-credentials-grant-flow).

1. In the Azure portal, select **Azure AD B2C > App registrations > New registration**.
2. **Name**: `MyWebAPI`. Keep the default values for **Redirect URI** and **Supported account types**, then select **Register**.
3. Select **Expose an API**. Next to **Application ID URI**, select **Set**. Replace the GUID with a unique name (for example, `api`), then select **Save**. The result is `https://<your-b2c-tenant>.onmicrosoft.com/api`.
4. Select **Manifest**. In `appRoles`, add an app role with `"allowedMemberTypes": ["Application"]`, a new GUID as `id`, `"isEnabled": true`, and a `value` without spaces (for example, `app.read`). The client credentials flow uses app roles (application permissions), not delegated scopes.
5. Select **Save**.

#### Register the external client app

1. Select **Azure AD B2C > App registrations > New registration**.
2. **Name**: `ExternalClientApp`. Keep the other default values, then select **Register**.
3. Select **Certificates & secrets > New client secret**. Enter a description, select **Expires**, then select **Add**. Copy the **Value**.
4. Select **API permissions**. Under **Configured permissions**, select **Add a permission**.
5. Select the **My APIs** tab, then select `MyWebAPI`.
6. Select **Application permission**, expand **app**, and select the app role (for example, `app.read`).
7. Select **Add permissions**, then **Grant admin consent for <your tenant name>**, then **Yes**.

#### Get a token with curl

Replace the placeholders with the values from your B2C tenant and app registrations. Replace `<policy>` with the name of a user flow or custom policy in the tenant (for example, `B2C_1_signupsignin`). All user flows and custom policies support the client credentials flow.

```bash
curl -X POST https://<your-b2c-tenant>.b2clogin.com/<your-b2c-tenant>.onmicrosoft.com/<policy>/oauth2/v2.0/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<external-client-app-id>" \
  -d "scope=https://<your-b2c-tenant>.onmicrosoft.com/api/.default" \
  -d "client_secret=<client-secret>" \
  -d "grant_type=client_credentials"
```

The scope is the Application ID URI of the API with `/.default`. The token contains the app roles that an administrator granted to the client app.

**Result:** The response is JSON that contains an `access_token`.

#### Call the API with curl

Send the token in the `Authorization` header:

```bash
curl -X GET https://<your-api-endpoint>/api/values \
  -H "Authorization: Bearer <access_token>"
```

### Federation to external identity providers

B2C also supports **custom policies** (Identity Experience Framework). With custom policies, users can sign in with an external Azure AD or Entra ID tenant (for example, a partner or corporate directory). This sign-in can replace a local account or add to it.

Your custom policy (for example, `B2C_1A_signupsignin`) defines a user journey. The journey has 1 or more **OIDC technical profiles**. Each technical profile federates to a different upstream tenant. It contains these values:

| Value | Meaning |
| --- | --- |
| `client_id` | The app registration for this federation in the **upstream tenant**. It is not your web app registration. It is not a shared "portal" registration. |
| `METADATA` URL | Shows the upstream tenant of that registration. |
| `<Key Id="client_secret" StorageReferenceId="B2C_1A_<ProviderName>Secret" />` | The **policy key** that holds the client secret for the upstream tenant. |

Each federated provider uses these registrations:

- Your app: a **public client**. It has no secret and usually uses PKCE. This is normal for SPAs and mobile apps.
- 1 **federation app registration** for each upstream tenant: a confidential client. It has a secret.
- Your app registration does not hold this secret. A shared "portal" registration does not hold it.

B2C does not read the federation secret from the app registration. B2C keeps its own copy in a policy key. An administrator uploads this copy manually. This fact is important for the [troubleshooting](#troubleshooting) section.

Example mapping for an app with 2 federated corporate sign-in options:

| Sign-in button | Technical profile | Secret location (upstream app registration) | B2C policy key |
| --- | --- | --- | --- |
| Sign in with Provider A | `AAD-OpenIdConnect` | Tenant of Provider A | `B2C_1A_ProviderASecret` |
| Sign in with Provider B | `AAD-OpenIdConnect-ProviderB` | Tenant of Provider B | `B2C_1A_ProviderBSecret` |

## Troubleshooting

| Error | Meaning | First check |
| --- | --- | --- |
| `AADB2C90289` | A federated IdP rejected B2C as a client. | Expired or mismatched secret between the federation app registration and its B2C policy key. |
| "No email address was obtained from the external OIDC identity provider" (`AADSTS901011`) | The workforce tenant did not send the `email` claim. | Add the `email` optional claim in **Token configuration** of the federation app in the workforce tenant. |
| `40015` | The workforce tenant authenticated the user, but External ID could not validate the response. | The issuer URI must match the `issuer` in the discovery document exactly. Check the endpoints and that the subject and email claims are returned. |
| `AADSTS500208` | The account type cannot use this sign-in URL or tenant. | Make sure that the app uses the correct sign-in endpoint and that the account has access to the target tenant. |
| The company sign-in button does not show, or `domain_hint` does not redirect | The provider, issuer, or user flow configuration is wrong or stale. | Use the tenant ID or `onmicrosoft.com` issuer. Use the tenant domain, not the GUID, in `domain_hint`. If you changed the issuer, remove the provider from the user flow, save, add it again, and save. |
| `CustomExtensionTimedOut` or `CustomExtensionThrottlingError` | The JIT migration endpoint was too slow or the tenant hit the extension limit. | The extension timeout is 2,000 ms with 1 retry. Make the endpoint faster, and move users in batches. See [Troubleshoot a custom authentication extension](https://learn.microsoft.com/en-us/entra/identity-platform/custom-extension-troubleshoot). |

### AADB2C90289 invalid_client on a federated sign-in

#### Symptom

Interactive sign-in opens the browser and goes to a federated sign-in option. Then it fails with this error:

```text
AADB2C90289: We encountered an 'invalid_client' error connecting to the identity provider.
```

Your MSAL client code shows the error (for example, an `AcquireTokenInteractive()` call). The failure is **server-side**. It occurs in the federation between the B2C tenant and the upstream IdP. The failure is not an app code bug.

#### Cause

- The client secret on the **federation app registration** has expired. This registration is in the upstream tenant.
- Client secrets expire after a maximum of 24 months.
- B2C sent the expired secret to the upstream tenant. The upstream tenant rejected B2C as an invalid client.
- B2C shows this rejection as `AADB2C90289`.
- To confirm, check the `updatedUtc` value of the policy key. If the value is 1 to 2 years old, the secret has probably expired.

#### Diagnosis

1. Make sure that the app uses your B2C custom policy, not a plain user flow. If it does, the failure is probably in the federation, not in your app.
2. In **Azure Portal > Azure AD B2C > Identity Experience Framework > Custom policies**, download these files: the relying-party file, `TrustFrameworkBase`, and `TrustFrameworkExtensions`.
3. In `TrustFrameworkExtensions`, find the sign-up/sign-in journey and its OIDC technical profile.
4. Record the `client_id`, the `METADATA` URL (the tenant), and the `StorageReferenceId` of the `client_secret` key.
5. In the upstream tenant, open **App registrations > (the federation app) > Certificates & secrets**. Check if the secret has expired.

#### Fix

1. In the **upstream tenant**, open **App registrations > (the federation app) > Certificates & secrets**.
2. Create a **new client secret**. Copy the value immediately. You cannot see it again later.
3. In the **B2C tenant**, go to portal.azure.com. The Identity Experience Framework blades do not show in entra.microsoft.com.
4. Select **Azure AD B2C > Identity Experience Framework > Policy keys**. Open the policy key from the technical profile (for example, `B2C_1A_<ProviderName>Secret`).
5. Use the **manual upload** option to add a new key version:
   - Paste the new secret value.
   - Key usage: **Signature** (default).
   - Activation and expiration dates are optional. If you leave them blank, the key is active immediately and does not expire in B2C.
6. Do **not** use the Generate, RSA, or Certificate options. The key must be a plain secret (`kty: oct`). Other key types break the OIDC profile.
7. Test the federated sign-in again. The policy reads the key live, so the fix applies immediately. You do not have to rebuild or redeploy the app.

#### Notes on the fix

- The JSON view of the policy key is **read-only**. It never shows the secret value (`k` is always omitted). You cannot fix the key in the JSON view.
- If the key container has no upload button, use 1 of these alternatives:
  - Delete the key and create it again with the same name.
  - Use the Graph API:

    ```http
    POST https://graph.microsoft.com/beta/trustFramework/keySets/<PolicyKeyName>/uploadSecret
    { "use": "sig", "k": "<new secret value>" }
    ```

- The Graph request needs the `TrustFrameworkKeySet.ReadWrite.All` permission in the B2C tenant.
- In Graph Explorer, add `?tenant=<your-b2c-tenant>.onmicrosoft.com` to select the correct tenant. If you do not, the trustFramework endpoint returns 404.

#### Prevention

- Set a calendar reminder a few weeks before each federation secret expires.
- To rotate a secret, create the new secret on the federation app registration **first**. Then upload it as a new version of the matching policy key.
- If you rotate only the app registration secret, sign-in breaks without a warning. B2C uses its stored copy until you update the policy key.
- Each upstream tenant has its own secret and policy key. If you federate to many tenants, check all of them, not only the broken one.

## Related links

- [Microsoft Entra admin center](https://entra.microsoft.com)
- [Azure Portal](https://portal.azure.com)
- [External ID pricing](https://aka.ms/ExternalIDPricing)
- [External ID billing model and subscription links](https://learn.microsoft.com/en-us/entra/external-id/external-identities-pricing)
- [Add Microsoft Entra ID for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-entra-id-federation-customers)
- [Add OIDC for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-custom-oidc-federation-customers)
- [Route invited users to an external identity provider](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-invite-external-identity-provider-users-customers)
- [Disable sign-up in a user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-disable-sign-up-user-flow)
- [Plan your migration from Azure AD B2C to External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/plan-your-migration-from-b2c-to-external-id)
- [Migrate users and credentials to External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-users)
- [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time)
- [Configure Microsoft Entra authentication in App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad)
- [Azure AD B2C FAQ (end of sale and support dates)](https://learn.microsoft.com/en-us/azure/active-directory-b2c/faq)
- [Azure AD B2C OAuth 2.0 with Postman](doc:azure-ad-b2c-oauth-postman)
- [cURL commands for REST API calls](doc:curl-rest-api-examples)
