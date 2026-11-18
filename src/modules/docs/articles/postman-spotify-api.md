---
title: Get Spotify user playlists with Postman and OAuth 2.0
summary: Authenticate a Spotify user in Postman with the OAuth 2.0 authorization code flow and get the playlists and tracks of the user.
category: Identity and APIs
order: 30
---

# Get Spotify user playlists with Postman and OAuth 2.0

This article shows how to authenticate a Spotify user in Postman with OAuth 2.0. Then it shows how to get the playlists of the user with the Spotify Web API.

> **NOTE:** Dated (checked November 2026): Since February 11, 2026 (new apps) and March 9, 2026 (existing apps), Development Mode apps need an app owner with an active Spotify Premium subscription. New Development Mode apps are limited to 5 users.

## Before you start

| Requirement | Link |
| --- | --- |
| Spotify developer account | [https://developer.spotify.com/dashboard/](https://developer.spotify.com/dashboard/) |
| Postman web app | [https://web.postman.co/](https://web.postman.co/) |
| A registered Spotify app on the developer dashboard | See [Register a Spotify app](#register-a-spotify-app). |

## Register a Spotify app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2. Sign in and select **Create an App**.
3. Give the app a name and a description.

   **Result:** The app shows the **Client ID** and the **Client Secret**.

4. Under **Edit Settings**, add a **Redirect URI**. OAuth needs it. Use `https://oauth.pstmn.io/v1/browser-callback`. This is the built-in OAuth redirect of Postman.

## Get an access token in Postman

1. Open Postman Web: [https://web.postman.co](https://web.postman.co).
2. Create a new **Collection** (for example, `Spotify API Collection`).
3. Select the **three dots** next to the collection, then **Edit**, then the **Authorization** tab.
4. Enter these values:

   | Setting | Value |
   | --- | --- |
   | **Type** | OAuth 2.0 |
   | **Add authorization data to** | Request Headers |
   | **Header Prefix** | Bearer |
   | **Grant Type** | Authorization Code |
   | **Callback URL** | `https://oauth.pstmn.io/v1/browser-callback` |
   | **Auth URL** | `https://accounts.spotify.com/authorize` |
   | **Access Token URL** | `https://accounts.spotify.com/api/token` |
   | **Client ID** | The Client ID of your Spotify app |
   | **Client Secret** | The Client Secret of your Spotify app |
   | **Scope** | `playlist-read-private playlist-read-collaborative` |
   | **State** | Optional |
   | **Client Authentication** | Send as Basic Auth header |

5. Select **Get New Access Token**.

   **Result:** A Spotify sign-in screen opens.

6. Sign in and authorize the app.

   **Result:** Spotify redirects you, and Postman captures the token.

7. Select **Use Token**.

**Result:** Postman can make API requests as the user.

## Get the user playlists

1. In your collection, create a new request:

   ```http
   GET https://api.spotify.com/v1/me/playlists
   ```

2. In the **Authorization** tab of the request, select **Inherit auth from parent**. The request then uses the token from the collection.
3. Select **Send**.

**Result:** You get a JSON response like this one:

```json
{
  "href": "https://api.spotify.com/v1/me/playlists",
  "items": [
    {
      "name": "My Playlist",
      "id": "2fL5E7P3...",
      "tracks": {
        "total": 42
      },
      ...
    },
    ...
  ],
  "limit": 20,
  "next": "https://api.spotify.com/v1/me/playlists?offset=20",
  ...
}
```

### Get more playlists

Spotify returns playlists in pages. The default limit is 20. To get more playlists, do one of these steps:

- Use the `next` URL from the response.
- Set a higher limit. The maximum is 50.

```http
GET https://api.spotify.com/v1/me/playlists?limit=50
```

## Get the playlist tracks

When you have a playlist `id`, get its tracks with this request:

```http
GET https://api.spotify.com/v1/playlists/{playlist_id}/tracks?offset=0&limit=100
```

> **NOTE:** Dated (checked November 2026): Spotify removed `GET /playlists/{id}/tracks` in February 2026. Use `GET https://api.spotify.com/v1/playlists/{playlist_id}/items` instead. The playlist object field `tracks` is now `items` (`tracks.tracks` is `items.items`, and `tracks.tracks.track` is `items.items.item`). Spotify returns playlist items only for playlists that the user owns or collaborates on.

> **NOTE:** Access tokens expire, usually after 1 hour. When the token expires, refresh it manually in Postman or authorize again.

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `401 Unauthorized` | The token expired. | Refresh the token. |
| No playlists in the response | The authorized Spotify account has no playlists. | Make sure that the authorized account has playlists. |
| `insufficient_scope` | The request does not have the necessary scope. | Make sure that you selected the correct scopes (`playlist-read-private`). |

## Related links

- [Spotify authorization code flow guide](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Get Current User's Playlists](https://developer.spotify.com/documentation/web-api/reference/get-list-current-user-playlists)
- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
- [Azure AD B2C OAuth 2.0 with Postman](doc:azure-ad-b2c-oauth-postman)
