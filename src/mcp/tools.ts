import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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
}
