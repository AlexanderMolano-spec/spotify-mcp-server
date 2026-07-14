# Changelog

## Unreleased

- Local Spotify OAuth foundation with `/auth/login`, `/auth/callback` and
  `/auth/status`.
- Short-lived OAuth `state` validation for the local login flow.
- Local redirect URI defaults now use `127.0.0.1` instead of `localhost` to
  match Spotify redirect URI requirements.
- `dev` and `start` scripts load `.env` automatically.
- Server shutdown now closes idle connections before exiting.
- Local token store for development tokens at `SPOTIFY_TOKEN_STORE_PATH`.
- Readiness endpoint `/ready` and liveness endpoint `/live`.
- OAuth setup documentation for Spotify Developer applications.
- Node.js/TypeScript scaffold with Streamable HTTP MCP transport.
- `GET /health` endpoint.
- MCP session lifecycle over `POST /mcp`, `GET /mcp` and `DELETE /mcp`.
- Initial `spotify_ping` tool for transport smoke tests.
- Dockerfile and `docker-compose.example.yml`.
- Docker context hygiene with `.dockerignore`.
- Build, start and typecheck scripts.
- Initial project documentation.
- Architecture notes for local single-user mode and future external token mode.
- Initial Spotify scope policy.
- Initial MCP tool contract.
- Roadmap for v0.1.0 through external token mode.
- Environment example and git ignore rules for local development.
