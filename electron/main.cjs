// Noted Electron Main Process (Reverse-Engineered from Notion Desktop Architecture)
// Features:
// - macOS hiddenInset titlebar with native traffic lights alignment
// - Windows titleBarOverlay with native frame controls
// - Deep linking protocol (noted://) for seamless OAuth & cross-app integration
// - Secure Context Isolation with IPC bridge (no nodeIntegration in renderer)
// - Window state persistence (size, position, maximized state)
// - Safe external link delegation to default OS browser

const { app, BrowserWindow, ipcMain, shell, dialog, Menu, session } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Ensure single instance lock (Notion REA behavior)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Register custom protocol for deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('noted', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('noted');
}

let mainWindow = null;
let pendingDeepLinkUrl = null;

// Window state store path
const getWindowStateFilePath = () => {
  return path.join(app.getPath('userData'), 'noted-window-state.json');
};

const loadWindowState = () => {
  try {
    const raw = fs.readFileSync(getWindowStateFilePath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { width: 1200, height: 800, isMaximized: false };
  }
};

const saveWindowState = () => {
  if (!mainWindow) return;
  try {
    const isMaximized = mainWindow.isMaximized();
    const bounds = isMaximized ? {} : mainWindow.getBounds();
    const state = {
      ...bounds,
      isMaximized
    };
    fs.writeFileSync(getWindowStateFilePath(), JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save window state:', err);
  }
};

function createMainWindow() {
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';
  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: savedState.width || 1200,
    height: savedState.height || 800,
    x: savedState.x,
    y: savedState.y,
    minWidth: 840,
    minHeight: 560,
    title: 'Noted',
    backgroundColor: '#ffffff',
    transparent: false,
    show: false, // Wait until ready-to-show for smooth appearance

    // Frame styling matching Apple Liquid / Notion Desktop
    titleBarStyle: isMac ? 'hiddenInset' : (isWindows ? 'hidden' : 'default'),
    trafficLightPosition: isMac ? { x: 18, y: 15 } : undefined,
    titleBarOverlay: isWindows
      ? {
          color: '#ffffff',
          symbolColor: '#37352f',
          height: 38
        }
      : false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true
    }
  });

  if (savedState.isMaximized) {
    mainWindow.maximize();
  }

  // Gracefully show window when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (pendingDeepLinkUrl) {
      mainWindow.webContents.send('deep-link', pendingDeepLinkUrl);
      pendingDeepLinkUrl = null;
    }
  });

  // Save state on close and resize
  mainWindow.on('close', saveWindowState);
  mainWindow.on('resize', () => {
    // Debounce save state
    clearTimeout(mainWindow._saveTimer);
    mainWindow._saveTimer = setTimeout(saveWindowState, 500);
  });

  // Emit fullscreen state changes to renderer
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-change', true);
  });
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window:fullscreen-change', false);
  });

  // Intercept external links - open in user's default browser, not in Noted
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Load either local dev server or built production bundle
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev && !process.env.TEST_DIST) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      // If dev server not yet listening, retry shortly
      setTimeout(() => mainWindow.loadURL(devServerUrl), 1000);
    });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('[Electron] Failed to load index.html:', err);
    });
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Failed to load ${validatedURL}: (${errorCode}) ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Renderer
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window:is-fullscreen', () => {
  return mainWindow ? mainWindow.isFullScreen() : false;
});

ipcMain.handle('app:get-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    arch: process.arch,
    isPackaged: app.isPackaged
  };
});

ipcMain.handle('shell:open-external', async (_, targetUrl) => {
  if (typeof targetUrl === 'string' && (targetUrl.startsWith('http:') || targetUrl.startsWith('https:'))) {
    await shell.openExternal(targetUrl);
    return true;
  }
  return false;
});

