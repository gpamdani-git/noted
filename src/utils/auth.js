// Authentication utility for Noted (Reverse-Engineered from Notion Desktop DMG / Web Auth)
// Supports Google OAuth 2.0 (Google Identity Services GIS) and Email/Guest login

import { getCurrentUser, setCurrentUser, DEFAULT_USER } from './comments';

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

// Parse JWT from Google OAuth response safely without external dependencies
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
    googleClientId: clientId
  };
};

const ACCOUNTS_LIST_KEY = 'noted_saved_accounts_v1';

export const getSavedAccounts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveAccountToList = (user) => {
  if (typeof window === 'undefined' || !user || !user.id || !user.isLoggedIn) return;
  try {
    const list = getSavedAccounts();
    const existingIdx = list.findIndex((a) => a.id === user.id);
    const accountEntry = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      color: user.color,
      picture: user.picture,
      loginProvider: user.loginProvider,
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

// Login using Google OAuth credential token
export const loginWithGoogleCredential = (credentialToken) => {
  const payload = parseJwt(credentialToken);
  if (!payload || !payload.email) {
    throw new Error('Invalid Google credential token');
  }

  const authenticatedUser = {
    id: `google_${payload.sub || Date.now()}`,
    name: payload.name || payload.email.split('@')[0],
    email: payload.email,
    picture: payload.picture || null,
    avatar: (payload.name || payload.email)[0].toUpperCase(),
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

// Login using Work/Personal Email
export const loginWithEmail = (email, name = null) => {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address');
  }

  const cleanEmail = email.trim().toLowerCase();
  const displayName = name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const accountId = `email_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const authenticatedUser = {
    id: accountId,
    name: formattedName,
    email: cleanEmail,
    picture: null,
    avatar: formattedName[0].toUpperCase(),
    color: '#00897b',
    isLoggedIn: true,
    loginProvider: 'email',
    loggedInAt: Date.now()
  };

  setCurrentUser(authenticatedUser);
  saveAccountToList(authenticatedUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: authenticatedUser } }));
  return authenticatedUser;
};

// Demo/Simulated Google Login when Google Client ID is not yet provided
export const loginWithDemoGoogle = (customEmail = null, customName = null) => {
  const email = customEmail || 'dani.noted@gmail.com';
  const name = customName || 'Dani Akbar';
  const cleanEmail = email.trim().toLowerCase();
  const accountId = `google_demo_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const demoUser = {
    id: accountId,
    name,
    email: cleanEmail,
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    avatar: name[0],
    color: '#2383e2',
    isLoggedIn: true,
    loginProvider: 'google',
    loggedInAt: Date.now()
  };

  setCurrentUser(demoUser);
  saveAccountToList(demoUser);
  window.dispatchEvent(new CustomEvent('noted_auth_changed', { detail: { user: demoUser } }));
  return demoUser;
};

export const logout = () => {
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
