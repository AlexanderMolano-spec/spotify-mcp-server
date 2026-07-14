# Roadmap

## v0.1.0 - Local Single-User MCP

Goal: provide a stable local Spotify MCP server for one authenticated Spotify
account.

- Streamable HTTP MCP transport.
- Docker support.
- Spotify Authorization Code OAuth flow.
- Local token storage for development.
- Automatic access token refresh.
- Read-only tools for profile, search, devices, playback state and current
  track.
- Playback tools for play, pause, next, previous and volume.

## v0.2.0 - Playlist Operations

- Create playlists.
- Add tracks to playlists.
- Remove tracks from playlists.
- Read user playlists.
- Safer confirmations for destructive or bulk operations.

## v0.3.0 - External Token Mode

Goal: let host agents manage identity and tokens.

- Accept delegated access tokens from an upstream agent backend.
- Avoid local token persistence in this mode.
- Document integration pattern for multi-user AI agents.
- Add stricter scope validation per tool.

## Future

- Queue management.
- Recently played and top items.
- Better device selection.
- MCP client examples.
- Published Docker image.
- npm package distribution.
