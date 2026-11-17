---
title: Azure AD B2C OAuth 2.0 with Postman
summary: Get an Azure AD B2C access token in Postman with the OAuth 2.0 implicit flow, then call a protected web API with it.
category: Identity and APIs
order: 20
gist: e44fa0ccda509c1bf755578165fb2ac5
---

# Azure AD B2C OAuth 2.0 with Postman

This article shows how to get an access token from Azure AD B2C in Postman with the OAuth 2.0 implicit flow. Use the token to test a web API that B2C protects.

> **NOTE:** Dated (checked November 2026): Since May 1, 2025, new customers cannot buy Azure AD B2C. For new projects, use Microsoft Entra External ID (see [External identity for ASP.NET web apps with Microsoft Entra External ID](doc:entra-external-id-aspnet)). Microsoft also recommends the authorization code flow with PKCE instead of the implicit flow. In Postman, this is the **Authorization Code (With PKCE)** grant type.

## Before you start

- A registered application in **Azure AD B2C**.
- A **policy** (for example, a sign-up and sign-in policy).
- The **Client ID** (Application ID) of your B2C app.
- A **scope** for your web API.
- **Postman**.

## Configure the app in Azure AD B2C

Configure your B2C app for the **Implicit Grant Flow** in the Azure AD B2C portal.

1. In the Azure Portal, search for and select **Azure AD B2C**, then select **App registrations**.
2. Select your **B2C app**.
3. Under **Authentication**, set these values:
   - **Platform**: Web.
   - **Redirect URI**: the redirect URI of your app. For tests, use `https://oauth.pstmn.io/v1/browser-callback` or a URI that your B2C app already has.
   - **Implicit Grant**: enable **ID Token** and **Access Token** if necessary.
4. Under **API Permissions**, configure the scope of your web API, for example `https://{tenant}.onmicrosoft.com/{web api app id uri}/{scope name}`. Postman requests this scope when it gets the access token.
5. Record the **Client ID** and the **Tenant** name. You use them in Postman.

## Create the request in Postman

1. Open Postman.
2. Select **New**, then select **Request**.
3. Give the request a name (for example, `OAuth 2.0 Implicit Flow`).
4. Prepare the **Auth URL**. Enter it in the **Authorization** tab (see [Configure the OAuth 2.0 settings](#configure-the-oauth-20-settings)), not in the request URL field. The request URL is the API endpoint (see [Call the API with the token](#call-the-api-with-the-token)).

   ```text
   https://{tenant}.b2clogin.com/te/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize
   ```

   - Replace `{tenant}` with your tenant name.
   - Replace `{policy}` with the name of your B2C policy (for example, `b2c_1_signup_signin` or `b2c_1a_signup_signin`).

5. Go to the **Authorization** tab.
6. Set **Type** to `OAuth 2.0`.
7. For **OAuth 2.0 Flow**, select **Implicit**.

## Configure the OAuth 2.0 settings

Enter these values in the **Authorization** tab:

| Setting | Value |
| --- | --- |
| **Client ID** | The **Application (Client) ID** of your B2C app. |
| **Client Secret** | Leave it empty. The implicit flow does not use a secret. |
| **Auth URL** | `https://{tenant}.b2clogin.com/te/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize` |
| **Scope** | `https://{tenant}.onmicrosoft.com/{web api app id uri}/{scope name}`. Replace `{tenant}`, `{web api app id uri}`, and `{scope name}` with the values of your API scope. |
| **Redirect URL** | The redirect URL in your B2C app settings, for example `https://oauth.pstmn.io/v1/browser-callback` (or a different valid redirect URI). |
| **State** | Optional. For security, set it to a random string. |
| **Response Type** | `id_token token`. This is the standard response for the implicit flow. |

> **NOTE:** Verify the **Response Type** setting in your Postman version. The OAuth 2.0 **Implicit** grant type in Postman can have no **Response Type** field. In that case, Postman requests the token without this value.

Example configuration:

| Setting | Example value |
| --- | --- |
| **Auth URL** | `https://contoso.b2clogin.com/te/contoso.onmicrosoft.com/b2c_1_signup_signin/oauth2/v2.0/authorize` |
| **Client ID** | `12345678-abcd-1234-abcd-1234567890ab` |
| **Scope** | `https://contoso.onmicrosoft.com/my-api/scope.read` |
| **Redirect URI** | `https://oauth.pstmn.io/v1/browser-callback` |

## Get the access token

1. Select **Get New Access Token**.

   **Result:** Postman opens the B2C sign-in page. The page depends on the policy: it can ask for sign-in or show a custom UI.

2. Sign in with your credentials.

   **Result:** Postman captures the **Access Token** (and optionally an **ID Token**) and shows the access token in a dialog.

3. Select **Use Token** to use the token in the next requests.

## Call the API with the token

1. In the **Headers** section of the request, add this header:
   - **Key**: `Authorization`
   - **Value**: `Bearer {access_token}`
2. Replace `{access_token}` with the token from [Get the access token](#get-the-access-token).
3. Set the request URL to the API endpoint, for example:

   ```text
   https://{api_url}/your-api-endpoint
   ```

4. Select **Send**.

**Result:** The API sends a valid response.

## Security and token expiry

- Client-side applications (for example, single-page apps) usually use the implicit flow. The flow exposes the access token to the browser. Be careful if you use it in production for applications with sensitive data.
- Tokens from the implicit flow usually expire after a short time. Prepare your client for token expiry.
- The implicit flow does not use refresh tokens. When the token expires, the user must authenticate again.

## Troubleshooting

If the flow does not work, check these items:

- **Redirect URI**: The redirect URI in Postman must be the same as the URI in Azure AD B2C. The comparison is case-sensitive.
- **Scope**: The scope must be correct in the B2C app and in Postman.
- **Policy**: The **Auth URL** must contain the correct policy (for example, `b2c_1_signup_signin` or `b2c_1a_signup_signin`).
- **Browser pop-ups**: Sometimes the sign-in page does not load in Postman and opens in a browser. Make sure that the browser allows pop-ups.

## Related links

- [External identity for ASP.NET web apps with Microsoft Entra External ID](doc:entra-external-id-aspnet)
- [Get Spotify user playlists with Postman and OAuth 2.0](doc:postman-spotify-api)
