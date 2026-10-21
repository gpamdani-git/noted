// Notion Cloud & PostgreSQL Synchronization Engine for Noted
// Implements Notion Desktop 7.39.0 saveTransactions & offline-first dual sync protocol
// Features:
// - Multi-tab instant live sync (BroadcastChannel with 0ms local latency)
// - Cross-device live background sync pulse (10s heartbeat + window focus / visibility triggers)
// - Debounced transaction queue (1200ms) with optimistic offline-first fallback
//
// Security: the client never holds a database credential. Cloud access requires a
// server-issued session token that is sent as a bearer token to /api/sync.

import { getSessionToken, getApiBaseUrl } from './session';

export const tabId = 'tab_' + Math.random().toString(36).substring(2, 9);

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('noted_live_sync_v1');
  } catch (err) {
    console.warn('[cloudSync] BroadcastChannel not supported or blocked:', err);
  }
}

let syncTimeout = null;
let currentSyncState = {
  status: 'synced', // 'synced' | 'syncing' | 'offline' | 'local'
  lastSyncedAt: null,
  error: null,
  mode: 'offline_vault'
};

export const isMobileNativePlatform = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === '80' || window.location.port === '443')) ||
    window.location.origin === 'http://localhost' ||
    window.location.origin === 'https://localhost' ||
    window.location.origin === 'capacitor://localhost'
  );
};

const notifyStatus = (stateUpdates) => {
  currentSyncState = { ...currentSyncState, ...stateUpdates };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('noted_cloud_sync_status', { detail: currentSyncState })
    );
  }
};

export const getCloudSyncState = () => currentSyncState;

/**
 * Broadcasts local page edits to other tabs in the same browser instantly (0ms)
 */
export const broadcastLocalChange = (payload) => {
  if (!broadcastChannel) return;
  try {
    broadcastChannel.postMessage({
      type: 'LOCAL_TAB_MUTATION',
      tabId,
      timestamp: Date.now(),
      ...payload
    });
  } catch (err) {
    console.warn('[cloudSync] Broadcast postMessage error:', err);
  }
};

/**
 * Subscribes to live multi-tab broadcasts
 */
