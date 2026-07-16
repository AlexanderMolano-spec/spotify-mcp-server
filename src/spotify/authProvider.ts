import { getTokenStatus, getValidAccessToken } from './tokenStore.js';

export type SpotifyAuthStatus = {
  configured: boolean;
  authenticated: boolean;
  expiresAt: string | null;
  scopes: string[];
  expired?: boolean;
};

export type SpotifyAuthProvider = {
  mode: 'local-token' | 'delegated-token';
  getAccessToken(): Promise<string>;
  getStatus(): Promise<SpotifyAuthStatus>;
};

const localTokenProvider: SpotifyAuthProvider = {
  mode: 'local-token',
  getAccessToken: getValidAccessToken,
  getStatus: getTokenStatus,
};

export function getSpotifyAuthProvider() {
  return localTokenProvider;
}

export async function getSpotifyAccessToken() {
  return getSpotifyAuthProvider().getAccessToken();
}

export async function getSpotifyAuthStatus() {
  const provider = getSpotifyAuthProvider();
  const status = await provider.getStatus();

  return {
    mode: provider.mode,
    ...status,
  };
}
