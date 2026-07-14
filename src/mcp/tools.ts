import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { toToolError } from '../spotify/errors.js';
import {
  getAvailableDevices,
  getCurrentTrack,
  getCurrentUserProfile,
  getPlaybackState,
  searchSpotify,
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
}
