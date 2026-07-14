import express from 'express';
import {
  createMcpDeleteHandler,
  createMcpGetHandler,
  createMcpPostHandler,
} from '../mcp/handler.js';

export function createHttpApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
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

  return app;
}
