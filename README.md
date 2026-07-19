# Spotify MCP Server

Spotify MCP Server for AI agents: a Streamable HTTP Model Context Protocol
server that lets agents search Spotify, inspect playback state, manage devices
and control music through the official Spotify Web API.

## Status

Stable v1.0.0 release. The project supports local single-user OAuth, delegated
access-token mode for host backends, Docker-based runtime, Streamable HTTP MCP
transport and a practical playback/read-only Spotify tool surface.

## Goals

- Expose Spotify Web API capabilities as MCP tools.
- Use official OAuth instead of browser automation.
- Support local personal agents first.
- Keep the project reusable by different MCP clients.
- Provide a future path for multi-user agent backends.

## Stable Scope

v1.0.0 includes:

- Streamable HTTP MCP transport.
- Local single-user Spotify OAuth.
- Delegated token mode for host backends via `x-spotify-access-token`.
- Automatic access token refresh for local OAuth tokens.
- Profile, search, devices and playback state tools.
- Current-user playlist listing and playlist playback tools.
- Basic playback control tools, including playback transfer between Spotify
  Connect devices.
- Docker-based runtime.

Playlist write operations remain out of scope for v1.0.0. Host backends should
manage users, OAuth, encryption and refresh, then delegate access tokens to this
MCP server.

## Requirements

- Spotify account.
- Spotify Developer application.
- Spotify Premium for playback control endpoints.
- Node.js runtime for local development.
- Docker for containerized usage.

## Default Ports

- MCP HTTP server: `11070`
- OAuth callback: `http://127.0.0.1:11070/auth/callback`

## Local Development

Install dependencies:

```bash
npm install
```

Run type checks:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

`dev` and `start` load `.env` automatically.

Healthcheck:

```bash
curl http://localhost:11070/health
```

Auth status:

```bash
curl http://localhost:11070/auth/status
```

MCP endpoint:

```text
http://localhost:11070/mcp
```

The v1.0 tool surface exposes:

- `spotify_ping`: validates MCP transport without calling Spotify.
- `spotify_get_profile`: calls Spotify Web API `/me` using the local OAuth
  token.
- `spotify_search`: searches tracks, artists, albums and playlists.
- `spotify_get_playlists`: lists current-user playlists.
- `spotify_get_devices`: lists Spotify Connect devices.
- `spotify_get_playback_state`: reads current playback state.
- `spotify_get_current_track`: reads the current track or episode.
- `spotify_get_queue`: reads the current item and upcoming queue.
- `spotify_get_next_track`: reads the next queued item only.
- `spotify_get_playlist_tracks`: lists tracks from a playlist.
- `spotify_get_album_tracks`: lists tracks from an album.
- `spotify_play`: starts or resumes playback.
- `spotify_play_search`: searches a track and plays the best match.
- `spotify_add_to_queue`: searches or receives a URI and adds a track to the
  playback queue.
- `spotify_play_playlist`: starts playback from a current-user playlist or exact
  playlist URI/id.
- `spotify_transfer_playback`: transfers playback to another Spotify Connect
  device.
- `spotify_pause`: pauses playback.
- `spotify_next`: skips to the next track.
- `spotify_previous`: skips to the previous track.
- `spotify_set_volume`: sets playback volume.

## Docker

Build and run with the example compose file:

```bash
cp .env.example .env
docker compose -f docker-compose.example.yml up --build
```

## Local Spotify OAuth

Create a Spotify Developer application with this redirect URI:

```text
http://127.0.0.1:11070/auth/callback
```

Then configure `.env` and open:

```text
http://localhost:11070/auth/login
```

See [Local Spotify OAuth Setup](docs/OAUTH_LOCAL_SETUP.md).

Access tokens are refreshed automatically when they are expired or close to
expiration.

## Authentication Modes

The default runtime is `local-token`: one local Spotify account authorizes this
server through `/auth/login`, and the server stores that local development token
at `SPOTIFY_TOKEN_STORE_PATH`.

The backend integration runtime is `delegated-token`: a host application owns
user identity, OAuth, encryption and refresh, then delegates a valid Spotify
access token to the MCP server for tool execution. In that mode, the MCP server
does not persist delegated user tokens.

See [Delegated Token Mode](docs/DELEGATED_TOKEN_MODE.md) for the HTTP contract.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Delegated Token Mode](docs/DELEGATED_TOKEN_MODE.md)
- [Local Spotify OAuth Setup](docs/OAUTH_LOCAL_SETUP.md)
- [Spotify Scopes](docs/SPOTIFY_SCOPES.md)
- [Tool Contract](docs/TOOLS.md)
- [Roadmap](ROADMAP.md)

## Security

Do not commit secrets or tokens. Use `.env` for Spotify application credentials
and keep local token files out of git.

The project should request only the scopes required by its enabled tools. New
write permissions should be introduced deliberately and documented before they
are implemented.

The default OAuth/token store is intended for local single-user use. Multi-user
agent backends should own user identity, token encryption and refresh outside of
this MCP server, then integrate through delegated token mode.

## License

MIT.
