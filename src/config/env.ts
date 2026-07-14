import { z } from 'zod';

const envSchema = z.object({
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(11070),
  NODE_ENV: z.string().default('development'),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_REDIRECT_URI: z.string().url().default('http://127.0.0.1:11070/auth/callback'),
  SPOTIFY_TOKEN_STORE_PATH: z.string().min(1).default('.spotify-token.json'),
  SPOTIFY_SCOPES: z
    .string()
    .default(
      [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-read-currently-playing',
        'user-modify-playback-state',
        'playlist-read-private',
        'playlist-read-collaborative',
      ].join(','),
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = Object.freeze({
  host: env.HOST,
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  spotify: Object.freeze({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    redirectUri: env.SPOTIFY_REDIRECT_URI,
    tokenStorePath: env.SPOTIFY_TOKEN_STORE_PATH,
    scopes: env.SPOTIFY_SCOPES.split(',')
      .map((scope) => scope.trim())
      .filter(Boolean),
  }),
});
