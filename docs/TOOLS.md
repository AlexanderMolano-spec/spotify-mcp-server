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

Output:

- `id`
- `displayName`
- `email`
- `country`
- `product`
- `uri`
- `spotifyUrl`
- `imageUrl`

### `spotify_search`

Searches Spotify catalog content.

Input:

- `query`: search text.
- `types`: content types such as `track`, `artist`, `album` or `playlist`.
- `limit`: optional result limit.

Required scopes: none for public catalog search, but an access token is still
required.

Output:

- `tracks`
- `artists`
- `albums`
- `playlists`

### `spotify_get_devices`

Lists available Spotify Connect devices.

Required scopes:

- `user-read-playback-state`

Output:

- `devices`

### `spotify_get_playback_state`

Returns current playback state, device, volume, repeat, shuffle and currently
playing item when available.

Required scopes:

- `user-read-playback-state`

Output:

- `available`
- `isPlaying`
- `progressMs`
- `repeatState`
- `shuffleState`
- `currentlyPlayingType`
- `context`
- `device`
- `item`

### `spotify_get_current_track`

Returns the current track or episode.

Required scopes:

- `user-read-currently-playing`

Output:

- `available`
- `isPlaying`
- `progressMs`
- `currentlyPlayingType`
- `item`

### `spotify_play`

Starts or resumes playback. It may optionally accept a device id, URI or context
URI.

Input:

- `deviceId`: optional Spotify Connect device id.
- `uri`: optional Spotify URI. Track URIs play directly; album, artist and
  playlist URIs are used as context.
- `positionMs`: optional start position in ms.

Required scopes:

- `user-modify-playback-state`

Notes:

- Spotify Premium is required.
- A device must be active or available.

### `spotify_pause`

Pauses playback.

Input:

- `deviceId`: optional Spotify Connect device id.

Required scopes:

- `user-modify-playback-state`

### `spotify_next`

Skips to the next track.

Input:

- `deviceId`: optional Spotify Connect device id.

Required scopes:

- `user-modify-playback-state`

### `spotify_previous`

Skips to the previous track.

Input:

- `deviceId`: optional Spotify Connect device id.

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
