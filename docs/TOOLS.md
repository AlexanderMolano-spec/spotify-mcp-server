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

### `spotify_get_playlists`

Lists playlists owned or followed by the authenticated Spotify user. This can
include private and collaborative playlists when the OAuth token has the
documented scopes.

Input:

- `limit`: optional number from 1 to 50. Default 10.
- `offset`: optional pagination offset. Default 0.
- `includeDetails`: optional boolean. Default false keeps output compact by
  omitting long descriptions, image URLs and external URLs.

Required scopes:

- `playlist-read-private`
- `playlist-read-collaborative` for collaborative playlists.

Output:

- `playlists`: compact by default (`id`, `name`, `uri`, owner, track count and
  visibility flags)
- pagination fields: `total`, `limit`, `offset`, `next`, `previous`

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

### `spotify_get_queue`

Returns the current Spotify item and upcoming queue.

Input:

- `limit`: optional number from 1 to 50. Default 10.
- `includeDetails`: optional boolean. Default false keeps output compact by
  returning only name, artists, duration and URI.

Required scopes:

- `user-read-currently-playing`
- `user-read-playback-state`

Output:

- `currentlyPlaying`
- `nextTrack`
- `queue`: compact list of queued items by default, limited by `limit`
- `returned`
- `totalAvailable`

### `spotify_get_next_track`

Returns the first upcoming Spotify queue item plus the current item. Prefer this
compact tool when the user asks what song follows.

Required scopes:

- `user-read-currently-playing`
- `user-read-playback-state`

Output:

- `currentlyPlaying`
- `nextTrack`
- `queueAvailable`

### `spotify_get_playlist_tracks`

Lists tracks from a Spotify playlist by current-user playlist name, exact
playlist id or exact playlist URI.

Input:

- `playlistName`: optional exact visible playlist name from current-user
  playlists.
- `playlistId`: optional exact Spotify playlist id.
- `playlistUri`: optional exact Spotify playlist URI.
- `limit`: optional number from 1 to 50. Default 20.
- `offset`: optional pagination offset. Default 0.
- `includeDetails`: optional boolean. Default false keeps output compact by
  returning only position, name, artists, duration and URI.

Required scopes:

- `playlist-read-private` when reading private playlists.

Output:

- `playlistId`
- `playlist`
- `tracks`: compact page by default; full track metadata only when
  `includeDetails` is true
- pagination fields: `total`, `limit`, `offset`, `next`, `previous`

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
- `deviceId` is the Spotify Connect id returned by `spotify_get_devices`, not
  the visible device name.
- `uri` must be a valid Spotify URI such as `spotify:track:<id>`. Do not invent
  or transform URLs/IDs into URIs.

### `spotify_play_search`

Searches Spotify for a track and immediately plays the best match. Use this when
the user asks to play a song, artist/title combination or natural-language query
instead of providing an exact Spotify URI.

Input:

- `query`: required song, artist or natural-language search query.
- `deviceId`: optional Spotify Connect device id returned by
  `spotify_get_devices`.
- `deviceName`: optional exact visible device name. The tool resolves it to a
  Spotify Connect device id before playback.

Required scopes:

- `user-read-playback-state` when resolving `deviceName`.
- `user-modify-playback-state`

Output:

- selected `track`
- resolved `deviceId`
- optional resolved `device`

### `spotify_transfer_playback`

Transfers the active Spotify playback session to a Spotify Connect device.

Input:

- `deviceId`: required Spotify Connect device id returned by
  `spotify_get_devices`.
- `play`: optional boolean. Defaults to `true`; when true, playback continues
  after the transfer.

Required scopes:

- `user-modify-playback-state`

Notes:

- When a user names a device, call `spotify_get_devices`, match by visible
  `name`, then pass the matched `id` to this tool.
- Spotify Premium is required.

### `spotify_add_to_queue`

Adds a track or episode to the user's current Spotify playback queue. The tool
can receive an exact URI or search for the best matching track from a natural
language query.

Input:

- `query`: optional song, artist or natural language search query.
- `uri`: optional exact Spotify track or episode URI.
- `deviceId`: optional Spotify Connect device id returned by
  `spotify_get_devices`.
- `deviceName`: optional exact visible device name. The tool resolves it to a
  Spotify Connect device id.

At least one of `query` or `uri` is required.

Required scopes:

- `user-modify-playback-state`
- `user-read-playback-state` when resolving `deviceName`.

Notes:

- Spotify Premium is required.
- Spotify does not guarantee execution order when queue commands are mixed with
  other player commands.

### `spotify_play_playlist`

Starts playback from a Spotify playlist.

Input:

- `playlistName`: optional exact visible playlist name from the current user's
  playlists.
- `playlistId`: optional exact Spotify playlist id.
- `playlistUri`: optional exact Spotify playlist URI.
- `deviceId`: optional Spotify Connect device id returned by
  `spotify_get_devices`.
- `deviceName`: optional exact visible device name. The tool resolves it to a
  Spotify Connect device id.
- `position`: optional zero-based track position in the playlist.

At least one of `playlistName`, `playlistId` or `playlistUri` is required.

Required scopes:

- `playlist-read-private` when resolving `playlistName` from current-user
  playlists.
- `user-read-playback-state` when resolving `deviceName`.
- `user-modify-playback-state`

Notes:

- Prefer `playlistName` only for current-user playlists already owned or
  followed by the authenticated user.
- For public Spotify playlists that are not in the user's library, call
  `spotify_search` with type `playlist`, ask the user to choose if needed, then
  pass the selected `playlistId` or `playlistUri`.
- Use `position` when a user selects a numbered track from a listed playlist;
  this preserves playlist context and queues the following playlist tracks.
- If several current-user playlists share the same name, the tool returns an
  ambiguity error with the candidates instead of guessing.

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
