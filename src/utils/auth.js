// Authentication utility for Noted (Reverse-Engineered from Notion Desktop DMG / Web Auth)
//
// Identity rules (security):
// - Google sign-in is verified server-side (/api/auth). The client never
//   fabricates a Google identity and never receives a database credential.
// - "Continue with email" creates a LOCAL account only: it works offline and
//   is not able to sync to the cloud until a real Google session exists.
// - The cloud session token is stored in localStorage and attached to
//   /api/sync requests as a bearer token.

import { getCurrentUser, setCurrentUser, DEFAULT_USER } from './comments';
import { getSessionToken, setSessionToken, clearSessionToken, getApiBaseUrl } from './session';
import { notedServerRequest } from './cloudSync';

const GOOGLE_CLIENT_ID_KEY = 'noted_google_client_id_v1';

export const getGoogleClientId = () => {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
  if (stored && stored.trim()) return stored.trim();
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
};

export const setGoogleClientId = (clientId) => {
  if (typeof window === 'undefined') return;
  if (!clientId || !clientId.trim()) {
    localStorage.removeItem(GOOGLE_CLIENT_ID_KEY);
  } else {
    localStorage.setItem(GOOGLE_CLIENT_ID_KEY, clientId.trim());
  }
  window.dispatchEvent(new CustomEvent('noted_auth_config_changed', { detail: { clientId } }));
};

// Parse JWT from Google OAuth response safely without external dependencies.
// Note: parsing never authenticates - the token is verified server-side.
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse JWT token:', err);
    return null;
  }
};

export const getAuthState = () => {
  const user = getCurrentUser();
  const clientId = getGoogleClientId();
  return {
    user,
    isLoggedIn: Boolean(user?.isLoggedIn),
    provider: user?.loginProvider || 'guest',
    googleClientId: clientId,
    hasCloudSession: Boolean(getSessionToken())
  };
};

const ACCOUNTS_LIST_KEY = 'noted_saved_accounts_v1';

export const getSavedAccounts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_LIST_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const saveAccountToList = (user) => {
  if (typeof window === 'undefined' || !user || !user.id || !user.isLoggedIn) return;
  try {
    const list = getSavedAccounts();
    const existingIdx = list.findIndex((a) => a.id === user.id || (a.email && user.email && a.email.toLowerCase() === user.email.toLowerCase()));
    const accountEntry = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      picture: user.picture,
      loginProvider: user.loginProvider,
      session: getSessionToken() || null,
      lastActive: Date.now()
    };

    if (existingIdx >= 0) {
      list[existingIdx] = accountEntry;
    } else {
      list.push(accountEntry);
    }
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save account to list:', err);
  }
};

export const removeAccountFromList = (accountId) => {
  if (typeof window === 'undefined') return;
  try {
    const list = getSavedAccounts().filter((a) => a.id !== accountId);
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(list));
    const activeUser = getCurrentUser();
    if (activeUser?.id === accountId) {
      logout();
    }
  } catch (err) {
    console.error('Failed to remove account from list:', err);
  }
};

export const switchAccount = (accountId) => {
  if (accountId === 'guest') {
    return logout();
  }
  const accounts = getSavedAccounts();
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return null;

  // Restore the cloud session that belongs to the selected account.
  setSessionToken(target.session || '');

  const switchedUser = {
    ...target,
    isLoggedIn: true,
    lastActive: Date.now()
  };
  setCurrentUser(switchedUser);
  saveAccountToList(switchedUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: switchedUser } }));
  return switchedUser;
};

export const updateUserProfile = (updates) => {
  const current = getCurrentUser();
  if (!current) return null;

  const updatedUser = {
    ...current,
    ...updates,
    // Keep avatar monogram updated if name changed and no picture
    avatar: updates.avatar || (updates.name ? updates.name[0].toUpperCase() : current.avatar)
  };

  setCurrentUser(updatedUser);
  if (updatedUser.isLoggedIn) {
    saveAccountToList(updatedUser);
  }
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: updatedUser } }));
  return updatedUser;
};

/**
 * Turns a server error into a message that says what to do about it.
 */
const describeAuthError = (status, serverMessage) => {
  const message = String(serverMessage || '');

  if (message.includes('SESSION_SECRET')) {
    return 'Server belum dikonfigurasi untuk sesi login. Set SESSION_SECRET di environment server (Vercel), lalu deploy ulang.';
  }
  if (message.includes('GOOGLE_CLIENT_ID')) {
    return 'Server belum dikonfigurasi untuk Google login. Set GOOGLE_CLIENT_ID di environment server, lalu deploy ulang.';
  }
  if (message.includes('Origin not allowed')) {
    return 'Origin aplikasi belum diizinkan server. Tambahkan origin ini ke ALLOWED_ORIGINS di environment server.';
  }
  if (status === 503) {
    return 'Server sedang tidak dikonfigurasi untuk login. Periksa environment server.';
  }
  if (status === 403) {
    return 'Server menolak permintaan ini. Periksa ALLOWED_ORIGINS di environment server.';
  }
  if (message.includes('could not be verified')) {
    return 'Kredensial Google ditolak server. Coba login ulang, dan pastikan GOOGLE_CLIENT_ID di server sama dengan yang di aplikasi.';
  }
  return message || 'Login Google gagal. Coba lagi beberapa saat lagi.';
};

