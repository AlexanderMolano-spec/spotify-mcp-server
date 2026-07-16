# Architecture

This project is a Spotify MCP server for AI agents. It exposes Spotify Web API
capabilities as Model Context Protocol tools over Streamable HTTP.

## Design Goals

- Use the official Spotify Web API.
- Avoid browser automation for Spotify.
- Keep authentication explicit and auditable.
- Support a simple single-user local mode first.
- Leave a clear path to multi-user agent backends.
- Keep the MCP server independent from any specific agent application.

## Runtime Shape

```text
AI Agent / MCP Client
        |
        | Streamable HTTP MCP
        v
spotify-mcp-server
        |
        | Spotify Web API
        v
Spotify
```

## Authentication Strategy

The server has a hybrid authentication direction:

- `local-token`: the MCP server owns the local OAuth flow and reads/writes one
  token file for one Spotify account.
- `delegated-token`: a host backend owns identity, OAuth, token encryption and
  refresh, then delegates a valid Spotify access token to the MCP server for
  tool execution.

`local-token` is the current supported runtime. `delegated-token` is the planned
integration mode for multi-user agent backends.

## HTTP Surface

| Route | Purpose |
| --- | --- |
| `GET /health` | Process healthcheck. Does not call Spotify. |
| `GET /ready` | Readiness check. Returns 503 until local OAuth has a token. |
| `GET /live` | Liveness check. Does not inspect OAuth state. |
| `GET /auth/login` | Starts local Spotify Authorization Code OAuth. |
| `GET /auth/callback` | Handles Spotify OAuth callback and stores local token. |
| `GET /auth/status` | Reports local OAuth configuration and token status. |
| `POST /mcp` | Streamable HTTP MCP requests. |
| `GET /mcp` | Streamable HTTP SSE stream for an initialized MCP session. |
| `DELETE /mcp` | Session termination for an initialized MCP session. |

The MCP endpoint uses in-memory session tracking for the local server process.
This is enough for the local single-user runtime. Delegated token mode and any
future horizontally scaled deployment will require a deliberate session strategy.

Spotify requires HTTPS redirect URIs except for loopback IP literals. For local
development, use `http://127.0.0.1:11070/auth/callback`; `localhost` is not a
valid Spotify redirect URI.

## Modes

### `local-token` Mode

This is the current supported mode.

- The user creates a Spotify Developer application.
- The user authenticates through Authorization Code OAuth.
- The server stores development tokens locally.
- The server refreshes access tokens when needed.
- Tools act on that one Spotify account.

This mode is useful for local agents, demos and personal automation.

### `delegated-token` Mode

This mode is planned for host agent backends.

- The MCP server does not persist Spotify tokens.
- The host application owns OAuth, encryption and user identity.
- The host application passes a valid Spotify access token per request or
  session.
- The MCP server validates scopes and executes the requested tool.

This mode is the preferred shape for multi-user systems. The MCP server should
remain a Spotify tool runtime, not a credential database or user management
service.

## Component Responsibilities

### MCP Server

- Expose MCP tools.
- Validate tool input.
- Map tool calls to Spotify Web API requests.
- Normalize Spotify responses into agent-friendly output.
- Return clear errors without leaking secrets.

### OAuth Module

- Build authorization URLs.
- Handle OAuth callback.
- Exchange authorization code for tokens.
- Refresh access tokens.
- Store tokens only in `local-token` mode.

The current implementation supports authorization URL generation, callback
handling, token exchange, local token persistence and access token refresh.

OAuth login also includes an in-memory `state` value with a short TTL. This is
appropriate for local single-user mode because the login and callback happen
within the same server process.

### Spotify Client

- Wrap Spotify Web API endpoints.
- Attach bearer tokens.
- Handle Spotify error responses.
- Keep endpoint-specific behavior out of MCP tool handlers.
- Receive access tokens through an authentication provider abstraction so local
  and delegated modes can share the same Spotify API behavior.

Implemented read-only Spotify Web API calls:

- `GET /v1/me` through `spotify_get_profile`.
- `GET /v1/search` through `spotify_search`.
- `GET /v1/me/playlists` through `spotify_get_playlists`.
- `GET /v1/me/player/devices` through `spotify_get_devices`.
- `GET /v1/me/player` through `spotify_get_playback_state`.
- `GET /v1/me/player/currently-playing` through
  `spotify_get_current_track`.
- `GET /v1/me/player/queue` through `spotify_get_queue` and
  `spotify_get_next_track`.
- `GET /v1/playlists/{playlist_id}/tracks` through
  `spotify_get_playlist_tracks`.

Implemented playback Spotify Web API commands:

- `PUT /v1/me/player/play` through `spotify_play`.
- `GET /v1/search` + `PUT /v1/me/player/play` through
  `spotify_play_search`.
- `GET /v1/search` + `POST /v1/me/player/queue` through
  `spotify_add_to_queue`.
- `GET /v1/me/playlists` + `PUT /v1/me/player/play` through
  `spotify_play_playlist`.
- `PUT /v1/me/player` through `spotify_transfer_playback`.
- `PUT /v1/me/player/pause` through `spotify_pause`.
- `POST /v1/me/player/next` through `spotify_next`.
- `POST /v1/me/player/previous` through `spotify_previous`.
- `PUT /v1/me/player/volume` through `spotify_set_volume`.

Playback commands require Spotify Premium and an available Spotify Connect
device.

### Tool Registry

- Define tool names, descriptions and JSON schemas.
- Associate tools with required scopes.
- Keep tool outputs stable across releases.

## Non-Goals For v0.1.0

- Multi-user token storage.
- Host application user management.
- Payments or commerce.
- Browser automation.
- Bypassing CAPTCHAs or platform safety systems.
- Reverse engineering Spotify clients.

## Security Principles

- Never commit client secrets or tokens.
- Keep `.env` and token files out of git.
- Request the smallest practical set of scopes.
- Document scopes per tool.
- Prefer explicit user authorization over hidden automation.
- Treat playback actions as user-visible side effects.
- Do not persist delegated access tokens.
