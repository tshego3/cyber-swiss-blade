---
title: D365 F&O development processes
summary: An index of D365 F&O development guides, X++ samples, SQL queries, and setup procedures, with browser shortcuts and useful links.
category: Dynamics 365
order: 10
---

# D365 F&O development processes

This article is the start page for the Dynamics 365 Finance and Operations (D365 F&O) development guides. Use the tables to find a topic, a browser shortcut, or a reference link.

## Articles in this series

| Name | Link | Notes |
| --- | --- | --- |
| Common commands and fixes | [D365 F&O common commands and fixes](doc:d365-fo-common-commands) | VM commands, platform updates, UAT database connection, environment admin, Azure Functions fix. |
| SharePoint PnP certificate | [Connect to SharePoint with a PnP PowerShell certificate](doc:d365-fo-sharepoint-pnp-certificate) | Replace a retired client secret connection. |
| Tips and navigation | [D365 F&O and AX 2012 tips and navigation paths](doc:d365-fo-tips-and-navigation) | Navigation paths, security hierarchy, batch jobs, AX 2012 tasks. |
| LCS missing modules | [Fix the LCS deploy error for missing modules](doc:d365-fo-lcs-missing-modules) | Package ISV and FormAdaptor modules in the build. |
| SQL queries | [D365 F&O and AX SQL queries](doc:d365-fo-sql-queries) | Metadata lookups, paging, functions, sync fix, SharingView. |
| X++ code snippets | [D365 F&O and AX X++ code snippets](doc:d365-fo-xpp-code-snippets) | JSON, files, AOT resources, maps, companies, direct SQL, TLS 1.2. |
| SysOperation framework | [Create a batch job with the SysOperation framework](doc:d365-fo-sysoperation-framework) | Contract, service, controller, and menu item. |
| Azure Blob Storage | [Use the Azure Blob Storage REST API from X++](doc:d365-fo-azure-blob-storage) | List, copy, move, and delete blobs. |
| Custom service | [Create a custom service in D365 F&O](doc:d365-fo-custom-service) | Request, response, service, service group, privilege, and Postman call. |
| AES encryption | [AES encryption in AX 2012, D365, and C#](doc:d365-fo-aes-encryption) | The same AES logic in three versions. |
| SQL injection validation | [Validate SQL statements against injection in X++](doc:d365-fo-sql-injection-validation) | An allow list and block list check with tests. |
| App registration | [Azure App Registration for D365 F&O API access](doc:d365-fo-azure-app-registration) | OAuth token, OData calls, invalid user fixes. |
| Visual Studio extension | [Enable the D365 F&O extension in Visual Studio](doc:d365-fo-visual-studio-extension) | Install the extension from a service update. |
| Unified Developer Experience | [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience) | Provision, connect, build, deploy, debug, test, CI/CD. |
| UDE asset download | [Recover a failed UDE asset download](doc:d365-fo-ude-asset-download) | Fix the download or get the assets another way. |
| MCP server | [Set up the D365 F&O MCP server](doc:d365-fo-mcp-server) | Azure, offline, and LAN setups of d365fo-mcp-server. |

## Browser shortcuts

Replace `{d365ffo-url}` with the URL of your environment and `{company}` with the legal entity. Replace `placeholder` with the table or class name.

| Task | URL |
| --- | --- |
| View a table | `https://{d365ffo-url}/?cmp={company}&mi=SysTableBrowser&tableName=placeholder` |
| Edit a table | `https://{d365ffo-url}/?cmp={company}&mi=DEVSysTableBrowser&TableName=placeholder` |
| Run a runnable class or a SysOperation class | `https://{d365ffo-url}/?cmp={company}&mi=SysClassRunner&cls=placeholder` |
| View system errors | `https://{d365ffo-url}/?cmp={company}&mi=DEVCSXppCallStackTable` |
| Run a SQL statement | `https://{d365ffo-url}/?cmp={company}&mi=DEVSQLQueryExecute` |

## Find your public IP address

- With Cloudflare: [speed.cloudflare.com](https://speed.cloudflare.com/) or [radar.cloudflare.com/ip](https://radar.cloudflare.com/ip).
- With CMD or PowerShell:

  ```cmd
  nslookup myip.opendns.com. resolver1.opendns.com
  ```

## Useful links

### Tools

| Name | Link | Notes |
| --- | --- | --- |
| Azure portal | [portal.azure.com](https://portal.azure.com/) | |
| Postman | [postman.co](https://www.postman.co/) | |
| gguf-pwa | [tshego3.github.io/gguf-pwa](https://tshego3.github.io/gguf-pwa/) | |
| LCS | [sa.lcs.dynamics.com](https://sa.lcs.dynamics.com/) | View Lifecycle Services. |
| d365fo-mcp-server | [GitHub](https://github.com/dynamics365ninja/d365fo-mcp-server) | Setup guide: [Set up the D365 F&O MCP server](doc:d365-fo-mcp-server). |

### Finance and Operations

| Name | Link | Notes |
| --- | --- | --- |
| Extensibility | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/extensibility/extensibility-home-page) | |
| T-SQL debug | [T-SQL debugger in SSMS and Visual Studio](doc:tsql-debugger-ssms-visual-studio) | |
| Debug UAT database | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/database/dbmovement-scenario-debugdiag) | Refer also to [D365 F&O common commands and fixes](doc:d365-fo-common-commands). |
| Using custom services | [Microsoft Learn](https://learn.microsoft.com/nl-nl/previous-versions/dynamicsax-2012/appuser-itpro/using-custom-services) | AX 2012. |
| Apply a D365 service update | [dynamics365musings.com](https://dynamics365musings.com/d365-service-update/) | |
| Mitigate a SQL injection attack | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/query-with-parameters) | |
| X++ session run time functions | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/xpp-session-run-time-functions) | |
| X++ container runtime functions | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/xpp-container-run-time-functions) | |
| Sending SMTP email using MailKit in C# | [Send SMTP email with MailKit](doc:csharp-mailkit-smtp-email) | |
| Cross-company data sharing for developers | [Microsoft Learn](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/sysadmin/drs-srs-dev) | |

### Certification

| Name | Link | Notes |
| --- | --- | --- |
| Microsoft Certified: Dynamics 365: Finance and Operations Apps Developer Associate | [Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/d365-finance-and-operations-apps-developer-associate/?practice-assessment-type=certification) | |
| OnVUE | [candidatelaunchst.onvue.com](https://candidatelaunchst.onvue.com/) | Online exam launcher. |
| Microsoft OnVUE online testing information with Pearson VUE | [pearsonvue.com](https://www.pearsonvue.com/us/en/microsoft/onvue.html) | |

## Related links

- [Extensibility home page](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/extensibility/extensibility-home-page)
- [D365 F&O common commands and fixes](doc:d365-fo-common-commands)
- [Set up the D365 F&O Unified Developer Experience](doc:d365-fo-unified-developer-experience)
