import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BlockItem } from '../components/Editor/BlockItem';
import { parseMarkdownToBlocks } from '../utils/aiAssistant';
import { pageToMarkdown } from '../utils/markdown';

describe('QA Suite 3: Block Morphing & Markdown Divider System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. UNIT TESTS: Matcher Shortcut Logic
  describe('Shortcut Trigger Regex & String Normalization', () => {
    const matchShortcut = (text) => {
      const val = (text || '').replace(/[\u200B\u00A0]/g, ' ').trim();
      if (val === '[]' || val === '[ ]') return { type: 'to_do', checked: false };
      if (val === '[x]' || val === '[X]') return { type: 'to_do', checked: true };
      if (val === '-' || val === '*' || val === '+') return { type: 'bulleted_list_item' };
      if (/^\d+[.)]$/.test(val)) return { type: 'numbered_list_item' };
      if (val === '#') return { type: 'heading_1' };
      if (val === '##') return { type: 'heading_2' };
      if (val === '###') return { type: 'heading_3' };
      if (val === '>' || val === '"') return { type: 'quote' };
      if (val === '>>' || val === '>!') return { type: 'toggle' };
      if (val === ':::' || val === '|!') return { type: 'callout' };
      if (/^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(val)) return { type: 'divider' };
      return null;
    };

    it('triggers to_do checkbox on [] and [ ]', () => {
      expect(matchShortcut('[]')).toEqual({ type: 'to_do', checked: false });
      expect(matchShortcut('[ ]')).toEqual({ type: 'to_do', checked: false });
      expect(matchShortcut('[x]')).toEqual({ type: 'to_do', checked: true });
    });

    it('triggers bulleted list on -, *, +', () => {
      expect(matchShortcut('-')).toEqual({ type: 'bulleted_list_item' });
      expect(matchShortcut('*')).toEqual({ type: 'bulleted_list_item' });
      expect(matchShortcut('+')).toEqual({ type: 'bulleted_list_item' });
    });

    it('triggers numbered list on 1. and 1)', () => {
      expect(matchShortcut('1.')).toEqual({ type: 'numbered_list_item' });
      expect(matchShortcut('1)')).toEqual({ type: 'numbered_list_item' });
      expect(matchShortcut('42.')).toEqual({ type: 'numbered_list_item' });
    });

    it('triggers headings H1-H3 on #, ##, ###', () => {
      expect(matchShortcut('#')).toEqual({ type: 'heading_1' });
      expect(matchShortcut('##')).toEqual({ type: 'heading_2' });
      expect(matchShortcut('###')).toEqual({ type: 'heading_3' });
    });

    it('triggers quote on > and toggle on >>', () => {
      expect(matchShortcut('>')).toEqual({ type: 'quote' });
      expect(matchShortcut('>>')).toEqual({ type: 'toggle' });
    });

    it('triggers callout on ::: and |!', () => {
      expect(matchShortcut(':::')).toEqual({ type: 'callout' });
      expect(matchShortcut('|!')).toEqual({ type: 'callout' });
    });

    describe('Markdown Divider Triggers (Comprehensive Variants)', () => {
      it('triggers divider on standard three hyphens ---', () => {
        expect(matchShortcut('---')).toEqual({ type: 'divider' });
      });

      it('triggers divider on three hyphens with trailing space "--- "', () => {
        expect(matchShortcut('--- ')).toEqual({ type: 'divider' });
      });

      it('triggers divider on four or more hyphens "----"', () => {
        expect(matchShortcut('----')).toEqual({ type: 'divider' });
      });

      it('triggers divider on three asterisks "***"', () => {
        expect(matchShortcut('***')).toEqual({ type: 'divider' });
        expect(matchShortcut('*** ')).toEqual({ type: 'divider' });
        expect(matchShortcut('****')).toEqual({ type: 'divider' });
      });

      it('triggers divider on three underscores "___"', () => {
        expect(matchShortcut('___')).toEqual({ type: 'divider' });
        expect(matchShortcut('___ ')).toEqual({ type: 'divider' });
        expect(matchShortcut('____')).toEqual({ type: 'divider' });
      });

      it('triggers divider on macOS smart em-dash "—"', () => {
        expect(matchShortcut('—')).toEqual({ type: 'divider' });
      });

      it('handles contentEditable whitespace like non-breaking space and zero-width spaces', () => {
        expect(matchShortcut('\u00A0---\u00A0')).toEqual({ type: 'divider' });
        expect(matchShortcut('\u200B---\u200B')).toEqual({ type: 'divider' });
      });

      it('does NOT trigger divider on invalid patterns', () => {
        expect(matchShortcut('--')).toBeNull(); // Only 2 dashes
        expect(matchShortcut('- - -')).toBeNull();
        expect(matchShortcut('--- text')).toBeNull(); // Has trailing text
        expect(matchShortcut('text ---')).toBeNull(); // Has leading text
        expect(matchShortcut('**')).toBeNull();
        expect(matchShortcut('__')).toBeNull();
      });
    });

    describe('Continuation & Un-morphing Rules (Notion Desktop spec)', () => {
      it('determines next block type on Enter', () => {
        const getNextBlockType = (curType, text) => {
          if (!text.trim() && (curType === 'to_do' || curType === 'bulleted_list_item' || curType === 'numbered_list_item')) {
            return 'paragraph'; // Un-morph on empty enter
          }
          if (curType === 'to_do' || curType === 'bulleted_list_item' || curType === 'numbered_list_item') {
            return curType; // Continue list
          }
          return 'paragraph';
        };

        expect(getNextBlockType('to_do', 'Buy coffee')).toBe('to_do');
        expect(getNextBlockType('to_do', '')).toBe('paragraph');
        expect(getNextBlockType('bulleted_list_item', 'Item 1')).toBe('bulleted_list_item');
        expect(getNextBlockType('bulleted_list_item', '')).toBe('paragraph');
        expect(getNextBlockType('heading_1', 'Section Title')).toBe('paragraph');
      });

      it('un-morphs non-paragraph block to paragraph on Backspace at start', () => {
        const handleBackspaceStart = (curType, cursorOffset) => {
          if (cursorOffset === 0 && curType !== 'paragraph' && curType !== 'divider') {
            return 'paragraph';
          }
          return curType;
        };

        expect(handleBackspaceStart('to_do', 0)).toBe('paragraph');
        expect(handleBackspaceStart('heading_1', 0)).toBe('paragraph');
        expect(handleBackspaceStart('quote', 0)).toBe('paragraph');
        expect(handleBackspaceStart('to_do', 3)).toBe('to_do'); // Not at start
      });
    });
  });

  // 2. COMPONENT UNIT TESTS: BlockItem Divider Interaction
  describe('BlockItem Component - Divider Morphing Behavior', () => {
    const createMockBlock = (overrides = {}) => ({
      id: 'block-test-1',
      type: 'paragraph',
      text: '',
      ...overrides
    });

    it('renders a paragraph block and shows placeholder', () => {
      const block = createMockBlock();
      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      expect(el).toBeInTheDocument();
      expect(el.getAttribute('contenteditable')).toBe('true');
    });

    it('calls onMorphToDivider when typing "---" into a paragraph block', () => {
      const block = createMockBlock();
      const onMorphToDivider = vi.fn();
      const onUpdateBlock = vi.fn();
      const onAddBlockBelow = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={onUpdateBlock}
          onAddBlockBelow={onAddBlockBelow}
        />
      );

      const el = document.querySelector('.block-paragraph');
      expect(el).toBeInTheDocument();

      // Simulate typing "---"
      el.innerHTML = '---';
      el.innerText = '---';
      fireEvent.input(el);

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);
    });

    it('calls onMorphToDivider when typing "--- " (with space) into a paragraph block', () => {
      const block = createMockBlock();
      const onMorphToDivider = vi.fn();

      render(
        <BlockItem
          block={block}
          index={2}
          totalBlocks={5}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      el.innerHTML = '--- ';
      el.innerText = '--- ';
      fireEvent.input(el);

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 2);
    });

    it('calls onMorphToDivider when typing "***" or "___" into a paragraph block', () => {
      const block = createMockBlock();
      const onMorphToDivider = vi.fn();

      const { rerender } = render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      el.innerHTML = '***';
      el.innerText = '***';
      fireEvent.input(el);

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);

      onMorphToDivider.mockClear();

      // Test "___"
      rerender(
        <BlockItem
          block={block}
          index={1}
          totalBlocks={2}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      el.innerHTML = '___';
      el.innerText = '___';
      fireEvent.input(el);

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 1);
    });

    it('calls onMorphToDivider when typing macOS smart em-dash "—"', () => {
      const block = createMockBlock();
      const onMorphToDivider = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      el.innerHTML = '—';
      el.innerText = '—';
      fireEvent.input(el);

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);
    });

    it('calls onMorphToDivider when pressing Space on a block containing "---"', () => {
      const block = createMockBlock({ text: '---' });
      const onMorphToDivider = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      fireEvent.keyDown(el, { key: ' ' });

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);
    });

    it('calls onMorphToDivider when pressing Enter on a block containing "---"', () => {
      const block = createMockBlock({ text: '---' });
      const onMorphToDivider = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const el = document.querySelector('.block-paragraph');
      fireEvent.keyDown(el, { key: 'Enter' });

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);
    });

    it('falls back to onUpdateBlock and onAddBlockBelow if onMorphToDivider is not provided', () => {
      const block = createMockBlock();
      const onUpdateBlock = vi.fn();
      const onAddBlockBelow = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onUpdateBlock={onUpdateBlock}
          onAddBlockBelow={onAddBlockBelow}
        />
      );

      const el = document.querySelector('.block-paragraph');
      el.innerHTML = '---';
      el.innerText = '---';
      fireEvent.input(el);

      expect(onUpdateBlock).toHaveBeenCalledWith('block-test-1', {
        type: 'divider',
        text: ''
      });
      expect(onAddBlockBelow).toHaveBeenCalledWith(0, 'paragraph');
    });

    it('renders <hr className="block-divider-line" /> when block.type is "divider"', () => {
      const block = {
        id: 'block-div-1',
        type: 'divider',
        text: ''
      };

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      const hr = document.querySelector('hr.block-divider-line');
      expect(hr).toBeInTheDocument();
      expect(document.querySelector('.block-paragraph')).not.toBeInTheDocument();
    });

    it('auto-morphs paragraph block initialized with "---" via useEffect', () => {
      const block = createMockBlock({ text: '---' });
      const onMorphToDivider = vi.fn();

      render(
        <BlockItem
          block={block}
          index={0}
          totalBlocks={1}
          onMorphToDivider={onMorphToDivider}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
        />
      );

      expect(onMorphToDivider).toHaveBeenCalledWith('block-test-1', 0);
    });
  });

  // 3. EDITOR STATE ATOMIC MORPHING TESTS
  describe('Editor Atomic State Transformation for Divider', () => {
    it('morphs target block to divider and adds a paragraph below in a single update', () => {
      const initialBlocks = [
        { id: 'b1', type: 'paragraph', text: '---' },
        { id: 'b2', type: 'paragraph', text: 'Second block' }
      ];

      // Simulate Editor.jsx handleMorphToDivider logic
      const simulateHandleMorphToDivider = (blocks, blockId, afterIndex) => {
        const currentBlocks = [...blocks];
        const idx = typeof afterIndex === 'number' && afterIndex >= 0
          ? afterIndex
          : currentBlocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return currentBlocks;

        const updatedDivider = {
          ...currentBlocks[idx],
          type: 'divider',
          text: ''
        };

        const newBlock = {
          id: 'new-paragraph-id',
          type: 'paragraph',
          text: ''
        };

        currentBlocks.splice(idx, 1, updatedDivider, newBlock);
        return currentBlocks;
      };

      const result = simulateHandleMorphToDivider(initialBlocks, 'b1', 0);

      // Block count should increase by 1
      expect(result).toHaveLength(3);

      // First block is divider with empty text
      expect(result[0]).toEqual({
        id: 'b1',
        type: 'divider',
        text: ''
      });

      // Second block is the newly created empty paragraph
      expect(result[1]).toEqual({
        id: 'new-paragraph-id',
        type: 'paragraph',
        text: ''
      });

      // Third block is the existing subsequent block (order preserved)
      expect(result[2]).toEqual({
        id: 'b2',
        type: 'paragraph',
        text: 'Second block'
      });
    });
  });

  // 4. PARSER & ROUNDTRIP TESTS
  describe('Markdown Parser & Serializer for Dividers', () => {
    it('parses markdown text with "---" into divider block', () => {
      const md = '# Title\n\n---\n\nParagraph text';
      const blocks = parseMarkdownToBlocks(md);

      const dividerBlock = blocks.find((b) => b.type === 'divider');
      expect(dividerBlock).toBeDefined();
      expect(dividerBlock.text).toBe('');
    });

    it('parses markdown text with "***", "___", and "—" into divider block', () => {
      expect(parseMarkdownToBlocks('***')[0].type).toBe('divider');
      expect(parseMarkdownToBlocks('___')[0].type).toBe('divider');
      expect(parseMarkdownToBlocks('—')[0].type).toBe('divider');
    });

    it('serializes divider block back to "---" in pageToMarkdown export', () => {
      const mockPage = {
        title: 'Main Title',
        blocks: [
          { id: 'b1', type: 'heading_1', text: 'Main Title' },
          { id: 'b2', type: 'divider', text: '' },
          { id: 'b3', type: 'paragraph', text: 'Body content' }
        ]
      };

      const exported = pageToMarkdown(mockPage);
      expect(exported).toContain('---');
      expect(exported).toMatch(/---\n\nBody content/);
    });
  });

  // 5. NUMBERED LIST NOTION CONTINUOUS NUMBERING VERIFICATION
  describe('Numbered List Relative Continuous Numbering', () => {
    it('renders 1. for a numbered item even when preceded by 9 other non-list blocks', () => {
      // 9 preceding paragraphs, 10th block is a numbered_list_item (index 9)
      const allBlocks = [
        ...Array.from({ length: 9 }, (_, i) => ({ id: `p-${i}`, type: 'paragraph', text: `Paragraph ${i}` })),
        { id: 'num-1', type: 'numbered_list_item', text: 'First numbered item' }
      ];

      const { container } = render(
        <BlockItem
          block={allBlocks[9]}
          index={9}
          totalBlocks={10}
          allBlocks={allBlocks}
          onUpdateBlock={vi.fn()}
          onAddBlockBelow={vi.fn()}
          onDeleteBlock={vi.fn()}
        />
      );

      const label = container.querySelector('.block-number-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toBe('1.'); // Must be 1., NEVER 10.!
    });

    it('increments consecutive numbered items and resets after an interrupting block', () => {
      const allBlocks = [
        { id: 'p0', type: 'paragraph', text: 'Intro' },
        { id: 'n1', type: 'numbered_list_item', text: 'Item 1' },
        { id: 'n2', type: 'numbered_list_item', text: 'Item 2' },
        { id: 'p1', type: 'paragraph', text: 'Interruption' },
        { id: 'n3', type: 'numbered_list_item', text: 'New List Item 1' }
      ];

      const { container: c1 } = render(
        <BlockItem
          block={allBlocks[1]}
          index={1}
          totalBlocks={5}
          allBlocks={allBlocks}
          onUpdateBlock={vi.fn()}
        />
      );
      expect(c1.querySelector('.block-number-label').textContent).toBe('1.');

      const { container: c2 } = render(
        <BlockItem
          block={allBlocks[2]}
          index={2}
          totalBlocks={5}
          allBlocks={allBlocks}
          onUpdateBlock={vi.fn()}
        />
      );
      expect(c2.querySelector('.block-number-label').textContent).toBe('2.');

      const { container: c3 } = render(
        <BlockItem
          block={allBlocks[4]}
          index={4}
          totalBlocks={5}
          allBlocks={allBlocks}
          onUpdateBlock={vi.fn()}
        />
      );
      expect(c3.querySelector('.block-number-label').textContent).toBe('1.');
    });
  });
});
