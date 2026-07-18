import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toToolError } from '../spotify/errors.js';
import {
  addToQueue,
  getAvailableDevices,
  getCurrentTrack,
  getCurrentUserProfile,
  getCurrentUserPlaylists,
  getAlbumTracks,
  getNextTrack,
  getPlaybackState,
  getPlaylistTracks,
  getQueue,
  nextSpotify,
  pauseSpotify,
  playSpotifyPlaylist,
  playSpotify,
  playSpotifySearch,
  previousSpotify,
  searchSpotify,
  setSpotifyVolume,
  transferSpotifyPlayback,
} from '../spotify/spotifyWebApiClient.js';

const searchTypes = ['track', 'artist', 'album', 'playlist'] as const;

function errorResult(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(toToolError(error)),
      },
    ],
  };
}

function artistNames(track: { artists?: Array<string | { name?: string | null }> } | null | undefined) {
  const names = track?.artists
    ?.map((artist) => (typeof artist === 'string' ? artist : artist.name))
    .filter(Boolean);

  return names && names.length > 0 ? names.join(', ') : 'Unknown artist';
}

function trackName(track: { name?: string | null } | null | undefined) {
  return track?.name || 'Unknown title';
}

function playlistTracksText(result: {
  offset: number;
  total: number;
  tracks: Array<{ position: number; track?: { name?: string | null; artists?: Array<string | { name?: string | null }> } }>;
}) {
  const start = result.offset + 1;
  const end = result.offset + result.tracks.length;
  const lines = result.tracks.map((item) => {
    const displayPosition = item.position + 1;
    return `${displayPosition}. ${trackName(item.track)} - ${artistNames(item.track)}`;
  });

  return [`Spotify playlist tracks ${start}-${end} of ${result.total}:`, ...lines].join('\n');
}

function albumTracksText(result: {
  offset: number;
  total: number;
  tracks: Array<{ position: number; track?: { name?: string | null; artists?: Array<string | { name?: string | null }> } }>;
}) {
  const start = result.offset + 1;
  const end = result.offset + result.tracks.length;
  const lines = result.tracks.map((item) => {
    const displayPosition = item.position + 1;
    return `${displayPosition}. ${trackName(item.track)} - ${artistNames(item.track)}`;
  });

  return [`Spotify album tracks ${start}-${end} of ${result.total}:`, ...lines].join('\n');
}

function queueText(result: {
  currentlyPlaying?: { name?: string | null; artists?: Array<string | { name?: string | null }> } | null;
  queue: Array<{ name?: string | null; artists?: Array<string | { name?: string | null }> }>;
  totalAvailable: number;
}) {
  const lines = [];

  if (result.currentlyPlaying) {
    lines.push(`Now playing: ${trackName(result.currentlyPlaying)} - ${artistNames(result.currentlyPlaying)}`);
  }

  if (result.queue.length > 0) {
    lines.push(`Queue (${result.queue.length} of ${result.totalAvailable}):`);
    lines.push(
      ...result.queue.map((track, index) => `${index + 1}. ${trackName(track)} - ${artistNames(track)}`),
    );
  } else {
    lines.push('Spotify queue has no next item available.');
  }

  return lines.join('\n');
}

