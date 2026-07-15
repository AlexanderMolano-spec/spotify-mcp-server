# Spotify MCP Server

Spotify MCP Server for AI agents: a Streamable HTTP Model Context Protocol
server that lets agents search Spotify, inspect playback state, manage devices
and control music through the official Spotify Web API.

## Status

Early design phase. The first target is a local single-user MCP server with
Spotify OAuth, Docker support and a small stable tool surface.

## Goals

- Expose Spotify Web API capabilities as MCP tools.
- Use official OAuth instead of browser automation.
- Support local personal agents first.
- Keep the project reusable by different MCP clients.
- Provide a future path for multi-user agent backends.

## Initial Scope

The first stable version will focus on:

- Streamable HTTP MCP transport.
- Local single-user Spotify OAuth.
- Automatic access token refresh.
- Profile, search, devices and playback state tools.
- Current-user playlist listing and playlist playback tools.
- Basic playback control tools, including playback transfer between Spotify
  Connect devices.
- Docker-based runtime.

Playlist write operations and external token mode are planned after the local
single-user flow is stable.

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

The initial tool surface exposes:

- `spotify_ping`: validates MCP transport without calling Spotify.
- `spotify_get_profile`: calls Spotify Web API `/me` using the local OAuth
  token.
- `spotify_search`: searches tracks, artists, albums and playlists.
- `spotify_get_playlists`: lists current-user playlists.
- `spotify_get_devices`: lists Spotify Connect devices.
- `spotify_get_playback_state`: reads current playback state.
- `spotify_get_current_track`: reads the current track or episode.
- `spotify_play`: starts or resumes playback.
- `spotify_play_search`: searches a track and plays the best match.
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

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
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

## License

License pending.
