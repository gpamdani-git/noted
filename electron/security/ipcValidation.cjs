/**
 * IPC Security Validation Utilities
 * Based on Notion's IPC sender validation patterns from REA analysis
 */

const { URL } = require('url');

/**
 * Validate IPC sender - ensure request comes from trusted renderer
 * @param {Electron.IpcMainInvokeEvent|Electron.IpcMainEvent} event
 * @returns {boolean}
 */
function validateSender(event) {
  try {
    const webContents = event.sender;
    if (!webContents) {
      return false;
    }
    
    // Check if sender frame exists
    const frame = event.senderFrame;
    if (!frame) {
      // For some contexts, allow if sender is from our app
      const url = webContents.getURL();
      if (!url) return false;
      return isTrustedUrl(url);
    }
    
    const url = frame.url || webContents.getURL();
    if (!url) return false;
    
    return isTrustedUrl(url);
  } catch (error) {
    console.error('[IPC Security] Sender validation error:', error);
    return false;
  }
}

/**
 * Check if URL is trusted (file:// or app:// protocols)
 * @param {string} url
 * @returns {boolean}
 */
function validateIpcSenderUrl(url) {
  return isTrustedUrl(url);
}

/**
 * Check if URL is trusted
 * @param {string} url
 * @returns {boolean}
 */
function isTrustedUrl(url) {
  try {
    if (!url) return false;
    
    // Allow file:// protocol for local files
    if (url.startsWith('file://')) {
      return true;
    }
    
    // Allow app:// protocol if used
    if (url.startsWith('app://')) {
      return true;
    }
    
    // Allow chrome-extension:// for dev tools in development
    if (process.env.NODE_ENV === 'development' && url.startsWith('chrome-extension://')) {
      return true;
    }
    
    // Allow dev server in development or when not packaged
    let isPackaged = false;
    try {
      const { app } = require('electron');
      isPackaged = app ? app.isPackaged : false;
    } catch {}

    const isDev = process.env.NODE_ENV === 'development' || !isPackaged || Boolean(process.env.ELECTRON_RENDERER_URL);
    if (isDev) {
      if (url.includes('localhost') || url.includes('127.0.0.1')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Whitelist of allowed IPC channels
 */
const ALLOWED_IPC_CHANNELS = new Set([
  // Window controls
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:isMaximized',
  'window:is-fullscreen',
  'window:restore',
  
  // App info
  'app:is-protocol-registered',
  'app:get-info',
  'app:register-protocol',
  
  // Shell
  'shell:open-external',
  
  // Dialogs
  'dialog:show-save-dialog',
  'dialog:show-open-dialog',
  
  // File system
  'fs:write-file',
  'fs:read-file',
  'fs:write-text',
  'fs:read-text',
  
  // Cloud sync
  'cloud:get-config',
  'cloud:set-config',
  'cloud:check-status',
  'cloud:api-request',
  'cloud:check-server',
  'cloud:sync-pull',
  'cloud:sync-push',
  
  // AI
  'ai:fetch',
  'ai:fetch-stream',
  
  // Updater
  'updater:check',
  'updater:install',
  
  // Deep links
  'deeplink:open'
]);

/**
 * Validate IPC channel
 * @param {string} channel
 * @returns {boolean}
 */
function validateIpcChannel(channel) {
  if (!channel || typeof channel !== 'string') {
    return false;
  }
  return ALLOWED_IPC_CHANNELS.has(channel);
}

/**
 * Create a secure IPC handler wrapper
 * @param {Function} handler
 * @param {string} channel
 * @returns {Function}
 */
function createSecureHandler(handler, channel) {
  return async (event, ...args) => {
    // Validate channel
    if (!validateIpcChannel(channel)) {
      console.error(`[IPC Security] Blocked unknown channel: ${channel}`);
      throw new Error(`Unknown IPC channel: ${channel}`);
    }
    
    // Validate sender
    if (!validateSender(event)) {
      console.error(`[IPC Security] Blocked unauthorized sender for channel: ${channel}`);
      throw new Error('Unauthorized IPC call');
    }
    
    try {
      return await handler(event, ...args);
    } catch (error) {
      console.error(`[IPC Security] Error in handler ${channel}:`, error);
      throw error;
    }
  };
}

/**
 * Log IPC call for audit (development only)
 * @param {string} channel
 * @param {Electron.IpcMainInvokeEvent} event
 */
function auditIpcCall(channel, event) {
  if (process.env.NODE_ENV === 'development') {
    const url = event.senderFrame?.url || event.sender?.getURL();
    console.log(`[IPC Audit] ${channel} from ${url}`);
  }
}

module.exports = {
  validateSender,
  validateIpcSenderUrl,
  validateIpcChannel,
  isTrustedUrl,
  createSecureHandler,
  auditIpcCall,
  ALLOWED_IPC_CHANNELS
};
