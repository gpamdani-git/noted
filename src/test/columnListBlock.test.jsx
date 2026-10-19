import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnListBlock } from '../components/Editor/ColumnListBlock';

describe('ColumnListBlock Component', () => {
  const initialBlock = {
    id: 'col-block-1',
    type: 'column_list_2',
    columnCount: 2,
    columns: [
      {
        id: 'col-1',
        title: 'Left Column',
        blocks: [
          { id: 'b-col1-1', type: 'heading_3', text: 'Left Tasks' },
          { id: 'b-col1-2', type: 'to_do', text: 'Check left unit', checked: false }
        ]
      },
      {
        id: 'col-2',
        title: 'Right Column',
        blocks: [
          { id: 'b-col2-1', type: 'heading_3', text: 'Right Tasks' },
          { id: 'b-col2-2', type: 'to_do', text: 'Check right unit', checked: true }
        ]
      }
    ]
  };

  it('renders columns and child blocks correctly', () => {
    const handleUpdate = vi.fn();
    render(
      <ColumnListBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />
    );

    expect(screen.getByDisplayValue('Left Tasks')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Check left unit')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Right Tasks')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Check right unit')).toBeInTheDocument();
  });

  it('updates text of a child block within a column', () => {
    const handleUpdate = vi.fn();
    render(
      <ColumnListBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />
    );

    const input = screen.getByDisplayValue('Check left unit');
    fireEvent.change(input, { target: { value: 'Updated left unit' } });

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated.columns[0].blocks[1].text).toBe('Updated left unit');
  });

  it('adds a new child block to a column', () => {
    const handleUpdate = vi.fn();
    render(
      <ColumnListBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={false} />
    );

    // Click "Add block in this column"
    const addButtons = screen.getAllByTitle(/Add block in this column/i);
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updated = handleUpdate.mock.calls[0][0];
    expect(updated.columns[0].blocks.length).toBe(3);
  });

  it('prevents modifications when isLocked is true', () => {
    const handleUpdate = vi.fn();
    render(
      <ColumnListBlock block={initialBlock} onUpdateBlock={handleUpdate} isLocked={true} />
    );

    // In locked mode, "Add block in this column" should not be rendered
    expect(screen.queryByTitle(/Add block in this column/i)).not.toBeInTheDocument();

    // Inputs should be readOnly or disabled
    const input = screen.getByDisplayValue('Check left unit');
    fireEvent.change(input, { target: { value: 'Attempted change' } });
    expect(handleUpdate).not.toHaveBeenCalled();
  });
});
