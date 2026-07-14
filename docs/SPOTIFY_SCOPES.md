# Spotify Scopes

Spotify scopes determine which tools can act on behalf of the user. This
project should keep scopes explicit and grouped by capability.

## Read-Only Scopes

| Scope | Purpose |
| --- | --- |
| `user-read-private` | Read basic user profile details. |
| `user-read-email` | Read user email when needed for profile display. |
| `user-read-playback-state` | Read playback state and available devices. |
| `user-read-currently-playing` | Read the current track or episode. |
| `user-read-recently-played` | Read recently played tracks. |
| `user-top-read` | Read top artists and tracks. |
| `playlist-read-private` | Read private playlists. |
| `playlist-read-collaborative` | Read collaborative playlists. |

## Playback Scopes

| Scope | Purpose |
| --- | --- |
| `user-modify-playback-state` | Start, pause, skip, seek, repeat, shuffle and set volume. |

Playback control generally requires Spotify Premium and at least one active or
available Spotify Connect device.

## Playlist Write Scopes

| Scope | Purpose |
| --- | --- |
| `playlist-modify-private` | Create or modify private playlists. |
| `playlist-modify-public` | Create or modify public playlists. |

Playlist write tools should be introduced after read-only and playback tools
are stable.

## Initial v0.1 Scope Set

For the first implementation, use:

```text
user-read-private
user-read-email
user-read-playback-state
user-read-currently-playing
user-modify-playback-state
playlist-read-private
playlist-read-collaborative
```

Playlist write scopes are intentionally deferred.

## Scope Policy

- Each tool must document its required scopes.
- If a token lacks the required scope, the tool should return a clear
  authorization error.
- New write scopes should be added only when a tool needs them.
- Tools must not silently request broader permissions than documented.
