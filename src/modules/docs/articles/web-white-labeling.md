---
title: White-labeling a web page with jQuery
summary: A small HTML and jQuery page that sets an element color from a color map, as a start for white-label themes.
category: TypeScript and JavaScript
order: 50
---

# White-labeling a web page with jQuery

This HTML page keeps brand colors in a JavaScript object and uses jQuery to apply one color to an element. Use it as a start point when one page must show different brand colors for different customers (white-labeling).

## Before you start

- A browser.
- jQuery 3.6.1. The page loads it from the Google CDN.

> **NOTE:** Dated (checked November 2026): jQuery 3.6.1 is from 2022. Change the script URL to the current jQuery version.

## Code

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bootstrap demo</title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.1/jquery.min.js"></script>
  </head>

  <body>
    <div id="myDiv">
      <p>
        Test Message
      </p>
    </div>
    <script>
      // $.getJSON("colors.json", function (data) {
      //   var colors = data;
      // });

      var colors = {
        rosegold: "#ffa39e",
        white: "#ffffff",
        black: "#000000"
      };

      var myDiv = $("#myDiv");

      myDiv.css("background-color", colors["rosegold"]);
    </script>
  </body>
</html>
```

## How to use it

1. Save the code as an `.html` file.
2. Open the file in a browser.

**Result:** The `myDiv` element shows the text "Test Message" on a rose gold background (`#ffa39e`).

To use a different brand color, change the key in `colors["rosegold"]` to `white`, `black`, or a new key that you add to `colors`.

## How it works

- The `colors` object maps a color name to a hex value.
- `$("#myDiv")` selects the element, and `.css("background-color", ...)` sets its background color from the map.
- The commented-out `$.getJSON("colors.json", ...)` call shows the next step: load the color map from a JSON file for each customer. The callback only sets a local variable, so you must move the `.css` call into the callback before you use it.
