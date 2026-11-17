---
title: C# web request service
summary: A static C# service that gets OAuth 2.0 client credentials tokens and posts JSON models with WebClient and HttpClient, in sync and async versions.
category: C# and .NET
order: 80
gist: 1569b70e53100af0157d63fa18e368c7
---

# C# web request service

`WebRequestService` is a static C# class that gets an OAuth 2.0 bearer token and posts JSON to an API. Each operation has a synchronous version with `WebClient` and an asynchronous version with `HttpClient`.

## Before you start

- Install the `Newtonsoft.Json` NuGet package.
- Replace the placeholder values in the code with your values:

| Placeholder | Replace with |
| --- | --- |
| `"ClientId"` | The client ID of your app registration |
| `"Scope"` | The scope of the API |
| `"ClientSecret"` | The client secret |
| `"PostUrl"` | The token endpoint in `GetToken` and `GetTokenAsync`, or the API URL in the `...ForProvidedModel` methods |
| `"endpoint"` | The API URL for the generic post methods |
| `AUTHORIZATION` | A constant with the value `"Authorization"`. The source does not declare it. |

## Code

```csharp
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Data.Services
{
    public static class WebRequestService
    {
        public class WebClientWithTimeout : WebClient
        {
            public int Timeout { get; set; }

            protected override WebRequest GetWebRequest(Uri address)
            {
                var request = base.GetWebRequest(address);
                if (request != null)
                {
                    request.Timeout = Timeout;
                }
                return request;
            }
        }
        
        public static string GetToken()
        {
            try
            {
                var keyValues = new NameValueCollection
                {
                    {"client_id", "ClientId"},
                    {"scope", "Scope"},
                    {"client_secret", "ClientSecret"},
                    {"grant_type", "client_credentials"}
                };

                using (WebClient client = new WebClientWithTimeout { Timeout = 900000 })
                {
                    var responseBytes = client.UploadValues("PostUrl", "POST", keyValues);
                    var responseString = Encoding.UTF8.GetString(responseBytes);

                    JObject jwtDynamic = JsonConvert.DeserializeObject<dynamic>(responseString);
                    var accessToken = jwtDynamic.Value<string>("access_token");
                    return responseString.Length > 0 ? string.Concat("Bearer ", accessToken) : string.Empty;
                }
            }
            catch (Exception)
            {
                return default;
            }
        }

        public static async Task<string> GetTokenAsync()
        {
            try
            {
                var keyValues = new List<KeyValuePair<string, string>>
                {
                    new KeyValuePair<string, string>("client_id", "ClientId"),
                    new KeyValuePair<string, string>("scope", "Scope"),
                    new KeyValuePair<string, string>("client_secret", "ClientSecret"),
                    new KeyValuePair<string, string>("grant_type", "client_credentials")
                };

                var request = new HttpRequestMessage(HttpMethod.Post, "PostUrl");

                request.Content = new FormUrlEncodedContent(keyValues);

                var client = new HttpClient();
                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var jwt = await response.Content.ReadAsStringAsync();
                    JObject jwtDynamic = JsonConvert.DeserializeObject<dynamic>(jwt);
                    var accessToken = jwtDynamic.Value<string>("access_token");
                    return string.Concat("Bearer ", accessToken);
                }
                else
                {
                    return string.Empty;
                }

            }
            catch (Exception)
            {
                return string.Empty;
            }
        }
        
        public static T GenericTypePost<T>(object requestModel, string requestUri)
        {
            try
            {
                using (WebClient client = new WebClientWithTimeout { Timeout = 900000 })
                {
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    client.Headers[HttpRequestHeader.Authorization] = GetToken();

                    string json = JsonConvert.SerializeObject(requestModel);
                    string response = client.UploadString("endpoint", "POST", json);
                    T model = JsonConvert.DeserializeObject<T>(response);
                    return model;
                }
            }
            catch (Exception)
            {
                return default;
            }
        }

        public static async Task<T> GenericTypePostAsync<T>(object requestModel, string requestUri)
        {
            try
            {
                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "endpoint");
                request.Headers.Add("Authorization", GetToken());
                string json = JsonConvert.SerializeObject(requestModel);
                StringContent content = new StringContent(json, null, "application/json");
                request.Content = content;
                HttpResponseMessage response = await new HttpClient().SendAsync(request);
                response.EnsureSuccessStatusCode();
                string model = await response.Content.ReadAsStringAsync();

                if (model != null)
                {
                    try
                    {
                        return JsonConvert.DeserializeObject<T>(model);
                    }
                    catch (Exception)
                    {
                        return default;
                    }
                }
                else
                {
                    return default;
                }
            }
            catch (HttpRequestException)
            {
                return default;
            }
            catch (Exception)
            {
                return default;
            }
        }
        
        public T genericModelPost<T>(object _paramOne, object _paramTwo)
        {
            try
            {
                Dictionary<string, object> model = new Dictionary<string, object>();
                model.Add("_paramOne", _paramOne);
                model.Add("_paramTwo", _paramTwo);
                // JSON representation
                //{
                  //"_paramOne": "",
                  //"_paramTwo": ""
                //}
                
                return WebRequestService.GenericTypePost<T>(model, "endpoint");
            }
            catch (Exception)
            {
                return new();
                
                // For .NET v4.8
                // return default;
            }
        }
        
        public T genericModelPost<T, T1, T2>(T1 _paramOne, T2 _paramTwo)
        {
            try
            {
                // Anonymous type is simplest when your payload shape is fixed and known at compile time.
                var model = new
                {
                    _paramOne = _paramOne,
                    _paramTwo = _paramTwo
                };
                // JSON representation
                // {
                //   "_paramOne": "",
                //   "_paramTwo": ""
                // }

                // Tuple gives you named slots without a class.
                // var model = Tuple.Create(_paramOne, _paramTwo);
                // var model = (
                //     _paramOne : _paramOne,
                //     _paramTwo : _paramTwo
                // );
                // JSON representation (Tuples lose their custom field names during JSON serialization because those names aren't preserved in metadata; they're just syntactic sugar.)
                // {
                //   "Item1": "",
                //   "Item2": ""
                // }

                return WebRequestService.GenericTypePost<T>(model, "endpoint");
            }
            catch (Exception)
            {
                return new();
                
                // For .NET v4.8
                // return default;
            }
        }
        
        public static string GetWebResponseForProvidedModel(string json)
        {
            try
            {
                using (WebClient client = new WebRequestService.WebClientWithTimeout { Timeout = 900000 })
                {
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    client.Headers[HttpRequestHeader.Authorization] = WebRequestService.GetToken();

                    string response = client.UploadString("PostUrl", "POST", json);
                    return response;
                }
            }
            catch (Exception)
            {
                return default;
            }
        }

        public static async Task<string> GetHttpResponseForProvidedModel(string json)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "PostUrl");
                request.Headers.Add(AUTHORIZATION, await WebRequestService.GetTokenAsync());
                var content = new StringContent(json, null, "application/json");
                request.Content = content;
                var client = new HttpClient();
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var outString = await response.Content.ReadAsStringAsync();

                if (outString != null)
                {
                    try
                    {
                        return JsonConvert.DeserializeObject<string>(outString);
                    }
                    catch (Exception)
                    {
                        return default;
                    }
                }
                return null;
            }
            catch (HttpRequestException)
            {
                return default;
            }
            catch (Exception)
            {
                return default;
            }
        }
    }
}
```

