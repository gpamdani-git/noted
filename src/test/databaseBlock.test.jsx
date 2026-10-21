import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatabaseBlock, PROPERTY_TYPES, STATUS_OPTIONS } from '../components/Editor/DatabaseBlock';

describe('DatabaseBlock Component', () => {
  const initialBlock = {
    id: 'db-1',
    type: 'database',
    title: 'Product Roadmap & Tasks',
    headers: ['Task Name', 'Status', 'Assignee', 'Due Date'],
    columnTypes: ['text', 'status', 'text', 'date'],
    rows: [
      ['Design System Alignment', 'In progress', 'Dani', '2026-10-25'],
      ['Database Views QA', 'Not started', 'Alex', '2026-10-30'],
      ['Markdown Engine Audit', 'Done', 'Dani', '2026-10-18']
    ]
  };

  it('exposes defined property types and status options', () => {
    expect(PROPERTY_TYPES).toBeDefined();
    expect(PROPERTY_TYPES.length).toBeGreaterThanOrEqual(6);
    const typeIds = PROPERTY_TYPES.map((t) => t.id);
    expect(typeIds).toContain('text');
    expect(typeIds).toContain('status');
    expect(typeIds).toContain('multi_select');
    expect(typeIds).toContain('date');
    expect(typeIds).toContain('number');
    expect(typeIds).toContain('checkbox');

    expect(STATUS_OPTIONS.length).toBeGreaterThanOrEqual(4);
    const labels = STATUS_OPTIONS.map((s) => s.label);
    expect(labels).toContain('Not started');
    expect(labels).toContain('In progress');
    expect(labels).toContain('Done');
  });

  it('renders table headers and row data correctly', () => {
    const handleUpdate = vi.fn();
    render(<DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />);

    // Header inputs
    expect(screen.getByDisplayValue('Task Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Assignee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Due Date')).toBeInTheDocument();

    // Row cell inputs
    expect(screen.getByDisplayValue('Design System Alignment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Database Views QA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Markdown Engine Audit')).toBeInTheDocument();
  });

  it('switches between view modes (Table, Board grouped by the status column, Gallery)', () => {
    const handleUpdate = vi.fn();
    const { rerender } = render(
      <DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />
    );

    // Switch to the board (Kanban) view, grouped by the Status column
    const boardTab = screen.getByTitle('Grouped by Status (Board view)');
    fireEvent.click(boardTab);

    expect(handleUpdate).toHaveBeenCalledWith('db-1', { viewType: 'board' });

    // Rerender with board view
    rerender(
      <DatabaseBlock
        block={{ ...initialBlock, viewType: 'board' }}
        onUpdateBlock={handleUpdate}
        isLocked={false}
      />
    );

    // Board columns group by unique statuses from rows
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();

    // Switch to Gallery view
    const galleryTab = screen.getByTitle('Cover layout (Gallery view)');
    fireEvent.click(galleryTab);
    expect(handleUpdate).toHaveBeenCalledWith('db-1', { viewType: 'gallery' });

    // Rerender with gallery view
    rerender(
      <DatabaseBlock
        block={{ ...initialBlock, viewType: 'gallery' }}
        onUpdateBlock={handleUpdate}
        isLocked={false}
      />
    );
    expect(screen.getByText('Design System Alignment')).toBeInTheDocument();
  });

  it('adds a new row to the database', () => {
    const handleUpdate = vi.fn();
    render(<DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />);

    // Click "New" or "+ New Page" button
    const newButtons = screen.getAllByRole('button', { name: /New/i });
    expect(newButtons.length).toBeGreaterThan(0);
    fireEvent.click(newButtons[0]);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const [blockId, patch] = handleUpdate.mock.calls[0];
    expect(blockId).toBe('db-1');
    expect(patch.rows).toBeDefined();
    expect(patch.rows.length).toBe(initialBlock.rows.length + 1);
  });

  it('filters rows based on instant search query', () => {
    const handleUpdate = vi.fn();
    render(<DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Audit' } });

    // Only 'Markdown Engine Audit' should match
    expect(screen.getByDisplayValue('Markdown Engine Audit')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Design System Alignment')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Database Views QA')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByDisplayValue('Design System Alignment')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Database Views QA')).toBeInTheDocument();
  });

  it('prevents modifications when isLocked is true', () => {
    const handleUpdate = vi.fn();
    render(<DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={true} />);

    // In locked mode, "+ New" should be disabled or not call update
    const newButtons = screen.queryAllByRole('button', { name: /New/i });
    newButtons.forEach((btn) => {
      fireEvent.click(btn);
    });
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it('opens Sort by Property popover with Ascending and Descending direction buttons', () => {
    const handleUpdate = vi.fn();
    const { container } = render(
      <DatabaseBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />
    );

    const sortBtn = screen.getByRole('button', { name: /Sort/i });
    fireEvent.click(sortBtn);

    const sortPopover = container.querySelector('.db-sort-popover');
    expect(sortPopover).toBeTruthy();
    expect(screen.getByText('Sort by Property')).toBeInTheDocument();
    expect(screen.getByText('Ascending')).toBeInTheDocument();
    expect(screen.getByText('Descending')).toBeInTheDocument();
  });
});
