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

type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyExternalUrls = {
  spotify?: string;
};

type SpotifyArtistSummary = {
  id: string;
  name: string;
  uri: string;
  external_urls?: SpotifyExternalUrls;
};

type SpotifyAlbumSummary = {
  id: string;
  name: string;
  album_type?: string;
  release_date?: string;
  total_tracks?: number;
  uri: string;
  external_urls?: SpotifyExternalUrls;
  images?: SpotifyImage[];
  artists?: SpotifyArtistSummary[];
};

type SpotifyTrackSummary = {
  id: string;
  name: string;
  uri: string;
  duration_ms?: number;
  explicit?: boolean;
  popularity?: number;
  external_urls?: SpotifyExternalUrls;
  artists?: SpotifyArtistSummary[];
  album?: SpotifyAlbumSummary;
};

type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  description?: string | null;
  public?: boolean | null;
  collaborative?: boolean;
  uri: string;
  external_urls?: SpotifyExternalUrls;
  images?: SpotifyImage[];
  owner?: {
    id?: string;
    display_name?: string | null;
  };
  tracks?: {
    total?: number;
  };
};

type SpotifySearchResponse = {
  tracks?: { items: SpotifyTrackSummary[] };
  artists?: {
    items: Array<SpotifyArtistSummary & {
      genres?: string[];
      popularity?: number;
      images?: SpotifyImage[];
    }>;
  };
  albums?: { items: SpotifyAlbumSummary[] };
  playlists?: { items: Array<SpotifyPlaylistSummary | null> };
};

type SpotifyDevice = {
  id: string | null;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
  supports_volume: boolean;
};

type SpotifyDevicesResponse = {
  devices: SpotifyDevice[];
};

type SpotifyPlaybackResponse = {
  device?: SpotifyDevice;
  repeat_state?: string;
  shuffle_state?: boolean;
  context?: {
    type?: string;
    uri?: string;
    external_urls?: SpotifyExternalUrls;
  } | null;
  timestamp?: number;
  progress_ms?: number | null;
  is_playing?: boolean;
  item?: SpotifyTrackSummary | null;
  currently_playing_type?: string;
};

type SpotifyFetchOptions = {
  allowNoContent?: boolean;
  method?: string;
  body?: unknown;
};