export function registerSpotifyTools(server: McpServer) {
  server.registerTool(
    'spotify_ping',
    {
      title: 'Spotify MCP Ping',
      description:
        'Checks that the Spotify MCP server is reachable. This tool does not call Spotify.',
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: 'text',
          text: 'pong',
        },
      ],
      structuredContent: {
        ok: true,
        service: 'spotify-mcp-server',
      },
    }),
  );

  server.registerTool(
    'spotify_get_profile',
    {
      title: 'Get Spotify Profile',
      description: 'Returns the authenticated Spotify user profile.',
      inputSchema: {},
    },
    async () => {
      try {
        const profile = await getCurrentUserProfile();

        return {
          content: [
            {
              type: 'text',
              text: `Spotify profile: ${profile.displayName ?? profile.id}`,
            },
          ],
          structuredContent: {
            profile,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_search',
    {
      title: 'Search Spotify',
      description: 'Searches Spotify catalog content.',
      inputSchema: {
        query: z.string().min(1).describe('Search text.'),
        types: z
          .array(z.enum(searchTypes))
          .min(1)
          .default(['track'])
          .describe('Spotify item types to search.'),
        limit: z.number().int().min(1).max(20).default(5).describe('Maximum results per type.'),
      },
    },
    async ({ query, types, limit }) => {
      try {
        const results = await searchSpotify({ query, types, limit });

        return {
          content: [
            {
              type: 'text',
              text: `Spotify search returned ${Object.values(results).reduce(
                (total, items) => total + items.length,
                0,
              )} items.`,
            },
          ],
          structuredContent: {
            query,
            types,
            limit,
            results,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_playlists',
    {
      title: 'Get Current User Playlists',
      description:
        'Lists playlists owned or followed by the authenticated Spotify user, including private/collaborative playlists when the token has the required scopes.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum playlists to return.'),
        offset: z.number().int().min(0).default(0).describe('Pagination offset.'),
        includeDetails: z
          .boolean()
          .default(false)
          .describe('When true, includes descriptions, URLs and images. Default false keeps output compact.'),
      },
    },
    async ({ limit, offset, includeDetails }) => {
      try {
        const result = await getCurrentUserPlaylists({ limit, offset, includeDetails });

        return {
          content: [
            {
              type: 'text',
              text: `Spotify playlists ${result.offset + 1}-${result.offset + result.playlists.length} of ${result.total}`,
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_devices',
    {
      title: 'Get Spotify Devices',
      description: 'Lists available Spotify Connect devices.',
      inputSchema: {},
    },
    async () => {
      try {
        const result = await getAvailableDevices();

        return {
          content: [
            {
              type: 'text',
              text: `Spotify devices available: ${result.devices.length}`,
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_playback_state',
    {
      title: 'Get Spotify Playback State',
      description: 'Returns current Spotify playback state and active device.',
      inputSchema: {},
    },
    async () => {
      try {
        const playback = await getPlaybackState();

        return {
          content: [
            {
              type: 'text',
              text: playback.available
                ? `Spotify playback is ${playback.isPlaying ? 'playing' : 'paused'}.`
                : 'Spotify playback is not currently available.',
            },
          ],
          structuredContent: {
            playback,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_current_track',
    {
      title: 'Get Current Spotify Track',
      description: 'Returns the current Spotify track or episode when available.',
      inputSchema: {},
    },
    async () => {
      try {
        const current = await getCurrentTrack();

        return {
          content: [
            {
              type: 'text',
              text: current.item
                ? `Current Spotify item: ${current.item.name}`
                : 'No current Spotify item is available.',
            },
          ],
          structuredContent: {
            current,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_queue',
    {
      title: 'Get Spotify Queue',
      description:
        'Returns the current Spotify item and upcoming queue. Use this when the user asks what is next or what is in the queue.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).default(10).describe('Maximum queued items to return.'),
        includeDetails: z
          .boolean()
          .default(false)
          .describe('When true, includes full track metadata. Default false keeps output compact.'),
      },
    },
    async ({ limit, includeDetails }) => {
      try {
        const queue = await getQueue({ limit, includeDetails });

        return {
          content: [
            {
              type: 'text',
              text: queueText(queue),
            },
          ],
          structuredContent: {
            queue,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_next_track',
    {
      title: 'Get Next Spotify Track',
      description:
        'Returns only the next Spotify queue item plus the current item. Prefer this for concise questions like "what song follows?".',
      inputSchema: {},
    },
    async () => {
      try {
        const next = await getNextTrack();

        return {
          content: [
            {
              type: 'text',
              text: next.nextTrack
                ? `Next Spotify item: ${next.nextTrack.name}`
                : 'Spotify queue has no next item available.',
            },
          ],
          structuredContent: {
            next,
          },
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_playlist_tracks',
    {
      title: 'Get Spotify Playlist Tracks',
      description:
        'Lists tracks from a Spotify playlist by current-user playlist name, exact playlist id or exact playlist URI. Returns a compact paginated page.',
      inputSchema: {
        playlistName: z
          .string()
          .min(1)
          .optional()
          .describe('Exact visible playlist name from the authenticated user playlists.'),
        playlistId: z.string().min(1).optional().describe('Exact Spotify playlist id.'),
        playlistUri: z.string().min(1).optional().describe('Exact Spotify playlist URI.'),
        limit: z.number().int().min(1).max(50).default(20).describe('Maximum tracks to return.'),
        offset: z.number().int().min(0).default(0).describe('Pagination offset.'),
        includeDetails: z
          .boolean()
          .default(false)
          .describe('When true, includes full track metadata. Default false keeps output compact.'),
      },
    },
    async ({ playlistName, playlistId, playlistUri, limit, offset, includeDetails }) => {
      try {
        const result = await getPlaylistTracks({
          playlistName,
          playlistId,
          playlistUri,
          limit,
          offset,
          includeDetails,
        });

        return {
          content: [
            {
              type: 'text',
              text: playlistTracksText(result),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_get_album_tracks',
    {
      title: 'Get Spotify Album Tracks',
      description:
        'Lists tracks from a Spotify album by exact album id or exact album URI. Use this for album results returned by spotify_search; do not use playlist tools for albums.',
      inputSchema: {
        albumId: z.string().min(1).optional().describe('Exact Spotify album id.'),
        albumUri: z.string().min(1).optional().describe('Exact Spotify album URI.'),
        limit: z.number().int().min(1).max(50).default(20).describe('Maximum tracks to return.'),
        offset: z.number().int().min(0).default(0).describe('Pagination offset.'),
        includeDetails: z
          .boolean()
          .default(false)
          .describe('When true, includes full track metadata. Default false keeps output compact.'),
      },
    },
    async ({ albumId, albumUri, limit, offset, includeDetails }) => {
      try {
        const result = await getAlbumTracks({
          albumId,
          albumUri,
          limit,
          offset,
          includeDetails,
        });

        return {
          content: [
            {
              type: 'text',
              text: albumTracksText(result),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_play',
    {
      title: 'Play Spotify',
      description:
        'Starts or resumes Spotify playback. Optionally plays a Spotify track, album, artist or playlist URI. deviceId must be the Spotify Connect device id returned by spotify_get_devices, not the visible device name.',
      inputSchema: {
        deviceId: z.string().min(1).optional().describe('Optional Spotify Connect device id.'),
        uri: z
          .string()
          .min(1)
          .optional()
          .describe('Optional Spotify URI. Track URIs play directly; other URIs are used as context.'),
        positionMs: z.number().int().min(0).optional().describe('Optional start position in ms.'),
      },
    },
    async ({ deviceId, uri, positionMs }) => {
      try {
        const result = await playSpotify({ deviceId, uri, positionMs });

        return {
          content: [{ type: 'text', text: 'Spotify playback started.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_play_search',
    {
      title: 'Search and Play Spotify Track',
      description:
        'Searches Spotify for a track by natural language query and immediately plays the best match. Prefer this over spotify_play when the user gives a song/artist/title instead of an exact Spotify URI.',
      inputSchema: {
        query: z.string().min(1).describe('Song, artist or natural language search query.'),
        deviceId: z
          .string()
          .min(1)
          .optional()
          .describe('Optional Spotify Connect device id returned by spotify_get_devices.'),
        deviceName: z
          .string()
          .min(1)
          .optional()
          .describe('Optional exact visible device name. The tool resolves it to a Spotify Connect device id.'),
      },
    },
    async ({ query, deviceId, deviceName }) => {
      try {
        const result = await playSpotifySearch({ query, deviceId, deviceName });

        return {
          content: [
            {
              type: 'text',
              text: `Playing Spotify track: ${result.track.name}`,
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_add_to_queue',
    {
      title: 'Add Spotify Item to Queue',
      description:
        'Adds a track to the Spotify playback queue. Use query for natural language song requests, or uri when an exact track/episode URI is already known.',
      inputSchema: {
        query: z.string().min(1).optional().describe('Song, artist or natural language search query to add.'),
        uri: z.string().min(1).optional().describe('Exact Spotify track or episode URI to add.'),
        deviceId: z
          .string()
          .min(1)
          .optional()
          .describe('Optional Spotify Connect device id returned by spotify_get_devices.'),
        deviceName: z
          .string()
          .min(1)
          .optional()
          .describe('Optional exact visible device name. The tool resolves it to a Spotify Connect device id.'),
      },
    },
    async ({ query, uri, deviceId, deviceName }) => {
      try {
        const result = await addToQueue({ query, uri, deviceId, deviceName });

        return {
          content: [
            {
              type: 'text',
              text: result.track ? `Added to Spotify queue: ${result.track.name}` : 'Added item to Spotify queue.',
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_transfer_playback',
    {
      title: 'Transfer Spotify Playback',
      description:
        'Transfers the active Spotify playback session to a Spotify Connect device. Use spotify_get_devices first when the user gives a device name; pass the matching device id, not the visible name.',
      inputSchema: {
        deviceId: z.string().min(1).describe('Spotify Connect device id returned by spotify_get_devices.'),
        play: z
          .boolean()
          .optional()
          .describe('Whether playback should continue after transfer. Defaults to true.'),
      },
    },
    async ({ deviceId, play }) => {
      try {
        const result = await transferSpotifyPlayback({ deviceId, play });

        return {
          content: [{ type: 'text', text: 'Spotify playback transferred.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_play_playlist',
    {
      title: 'Play Spotify Playlist',
      description:
        'Starts playback from a Spotify playlist. Prefer playlistName for current-user playlists; the tool resolves it through spotify_get_playlists semantics. Use playlistId or playlistUri only when exact.',
      inputSchema: {
        playlistName: z
          .string()
          .min(1)
          .optional()
          .describe('Exact visible playlist name from the authenticated user playlists.'),
        playlistId: z.string().min(1).optional().describe('Exact Spotify playlist id.'),
        playlistUri: z.string().min(1).optional().describe('Exact Spotify playlist URI.'),
        deviceId: z
          .string()
          .min(1)
          .optional()
          .describe('Optional Spotify Connect device id returned by spotify_get_devices.'),
        deviceName: z
          .string()
          .min(1)
          .optional()
          .describe('Optional exact visible device name. The tool resolves it to a Spotify Connect device id.'),
        position: z.number().int().min(0).optional().describe('Optional zero-based track position in the playlist.'),
      },
    },
    async ({ playlistName, playlistId, playlistUri, deviceId, deviceName, position }) => {
      try {
        const result = await playSpotifyPlaylist({
          playlistName,
          playlistId,
          playlistUri,
          deviceId,
          deviceName,
          position,
        });

        return {
          content: [{ type: 'text', text: 'Spotify playlist playback started.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_pause',
    {
      title: 'Pause Spotify',
      description: 'Pauses Spotify playback.',
      inputSchema: {
        deviceId: z.string().min(1).optional().describe('Optional Spotify Connect device id.'),
      },
    },
    async ({ deviceId }) => {
      try {
        const result = await pauseSpotify(deviceId);

        return {
          content: [{ type: 'text', text: 'Spotify playback paused.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_next',
    {
      title: 'Next Spotify Track',
      description: 'Skips to the next Spotify track.',
      inputSchema: {
        deviceId: z.string().min(1).optional().describe('Optional Spotify Connect device id.'),
      },
    },
    async ({ deviceId }) => {
      try {
        const result = await nextSpotify(deviceId);

        return {
          content: [{ type: 'text', text: 'Skipped to next Spotify track.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_previous',
    {
      title: 'Previous Spotify Track',
      description: 'Skips to the previous Spotify track.',
      inputSchema: {
        deviceId: z.string().min(1).optional().describe('Optional Spotify Connect device id.'),
      },
    },
    async ({ deviceId }) => {
      try {
        const result = await previousSpotify(deviceId);

        return {
          content: [{ type: 'text', text: 'Skipped to previous Spotify track.' }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'spotify_set_volume',
    {
      title: 'Set Spotify Volume',
      description: 'Sets Spotify playback volume.',
      inputSchema: {
        volumePercent: z.number().int().min(0).max(100).describe('Volume from 0 to 100.'),
        deviceId: z.string().min(1).optional().describe('Optional Spotify Connect device id.'),
      },
    },
    async ({ volumePercent, deviceId }) => {
      try {
        const result = await setSpotifyVolume({ volumePercent, deviceId });

        return {
          content: [{ type: 'text', text: `Spotify volume set to ${volumePercent}%.` }],
          structuredContent: result,
        };
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
