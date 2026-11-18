---
title: cURL commands for REST API calls
summary: Send HEAD, GET, POST, PUT, and DELETE requests to a REST API with curl, with a Keycloak bearer token and jq output.
category: Identity and APIs
order: 40
---

# cURL commands for REST API calls

This article shows how to test a REST API from the command line with curl. It shows HEAD, GET, POST, PUT, and DELETE requests against the bookmarks.dev API.

## Before you start

| Item | Notes |
| --- | --- |
| curl | The examples show `curl/7.54.0`. |
| jq | Optional. It formats JSON output and extracts values. |
| Python | Optional. An alternative to jq for JSON output. |
| bookmarks.dev API | The public API is at `https://www.bookmarks.dev/api`. It has OpenAPI documentation at [https://www.bookmarks.dev/api/docs/](https://www.bookmarks.dev/api/docs/). |
| Local bookmarks.dev API | The CRUD examples use the API on localhost. To set it up with Docker Compose, follow the Readme of [bookmarks.dev-api](https://github.com/CodepediaOrg/bookmarks.dev-api). |

## What curl is

curl is a command line tool and library for transferring data with URL syntax. It supports these protocols: DICT, FILE, FTP, FTPS, Gopher, HTTP, HTTPS, IMAP, IMAPS, LDAP, LDAPS, POP3, POP3S, RTMP, RTSP, SCP, SFTP, SMTP, SMTPS, Telnet, and TFTP.

curl also supports SSL certificates, HTTP POST, HTTP PUT, FTP uploading, HTTP form based upload, proxies, HTTP/2, cookies, user and password authentication (Basic, Digest, NTLM, Negotiate, Kerberos, and more), file transfer resume, and proxy tunneling.

## Options in this article

| Option | Description |
| --- | --- |
| `-I`, `--head` | Get the headers only. |
| `-i`, `--include` | Include the HTTP response headers in the output. |
| `-X`, `--request` | Specify a custom request method for the HTTP server (GET, PUT, DELETE, and more). |
| `-H`, `--header` | Send a custom header to the server. |
| `-s`, `--silent` | Silent or quiet mode. curl does not show the progress meter or error messages. It still writes the data that you ask for, also to the terminal (stdout) if you do not redirect it. |
| `-v`, `--verbose` | The opposite of `--silent`. curl shows more information about the operation. |
| `-d`, `--data` | (HTTP) Send the data in a POST request to the HTTP server, the same as a browser when a user fills in an HTML form and presses the submit button. curl sends the data with the content type `application/x-www-form-urlencoded`. |

## Send a HEAD request

A HEAD request shows if a resource is available, which headers it sends, and other metadata in the response headers. The response does not include the content.

This example shows what a GET request for the latest public bookmarks returns. Use 1 of these commands (`-I` and `--head` are the same option):

```bash
curl -I https://www.bookmarks.dev/api/public/bookmarks
```

```bash
curl --head https://www.bookmarks.dev/api/public/bookmarks
```

Do not use `-X HEAD` to send a HEAD request. With `-X HEAD`, curl waits for a response body that the server does not send, and the command can stop responding.

Response:

```http
HTTP/1.1 200 OK
Server: nginx/1.12.0
Date: Sun, 23 Feb 2020 21:31:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 98452
Connection: keep-alive
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Location
Access-Control-Expose-Headers: Content-Type, Authorization, Location
ETag: W/"18094-R7MFvLpccDdVu3q8rR1UQBrAaX8"
Strict-Transport-Security: max-age=63072000; includeSubdomains
X-Content-Type-Options: nosniff
```

The API adds these headers to support Cross-Origin Resource Sharing (CORS):

```http
Access-Control-Allow-Headers: Content-Type, Authorization, Location
Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Origin: *
```

## Send a GET request

If you run curl on a URL without options, curl sends a GET request.

```bash
curl https://www.bookmarks.dev/api/version
```

This command is equivalent. It sets the method and the `accept: application/json` header:

```bash
curl -X GET "https://www.bookmarks.dev/api/version" -H "accept: application/json"
```

Response:

```json
{"version":"7.0.0","gitSha1":"71eb40fb6d224d5d9a90c89ae943390e15f001c3"}
```

### Format the JSON output

To format the response, send it to jq:

```bash
curl https://www.bookmarks.dev/api/version | jq .
```

Response:

```text
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    72  100    72    0     0    611      0 --:--:-- --:--:-- --:--:--   615
{
  "version": "7.0.0",
  "gitSha1": "71eb40fb6d224d5d9a90c89ae943390e15f001c3"
}
```

To remove the progress meter (the first part of the output), use silent mode:

```bash
curl -s https://www.bookmarks.dev/api/version | jq .
```

Response:

```json
{
  "version": "7.0.0",
  "gitSha1": "71eb40fb6d224d5d9a90c89ae943390e15f001c3"
}
```

If Python is on your machine, you can use it instead of jq:

```bash
curl -s https://www.bookmarks.dev/api/version | python -m json.tool
```

### Send more than one header

The bookmarks.dev API compresses all responses with gzip. To ask for the gzip version, add a second `-H` option:

```bash
curl -v -H "Accept:application/json" -H "Accept-encoding:gzip" https://www.bookmarks.dev/api/version
```

If you do not redirect the response to a file, the content shows as characters that you cannot read.

Response:

```text
> GET /api/version HTTP/1.1
> Host: www.bookmarks.dev
> User-Agent: curl/7.54.0
> Accept:application/json
> Accept-encoding:gzip
>
< HTTP/1.1 200 OK
< Server: nginx/1.12.0
< Date: Fri, 06 Mar 2020 14:45:39 GMT
< Content-Type: application/json; charset=utf-8
< Transfer-Encoding: chunked
< Connection: keep-alive
< X-Powered-By: Express
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization, Location
< Access-Control-Expose-Headers: Content-Type, Authorization, Location
< ETag: W/"48-3r0bLwzjWi409jIuXDFQE7IoNtI"
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< X-Content-Type-Options: nosniff
< Content-Encoding: gzip
<
* Connection #0 to host www.bookmarks.dev left intact
(binary gzip data)
```

## Get a bearer token from Keycloak

The CRUD examples use the API on localhost. Keycloak and a bearer token protect the API.

To get a bearer token from Keycloak, enable Direct Access Grants for the client. This setting is the Resource Owner Password Credentials grant of the OAuth 2.0 specification. The client sends the user credentials as form parameters.

> **NOTE:** Dated (checked November 2026): Keycloak 17 and later (the Quarkus distribution) removed the `/auth` prefix from the default URL. On a current Keycloak server, the token endpoint is `http://localhost:8480/realms/bookmarks/protocol/openid-connect/token`, unless the server starts with `--http-relative-path /auth`. The OAuth 2.1 draft also removes the Resource Owner Password Credentials grant. Use it only for tests.

1. Send the credentials with curl. Replace the username and the password with the values that you set up.

   ```bash
   curl  \
     -d 'client_id=bookmarks' \
     -d 'username=ama' \
     -d "password=<password>" \
     -d 'grant_type=password' \
     'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
   | jq .
   ```

   **Result:** The response is similar to this one:

   ```json
   {
     "access_token": "<access-token>",
     "expires_in": 3600,
     "refresh_expires_in": 36000,
     "refresh_token": "<refresh-token>",
     "token_type": "bearer",
     "not-before-policy": 0,
     "session_state": "a94ec4b7-3acf-4c39-b90e-039ee76cca0b",
     "scope": "email profile"
   }
   ```

2. To get only the access token, use `jq -r '.access_token'`:

   ```bash
   curl -s \
     -d 'client_id=bookmarks' \
     -d 'username=ama' \
     -d "password=<password>" \
     -d 'grant_type=password' \
     'http://localhost:8480/auth/realms/bookmarks/protocol/openid-connect/token' \
   | jq -r '.access_token'
   ```

   **Result:** The output is the access token only (a JWT that starts with `eyJ`).

In the next examples, replace `<access-token>` with this token.

## Create a bookmark with POST

```bash
curl -i -X POST "http://localhost:3000/api/personal/users/4c617f2b-2bad-498b-a9c6-4e9a8c303798/bookmarks" \
-H "accept: */*" -H "Authorization: Bearer <access-token>"  \
-H "Content-Type: application/json" -d "{\"name\":\"How to test a REST api from command line with curl - CodepediaOrg\",\"location\":\"https://www.codepedia.org/ama/how-to-test-a-rest-api-from-command-line-with-curl/\",\"language\":\"en\",\"tags\":[\"rest\",\"curl\",\"api\",\"testing\"],\"publishedOn\":\"2020-03-05\",\"sourceCodeURL\":\"https://github.com/CodepediaOrg/bookmarks.dev-api\",\"description\":\" In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP Requests against a REST API. For the purpose of this blog post I will be using the REST api that supports [www.bookmarks.dev](https://www.bookmarks.dev)\",\"descriptionHtml\":\"<p>In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP Requests against a REST API. For the purpose of this blog post I will be using the REST api that supports <a href=\\\"https://www.bookmarks.dev\\\">www.bookmarks.dev</a></p>\",\"userId\":\"4c617f2b-2bad-498b-a9c6-4e9a8c303798\",\"public\":true,\"lastAccessedAt\":\"2020-03-06T20:14:28.101Z\",\"likeCount\":0}"
```

Response:

```http
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Location
Access-Control-Expose-Headers: Content-Type, Authorization, Location
Location: http://localhost:3000/api/personal/users/4c617f2b-2bad-498b-a9c6-4e9a8c303798/bookmarks/5e62b18b59770b5487a4c741
Content-Type: application/json; charset=utf-8
Content-Length: 79
ETag: W/"4f-26GcBfsvgN8d+T+zqql3Y5R+Rl8"
Date: Fri, 06 Mar 2020 20:24:44 GMT
Connection: keep-alive

{"response":"Bookmark created for userId 4c617f2b-2bad-498b-a9c6-4e9a8c303798"}
```

The `Location` header contains the URL of the new resource.

## Read the bookmark with GET

Send a GET request to the URL from the `Location` header:

```bash
curl -s -X GET "http://localhost:3000/api/personal/users/4c617f2b-2bad-498b-a9c6-4e9a8c303798/bookmarks/5e62b18b59770b5487a4c741" \
 -H "accept: application/json" \
 -H "Authorization: Bearer <access-token>" | jq .
```

Response:

```json
{
  "tags": [
    "rest",
    "curl",
    "api",
    "testing"
  ],
  "_id": "5e62b18b59770b5487a4c741",
  "name": "How to test a REST api from command line with curl - CodepediaOrg",
  "location": "https://www.codepedia.org/ama/how-to-test-a-rest-api-from-command-line-with-curl/",
  "language": "en",
  "description": " In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP Requests against a REST API. For the purpose of this blog post I will be using the REST api that supports [www.bookmarks.dev](https://www.bookmarks.dev)",
  "descriptionHtml": "<p>In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP Requests against a REST API. For the purpose of this blog post I will be using the REST api that supports <a href=\"https://www.bookmarks.dev\">www.bookmarks.dev</a></p>",
  "publishedOn": "2020-03-05T00:00:00.000Z",
  "sourceCodeURL": "https://github.com/CodepediaOrg/bookmarks.dev-api",
  "userId": "4c617f2b-2bad-498b-a9c6-4e9a8c303798",
  "public": true,
  "likeCount": 0,
  "youtubeVideoId": null,
  "stackoverflowQuestionId": null,
  "createdAt": "2020-03-06T20:24:43.998Z",
  "updatedAt": "2020-03-06T20:24:43.998Z"
}
```

## Update the bookmark with PUT

```bash
curl -s -X PUT "http://localhost:3000/api/personal/users/4c617f2b-2bad-498b-a9c6-4e9a8c303798/bookmarks/5e62b18b59770b5487a4c741" \
 -H "accept: application/json" -H "Authorization: Bearer <access-token>"  \
 -H "Content-Type: application/json" -d "{\"name\":\"How to test a REST api from command line with curl - CodepediaOrg\",\"location\":\"https://www.codepedia.org/ama/how-to-test-a-rest-api-from-command-line-with-curl/\",\"tags\":[\"rest\",\"curl\",\"api\",\"testing\"],\"publishedOn\":\"2020-03-05T00:00:00.000Z\",\"sourceCodeURL\":\"https://github.com/CodepediaOrg/bookmarks.dev-api\",\"description\":\"In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP requests against a REST API. For the purpose of this blog post I will be using the REST api that supports [www.bookmarks.dev](https://www.bookmarks.dev)\",\"public\":true,\"readLater\":false,\"language\":\"en\",\"youtubeVideoId\":null,\"stackoverflowQuestionId\":null,\"descriptionHtml\":\"<p>In this post I will present how to execute GET, POST, PUT, HEAD, DELETE HTTP requests against a REST API. For the purpose of this blog post I will be using the REST api that supports <a href=\\\"https://www.bookmarks.dev\\\">www.bookmarks.dev</a></p>\",\"updatedAt\":\"2020-03-06T20:42:53.706Z\",\"lastAccessedAt\":\"2020-03-06T20:42:53.706Z\",\"userId\":\"4c617f2b-2bad-498b-a9c6-4e9a8c303798\",\"_id\":\"5e62b18b59770b5487a4c741\"}" | jq .
```

**Result:** The response is the same as the GET response, with these differences:

- `description` has no leading space and uses "HTTP requests" (lowercase) in place of "HTTP Requests".
- `descriptionHtml` uses "HTTP requests" (lowercase) in place of "HTTP Requests".
- `updatedAt` is `2020-03-06T20:43:53.582Z`.

## Delete the bookmark with DELETE

```bash
curl -i -X DELETE "http://localhost:3000/api/personal/users/4c617f2b-2bad-498b-a9c6-4e9a8c303798/bookmarks/5e62b18b59770b5487a4c741" \
 -H "accept: */*" -H "Authorization: Bearer <access-token>"
```

Response:

```http
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Location
Access-Control-Expose-Headers: Content-Type, Authorization, Location
Date: Fri, 06 Mar 2020 20:53:37 GMT
Connection: keep-alive
```

The `204 No Content` status shows that the deletion was successful.

If you send the DELETE request again, the API returns the `404 Not Found` status:

```http
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Location
Access-Control-Expose-Headers: Content-Type, Authorization, Location
Content-Type: application/json; charset=utf-8
Content-Length: 385
ETag: W/"181-i91X0uxhZ3uP0puyszvupTavBQA"
Date: Fri, 06 Mar 2020 20:55:27 GMT
Connection: keep-alive

{"httpStatus":404,"message":"Bookmark NOT_FOUND with id: 5e62b18b59770b5487a4c741","stack":"NotFoundError: Bookmark NOT_FOUND with id: 5e62b18b59770b5487a4c741\n    at Object.deleteBookmarkById (/Users/ama/projects/dev/personal/bookmarks/bookmarks-api/src/routes/users/bookmarks/personal-bookmarks.service.js:164:11)\n    at process._tickCallback (internal/process/next_tick.js:68:7)"}
```

The response shows the stack trace because the API runs in development mode.

## Related links

- [curl manual](https://curl.se/docs/manual.html)
- [curl-to-postman](https://github.com/postmanlabs/curl-to-postman)
- [CURL commands examples to make REST API calls (original post on dev.to)](https://dev.to/ama/curl-commands-examples-to-make-rest-api-calls-4gg3)
- [bookmarks.dev API documentation](https://www.bookmarks.dev/api/docs/)
- [bookmarks.dev-api source code](https://github.com/CodepediaOrg/bookmarks.dev-api)
- [External identity for ASP.NET web apps with Microsoft Entra External ID](doc:entra-external-id-aspnet)
