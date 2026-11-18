---
title: Create API documentation for ASP.NET Web API in .NET Framework 4.x
summary: Document an ASP.NET Web API 4.x project with XML comments, Swagger through Swashbuckle, Postman, and other tools.
category: ASP.NET and Blazor
order: 60
gist: 99d61e5cc8c771390e81f83bb821705b
---

# Create API documentation for ASP.NET Web API in .NET Framework 4.x

This article tells how to document an ASP.NET Web API project on .NET Framework 4.x. The usual tools are XML documentation comments, Swagger through Swashbuckle, and Postman. The procedure is different from ASP.NET Core.

## Before you start

- An ASP.NET Web API project on .NET Framework 4.x.
- Visual Studio with the NuGet Package Manager Console.
- Postman (optional).

## Enable XML documentation comments

The compiler writes an XML file with the information from your code comments: classes, methods, parameters, and return types.

1. In **Solution Explorer**, right-click your project.
2. Click **Properties**.
3. On the **Build** tab, select **XML documentation file**.
4. Set the file name to `App_Data\YourProjectName.xml` or to a different name.

## Install and configure Swashbuckle

Swashbuckle adds Swagger to an ASP.NET Web API project. Swagger gives an interactive UI for the API documentation.

1. Open the **NuGet Package Manager Console**.
2. Install the Swashbuckle package:

   ```powershell
   Install-Package Swashbuckle
   ```

3. Enable Swagger and the Swagger UI in `WebApiConfig.Register`. `Application_Start` in `Global.asax.cs` calls this method.

   ```csharp
   using Swashbuckle.Application;

   public class WebApiConfig
   {
       public static void Register(HttpConfiguration config)
       {
           // Other Web API configurations...

           // Enable Swagger
           config.EnableSwagger(c =>
               c.SingleApiVersion("v1", "Your API Title"))
               .EnableSwaggerUi();  // Enable the Swagger UI
       }
   }
   ```

4. Run the project and open the Swagger UI at `http://yourserver/swagger`. This URL redirects to `http://yourserver/swagger/ui/index`.

**Result:** The Swagger UI shows all routes. You can test the API from the browser.

> **NOTE:** Verify if the package added `App_Start/SwaggerConfig.cs`. This file also calls `EnableSwagger` when the app starts. Configure Swagger in one place only (`SwaggerConfig.cs` or `WebApiConfig.cs`). If you call it in both, the Swagger routes are registered two times and the app fails with a duplicate route name error.

> **NOTE:** Dated (checked November 2026): Swashbuckle for ASP.NET Web API 4.x (last version 5.6.0, 2017) is not maintained and makes Swagger 2.0 documents. For ASP.NET Core, use `Swashbuckle.AspNetCore` or the built-in `Microsoft.AspNetCore.OpenApi` package (.NET 9 and later).

## Show XML comments in Swagger

This task is optional. It adds your XML comments to the Swagger UI. You must first [enable XML documentation comments](#enable-xml-documentation-comments).

1. In `WebApiConfig.cs`, give Swagger the path of the XML documentation file:

   ```csharp
   var xmlCommentsPath = HttpContext.Current.Server.MapPath("~/App_Data/YourProjectName.xml");
   config.EnableSwagger(c =>
   {
       c.SingleApiVersion("v1", "Your API Title");
       c.IncludeXmlComments(xmlCommentsPath);  // Link XML documentation file
   }).EnableSwaggerUi();
   ```

2. Add XML comments to your controllers and methods. Use `<response>` tags and the `SwaggerResponse` attribute to document response codes and types. The Swagger UI shows these comments.

## Example controller

This controller shows XML comments, response codes, and response types for Swagger:

```csharp
using System.Collections.Generic;
using System.Web.Http;
using Swashbuckle.Swagger.Annotations;

namespace MyWebAPI.Controllers
{
    public class UsersController : ApiController
    {
        private readonly IUserService userService;

        public UsersController(IUserService userService)
        {
            this.userService = userService;
        }

        /// <summary>
        /// Retrieves a list of all users.
        /// </summary>
        /// <returns>A list of users.</returns>
        /// <response code="200">Returns the list of users</response>
        [HttpGet]
        [Route("api/users")]
        [SwaggerResponse(200, Type = typeof(IEnumerable<User>))]
        public IHttpActionResult GetUsers()
        {
            var users = userService.GetAllUsers();
            return Ok(users);
        }

        /// <summary>
        /// Retrieves a specific user by ID.
        /// </summary>
        /// <param name="id">The ID of the user.</param>
        /// <returns>A user object.</returns>
        /// <response code="200">Returns the user</response>
        /// <response code="404">If the user is not found</response>
        [HttpGet]
        [Route("api/users/{id}")]
        [SwaggerResponse(200, Type = typeof(User))]
        [SwaggerResponse(404)]
        public IHttpActionResult GetUser(int id)
        {
            var user = userService.GetUserById(id);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }
    }
}
```

## Generate documentation in Postman

This task is optional. Use it if you test your API with Postman.

1. In Postman, create a collection for your API endpoints.
2. Add your requests (GET, POST, PUT, DELETE, and other methods).
3. Click **View in Web** at the top right.
4. In the sidebar, select **Documentation**, then click **Generate Documentation** for your collection.

**Result:** You can share the documentation or export it to other tools.

> **NOTE:** Dated (checked November 2026): Current Postman versions do not have the **View in Web** and **Generate Documentation** commands. Postman makes documentation for each collection automatically. Open the collection and select the documentation icon in the right sidebar. To share the documentation, publish it from the collection documentation page.

## Other tools

| Name | Notes |
| --- | --- |
| Apiary | Use it to write API documentation manually. It has functions similar to Swagger. |
| ReDoc | An open-source tool. It makes API documentation from Swagger or OpenAPI specifications. |
| ASP.NET Web API Help Page | Generates help pages from the API and the XML comments. See the [ModelDescriptionGenerator code sample](doc:aspnet-model-description-generator). |

## Related links

- [ModelDescriptionGenerator for ASP.NET Web API Help Pages](doc:aspnet-model-description-generator)
