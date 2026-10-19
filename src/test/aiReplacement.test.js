import { describe, it, expect } from 'vitest';
import { parseMarkdownToBlocks } from '../utils/aiAssistant';

describe('QA Suite 2: AI Multi-Line & Block Replacement (Notion REA)', () => {
  it('correctly parses multi-line bullet lists from AI into discrete blocks', () => {
    const rawAiOutput = `**Improved Clarity:**
* Changed "Heading" to "Major Section" for better recognition and understanding by users.
* Enhanced Style:
* Used a more descriptive and concise title to improve readability.
* Streamlined Flow:
* Combined the two separate lines into one for better line wrapping and readability.`;

    const blocks = parseMarkdownToBlocks(rawAiOutput);

    expect(blocks.length).toBe(6);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].text).toBe('**Improved Clarity:**');

    expect(blocks[1].type).toBe('bulleted_list_item');
    expect(blocks[1].text).toContain('Changed "Heading" to "Major Section"');

    expect(blocks[2].type).toBe('bulleted_list_item');
    expect(blocks[2].text).toBe('Enhanced Style:');

    expect(blocks[3].type).toBe('bulleted_list_item');
    expect(blocks[3].text).toContain('Used a more descriptive');

    expect(blocks[4].type).toBe('bulleted_list_item');
    expect(blocks[4].text).toBe('Streamlined Flow:');

    expect(blocks[5].type).toBe('bulleted_list_item');
    expect(blocks[5].text).toContain('Combined the two separate lines');
  });

  it('correctly parses headings and checklists from AI responses', () => {
    const rawAiOutput = `# Sprint Objectives
- [ ] Implement automated QA
- [x] Fix inline floating menu
### Key Results`;

    const blocks = parseMarkdownToBlocks(rawAiOutput);
    expect(blocks[0].type).toBe('heading_1');
    expect(blocks[0].text).toBe('Sprint Objectives');

    expect(blocks[1].type).toBe('to_do');
    expect(blocks[1].checked).toBe(false);
    expect(blocks[1].text).toBe('Implement automated QA');

    expect(blocks[2].type).toBe('to_do');
    expect(blocks[2].checked).toBe(true);
    expect(blocks[2].text).toBe('Fix inline floating menu');

    expect(blocks[3].type).toBe('heading_3');
    expect(blocks[3].text).toBe('Key Results');
  });

  it('parses tables from AI responses into structured table blocks', () => {
    const rawAiTable = `| Feature | Status | Priority |
| --- | --- | --- |
| Inline AI | Done | High |
| QA Suite | Active | Critical |`;

    const blocks = parseMarkdownToBlocks(rawAiTable);
    expect(blocks.length).toBe(1);
    expect(blocks[0].type).toBe('table');
    expect(blocks[0].headers).toEqual(['Feature', 'Status', 'Priority']);
    expect(blocks[0].rows.length).toBe(2);
    expect(blocks[0].rows[0]).toEqual(['Inline AI', 'Done', 'High']);
    expect(blocks[0].rows[1]).toEqual(['QA Suite', 'Active', 'Critical']);
  });
});
