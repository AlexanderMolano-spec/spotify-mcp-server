# Architecture

This project is a Spotify MCP server for AI agents. It exposes Spotify Web API
capabilities as Model Context Protocol tools over Streamable HTTP.

## Design Goals

- Use the official Spotify Web API.
- Avoid browser automation for Spotify.
- Keep authentication explicit and auditable.
- Support a simple single-user local mode first.
- Leave a clear path to multi-user agent backends.
- Keep the MCP server independent from any specific agent application.

## Runtime Shape

```text
AI Agent / MCP Client
        |
        | Streamable HTTP MCP
        v
spotify-mcp-server
        |
        | Spotify Web API
        v
Spotify
```

## Modes

### Single-User Local Mode

This is the first supported mode.

- The user creates a Spotify Developer application.
- The user authenticates through Authorization Code OAuth.
- The server stores development tokens locally.
- The server refreshes access tokens when needed.
- Tools act on that one Spotify account.

This mode is useful for local agents, demos and personal automation.

### External Token Mode

This mode is planned for agent backends.

- The MCP server does not persist Spotify tokens.
- The host application owns OAuth, encryption and user identity.
- The host application passes a valid Spotify access token per request or
  session.
- The MCP server validates scopes and executes the requested tool.

This mode is better for multi-user systems.

## Component Responsibilities

### MCP Server

- Expose MCP tools.
- Validate tool input.
- Map tool calls to Spotify Web API requests.
- Normalize Spotify responses into agent-friendly output.
- Return clear errors without leaking secrets.

### OAuth Module

- Build authorization URLs.
- Handle OAuth callback.
- Exchange authorization code for tokens.
- Refresh access tokens.
- Store tokens only in local mode.

### Spotify Client

- Wrap Spotify Web API endpoints.
- Attach bearer tokens.
- Handle Spotify error responses.
- Keep endpoint-specific behavior out of MCP tool handlers.

### Tool Registry

- Define tool names, descriptions and JSON schemas.
- Associate tools with required scopes.
- Keep tool outputs stable across releases.

## Non-Goals For v0.1.0

- Multi-user token storage.
- Payments or commerce.
- Browser automation.
- Bypassing CAPTCHAs or platform safety systems.
- Reverse engineering Spotify clients.

## Security Principles

- Never commit client secrets or tokens.
- Keep `.env` and token files out of git.
- Request the smallest practical set of scopes.
- Document scopes per tool.
- Prefer explicit user authorization over hidden automation.
- Treat playback actions as user-visible side effects.
