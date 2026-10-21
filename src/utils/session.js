// Session token storage for Noted (server-issued, HMAC signed)
// The token never contains database credentials and is only used to authorize
// calls to the /api/sync and /api/auth endpoints.

const SESSION_TOKEN_KEY = 'noted_session_token_v1';

/**
 * Returns the base URL used to reach the Noted server API.
 * - Development: an empty string, so the request goes to the same origin and
 *   is handled by the local API middleware of the dev server.
 * - Packaged web, desktop and mobile build: VITE_APP_URL, because those run
 *   from a file or from a different origin than the API.
 */
export const getApiBaseUrl = () => {
  if (import.meta.env?.DEV) {
    return '';
  }
  const configured = import.meta.env?.VITE_APP_URL;
  if (configured && typeof configured === 'string') {
    return configured.replace(/\/$/, '');
  }
  return '';
};

export const getSessionToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setSessionToken = (token) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    // The desktop hand-off listens for this, so a session that is issued
    // outside the sign-in flow still reaches the desktop app.
    window.dispatchEvent(new CustomEvent('noted_session_updated', { detail: { hasSession: Boolean(token) } }));
  } catch {
    // Storage unavailable - session stays in-memory only
  }
};

export const clearSessionToken = () => setSessionToken('');

export const hasSession = () => Boolean(getSessionToken());

/**
 * Builds the headers required for an authenticated API call.
 */
export const withAuthHeaders = (extra = {}) => {
  const token = getSessionToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
};
