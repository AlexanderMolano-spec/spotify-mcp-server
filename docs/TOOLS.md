# Tool Contract

This document defines the intended tool surface. Tool names and outputs should
remain stable once released.

## v0.1 Tools

### `spotify_ping`

Checks that the MCP server is reachable.

Required scopes: none.

Notes:

- Does not call Spotify.
- Useful for MCP client smoke tests.

### `spotify_get_profile`

Returns the authenticated Spotify user's profile.

Required scopes:

- `user-read-private`
- `user-read-email`

### `spotify_search`

Searches Spotify catalog content.

Input:

- `query`: search text.
- `types`: content types such as `track`, `artist`, `album` or `playlist`.
- `limit`: optional result limit.

Required scopes: none for public catalog search, but an access token is still
required.

### `spotify_get_devices`

Lists available Spotify Connect devices.

Required scopes:

- `user-read-playback-state`

### `spotify_get_playback_state`

Returns current playback state, device, volume, repeat, shuffle and currently
playing item when available.

Required scopes:

- `user-read-playback-state`

### `spotify_get_current_track`

Returns the current track or episode.

Required scopes:

- `user-read-currently-playing`

### `spotify_play`

Starts or resumes playback. It may optionally accept a device id, URI or context
URI.

Required scopes:

- `user-modify-playback-state`

Notes:

- Spotify Premium is required.
- A device must be active or available.

### `spotify_pause`

Pauses playback.

Required scopes:

- `user-modify-playback-state`

### `spotify_next`

Skips to the next track.

Required scopes:

- `user-modify-playback-state`

### `spotify_previous`

Skips to the previous track.

Required scopes:

- `user-modify-playback-state`

### `spotify_set_volume`

Sets playback volume.

Input:

- `volumePercent`: integer from 0 to 100.
- `deviceId`: optional Spotify Connect device id.

Required scopes:

- `user-modify-playback-state`

## Error Shape

Tools should return structured errors with:

- `code`
- `message`
- `details` when useful

Common codes:

- `SPOTIFY_AUTH_REQUIRED`
- `SPOTIFY_SCOPE_MISSING`
- `SPOTIFY_PREMIUM_REQUIRED`
- `SPOTIFY_DEVICE_REQUIRED`
- `SPOTIFY_RATE_LIMITED`
- `SPOTIFY_API_ERROR`
