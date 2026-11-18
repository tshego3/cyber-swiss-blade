---
title: Build dynamic modals with the Kendo UI Window
summary: Open an Html.Kendo().Window() from JavaScript in ASP.NET MVC, load a Kendo UI Form into it, and show hidden partial views on demand.
category: ASP.NET and Blazor
order: 50
---

# Build dynamic modals with the Kendo UI Window

This guide tells how to open and fill an `Html.Kendo().Window()` from JavaScript in ASP.NET MVC, with a Kendo UI Form inside it. It also compares two methods to show partial views that stay hidden until the user needs them.

## Before you start

- An ASP.NET MVC project with jQuery.
- Telerik UI for ASP.NET MVC (Kendo UI helpers).
- A view model for the form. The examples use `MyFormViewModel` with the properties `Id`, `Name`, and `Email`.

## How the Window helper works

The `Html.Kendo().Window()` helper makes the HTML and JavaScript for the Kendo UI Window widget on the client. After the page renders the widget, you control it with its client-side API.

| Member | Use |
| --- | --- |
| `$("#myKendoWindow").data("kendoWindow")` | Gets the client-side instance of the widget. You need it for all API calls. |
| `open()` | Opens the window. |
| `close()` | Closes the window. |
| `center()` | Puts the window in the center of the screen. |
| `refresh(options)` | Loads the content again. Use the `url` option to load content from a new URL, for example with different data or after a submit. |
| Events | For example `open`, `close`, `activate`, `deactivate`, and `refresh`. Use the `bind()` method, or set them in the server-side helper. |

## Define the window in the Razor view

Define the window with the `Html.Kendo().Window()` helper. Set `Visible(false)` so that the window does not show when the page loads.

`LoadContentFrom("GetMyForm", "Home")` is the recommended method to load dynamic content, for example a form. `"GetMyForm"` is the action method and `"Home"` is the controller (`HomeController`). The window sends an AJAX request to this action and shows the result. To show static HTML, use `.Content()` instead.

```html
@Html.Hidden("currentId", 3000)
@(Html.Kendo().Window()
    .Name("myKendoWindow") // Unique name for your window
    .Title("My Form Window")
    .Width(600)
    .Height(400)
    .Modal(true) // Makes it a modal window
    .Visible(false) // Initially hidden
    .Actions(actions => actions.Minimize().Maximize().Close())
    // .Content("")
    // .Content(@<text>
    //     <div id="myForm"></div>
    // </text>)
    .LoadContentFrom("GetMyForm", "Home", new { id = 0 }) // Initial id, will be overridden Or use .Content() for static HTML
    .Draggable()
    .Resizable()
)

@section scripts {
    <script>
        $(document).ready(function() {
            var currentIdValue = $('#currentId').val();
            console.log("Value of currentId: " + currentIdValue); // This will log "Value of currentId: 3000"

            var newCurrentId = 5000;
            $('#currentId').val(newCurrentId);
            console.log("Updated currentId to: " + $('#currentId').val()); // This will log "Updated currentId to: 5000"
        });

        function openMyKendoWindowContent(id) {
            try {
                var window = $("#myKendoWindow").data("kendoWindow");
                if (!window) {
                    setTimeout(function() {
                        window = $("#myKendoWindow").data("kendoWindow");
                        loadMyKendoWindowWindowContent(window, id);
                    }, 100);
                } else {
                    loadMyKendoWindowWindowContent(window, id);
                }
            } catch (err) {
                console.error("Error opening Kendo window:", err);
            }
        }

        function loadMyKendoWindowWindowContent(window, id) {
            try {
                if (window) {
                    var url = '@Url.Action("GetMyForm", "Home", new { id = "__ID__" })';
                    url = url.replace("__ID__", id);
                    window.refresh({ url: url }).center().open();
                } else {
                    console.error("Kendo window not initialized");
                }
            } catch (err) {
                console.error("Error opening Kendo window:", err);
            }
        }
    </script>
}
```

The script does these things:

- It reads the hidden `currentId` field (3000) and changes it to 5000.
- `openMyKendoWindowContent(id)` gets the window instance. If the widget is not ready, it tries again after 100 ms.
- `loadMyKendoWindowWindowContent(window, id)` puts the ID in the action URL, loads the content, centers the window, and opens it.

## Create the controller actions

