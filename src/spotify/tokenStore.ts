import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { config } from '../config/env.js';
import { SpotifyMcpError } from './errors.js';
import { refreshAccessToken } from './spotifyAccountsClient.js';

const storedTokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.string().min(1),
  scope: z.array(z.string()),
  expiresAt: z.string().datetime(),
  obtainedAt: z.string().datetime(),
});

export type StoredSpotifyToken = z.infer<typeof storedTokenSchema>;

function tokenPath() {
  return resolve(process.cwd(), config.spotify.tokenStorePath);
}

export async function readToken() {
  try {
    const raw = await readFile(tokenPath(), 'utf8');
    const parsed = storedTokenSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      throw new Error('Stored Spotify token file has an invalid shape.');
    }

    return parsed.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

export async function saveToken(token: StoredSpotifyToken) {
  const target = tokenPath();
  const temporary = `${target}.tmp`;

  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(token, null, 2)}\n`, {
    mode: 0o600,
  });
  await rename(temporary, target);
}

export async function getTokenStatus() {
  const token = await readToken();

  if (!token) {
    return {
      configured: Boolean(config.spotify.clientId && config.spotify.clientSecret),
      authenticated: false,
      expiresAt: null,
      scopes: [],
    };
  }

  return {
    configured: Boolean(config.spotify.clientId && config.spotify.clientSecret),
    authenticated: true,
    expiresAt: token.expiresAt,
    scopes: token.scope,
    expired: Date.parse(token.expiresAt) <= Date.now(),
  };
}

export async function getValidAccessToken() {
  const token = await readToken();

  if (!token) {
    throw new SpotifyMcpError(
      'SPOTIFY_AUTH_REQUIRED',
      'Spotify is not authenticated. Open /auth/login first.',
    );
  }

  const expiresAt = Date.parse(token.expiresAt);
  const refreshWindowMs = 60 * 1000;

  if (expiresAt > Date.now() + refreshWindowMs) {
    return token.accessToken;
  }

  const refreshedToken = await refreshAccessToken(token);
  await saveToken(refreshedToken);

  return refreshedToken.accessToken;
}
