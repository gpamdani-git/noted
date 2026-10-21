// Noted Electron Preload Script (Secure Context Bridge)
// Conforms to Notion Desktop REA IPC Interface

const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  isElectron: true,
  platform: process.platform,

  // Window Controls (macOS & Windows)
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isFullScreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  onFullScreenChange: (callback) => {
    const handler = (_, isFs) => callback(isFs);
    ipcRenderer.on('window:fullscreen-change', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-change', handler);
  },

  // App Metadata
  getInfo: () => ipcRenderer.invoke('app:get-info'),
  isProtocolRegistered: () => ipcRenderer.invoke('app:is-protocol-registered'),

  // External Browser Link Opener
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // File System & Dialogs for Native Export / Import
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:show-open-dialog', options),
  writeFile: (filePath, content, encoding) =>
    ipcRenderer.invoke('fs:write-file', { filePath, content, encoding }),
  readFile: (filePath, encoding) =>
    ipcRenderer.invoke('fs:read-file', { filePath, encoding }),

  // Cloud PostgreSQL & Sync Engine Bridge (Notion Dual-DB Architecture)
  checkCloudStatus: () => ipcRenderer.invoke('cloud:check-status'),
  syncPull: (payload) => ipcRenderer.invoke('cloud:sync-pull', payload),
  syncPush: (payload) => ipcRenderer.invoke('cloud:sync-push', payload),
  getCloudConfig: () => ipcRenderer.invoke('cloud:get-config'),
  checkServerStatus: (appUrl) => ipcRenderer.invoke('cloud:check-server', { appUrl }),
  apiRequest: (options) => ipcRenderer.invoke('cloud:api-request', options),
  setCloudConfig: (config) => ipcRenderer.invoke('cloud:set-config', config),

  // Native AI & LLM Bridge (bypasses browser CORS for Ollama & LM Studio)
  aiFetch: (url, options) => ipcRenderer.invoke('ai:fetch', { url, options }),

  // Streaming variant used by model generation. The main process validates the
  // host against the AI allowlist before the request is performed, so the
  // privileged bridge cannot be used as an open proxy.
  aiFetchStream: (id, url, options) => ipcRenderer.invoke('ai:fetch-stream', { id, url, options }),
  onAiStreamChunk: (id, callback) => {
    const handler = (_, payload) => {
      if (payload?.id === id) callback(payload.chunk);
    };
    ipcRenderer.on('ai:stream-chunk', handler);
    return () => ipcRenderer.removeListener('ai:stream-chunk', handler);
  },
  onAiStreamEnd: (id, callback) => {
    const handler = (_, payload) => {
      if (payload?.id === id) callback();
    };
    ipcRenderer.on('ai:stream-end', handler);
    return () => ipcRenderer.removeListener('ai:stream-end', handler);
  },
  onAiStreamError: (id, callback) => {
    const handler = (_, payload) => {
      if (payload?.id === id) callback(payload.error || 'AI request failed');
    };
    ipcRenderer.on('ai:stream-error', handler);
    return () => ipcRenderer.removeListener('ai:stream-error', handler);
  },

  // Deep Link Listener (noted://auth?token=... or noted://open?pageId=...)
  onDeepLink: (callback) => {
    const handler = (_, url) => callback(url);
    ipcRenderer.on('deep-link', handler);
    return () => ipcRenderer.removeListener('deep-link', handler);
  },

  // Native Application Menu Action Listener (macOS & Windows top menus)
  onMenuAction: (callback) => {
    const handler = (_, action) => callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => ipcRenderer.removeListener('menu:action', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('notedDesktop', electronAPI);

// Immediately tag documentElement on DOMContentLoaded to guarantee zero-latency Apple Liquid styling
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.classList.add('is-electron');
  if (process.platform === 'darwin') {
    document.documentElement.classList.add('is-mac-desktop');
  } else if (process.platform === 'win32') {
    document.documentElement.classList.add('is-windows-desktop');
  }
});
