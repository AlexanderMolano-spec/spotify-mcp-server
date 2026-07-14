import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toToolError } from '../spotify/errors.js';
import {
  getAvailableDevices,
  getCurrentTrack,
  getCurrentUserProfile,
  getPlaybackState,
  nextSpotify,
  pauseSpotify,
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
