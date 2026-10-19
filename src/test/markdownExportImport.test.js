import { describe, it, expect } from 'vitest';
import { pageToMarkdown } from '../utils/markdown';
import { parseMarkdownToBlocks, parseMarkdownDocument } from '../utils/aiAssistant';

describe('Markdown Export & Import Engine', () => {
  describe('pageToMarkdown (Export)', () => {
    it('serializes a complete Noted page into standard GFM markdown', () => {
      const page = {
        id: 'p-1',
        title: 'Q4 Product Roadmap',
        icon: '🚀',
        blocks: [
          { id: 'b1', type: 'heading_1', text: 'Strategic Goals' },
          { id: 'b2', type: 'paragraph', text: 'This quarter focuses on performance and REA fidelity.' },
          { id: 'b3', type: 'heading_2', text: 'Key Deliverables' },
          { id: 'b4', type: 'to_do', text: 'Vitest Unit & Integration QA', checked: true },
          { id: 'b5', type: 'to_do', text: 'Playwright E2E Automation', checked: false },
          { id: 'b6', type: 'bulleted_list_item', text: 'Sub-second cold startup' },
          { id: 'b7', type: 'numbered_list_item', text: 'Zero regression guarantee' },
          { id: 'b8', type: 'quote', text: 'Quality is not an act, it is a habit.' },
          { id: 'b9', type: 'callout', icon: '💡', text: 'Keep all local AI responses private.' },
          { id: 'b10', type: 'code', language: 'typescript', text: 'const speed: number = 100;' },
          { id: 'b11', type: 'divider' },
          {
            id: 'b12',
            type: 'table',
            headers: ['Feature', 'Status'],
            rows: [
              ['Editor', 'Done'],
              ['Sync', 'Active']
            ]
          },
          { id: 'b13', type: 'math', content: 'E = mc^2' },
          {
            id: 'b14',
            type: 'bookmark',
            url: 'https://github.com/noted',
            title: 'Noted Repo',
            caption: 'Core repo'
          },
          {
            id: 'b15',
            type: 'video',
            url: 'https://youtu.be/dQw4w9WgXcQ',
            caption: 'Architecture Walkthrough'
          },
          {
            id: 'b16',
            type: 'toggle',
            text: 'Release Notes',
            subtext: 'Version 2.0 has been deployed.'
          }
        ]
      };

      const md = pageToMarkdown(page);

      // Title
      expect(md).toContain('# 🚀 Q4 Product Roadmap');

      // Headings
      expect(md).toContain('# Strategic Goals');
      expect(md).toContain('## Key Deliverables');

      // Checklists
      expect(md).toContain('- [x] Vitest Unit & Integration QA');
      expect(md).toContain('- [ ] Playwright E2E Automation');

      // Lists
      expect(md).toContain('- Sub-second cold startup');
      expect(md).toContain('1. Zero regression guarantee');

      // Quote & Callout
      expect(md).toContain('> Quality is not an act, it is a habit.');
      expect(md).toContain('> [!NOTE] 💡');
      expect(md).toContain('> Keep all local AI responses private.');

      // Code block
      expect(md).toContain('```typescript\nconst speed: number = 100;\n```');

      // Divider
      expect(md).toContain('---');

      // Table
      expect(md).toContain('| Feature | Status |');
      expect(md).toContain('| --- | --- |');
      expect(md).toContain('| Editor | Done |');
      expect(md).toContain('| Sync | Active |');

      // Math
      expect(md).toContain('$$\nE = mc^2\n$$');

      // Bookmark & Video
      expect(md).toContain('[Noted Repo](https://github.com/noted)');
      expect(md).toContain('[Video: Architecture Walkthrough](https://youtu.be/dQw4w9WgXcQ)');

      // Toggle details
      expect(md).toContain('<details><summary>Release Notes</summary>');
      expect(md).toContain('Version 2.0 has been deployed.');
    });

    it('handles empty or missing page properties gracefully', () => {
      expect(pageToMarkdown(null)).toBe('');
      expect(pageToMarkdown({ title: '', blocks: [] })).toBe('# Untitled\n');
    });
  });

  describe('parseMarkdownToBlocks & parseMarkdownDocument (Import)', () => {
    it('parses markdown text into structured Noted blocks', () => {
      const rawText = `# Main Heading
Here is an introduction paragraph.

## Section Two
- [x] Completed task item
- [ ] Incomplete task item
- Bullet item one
- Bullet item two
1. First numbered step
2. Second numbered step

> A profound quote

\`\`\`javascript
const answer = 42;
\`\`\`
`;

      const blocks = parseMarkdownToBlocks(rawText);
      expect(blocks.length).toBeGreaterThanOrEqual(8);

      const heading1 = blocks.find((b) => b.type === 'heading_1');
      expect(heading1).toBeDefined();
      expect(heading1.text).toBe('Main Heading');

      const heading2 = blocks.find((b) => b.type === 'heading_2');
      expect(heading2).toBeDefined();
      expect(heading2.text).toBe('Section Two');

      const checkedTodo = blocks.find((b) => b.type === 'to_do' && b.checked === true);
      expect(checkedTodo).toBeDefined();
      expect(checkedTodo.text).toBe('Completed task item');

      const uncheckedTodo = blocks.find((b) => b.type === 'to_do' && b.checked === false);
      expect(uncheckedTodo).toBeDefined();
      expect(uncheckedTodo.text).toBe('Incomplete task item');

      const bulletItem = blocks.find((b) => b.type === 'bulleted_list_item');
      expect(bulletItem).toBeDefined();
      expect(bulletItem.text).toBe('Bullet item one');

      const numberedItem = blocks.find((b) => b.type === 'numbered_list_item');
      expect(numberedItem).toBeDefined();
      expect(numberedItem.text).toBe('First numbered step');

      const codeBlock = blocks.find((b) => b.type === 'code');
      expect(codeBlock).toBeDefined();
      expect(codeBlock.language).toBe('javascript');
      expect(codeBlock.text || codeBlock.code).toContain('const answer = 42;');
    });

    it('parseMarkdownDocument extracts title and metadata', () => {
      const doc = parseMarkdownDocument(
        `# 🌟 Architecture Plan\nThis is a system document.`,
        'Fallback'
      );
      expect(doc.title).toContain('Architecture Plan');
      expect(doc.blocks).toBeDefined();
      expect(doc.blocks.length).toBeGreaterThan(0);
    });
  });
});
