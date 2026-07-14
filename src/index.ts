import { config } from './config/env.js';
import { createHttpApp } from './http/app.js';

const app = createHttpApp();

const server = app.listen(config.PORT, config.HOST, () => {
  console.log(
    `spotify-mcp-server listening on http://${config.HOST}:${config.PORT}`,
  );
});

function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; shutting down spotify-mcp-server`);
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