/**
 * Signs in with a Google Identity Services credential.
 * The credential is verified server-side; the server returns a session token
 * that authorizes /api/sync calls.
 */
export const loginWithGoogleCredential = async (credentialToken) => {
  if (!credentialToken) {
    throw new Error('Missing Google credential token');
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: credentialToken })
  });

  if (!response.ok) {
    let serverMessage = '';
    try {
      const data = await response.json();
      serverMessage = data?.error || '';
    } catch {
      serverMessage = '';
    }
    throw new Error(describeAuthError(response.status, serverMessage));
  }

  const data = await response.json();
  if (!data?.session || !data?.user) {
    throw new Error('Invalid response from the authentication server');
  }

  const authenticatedUser = {
    ...data.user,
    isLoggedIn: true,
    loginProvider: 'google',
    loggedInAt: Date.now()
  };

  setSessionToken(data.session);
  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: authenticatedUser } }));
  return authenticatedUser;
};

/**
 * Applies a session token received from a desktop hand-off (noted://auth deep link).
 */
export const applyDesktopSession = async (sessionToken) => {
  if (!sessionToken) return null;

  setSessionToken(sessionToken);

  try {
    // The request goes through the main process on the desktop, because a
    // file:// origin is refused by the server.
    const data = await notedServerRequest('/api/sync', {
      method: 'GET',
      session: sessionToken
    });
    if (!data) throw new Error('Session rejected by server');
    if (!data.resolvedUserId && !data.success) throw new Error('Invalid session response');
  } catch (err) {
    clearSessionToken();
    throw new Error(err.message || 'Invalid session token');
  }

  const sessionPayload = decodeSessionPayload(sessionToken);
  const email = sessionPayload?.email || null;
  // The session subject is issued by the server and is identical to the id
  // used by the web login. Deriving a local id instead would scope the
  // desktop workspace under a different key and hide the user's pages.
  const sessionUserId = sessionPayload?.sub || null;

  if (!sessionUserId) {
    clearSessionToken();
    throw new Error('Session does not carry a verified identity');
  }

  const authenticatedUser = {
    id: sessionUserId,
    name: sessionPayload.name || (email ? email.split('@')[0] : 'Noted User'),
    email: email || null,
    picture: sessionPayload.picture || null,
    avatar: (email ? email[0] : 'N').toUpperCase(),
    color: '#2383e2',
    isLoggedIn: true,
    loginProvider: 'google',
    loggedInAt: Date.now()
  };

  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: authenticatedUser } }));
  return authenticatedUser;
};

const decodeSessionPayload = (token) => {
  try {
    const payload = token.split('.')[0];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
};

/**
 * Looks up a locally known account by email (offline only).
 */
export const lookupSavedAccountByEmail = (email) => {
  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();
  return getSavedAccounts().find((a) => a.email && a.email.toLowerCase() === cleanEmail) || null;
};

/**
 * Creates a LOCAL (offline) account.
 * Local accounts cannot sync to the cloud - a verified Google session is required.
 */
export const loginWithEmail = (email, name = null) => {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }

  const cleanEmail = email.trim().toLowerCase();
  const saved = lookupSavedAccountByEmail(cleanEmail);
  const displayName = name || (saved ? saved.name : cleanEmail.split('@')[0].replace(/[._-]/g, ' '));
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const accountId = saved ? saved.id : `local_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const authenticatedUser = {
    id: accountId,
    name: formattedName,
    email: cleanEmail,
    picture: saved?.picture || null,
    avatar: formattedName[0].toUpperCase(),
    color: saved?.color || '#00897b',
    isLoggedIn: true,
    loginProvider: 'local',
    loggedInAt: Date.now()
  };

  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: authenticatedUser } }));

  return authenticatedUser;
};

export const isElectronApp = () => {
  return typeof window !== 'undefined' && Boolean(
    window.electronAPI?.isElectron ||
    window.location.protocol === 'file:' ||
    navigator.userAgent?.toLowerCase().includes('electron')
  );
};

export const isMobileNativeApp = () => {
  if (typeof window === 'undefined') return false;
  // Only a real native runtime counts as "native". A browser that happens to
  // run on localhost (the Vite dev server) is a normal web context and must
  // keep the Google Identity Services button available.
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.origin === 'capacitor://localhost'
  );
};

export const shouldUseNativeGoogleAuth = () => {
  return isElectronApp() || isMobileNativeApp();
};

export const logout = () => {
  clearSessionToken();
  const guestUser = {
    ...DEFAULT_USER,
    isLoggedIn: false,
    loginProvider: 'guest'
  };
  setCurrentUser(guestUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: guestUser } }));
  return guestUser;
};

export const logoutAllAccounts = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ACCOUNTS_LIST_KEY);
    } catch (e) {
      console.warn(e);
    }
  }
  return logout();
};
