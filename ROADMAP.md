# Roadmap

## v1.0.0 - Stable Local + Delegated Spotify MCP

Goal: provide a stable Spotify MCP server for local personal agents and host
backends that delegate Spotify access tokens.

- Streamable HTTP MCP transport.
- Docker support with image and compose example.
- Spotify Authorization Code OAuth flow with login, callback and status
  endpoints.
- Local token storage for development with `.spotify-token.json`.
- Automatic access token refresh for the local token store.
- Delegated token mode via `x-spotify-access-token`; delegated tokens are never
  persisted by the MCP server.
- Read-only tools for profile, search, devices, playback state and current
  track.
- Playback tools for play, pause, next, previous and volume.
- Queue tools for current/upcoming playback context.
- Playlist read and playlist playback tools.
- Album track listing for public album resources.
- Playback transfer between Spotify Connect devices.

## v1.1.0 - Playlist Operations

- Create playlists.
- Add tracks to playlists.
- Remove tracks from playlists.
- Read user playlists.
- Safer confirmations for destructive or bulk operations.

## Future

- Recently played and top items.
- Better device selection.
- MCP client examples.
- Published Docker image.
- npm package distribution.
- Stricter optional per-tool scope preflight where Spotify API behavior is not
  enough.
