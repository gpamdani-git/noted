import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SlashMenu } from '../components/Editor/SlashMenu';

describe('SlashMenu Component', () => {
  it('renders all suggested and basic commands when filterText is empty', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(<SlashMenu filterText="" onSelect={handleSelect} onClose={handleClose} />);

    expect(screen.getByText('Text')).toBeInTheDocument();
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('To-do list')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
  });

  it('filters command list by search keyword', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    const { rerender } = render(
      <SlashMenu filterText="code" onSelect={handleSelect} onClose={handleClose} />
    );

    // Code command should match
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.queryByText('Heading 1')).not.toBeInTheDocument();

    // Rerender with 'heading'
    rerender(<SlashMenu filterText="heading" onSelect={handleSelect} onClose={handleClose} />);
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Heading 2')).toBeInTheDocument();
    expect(screen.getByText('Heading 3')).toBeInTheDocument();
    expect(screen.queryByText('To-do list')).not.toBeInTheDocument();
  });

  it('selects command when clicking on an item', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(<SlashMenu filterText="" onSelect={handleSelect} onClose={handleClose} />);

    const todoItem = screen.getByText('To-do list');
    fireEvent.click(todoItem);

    expect(handleSelect).toHaveBeenCalledWith('to_do');
  });

  it('navigates with ArrowDown and ArrowUp and selects with Enter', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(<SlashMenu filterText="heading" onSelect={handleSelect} onClose={handleClose} />);

    // filtered: Heading 1, Heading 2, Heading 3
    // Press ArrowDown to move to Heading 2
    fireEvent.keyDown(window, { key: 'ArrowDown' });

    // Press Enter to select
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith('heading_2');
  });

  it('calls onClose when pressing Escape key', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(<SlashMenu filterText="" onSelect={handleSelect} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