In `HomeController`, add the `GetMyForm` action. It returns a partial view with the Kendo UI Form. The `SubmitMyForm` action receives the form data.

```csharp
public class HomeController : Controller
{
    public ActionResult GetMyForm(int id) // Accept the 'id' parameter
    {
        MyFormViewModel model;

        if (id > 0)
        {
            // Retrieve an existing model based on the ID
            model = GetMyFormViewModelById(id); // Implement this method to fetch data
        }
        else
        {
            // Create a new empty model for a new form
            model = new MyFormViewModel();
        }

        return PartialView("_MyFormPartial", model);
    }

    // Example method to simulate fetching a model by ID
    private MyFormViewModel GetMyFormViewModelById(int id)
    {
        // In a real application, you would fetch this from a database or service
        return new MyFormViewModel { Id = id, Name = "Existing Item " + id, Email = "item" + id + "@example.com" };
    }

    [HttpPost]
    public ActionResult SubmitMyForm(MyFormViewModel model)
    {
        if (ModelState.IsValid)
        {
            // Process the form data
            // ...
            // If successful, you might want to close the window from the server-side
            // return Content("<script>window.parent.$('#myKendoWindow').data('kendoWindow').close();</script>");
            // Or return a success message or updated partial view
            return Content("Form submitted successfully!");
        }
        // If there are validation errors, return the same partial view to display them
        return PartialView("_MyFormPartial", model);
    }
}
```

## Create the partial view with the form

Create `_MyFormPartial.cshtml`. There are two options. A partial view cannot define a `@section`, so the scripts are inline. They run when the window inserts the HTML.

### Option 1: Kendo TextBox and Button controls

This option uses separate Kendo UI TextBox and Button controls. The Submit button shows the values in an alert. The Cancel button closes the window.

```html
@model YourNamespace.MyFormViewModel // If you're using a model for your form
@Html.HiddenFor(m => Model.Id)
<div class="myForm">
    <div class="row">
        <div class="col-md-6">
            <div class="form-group">
                @Html.LabelFor(m => m.Name, "Name")
                @(Html.Kendo().TextBox()
                    .Name("txtName")
                    .HtmlAttributes(new { @class = "form-control" })
                )
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-group">
                @Html.LabelFor(m => m.Email, "Email")
                @(Html.Kendo().TextBox()
                    .Name("txtEmail")
                    .HtmlAttributes(new { @class = "form-control" })
                )
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            @(Html.Kendo()
                .Button()
                .Name("btnSubmitButton")
                .Content("Submit")
                .HtmlAttributes(new { @class = "k-button k-primary" })
                .Events(ev => ev.Click("onFormSubmit"))
            )
        </div>
        <div class="col-md-6 text-right">
            @(Html.Kendo()
                .Button()
                .Name("btnCancelButton")
                .Content("Cancel")
                .Events(ev => ev.Click("onFormCancel"))
            )
        </div>
    </div>
</div>

<script>
    function onFormSubmit() {
        var userName = $("#txtName").data("kendoTextBox").value();
        var userEmail = $("#txtEmail").data("kendoTextBox").value();
        alert("Name: " + userName + " Email: " + userEmail );
    }

    function onFormCancel() {
        var kendoWindow = $("#myKendoWindow").data("kendoWindow");
        kendoWindow.close();
    }
</script>
```

### Option 2: Kendo UI Form

This option uses `Html.Kendo().Form()`. The form binds to the model, posts to `SubmitMyForm`, and validates fields when they lose focus.

```html
@model YourNamespace.MyFormViewModel // If you're using a model for your form
@Html.HiddenFor(m => Model.Id)
<div id="validation-success"></div>
@using (Html.Kendo().Form<YourNamespace.MyFormViewModel>() // Use Html.Kendo().Form() here
    .Name("myForm") // A unique name for your form
    .Items(items =>
    {
        items.AddGroup()
            .Layout("grid")
            .Grid(g => g
                .Cols(1)
                .Gutter(10))
            .Items(groupItems =>
            {
                groupItems.Add().Field(f => f.Name).Label("Name:");
                groupItems.Add().Field(f => f.Email).Label(l => l.Text("Email:").Optional(true));
                // Add more fields as needed
            });
    })
    .HtmlAttributes(new { action = Url.Action("SubmitMyForm", "Home"), method = "POST" }) // Specify form action
    .FormData(Model)
    .Validatable(v => 
    {
        v.ValidateOnBlur(true);
        v.ValidationSummary(false);
    })
    .Events(ev => ev.ValidateField("onFormValidateField").Submit("onFormSubmit").Clear("onFormClear"))
)

<script>
    $(document).ready(function() {
        var modelIdValue = $('#Id').val(); // Assuming the id rendered is 'Id'
        console.log("Value of Model.Id: " + modelIdValue); // This will log the actual value of Model.Id
    });

    function onFormValidateField(e) {
        $("#validation-success").html("");
    }

    function onFormSubmit(e) {
        // for the demo's purposes the Form submission is prevented by the next line. Remove e.preventDefault(), if you want to submit the Form.
        e.preventDefault();
        $("#validation-success").html("<div class='k-messagebox k-messagebox-success'>Form data is valid!</div>");
    }

    function onFormClear(e) {
        $("#validation-success").html("");
    }
</script>
```

