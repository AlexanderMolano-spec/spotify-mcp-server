import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSpotifyTools } from './tools.js';

export function createSpotifyMcpServer() {
  const server = new McpServer({
    name: 'spotify-mcp-server',
    version: '1.0.0',
  });

  registerSpotifyTools(server);

  return server;
}
