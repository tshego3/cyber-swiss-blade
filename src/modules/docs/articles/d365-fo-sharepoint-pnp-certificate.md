---
title: Connect to SharePoint with a PnP PowerShell certificate
summary: Replace a retired PnP PowerShell client secret connection to SharePoint Online with certificate-based authentication on an Entra ID app registration.
category: Dynamics 365
order: 30
gist: 4143abbf2ae6a49f115d90ace5f76ecb
---

# Connect to SharePoint with a PnP PowerShell certificate

This procedure changes a PnP PowerShell script from a client ID and client secret connection to a certificate connection. Use it when a SharePoint Online script fails because Microsoft retired Azure ACS authentication on your tenant.

PnP PowerShell scripts that use **Client ID + Client Secret** use an older authentication method, **Azure ACS (Azure Access Control Service)**. Microsoft retires ACS-based SharePoint authentication tenant by tenant. After the cutover, a script with `-ClientId` and `-ClientSecret` fails, although the credentials are still valid. The authentication path does not exist any more. The supported replacement is **certificate-based authentication** on an Entra ID (Azure AD) app registration.

> **WARNING:** Do not paste client secrets, certificate private keys, or thumbprints into chat tools, tickets, or shared documents. If a secret was shared outside a secrets vault, it is compromised. Rotate or delete it.

## Before you start

- An Entra ID app registration for the SharePoint integration, with an **Application (client) ID**.
- Access to the Azure portal, with permission to manage the certificates and API permissions of the app registration.
- An Entra ID or Global admin who can grant admin consent, if you do not have that role.
- PowerShell with the [PnP.PowerShell](https://pnp.github.io/powershell/) module. Install it on the machine, or under the account or service account, that runs the script.

## Create a self-signed certificate

1. Open PowerShell **as the same user or account that runs the script**.
2. Run these commands:

   ```powershell
   $cert = New-SelfSignedCertificate -Subject "CN=<YourAppName>" `
       -CertStoreLocation "Cert:\CurrentUser\My" `
       -NotAfter (Get-Date).AddYears(2)

   # Export the public part - this is what you upload to Azure
   Export-Certificate -Cert $cert -FilePath "$env:USERPROFILE\Downloads\<YourAppName>.cer"

   # Note this down - you need it in Step 4
   $cert.Thumbprint
   ```

3. Copy the thumbprint value that the command shows (a hexadecimal string of 40 characters).

> **NOTE:** If the script runs as a scheduled task under a service account or `SYSTEM`, use `Cert:\LocalMachine\My` instead of `Cert:\CurrentUser\My`. Run PowerShell as Administrator.

## Upload the certificate to the app registration

1. In the Azure portal, go to **Microsoft Entra ID > App registrations** and select your app registration.
2. In the left menu, select **Certificates & secrets**.
3. Select the **Certificates** tab (not Client secrets).
4. Select **Upload certificate**, select the `<YourAppName>.cer` file from the first task, and select **Add**.

## Configure the API permissions

The permissions for ACS-based access do not carry over. The app needs Entra ID (Microsoft Graph or SharePoint) application permissions.

1. In the same app registration, select **API permissions** in the left menu.
2. Select **Add a permission > SharePoint > Application permissions**.
3. Select **Sites.FullControl.All**, then select **Add permissions**. To limit access to specific site collections, use a narrower permission such as `Sites.Selected`.
4. Select **Grant admin consent for [your organization]**. This step needs an Entra ID admin.

**Result:** The permission shows a green "Granted" check mark. The certificate connection does not work before this.

## Update the connection script

1. Find each line that uses a client secret, for example:

   ```powershell
   Connect-PnPOnline -Url $siteUrl -ClientId "<client-id>" -ClientSecret "<client-secret>"
   ```

2. Change it to use the certificate thumbprint:

   ```powershell
   Connect-PnPOnline -Url $siteUrl `
       -ClientId "<client-id>" `
       -Tenant "<tenant-name>.onmicrosoft.com" `
       -Thumbprint "<thumbprint-from-step-1>"
   ```

## Test the connection

1. Run these commands:

   ```powershell
   Connect-PnPOnline -Url "https://<tenant-name>.sharepoint.com/sites/<site-name>/" `
       -ClientId "<client-id>" `
       -Tenant "<tenant-name>.onmicrosoft.com" `
       -Thumbprint "<thumbprint>"

   Get-PnPWeb   # should print the site title, with no errors
   ```

2. If `Get-PnPWeb` succeeds, run the full script.

## Delete the old client secret

1. Go to **Certificates & secrets > Client secrets**.
2. When the certificate connection works, delete the old secret. Do not keep it active.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `AADSTS700027` or other certificate sign-in errors | Wrong app registration or thumbprint | Make sure that you uploaded the `.cer` file to the correct app registration. Make sure that the thumbprint in the script agrees exactly with the certificate, with no extra spaces. |
| `Access denied` after a successful connection | No admin consent, or the scope is too narrow | Grant admin consent for the API permission. Make sure that the permission scope (for example `Sites.Selected`) includes the target site collection. |
| The script works interactively but fails as a scheduled task | The certificate is in `CurrentUser\My` of a different user | Make the certificate again under `LocalMachine\My`. Refer to the note in [Create a self-signed certificate](#create-a-self-signed-certificate). |
| The certificate has expired | Certificates from `New-SelfSignedCertificate` expire (after 2 years in this example) | Before the expiry date, make a new certificate, upload it, and update the thumbprint in the script. |

## Related links

- [PnP PowerShell](https://pnp.github.io/powershell/)
- [D365 F&O common commands and fixes](doc:d365-fo-common-commands)
- [D365 F&O development processes](doc:d365-fo-development-processes)