export const subscribeToMultiTabSync = (callback) => {
  if (!broadcastChannel) return () => {};
  const handler = (event) => {
    if (event.data && event.data.type === 'LOCAL_TAB_MUTATION' && event.data.tabId !== tabId) {
      callback(event.data);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => broadcastChannel.removeEventListener('message', handler);
};

/**
 * Starts live background synchronization pulse for cross-device / local <-> web sync
 * Triggers periodically (10s), on window focus, tab visibility change, and network reconnect.
 */
export const startLiveSyncPulse = ({ getUser, onRemoteUpdate, intervalMs = 10000 }) => {
  if (typeof window === 'undefined') return () => {};

  let intervalId = null;
  let isChecking = false;

  const checkRemoteChanges = async () => {
    const user = getUser();
    if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') return;
    if (isChecking) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    isChecking = true;
    try {
      const data = await fetchRemoteWorkspace(user);
      if (data && data.success && data.pages) {
        onRemoteUpdate(data);
      }
    } catch {
      // Silently ignore background pulse error
    } finally {
      isChecking = false;
    }
  };

  intervalId = setInterval(checkRemoteChanges, intervalMs);

  const handleFocus = () => checkRemoteChanges();
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') checkRemoteChanges();
  };
  const handleOnline = () => checkRemoteChanges();

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('online', handleOnline);

  return () => {
    if (intervalId) clearInterval(intervalId);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('online', handleOnline);
  };
};

/**
 * Cloud access note:
 * The browser client NEVER talks to the database directly. All cloud traffic
 * goes through the Noted server API (/api/sync), which requires a server-issued
 * session token and derives the workspace owner from that token.
 */

/**
 * Checks connection health with the PostgreSQL serverless backend
 */
export const checkCloudDatabaseStatus = async () => {
  if (typeof window === 'undefined') return { connected: false, configured: false };

  // 1. In Electron desktop app, use native IPC bridge to check Cloud PostgreSQL directly.
  //    When no database url is configured on this device the check falls through
  //    to the server, because the sync itself runs through the server.
  if (window.electronAPI?.checkCloudStatus) {
    try {
      const res = await window.electronAPI.checkCloudStatus();
      if (res?.connected) return res;
      if (res?.configured) {
        // The direct connection was tried and failed, so the result is real
        return res;
      }
      // No database url on this device: the sync itself runs through the
      // Noted server, so the status is asked there instead.
      if (window.electronAPI.checkServerStatus && getApiBaseUrl()) {
        const serverRes = await window.electronAPI.checkServerStatus(getApiBaseUrl());
        if (serverRes) return serverRes;
      }
    } catch (err) {
      console.warn('[Desktop IPC] checkCloudStatus warning:', err);
    }
  }

  // 2. In Web (Vite dev or Vercel production), call /api/status if HTTP/HTTPS (skip on Mobile Native APK)
  if (!isMobileNativePlatform() && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    try {
      const res = await fetch('/api/status', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      // Guard: mock fetch objects in tests may not have headers
      const contentType = res.headers?.get?.('content-type') || '';
      const isJson = contentType.includes('application/json') || !res.headers;
      if (res.ok && isJson) {
        const data = await res.json();
        if (data && data.connected !== undefined) return data;
      }
    } catch (err) {
      console.warn('[Web Fetch] /api/status warning:', err);
    }
  }

  // 3. Native platform and the desktop app: ask the configured API host
  if (getApiBaseUrl()) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/status`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const contentType = res.headers?.get?.('content-type') || '';
      const isJson = contentType.includes('application/json') || !res.headers;
      if (res.ok && isJson) {
        const data = await res.json();
        if (data && data.connected !== undefined) return data;
      }
    } catch (err) {
      console.warn('[Native Fetch] /api/status warning:', err);
    }
  }

  return {
    connected: false,
    configured: false,
    message: 'Running in offline IndexedDB Vault mode.'
  };
};


/**
 * Performs a request against the Noted server.
 *
 * The desktop app runs from a file:// origin, so the browser sends an Origin
 * of "null", which the server refuses. The request is therefore made by the
 * main process, where no CORS applies. The web build uses a plain fetch.
 */
export const notedServerRequest = async (path, { method = 'GET', body = null, session = '' } = {}) => {
  const baseUrl = getApiBaseUrl();

  if (typeof window !== 'undefined' && window.electronAPI?.apiRequest) {
    const result = await window.electronAPI.apiRequest({
      path,
      method,
      body,
      session: session || undefined,
      appUrl: baseUrl || undefined
    });
    if (!result?.ok) {
      const error = new Error(result?.error || `The Noted server answered ${result?.status || 'no status'}`);
      error.status = result?.status;
      throw error;
    }
    return result.data;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: `Bearer ${session}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  // Guard: mock fetch objects in tests may not have headers
  const contentType = res.headers?.get?.('content-type') || '';
  const isJson = contentType.includes('application/json') || !res.headers;
  if (res.ok && isJson) {
    return res.json();
  }
  if (res.status === 401) {
    console.warn('[cloudSync] Session rejected by server - sign in again to restore cloud sync.');
  }
  return null;
};

/**
 * Multi-Channel Remote Workspace Puller:
 * Channel 1: Electron Native IPC Bridge (electronAPI.syncPull)
 * Channel 2: Web / Native Serverless API (/api/sync) with session token
 */
export const fetchRemoteWorkspace = async (user) => {
  if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') {
    return null;
  }

  const session = getSessionToken();
  if (!session) {
    return null;
  }

  // 1. Electron Native IPC Bridge, when this device has a direct database
  //    connection. Without one the request continues with the Noted server.
  if (typeof window !== 'undefined' && window.electronAPI?.syncPull) {
    try {
      const data = await window.electronAPI.syncPull({ userId: user.id, email: user.email, session });
      if (data && data.success) return data;
    } catch (err) {
      console.warn('[cloudSync] Electron IPC syncPull failed:', err.message);
    }
  }

  // 2. The Noted server, which is the channel the web build and the desktop
  //    build share. The desktop request is made by the main process.
  try {
    const data = await notedServerRequest('/api/sync', { method: 'GET', session });
    if (data && data.success) return data;
  } catch (err) {
    // Network failures are surfaced to the caller so the sync indicator can
    // report an offline state instead of silently degrading.
    throw err;
  }

  return null;
};

/**
 * Multi-Channel Remote Workspace Pusher
 * Channel 1: Electron Native IPC Bridge (electronAPI.syncPush)
 * Channel 2: Web / Native Serverless API (/api/sync) with session token
 */
export const pushRemoteWorkspace = async (payload) => {
  const { userId } = payload;
  if (!userId || userId === 'guest') return { success: true, mode: 'guest_standby' };

  const session = getSessionToken();
  if (!session) {
    return {
      success: false,
      mode: 'offline_vault',
      error: 'Sign in with Google to enable cloud sync.'
    };
  }

  // 1. Electron Native IPC Bridge, when this device has a direct database
  //    connection. Without one the request continues with the Noted server.
  if (typeof window !== 'undefined' && window.electronAPI?.syncPush) {
    try {
      const data = await window.electronAPI.syncPush({ ...payload, session });
      if (data && data.success) return data;
    } catch (err) {
      console.warn('[cloudSync] Electron IPC syncPush failed:', err.message);
    }
  }

  // 2. The Noted server, which is the channel the web build and the desktop
  //    build share. The desktop request is made by the main process.
  try {
    const data = await notedServerRequest('/api/sync', {
      method: 'POST',
      body: payload,
      session
    });
    if (data && data.success) {
      return { ...data, mode: 'server' };
    }
    return {
      success: false,
      mode: 'offline_vault',
      error: data?.error || 'The server did not accept the sync.'
    };
  } catch (err) {
    console.warn('[cloudSync] /api/sync POST failed:', err.message);
    if (err.status === 401) {
      return { success: false, mode: 'offline_vault', error: 'Session expired. Sign in again to sync.' };
    }
    return { success: false, mode: 'offline_vault', error: err.message };
  }

  return { success: false, mode: 'offline_vault', error: 'Saved in Local Vault' };
};

/**
 * Pulls latest workspace pages and trash from PostgreSQL
 */
export const pullCloudWorkspace = async (user) => {
  if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') {
    return null;
  }

  try {
    notifyStatus({ status: 'syncing' });
    const data = await fetchRemoteWorkspace(user);

    if (data && data.success) {
      // A successful response is accepted whatever the server calls its
      // mode, so a new server mode does not silently drop the workspace.
      const mode = data.mode || 'cloud_postgres';
      notifyStatus({
        status: 'synced',
        lastSyncedAt: data.serverTimestamp || Date.now(),
        mode,
        error: null
      });
      return {
        resolvedUserId: data.resolvedUserId || user.id,
        pages: data.pages || [],
        trash: data.trash || [],
        comments: data.comments || [],
        deletedCommentIds: data.deletedCommentIds || [],
        workspaceSettings: data.workspaceSettings || null
      };
    } else {
      notifyStatus({
        status: 'local',
        mode: 'local_vault_only',
        error: null
      });
      return null;
    }
  } catch (err) {
    console.warn('[cloudSync] Pull failed, relying on local IndexedDB Vault:', err);
    notifyStatus({
      status: 'offline',
      error: 'Saved in Local Vault'
    });
    return null;
  }
};

