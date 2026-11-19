var e=`---
title: External identity for ASP.NET web apps with Microsoft Entra External ID
summary: Move ASP.NET portals and APIs from custom JWT authentication or Azure AD B2C to Microsoft Entra External ID, with workforce sign-in for internal staff.
category: Identity and APIs
order: 10
---

# External identity for ASP.NET web apps with Microsoft Entra External ID

This article sets up Microsoft Entra External ID as the identity provider for ASP.NET portals and their APIs. Administrators create the external accounts, and internal staff sign in with their workforce accounts.

| Starting point | Sections |
| --- | --- |
| Custom JWT authentication with SQL user tables | [Migrate users from the portal databases](#migrate-users-from-the-portal-databases), then [Retire the custom JWT authentication](#retire-the-custom-jwt-authentication) |
| Azure AD B2C | [Migrate users from Azure AD B2C](#migrate-users-from-azure-ad-b2c), then [Retire Azure AD B2C](#retire-azure-ad-b2c) |
| Both | Both rows. Migrate all users into the same external tenant, and merge duplicate people into 1 account. |
| Internal staff | [Allow internal staff to sign in with workforce accounts](#allow-internal-staff-to-sign-in-with-workforce-accounts) |

All other sections apply to all starting points.

> **NOTE:** Checked against Microsoft Learn in November 2026. Microsoft changes these pages often. Check the linked page before you use a step in production.

## Before you start

### Tenant model

Use 2 tenants. Do not merge them.

| Tenant | Holds | Used for |
| --- | --- | --- |
| Workforce (existing) | Employees, the Azure subscription, App Service, Key Vault, SQL Server | Hosting, billing, employee identities |
| External (new) | External users, and a user object for each staff member who signs in through federation | Sign-in for all portals and APIs |

### Azure AD B2C status

- New customers cannot buy Azure AD B2C since May 1, 2025. Microsoft supports it until at least May 2030. B2C P2 stopped on March 15, 2026 (tenants moved to P1).
- You cannot convert a B2C tenant. Create a new external tenant and register the apps again. For B2C tenants with about 5 million or more objects, see [Choose a migration approach](#choose-a-migration-approach).
- B2C custom policies do not move. External ID uses custom authentication extensions, without guaranteed parity.
- Keep the B2C tenant until the migration is complete.

### Cost

- External ID charges per monthly active user (MAU): a unique user who signs in during a calendar month. The first 50,000 MAU are free. See [External ID pricing](https://aka.ms/ExternalIDPricing).
- All users who sign in count: external users, federated staff, and admins.
- The MAU of all tenants linked to the same subscription add together. B2B guests in a linked workforce tenant also count. Check the guest sign-ins on the subscription before you link it.
- Add-ons have no free tier: M2M authentication (client credentials), SMS, and Go-Local data residency. This article uses no add-ons: password reset uses email one-time passcode, and the portals call the APIs as the signed-in user. The optional [app-only token](#use-an-app-only-token-client-credentials) for Graph requests uses the M2M add-on.
- Other costs: Key Vault, an Azure Function for just-in-time password migration, Redis or SQL Server for a distributed token cache, and the B2C tenant until you delete it.
- For production, link the tenant to a subscription (the 30-day trial needs none). Then set a low budget alert (for example, $1) in **Cost Management**.

### Roles

| Task | Tenant | Minimum role |
| --- | --- | --- |
| Create the external tenant | Workforce | Tenant Creator |
| Register portals and APIs | External | Application Administrator or Application Developer |
| Disable sign-up | External | External ID User Flow Administrator |
| Enable self-service password reset | External | Security Administrator |
| Create or invite users | External | User Administrator |
| Register the federation app and grant consent | Workforce | Application Administrator |
| Add the workforce tenant as an identity provider | External | External Identity Provider Administrator |
| Set up just-in-time password migration | External | Application Administrator, User Administrator, and Authentication Extensibility Password Administrator |

You also need the .NET SDK, the portal source code, and the Postman desktop app.

## Create the external tenant

The external tenant holds all external users: service providers, business partners, and clients. Do not add external users to the workforce tenant.

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) of the workforce tenant as at least **Tenant Creator** (scoped to the subscription or a resource group).
2. Select **Entra ID > Overview > Manage tenants > Create**.
3. Select **External > Continue**, then select **Use Azure Subscription**.
4. On the **Basics** tab, enter the **Tenant Name**, the **Domain Name** (the tenant subdomain, for example \`myexternaltenant\`), and the **Country/Region**. You cannot change the country later.
5. Select **Next: Add a subscription**. Select the **Subscription** and the **Resource group**.
6. Select **Next: Review + Create > Create**. Creation can take up to 30 minutes.
7. Select **Settings > Directories + subscriptions**, find the external tenant, and select **Switch**. Do all remaining steps in this tenant unless a step says otherwise.
8. Select **Tenant overview** and record the **Tenant ID** and the **Primary domain** (\`<tenant-subdomain>.onmicrosoft.com\`). The authority is \`https://<tenant-subdomain>.ciamlogin.com/\`.

## Host the portals in the workforce tenant

The portals, APIs, and Azure resources stay in the workforce subscription. Hosting needs no federation or trust between the tenants. Federation is only for staff sign-in.

- The external tenant links to a workforce subscription for billing only. To check the link, open **Home > Billing** in the external tenant. If no subscription shows, select **Click here to upgrade > Add Subscription**.
- App Service can use an app registration from another tenant. This article uses \`Microsoft.Identity.Web\` in code, not App Service built-in authentication.
- A managed identity can replace a client secret only in the App Service **Workforce configuration**. For the external tenant, keep the secret in Key Vault and rotate it.
- To send sign-in logs to Azure Monitor, configure it from the workforce tenant. See [Azure Monitor in external tenants](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-azure-monitor).

## Run Microsoft Graph requests with Postman

Some settings have no button in the admin center, for example **Disable sign-up**. This article sends these Microsoft Graph requests with Postman on any platform. Do the setup 1 time for each tenant: the external tenant, and the B2C tenant if you migrate from B2C. See [Use Postman with the Microsoft Graph API](https://learn.microsoft.com/en-us/graph/use-postman).

### Set up Postman

1. Install the [Postman desktop app](https://www.postman.com/downloads/) and sign in. Use a private workspace. In Postman for the web, also install the **Postman Desktop Agent**.
2. Register a Postman app in the tenant. In the [Microsoft Entra admin center](https://entra.microsoft.com), select **Entra ID > App registrations > New registration**:
   - **Name**: \`Postman Graph admin\`. **Supported account types**: **Single tenant only - <tenant name>** (in B2C: **Accounts in this organizational directory only**). Select **Register**.
   - **Authentication > Add Redirect URI > Web**: \`https://oauth.pstmn.io/v1/browser-callback\`. Select **Configure**.
   - **Certificates & secrets > New client secret**: select a short expiration, then copy the **Value**.
   - **API permissions > Add a permission > Microsoft Graph > Delegated permissions**: add the permissions from [Permissions for each request](#permissions-for-each-request). Select **Grant admin consent for <tenant name> > Yes**.
   - On **Overview**, copy the **Application (client) ID** and the **Directory (tenant) ID**.

   **Result:** **API permissions > Configured permissions** shows the permissions for the steps that you do. For all steps in this article:

   | Tenant | Permission name | Type | Used for |
   | --- | --- | --- | --- |
   | External | \`User.Read\` | Delegated | Sign-in (added by default) |
   | External | \`EventListener.ReadWrite.All\` | Delegated | Disable sign-up, JIT listener |
   | External | \`User.Create\` (or \`User.ReadWrite.All\`) | Delegated | Create users |
   | External | \`User.Invite.All\` | Delegated | Invite staff |
   | External | \`Application.ReadWrite.All\` | Delegated | JIT public key |
   | External | \`CustomAuthenticationExtension.ReadWrite.All\` | Delegated | JIT custom extension |
   | B2C | \`User.Read\` | Delegated | Sign-in (added by default) |
   | B2C | \`User.Read.All\` | Delegated | Export B2C users |
   | B2C | \`TrustFrameworkKeySet.ReadWrite.All\` | Delegated | Fix a B2C policy key |

   Each row must show **Granted for <tenant name>** in the **Status** column. Every permission must have the type **Delegated**. A permission of type **Application** is not in a sign-in token (see [Use an app-only token](#use-an-app-only-token-client-credentials)).
3. In Postman, add an environment (sidebar add icon > **Environments**) named after the tenant, for example \`External tenant\`. Add the variables \`tenantId\`, \`clientId\`, and \`clientSecret\`. Select **Secure** next to \`clientSecret\`. Postman keeps these values on your computer unless you share them.
4. Add a collection (sidebar add icon > **Collection**) named \`Entra Graph\`. On its **Authorization** tab, set these values, then select **Save**:

| Setting | Value |
| --- | --- |
| Auth Type | **OAuth 2.0**, auth data added to the request headers |
| Grant type | **Authorization Code** |
| Callback URL | Select **Authorize using browser**. The URL must be \`https://oauth.pstmn.io/v1/browser-callback\`. |
| Auth URL | \`https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/authorize\` |
| Access Token URL | \`https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/token\` |
| Client ID / Client Secret | \`{{clientId}}\` / \`{{clientSecret}}\` |
| Scope | \`https://graph.microsoft.com/.default\` |
| Client Authentication | Send client credentials in the body |

5. Select the environment in the top-right corner. Select **Get New Access Token**, sign in with an account that has the role for the request, then select **Proceed > Use Token**.

A token expires after 60 to 90 minutes. If a request returns \`401\`, get a new token. If you add a permission, grant admin consent again, then get a new token.

> **IMPORTANT:** A delegated permission works only if your account also has the admin role. The app permission alone is not sufficient.

### Use an app-only token (client credentials)

As an alternative to admin sign-in, the Postman app can get a token as itself, with its client secret. Nobody signs in, and no admin role applies. See [OAuth 2.0 client credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow).

> **IMPORTANT:** In an external tenant, client credentials use the M2M authentication add-on. Microsoft charges for each token request and documents no exception for Microsoft Graph tokens. Use the sign-in token above if you want no add-on cost. See [External ID pricing](https://learn.microsoft.com/en-us/entra/external-id/external-identities-pricing).

1. On the Postman app, add each permission as an **Application** permission, not **Delegated**: the same names as in the **Configured permissions** table of [Set up Postman](#set-up-postman), without \`User.Read\`. A token gets only the permissions of its own type. Each request in [Permissions for each request](#permissions-for-each-request) supports the same permission name as an Application permission. For \`PATCH /applications/{id}\`, use \`Application.ReadWrite.All\`.
2. Grant admin consent. For Microsoft Graph Application permissions, this needs the **Privileged Role Administrator** role. Application Administrator and Cloud Application Administrator cannot grant them.
3. Get the token. On the collection **Authorization** tab, change **Grant type** to **Client Credentials**. Keep the other values: **Access Token URL** \`https://login.microsoftonline.com/{{tenantId}}/oauth2/v2.0/token\`, \`{{clientId}}\`, \`{{clientSecret}}\`, and **Scope** \`https://graph.microsoft.com/.default\`. Select **Get New Access Token**, then **Use Token**. No browser opens.
4. Check the token in [jwt.ms](https://jwt.ms). An app-only token has a \`roles\` claim, not \`scp\`. \`roles\` must list the permissions that you need.

Reuse the token until it expires (\`expires_in\`, in seconds): each token request is 1 billable transaction. Anybody with the client secret has these permissions without sign-in or MFA. Delete the secret when you finish.

### Send a request

1. Select **Add request** next to the \`Entra Graph\` collection. Keep the inherited authorization.
2. Select the method, paste the URL, and replace each \`<placeholder>\`.
3. For a body, select **Body > raw > JSON** and paste it.
4. Select **Send**.

To test the setup:

1. Send \`GET https://graph.microsoft.com/v1.0/organization?$select=id,displayName\`. The response shows the tenant name. This request needs only \`User.Read\`, which a new app has by default.
2. Check the token. Postman shows the new token before you select **Use Token**. Copy it and paste it in [jwt.ms](https://jwt.ms). The \`scp\` (scopes) claim lists the delegated permissions of the token, separated by spaces, for example \`"scp": "EventListener.ReadWrite.All User.Read"\`. It has only the permissions that had admin consent when Entra issued the token. The \`scp\` claim must list each permission from [Permissions for each request](#permissions-for-each-request) that you need. If a permission is missing, Graph returns "The application does not have any of the required delegated permissions".

| Problem | Fix |
| --- | --- |
| \`401\` | Select the correct environment and get a new token. |
| \`403\` | Add the permission to the app, grant admin consent, get a new token, and check your role. |
| "The application does not have any of the required delegated permissions" | The token has no listed permission. Make sure that the permission is under **Delegated**, not **Application**, and shows **Granted**. Then select **Get New Access Token**: a token from before the consent does not change. To check, paste the token in [jwt.ms](https://jwt.ms): \`scp\` must list the permission, and \`tid\` must be the tenant ID. |
| \`400\` | Fix the JSON, or replace the remaining \`<placeholder>\`. |
| \`404\` | Check the ID and the selected environment. |
| \`AADSTS50011\` | Set the Web redirect URI to \`https://oauth.pstmn.io/v1/browser-callback\`. |
| \`AADSTS700016\` | The app is not in this tenant. Select the correct environment. |
| \`AADSTS7000215\` | Copy the secret **Value**, not the **Secret ID**. |
| \`AADSTS65001\` | Grant admin consent on the app. |

### Permissions for each request

| Step | Request | Tenant | Delegated permission | Minimum role |
| --- | --- | --- | --- | --- |
| [Disable sign-up](#disable-sign-up) | \`GET\`, \`PATCH /v1.0/identity/authenticationEventsFlows\` | External | \`EventListener.ReadWrite.All\` | External ID User Flow Administrator |
| [Create many users](#create-many-users), [staff accounts](#create-staff-accounts-with-microsoft-graph) | \`POST /v1.0/users\` | External | \`User.Create\` | User Administrator |
| [Invite a staff member](#invite-a-staff-member) | \`POST /v1.0/invitations\` | External | \`User.Invite.All\` | Guest Inviter or User Administrator |
| [Read the B2C users](#migrate-the-user-accounts) | \`GET /v1.0/users\` | B2C | \`User.Read.All\` | Member account. A guest admin also needs a role such as Directory Readers. |
| [Add the public key](#set-up-just-in-time-password-migration) | \`PATCH /v1.0/applications/{id}\` | External | \`Application.ReadWrite.All\` | Application Administrator or Cloud Application Administrator |
| [Create the extension](#set-up-just-in-time-password-migration) | \`POST /beta/identity/customAuthenticationExtensions\` | External | \`CustomAuthenticationExtension.ReadWrite.All\` | Authentication Extensibility Administrator or Application Administrator |
| [Connect the extension](#set-up-just-in-time-password-migration) | \`POST /beta/identity/authenticationEventListeners\` | External | \`EventListener.ReadWrite.All\` | Authentication Extensibility Administrator or Application Administrator |
| [Fix a B2C policy key](#fix-an-expired-federation-secret) | \`POST /beta/trustFramework/keySets/{id}/uploadSecret\` | B2C | \`TrustFrameworkKeySet.ReadWrite.All\` | B2C IEF Keyset Administrator |

The \`beta\` requests are the ones that the Microsoft Learn procedures use. Beta APIs can change.

> **CAUTION:** The Postman app has strong permissions. When you finish, delete its client secret or the app.

## Register each portal

Register 1 app for each portal. Start with the pilot portal. All portals use the same tenant, so a user has 1 identity for all portals.

1. Select **Entra ID > App registrations > New registration**. Enter the portal name and select **Single tenant only - <external tenant name>**. Select **Register** and record the **Application (client) ID**.
2. Select **Authentication > Add Redirect URI > Web**. Enter the redirect URI \`https://localhost:5001/signin-oidc\` and the front-channel logout URL \`https://localhost:5001/signout-oidc\`. Add the URL of each environment later.
3. Select **Certificates & secrets > New client secret** (Microsoft recommends less than 12 months, maximum 24). Store the **Value** in Key Vault immediately. Set a reminder before it expires.
4. Select **API permissions > Grant admin consent for <tenant name> > Yes**. External users cannot consent themselves.

> **NOTE:** For production, Microsoft recommends a certificate instead of a secret: **Certificates & secrets > Certificates > Upload certificate**.

## Configure sign-in without self-registration

External users cannot register themselves. Administrators create all accounts.

All portals use **Email with password**. Entra fixes the sign-in method of a user when it creates the account, so 1 method gives each user the same sign-in on every portal. Use 1 user flow for all portals: a user flow can serve many apps, but an app can have only 1 user flow.

### Create the user flow

1. Select **Entra ID > External Identities > User flows > New user flow**.
2. Name it \`PortalSignIn\`. Under **Email Accounts**, select **Email with password**. Do not add social providers. Select **Create**.
3. Open the user flow, select **Applications > Add application**, and add the pilot portal.

### Disable sign-up

The admin center has no setting for this. Use Postman (\`External tenant\` environment). The token must have \`EventListener.ReadWrite.All\` in \`scp\` (see [Send a request](#send-a-request)). See [Disable sign-up in a user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-disable-sign-up-user-flow).

1. Send this request. In the response, copy the \`id\` of the item with \`"displayName": "PortalSignIn"\`.

   \`\`\`http
   GET https://graph.microsoft.com/v1.0/identity/authenticationEventsFlows
   \`\`\`

2. Send this request with the ID. **Result:** \`204 No Content\`.

   \`\`\`http
   PATCH https://graph.microsoft.com/v1.0/identity/authenticationEventsFlows/<user-flow-id>
   \`\`\`

   \`\`\`json
   {
     "@odata.type": "#microsoft.graph.externalUsersSelfServiceSignUpEventsFlow",
     "onInteractiveAuthFlowStart": {
       "@odata.type": "#microsoft.graph.onInteractiveAuthFlowStartExternalUsersSelfServiceSignUp",
       "isSignUpAllowed": false
     }
   }
   \`\`\`

3. Send \`GET .../authenticationEventsFlows/<user-flow-id>\` again. **Result:** \`"isSignUpAllowed": false\`.
4. Open the pilot portal in a private window. **Result:** The sign-in page has no option to create an account.

The setting applies to every portal in \`PortalSignIn\`. To enable sign-up again, send step 2 with \`true\`.

### Enable self-service password reset

Users set their own password with self-service password reset. Sign in as at least **Security Administrator**. See [Enable self-service password reset](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-enable-password-reset-customers).

1. In the \`PortalSignIn\` user flow, make sure that **Email with password** is selected.
2. Select **Entra ID > Security > Authentication methods > Email OTP**. Turn it on for **All users**, then select **Save**.
3. Select **Entra ID > Company Branding > Default sign-in > Edit**. On the **Sign-in form** tab, select **Show self-service password reset**, then **Review + save > Save**.

**Result:** The sign-in page shows **Forgot password?**. Do not use SMS: each SMS has a charge.

## Provision external users

You need at least the **User Administrator** role.

### Create one user

1. Select **Entra ID > Users > New user > Create new external user**.
2. Under **Identities**, select **Email** and enter the email address (the sign-in name). Enter the **Display name**.
3. Copy the autogenerated **Password** and give it to the user. Select **Review + create**.

To reset a password, select the user, then **Reset password**. The user must change it at the next sign-in.

### Create many users

Postman sends 1 request for each row of a CSV file with the **Collection Runner** (\`External tenant\` environment).

1. Make \`users.csv\`. Put the column names in the first row, use the same number of columns in each row, and save with Unix (LF) line endings. Column names are case-sensitive.

   \`\`\`text
   DisplayName,Email
   Jane Smith,jane@example.com
   Sam Lee,sam@example.com
   \`\`\`

2. Add a request named \`Create user\`. Replace \`<tenant-subdomain>\`:

   \`\`\`http
   POST https://graph.microsoft.com/v1.0/users
   \`\`\`

   \`\`\`json
   {
     "accountEnabled": true,
     "displayName": "{{DisplayName}}",
     "mail": "{{Email}}",
     "identities": [
       {
         "signInType": "emailAddress",
         "issuer": "<tenant-subdomain>.onmicrosoft.com",
         "issuerAssignedId": "{{Email}}"
       }
     ],
     "passwordProfile": { "password": "{{tempPassword}}", "forceChangePasswordNextSignIn": false },
     "passwordPolicies": "DisablePasswordExpiration"
   }
   \`\`\`

3. On **Scripts > Pre-request**, paste this script. It makes a random temporary password for each user (\`$randomPassword\` has 15 letters and digits, and \`Aa1!\` meets the complexity rules):

   \`\`\`js
   pm.variables.set('tempPassword', pm.variables.replaceIn('{{$randomPassword}}') + 'Aa1!');
   \`\`\`

4. On **Scripts > Post-response**, paste this script. It writes the email and the new object ID to the Console:

   \`\`\`js
   const email = pm.iterationData.get('Email');
   if (pm.response.code === 201) {
     console.log(email + ',' + pm.response.json().id);
   } else {
     console.log('FAILED,' + email + ',' + pm.response.code + ',' + pm.response.text());
   }
   \`\`\`

5. Select **Save**, and get a new token if the old one is more than 60 minutes old.
6. Select the collection, then **Run**. Clear all requests except \`Create user\`. Under **Iteration data > Datafiles**, select **Select from computer** and choose \`users.csv\`. Select **Start run**.
7. Select **Console** in the Postman footer. Save the lines as \`created-users.csv\`. A line that starts with \`FAILED\` shows the error for that user.
8. Tell each user to open the portal, select **Forgot password?**, and set a password. Nobody sees the temporary password.

If the request returns \`403\` with the correct role, add \`User.ReadWrite.All\` to the Postman app. Collection Runner runs are unlimited on the 2026 Postman plans. Older plans count each CSV row as 1 run against a monthly limit.

## Allow internal staff to sign in with workforce accounts

Add the workforce tenant to the external tenant as an OpenID Connect (OIDC) identity provider. See [Add Microsoft Entra ID for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-entra-id-federation-customers).

- The user authenticates in the workforce tenant. Its Conditional Access, MFA, and device policies apply.
- The external tenant keeps a user object for each staff member. The portals receive the \`oid\` of that object, not the workforce \`oid\`.
- External ID does not trust workforce MFA. If the external tenant also requires MFA, the user does MFA again.
- Each staff member who signs in counts as 1 MAU. You can add more than 1 workforce tenant.

### Register the external tenant in the workforce tenant

Do these steps in the **workforce tenant**.

1. Select **Entra ID > App registrations > New registration**. Name it \`External ID federation\`, select **Single tenant only - <workforce tenant name>**, then select **Register**.
2. Select **Authentication > Add Redirect URI > Web** and add these URIs. For a custom domain, also add \`https://<tenant-subdomain>.ciamlogin.com/<custom-domain>/federation/oauth2\`.

   \`\`\`text
   https://<tenant-subdomain>.ciamlogin.com/<external-tenant-ID>/federation/oauth2
   https://<tenant-subdomain>.ciamlogin.com/<tenant-subdomain>.onmicrosoft.com/federation/oauth2
   \`\`\`

3. Add a client secret and copy the **Value**. Set a reminder before it expires.
4. Select **Token configuration > Add optional claim > ID** and add \`email\`. Without it, sign-in fails with \`AADSTS901011\`.
5. Select **API permissions** and add the delegated permissions \`email\`, \`openid\`, \`profile\`, and \`User.Read\`. Grant admin consent.
6. Record the **Application (client) ID** and the **Directory (tenant) ID**.

### Add the workforce tenant as an identity provider

In the **external tenant**, select **Entra ID > External Identities > All identity providers > Custom > Add new > Open ID Connect**. See [Add OIDC for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-custom-oidc-federation-customers).

| Setting | Value |
| --- | --- |
| Display name | The button text, for example \`Sign in with your company account\` |
| Well-known endpoint | \`https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration\` |
| OpenID Issuer URI | \`https://login.microsoftonline.com/<workforce-tenant-ID>/v2.0\` or \`https://login.microsoftonline.com/<workforce>.onmicrosoft.com/v2.0\` |
| Client ID / Client Secret | From the workforce registration |
| Client Authentication | \`client_secret_post\` (\`client_secret_basic\` and \`private_key_jwt\` are not supported) |
| Scope | \`openid profile\` |
| Response type | \`code\` |

Select **Next: Claims mapping**, keep **Email** mapped, then select **Review + create**.

> **IMPORTANT:** The issuer must use the tenant ID or the \`onmicrosoft.com\` domain, not a custom domain. For \`domain_hint\`, use the \`onmicrosoft.com\` form.

### Choose how staff accounts are created

Sign-up is disabled, so the federation button cannot create an account.

| Method | Use it when |
| --- | --- |
| Invitation with \`domain_hint\` (recommended) | Admins control access. The provider does not have to be in the user flow. |
| Federation button in the user flow | Sign-up is enabled. The first sign-in creates the account. |
| Create the user with Microsoft Graph | Bulk provisioning or migration of staff. |

Microsoft does not document what occurs when a staff member without an account selects the button while sign-up is disabled. Do not depend on it.

### Invite a staff member

See [Route invited users to an external identity provider](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-invite-external-identity-provider-users-customers).

1. In Postman (\`External tenant\`), send this request. Copy \`invitedUser.id\` from the response.

   \`\`\`http
   POST https://graph.microsoft.com/v1.0/invitations
   \`\`\`

   \`\`\`json
   {
     "invitedUserEmailAddress": "jane.smith@contoso.com",
     "inviteRedirectUrl": "https://<portal-url>",
     "sendInvitationMessage": false
   }
   \`\`\`

2. Write the ID to \`EntraObjectId\` in the SQL record of the staff member (see [Link Entra identities to SQL users](#link-entra-identities-to-sql-users)).
3. Send your own email with a link such as \`https://<portal-url>/account/signin?domain_hint=<workforce>.onmicrosoft.com\`. Use the domain, not the tenant ID.
4. In the portal, pass only the domains that you federate to the authorization request:

   \`\`\`csharp
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
   \`\`\`

**Result:** At first sign-in, External ID links the workforce identity and sets \`externalUserState\` to \`Accepted\`. Later sign-ins need no \`domain_hint\`. The sign-in page shows a domain confirmation dialog that you cannot hide.

### Create staff accounts with Microsoft Graph

1. In the **workforce tenant**, copy the **Object ID** of the staff member.
2. In Postman (\`External tenant\`), send this request. Use the Collection Runner for many staff members.

   \`\`\`http
   POST https://graph.microsoft.com/v1.0/users
   \`\`\`

   \`\`\`json
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
   \`\`\`

   \`<workforce-primary-domain>\` is, for example, \`contoso.onmicrosoft.com\`. \`<external-tenant-ID>\` is the directory ID of the external tenant.
3. Store the \`id\` from the response in \`EntraObjectId\`.

> **NOTE:** The \`issuer\` format is copied from Microsoft Learn. Before a bulk run, create 1 test user and make sure that sign-in finds it and does not create a second account.

## Link Entra identities to SQL users

Each portal keeps its own SQL user table. Add this column to each portal before the migration:

\`\`\`sql
ALTER TABLE dbo.Users ADD EntraObjectId UNIQUEIDENTIFIER NULL;
CREATE UNIQUE INDEX UX_Users_EntraObjectId ON dbo.Users (EntraObjectId) WHERE EntraObjectId IS NOT NULL;
\`\`\`

Store the \`oid\` claim in this column. Match users on \`oid\`, not on email: an email can change, but the \`oid\` cannot. The \`oid\` is the same in all apps of the tenant.

## Configure the pilot .NET portal

This article covers the .NET portals (phase 1). It does not cover the JavaScript apps (phase 2).

1. Install the packages:

   \`\`\`bash
   dotnet add package Microsoft.Identity.Web
   dotnet add package Microsoft.Identity.Web.UI
   \`\`\`

2. Update \`appsettings.json\`. Keep the secret in Key Vault or user secrets.

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

3. Update \`Program.cs\`. Entra authenticates the user. The portal authorizes the user from its SQL record.

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

4. Implement \`IPortalUserStore\` (a placeholder name) with the user table and roles of the portal.

## Protect the portal APIs

1. Register the API: **New registration**, **Single tenant only - <external tenant name>**, no redirect URI.
2. Select **Owners > Add owners**. Add an owner to the API and to each portal. Without an owner, the API does not show under **My APIs**.
3. Select **Expose an API**. Add the **Application ID URI** (keep \`api://<api-client-id>\`).
4. Select **Add a scope**: name \`access_as_user\`, **Admins only**, a display name and description, **Enabled**.
5. In each portal registration, select **API permissions > Add a permission > My APIs**, select the API and \`access_as_user\`, then grant admin consent.
6. In the API project, add the settings and the code:

   \`\`\`json
   "AzureAd": {
     "Instance": "https://<tenant-subdomain>.ciamlogin.com/",
     "TenantId": "<tenant-id>",
     "ClientId": "<api-client-id>"
   }
   \`\`\`

   \`\`\`csharp
   builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApi(builder.Configuration);
   \`\`\`

The API validates the token, then authorizes the caller from its SQL record by \`oid\`, the same as the portal.

## Call the API from the portal

\`Microsoft.Identity.Web\` gets, caches, and refreshes the user token. The portal client secret is sufficient.

1. Install the package:

   \`\`\`bash
   dotnet add package Microsoft.Identity.Web.DownstreamApi
   \`\`\`

2. Add the API to \`appsettings.json\`:

   \`\`\`json
   "DownstreamApis": {
     "PortalApi": {
       "BaseUrl": "https://<api-host>",
       "Scopes": [ "api://<api-client-id>/access_as_user" ]
     }
   }
   \`\`\`

3. Add token acquisition to \`Program.cs\`:

   \`\`\`csharp
   builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
       .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"))
       .EnableTokenAcquisitionToCallDownstreamApi()
       .AddInMemoryTokenCaches();

   builder.Services.AddDownstreamApis(builder.Configuration.GetSection("DownstreamApis"));
   \`\`\`

4. Call the API. \`[AuthorizeForScopes]\` signs the user in again if the cache is empty. \`OrdersController\`, \`Order\`, and \`api/orders\` are examples.

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

> **NOTE:** The in-memory cache is lost at restart and is not shared between servers. For more than 1 server, use \`AddDistributedTokenCaches()\` with Redis or SQL Server.

## Test the pilot

Make sure that:

- The browser goes to the \`ciamlogin.com\` sign-in page, with no sign-up option.
- A user with a linked SQL record signs in and gets the portal roles. A user without one gets no access.
- **Forgot password?** sends a passcode and lets the user set a new password.
- The API returns data only for users with a linked SQL record.
- An invited staff member signs in through the \`domain_hint\` link, and later without it.

> **IMPORTANT:** Do not migrate users until the pilot works.

## Migrate users from the portal databases

For users in the portal SQL tables (custom JWT authentication). Entra cannot import password hashes. Select a password option first:

| Option | How it works |
| --- | --- |
| Password reset | Create each user with a random password. The user selects **Forgot password?** at first sign-in. |
| Just-in-time password migration | At first sign-in, your endpoint checks the password against the SQL table, and External ID stores it. Keep the tables available during the migration. See [Set up just-in-time password migration](#set-up-just-in-time-password-migration). |

1. Export the users from each portal database.
2. Merge duplicates across portals by email. Each person gets 1 identity.
3. Create the users with [Create many users](#create-many-users).
4. Write each object ID to \`EntraObjectId\` in every portal record of that person.
5. Tell the users how to sign in.

## Migrate users from Azure AD B2C

Microsoft calls the main path the **standard migration**: create the users in the external tenant, migrate passwords if necessary, then move each app. See [Plan your migration](https://learn.microsoft.com/en-us/entra/external-id/customers/plan-your-migration-from-b2c-to-external-id) and [Migrate from Azure AD B2C](https://learn.microsoft.com/en-us/entra/external-id/customers/migrate-from-b2c-to-external-id).

### Choose a migration approach

| Approach | Use it when | Notes |
| --- | --- | --- |
| Standard migration | Most tenants | New tenant, new app registrations, bulk user migration, optional password migration, app cutover. |
| High Scale Compatibility (HSC) mode | About 5 million or more objects | Users stay in the B2C tenant, and you move apps in phases. No social providers, passkeys, age gating, or admin center, and limited Conditional Access. Below the threshold, HSC gives no benefit. |

### Assess the B2C tenant

List the apps, user flows, custom policies, identity providers, claims, and custom logic. Map them:

| B2C feature | External ID equivalent |
| --- | --- |
| Custom policies and custom claims | Custom authentication extensions |
| Hosted HTML and CSS pages | User flow branding, or native authentication |
| Policy access rules | Conditional Access |
| Microsoft Graph user management | No change |

Gaps: social providers from custom policies must be configured again, third-party providers from custom policies are not supported, age gating is not supported, and User Insights retires on August 31, 2026 (use Azure Monitor).

### Migrate the user accounts

Bulk migration is always necessary, also with password migration. See [Migrate users and credentials](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-users). Migrate only active accounts and the attributes that you need. Do not store regulated data in External ID.

1. For password migration, add a custom attribute in the external tenant: **External Identities > Custom user attributes > Add**, name \`toBeMigrated\`, type **Boolean**.
2. Copy the client ID of \`b2c-extensions-app\` and remove the hyphens. The attribute ID is \`extension_<client-id-without-hyphens>_toBeMigrated\`.
3. Export the B2C users with Postman (\`B2C tenant\` environment, \`User.Read.All\`). Microsoft documents this admin sign-in for run-once tasks such as migration ([Register a Microsoft Graph application](https://learn.microsoft.com/en-us/azure/active-directory-b2c/microsoft-graph-get-started)).
   1. Add a request \`List B2C users\`: method **GET**, URL \`{{nextUrl}}\`.
   2. **Pre-request** script (starts at the first page):

      \`\`\`js
      if (!pm.collectionVariables.get('nextUrl')) {
        pm.collectionVariables.set('nextUrl', 'https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,identities&$top=999');
        console.log('B2CId,DisplayName,Email');
      }
      \`\`\`

   3. **Post-response** script (1 CSV line for each local account, then the next page):

      \`\`\`js
      const page = pm.response.json();
      const quote = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
      for (const user of page.value) {
        const login = (user.identities || []).find((identity) => identity.signInType === 'emailAddress');
        if (login) console.log([user.id, user.displayName, login.issuerAssignedId].map(quote).join(','));
      }
      if (page['@odata.nextLink']) {
        pm.collectionVariables.set('nextUrl', page['@odata.nextLink']);
        pm.execution.setNextRequest(pm.info.requestName);
      } else {
        pm.collectionVariables.set('nextUrl', '');
      }
      \`\`\`

   4. Run only this request in the Collection Runner (the loop works only there). Save the Console lines as \`b2c-users.csv\`.
4. Create the users in the external tenant (\`External tenant\` environment). Copy \`Create user\` from [Create many users](#create-many-users) as \`Create migrated user\`, and use this body. Without password migration, remove the \`toBeMigrated\` line.

   \`\`\`json
   {
     "accountEnabled": true,
     "displayName": "{{DisplayName}}",
     "mail": "{{Email}}",
     "identities": [
       {
         "signInType": "emailAddress",
         "issuer": "<tenant-subdomain>.onmicrosoft.com",
         "issuerAssignedId": "{{Email}}"
       }
     ],
     "passwordProfile": { "password": "{{tempPassword}}", "forceChangePasswordNextSignIn": false },
     "extension_<client-id-without-hyphens>_toBeMigrated": true
   }
   \`\`\`

   Change the **Post-response** script to also write the B2C ID:

   \`\`\`js
   const email = pm.iterationData.get('Email');
   if (pm.response.code === 201) {
     console.log([email, pm.iterationData.get('B2CId'), pm.response.json().id].join(','));
   } else {
     console.log('FAILED,' + email + ',' + pm.response.code + ',' + pm.response.text());
   }
   \`\`\`

   Run it with the data file \`b2c-users.csv\`. Save the Console lines as \`created-users.csv\`.
5. Store each new \`id\` in \`EntraObjectId\`. The B2C \`oid\` does not match the new one.

Graph throttles large imports. Run in batches and retry after a throttling response. See [Microsoft Graph throttling](https://learn.microsoft.com/en-us/graph/throttling).

### Choose a password option

| Option | How it works | Use it when |
| --- | --- | --- |
| No password migration | Users reset their password after migration. | You accept a reset. |
| Just-in-time (JIT) migration | Apps use External ID. At first sign-in, your endpoint checks the password against B2C, and External ID stores it. Generally available since March 2026. | Users must keep their passwords. |
| B2C-initiated migration | Apps stay on B2C. A custom policy sends the password to your REST API at each sign-in, which writes it to External ID. | You cannot move the apps yet. |

With JIT or B2C-initiated migration, both tenants run together. Users who never sign in do not migrate, so set a cutover date and reset the rest. Keep profile changes aligned in both tenants, and keep this period short.

### Set up just-in-time password migration

The same steps apply to B2C and to the portal databases. Only the password check in your endpoint differs. See [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time).

1. **Certificate.** In Key Vault, generate an RSA certificate. External ID encrypts the password with its public key. The private key stays in Key Vault.
2. **Endpoint.** Build an HTTPS endpoint (usually an Azure Function) with a managed identity that can read the certificate. Host it in a secure subscription with limited RBAC.
3. **Request.** External ID sends this payload (shortened). \`encryptedPasswordContext\` is a JWE with \`user-password\`, \`username\`, and \`nonce\`.

   \`\`\`json
   {
     "type": "microsoft.graph.authenticationEvent.passwordSubmit",
     "data": {
       "@odata.type": "microsoft.graph.onPasswordSubmitCalloutData",
       "tenantId": "<external-tenant-ID>",
       "encryptedPasswordContext": "<5-part-JWE>",
       "authenticationContext": { "user": { "id": "<user-id>", "mail": "jane@example.com" } }
     }
   }
   \`\`\`

4. **Response.** Decrypt the JWE, check the password, and return 1 action with the same \`nonce\`:

   \`\`\`json
   {
     "data": {
       "@odata.type": "microsoft.graph.onPasswordSubmitResponseData",
       "actions": [ { "@odata.type": "microsoft.graph.passwordSubmit.MigratePassword" } ],
       "nonce": "<nonce-from-the-request>"
     }
   }
   \`\`\`

   | Action | When | Result |
   | --- | --- | --- |
   | \`MigratePassword\` | Correct password | External ID stores it and sets the flag to \`false\`. |
   | \`UpdatePassword\` | Correct but weak or expired | The user resets the password. |
   | \`Retry\` | Incorrect password | The user tries again. |
   | \`Block\` | Sign-in must stop (for example, a locked account) | The user sees a block screen. |

   Each action name starts with \`microsoft.graph.passwordSubmit.\`.
5. **Extension app.** Register an app (**Single tenant only**). In **Manifest**, set \`"identifierUris": ["api://<function-host>/<extension-app-client-ID>"]\`. Add the application permission \`CustomAuthenticationExtension.Receive.Payload\` and grant admin consent.
6. **Public key.** In Key Vault, open the certificate version and select **Download in CER format**. Note its start and end dates. Copy the **Object ID** of the extension app. Get the Base64 value:

   \`\`\`text
   macOS:    base64 -i jitmigrationencryptioncert.cer
   Linux:    base64 -w 0 jitmigrationencryptioncert.cer
   Windows:  powershell -Command "[Convert]::ToBase64String([IO.File]::ReadAllBytes('jitmigrationencryptioncert.cer'))"
   \`\`\`

   In Postman (\`External tenant\`), add a request with this **Pre-request** script (1 GUID used 2 times), then send the body. Dates are UTC, for example \`2026-11-25T17:44:47Z\`.

   \`\`\`js
   pm.variables.set('keyId', pm.variables.replaceIn('{{$guid}}'));
   \`\`\`

   \`\`\`http
   PATCH https://graph.microsoft.com/v1.0/applications/<extension-app-object-ID>
   \`\`\`

   \`\`\`json
   {
     "keyCredentials": [
       {
         "startDateTime": "<certificate-start-date>",
         "endDateTime": "<certificate-end-date>",
         "keyId": "{{keyId}}",
         "type": "AsymmetricX509Cert",
         "usage": "Encrypt",
         "key": "<base64-public-key>",
         "displayName": "CN=JitMigration"
       }
     ],
     "tokenEncryptionKeyId": "{{keyId}}"
   }
   \`\`\`

   **Result:** \`204 No Content\`. This request replaces all key credentials of the app.
7. **Custom extension.** Send this request and copy the \`id\`:

   \`\`\`http
   POST https://graph.microsoft.com/beta/identity/customAuthenticationExtensions
   \`\`\`

   \`\`\`json
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
   \`\`\`

8. **Listener.** Send this request. Add 1 \`appId\` item for each portal.

   \`\`\`http
   POST https://graph.microsoft.com/beta/identity/authenticationEventListeners
   \`\`\`

   \`\`\`json
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
   \`\`\`

9. **Test** with a few users. The flag must change to \`false\`, each action must work, and no password must show in logs.

> **WARNING:** The B2C sample ([b2c-to-meeid-migration-tool](https://github.com/microsoft/b2c-to-meeid-migration-tool), preview) checks passwords with B2C ROPC. [B2C does not support server-to-server ROPC](https://learn.microsoft.com/en-us/azure/active-directory-b2c/add-ropc-policy): identity protection can block the server IP after repeated failures, and ROPC fails when B2C needs MFA or a password change. Test with production volumes, and return \`Retry\` or \`Block\` when the check fails.

> **NOTE:** External ID applies its own complexity rules, so a weak B2C password needs \`UpdatePassword\`. The \`disableStrongPassword\` option relaxes only the complexity check (the 8-character minimum stays). In native authentication, a weak password returns an error instead.

For B2C-initiated migration, protect the REST API against brute force: stop serving requests above a sign-in attempt threshold.

### Validate and cut over

1. For each portal, test sign-in, password reset, token claims, API calls, and the extension.
2. Move each app to the External ID authority. The migration is not complete until the last app moves.
3. Send sign-in logs to Azure Monitor. Watch for \`CustomExtensionTimedOut\` and \`CustomExtensionThrottlingError\`.
4. After the cutover date, reset or bulk-migrate the users who did not sign in. Then remove the listener.

## Connect the remaining portals

Connect the other .NET portals 1 at a time:

1. [Register the portal](#register-each-portal) and add it to \`PortalSignIn\` ([Create the user flow](#create-the-user-flow)).
2. Use the pilot code ([Configure the pilot .NET portal](#configure-the-pilot-net-portal), [Call the API from the portal](#call-the-api-from-the-portal)).
   - Custom JWT portal: add External ID next to the JWT code, and remove the JWT code later.
   - B2C portal: replace the B2C settings (\`b2clogin.com\` instance, client ID, policy ID). B2C app registrations do not work in the external tenant.
3. For JIT migration, add the client ID to \`includeApplications\` of the listener.
4. Do the pilot tests again.

## Retire the custom JWT authentication

When all portals and APIs use Entra tokens, remove the JWT issuer and the JWT validation code. Keep the SQL user records: they still control authorization.

## Retire Azure AD B2C

After all apps use External ID and the cutover date has passed:

1. Remove the B2C settings and packages from each portal and API.
2. Reset or migrate the remaining users, then delete the JIT listener and extension.
3. Remove the B2C federation secrets and policy keys. The workforce federation replaces them.
4. When no app calls B2C, delete the tenant (see "How do I delete my Azure AD B2C tenant?" in the [B2C FAQ](https://learn.microsoft.com/en-us/azure/active-directory-b2c/faq)). B2C charges for its MAU until then.

## Legacy reference: Azure AD B2C

These steps describe Azure AD B2C, not the target design. If a step conflicts with the sections above, the sections above apply.

> **NOTE:** Dated (checked November 2026): new customers cannot buy Azure AD B2C. Use External ID for new projects.

### Create an Azure AD B2C tenant

In the [Azure portal](https://portal.azure.com), search for **Azure AD B2C**, select **Create a new B2C tenant**, complete the wizard, and link the tenant to your subscription.

### Register the web app in B2C

1. In the B2C tenant, select **Azure AD B2C > App registrations > New registration**.
2. Enter \`MyWebApp\`, select **Accounts in any identity provider or organizational directory (for authenticating users with user flows)**, set the **Web** redirect URI \`https://localhost:5001/signin-oidc\`, and select **Grant admin consent to openid and offline_access permissions**.
3. Select **Register** and record the client ID.
4. Only to test with \`https://jwt.ms\`: under **Authentication**, select **ID tokens (used for implicit and hybrid flows)**. Turn it off before production.

### Create a sign-up and sign-in user flow

Select **User flows > New user flow > Sign up and sign in**. Name it \`B2C_1_signupsignin\`, select the identity providers, and add the claims (for example, \`email\`, \`name\`).

External ID difference: do not enable sign-up or social providers for the portals.

### Configure the ASP.NET app

\`\`\`bash
dotnet add package Microsoft.AspNetCore.Authentication.AzureADB2C.UI
\`\`\`

\`\`\`json
"AzureAdB2C": {
  "Instance": "https://<your-tenant-name>.b2clogin.com",
  "ClientId": "<your-web-app-client-id>",
  "Domain": "<your-tenant-name>.onmicrosoft.com",
  "SignUpSignInPolicyId": "B2C_1_signupsignin"
}
\`\`\`

\`\`\`csharp
services.AddAuthentication(AzureADB2CDefaults.AuthenticationScheme)
        .AddAzureADB2C(options => Configuration.Bind("AzureAdB2C", options));
\`\`\`

> **NOTE:** Dated: ASP.NET Core 6 and later have no \`Startup.cs\`, so register the services in \`Program.cs\`. The \`AzureADB2C.UI\` package is deprecated. For External ID, use \`Microsoft.Identity.Web\` as in [Configure the pilot .NET portal](#configure-the-pilot-net-portal).

Open a protected page to test. **Result:** The browser goes to the B2C sign-in page.

### Secure API access for external clients

The B2C client credentials flow is in public preview. See [Client credentials flow in Azure AD B2C](https://learn.microsoft.com/en-us/azure/active-directory-b2c/client-credentials-grant-flow).

1. Register \`MyWebAPI\`. In **Expose an API**, set the **Application ID URI** (for example, \`https://<your-b2c-tenant>.onmicrosoft.com/api\`).
2. In **Manifest**, add an app role to \`appRoles\`: \`"allowedMemberTypes": ["Application"]\`, a new GUID as \`id\`, \`"isEnabled": true\`, and a \`value\` such as \`app.read\`. Client credentials use app roles, not scopes.
3. Register \`ExternalClientApp\` and add a client secret.
4. In **API permissions > Add a permission > My APIs > MyWebAPI > Application permission**, select \`app.read\`, then grant admin consent.
5. Get a token. \`<policy>\` is any user flow or custom policy, for example \`B2C_1_signupsignin\`.

   \`\`\`bash
   curl -X POST https://<your-b2c-tenant>.b2clogin.com/<your-b2c-tenant>.onmicrosoft.com/<policy>/oauth2/v2.0/token \\
     -H "Content-Type: application/x-www-form-urlencoded" \\
     -d "client_id=<external-client-app-id>" \\
     -d "scope=https://<your-b2c-tenant>.onmicrosoft.com/api/.default" \\
     -d "client_secret=<client-secret>" \\
     -d "grant_type=client_credentials"
   \`\`\`

6. Call the API with the \`access_token\`:

   \`\`\`bash
   curl -X GET https://<your-api-endpoint>/api/values \\
     -H "Authorization: Bearer <access_token>"
   \`\`\`

### Federation to external identity providers

B2C custom policies (for example, \`B2C_1A_signupsignin\`) can federate to other Entra tenants. Each **OIDC technical profile** in the user journey points to 1 upstream tenant:

| Value | Meaning |
| --- | --- |
| \`client_id\` | The federation app registration in the **upstream tenant**. It is not your app registration. |
| \`METADATA\` URL | The upstream tenant. |
| \`<Key Id="client_secret" StorageReferenceId="B2C_1A_<ProviderName>Secret" />\` | The B2C **policy key** that holds the upstream secret. |

Your app is a public client without a secret. Each upstream tenant has a confidential federation app with a secret. B2C does not read that secret from the app registration: an administrator uploads a copy to the policy key.

| Sign-in button | Technical profile | Secret location | B2C policy key |
| --- | --- | --- | --- |
| Sign in with Provider A | \`AAD-OpenIdConnect\` | Tenant of Provider A | \`B2C_1A_ProviderASecret\` |
| Sign in with Provider B | \`AAD-OpenIdConnect-ProviderB\` | Tenant of Provider B | \`B2C_1A_ProviderBSecret\` |

## Troubleshooting

| Error | Cause | Fix |
| --- | --- | --- |
| \`AADB2C90289\` (\`invalid_client\`) | The federation secret expired or does not match its B2C policy key. | See [Fix an expired federation secret](#fix-an-expired-federation-secret). |
| \`AADSTS901011\` (no email address) | The workforce tenant did not send \`email\`. | Add the \`email\` optional claim to the federation app. For accounts without an email address, make email optional in the user flow ([Add OIDC for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-custom-oidc-federation-customers)). |
| \`40015\` | External ID could not validate the workforce response. | Make the issuer URI match the \`issuer\` of the discovery document exactly. |
| \`AADSTS500208\` | The account type cannot use this sign-in URL or tenant. | Check the sign-in endpoint and the account access. |
| No company button, or \`domain_hint\` does not redirect | Wrong or stale provider settings. | Use the tenant ID or \`onmicrosoft.com\` issuer, and the domain in \`domain_hint\`. After an issuer change, remove the provider from the user flow, save, add it again, and save. |
| \`CustomExtensionTimedOut\`, \`CustomExtensionThrottlingError\` | The JIT endpoint was too slow, or the extension limit was hit. | The timeout is 2,000 ms with 1 retry. Make the endpoint faster and migrate in batches. See [Troubleshoot a custom authentication extension](https://learn.microsoft.com/en-us/entra/identity-platform/custom-extension-troubleshoot). |

### Fix an expired federation secret

\`AADB2C90289: We encountered an 'invalid_client' error connecting to the identity provider.\` shows after a federated sign-in starts. The fault is in B2C, not in the app code: the secret of the upstream federation app expired (24 months maximum), and B2C sent the old copy from its policy key. A policy key \`updatedUtc\` of 1 to 2 years confirms it.

1. Find the profile. In **Azure AD B2C > Identity Experience Framework > Custom policies**, download the relying-party file, \`TrustFrameworkBase\`, and \`TrustFrameworkExtensions\`. In the OIDC technical profile, record the \`client_id\`, the \`METADATA\` tenant, and the \`StorageReferenceId\`.
2. In the **upstream tenant**, open the federation app, select **Certificates & secrets**, and create a new secret. Copy the value.
3. In the **B2C tenant** at portal.azure.com (not entra.microsoft.com), select **Identity Experience Framework > Policy keys** and open the key (for example, \`B2C_1A_<ProviderName>Secret\`).
4. Select the manual upload option, paste the secret, and keep key usage **Signature**. The dates are optional. Do not use Generate, RSA, or Certificate: the key must be a plain secret (\`kty: oct\`).
5. Test the sign-in again. The policy reads the key live, so no redeploy is necessary.

If the key has no upload button, delete it and create it again with the same name, or send this request in Postman (\`B2C tenant\` environment, \`TrustFrameworkKeySet.ReadWrite.All\`). A token for another tenant returns \`404\`.

\`\`\`http
POST https://graph.microsoft.com/beta/trustFramework/keySets/<PolicyKeyName>/uploadSecret
\`\`\`

\`\`\`json
{ "use": "sig", "k": "<new secret value>" }
\`\`\`

The JSON view of a policy key is read-only and never shows the secret.

To prevent it: set a reminder before each secret expires. Create the new app secret first, then upload it to the policy key. Each upstream tenant has its own secret and key, so check all of them.

## Related links

- [External ID pricing](https://aka.ms/ExternalIDPricing) and [billing model](https://learn.microsoft.com/en-us/entra/external-id/external-identities-pricing)
- [Add Microsoft Entra ID for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-entra-id-federation-customers)
- [Add OIDC for customer sign-in](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-custom-oidc-federation-customers)
- [Route invited users to an external identity provider](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-invite-external-identity-provider-users-customers)
- [Disable sign-up in a user flow](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-disable-sign-up-user-flow)
- [Plan your migration from Azure AD B2C](https://learn.microsoft.com/en-us/entra/external-id/customers/plan-your-migration-from-b2c-to-external-id)
- [Migrate users and credentials](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-users)
- [Just-in-time password migration](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-migrate-passwords-just-in-time)
- [Microsoft Entra authentication in App Service](https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad)
- [Azure AD B2C FAQ](https://learn.microsoft.com/en-us/azure/active-directory-b2c/faq)
- [Azure AD B2C OAuth 2.0 with Postman](doc:azure-ad-b2c-oauth-postman)
- [cURL commands for REST API calls](doc:curl-rest-api-examples)
`;export{e as default};