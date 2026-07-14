import { config } from './config/env.js';
import { createHttpApp } from './http/app.js';

const app = createHttpApp();

const server = app.listen(config.port, config.host, () => {
  console.log(
    `spotify-mcp-server listening on http://${config.host}:${config.port}`,
  );
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    server.closeAllConnections();
    process.exit(1);
  }

  shuttingDown = true;
  console.log(`Received ${signal}; shutting down spotify-mcp-server`);
  server.closeIdleConnections();
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
