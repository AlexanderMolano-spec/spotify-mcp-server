import { SpotifyMcpError } from './errors.js';
import { getValidAccessToken } from './tokenStore.js';

const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

type SpotifyUserProfile = {
  id: string;
  display_name?: string;
  email?: string;
  country?: string;
  product?: string;
  uri?: string;
  external_urls?: {
    spotify?: string;
  };
  images?: Array<{
    url: string;
    height?: number | null;
    width?: number | null;
  }>;
};

async function spotifyFetch<T>(path: string) {
  const accessToken = await getValidAccessToken();
  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new SpotifyMcpError('SPOTIFY_API_ERROR', 'Spotify Web API request failed.', {
      status: response.status,
      body,
      path,
    });
  }

  return (await response.json()) as T;
}

export async function getCurrentUserProfile() {
  const profile = await spotifyFetch<SpotifyUserProfile>('/me');

  return {
    id: profile.id,
    displayName: profile.display_name ?? null,
    email: profile.email ?? null,
    country: profile.country ?? null,
    product: profile.product ?? null,
    uri: profile.uri ?? null,
    spotifyUrl: profile.external_urls?.spotify ?? null,
    imageUrl: profile.images?.[0]?.url ?? null,
  };
}
