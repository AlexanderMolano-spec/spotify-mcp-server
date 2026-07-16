import { Router } from 'express';
import { config } from '../config/env.js';
import {
  buildSpotifyAuthorizeUrl,
  exchangeAuthorizationCode,
} from './spotifyAccountsClient.js';
import { consumeOAuthState, createOAuthState } from './oauthState.js';
import { getSpotifyAuthStatus } from './authProvider.js';
import { saveToken } from './tokenStore.js';

export function createAuthRouter() {
  const router = Router();

  router.get('/login', (_req, res) => {
    if (!config.spotify.clientId || !config.spotify.clientSecret) {
      res.status(503).json({
        error: {
          code: 'SPOTIFY_OAUTH_NOT_CONFIGURED',
          message:
            'Spotify OAuth is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.',
        },
      });
      return;
    }

    res.redirect(buildSpotifyAuthorizeUrl(createOAuthState()));
  });

  router.get('/callback', async (req, res, next) => {
    try {
      const error = typeof req.query.error === 'string' ? req.query.error : null;

      if (error) {
        res.status(400).json({
          error: {
            code: 'SPOTIFY_AUTHORIZATION_DENIED',
            message: 'Spotify authorization was denied or cancelled.',
            details: { providerError: error },
          },
        });
        return;
      }

      const code = typeof req.query.code === 'string' ? req.query.code : null;
      const state = typeof req.query.state === 'string' ? req.query.state : null;

      if (!code) {
        res.status(400).json({
          error: {
            code: 'SPOTIFY_AUTHORIZATION_CODE_REQUIRED',
            message: 'Spotify authorization code is required.',
          },
        });
        return;
      }

      if (!state || !consumeOAuthState(state)) {
        res.status(400).json({
          error: {
            code: 'SPOTIFY_OAUTH_STATE_INVALID',
            message: 'Spotify OAuth state is missing, invalid or expired.',
          },
        });
        return;
      }

      const token = await exchangeAuthorizationCode(code);
      await saveToken(token);

      res.status(200).json({
        ok: true,
        message: 'Spotify authorization completed. You can close this tab.',
        auth: await getSpotifyAuthStatus(),
      });
    } catch (callbackError) {
      next(callbackError);
    }
  });

  router.get('/status', async (_req, res, next) => {
    try {
      res.status(200).json({
        ok: true,
        auth: await getSpotifyAuthStatus(),
      });
    } catch (statusError) {
      next(statusError);
    }
  });

  return router;
}
