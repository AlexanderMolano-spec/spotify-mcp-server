# Spotify MCP Server

A Streamable HTTP Model Context Protocol (MCP) server for Spotify Web API
integrations. It gives AI agents a clean tool surface for Spotify search,
playback state, devices, queue inspection, playlist playback and basic playback
control without browser automation.

## Status

Stable `v1.0.0` release.

This project supports two authentication modes:

- `local-token`: local single-user OAuth for personal agents, demos and local
  development.
- `delegated-token`: host backends manage users, OAuth, refresh and encryption,
  then delegate a Spotify access token to this MCP server per request/session.

The server is intentionally a Spotify tool runtime. It does not manage host
users, persist delegated tokens or store multi-user credentials.

## Features

- Streamable HTTP MCP transport.
- Official Spotify Authorization Code OAuth for local single-user usage.
- Delegated access-token mode via `x-spotify-access-token`.
- Automatic access-token refresh for local OAuth tokens.
- Spotify profile, search, devices, playback state, current track and queue
  tools.
- Playlist listing, playlist track listing and playlist playback.
- Album track listing for public Spotify catalog albums.
- Playback controls: play, search-and-play, pause, next, previous, volume,
  queue add and playback transfer.
- Dockerfile and Compose example for containerized deployments.

## Requirements

- Spotify account.
- Spotify Developer application.
- Spotify Premium for Spotify playback-control endpoints.
- Node.js `>=22` for local development.
- Docker for containerized runtime.

## Quick Start

Install dependencies:

```bash
npm install
```

Copy the environment example:

```bash
cp .env.example .env
```

Create a Spotify Developer application and add this redirect URI:

```text
http://127.0.0.1:11070/auth/callback
```

Then set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in `.env`.

Build and start:

```bash
npm run build
npm start
```

Open the local OAuth login URL:

```text
http://localhost:11070/auth/login
```

After authorization, check status:

```bash
curl http://localhost:11070/auth/status
```

MCP endpoint:

```text
http://localhost:11070/mcp
```

## Environment Variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `11070` | HTTP server port. |
| `HOST` | No | `0.0.0.0` | HTTP bind host. |
| `SPOTIFY_CLIENT_ID` | Local OAuth | none | Spotify Developer application client id. |
| `SPOTIFY_CLIENT_SECRET` | Local OAuth | none | Spotify Developer application client secret. |
| `SPOTIFY_REDIRECT_URI` | Local OAuth | `http://127.0.0.1:11070/auth/callback` | Spotify OAuth callback URI. |
| `SPOTIFY_TOKEN_STORE_PATH` | No | `.spotify-token.json` | Local single-user token file. |
| `SPOTIFY_SCOPES` | No | v1 scope set | Comma-separated scopes requested by local OAuth. |

Do not commit `.env` or `.spotify-token.json`.

## Running With Docker

Build and run with the example Compose file:

```bash
cp .env.example .env
docker compose -f docker-compose.example.yml up --build
```

The example binds the server to loopback:

```text
127.0.0.1:11070
```

## Authentication Modes

### Local Token Mode

Use this mode for personal agents and local demos. The MCP server owns the local
OAuth flow, stores one local token file and refreshes that token when needed.

Relevant endpoints:

- `GET /auth/login`
- `GET /auth/callback`
- `GET /auth/status`

See [Local Spotify OAuth Setup](docs/OAUTH_LOCAL_SETUP.md).

### Delegated Token Mode

Use this mode when another backend owns users and Spotify OAuth. The host
backend passes a valid Spotify access token to MCP HTTP requests:

```http
x-spotify-access-token: <spotify-access-token>
```

Bearer form is also accepted:

```http
x-spotify-access-token: Bearer <spotify-access-token>
```

The delegated token is kept only in memory for the active MCP session. It is not
written to disk.

See [Delegated Token Mode](docs/DELEGATED_TOKEN_MODE.md).

## MCP Tool Surface

`v1.0.0` exposes these tools:

| Tool | Purpose |
| --- | --- |
| `spotify_ping` | Validates MCP transport without calling Spotify. |
| `spotify_get_profile` | Reads the authenticated Spotify profile. |
| `spotify_search` | Searches tracks, artists, albums and playlists. |
| `spotify_get_playlists` | Lists current-user playlists. |
| `spotify_get_devices` | Lists Spotify Connect devices. |
| `spotify_get_playback_state` | Reads current playback state. |
| `spotify_get_current_track` | Reads the current track or episode. |
| `spotify_get_queue` | Reads current item and upcoming queue. |
| `spotify_get_next_track` | Reads the next queued item only. |
| `spotify_get_playlist_tracks` | Lists tracks from a playlist. |
| `spotify_get_album_tracks` | Lists tracks from an album. |
| `spotify_play` | Starts or resumes playback from an exact Spotify URI. |
| `spotify_play_search` | Searches a track and plays the best match. |
| `spotify_add_to_queue` | Adds a track or episode to the queue. |
| `spotify_play_playlist` | Starts playlist playback, optionally from a position. |
| `spotify_transfer_playback` | Transfers playback to a Spotify Connect device. |
| `spotify_pause` | Pauses playback. |
| `spotify_next` | Skips to the next track. |
| `spotify_previous` | Skips to the previous track. |
| `spotify_set_volume` | Sets playback volume. |

See [Tool Contract](docs/TOOLS.md) for schemas, scopes and output shape.

## HTTP Surface

| Route | Purpose |
| --- | --- |
| `GET /health` | Process healthcheck. |
| `GET /ready` | Readiness check for local OAuth token availability. |
| `GET /live` | Liveness check. |
| `GET /auth/login` | Starts local Spotify OAuth. |
| `GET /auth/callback` | Handles local Spotify OAuth callback. |
| `GET /auth/status` | Reports local OAuth status. |
| `POST /mcp` | Streamable HTTP MCP requests. |
| `GET /mcp` | Streamable HTTP SSE stream for an MCP session. |
| `DELETE /mcp` | Terminates an MCP session. |

## Security Notes

- Use the official Spotify Web API, not browser automation.
- Never commit client secrets, access tokens or refresh tokens.
- Keep `.env` and `.spotify-token.json` out of git and Docker build context.
- Request only the scopes required by enabled tools.
- Treat playback commands as user-visible side effects.
- Host backends should own user identity, authorization policy, token encryption
  and refresh when using delegated mode.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Delegated Token Mode](docs/DELEGATED_TOKEN_MODE.md)
- [Local Spotify OAuth Setup](docs/OAUTH_LOCAL_SETUP.md)
- [Spotify Scopes](docs/SPOTIFY_SCOPES.md)
- [Tool Contract](docs/TOOLS.md)
- [Roadmap](ROADMAP.md)

## Non-Goals For v1.0.0

- Multi-user token storage inside this MCP server.
- Host application user management.
- Playlist write operations.
- Browser automation.
- Bypassing CAPTCHAs or platform safety systems.
- Reverse engineering Spotify clients.

## License

MIT.
