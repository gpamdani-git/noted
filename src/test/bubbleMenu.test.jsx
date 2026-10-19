import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { BubbleMenu } from '../components/Editor/BubbleMenu';

describe('QA Suite 6: Floating Bubble Menu (Notion Desktop Parity)', () => {
  it('does not render when position is null', () => {
    const { container } = render(
      <BubbleMenu position={null} onFormat={vi.fn()} onTriggerAI={vi.fn()} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders at specified coordinates when position is provided', () => {
    const position = { top: 150, left: 240 };
    const { container } = render(
      <BubbleMenu position={position} onFormat={vi.fn()} onTriggerAI={vi.fn()} onClose={vi.fn()} />
    );
    const toolbar = container.querySelector('.bubble-menu-toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar.style.top).toBe('150px');
    expect(toolbar.style.left).toBe('240px');
  });

  it('calls onFormat with "bold" and "italic" when buttons are clicked', () => {
    const onFormat = vi.fn();
    const position = { top: 100, left: 100 };
    const { getByTitle } = render(
      <BubbleMenu position={position} onFormat={onFormat} onTriggerAI={vi.fn()} onClose={vi.fn()} />
    );

    const boldBtn = getByTitle(/Bold/i);
    fireEvent.click(boldBtn);
    expect(onFormat).toHaveBeenCalledWith('bold');

    const italicBtn = getByTitle(/Italic/i);
    fireEvent.click(italicBtn);
    expect(onFormat).toHaveBeenCalledWith('italic');
  });

  it('calls onTriggerAI when Ask AI button is clicked', () => {
    const onTriggerAI = vi.fn();
    const position = { top: 100, left: 100 };
    const { getByTitle } = render(
      <BubbleMenu position={position} onFormat={vi.fn()} onTriggerAI={onTriggerAI} onClose={vi.fn()} />
    );

    const aiBtn = getByTitle(/Ask Hudbird AI/i);
    fireEvent.click(aiBtn);
    expect(onTriggerAI).toHaveBeenCalledTimes(1);
  });

  it('ensures all buttons have onMouseDown preventDefault so browser selection is never lost', () => {
    const position = { top: 100, left: 100 };
    const { getByTitle } = render(
      <BubbleMenu position={position} onFormat={vi.fn()} onTriggerAI={vi.fn()} onClose={vi.fn()} />
    );

    const boldBtn = getByTitle(/Bold/i);
    const defaultPrevented = fireEvent.mouseDown(boldBtn);
    // fireEvent.mouseDown returns false if preventDefault was called!
    expect(defaultPrevented).toBe(false);
  });

  it('opens color palette dropdown and formats with selected color', () => {
    const onFormat = vi.fn();
    const position = { top: 100, left: 100 };
    const { getByTitle, getByText } = render(
      <BubbleMenu position={position} onFormat={onFormat} onTriggerAI={vi.fn()} onClose={vi.fn()} />
    );

    const colorBtn = getByTitle('Color');
    fireEvent.click(colorBtn);

    const blueOption = getByText('Blue');
    expect(blueOption).toBeInTheDocument();
    fireEvent.click(blueOption);

    expect(onFormat).toHaveBeenCalledWith('color', '#337ea9');
  });
});
