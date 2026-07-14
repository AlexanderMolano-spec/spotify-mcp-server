import { randomBytes } from 'node:crypto';

const STATE_TTL_MS = 10 * 60 * 1000;
const states = new Map<string, number>();

function pruneExpiredStates(now = Date.now()) {
  for (const [state, expiresAt] of states) {
    if (expiresAt <= now) {
      states.delete(state);
    }
  }
}

export function createOAuthState() {
  pruneExpiredStates();

  const state = randomBytes(24).toString('base64url');
  states.set(state, Date.now() + STATE_TTL_MS);

  return state;
}

export function consumeOAuthState(state: string) {
  pruneExpiredStates();

  const expiresAt = states.get(state);

  if (!expiresAt) {
    return false;
  }

  states.delete(state);
  return expiresAt > Date.now();
}
