export class SpotifyMcpError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'SpotifyMcpError';
  }
}

export function toToolError(error: unknown) {
  if (error instanceof SpotifyMcpError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'SPOTIFY_MCP_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'SPOTIFY_MCP_ERROR',
    message: 'Unknown Spotify MCP error.',
  };
}
