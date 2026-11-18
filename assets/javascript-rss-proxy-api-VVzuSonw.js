var e=`---
title: Build a JavaScript server-side proxy API for RSS feeds
summary: Build a Node.js and Express proxy that gets RSS feeds as XML or JSON, then deploy it as a Netlify function with CORS headers.
category: TypeScript and JavaScript
order: 30
---

# Build a JavaScript server-side proxy API for RSS feeds

This tutorial shows how to build a server-side proxy API that gets an RSS feed and returns it as XML or JSON. A browser app can call the proxy when the feed server does not allow cross-origin requests. The full project is in the [rss-proxy-api repository](https://github.com/tshego3/rss-proxy-api).

## Before you start

- Basic knowledge of JavaScript and Node.js.
- [Node.js](https://nodejs.org/).
- A code editor, for example [VS Code](https://code.visualstudio.com/).
- \`npm\` or \`yarn\` to manage packages.
- A Netlify account, if you want to deploy the API.

## Set up the Node.js project

1. Create a directory for the project:

   \`\`\`bash
   mkdir rss-proxy-api
   cd rss-proxy-api
   \`\`\`

2. Start a new Node.js project:

   \`\`\`bash
   npm init -y
   \`\`\`

   **Result:** npm makes a \`package.json\` file.

3. Install the dependencies:

   \`\`\`bash
   npm install express axios rss-parser
   \`\`\`

| Package | Use |
| --- | --- |
| \`express\` | A minimal web framework for Node.js. It handles HTTP requests and responses. |
| \`axios\` | A promise-based HTTP client. It gets the feed from the URL. |
| \`rss-parser\` | A library that changes an RSS feed into a JavaScript object. |

## Create the server

Create a file with the name \`server.js\`:

\`\`\`js
const express = require("express");
const axios = require("axios");
const RSSParser = require("rss-parser");

const app = express();
const port = 3000;

// Create a new RSS parser instance
const parser = new RSSParser();

// Define an endpoint for fetching RSS feeds
app.get("/rss-proxy", async (req, res) => {
  const { url, format = "xml" } = req.query;

  // Check if URL parameter is provided
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter.' });
  }

  // Validate format parameter
  if (format !== "xml" && format !== "json") {
    return res
      .status(400)
      .json({ error: 'Format must be either "xml" or "json".' });
  }

  try {
    // Fetch the RSS feed data
    const response = await axios.get(url, {
      headers: { Accept: "application/xml" },
    });

    if (format === "json") {
      // Parse the RSS data and send as JSON
      const feed = await parser.parseString(response.data);
      res.json(feed);
    } else {
      // Send the original XML response
      res.type("application/xml");
      res.send(response.data);
    }
  } catch (error) {
    console.error(error);

    // Error handling: check if it's a network error or invalid RSS
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      // The request was made, but no response was received
      res
        .status(500)
        .json({ error: "Network error, no response from server." });
    } else {
      // General error (invalid RSS, etc.)
      res
        .status(500)
        .json({ error: "Failed to parse RSS feed or invalid URL." });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(\`Server running on http://localhost:\${port}\`);
});
\`\`\`

The \`/rss-proxy\` endpoint accepts 2 query parameters:

| Parameter | Required | Values |
| --- | --- | --- |
| \`url\` | Yes | The URL of the RSS feed. |
| \`format\` | No | \`xml\` (default) returns the original feed. \`json\` returns the feed that \`rss-parser\` parsed. |

The endpoint handles errors as follows:

| Condition | Status | Error message |
| --- | --- | --- |
| No \`url\` parameter | 400 | \`Missing "url" query parameter.\` |
| \`format\` is not \`xml\` or \`json\` | 400 | \`Format must be either "xml" or "json".\` |
| The feed server returns a status outside the 2xx range | The status from the feed server | The response body from the feed server |
| The request was sent, but no response came back | 500 | \`Network error, no response from server.\` |
| Other errors, for example a feed that is not valid RSS | 500 | \`Failed to parse RSS feed or invalid URL.\` |

## Test the API

1. Start the server:

   \`\`\`bash
   node server.js
   \`\`\`

   **Result:** The server runs at \`http://localhost:3000\`.

2. Send a request with \`curl\`, Postman, or a browser. This example gets the [BBC News RSS feed](http://feeds.bbci.co.uk/news/rss.xml):

   \`\`\`text
   http://localhost:3000/rss-proxy?url=http://feeds.bbci.co.uk/news/rss.xml
   \`\`\`

   **Result:** The API returns the original XML feed, because \`xml\` is the default format.

3. Add \`&format=json\` to get the parsed feed as JSON:

   \`\`\`text
   http://localhost:3000/rss-proxy?url=http://feeds.bbci.co.uk/news/rss.xml&format=json
   \`\`\`

   **Result:** The API returns JSON like this:

   \`\`\`json
   {
     "title": "BBC News - Home",
     "description": "The latest stories from the BBC News web site.",
     "link": "http://www.bbc.co.uk/news",
     "items": [
       {
         "title": "Ukraine war: Putin says Russian military to get more weapons",
         "link": "https://www.bbc.co.uk/news/world-europe-66435328",
         "pubDate": "Mon, 14 Aug 2023 11:24:59 GMT",
         "contentSnippet": "Russian President Vladimir Putin says Russia will boost arms production and has pledged more help for soldiers on the front line."
       },
       {
         "title": "China sees first decline in youth unemployment",
         "link": "https://www.bbc.co.uk/news/world-66435262",
         "pubDate": "Mon, 14 Aug 2023 11:14:00 GMT",
         "contentSnippet": "China's youth unemployment has reached its highest level in recent history, with many young people struggling to find jobs."
       }
       // More items...
     ]
   }
   \`\`\`

### Error examples

A request without the \`url\` parameter:

\`\`\`text
http://localhost:3000/rss-proxy
\`\`\`

Response:

\`\`\`json
{
  "error": "Missing \\"url\\" query parameter."
}
\`\`\`

A request with a URL that is not valid:

\`\`\`text
http://localhost:3000/rss-proxy?url=http://invalid-url.com/feed.xml
\`\`\`

Response:

\`\`\`json
{
  "error": "Failed to parse RSS feed or invalid URL."
}
\`\`\`

> **NOTE:** The error message depends on the failure. If the host does not respond, the API returns \`Network error, no response from server.\` If the host returns an error status, the API returns that status and body.

## Prepare the project for Netlify

Netlify runs serverless functions. A Netlify function is a JavaScript (or Go) function that handles an HTTP request. Move the server code into a Netlify function.

1. Create the \`netlify/functions\` folder and add the \`rss-proxy.js\` file. The project structure is now:

   \`\`\`text
   rss-proxy-api/
   ├── netlify/
   │   └── functions/
   │       └── rss-proxy.js
   ├── package.json
   ├── package-lock.json
   └── README.md
   \`\`\`

2. Put this code in \`rss-proxy.js\`:

   \`\`\`js
   const axios = require("axios");
   const RSSParser = require("rss-parser");

   // Create a new RSS parser instance
   const parser = new RSSParser();

   exports.handler = async (event, context) => {
     const { url, format = "xml" } = event.queryStringParameters;

     // Check if URL parameter is provided
     if (!url) {
       return {
         statusCode: 400,
         body: JSON.stringify({ error: 'Missing "url" query parameter.' }),
       };
     }

     // Validate format parameter
     if (format !== "xml" && format !== "json") {
       return {
         statusCode: 400,
         body: JSON.stringify({ error: 'Format must be either "xml" or "json".' }),
       };
     }

     try {
       // Fetch the RSS feed data
       const response = await axios.get(url, {
         headers: { Accept: "application/xml" },
       });

       let body;
       if (format === "json") {
         // Parse the RSS data and send as JSON
         const feed = await parser.parseString(response.data);
         body = JSON.stringify(feed);
       } else {
         // Send the original XML response
         body = response.data;
       }

       // Set CORS headers to allow cross-origin requests
       return {
         statusCode: 200,
         headers: {
           "Content-Type":
             format === "json" ? "application/json" : "application/xml",
           "Access-Control-Allow-Origin": "*", // Allow all origins (can be restricted if needed)
           "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Allow GET, POST, and OPTIONS requests
           "Access-Control-Allow-Headers": "Content-Type", // Allow headers
         },
         body,
       };
     } catch (error) {
       console.error(error);

       // Error handling: check if it's a network error or invalid RSS
       if (error.response) {
         return {
           statusCode: error.response.status,
           body: JSON.stringify({ error: error.response.data }),
         };
       } else if (error.request) {
         return {
           statusCode: 500,
           body: JSON.stringify({
             error: "Network error, no response from server.",
           }),
         };
       } else {
         return {
           statusCode: 500,
           body: JSON.stringify({
             error: "Failed to parse RSS feed or invalid URL.",
           }),
         };
       }
     }
   };
   \`\`\`

The function has the same logic as \`server.js\`, with these differences:

- \`exports.handler\` is the entry point of the Netlify function. Express is not necessary.
- The function reads the parameters from \`event.queryStringParameters\`.
- The function returns an object with \`statusCode\`, \`headers\`, and \`body\`.
- A successful response sets the \`Content-Type\` and the CORS headers, so a browser app on a different origin can call the API.

> **NOTE:** The \`Access-Control-Allow-Origin\` value \`*\` allows all origins. Change it to your site origin to restrict access.

## Configure Netlify

Create a \`netlify.toml\` file in the root of the project:

\`\`\`ini
[build]
  functions = "netlify/functions"
  publish = "."

[[plugins]]
  package = "@netlify/plugin-functions-install-core"
\`\`\`

The \`functions\` setting tells Netlify that the serverless functions are in the \`netlify/functions\` folder.

> **NOTE:** Dated (checked November 2026): Netlify now bundles the dependencies of functions automatically, so \`@netlify/plugin-functions-install-core\` is no longer necessary. Verify this in the Netlify documentation, then remove the \`[[plugins]]\` block.

## Deploy to Netlify

1. Install the Netlify CLI globally:

   \`\`\`bash
   npm install -g netlify-cli
   \`\`\`

2. Log in to Netlify:

   \`\`\`bash
   netlify login
   \`\`\`

   **Result:** A browser window opens to authenticate you.

3. Go to the project directory and link the project to Netlify:

   \`\`\`bash
   netlify init
   \`\`\`

4. Follow the prompts to create a new site or link an existing site.
5. Deploy the site:

   \`\`\`bash
   netlify deploy --prod
   \`\`\`

   **Result:** Netlify gives you a live URL for the API.

## Test the deployed API

Send a request to the live URL:

\`\`\`text
https://<your-netlify-site-name>.netlify.app/.netlify/functions/rss-proxy?url=http://feeds.bbci.co.uk/news/rss.xml&format=json
\`\`\`

**Result:** The API returns the parsed RSS feed as JSON, the same as the local server.

## Add a custom domain

This step is optional. Use a custom domain in place of the default Netlify URL.

1. Open the dashboard of your site in Netlify.
2. Click the **Domain Management** tab.
3. Follow the instructions to add a custom domain. You can buy a domain from Netlify, or point a domain that you have to your site.

## Related links

- [rss-proxy-api repository](https://github.com/tshego3/rss-proxy-api)
- [Node.js](https://nodejs.org/)
- [VS Code](https://code.visualstudio.com/)
- [BBC News RSS feed](http://feeds.bbci.co.uk/news/rss.xml)
- [PHP RSS feed reader](doc:php-rss-reader)
`;export{e as default};