## How to use it

```csharp
// Get a token. The value is "Bearer <access_token>".
string token = await WebRequestService.GetTokenAsync();

// Post a model and read the response as MyResponse.
MyResponse result = await WebRequestService.GenericTypePostAsync<MyResponse>(requestModel, "endpoint");

// Post a JSON string and get the raw response.
string response = WebRequestService.GetWebResponseForProvidedModel(json);
```

## How it works

| Method | Client | What it does |
| --- | --- | --- |
| `GetToken` | `WebClientWithTimeout` | Posts the client credentials as form values. Returns `"Bearer "` plus the access token. |
| `GetTokenAsync` | `HttpClient` | The same as `GetToken`. Returns an empty string if the status code is not a success code. |
| `GenericTypePost<T>` | `WebClientWithTimeout` | Serializes the model to JSON, posts it with the token, and deserializes the response to `T`. |
| `GenericTypePostAsync<T>` | `HttpClient` | The same as `GenericTypePost<T>`. It gets the token with the synchronous `GetToken`. |
| `genericModelPost<T>` | Calls `GenericTypePost<T>` | Puts 2 values into a `Dictionary<string, object>` and posts them. |
| `genericModelPost<T, T1, T2>` | Calls `GenericTypePost<T>` | Puts 2 values into an anonymous type and posts them. |
| `GetWebResponseForProvidedModel` | `WebClientWithTimeout` | Posts a JSON string and returns the raw response. |
| `GetHttpResponseForProvidedModel` | `HttpClient` | Posts a JSON string and deserializes the response to a `string`. |

- `WebClientWithTimeout` sets the request timeout. The service uses 900000 ms (15 minutes).
- The methods catch all exceptions. They return `default`, `null`, or an empty string, and do not throw.
- The generic post methods ignore the `requestUri` parameter. They always post to `"endpoint"`.
- An anonymous type is the simplest payload when the shape is fixed and known at compile time. A tuple gives named slots without a class, but JSON serialization writes `Item1` and `Item2`, because the metadata does not keep the tuple field names.
- In .NET Framework 4.8, use `return default;` in place of `return new();` in the `catch` blocks.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| CS0708: cannot declare instance members in a static class | The 2 `genericModelPost` methods are not `static`, but the class is `static`. | Add `static` to the methods, or move them to a class that is not static. |
| CS0304: cannot create an instance of `T` | `return new();` needs a `new()` constraint on `T`. | Add `where T : new()`, or use `return default;`. |
| CS0103: the name `AUTHORIZATION` does not exist | The source does not declare the constant. | Declare `const string AUTHORIZATION = "Authorization";` or use the `"Authorization"` string. |
