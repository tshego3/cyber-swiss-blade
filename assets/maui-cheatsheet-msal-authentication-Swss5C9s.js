var e=`---
title: MSAL authentication in .NET MAUI
summary: Links for MSAL.NET and Microsoft Entra ID sign-in in .NET MAUI, and a fix for the missing username in Azure AD B2C token responses.
category: .NET MAUI
order: 50
---

# MSAL authentication in .NET MAUI

This article collects resources for sign-in with MSAL.NET and Microsoft Entra ID (Azure AD) in .NET MAUI. It also gives a fix for B2C accounts that return no username.

## Before you start

- The \`Microsoft.Identity.Client\` (MSAL.NET) package.
- The \`CommunityToolkit.Mvvm\` package for the view model sample.

## Resources

| Name | Link | Notes |
| --- | --- | --- |
| Using MSAL.NET with MAUI | [Docs](https://learn.microsoft.com/en-us/entra/msal/dotnet/acquiring-tokens/desktop-mobile/mobile-applications) | |
| MAUI: Entra ID sample | [GitHub](https://github.com/AnjuliLJ/CodeWithAnjuli/tree/main/YouTube/MAUI%20-%20Entra%20ID/RecipesApp) | RecipesApp |
| Azure AD for Customers: MAUI tutorial | [GitHub](https://github.com/Azure-Samples/ms-identity-ciam-dotnet-tutorial/tree/main/1-Authentication/2-sign-in-maui) | |
| Enable sign-in with Azure AD for Customers | [GitHub](https://github.com/Azure-Samples/ms-identity-ciam-dotnet-tutorial/) | |

> **NOTE:** Dated (checked November 2026): Microsoft renamed Azure AD to Microsoft Entra ID, and Azure AD for Customers to Microsoft Entra External ID. Since May 2025, new customers cannot buy Azure AD B2C. Use Microsoft Entra External ID for new apps.

## Read the username from the claims

B2C does not return a preferred username for social accounts. In this case, \`Account.Username\` contains the text \`Missing from the token response\`. Read the \`name\` or \`email\` claim from the token instead.

> **NOTE:** Dated (checked November 2026): .NET 10 marks \`DisplayAlert\` as obsolete. Use \`DisplayAlertAsync\`. The sample keeps the old name.

This view model method uses \`Account.Username\` if it is valid. If not, it reads the \`email\` claim. If there is no claim, it shows an error.

\`\`\`csharp
using CommunityToolkit.Mvvm.ComponentModel;
using Microsoft.Identity.Client;
namespace DemoApp.ViewModels
{
    public partial class MSALViewModel : ObservableObject
    {
        private async Task OnSuccessAzureADLogin(AuthenticationResult? authenticationResult)
        {
            try
            {
                if (authenticationResult is not null && string.IsNullOrEmpty(authenticationResult.AccessToken))
                {
                    await Shell.Current.DisplayAlert("Error", "Login Failed", "Okay");
                }
                else if (authenticationResult is not null)
                {
                    string userName = string.Empty;
                    System.Security.Claims.ClaimsIdentity? identity = authenticationResult.ClaimsPrincipal.Identity as System.Security.Claims.ClaimsIdentity;
                    List<System.Security.Claims.Claim>? claims = identity?.Claims.ToList();
                    if (string.IsNullOrEmpty(authenticationResult.Account.Username) == false &&
                        authenticationResult.Account.Username.Equals("Missing from the token response", StringComparison.CurrentCultureIgnoreCase).Equals(false)
                    )
                    {
                        userName = authenticationResult.Account.Username;
                    }
                    else if (identity is not null && claims is not null)
                    {
                        System.Security.Claims.Claim? claim = claims.Where(c => c.Type.Equals("email", StringComparison.CurrentCultureIgnoreCase)).FirstOrDefault();
                        if (claim is not null) { userName = claim.Value; }
                        else
                        {
                            await Shell.Current.DisplayAlert("Error", "Login Failed", "Okay");
                            return;
                        }
                    }
                    else
                    {
                        await Shell.Current.DisplayAlert("Error", "Login Failed", "Okay");
                        return;
                    }
                    Shell.Current.CurrentPage.IsBusy = true;
                    // Further Processing
                    await Task.Delay(1000);
                    Shell.Current.CurrentPage.IsBusy = false;
                    await Shell.Current.GoToAsync(nameof(MainPage));
                }
                else
                {
                    await Shell.Current.DisplayAlert("Error", "Login Failed", "Okay");
                }
            }
            catch (Exception ex)
            {
                await Shell.Current.DisplayAlert("Error", ex.Message, "Okay");
            }
        }
    }
}
\`\`\`

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| \`Account username: Missing from the token response\` | B2C does not return a preferred username for social accounts. | Read the \`name\` or \`email\` claim from the token. See [Read the username from the claims](#read-the-username-from-the-claims). |

## Related links

- [Entra External ID for ASP.NET](doc:entra-external-id-aspnet)
- [Azure AD B2C OAuth 2.0 with Postman](doc:azure-ad-b2c-oauth-postman)
- [.NET MAUI cheat sheet](doc:maui-cheatsheet)
`;export{e as default};