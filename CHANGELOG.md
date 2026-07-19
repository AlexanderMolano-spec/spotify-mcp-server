# Changelog

## Unreleased

- No unreleased changes.

## [1.0.0] - 2026-07-19

- Delegated Spotify token mode for Streamable HTTP MCP requests through
  `x-spotify-access-token`.
- Clear Spotify authorization errors for invalid/expired access tokens and
  missing scopes.
- Internal Spotify authentication provider abstraction. Local token storage
  remains the default provider.
- Playback transfer and device-aware playback helpers:
  - `spotify_get_devices`
  - `spotify_transfer_playback`
- Queue and playlist context tools:
  - `spotify_get_queue`
  - `spotify_get_next_track`
  - `spotify_get_playlists`
  - `spotify_get_playlist_tracks`
  - `spotify_play_playlist`
- Album track listing tool:
  - `spotify_get_album_tracks`
- Compact agent-friendly text output for queue and playlist track tools.
- Compact `SPOTIFY_PLAYLIST_NOT_FOUND` guidance when a requested playlist is
  not part of the authenticated user's library.
- Playback control MCP tools:
  - `spotify_play`
  - `spotify_pause`
  - `spotify_next`
  - `spotify_previous`
  - `spotify_set_volume`
- Read-only MCP tools:
  - `spotify_search`
  - `spotify_get_devices`
  - `spotify_get_playback_state`
  - `spotify_get_current_track`
- Automatic Spotify access token refresh for local OAuth tokens.
- Spotify Web API client foundation.
- MCP tool `spotify_get_profile` backed by Spotify Web API `/me`.
- Local Spotify OAuth foundation with `/auth/login`, `/auth/callback` and
  `/auth/status`.
- Short-lived OAuth `state` validation for the local login flow.
- Local redirect URI defaults now use `127.0.0.1` instead of `localhost` to
  match Spotify redirect URI requirements.
- `dev` and `start` scripts load `.env` automatically.
- Server shutdown now closes idle connections before exiting.
- Local token store for development tokens at `SPOTIFY_TOKEN_STORE_PATH`.
- Readiness endpoint `/ready` and liveness endpoint `/live`.
- OAuth setup documentation for Spotify Developer applications.
- Node.js/TypeScript scaffold with Streamable HTTP MCP transport.
- `GET /health` endpoint.
- MCP session lifecycle over `POST /mcp`, `GET /mcp` and `DELETE /mcp`.
- Initial `spotify_ping` tool for transport smoke tests.
- Dockerfile and `docker-compose.example.yml`.
- Docker context hygiene with `.dockerignore`.
- Build, start and typecheck scripts.
- Initial project documentation.
- Architecture notes for local single-user mode and delegated token mode.
- Initial Spotify scope policy.
- Initial MCP tool contract.
- Roadmap for v1.0.0 and follow-up Spotify tool work.
- Environment example and git ignore rules for local development.
