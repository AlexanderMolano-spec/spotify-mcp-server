# Local Spotify OAuth Setup

This guide configures the local single-user OAuth flow.

## Spotify Developer App

1. Open the Spotify Developer Dashboard.
2. Create an application.
3. Add this redirect URI:

```text
http://127.0.0.1:11070/auth/callback
```

4. Save the application.
5. Copy the client id and client secret into `.env`.

## Environment

Copy the example file:

```bash
cp .env.example .env
```

Set:

```env
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:11070/auth/callback
```

The token store defaults to:

```env
SPOTIFY_TOKEN_STORE_PATH=.spotify-token.json
```

Do not commit `.env` or `.spotify-token.json`.

## Authorize Locally

Start the server:

```bash
npm run build
npm start
```

The `start` script loads `.env` automatically.

Open:

```text
http://localhost:11070/auth/login
```

After approving the Spotify consent screen, the callback stores a local token
file and returns a small JSON success response.

The login URL includes a short-lived OAuth `state` value. Complete the callback
from the same running server process that generated the login URL.

Check status:

```bash
curl http://localhost:11070/auth/status
```

The first OAuth milestone only stores and reports token status. Spotify API
tools are added in later milestones.
