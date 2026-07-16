import { AsyncLocalStorage } from 'node:async_hooks';
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

type SpotifyAuthContext = {
  delegatedAccessToken?: string;
};

const spotifyAuthContext = new AsyncLocalStorage<SpotifyAuthContext>();

const localTokenProvider: SpotifyAuthProvider = {
  mode: 'local-token',
  getAccessToken: getValidAccessToken,
  getStatus: getTokenStatus,
};

const delegatedTokenProvider: SpotifyAuthProvider = {
  mode: 'delegated-token',
  async getAccessToken() {
    const accessToken = spotifyAuthContext.getStore()?.delegatedAccessToken;

    if (!accessToken) {
      return localTokenProvider.getAccessToken();
    }

    return accessToken;
  },
  async getStatus() {
    const accessToken = spotifyAuthContext.getStore()?.delegatedAccessToken;

    if (!accessToken) {
      return localTokenProvider.getStatus();
    }

    return {
      configured: true,
      authenticated: true,
      expiresAt: null,
      scopes: [],
    };
  },
};

export function getSpotifyAuthProvider() {
  const accessToken = spotifyAuthContext.getStore()?.delegatedAccessToken;
  return accessToken ? delegatedTokenProvider : localTokenProvider;
}

export function withSpotifyAuthContext<T>(
  context: SpotifyAuthContext,
  callback: () => Promise<T>,
) {
  return spotifyAuthContext.run(context, callback);
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
