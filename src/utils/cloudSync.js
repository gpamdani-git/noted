// Notion Cloud & PostgreSQL Synchronization Engine for Noted
// Implements Notion Desktop 7.39.0 saveTransactions & offline-first dual sync protocol
// Features:
// - Multi-tab instant live sync (BroadcastChannel with 0ms local latency)
// - Cross-device live background sync pulse (10s heartbeat + window focus / visibility triggers)
// - Debounced transaction queue (1200ms) with optimistic offline-first fallback

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
      const emailParam = user.email ? `&email=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`/api/sync?userId=${encodeURIComponent(user.id)}${emailParam}`, {
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.pages) {
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
 * Checks connection health with the PostgreSQL serverless backend
 */
export const checkCloudDatabaseStatus = async () => {
  if (typeof window === 'undefined') return { connected: false, configured: false };
  try {
    const res = await fetch('/api/status', {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      connected: false,
      configured: false,
      error: err.message,
      message: 'Running in offline IndexedDB Vault mode.'
    };
  }
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
    const emailParam = user.email ? `&email=${encodeURIComponent(user.email)}` : '';
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(user.id)}${emailParam}`, {
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success && (data.mode === 'cloud_postgres' || data.mode === 'local_drizzle_sqlite')) {
      notifyStatus({
        status: 'synced',
        lastSyncedAt: data.serverTimestamp || Date.now(),
        mode: data.mode,
        error: null
      });
      return {
        resolvedUserId: data.resolvedUserId || user.id,
        pages: data.pages || [],
        trash: data.trash || [],
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
export const triggerCloudSync = (user, pages, trash = [], workspaceSettings = null, immediate = false) => {
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
        workspaceSettings,
        clientTimestamp: Date.now()
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        notifyStatus({
          status: (data.mode === 'cloud_postgres' || data.mode === 'local_drizzle_sqlite') ? 'synced' : 'local',
          lastSyncedAt: data.serverTimestamp || Date.now(),
          mode: data.mode,
          error: null
        });
      } else {
        notifyStatus({
          status: 'offline',
          error: data.message || 'Offline - Saved to Vault'
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
