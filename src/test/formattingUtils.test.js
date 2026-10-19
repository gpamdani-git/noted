import { describe, it, expect } from 'vitest';
import {
  applyMarkdownFormat,
  applyColorToText,
  cleanFormattedText,
  flattenDoubleSpans,
  markdownToRichHtml,
  richHtmlToMarkdown,
  getSelectionOffsets,
  setSelectionOffsets,
  getCaretOffset,
  setCaretPosition
} from '../utils/formattingUtils';

describe('QA Suite 1: Formatting Utilities (Notion REA Standards)', () => {
  describe('applyMarkdownFormat: Bold Toggling', () => {
    it('applies bold to unformatted plain text', () => {
      const res = applyMarkdownFormat('toogle title', 'title', 'bold');
      expect(res).toBe('toogle **title**');
    });

    it('toggles bold OFF when text is already bold', () => {
      const res = applyMarkdownFormat('toogle **title**', 'title', 'bold');
      expect(res).toBe('toogle title');
    });

    it('combines bold with existing italic to produce bold-italic', () => {
      const res = applyMarkdownFormat('toogle *title*', 'title', 'bold');
      expect(res).toBe('toogle ***title***');
    });

    it('toggles bold OFF from bold-italic leaving italic intact', () => {
      const res = applyMarkdownFormat('toogle ***title***', 'title', 'bold');
      expect(res).toBe('toogle *title*');
    });
  });

  describe('applyMarkdownFormat: Italic Toggling', () => {
    it('applies italic to unformatted plain text', () => {
      const res = applyMarkdownFormat('toogle title', 'title', 'italic');
      expect(res).toBe('toogle *title*');
    });

    it('toggles italic OFF when text is already italic', () => {
      const res = applyMarkdownFormat('toogle *title*', 'title', 'italic');
      expect(res).toBe('toogle title');
    });

    it('combines italic with existing bold to produce bold-italic', () => {
      const res = applyMarkdownFormat('toogle **title**', 'title', 'italic');
      expect(res).toBe('toogle ***title***');
    });

    it('toggles italic OFF from bold-italic leaving bold intact', () => {
      const res = applyMarkdownFormat('toogle ***title***', 'title', 'italic');
      expect(res).toBe('toogle **title**');
    });
  });

  describe('applyMarkdownFormat: Strikethrough & Code', () => {
    it('applies and removes strikethrough', () => {
      const formatted = applyMarkdownFormat('my task', 'task', 'strikethrough');
      expect(formatted).toBe('my ~~task~~');
      const unformatted = applyMarkdownFormat(formatted, 'task', 'strikethrough');
      expect(unformatted).toBe('my task');
    });

    it('applies and removes inline code', () => {
      const formatted = applyMarkdownFormat('run command now', 'command', 'code');
      expect(formatted).toBe('run `command` now');
      const unformatted = applyMarkdownFormat(formatted, 'command', 'code');
      expect(unformatted).toBe('run command now');
    });
  });

  describe('applyColorToText', () => {
    it('wraps chunk in clean color span', () => {
      const res = applyColorToText('hello world', 'world', '#337ea9');
      expect(res).toBe('hello <span style="color: #337ea9">world</span>');
    });

    it('updates color when another color is applied without creating double spans', () => {
      const first = applyColorToText('hello world', 'world', '#337ea9');
      const updated = applyColorToText(first, 'world', '#d44c47');
      expect(updated).toBe('hello <span style="color: #d44c47">world</span>');
      expect(updated).not.toContain('<span style="color: #337ea9">');
    });

    it('removes color when default color is chosen', () => {
      const colored = 'hello <span style="color: #d44c47">world</span>';
      const removed = applyColorToText(colored, 'world', 'default');
      expect(removed).toBe('hello world');
    });
  });

  describe('flattenDoubleSpans & cleanFormattedText', () => {
    it('eliminates adjacent duplicate color spans', () => {
      const dirty = '<span style="color: #448361"><span style="color: #d44c47">Hello</span></span>';
      const clean = flattenDoubleSpans(dirty);
      expect(clean).toBe('<span style="color: #d44c47">Hello</span>');
    });

    it('cleans quadruple asterisks into standard bold', () => {
      const dirty = 'Here is ****broken bold**** text';
      const clean = cleanFormattedText(dirty);
      expect(clean).toBe('Here is **broken bold** text');
    });

    it('strips orphan unclosed span tags from broken AI outputs', () => {
      const dirty = '***<span style="# Explanation ... >Hello* Markdown Task**';
      const clean = cleanFormattedText(dirty);
      expect(clean).not.toContain('<span style="# Explanation');
    });
  });

  describe('markdownToRichHtml and richHtmlToMarkdown Round-Trip', () => {
    it('converts markdown bold and italic to semantic HTML', () => {
      const html = markdownToRichHtml('**bold** and *italic* and ~~deleted~~ and `code`');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<del>deleted</del>');
      expect(html).toContain('<code class="notion-inline-code">code</code>');
    });

    it('converts semantic HTML back to clean markdown without tags', () => {
      const html = '<strong>bold</strong> and <em>italic</em> and <del>deleted</del> and <code>code</code>';
      const md = richHtmlToMarkdown(html);
      expect(md).toBe('**bold** and *italic* and ~~deleted~~ and `code`');
    });
  });

  describe('Selection Offsets within ContentEditable', () => {
    it('accurately measures and restores selection across formatted text nodes', () => {
      const container = document.createElement('div');
      container.contentEditable = 'true';
      container.innerHTML = 'toogle <strong>title</strong>';
      document.body.appendChild(container);

      // Select "title" (offsets 7 to 12)
      setSelectionOffsets(container, 7, 12);
      const offsets = getSelectionOffsets(container);
      expect(offsets.start).toBe(7);
      expect(offsets.end).toBe(12);

      document.body.removeChild(container);
    });
  });
});
