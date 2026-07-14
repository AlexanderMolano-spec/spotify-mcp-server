import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toToolError } from '../spotify/errors.js';
import { getCurrentUserProfile } from '../spotify/spotifyWebApiClient.js';

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
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(toToolError(error)),
            },
          ],
        };
      }
    },
  );
}
