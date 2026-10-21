import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlockRichText, BlockItem } from '../components/Editor/BlockItem';
import { shouldUseNativeGoogleAuth, isMobileNativeApp } from '../utils/auth';

describe('Mobile Editor Experience (Notion Mobile REA)', () => {
  it('synchronously clears is-empty class and sets data-empty to false on typing', () => {
    const handleUpdateText = vi.fn();
    const { container } = render(
      <BlockRichText
        text=""
        placeholder="List item..."
        onUpdateText={handleUpdateText}
      />
    );

    const editable = container.querySelector('.block-rich-text');
    expect(editable).toHaveClass('is-empty');
    expect(editable.getAttribute('data-empty')).toBe('true');

    // Simulate typing "A" on mobile soft keyboard (beforeinput + input)
    editable.dispatchEvent(new Event('beforeinput', { bubbles: true }));
    editable.textContent = 'A';
    editable.innerText = 'A';
    fireEvent.input(editable);

    // Placeholder must immediately be hidden and empty state cleared
    expect(editable).not.toHaveClass('is-empty');
    expect(editable.getAttribute('data-empty')).toBe('false');
    expect(handleUpdateText).toHaveBeenCalledWith('A', 'A');
  });

  it('immediately creates a new bullet list item on first Enter when text is present in the DOM', () => {
    const handleAddBlockBelow = vi.fn();
    const handleUpdateBlock = vi.fn();

    const block = {
      id: 'b1',
      type: 'bulleted_list_item',
      text: '' // Initially empty in state, but user just typed 'A' into DOM
    };

    const { container } = render(
      <BlockItem
        block={block}
        index={0}
        totalBlocks={1}
        onUpdateBlock={handleUpdateBlock}
        onAddBlockBelow={handleAddBlockBelow}
        onDeleteBlock={vi.fn()}
        onDuplicateBlock={vi.fn()}
        onMoveBlock={vi.fn()}
      />
    );

    const editable = container.querySelector('.block-rich-text');
    editable.textContent = 'A';
    editable.innerText = 'A';

    // Press Enter once
    fireEvent.keyDown(editable, { key: 'Enter', code: 'Enter', keyCode: 13 });

    // Must immediately add bulleted_list_item below without requiring a second Enter
    expect(handleAddBlockBelow).toHaveBeenCalledWith(0, 'bulleted_list_item');
    expect(handleUpdateBlock).toHaveBeenCalledWith('b1', { text: 'A' });
  });

  it('keeps Google Identity Services on a normal web origin and uses native auth only in a native runtime', () => {
    // JSDOM runs on http://localhost:3000, which is a normal web context.
    // It must not be mistaken for a native runtime, otherwise the Google
    // Identity Services button is hidden on the dev server.
    expect(isMobileNativeApp()).toBe(false);
    expect(shouldUseNativeGoogleAuth()).toBe(false);

    // A real native runtime (Capacitor) enables the direct native auth path
    window.Capacitor = { isNativePlatform: () => true };
    expect(isMobileNativeApp()).toBe(true);
    expect(shouldUseNativeGoogleAuth()).toBe(true);
    delete window.Capacitor;
  });
});
