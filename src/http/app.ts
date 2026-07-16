import express from 'express';
import { createAuthRouter } from '../spotify/auth.routes.js';
import { getSpotifyAuthStatus } from '../spotify/authProvider.js';
import {
  createMcpDeleteHandler,
  createMcpGetHandler,
  createMcpPostHandler,
} from '../mcp/handler.js';

export function createHttpApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_req, res, next) => {
    try {
      const auth = await getSpotifyAuthStatus();

      res.status(200).json({
        ok: true,
        service: 'spotify-mcp-server',
        auth,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/auth', createAuthRouter());

  app.get('/ready', async (_req, res, next) => {
    try {
      const auth = await getSpotifyAuthStatus();

      res.status(auth.authenticated ? 200 : 503).json({
        ok: auth.authenticated,
        service: 'spotify-mcp-server',
        auth,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/live', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'spotify-mcp-server',
    });
  });

  app.post('/mcp', createMcpPostHandler());
  app.get('/mcp', createMcpGetHandler());
  app.delete('/mcp', createMcpDeleteHandler());

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('Unhandled HTTP error', error);

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error.',
        },
      });
    },
  );

  return app;
}
