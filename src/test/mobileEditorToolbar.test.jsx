import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileEditorToolbar } from '../components/Editor/MobileEditorToolbar';

describe('MobileEditorToolbar (Notion REA Fidelity)', () => {
  it('renders all essential toolbar controls and format triggers', () => {
    render(
      <MobileEditorToolbar
        onInsertBlock={vi.fn()}
        onFormatText={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        canUndo={true}
        canRedo={true}
        onOpenAI={vi.fn()}
        onOpenComments={vi.fn()}
        isLocked={false}
      />
    );

    // Primary Insert Block '+' button
    expect(screen.getByTitle('Insert Block')).toBeInTheDocument();

    // Text formatting buttons
    expect(screen.getByTitle('Bold (**text**)')).toBeInTheDocument();
    expect(screen.getByTitle('Italic (*text*)')).toBeInTheDocument();
    expect(screen.getByTitle('Underline (<u>text</u>)')).toBeInTheDocument();
    expect(screen.getByTitle('Strikethrough (~~text~~)')).toBeInTheDocument();
    expect(screen.getByTitle('Inline Code (`code`)')).toBeInTheDocument();
    expect(screen.getByTitle('Color / Highlight')).toBeInTheDocument();

    // Quick markdown blocks
    expect(screen.getByTitle('Heading 1 (#)')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 2 (##)')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 3 (###)')).toBeInTheDocument();
    expect(screen.getByTitle('To-do list ([ ])')).toBeInTheDocument();
    expect(screen.getByTitle('Bulleted list (*)')).toBeInTheDocument();
    expect(screen.getByTitle('Numbered list (1.)')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle list (>)')).toBeInTheDocument();
    expect(screen.getByTitle('Quote (>)')).toBeInTheDocument();
    expect(screen.getByTitle('Code Block (```)')).toBeInTheDocument();
    expect(screen.getByTitle('Callout (💡)')).toBeInTheDocument();
    expect(screen.getByTitle('Divider (---)')).toBeInTheDocument();
    expect(screen.getByTitle('Table')).toBeInTheDocument();
    expect(screen.getByTitle('Math equation ($$)')).toBeInTheDocument();
    expect(screen.getByTitle('Web Bookmark')).toBeInTheDocument();
    expect(screen.getByTitle('Image')).toBeInTheDocument();
    expect(screen.getByTitle('Video')).toBeInTheDocument();

    // Undo, Redo, AI
    expect(screen.getByTitle('Undo')).toBeInTheDocument();
    expect(screen.getByTitle('Redo')).toBeInTheDocument();
    expect(screen.getByTitle('Ask AI')).toBeInTheDocument();
  });

  it('opens Insert Block bottom sheet and inserts a block with canonical type when clicked', () => {
    const handleInsert = vi.fn();
    render(
      <MobileEditorToolbar
        onInsertBlock={handleInsert}
        onFormatText={vi.fn()}
        isLocked={false}
      />
    );

    // Open sheet
    fireEvent.click(screen.getByTitle('Insert Block'));

    // Check title in sheet
    expect(screen.getByText('Insert Block', { selector: '.mobile-sheet-title' })).toBeInTheDocument();

    // Verify all canonical types are listed
    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Heading 2')).toBeInTheDocument();
    expect(screen.getByText('Heading 3')).toBeInTheDocument();
    expect(screen.getByText('To-do list')).toBeInTheDocument();
    expect(screen.getByText('Bulleted list')).toBeInTheDocument();
    expect(screen.getByText('Numbered list')).toBeInTheDocument();
    expect(screen.getByText('Toggle list')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Quote')).toBeInTheDocument();
    expect(screen.getByText('Callout')).toBeInTheDocument();
    expect(screen.getByText('Divider')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Math equation')).toBeInTheDocument();
    expect(screen.getByText('Web bookmark')).toBeInTheDocument();

    // Click 'To-do list'
    const todoBtn = screen.getByText('To-do list').closest('button');
    fireEvent.click(todoBtn);

    expect(handleInsert).toHaveBeenCalledWith('to_do', { forceInsert: false });
  });

  it('filters block picker items dynamically by search query', () => {
    render(
      <MobileEditorToolbar
        onInsertBlock={vi.fn()}
        onFormatText={vi.fn()}
        isLocked={false}
      />
    );

    fireEvent.click(screen.getByTitle('Insert Block'));

    const searchInput = screen.getByPlaceholderText('Search blocks...');
    fireEvent.change(searchInput, { target: { value: 'math' } });

    expect(screen.getByText('Math equation')).toBeInTheDocument();
    expect(screen.queryByText('Bulleted list')).not.toBeInTheDocument();
  });

  it('toggles color picker popover and triggers onFormatText color', () => {
    const handleFormat = vi.fn();
    render(
      <MobileEditorToolbar
        onInsertBlock={vi.fn()}
        onFormatText={handleFormat}
        isLocked={false}
      />
    );

    fireEvent.click(screen.getByTitle('Color / Highlight'));

    // Color popover headings
    expect(screen.getByText('Text Color')).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();

    // Select blue color
    const blueBtn = screen.getByTitle('Blue');
    fireEvent.click(blueBtn);

    expect(handleFormat).toHaveBeenCalledWith('color', '#337ea9');
  });

  it('triggers quick block insertion directly from horizontal accessory bar', () => {
    const handleInsert = vi.fn();
    render(
      <MobileEditorToolbar
        onInsertBlock={handleInsert}
        onFormatText={vi.fn()}
        isLocked={false}
      />
    );

    fireEvent.click(screen.getByTitle('Heading 1 (#)'));
    expect(handleInsert).toHaveBeenCalledWith('heading_1');

    fireEvent.click(screen.getByTitle('To-do list ([ ])'));
    expect(handleInsert).toHaveBeenCalledWith('to_do');

    fireEvent.click(screen.getByTitle('Table'));
    expect(handleInsert).toHaveBeenCalledWith('table');
  });
});
