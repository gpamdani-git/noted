// Noted Electron Main Process (Reverse-Engineered from Notion Desktop Architecture)
// Features:
// - macOS hiddenInset titlebar with native traffic lights alignment
// - Windows titleBarOverlay with native frame controls
// - Deep linking protocol (noted://) for seamless OAuth & cross-app integration
// - Secure Context Isolation with IPC bridge (no nodeIntegration in renderer)
// - Window state persistence (size, position, maximized state)
// - Safe external link delegation to default OS browser

const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
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
    show: false, // Wait until ready-to-show for smooth appearance

    // Frame styling matching Notion Desktop
    titleBarStyle: isMac ? 'hiddenInset' : (isWindows ? 'hidden' : 'default'),
    trafficLightPosition: isMac ? { x: 18, y: 16 } : undefined,
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
    mainWindow.loadFile(indexPath);
  }

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
