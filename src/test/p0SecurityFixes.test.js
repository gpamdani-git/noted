import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isAllowedAiUrl, getAiAllowedHosts, normalizeHostname } from '../../electron/ai-hosts.cjs';
import { runExternalLlmGeneration } from '../utils/aiAssistant';
import { applyDesktopSession, isMobileNativeApp, shouldUseNativeGoogleAuth } from '../utils/auth';
import { getSessionToken, clearSessionToken } from '../utils/session';

describe('P0 Security Fixes (AI request policy, session identity, native detection)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.electronAPI;
    delete window.Capacitor;
    clearSessionToken();
  });

  describe('AI host allowlist (electron/ai-hosts.cjs)', () => {
    it('accepts local LLM runtimes and known model providers', () => {
      expect(isAllowedAiUrl('http://localhost:11434/v1/chat/completions').ok).toBe(true);
      expect(isAllowedAiUrl('http://127.0.0.1:1234/v1/chat/completions').ok).toBe(true);
      expect(isAllowedAiUrl('http://[::1]:11434/v1/chat/completions').ok).toBe(true);
      expect(isAllowedAiUrl('https://api.openai.com/v1/chat/completions').ok).toBe(true);
      expect(isAllowedAiUrl('https://generativelanguage.googleapis.com/v1/models').ok).toBe(true);
    });

    it('rejects internal services and unknown hosts (SSRF guard)', () => {
      const blocked = [
        'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        'http://10.0.0.5/admin',
        'http://192.168.1.10:8080/',
        'https://evil.example.com/steal',
        'http://localhost.evil.com/'
      ];
      for (const url of blocked) {
        const result = isAllowedAiUrl(url);
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/not allowed by the AI request policy/);
      }
    });

    it('rejects non http(s) protocols and malformed URLs', () => {
      expect(isAllowedAiUrl('file:///etc/passwd').error).toMatch(/Unsupported protocol/);
      expect(isAllowedAiUrl('gopher://example.com').error).toMatch(/Unsupported protocol/);
      expect(isAllowedAiUrl('not a url').error).toBe('Invalid request URL');
    });

    it('honours the AI_ALLOWED_HOSTS environment override', () => {
      const original = process.env.AI_ALLOWED_HOSTS;
      process.env.AI_ALLOWED_HOSTS = 'llm.internal.example';
      try {
        expect(getAiAllowedHosts().has('llm.internal.example')).toBe(true);
        expect(isAllowedAiUrl('http://llm.internal.example/v1/chat/completions').ok).toBe(true);
      } finally {
        if (original === undefined) delete process.env.AI_ALLOWED_HOSTS;
        else process.env.AI_ALLOWED_HOSTS = original;
      }
    });

    it('normalizes IPv6 hostnames so the allowlist matches', () => {
      expect(normalizeHostname('[::1]')).toBe('::1');
      expect(normalizeHostname('API.OpenAI.com')).toBe('api.openai.com');
    });
  });

  describe('Model generation uses the privileged bridge on desktop', () => {
    const installElectronBridge = () => {
      const handlers = { chunk: {}, end: {}, error: {} };
      window.electronAPI = {
        isElectron: true,
        onAiStreamChunk: (id, cb) => { handlers.chunk[id] = cb; return () => delete handlers.chunk[id]; },
        onAiStreamEnd: (id, cb) => { handlers.end[id] = cb; return () => delete handlers.end[id]; },
        onAiStreamError: (id, cb) => { handlers.error[id] = cb; return () => delete handlers.error[id]; },
        aiFetchStream: vi.fn(async (id, url, options) => {
          handlers.chunk[id]?.('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n');
          handlers.chunk[id]?.('data: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DONE]\n\n');
          handlers.end[id]?.();
          return { ok: true, status: 200 };
        })
      };
      return { handlers, api: window.electronAPI };
    };

    it('routes the generation request through aiFetchStream instead of a raw fetch', async () => {
      const { api } = installElectronBridge();
      const fetchSpy = vi.spyOn(global, 'fetch');

      const result = await runExternalLlmGeneration({
        config: { provider: 'ollama', endpoint: 'http://localhost:11434' },
        action: 'summarize',
        pageContent: 'Some long document body'
      });

      expect(api.aiFetchStream).toHaveBeenCalledTimes(1);
      const [requestId, url, options] = api.aiFetchStream.mock.calls[0];
      expect(requestId).toMatch(/^ai-stream-/);
      expect(url).toBe('http://localhost:11434/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body).stream).toBe(true);

      // The renderer must never issue the privileged request itself
      expect(fetchSpy).not.toHaveBeenCalled();

      expect(result.text).toBe('Hello world');
      expect(result.blocks.length).toBeGreaterThan(0);
    });

    it('propagates a policy rejection from the bridge', async () => {
      window.electronAPI = {
        isElectron: true,
        onAiStreamChunk: () => () => {},
        onAiStreamEnd: () => () => {},
        onAiStreamError: () => () => {},
        aiFetchStream: vi.fn(async () => ({
          ok: false,
          error: 'Host is not allowed by the AI request policy: evil.example.com'
        }))
      };

      await expect(runExternalLlmGeneration({
        config: { provider: 'custom', endpoint: 'https://evil.example.com' },
        action: 'custom',
        prompt: 'hello'
      })).rejects.toThrow(/not allowed by the AI request policy/);
    });

    it('still uses a plain fetch on the web build where no privileged bridge exists', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true };
                done = true;
                return {
                  done: false,
                  value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"web"}}]}\n\ndata: [DONE]\n\n')
                };
              }
            };
          }
        }
      });

      const result = await runExternalLlmGeneration({
        config: { provider: 'ollama' },
        action: 'summarize',
        pageContent: 'body'
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy.mock.calls[0][0]).toBe('/api/ollama/v1/chat/completions');
      expect(result.text).toBe('web');
    });
  });

  describe('Desktop session identity', () => {
    // Mirrors the server format from api/lib/security.js: payload.signature
    const buildSessionToken = (payload) =>
      `${btoa(JSON.stringify(payload))}.signature`;

    beforeEach(() => {
      localStorage.clear();
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, resolvedUserId: 'google_123456' })
      });
    });

    it('uses the server issued subject as the workspace identity', async () => {
      const token = buildSessionToken({
        sub: 'google_123456',
        email: 'dani.noted@gmail.com',
        name: 'Dani Akbar',
        picture: 'https://example.com/dani.jpg'
      });

      const user = await applyDesktopSession(token);

      // The id must match the one used by the web login, otherwise the desktop
      // session reads a different localStorage scope and the pages look empty.
      expect(user.id).toBe('google_123456');
      expect(user.id).not.toMatch(/^google_\d{10,}$/);
      expect(user.email).toBe('dani.noted@gmail.com');
      expect(user.name).toBe('Dani Akbar');
      expect(user.picture).toBe('https://example.com/dani.jpg');
      expect(user.isLoggedIn).toBe(true);
      expect(getSessionToken()).toBe(token);
    });

    it('refuses a session that carries no verified identity', async () => {
      const token = buildSessionToken({ email: 'nobody@example.com' });

      await expect(applyDesktopSession(token)).rejects.toThrow(
        'Session does not carry a verified identity'
      );
      expect(getSessionToken()).toBe('');
    });

    it('clears the session when the server rejects it', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Unauthorized' })
      });

      const token = buildSessionToken({ sub: 'google_1', email: 'a@b.com' });
      await expect(applyDesktopSession(token)).rejects.toThrow('Session rejected by server');
      expect(getSessionToken()).toBe('');
    });
  });

  describe('Native platform detection', () => {
    it('does not treat a localhost dev server as a native runtime', () => {
      expect(window.location.hostname).toBe('localhost');
      expect(isMobileNativeApp()).toBe(false);
      expect(shouldUseNativeGoogleAuth()).toBe(false);
    });

    it('detects a Capacitor runtime', () => {
      window.Capacitor = { isNativePlatform: () => true };
      expect(isMobileNativeApp()).toBe(true);
      expect(shouldUseNativeGoogleAuth()).toBe(true);
    });
  });
});
