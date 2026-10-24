import { describe, it, expect, vi } from 'vitest';
import {
  validateSender,
  validateIpcSenderUrl,
  validateIpcChannel,
  isTrustedUrl,
  createSecureHandler,
  ALLOWED_IPC_CHANNELS
} from '../../electron/security/ipcValidation.cjs';

describe('Electron IPC Security Hardening (PRD-01)', () => {
  describe('Origin / URL Trust Verification (isTrustedUrl)', () => {
    it('accepts file:// URLs from packaged or local application', () => {
      expect(isTrustedUrl('file:///Applications/Noted.app/Contents/Resources/app.asar/dist/index.html')).toBe(true);
      expect(isTrustedUrl('file:///Users/user/Projects/noted/dist/index.html')).toBe(true);
    });

    it('accepts app:// protocol URLs', () => {
      expect(isTrustedUrl('app://noted/index.html')).toBe(true);
    });

    it('accepts localhost and 127.0.0.1 in non-packaged development mode', () => {
      expect(isTrustedUrl('http://localhost:5173')).toBe(true);
      expect(isTrustedUrl('http://127.0.0.1:5173/editor')).toBe(true);
    });

    it('rejects untrusted external domains and arbitrary origins', () => {
      expect(isTrustedUrl('https://malicious.com')).toBe(false);
      expect(isTrustedUrl('http://attacker.org/phish')).toBe(false);
      expect(isTrustedUrl('https://notion.so')).toBe(false);
      expect(isTrustedUrl('')).toBe(false);
      expect(isTrustedUrl(null)).toBe(false);
    });
  });

  describe('IPC Sender Validation (validateSender)', () => {
    it('approves events with a trusted senderFrame URL', () => {
      const event = {
        sender: { getURL: () => 'file:///app/dist/index.html' },
        senderFrame: { url: 'file:///app/dist/index.html' }
      };
      expect(validateSender(event)).toBe(true);
    });

    it('approves events with a trusted sender webContents URL when frame URL is missing', () => {
      const event = {
        sender: { getURL: () => 'file:///app/dist/index.html' }
      };
      expect(validateSender(event)).toBe(true);
    });

    it('rejects events from untrusted origins', () => {
      const event = {
        sender: { getURL: () => 'https://evil.site/exploit' },
        senderFrame: { url: 'https://evil.site/exploit' }
      };
      expect(validateSender(event)).toBe(false);
    });

    it('rejects events without sender', () => {
      expect(validateSender({})).toBe(false);
      expect(validateSender({ sender: null })).toBe(false);
    });
  });

  describe('Channel Whitelisting (validateIpcChannel)', () => {
    it('allows registered channels across all domains', () => {
      const expectedChannels = [
        'window:minimize',
        'window:maximize',
        'window:close',
        'app:get-info',
        'shell:open-external',
        'dialog:show-open-dialog',
        'fs:read-file',
        'fs:write-file',
        'cloud:sync-pull',
        'cloud:sync-push',
        'ai:fetch',
        'ai:fetch-stream'
      ];

      for (const channel of expectedChannels) {
        expect(validateIpcChannel(channel)).toBe(true);
        expect(ALLOWED_IPC_CHANNELS.has(channel)).toBe(true);
      }
    });

    it('rejects unregistered, dangerous or arbitrary channels', () => {
      expect(validateIpcChannel('shell:exec')).toBe(false);
      expect(validateIpcChannel('child_process:spawn')).toBe(false);
      expect(validateIpcChannel('fs:delete-system-files')).toBe(false);
      expect(validateIpcChannel('')).toBe(false);
      expect(validateIpcChannel(null)).toBe(false);
      expect(validateIpcChannel(undefined)).toBe(false);
    });
  });

  describe('Secure Handler Wrapper (createSecureHandler)', () => {
    it('executes handler successfully when sender and channel are authorized', async () => {
      const mockHandler = vi.fn().mockResolvedValue({ success: true, count: 42 });
      const secureHandler = createSecureHandler(mockHandler, 'fs:read-file');

      const validEvent = {
        sender: { getURL: () => 'file:///dist/index.html' },
        senderFrame: { url: 'file:///dist/index.html' }
      };

      const result = await secureHandler(validEvent, { filePath: '/notes.md' });
      expect(result).toEqual({ success: true, count: 42 });
      expect(mockHandler).toHaveBeenCalledWith(validEvent, { filePath: '/notes.md' });
    });

    it('throws when channel is not whitelisted', async () => {
      const mockHandler = vi.fn();
      const secureHandler = createSecureHandler(mockHandler, 'unregistered:channel');

      const validEvent = {
        sender: { getURL: () => 'file:///dist/index.html' },
        senderFrame: { url: 'file:///dist/index.html' }
      };

      await expect(secureHandler(validEvent)).rejects.toThrow('Unknown IPC channel');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('throws when sender is unauthorized', async () => {
      const mockHandler = vi.fn();
      const secureHandler = createSecureHandler(mockHandler, 'fs:read-file');

      const unauthorizedEvent = {
        sender: { getURL: () => 'https://hacker.com' },
        senderFrame: { url: 'https://hacker.com' }
      };

      await expect(secureHandler(unauthorizedEvent)).rejects.toThrow('Unauthorized IPC call');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});

