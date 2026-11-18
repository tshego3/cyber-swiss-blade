var e=`---
title: YARP reverse proxy with a response body transform
summary: A YARP reverse proxy that decompresses text responses, changes the body, and compresses it again before it goes to the client.
category: ASP.NET and Blazor
order: 70
---

# YARP reverse proxy with a response body transform

This code sample is the \`Program.cs\` file of an ASP.NET Core reverse proxy that uses YARP (Yet Another Reverse Proxy). The proxy changes the body of text responses from the destination server. Use it as a start point when you must rewrite HTML or other text that passes through the proxy.

## Before you start

- An ASP.NET Core project (minimal hosting model).
- The \`Yarp.ReverseProxy\` NuGet package.
- A \`ReverseProxy\` section with routes and clusters in the app configuration (for example, \`appsettings.json\`).

## Code

\`\`\`csharp
// https://microsoft.github.io/reverse-proxy/articles/transforms.html#response-body-transforms
using System.IO.Compression;
using System.Text;
using Yarp.ReverseProxy.Transforms;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .AddTransforms(context =>
    {
        context.AddResponseTransform(async responseContext =>
        {
            try
            {
                if (responseContext.ProxyResponse != null
                    && string.IsNullOrEmpty(responseContext.ProxyResponse!.Content.Headers.ContentType!.MediaType!).Equals(false)
                    && responseContext.ProxyResponse!.Content.Headers.ContentType!.MediaType!.StartsWith("text/").Equals(true))
                {
                    var stream = await responseContext.ProxyResponse!.Content.ReadAsStreamAsync();
                    Stream decompressedStream = stream;

                    if (responseContext.ProxyResponse.Content.Headers.ContentEncoding.Contains("gzip"))
                    {
                        decompressedStream = new GZipStream(stream, CompressionMode.Decompress);
                    }
                    else if (responseContext.ProxyResponse.Content.Headers.ContentEncoding.Contains("deflate"))
                    {
                        decompressedStream = new DeflateStream(stream, CompressionMode.Decompress);
                    }

                    using var reader = new StreamReader(decompressedStream);
                    var body = await reader.ReadToEndAsync();

                    if (!string.IsNullOrEmpty(body))
                    {
                        responseContext.SuppressResponseBody = true;

                        string marker = "<!DOCTYPE html>";
                        int index = body.IndexOf(marker);
                        if (index != -1)
                        {
                            body = body.Substring(index);
                        }

                        body = body.Replace("Bravo", "Charlie");
                        var bytes = Encoding.UTF8.GetBytes(body);
                        var compressedStream = new MemoryStream();

                        if (responseContext.ProxyResponse.Content.Headers.ContentEncoding.Contains("gzip"))
                        {
                            using (var gzipStream = new GZipStream(compressedStream, CompressionMode.Compress, true))
                            {
                                await gzipStream.WriteAsync(bytes, 0, bytes.Length);
                            }
                        }
                        else if (responseContext.ProxyResponse.Content.Headers.ContentEncoding.Contains("deflate"))
                        {
                            using (var deflateStream = new DeflateStream(compressedStream, CompressionMode.Compress, true))
                            {
                                await deflateStream.WriteAsync(bytes, 0, bytes.Length);
                            }
                        }
                        else
                        {
                            await compressedStream.WriteAsync(bytes, 0, bytes.Length);
                        }

                        var compressedBytes = compressedStream.ToArray();
                        responseContext.HttpContext.Response.ContentLength = compressedBytes.Length;
                        responseContext.HttpContext.Response.ContentType = responseContext.ProxyResponse.Content.Headers.ContentType?.ToString();
                        await responseContext.HttpContext.Response.Body.WriteAsync(compressedBytes, 0, compressedBytes.Length);
                    }
                }
            }
            catch (Exception)
            {
            }
        });
    });
builder.Services.AddRequestTimeouts(options =>
{
    options.AddPolicy("customPolicy", TimeSpan.FromSeconds(900));
});
var app = builder.Build();
app.UseRequestTimeouts();
app.MapReverseProxy();
app.Run();
\`\`\`

## How to use it

1. Replace the contents of \`Program.cs\` with the code.
2. Add the routes and clusters to the \`ReverseProxy\` configuration section. To use the 900 s timeout on a route, set \`"TimeoutPolicy": "customPolicy"\` on that route.
3. Change the \`body.Replace("Bravo", "Charlie")\` line to the change that you need.
4. Run the app and send a request through the proxy.

**Result:** In each \`text/*\` response, the proxy changes "Bravo" to "Charlie".

## How it works

1. The response transform runs only when the media type of the destination response starts with \`text/\`.
2. If the \`Content-Encoding\` header contains \`gzip\` or \`deflate\`, the transform decompresses the body. Other encodings pass to the reader without change.
3. If the body is not empty, the transform sets \`SuppressResponseBody\` to \`true\`. YARP then does not copy the original body to the client.
4. If the body contains \`<!DOCTYPE html>\`, the transform removes all text before this marker.
5. The transform compresses the changed body again with the original encoding. It then sets \`Content-Length\` and \`Content-Type\` and writes the body to the client response.
6. The empty \`catch\` block hides all errors. The proxy does not log a failed transform.
7. \`AddRequestTimeouts\` adds a request timeout policy named \`customPolicy\` with a timeout of 900 s (15 minutes). \`app.UseRequestTimeouts()\` adds the middleware that applies the policy. The policy applies only to routes that refer to it.

> **NOTE:** Verify the route property name for your YARP version. YARP 2.1 and later use \`TimeoutPolicy\` (policy name) and \`Timeout\` (a time value) on a route.

## Related links

- [YARP: Response body transforms](https://microsoft.github.io/reverse-proxy/articles/transforms.html#response-body-transforms)
`;export{e as default};