async function spotifyFetch<T>(path: string, options?: SpotifyFetchOptions): Promise<T>;
async function spotifyFetch<T>(
  path: string,
  options: SpotifyFetchOptions & { allowNoContent: true },
): Promise<T | null>;
async function spotifyFetch<T>(path: string, options?: SpotifyFetchOptions) {
  const accessToken = await getValidAccessToken();
  const body = options?.body;
  const response = await fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new SpotifyMcpError('SPOTIFY_API_ERROR', 'Spotify Web API request failed.', {
      status: response.status,
      body: responseBody,
      path,
    });
  }

  if (responseBody.trim() === '' && options?.allowNoContent) {
    return null;
  }

  try {
    return JSON.parse(responseBody) as T;
  } catch (error) {
    const method = options?.method ?? 'GET';
    if (options?.allowNoContent && method !== 'GET') {
      return null;
    }
    throw new SpotifyMcpError('SPOTIFY_API_INVALID_JSON', 'Spotify Web API returned invalid JSON.', {
      status: response.status,
      body: responseBody,
      path,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

async function spotifyCommand(path: string, options?: { method?: string; body?: unknown }) {
  await spotifyFetch<never>(path, {
    method: options?.method ?? 'PUT',
    body: options?.body,
    allowNoContent: true,
  });

  return { ok: true };
}

function withDevice(path: string, deviceId?: string) {
  if (!deviceId) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}device_id=${encodeURIComponent(deviceId)}`;
}

function simplifyArtist(artist: SpotifyArtistSummary) {
  return {
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    spotifyUrl: artist.external_urls?.spotify ?? null,
  };
}

function simplifyAlbum(album: SpotifyAlbumSummary) {
  return {
    id: album.id,
    name: album.name,
    type: album.album_type ?? null,
    releaseDate: album.release_date ?? null,
    totalTracks: album.total_tracks ?? null,
    uri: album.uri,
    spotifyUrl: album.external_urls?.spotify ?? null,
    imageUrl: album.images?.[0]?.url ?? null,
    artists: album.artists?.map(simplifyArtist) ?? [],
  };
}

function simplifyTrack(track: SpotifyTrackSummary) {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    spotifyUrl: track.external_urls?.spotify ?? null,
    durationMs: track.duration_ms ?? null,
    explicit: track.explicit ?? null,
    popularity: track.popularity ?? null,
    artists: track.artists?.map(simplifyArtist) ?? [],
    album: track.album ? simplifyAlbum(track.album) : null,
  };
}

function simplifyPlaylist(playlist: SpotifyPlaylistSummary) {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description ?? null,
    public: playlist.public ?? null,
    collaborative: playlist.collaborative ?? null,
    uri: playlist.uri,
    spotifyUrl: playlist.external_urls?.spotify ?? null,
    imageUrl: playlist.images?.[0]?.url ?? null,
    owner: playlist.owner
      ? {
          id: playlist.owner.id ?? null,
          displayName: playlist.owner.display_name ?? null,
        }
      : null,
    totalTracks: playlist.tracks?.total ?? null,
  };
}

function simplifyDevice(device: SpotifyDevice) {
  return {
    id: device.id,
    name: device.name,
    type: device.type,
    isActive: device.is_active,
    isPrivateSession: device.is_private_session,
    isRestricted: device.is_restricted,
    volumePercent: device.volume_percent,
    supportsVolume: device.supports_volume,
  };
}

function assertSupportedSpotifyUri(uri: string) {
  if (!/^spotify:(track|album|artist|playlist):[^:]+$/.test(uri)) {
    throw new SpotifyMcpError('SPOTIFY_INVALID_URI', 'Unsupported Spotify URI format.', {
      uri,
      expected: 'spotify:track:<id>, spotify:album:<id>, spotify:artist:<id> or spotify:playlist:<id>',
    });
  }
}

function resolveDeviceByName(devices: ReturnType<typeof simplifyDevice>[], deviceName: string) {
  const normalized = deviceName.trim().toLowerCase();
  const matches = devices.filter((device) => device.name.trim().toLowerCase() === normalized);

  if (matches.length === 1) return matches[0];

  throw new SpotifyMcpError(
    matches.length === 0 ? 'SPOTIFY_DEVICE_NOT_FOUND' : 'SPOTIFY_DEVICE_AMBIGUOUS',
    matches.length === 0
      ? 'No Spotify Connect device matched the requested name.'
      : 'More than one Spotify Connect device matched the requested name.',
    {
      deviceName,
      availableDevices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        isActive: device.isActive,
      })),
    },
  );
}

function simplifyPlayback(playback: SpotifyPlaybackResponse | null) {
  if (!playback) {
    return {
      available: false,
      isPlaying: false,
      progressMs: null,
      repeatState: null,
      shuffleState: null,
      currentlyPlayingType: null,
      context: null,
      item: null,
      device: null,
    };
  }

  return {
    available: true,
    isPlaying: playback.is_playing ?? false,
    progressMs: playback.progress_ms ?? null,
    repeatState: playback.repeat_state ?? null,
    shuffleState: playback.shuffle_state ?? null,
    currentlyPlayingType: playback.currently_playing_type ?? null,
    context: playback.context
      ? {
          type: playback.context.type ?? null,
          uri: playback.context.uri ?? null,
          spotifyUrl: playback.context.external_urls?.spotify ?? null,
        }
      : null,
    device: playback.device ? simplifyDevice(playback.device) : null,
    item: playback.item ? simplifyTrack(playback.item) : null,
  };
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

export async function searchSpotify({
  query,
  types,
  limit,
}: {
  query: string;
  types: Array<'track' | 'artist' | 'album' | 'playlist'>;
  limit: number;
}) {
  const params = new URLSearchParams({
    q: query,
    type: types.join(','),
    limit: String(limit),
  });
  const response = await spotifyFetch<SpotifySearchResponse>(`/search?${params.toString()}`);

  return {
    tracks: response.tracks?.items.map(simplifyTrack) ?? [],
    artists:
      response.artists?.items.map((artist) => ({
        ...simplifyArtist(artist),
        genres: artist.genres ?? [],
        popularity: artist.popularity ?? null,
        imageUrl: artist.images?.[0]?.url ?? null,
      })) ?? [],
    albums: response.albums?.items.map(simplifyAlbum) ?? [],
    playlists:
      response.playlists?.items
        .filter((playlist): playlist is SpotifyPlaylistSummary => Boolean(playlist))
        .map(simplifyPlaylist) ?? [],
  };
}

export async function getAvailableDevices() {
  const response = await spotifyFetch<SpotifyDevicesResponse>('/me/player/devices');

  return {
    devices: response.devices.map(simplifyDevice),
  };
}

export async function getPlaybackState() {
  const response = await spotifyFetch<SpotifyPlaybackResponse>('/me/player', {
    allowNoContent: true,
  });

  return simplifyPlayback(response);
}

export async function getCurrentTrack() {
  const response = await spotifyFetch<SpotifyPlaybackResponse>('/me/player/currently-playing', {
    allowNoContent: true,
  });

  const playback = simplifyPlayback(response);

  return {
    available: playback.available,
    isPlaying: playback.isPlaying,
    progressMs: playback.progressMs,
    currentlyPlayingType: playback.currentlyPlayingType,
    item: playback.item,
  };
}

export async function playSpotify({
  deviceId,
  uri,
  positionMs,
}: {
  deviceId?: string;
  uri?: string;
  positionMs?: number;
}) {
  if (uri) {
    assertSupportedSpotifyUri(uri);
  }

  const body =
    uri || positionMs !== undefined
      ? {
          ...(uri
            ? uri.startsWith('spotify:track:')
              ? { uris: [uri] }
              : { context_uri: uri }
            : {}),
          ...(positionMs === undefined ? {} : { position_ms: positionMs }),
        }
      : undefined;

  await spotifyCommand(withDevice('/me/player/play', deviceId), {
    method: 'PUT',
    body,
  });

  return { ok: true, action: 'play' };
}

export async function playSpotifySearch({
  query,
  deviceId,
  deviceName,
}: {
  query: string;
  deviceId?: string;
  deviceName?: string;
}) {
  let resolvedDeviceId = deviceId;
  let resolvedDevice: ReturnType<typeof simplifyDevice> | null = null;

  if (!resolvedDeviceId && deviceName) {
    const { devices } = await getAvailableDevices();
    resolvedDevice = resolveDeviceByName(devices, deviceName);
    if (!resolvedDevice.id) {
      throw new SpotifyMcpError('SPOTIFY_DEVICE_NOT_TRANSFERABLE', 'Matched Spotify device has no device id.', {
        deviceName,
        device: resolvedDevice,
      });
    }
    resolvedDeviceId = resolvedDevice.id;
  }

  const results = await searchSpotify({ query, types: ['track'], limit: 5 });
  const track = results.tracks[0];

  if (!track) {
    throw new SpotifyMcpError('SPOTIFY_TRACK_NOT_FOUND', 'No Spotify track matched the search query.', {
      query,
    });
  }

  await playSpotify({ deviceId: resolvedDeviceId, uri: track.uri });

  return {
    ok: true,
    action: 'play_search',
    query,
    deviceId: resolvedDeviceId ?? null,
    device: resolvedDevice,
    track,
  };
}

export async function transferSpotifyPlayback({
  deviceId,
  play = true,
}: {
  deviceId: string;
  play?: boolean;
}) {
  await spotifyCommand('/me/player', {
    method: 'PUT',
    body: {
      device_ids: [deviceId],
      play,
    },
  });

  return { ok: true, action: 'transfer_playback', deviceId, play };
}

export async function pauseSpotify(deviceId?: string) {
  await spotifyCommand(withDevice('/me/player/pause', deviceId), { method: 'PUT' });

  return { ok: true, action: 'pause' };
}

export async function nextSpotify(deviceId?: string) {
  await spotifyCommand(withDevice('/me/player/next', deviceId), { method: 'POST' });

  return { ok: true, action: 'next' };
}

export async function previousSpotify(deviceId?: string) {
  await spotifyCommand(withDevice('/me/player/previous', deviceId), { method: 'POST' });

  return { ok: true, action: 'previous' };
}

export async function setSpotifyVolume({
  volumePercent,
  deviceId,
}: {
  volumePercent: number;
  deviceId?: string;
}) {
  const params = new URLSearchParams({
    volume_percent: String(volumePercent),
  });

  if (deviceId) {
    params.set('device_id', deviceId);
  }

  await spotifyCommand(`/me/player/volume?${params.toString()}`, { method: 'PUT' });

  return { ok: true, action: 'set_volume', volumePercent };
}