### Notes for a form in a window

- **`LoadContentFrom` and `Iframe(true)`:** You can use `Iframe(true)` with `LoadContentFrom`, but this is not recommended. With an iframe, the window content has its own document. Then the content and the parent page cannot easily use the JavaScript of each other. For a Kendo UI Form, load a partial view without `Iframe(true)`.
- **Form submit:** The Kendo UI Form sends a standard form POST to the `action` that you set (`SubmitMyForm`). It does not use AJAX. Because the window does not use an iframe, the response replaces the full page. To keep the user in the window, call `e.preventDefault()` in the `submit` event and send the form data with AJAX.
- **Client-side validation:** If the model has data annotations, the Kendo UI Form validates on the client without more configuration.

## Open the window from JavaScript

Get the window instance and call its methods:

```js
$(document).ready(function() {
    // Get a reference to the Kendo UI Window instance
    var kendoWindow = $("#myKendoWindow").data("kendoWindow");

    // Example: Open the window when a button is clicked
    $("#openWindowButton").click(function() {
        kendoWindow.center().open(); // Centers the window and opens it
    });

    // You might also want to refresh the content if it's dynamic
    // For example, if the form content changes based on some context
    $("#openWindowButtonWithRefresh").click(function() {
        kendoWindow.refresh({ url: "@Url.Action("GetMyForm", "Home")" }).center().open();
    });

    // Example: Close the window from JavaScript
    $("#closeWindowButton").click(function() {
        kendoWindow.close();
    });

    // Example: Event handler for when the window opens (optional)
    kendoWindow.bind("open", function() {
        console.log("Kendo Window opened!");
        // You might want to perform some actions here,
        // like focusing on the first input in the form
        // $("#myForm input:first").focus();
    });
});
```

## Show hidden partial views on demand

A partial view can contain more partial views that stay hidden until the user needs them. There are two primary methods.

### Method 1: Render all partial views and hide them

This is the easiest method if the hidden content is not very large or complex.

1. In the main view or the parent partial view, render each child partial view with `@Html.Partial()` or `@{ Html.RenderPartial(); }`.
2. Put each child partial view in a `div` or a different wrapper element.
3. Set the wrapper style to `display: none;`.
4. To show a partial view, use JavaScript to make the wrapper visible. For example, use the jQuery `show()` or `slideDown()` method, or change the `display` style.

```html
@model YourNamespace.MyViewModel

<div id="parentPartialViewContainer">
    <div id="hiddenPartialView1" style="display: none;">
        @Html.Partial("_ChildPartialView1")
    </div>

    <div id="hiddenPartialView2" style="display: none;">
        @Html.Partial("_ChildPartialView2", Model.SomeChildModel)
    </div>

    <button id="showChild1">Show Child View 1</button>
    <button id="showChild2">Show Child View 2</button>
</div>

<script>
    $(document).ready(function() {
        $("#showChild1").click(function() {
            $("#hiddenPartialView1").show(); // Or .fadeIn(), .slideDown()
            $("#hiddenPartialView2").hide(); // Hide others if only one should be visible
        });

        $("#showChild2").click(function() {
            $("#hiddenPartialView2").show();
            $("#hiddenPartialView1").hide();
        });
    });
</script>
```

| Advantages | Disadvantages |
| --- | --- |
| Easiest to make. | The page loads all content at the start, also content that is not visible. Large or many hidden partial views make the initial load slower and use more bandwidth. |
| The content shows immediately because it is already in the DOM. | The browser parses the JavaScript and CSS in hidden partial views and can run them. This uses memory and CPU. |
| SEO: the content is in the initial page, so search engines can find it. | |

