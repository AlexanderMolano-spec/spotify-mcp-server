import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createSpotifyMcpServer } from './server.js';

type Session = {
  transport: StreamableHTTPServerTransport;
};

const sessions = new Map<string, Session>();

function getSessionId(req: Parameters<RequestHandler>[0]) {
  const value = req.headers['mcp-session-id'];
  return Array.isArray(value) ? value[0] : value;
}

function sendMcpError(
  res: Parameters<RequestHandler>[1],
  status: number,
  code: number,
  message: string,
) {
  res.status(status).json({
    jsonrpc: '2.0',
    error: {
      code,
      message,
    },
    id: null,
  });
}

export function createMcpPostHandler(): RequestHandler {
  return async (req, res) => {
    const sessionId = getSessionId(req);

    try {
      if (sessionId) {
        const session = sessions.get(sessionId);

        if (!session) {
          sendMcpError(res, 404, -32000, 'MCP session not found.');
          return;
        }

        await session.transport.handleRequest(req, res, req.body);
        return;
      }

      if (!isInitializeRequest(req.body)) {
        sendMcpError(res, 400, -32000, 'Missing MCP session id.');
        return;
      }

      const server = createSpotifyMcpServer();
      let transport: StreamableHTTPServerTransport;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, { transport });
        },
        onsessionclosed: (closedSessionId) => {
          sessions.delete(closedSessionId);
        },
      });

      transport.onclose = () => {
        const closedSessionId = transport.sessionId;

        if (closedSessionId) {
          sessions.delete(closedSessionId);
        }
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request failed', error);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error.',
          },
          id: null,
        });
      }
    }
  };
}

export function createMcpGetHandler(): RequestHandler {
  return async (req, res) => {
    const sessionId = getSessionId(req);

    if (!sessionId) {
      sendMcpError(res, 400, -32000, 'Missing MCP session id.');
      return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
      sendMcpError(res, 404, -32000, 'MCP session not found.');
      return;
    }

    await session.transport.handleRequest(req, res);
  };
}

export function createMcpDeleteHandler(): RequestHandler {
  return async (req, res) => {
    const sessionId = getSessionId(req);

    if (!sessionId) {
      sendMcpError(res, 400, -32000, 'Missing MCP session id.');
      return;
    }

    const session = sessions.get(sessionId);

    if (!session) {
      sendMcpError(res, 404, -32000, 'MCP session not found.');
      return;
    }

    await session.transport.handleRequest(req, res);
  };
}
