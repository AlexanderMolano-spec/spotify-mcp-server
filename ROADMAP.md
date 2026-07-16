# Roadmap

## v0.1.0 - Local Single-User MCP

Goal: provide a stable local Spotify MCP server for one authenticated Spotify
account.

- Streamable HTTP MCP transport.
- Docker support with image and compose example.
- Spotify Authorization Code OAuth flow with login, callback and status
  endpoints.
- Local token storage for development with `.spotify-token.json`.
- Automatic access token refresh. Implemented for the local token store.
- Read-only tools for profile, search, devices, playback state and current
  track.
- Playback tools for play, pause, next, previous and volume.
- Queue tools for current/upcoming playback context.
- Playlist read and playlist playback tools.
- Playback transfer between Spotify Connect devices.

## v0.2.0 - Playlist Operations

- Create playlists.
- Add tracks to playlists.
- Remove tracks from playlists.
- Read user playlists.
- Safer confirmations for destructive or bulk operations.

## v0.3.0 - External Token Mode

Goal: let host agents manage identity and tokens.

- Introduce an authentication provider abstraction shared by local and
  delegated modes.
- Accept delegated access tokens from an upstream agent backend.
- Avoid local token persistence in this mode.
- Document integration pattern for multi-user AI agents.
- Add stricter scope validation per tool.

## Future

- Recently played and top items.
- Better device selection.
- MCP client examples.
- Published Docker image.
- npm package distribution.
