import { config } from '../config/env.js';
import type { StoredSpotifyToken } from './tokenStore.js';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

function requireOAuthConfig() {
  if (!config.spotify.clientId || !config.spotify.clientSecret) {
    throw new Error('Spotify OAuth is not configured.');
  }

  return {
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret,
  };
}

function tokenBasicAuth(clientId: string, clientSecret: string) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

function toStoredToken(response: SpotifyTokenResponse): StoredSpotifyToken {
  const now = Date.now();

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
    scope: response.scope ? response.scope.split(' ').filter(Boolean) : [],
    expiresAt: new Date(now + response.expires_in * 1000).toISOString(),
    obtainedAt: new Date(now).toISOString(),
  };
}

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token: string;
};

export function buildSpotifyAuthorizeUrl(state: string) {
  const { clientId } = requireOAuthConfig();
  const url = new URL(SPOTIFY_AUTHORIZE_URL);

  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', config.spotify.scopes.join(' '));
  url.searchParams.set('redirect_uri', config.spotify.redirectUri);
  url.searchParams.set('state', state);

  return url.toString();
}

export async function exchangeAuthorizationCode(code: string) {
  const { clientId, clientSecret } = requireOAuthConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.spotify.redirectUri,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${tokenBasicAuth(clientId, clientSecret)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Spotify token exchange failed: ${response.status} ${details}`);
  }

  return toStoredToken((await response.json()) as SpotifyTokenResponse);
}
