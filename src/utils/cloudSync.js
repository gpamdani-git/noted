// Notion Cloud & PostgreSQL Synchronization Engine for Noted
// Implements Notion Desktop 7.39.0 saveTransactions & offline-first dual sync protocol

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
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(user.id)}`, {
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success && data.mode === 'cloud_postgres') {
      notifyStatus({
        status: 'synced',
        lastSyncedAt: data.serverTimestamp || Date.now(),
        mode: 'cloud_postgres',
        error: null
      });
      return {
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
          status: data.mode === 'cloud_postgres' ? 'synced' : 'local',
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
