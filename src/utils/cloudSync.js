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
 * Checks connection health with the PostgreSQL serverless backend
 */
export const checkCloudDatabaseStatus = async () => {
  if (typeof window === 'undefined') return { connected: false, configured: false };

  // 1. In Electron desktop app, use native IPC bridge to check Cloud PostgreSQL directly
  if (window.electronAPI?.checkCloudStatus) {
    try {
      const res = await window.electronAPI.checkCloudStatus();
      if (res && res.connected !== undefined) return res;
    } catch (err) {
      console.warn('[Desktop IPC] checkCloudStatus warning:', err);
    }
  }

  // 2. In Web (Vite dev or Vercel production), call /api/status if HTTP/HTTPS
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    try {
      const res = await fetch('/api/status', {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('[Web Fetch] /api/status warning:', err);
    }
  }

  // 3. Direct Neon Lakebase HTTP SQL check
  try {
    const connStr = 'postgresql://neondb_owner:REDACTED@redacted.invalid/neondb?sslmode=require';
    const startTime = Date.now();
    const res = await fetch('https://ep-polished-forest-azx5265k-pooler.c-3.ap-southeast-1.aws.neon.tech/sql', {
      method: 'POST',
      headers: {
        'Neon-Connection-String': connStr,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT current_database(), (SELECT COUNT(*) FROM pages WHERE is_deleted = FALSE) AS pages_count, (SELECT COUNT(*) FROM users) AS users_count'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const row = data.rows && data.rows[0];
      return {
        connected: true,
        configured: true,
        engine: 'PostgreSQL + Neon Lakebase',
        latencyMs: Date.now() - startTime,
        database: row?.current_database || 'neondb',
        stats: {
          pages: parseInt(row?.pages_count || '7', 10),
          users: parseInt(row?.users_count || '3', 10)
        },
        message: 'Connected to remote PostgreSQL database (Neon Lakebase)!'
      };
    }
  } catch {}

  return {
    connected: false,
    configured: false,
    message: 'Running in offline IndexedDB Vault mode.'
  };
};

const NEON_DEFAULT_CONN = 'postgresql://neondb_owner:REDACTED@redacted.invalid/neondb?sslmode=require';
const NEON_DEFAULT_HOST = 'ep-polished-forest-azx5265k-pooler.c-3.ap-southeast-1.aws.neon.tech';

/**
 * Direct Neon Lakebase HTTP SQL runner (resilient fallback if /api/sync or IPC fails)
 */
const runDirectNeonSql = async (query, params = []) => {
  const sqlUrl = `https://${NEON_DEFAULT_HOST}/sql`;
  const res = await fetch(sqlUrl, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': NEON_DEFAULT_CONN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, params })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Direct Neon SQL HTTP ${res.status}: ${errText}`);
  }
  return res.json();
};

/**
 * Direct Neon Lakebase pull logic
 */
const directNeonPull = async (user) => {
  const pagesRes = await runDirectNeonSql(
    `SELECT id, user_id AS "userId", title, icon, cover, parent_id AS "parentId",
            is_favorite AS "isFavorite", is_locked AS "isLocked",
            full_width AS "fullWidth", font_family AS "fontFamily",
            blocks, version, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM pages
     WHERE user_id = $1 AND is_deleted = FALSE
     ORDER BY updated_at DESC`,
    [user.id]
  );

  const trashRes = await runDirectNeonSql(
    `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
     FROM trash
     WHERE user_id = $1
     ORDER BY deleted_at DESC`,
    [user.id]
  );

  const settingsRes = await runDirectNeonSql(
    `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
     FROM workspace_settings
     WHERE user_id = $1`,
    [user.id]
  );

  let effectiveUserId = user.id;
  let finalPages = pagesRes.rows || [];
  let finalTrash = trashRes.rows || [];
  let finalSettings = settingsRes.rows && settingsRes.rows[0] ? settingsRes.rows[0] : null;

  if (finalPages.length === 0 && user.email) {
    try {
      const decodedEmail = decodeURIComponent(user.email).trim().toLowerCase();
      const altUserRes = await runDirectNeonSql(
        'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2 LIMIT 1',
        [decodedEmail, user.id]
      );
      if (altUserRes.rows && altUserRes.rows.length > 0) {
        effectiveUserId = altUserRes.rows[0].id;
        const altPagesRes = await runDirectNeonSql(
          `SELECT id, user_id AS "userId", title, icon, cover, parent_id AS "parentId",
                  is_favorite AS "isFavorite", is_locked AS "isLocked",
                  full_width AS "fullWidth", font_family AS "fontFamily",
                  blocks, version, created_at AS "createdAt", updated_at AS "updatedAt"
           FROM pages
           WHERE user_id = $1 AND is_deleted = FALSE
           ORDER BY updated_at DESC`,
          [effectiveUserId]
        );
        if (altPagesRes.rows && altPagesRes.rows.length > 0) {
          finalPages = altPagesRes.rows;
          const altTrashRes = await runDirectNeonSql(
            `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
             FROM trash
             WHERE user_id = $1
             ORDER BY deleted_at DESC`,
            [effectiveUserId]
          );
          finalTrash = altTrashRes.rows || [];

          const altSettingsRes = await runDirectNeonSql(
            `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
             FROM workspace_settings
             WHERE user_id = $1`,
            [effectiveUserId]
          );
          finalSettings = altSettingsRes.rows && altSettingsRes.rows[0] ? altSettingsRes.rows[0] : null;
        }
      }
    } catch {}
  }

  const parsedPages = finalPages.map((p) => ({
    ...p,
    isFavorite: Boolean(p.isFavorite),
    isLocked: Boolean(p.isLocked),
    fullWidth: Boolean(p.fullWidth),
    createdAt: Number(p.createdAt) || Date.now(),
    updatedAt: Number(p.updatedAt) || Date.now(),
    blocks: typeof p.blocks === 'string' ? JSON.parse(p.blocks) : (p.blocks || [])
  }));

  const parsedTrash = finalTrash.map((t) => ({
    ...t,
    deletedAt: Number(t.deletedAt) || Date.now(),
    blocks: typeof t.blocks === 'string' ? JSON.parse(t.blocks) : (t.blocks || [])
  }));

  const parsedSettings = finalSettings ? {
    ...finalSettings,
    openTabs: typeof finalSettings.openTabs === 'string' ? JSON.parse(finalSettings.openTabs) : (finalSettings.openTabs || [])
  } : null;

  return {
    success: true,
    mode: 'cloud_postgres',
    serverTimestamp: Date.now(),
    resolvedUserId: effectiveUserId,
    pages: parsedPages,
    trash: parsedTrash,
    workspaceSettings: parsedSettings
  };
};

/**
 * Multi-Channel Remote Workspace Puller:
 * Channel 1: Electron Native IPC Bridge (electronAPI.syncPull)
 * Channel 2: Web Serverless API (/api/sync)
 * Channel 3: Direct Neon Lakebase HTTP SQL API
 */
export const fetchRemoteWorkspace = async (user) => {
  if (!user || !user.isLoggedIn || !user.id || user.id === 'guest') {
    return null;
  }

  // 1. Electron Native IPC Bridge
  if (typeof window !== 'undefined' && window.electronAPI?.syncPull) {
    try {
      const data = await window.electronAPI.syncPull({ userId: user.id, email: user.email });
      if (data && data.success) return data;
      if (data && data.mode === 'offline_vault') {
        throw new Error(data.error || 'Offline - Saved in Local Vault');
      }
    } catch (err) {
      console.warn('[cloudSync] Electron IPC syncPull failed:', err.message);
      throw err;
    }
  }

  // 2. Web /api/sync on HTTP/HTTPS
  if (typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    const emailParam = user.email ? `&email=${encodeURIComponent(user.email)}` : '';
    const res = await fetch(`/api/sync?userId=${encodeURIComponent(user.id)}${emailParam}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return data;
    } else if (res.status === 404) {
      return await directNeonPull(user);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
    return null;
  }

  // 3. Direct Neon Lakebase fallback for file:// standalone mode
  return await directNeonPull(user);
};

/**
 * Direct Neon Lakebase push logic
 */
const directNeonPush = async (payload) => {
  const { userId, user, pages = [], trash = [], workspaceSettings = null } = payload;
  try {
    const now = Date.now();
    if (user && user.id) {
      await runDirectNeonSql(
        `INSERT INTO users (id, email, name, picture, avatar, color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           picture = EXCLUDED.picture,
           avatar = EXCLUDED.avatar,
           color = EXCLUDED.color,
           updated_at = EXCLUDED.updated_at`,
        [user.id, user.email || null, user.name || 'User', user.picture || null, user.avatar || 'U', user.color || '#2383e2', now, now]
      );
    }

    const activePageIds = [];
    for (const page of pages) {
      if (!page || !page.id) continue;
      activePageIds.push(page.id);
      await runDirectNeonSql(
        `INSERT INTO pages (
           id, user_id, title, icon, cover, parent_id,
           is_favorite, is_locked, full_width, font_family,
           blocks, version, created_at, updated_at, is_deleted
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, FALSE)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           icon = EXCLUDED.icon,
           cover = EXCLUDED.cover,
           parent_id = EXCLUDED.parent_id,
           is_favorite = EXCLUDED.is_favorite,
           is_locked = EXCLUDED.is_locked,
           full_width = EXCLUDED.full_width,
           font_family = EXCLUDED.font_family,
           blocks = EXCLUDED.blocks,
           version = pages.version + 1,
           updated_at = EXCLUDED.updated_at,
           is_deleted = FALSE`,
        [
          page.id,
          userId,
          page.title || 'Untitled',
          page.icon || null,
          page.cover || null,
          page.parentId || null,
          Boolean(page.isFavorite),
          Boolean(page.isLocked),
          Boolean(page.fullWidth),
          page.fontFamily || 'sans',
          JSON.stringify(page.blocks || []),
          page.version || 1,
          page.createdAt || now,
          page.updatedAt || now
        ]
      );
    }

    if (activePageIds.length > 0) {
      const placeholders = activePageIds.map((_, i) => `$${i + 3}`).join(',');
      await runDirectNeonSql(
        `UPDATE pages SET is_deleted = TRUE, updated_at = $1
         WHERE user_id = $2 AND id NOT IN (${placeholders})`,
        [now, userId, ...activePageIds]
      );
    }

    for (const t of trash) {
      if (!t || !t.id) continue;
      await runDirectNeonSql(
        `INSERT INTO trash (id, user_id, title, icon, blocks, deleted_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           icon = EXCLUDED.icon,
           blocks = EXCLUDED.blocks,
           deleted_at = EXCLUDED.deleted_at`,
        [t.id, userId, t.title || 'Deleted Page', t.icon || null, JSON.stringify(t.blocks || []), t.deletedAt || now]
      );
    }

    if (workspaceSettings) {
      await runDirectNeonSql(
        `INSERT INTO workspace_settings (user_id, open_tabs, active_page_id, theme, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           open_tabs = EXCLUDED.open_tabs,
           active_page_id = EXCLUDED.active_page_id,
           theme = EXCLUDED.theme,
           updated_at = EXCLUDED.updated_at`,
        [userId, JSON.stringify(workspaceSettings.openTabs || []), workspaceSettings.activePageId || null, workspaceSettings.theme || 'light', now]
      );
    }

    return {
      success: true,
      mode: 'cloud_postgres',
      serverTimestamp: now,
      syncedPagesCount: pages.length,
      syncedTrashCount: trash.length
    };
  } catch (err) {
    console.warn('[cloudSync] Direct Neon push failed:', err);
    return null;
  }
};

/**
 * Multi-Channel Remote Workspace Pusher
 */
export const pushRemoteWorkspace = async (payload) => {
  const { userId } = payload;
  if (!userId || userId === 'guest') return { success: true, mode: 'guest_standby' };

  // 1. Electron Native IPC Bridge
  if (typeof window !== 'undefined' && window.electronAPI?.syncPush) {
    try {
      const data = await window.electronAPI.syncPush(payload);
      if (data && data.success) return data;
      if (data && data.mode === 'offline_vault') {
        throw new Error(data.error || 'Offline - Saved in Local Vault');
      }
    } catch (err) {
      console.warn('[cloudSync] Electron IPC syncPush failed:', err.message);
      throw err;
    }
  }

  // 2. Web /api/sync on HTTP/HTTPS
  if (typeof window !== 'undefined' && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return data;
    } else if (res.status === 404) {
      return await directNeonPush(payload);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
    return null;
  }

  // 3. Direct Neon Lakebase fallback for file:// standalone mode
  return await directNeonPush(payload);
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

    if (data && data.success && (data.mode === 'cloud_postgres' || data.mode === 'local_drizzle_sqlite')) {
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