### Method 2: Load the content with AJAX

Use this method when the hidden content is large, the user opens it rarely, or the content needs specific data.

1. In the parent partial view, add an empty container (for example, a `div`).
2. When the user needs the content, send an AJAX request to a controller action that returns the partial view HTML.
3. If the request succeeds, put the HTML in the container and show it.

```html
<div id="parentPartialViewContainer">
    <div id="dynamicContentContainer">
        </div>

    <button id="loadChild1">Load and Show Child View 1</button>
    <button id="loadChild2">Load and Show Child View 2</button>
</div>

<script>
    $(document).ready(function() {
        $("#loadChild1").click(function() {
            // Show a loading indicator
            $("#dynamicContentContainer").html("Loading...");

            $.ajax({
                url: "@Url.Action("GetChildPartialView1", "MyController")",
                type: "GET",
                success: function(data) {
                    $("#dynamicContentContainer").html(data).show();
                },
                error: function() {
                    $("#dynamicContentContainer").html("Error loading content.");
                }
            });
        });

        $("#loadChild2").click(function() {
            // Example with passing data to the action
            $("#dynamicContentContainer").html("Loading...");
            $.ajax({
                url: "@Url.Action("GetChildPartialView2", "MyController")",
                type: "GET",
                data: { someId: 123 }, // Pass any necessary data
                dataType: "HTML",
                contentType: "application/html",
                success: function(data) {
                    $("#dynamicContentContainer").html(data).show();
                },
                error: function() {
                    $("#dynamicContentContainer").html("Error loading content.");
                }
            });
        });
    });
</script>
```

The controller:

```csharp
public class MyController : Controller
{
    public ActionResult GetChildPartialView1()
    {
        // Optionally pass a model
        return PartialView("_ChildPartialView1");
    }

    public ActionResult GetChildPartialView2(int someId)
    {
        // Retrieve data based on someId and pass a model
        var model = new SomeChildViewModel { Id = someId, Name = "Dynamic Item" };
        return PartialView("_ChildPartialView2", model);
    }
}
```

| Advantages | Disadvantages |
| --- | --- |
| The initial page load is faster, because it loads only the necessary content. | The user waits while the AJAX request completes. Show a loading indicator. |
| Less bandwidth: the page loads content only on request. | More complex: you need more JavaScript and a controller action for each partial view. |
| The content can change with user interaction or other data. | SEO: some search engines do not index AJAX content immediately. Modern search engines are better at this. |
| Better performance for complex views: the page renders complex HTML and JavaScript only when necessary. | |

### Select a method

| Content | Method | Examples |
| --- | --- | --- |
| Small, static, or always in the page but hidden | Method 1 | Tooltip content, inline forms that the user shows and hides |
| Large, dynamic, or rarely opened | Method 2 | User profiles, complex forms, search results, modal dialogs with different types of information |

A Kendo UI Window with `LoadContentFrom` is an example of Method 2. It loads a partial view (the Kendo UI Form) into a hidden container (the window) and then shows it.

### Recommendations for AJAX content

- **Caching:** If the content does not change frequently, keep the loaded HTML in a JavaScript variable. This prevents repeated server requests.
- **Error handling:** Tell the user when content does not load.
- **Loading indicators:** Always show visual feedback, for example a spinner, while the content loads.
- **Scripts:** Scripts directly in the partial view HTML usually run when the HTML goes into the DOM. If a script must run after the load (for example, to initialize Kendo widgets), put it inline in the partial view or call it from the AJAX success callback.

### Html.Partial and Html.RenderPartial

| Method | Behavior |
| --- | --- |
| `@Html.Partial()` | Returns an `MvcHtmlString`. You can keep the output in a variable. |
| `@{ Html.RenderPartial(); }` | Writes directly to the response stream. It is usually faster for large partial views because it does not buffer the HTML in memory. You must call it in a Razor code block (`@{ ... }`). |

Both methods work to show and hide content, because the HTML goes into the DOM in both cases.

## Related links

- [Get started with ASP.NET Core MVC](https://dotnet.microsoft.com/en-us/apps/aspnet/mvc)
- [Telerik UI for ASP.NET MVC Examples and Demos](https://demos.telerik.com/aspnet-mvc/)