/**
 * Pushes workspace changes to PostgreSQL with debouncing (Notion REA saveTransactions)
 */
export const triggerCloudSync = (
  user,
  pages,
  trash = [],
  workspaceSettings = null,
  comments = [],
  deletedCommentIds = [],
  immediate = false
) => {
  if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') {
    notifyStatus({ status: 'local', mode: 'local_vault_only' });
    return;
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  const performPush = async () => {
    try {
      notifyStatus({ status: 'syncing' });

      const payload = {
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          avatar: user.avatar,
          color: user.color
        },
        pages,
        trash,
        comments,
        deletedCommentIds,
        workspaceSettings,
        clientTimestamp: Date.now()
      };

      const data = await pushRemoteWorkspace(payload);

      if (data && data.success) {
        notifyStatus({
          status: (data.mode === 'cloud_postgres' || data.mode === 'local_drizzle_sqlite') ? 'synced' : 'local',
          lastSyncedAt: data.serverTimestamp || Date.now(),
          mode: data.mode,
          error: null
        });
      } else {
        notifyStatus({
          status: 'offline',
          error: data?.message || 'Offline - Saved to Vault'
        });
      }
    } catch (err) {
      console.warn('[cloudSync] Push failed, data preserved in IndexedDB Vault:', err);
      notifyStatus({
        status: 'offline',
        error: 'Offline - Saved in Local Vault'
      });
    }
  };

  if (immediate) {
    performPush();
  } else {
    // 1200ms debounce like Notion Desktop transaction queue
    syncTimeout = setTimeout(performPush, 1200);
  }
};