ipcMain.handle('dialog:show-save-dialog', async (_, options) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('dialog:show-open-dialog', async (_, options) => {
  if (!mainWindow) return { canceled: true };
  return dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('fs:write-file', async (_, { filePath, content, encoding = 'utf-8' }) => {
  try {
    fs.writeFileSync(filePath, content, encoding);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:read-file', async (_, { filePath, encoding = 'utf-8' }) => {
  try {
    const content = fs.readFileSync(filePath, encoding);
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Cloud PostgreSQL Connectivity Check (Direct Neon HTTP Lakebase Engine)
const loadDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/DATABASE_URL=["']?([^"'\n\r]+)["']?/);
      if (match) return match[1];
    }
  } catch {}
  return 'postgresql://neondb_owner:REDACTED@redacted.invalid/neondb?channel_binding=require&sslmode=require';
};

ipcMain.handle('cloud:check-status', async () => {
  const connStr = loadDatabaseUrl();
  const startTime = Date.now();
  try {
    const hostMatch = connStr.match(/@([^:\/]+)/);
    const host = hostMatch ? hostMatch[1] : 'ep-polished-forest-azx5265k-pooler.c-3.ap-southeast-1.aws.neon.tech';
    const sqlUrl = `https://${host}/sql`;

    const res = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': connStr,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT current_database(), (SELECT COUNT(*) FROM pages WHERE is_deleted = FALSE) AS pages_count, (SELECT COUNT(*) FROM users) AS users_count'
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const row = data.rows && data.rows[0];
    const latency = Date.now() - startTime;

    return {
      connected: true,
      configured: true,
      engine: 'PostgreSQL + Neon Lakebase',
      latencyMs: latency,
      database: row?.current_database || 'neondb',
      stats: {
        pages: parseInt(row?.pages_count || '7', 10),
        users: parseInt(row?.users_count || '3', 10)
      },
      message: 'Connected to remote PostgreSQL database (Neon Lakebase)!'
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      engine: 'PostgreSQL',
      error: err.message,
      message: `Failed to connect to PostgreSQL: ${err.message}`
    };
  }
});

// Helper to execute SQL queries on Neon Lakebase HTTP SQL API
const runNeonSql = async (query, params = []) => {
  const connStr = loadDatabaseUrl();
  const hostMatch = connStr.match(/@([^:\/]+)/);
  const host = hostMatch ? hostMatch[1] : 'ep-polished-forest-azx5265k-pooler.c-3.ap-southeast-1.aws.neon.tech';
  const sqlUrl = `https://${host}/sql`;

  const res = await fetch(sqlUrl, {
    method: 'POST',
    headers: {
      'Neon-Connection-String': connStr,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, params })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Neon SQL error: HTTP ${res.status}: ${errText}`);
  }

  return res.json();
};

// IPC Handler: Pull latest workspace pages, trash, and settings from Neon Lakebase
ipcMain.handle('cloud:sync-pull', async (_, { userId, email } = {}) => {
  if (!userId || userId === 'guest') {
    return {
      success: true,
      mode: 'guest_standby',
      pages: [],
      trash: [],
      workspaceSettings: null
    };
  }

  try {
    const pagesRes = await runNeonSql(
      `SELECT id, user_id AS "userId", title, icon, cover, parent_id AS "parentId",
              is_favorite AS "isFavorite", is_locked AS "isLocked",
              full_width AS "fullWidth", font_family AS "fontFamily",
              blocks, version, created_at AS "createdAt", updated_at AS "updatedAt"
       FROM pages
       WHERE user_id = $1 AND is_deleted = FALSE
       ORDER BY updated_at DESC`,
      [userId]
    );

    const trashRes = await runNeonSql(
      `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
       FROM trash
       WHERE user_id = $1
       ORDER BY deleted_at DESC`,
      [userId]
    );

    const settingsRes = await runNeonSql(
      `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
       FROM workspace_settings
       WHERE user_id = $1`,
      [userId]
    );

    let effectiveUserId = userId;
    let finalPages = pagesRes.rows || [];
    let finalTrash = trashRes.rows || [];
    let finalSettings = settingsRes.rows && settingsRes.rows[0] ? settingsRes.rows[0] : null;

    // Email Anchor Fallback: If 0 pages found for this specific userId, resolve by email
    if (finalPages.length === 0 && email) {
      try {
        const decodedEmail = decodeURIComponent(email).trim().toLowerCase();
        const altUserRes = await runNeonSql(
          'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2 LIMIT 1',
          [decodedEmail, userId]
        );
        if (altUserRes.rows && altUserRes.rows.length > 0) {
          effectiveUserId = altUserRes.rows[0].id;
          const altPagesRes = await runNeonSql(
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
            const altTrashRes = await runNeonSql(
              `SELECT id, user_id AS "userId", title, icon, blocks, deleted_at AS "deletedAt"
               FROM trash
               WHERE user_id = $1
               ORDER BY deleted_at DESC`,
              [effectiveUserId]
            );
            finalTrash = altTrashRes.rows || [];

            const altSettingsRes = await runNeonSql(
              `SELECT open_tabs AS "openTabs", active_page_id AS "activePageId", theme, updated_at AS "updatedAt"
               FROM workspace_settings
               WHERE user_id = $1`,
              [effectiveUserId]
            );
            finalSettings = altSettingsRes.rows && altSettingsRes.rows[0] ? altSettingsRes.rows[0] : null;
          }
        }
      } catch (e) {
        console.warn('[cloud:sync-pull] Email anchor resolution notice:', e.message);
      }
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
  } catch (err) {
    console.warn('[cloud:sync-pull] Neon sync error, falling back to local vault:', err.message);
    return {
      success: false,
      mode: 'offline_vault',
      error: err.message,
      pages: [],
      trash: []
    };
  }
});

// IPC Handler: Push workspace mutations to Neon Lakebase
ipcMain.handle('cloud:sync-push', async (_, payload = {}) => {
  const { userId, user, pages = [], trash = [], workspaceSettings = null } = payload;
  if (!userId || userId === 'guest') {
    return {
      success: true,
      mode: 'guest_standby',
      message: 'Guest workspace stored in local vault only.',
      serverTimestamp: Date.now()
    };
  }

  const now = Date.now();
  try {
    // 1. Upsert user
    if (user && user.id) {
      await runNeonSql(
        `INSERT INTO users (id, email, name, picture, avatar, color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           picture = EXCLUDED.picture,
           avatar = EXCLUDED.avatar,
           color = EXCLUDED.color,
           updated_at = EXCLUDED.updated_at`,
        [
          user.id,
          user.email || null,
          user.name || 'User',
          user.picture || null,
          user.avatar || 'U',
          user.color || '#2383e2',
          now,
          now
        ]
      );
    }

    // 2. Upsert pages
    const activePageIds = [];
    for (const page of pages) {
      if (!page || !page.id) continue;
      activePageIds.push(page.id);
      await runNeonSql(
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

    // 3. Soft-delete removed pages
    if (activePageIds.length > 0) {
      const placeholders = activePageIds.map((_, i) => `$${i + 3}`).join(',');
      await runNeonSql(
        `UPDATE pages SET is_deleted = TRUE, updated_at = $1
         WHERE user_id = $2 AND id NOT IN (${placeholders})`,
        [now, userId, ...activePageIds]
      );
    }

    // 4. Upsert trash
    for (const t of trash) {
      if (!t || !t.id) continue;
      await runNeonSql(
        `INSERT INTO trash (id, user_id, title, icon, blocks, deleted_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           icon = EXCLUDED.icon,
           blocks = EXCLUDED.blocks,
           deleted_at = EXCLUDED.deleted_at`,
        [
          t.id,
          userId,
          t.title || 'Deleted Page',
          t.icon || null,
          JSON.stringify(t.blocks || []),
          t.deletedAt || now
        ]
      );
    }

    // 5. Upsert workspace settings
    if (workspaceSettings) {
      await runNeonSql(
        `INSERT INTO workspace_settings (user_id, open_tabs, active_page_id, theme, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           open_tabs = EXCLUDED.open_tabs,
           active_page_id = EXCLUDED.active_page_id,
           theme = EXCLUDED.theme,
           updated_at = EXCLUDED.updated_at`,
        [
          userId,
          JSON.stringify(workspaceSettings.openTabs || []),
          workspaceSettings.activePageId || null,
          workspaceSettings.theme || 'light',
          now
        ]
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
    console.warn('[cloud:sync-push] Neon push error, saved in local vault:', err.message);
    return {
      success: false,
      mode: 'offline_vault',
      error: err.message
    };
  }
});

// Native AI & Ollama Bridge (bypasses browser CORS restrictions in Desktop App)
ipcMain.handle('ai:fetch', async (_, { url, options = {} }) => {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    if (options.body) {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    const res = await fetch(url, fetchOptions);
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
});

// Deep link handling (macOS open-url)
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('deep-link', url);
  } else {
    pendingDeepLinkUrl = url;
  }
});

// Windows / Linux second-instance
app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const deepLinkUrl = commandLine.find((arg) => arg.startsWith('noted://'));
    if (deepLinkUrl) {
      mainWindow.webContents.send('deep-link', deepLinkUrl);
    }
  }
});

// App Lifecycle
app.whenReady().then(() => {
  // Fix YouTube & Vimeo Error 153 in Electron: provide valid web referrer/origin for embedded iframes
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.vimeo.com/*'] },
      (details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.youtube.com/';
        details.requestHeaders['Origin'] = 'https://www.youtube.com';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );
  }

  createMainWindow();

  // Load custom menu
  try {
    const { setupMenu } = require('./menu.cjs');
    setupMenu(mainWindow);
  } catch (err) {
    console.warn('Custom menu setup skipped:', err.message);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
