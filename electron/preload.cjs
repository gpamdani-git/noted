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

  // App Metadata
  getInfo: () => ipcRenderer.invoke('app:get-info'),

  // External Browser Link Opener
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // File System & Dialogs for Native Export / Import
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog:show-open-dialog', options),
  writeFile: (filePath, content, encoding) =>
    ipcRenderer.invoke('fs:write-file', { filePath, content, encoding }),
  readFile: (filePath, encoding) =>
    ipcRenderer.invoke('fs:read-file', { filePath, encoding }),

  // Deep Link Listener (noted://auth?token=... or noted://open?pageId=...)
  onDeepLink: (callback) => {
    const handler = (_, url) => callback(url);
    ipcRenderer.on('deep-link', handler);
    return () => ipcRenderer.removeListener('deep-link', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('notedDesktop', electronAPI);
