import { SpotifyMcpError } from './errors.js';
import { getSpotifyAccessToken } from './authProvider.js';

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

type SpotifyPlaylistsResponse = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Array<SpotifyPlaylistSummary | null>;
};

type SpotifyPlaylistTracksResponse = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: Array<{
    added_at?: string | null;
    track?: SpotifyTrackSummary | null;
  }>;
};

type SpotifyAlbumTracksResponse = {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: SpotifyTrackSummary[];
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

type SpotifyQueueResponse = {
  currently_playing: SpotifyTrackSummary | null;
  queue: SpotifyTrackSummary[];
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
  const accessToken = await getSpotifyAccessToken();
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
    if (response.status === 401) {
      throw new SpotifyMcpError('SPOTIFY_AUTH_INVALID', 'Spotify access token is invalid or expired.', {
        status: response.status,
        body: responseBody,
        path,
      });
    }

    if (response.status === 403) {
      throw new SpotifyMcpError(
        'SPOTIFY_SCOPE_REQUIRED',
        'Spotify rejected the request. The token may be missing a required scope or the account/device may not allow this action.',
        {
          status: response.status,
          body: responseBody,
          path,
        },
      );
    }

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

function compactTrack(track: SpotifyTrackSummary) {
  return {
    id: track.id ?? null,
    name: track.name ?? null,
    uri: track.uri ?? null,
    durationMs: track.duration_ms ?? null,
    artists: track.artists?.map((artist) => artist.name) ?? [],
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

function assertQueueableSpotifyUri(uri: string) {
  if (!/^spotify:(track|episode):[^:]+$/.test(uri)) {
    throw new SpotifyMcpError('SPOTIFY_INVALID_QUEUE_URI', 'Queue item must be a track or episode URI.', {
      uri,
      expected: 'spotify:track:<id> or spotify:episode:<id>',
    });
  }
}

function playlistIdFromUri(uri: string) {
  const match = /^spotify:playlist:([^:]+)$/.exec(uri);
  return match?.[1] ?? null;
}

function albumIdFromUri(uri: string) {
  const match = /^spotify:album:([^:]+)$/.exec(uri);
  return match?.[1] ?? null;
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

function resolvePlaylistByName(playlists: ReturnType<typeof simplifyPlaylist>[], playlistName: string) {
  const normalized = playlistName.trim().toLowerCase();
  const matches = playlists.filter((playlist) => playlist.name.trim().toLowerCase() === normalized);

  if (matches.length === 1) return matches[0];

  if (matches.length === 0) {
    throw new SpotifyMcpError(
      'SPOTIFY_PLAYLIST_NOT_FOUND',
      'No current-user Spotify playlist matched the requested name.',
      {
        playlistName,
        scope: 'current_user_playlists',
        hint: 'For public Spotify playlists that are not in the current user library, call spotify_search with type playlist, then pass the selected playlistId or playlistUri to spotify_play_playlist.',
      },
    );
  }

  throw new SpotifyMcpError(
    'SPOTIFY_PLAYLIST_AMBIGUOUS',
    'More than one current-user Spotify playlist matched the requested name.',
    {
      playlistName,
      availablePlaylists: playlists.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        owner: playlist.owner,
        totalTracks: playlist.totalTracks,
        public: playlist.public,
        collaborative: playlist.collaborative,
      })),
    },
  );
}

async function resolvePlaylistId({
  playlistId,
  playlistUri,
  playlistName,
}: {
  playlistId?: string;
  playlistUri?: string;
  playlistName?: string;
}) {
  if (playlistId) {
    return { playlistId, playlist: null };
  }

  if (playlistUri) {
    assertSupportedSpotifyUri(playlistUri);
    const id = playlistIdFromUri(playlistUri);
    if (!id) {
      throw new SpotifyMcpError('SPOTIFY_INVALID_PLAYLIST_URI', 'Spotify URI is not a playlist URI.', { playlistUri });
    }
    return { playlistId: id, playlist: null };
  }

  if (playlistName) {
    const { playlists } = await getCurrentUserPlaylists({ limit: 50, offset: 0, includeDetails: true });
    const playlist = resolvePlaylistByName(playlists, playlistName);
    return { playlistId: playlist.id, playlist };
  }

  throw new SpotifyMcpError('SPOTIFY_PLAYLIST_REQUIRED', 'Provide playlistId, playlistUri or playlistName.');
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

export async function getCurrentUserPlaylists({
  limit = 10,
  offset = 0,
  includeDetails = false,
}: {
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
} = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await spotifyFetch<SpotifyPlaylistsResponse>(`/me/playlists?${params.toString()}`);

  return {
    href: response.href,
    limit: response.limit,
    next: response.next,
    offset: response.offset,
    previous: response.previous,
    total: response.total,
    playlists: response.items
      .filter((playlist): playlist is SpotifyPlaylistSummary => Boolean(playlist))
      .map((playlist) => {
        const simplified = simplifyPlaylist(playlist);
        if (includeDetails) return simplified;

        return {
          id: simplified.id,
          name: simplified.name,
          description: null,
          uri: simplified.uri,
          spotifyUrl: null,
          imageUrl: null,
          owner: simplified.owner,
          totalTracks: simplified.totalTracks,
          public: simplified.public,
          collaborative: simplified.collaborative,
        };
      }),
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

export async function getQueue({ limit = 10, includeDetails = false }: { limit?: number; includeDetails?: boolean } = {}) {
  const response = await spotifyFetch<SpotifyQueueResponse>('/me/player/queue');
  const queue = response.queue.slice(0, limit).map((track) => (includeDetails ? simplifyTrack(track) : compactTrack(track)));

  return {
    currentlyPlaying: response.currently_playing
      ? includeDetails
        ? simplifyTrack(response.currently_playing)
        : compactTrack(response.currently_playing)
      : null,
    nextTrack: queue[0] ?? null,
    queue,
    returned: queue.length,
    totalAvailable: response.queue.length,
  };
}

export async function getNextTrack() {
  const queue = await getQueue({ limit: 1 });

  return {
    currentlyPlaying: queue.currentlyPlaying,
    nextTrack: queue.nextTrack,
    queueAvailable: queue.totalAvailable,
  };
}

export async function getPlaylistTracks({
  playlistId,
  playlistUri,
  playlistName,
  limit = 20,
  offset = 0,
  includeDetails = false,
}: {
  playlistId?: string;
  playlistUri?: string;
  playlistName?: string;
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
}) {
  const resolved = await resolvePlaylistId({ playlistId, playlistUri, playlistName });
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    additional_types: 'track',
    fields: 'href,limit,next,offset,previous,total,items(added_at,track(id,name,uri,duration_ms,explicit,external_urls,artists(id,name,uri,external_urls),album(id,name,uri,album_type,release_date,total_tracks,external_urls,images)))',
  });
  const response = await spotifyFetch<SpotifyPlaylistTracksResponse>(
    `/playlists/${encodeURIComponent(resolved.playlistId)}/tracks?${params.toString()}`,
  );

  return {
    playlistId: resolved.playlistId,
    playlist: resolved.playlist,
    href: response.href,
    limit: response.limit,
    next: response.next,
    offset: response.offset,
    previous: response.previous,
    total: response.total,
    tracks: response.items
      .filter((item) => Boolean(item.track))
      .map((item, index) => ({
        position: response.offset + index,
        addedAt: includeDetails ? (item.added_at ?? null) : null,
        track: includeDetails ? simplifyTrack(item.track as SpotifyTrackSummary) : compactTrack(item.track as SpotifyTrackSummary),
      })),
  };
}

export async function getAlbumTracks({
  albumId,
  albumUri,
  limit = 20,
  offset = 0,
  includeDetails = false,
}: {
  albumId?: string;
  albumUri?: string;
  limit?: number;
  offset?: number;
  includeDetails?: boolean;
}) {
  let resolvedAlbumId = albumId;

  if (resolvedAlbumId?.startsWith('spotify:')) {
    assertSupportedSpotifyUri(resolvedAlbumId);
    resolvedAlbumId = albumIdFromUri(resolvedAlbumId) ?? undefined;
    if (!resolvedAlbumId) {
      throw new SpotifyMcpError('SPOTIFY_INVALID_ALBUM_URI', 'Spotify URI is not an album URI.', { albumId });
    }
  }

  if (!resolvedAlbumId && albumUri) {
    assertSupportedSpotifyUri(albumUri);
    resolvedAlbumId = albumIdFromUri(albumUri) ?? undefined;
    if (!resolvedAlbumId) {
      throw new SpotifyMcpError('SPOTIFY_INVALID_ALBUM_URI', 'Spotify URI is not an album URI.', { albumUri });
    }
  }

  if (!resolvedAlbumId) {
    throw new SpotifyMcpError('SPOTIFY_ALBUM_REQUIRED', 'Provide albumId or albumUri.');
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await spotifyFetch<SpotifyAlbumTracksResponse>(
    `/albums/${encodeURIComponent(resolvedAlbumId)}/tracks?${params.toString()}`,
  );

  return {
    albumId: resolvedAlbumId,
    href: response.href,
    limit: response.limit,
    next: response.next,
    offset: response.offset,
    previous: response.previous,
    total: response.total,
    tracks: response.items.map((track, index) => ({
      position: response.offset + index,
      track: includeDetails ? simplifyTrack(track) : compactTrack(track),
    })),
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

export async function addToQueue({
  uri,
  query,
  deviceId,
  deviceName,
}: {
  uri?: string;
  query?: string;
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

  let resolvedUri = uri;
  let track = null;

  if (resolvedUri) {
    assertQueueableSpotifyUri(resolvedUri);
  } else if (query) {
    const results = await searchSpotify({ query, types: ['track'], limit: 5 });
    track = results.tracks[0] ?? null;
    if (!track) {
      throw new SpotifyMcpError('SPOTIFY_TRACK_NOT_FOUND', 'No Spotify track matched the search query.', { query });
    }
    resolvedUri = track.uri;
  }

  if (!resolvedUri) {
    throw new SpotifyMcpError('SPOTIFY_QUEUE_ITEM_REQUIRED', 'Provide uri or query.');
  }

  const params = new URLSearchParams({ uri: resolvedUri });
  if (resolvedDeviceId) {
    params.set('device_id', resolvedDeviceId);
  }

  await spotifyCommand(`/me/player/queue?${params.toString()}`, { method: 'POST' });

  return {
    ok: true,
    action: 'add_to_queue',
    uri: resolvedUri,
    query: query ?? null,
    track,
    deviceId: resolvedDeviceId ?? null,
    device: resolvedDevice,
  };
}

export async function playSpotifyPlaylist({
  playlistId,
  playlistUri,
  playlistName,
  deviceId,
  deviceName,
  position,
}: {
  playlistId?: string;
  playlistUri?: string;
  playlistName?: string;
  deviceId?: string;
  deviceName?: string;
  position?: number;
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

  const resolvedPlaylist = await resolvePlaylistId({ playlistId, playlistUri, playlistName });
  const uri = `spotify:playlist:${resolvedPlaylist.playlistId}`;

  await spotifyCommand(withDevice('/me/player/play', resolvedDeviceId), {
    method: 'PUT',
    body: {
      context_uri: uri,
      ...(position === undefined ? {} : { offset: { position } }),
    },
  });

  return {
    ok: true,
    action: 'play_playlist',
    playlistUri: uri,
    playlist: resolvedPlaylist.playlist,
    deviceId: resolvedDeviceId ?? null,
    device: resolvedDevice,
    position: position ?? null,
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
