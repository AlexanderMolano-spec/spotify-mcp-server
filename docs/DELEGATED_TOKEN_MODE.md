# Delegated Token Mode

Delegated token mode lets a host backend manage users, OAuth, encryption,
refresh and authorization policy while this server remains a Spotify MCP tool
runtime.

## Status

Delegated token mode is available for Streamable HTTP MCP requests. Local OAuth
remains the default fallback when no delegated token is provided.

## Contract

Pass a Spotify access token with MCP HTTP requests:

```http
x-spotify-access-token: <spotify-access-token>
```

The header also accepts the common bearer form:

```http
x-spotify-access-token: Bearer <spotify-access-token>
```

When this header is sent during `initialize`, the token is associated with that
in-memory MCP session. A later request on the same session may send the header
again to replace the session token.

Delegated tokens are never written to disk.

## Fallback

If a request/session has no delegated token, the server uses `local-token` mode:
the local OAuth token file at `SPOTIFY_TOKEN_STORE_PATH`.

## Error Behavior

- Missing delegated token with no local token returns `SPOTIFY_AUTH_REQUIRED`.
- Invalid or expired Spotify access tokens return `SPOTIFY_AUTH_INVALID`.
- Missing scopes or Spotify authorization denials return
  `SPOTIFY_SCOPE_REQUIRED`.

## Host Backend Responsibilities

The host backend must:

- authenticate the application user;
- obtain Spotify authorization from that user;
- store and refresh tokens securely;
- pass only valid Spotify access tokens to this MCP server;
- decide which user actions require additional confirmation.

This MCP server does not manage host users, encrypt delegated tokens or persist
delegated credentials.
