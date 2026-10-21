import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pageToMarkdown } from '../utils/markdown';
import { STARTER_TEMPLATES } from '../constants/starterTemplates';
import { readPageIdFromUrl, writePageIdToUrl, buildShareablePageUrl } from '../utils/pageUrl';
import { parseVersion, isNewerVersion, checkForUpdates } from '../utils/updater';
import { isAllowedUpstream } from '../../api/_lib/llmProxy.js';

describe('Regression fixes', () => {
  describe('Markdown export keeps column blocks', () => {
    it('exports a column_list block instead of dropping it', () => {
      const page = {
        title: 'Columns',
        blocks: [
          {
            id: 'col-1',
            type: 'column_list',
            columnCount: 2,
            columns: [
              { id: 'c1', title: 'Left', blocks: [{ id: 'b1', type: 'paragraph', text: 'First column' }] },
              { id: 'c2', title: 'Right', blocks: [{ id: 'b2', type: 'bulleted_list_item', text: 'Second column' }] }
            ]
          }
        ]
      };

      const markdown = pageToMarkdown(page);

      expect(markdown).toContain('### Left');
      expect(markdown).toContain('First column');
      expect(markdown).toContain('### Right');
      expect(markdown).toContain('Second column');
    });
  });

  describe('Starter templates render', () => {
    it('creates the kanban template as a table block with a board view', () => {
      const template = STARTER_TEMPLATES.find((t) => t.id === 'project_board');
      expect(template).toBeDefined();

      const board = template.blocks.find((b) => b.id.includes('board'));
      expect(board).toBeDefined();
      // A block of type "board" has no renderer, so it must be a table block
      // that carries the board view.
      expect(board.type).toBe('table');
      expect(board.viewType).toBe('board');
      expect(board.groupByCol).toBe(1);
      expect(board.headers).toContain('Status');
    });

    it('uses renderable block types in every template', () => {
      const renderable = new Set([
        'paragraph', 'heading_1', 'heading_2', 'heading_3', 'to_do',
        'bulleted_list_item', 'numbered_list_item', 'toggle', 'quote',
        'callout', 'code', 'divider', 'table', 'column_list', 'link_to_page',
        'image', 'table_of_contents', 'bookmark', 'video', 'math', 'breadcrumb'
      ]);

      for (const template of STARTER_TEMPLATES) {
        for (const block of template.blocks) {
          expect(renderable.has(block.type), `${template.id} / ${block.id} uses "${block.type}"`).toBe(true);
        }
      }
    });
  });

  describe('Page addressing', () => {
    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    it('reads the page id from the query string', () => {
      window.history.replaceState({}, '', '/?pageId=page-42');
      expect(readPageIdFromUrl()).toBe('page-42');
    });

    it('returns null when no page id is present', () => {
      window.history.replaceState({}, '', '/');
      expect(readPageIdFromUrl()).toBeNull();
    });

    it('writes the active page id into the query string', () => {
      writePageIdToUrl('page-7');
      expect(new URLSearchParams(window.location.search).get('pageId')).toBe('page-7');
    });

    it('builds a link that reopens the page', () => {
      const link = buildShareablePageUrl('page-9');
      expect(link).toContain('pageId=page-9');
    });

    it('uses the desktop protocol in the Electron build', () => {
      window.electronAPI = { isElectron: true };
      try {
        expect(buildShareablePageUrl('page-9')).toBe('noted://open?pageId=page-9');
      } finally {
        delete window.electronAPI;
      }
    });
  });

  describe('Update check', () => {
    it('parses semantic versions', () => {
      expect(parseVersion('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
      expect(parseVersion('not-a-version')).toBeNull();
    });

    it('compares versions', () => {
      expect(isNewerVersion('v1.0.1', '1.0.0')).toBe(true);
      expect(isNewerVersion('v1.1.0', '1.0.9')).toBe(true);
      expect(isNewerVersion('v2.0.0', '1.9.9')).toBe(true);
      expect(isNewerVersion('v1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('v0.9.9', '1.0.0')).toBe(false);
    });

    it('reports an available release', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: 'v1.2.0', html_url: 'https://example.com/release' })
      });

      const result = await checkForUpdates({ currentVersion: '1.0.0' });

      expect(result.status).toBe('available');
      expect(result.latest).toBe('v1.2.0');
      expect(result.url).toBe('https://example.com/release');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('reports the current release', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ tag_name: 'v1.0.0' })
      });

      const result = await checkForUpdates({ currentVersion: '1.0.0' });
      expect(result.status).toBe('current');
    });

    it('reports a failure instead of claiming to be up to date', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503 });

      const result = await checkForUpdates({ currentVersion: '1.0.0' });
      expect(result.status).toBe('error');
      expect(result.message).toContain('503');
    });

    it('reports a network failure instead of claiming to be up to date', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

      const result = await checkForUpdates({ currentVersion: '1.0.0' });
      expect(result.status).toBe('error');
      expect(result.message).toBe('offline');
    });
  });

  describe('LLM proxy policy', () => {
    const originalEnv = process.env.LLM_PROXY_ALLOWED_HOSTS;

    afterEach(() => {
      if (originalEnv === undefined) delete process.env.LLM_PROXY_ALLOWED_HOSTS;
      else process.env.LLM_PROXY_ALLOWED_HOSTS = originalEnv;
    });

    it('allows the local runtimes', () => {
      expect(isAllowedUpstream(new URL('http://localhost:11434'))).toBe(true);
      expect(isAllowedUpstream(new URL('http://127.0.0.1:1234'))).toBe(true);
      expect(isAllowedUpstream(new URL('http://[::1]:1234'))).toBe(true);
    });

    it('blocks internal services and unknown hosts', () => {
      expect(isAllowedUpstream(new URL('http://169.254.169.254/'))).toBe(false);
      expect(isAllowedUpstream(new URL('http://10.0.0.1/'))).toBe(false);
      expect(isAllowedUpstream(new URL('http://192.168.1.10/'))).toBe(false);
      expect(isAllowedUpstream(new URL('https://evil.example.com/'))).toBe(false);
    });

    it('blocks non http protocols', () => {
      expect(isAllowedUpstream(new URL('file:///etc/passwd'))).toBe(false);
      expect(isAllowedUpstream(new URL('gopher://example.com'))).toBe(false);
    });

    it('honours the allowlist override', () => {
      process.env.LLM_PROXY_ALLOWED_HOSTS = 'llm.internal.example';
      expect(isAllowedUpstream(new URL('http://llm.internal.example'))).toBe(true);
      expect(isAllowedUpstream(new URL('http://other.example'))).toBe(false);
    });
  });
});
