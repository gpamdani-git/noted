import React, { useState } from 'react';
import {
  Columns2,
  Columns3,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  GripVertical
} from 'lucide-react';
import './ColumnListBlock.css';

const DEFAULT_2_COLS = [
  {
    id: 'col-1',
    title: 'Column 1',
    blocks: [
      { id: 'b-col1-1', type: 'heading_3', text: 'Left Column' },
      { id: 'b-col1-2', type: 'paragraph', text: 'Write notes, ideas, or add checklists here.' },
      { id: 'b-col1-3', type: 'to_do', text: 'First column item', checked: false }
    ]
  },
  {
    id: 'col-2',
    title: 'Column 2',
    blocks: [
      { id: 'b-col2-1', type: 'heading_3', text: 'Right Column' },
      { id: 'b-col2-2', type: 'paragraph', text: 'Side-by-side comparison, secondary notes, or links.' },
      { id: 'b-col2-3', type: 'to_do', text: 'Second column item', checked: true }
    ]
  }
];

export const ColumnListBlock = ({
  block,
  onUpdateBlock,
  onTriggerAI,
  isLocked = false
}) => {
  const columns = block.columns && block.columns.length > 0 ? block.columns : DEFAULT_2_COLS;
  const columnCount = block.columnCount || columns.length || 2;
  const [activeColIndex, setActiveColIndex] = useState(0);

  const adjustColHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Update a single block inside a column
  const handleUpdateChildBlock = (colIdx, blockId, patch) => {
    if (isLocked) return;
    const updatedColumns = columns.map((col, idx) => {
      if (idx !== colIdx) return col;
      return {
        ...col,
        blocks: col.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b))
      };
    });
    onUpdateBlock({ columns: updatedColumns });
  };

  // Add a new block inside a column
  const handleAddChildBlock = (colIdx, afterIdx = -1, type = 'paragraph') => {
    if (isLocked) return;
    const newChild = {
      id: `col-b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      text: ''
    };
    if (type === 'to_do') newChild.checked = false;

    const updatedColumns = columns.map((col, idx) => {
      if (idx !== colIdx) return col;
      const newBlocks = [...col.blocks];
      if (afterIdx === -1) {
        newBlocks.push(newChild);
      } else {
        newBlocks.splice(afterIdx + 1, 0, newChild);
      }
      return { ...col, blocks: newBlocks };
    });
    onUpdateBlock({ columns: updatedColumns });
  };

  // Delete a block inside a column
  const handleDeleteChildBlock = (colIdx, blockId) => {
    if (isLocked) return;
    const updatedColumns = columns.map((col, idx) => {
      if (idx !== colIdx) return col;
      const filtered = col.blocks.filter((b) => b.id !== blockId);
      return {
        ...col,
        blocks: filtered.length > 0 ? filtered : [{ id: `col-b-${Date.now()}`, type: 'paragraph', text: '' }]
      };
    });
    onUpdateBlock({ columns: updatedColumns });
  };

  // Handle markdown syntax triggers within column inputs
  const handleChildTextChange = (colIdx, childBlock, newVal) => {
    if (isLocked) return;
    if (childBlock.type === 'paragraph') {
      if (newVal === '# ' || newVal.startsWith('# ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'heading_1', text: newVal.replace(/^#\s*/, '') });
        return;
      }
      if (newVal === '## ' || newVal.startsWith('## ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'heading_2', text: newVal.replace(/^##\s*/, '') });
        return;
      }
      if (newVal === '### ' || newVal.startsWith('### ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'heading_3', text: newVal.replace(/^###\s*/, '') });
        return;
      }
      if (newVal.startsWith('[] ') || newVal.startsWith('[ ] ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'to_do', text: newVal.replace(/^\[\s*\]\s*/, ''), checked: false });
        return;
      }
      if (newVal.startsWith('- ') || newVal.startsWith('* ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'bulleted_list_item', text: newVal.replace(/^[-*]\s+/, '') });
        return;
      }
      if (/^\d+[.)]\s+/.test(newVal)) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'numbered_list_item', text: newVal.replace(/^\d+[.)]\s+/, '') });
        return;
      }
      if (newVal.startsWith('> ')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'quote', text: newVal.replace(/^>\s+/, '') });
        return;
      }
    }
    handleUpdateChildBlock(colIdx, childBlock.id, { text: newVal });
  };

  const handleChildKeyDown = (e, colIdx, blockIdx, childBlock) => {
    if (isLocked) {
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const val = (childBlock.text || '').trim();
      if (val === '' && (childBlock.type === 'to_do' || childBlock.type === 'bulleted_list_item')) {
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'paragraph', text: '' });
        return;
      }
      const nextType = (childBlock.type === 'to_do' || childBlock.type === 'bulleted_list_item')
        ? childBlock.type
        : 'paragraph';
      handleAddChildBlock(colIdx, blockIdx, nextType);
    } else if (e.key === 'Backspace' && (!childBlock.text || childBlock.text === '')) {
      if (childBlock.type !== 'paragraph') {
        e.preventDefault();
        handleUpdateChildBlock(colIdx, childBlock.id, { type: 'paragraph', text: '' });
      } else if (columns[colIdx].blocks.length > 1) {
        e.preventDefault();
        handleDeleteChildBlock(colIdx, childBlock.id);
      }
    }
  };

  // Change column count (2 or 3)
  const setColumnCount = (newCount) => {
    if (isLocked || newCount === columns.length) return;
    let newCols = [...columns];
    if (newCount > columns.length) {
      for (let i = columns.length; i < newCount; i++) {
        newCols.push({
          id: `col-${Date.now()}-${i + 1}`,
          title: `Column ${i + 1}`,
          blocks: [{ id: `col-b-${Date.now()}-${i + 1}`, type: 'paragraph', text: '' }]
        });
      }
    } else {
      newCols = newCols.slice(0, newCount);
    }
    onUpdateBlock({
      columnCount: newCount,
      columns: newCols
    });
  };

  return (
    <div className="column-list-wrapper">
      {/* Top Column Layout Bar */}
      <div className="column-list-toolbar">
        <div className="column-layout-badges">
          <button
            className={`column-tool-btn ${columns.length === 2 ? 'active' : ''}`}
            onClick={() => setColumnCount(2)}
            disabled={isLocked}
            title={isLocked ? "Halaman dikunci" : "2 Columns Layout"}
          >
            <Columns2 size={13} />
            <span>2 Columns</span>
          </button>
          <button
            className={`column-tool-btn ${columns.length === 3 ? 'active' : ''}`}
            onClick={() => setColumnCount(3)}
            disabled={isLocked}
            title={isLocked ? "Halaman dikunci" : "3 Columns Layout"}
          >
            <Columns3 size={13} />
            <span>3 Columns</span>
          </button>
        </div>
        <div className="column-toolbar-hint">
          <span>{isLocked ? '🔒 Dikunci (hanya baca)' : 'Draggable & responsive'}</span>
        </div>
      </div>

      {/* Responsive Columns Grid */}
      <div
        className={`column-grid-layout cols-${columns.length}`}
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
        }}
      >
        {columns.map((col, colIdx) => (
          <div
            key={col.id || `col-${colIdx}`}
            className="column-card-track"
            onClick={() => !isLocked && setActiveColIndex(colIdx)}
          >
            <div className="column-track-header">
              <span className="column-label">Column {colIdx + 1}</span>
              {!isLocked && (
                <button
                  className="column-add-btn"
                  title="Add block in this column"
                  onClick={() => handleAddChildBlock(colIdx, -1, 'paragraph')}
                >
                  <Plus size={12} />
                  <span>Add</span>
                </button>
              )}
            </div>

            <div className="column-blocks-body">
              {col.blocks.map((child, bIdx) => (
                <div key={child.id} className={`column-block-row type-${child.type}`}>
                  {child.type === 'heading_1' && (
                    <textarea
                      ref={(el) => el && adjustColHeight(el)}
                      rows={1}
                      className="col-input col-h1"
                      value={child.text || ''}
                      placeholder={isLocked ? '' : 'Heading 1'}
                      readOnly={isLocked}
                      disabled={isLocked}
                      onInput={(e) => adjustColHeight(e.target)}
                      onChange={(e) => {
                        handleChildTextChange(colIdx, child, e.target.value);
                        adjustColHeight(e.target);
                      }}
                      onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                    />
                  )}
                  {child.type === 'heading_2' && (
                    <textarea
                      ref={(el) => el && adjustColHeight(el)}
                      rows={1}
                      className="col-input col-h2"
                      value={child.text || ''}
                      placeholder={isLocked ? '' : 'Heading 2'}
                      readOnly={isLocked}
                      disabled={isLocked}
                      onInput={(e) => adjustColHeight(e.target)}
                      onChange={(e) => {
                        handleChildTextChange(colIdx, child, e.target.value);
                        adjustColHeight(e.target);
                      }}
                      onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                    />
                  )}
                  {child.type === 'heading_3' && (
                    <textarea
                      ref={(el) => el && adjustColHeight(el)}
                      rows={1}
                      className="col-input col-h3"
                      value={child.text || ''}
                      placeholder={isLocked ? '' : 'Heading 3'}
                      readOnly={isLocked}
                      disabled={isLocked}
                      onInput={(e) => adjustColHeight(e.target)}
                      onChange={(e) => {
                        handleChildTextChange(colIdx, child, e.target.value);
                        adjustColHeight(e.target);
                      }}
                      onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                    />
                  )}
                  {child.type === 'to_do' && (
                    <div className="col-todo-wrap">
                      <input
                        type="checkbox"
                        checked={!!child.checked}
                        disabled={isLocked}
                        onChange={(e) => handleUpdateChildBlock(colIdx, child.id, { checked: e.target.checked })}
                      />
                      <textarea
                        ref={(el) => el && adjustColHeight(el)}
                        rows={1}
                        className={`col-input col-todo-input ${child.checked ? 'completed' : ''}`}
                        value={child.text || ''}
                        placeholder={isLocked ? '' : 'To-do...'}
                        readOnly={isLocked}
                        disabled={isLocked}
                        onInput={(e) => adjustColHeight(e.target)}
                        onChange={(e) => {
                          handleChildTextChange(colIdx, child, e.target.value);
                          adjustColHeight(e.target);
                        }}
                        onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                      />
                    </div>
                  )}
                  {child.type === 'bulleted_list_item' && (
                    <div className="col-bullet-wrap">
                      <span className="col-bullet-dot" />
                      <textarea
                        ref={(el) => el && adjustColHeight(el)}
                        rows={1}
                        className="col-input col-list-input"
                        value={child.text || ''}
                        placeholder={isLocked ? '' : 'List item...'}
                        readOnly={isLocked}
                        disabled={isLocked}
                        onInput={(e) => adjustColHeight(e.target)}
                        onChange={(e) => {
                          handleChildTextChange(colIdx, child, e.target.value);
                          adjustColHeight(e.target);
                        }}
                        onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                      />
                    </div>
                  )}
                  {child.type === 'numbered_list_item' && (
                    <div className="col-bullet-wrap">
                      <span className="col-num-label">
                        {(() => {
                          let count = 1;
                          if (Array.isArray(col.blocks)) {
                            for (let i = bIdx - 1; i >= 0; i--) {
                              if (col.blocks[i]?.type === 'numbered_list_item') {
                                count++;
                              } else {
                                break;
                              }
                            }
                          }
                          return count;
                        })()}.
                      </span>
                      <textarea
                        ref={(el) => el && adjustColHeight(el)}
                        rows={1}
                        className="col-input col-list-input"
                        value={child.text || ''}
                        placeholder={isLocked ? '' : 'Numbered item...'}
                        readOnly={isLocked}
                        disabled={isLocked}
                        onInput={(e) => adjustColHeight(e.target)}
                        onChange={(e) => {
                          handleChildTextChange(colIdx, child, e.target.value);
                          adjustColHeight(e.target);
                        }}
                        onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                      />
                    </div>
                  )}
                  {child.type === 'quote' && (
                    <div className="col-quote-wrap">
                      <textarea
                        ref={(el) => el && adjustColHeight(el)}
                        rows={1}
                        className="col-input col-quote-input"
                        value={child.text || ''}
                        placeholder={isLocked ? '' : 'Quote...'}
                        readOnly={isLocked}
                        disabled={isLocked}
                        onInput={(e) => adjustColHeight(e.target)}
                        onChange={(e) => {
                          handleChildTextChange(colIdx, child, e.target.value);
                          adjustColHeight(e.target);
                        }}
                        onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                      />
                    </div>
                  )}
                  {child.type === 'paragraph' && (
                    <textarea
                      ref={(el) => el && adjustColHeight(el)}
                      rows={1}
                      className="col-input col-paragraph-input"
                      value={child.text || ''}
                      placeholder={isLocked ? '' : "Write in column... (or '#', '[]', '-')"}
                      readOnly={isLocked}
                      disabled={isLocked}
                      onInput={(e) => adjustColHeight(e.target)}
                      onChange={(e) => {
                        handleChildTextChange(colIdx, child, e.target.value);
                        adjustColHeight(e.target);
                      }}
                      onKeyDown={(e) => handleChildKeyDown(e, colIdx, bIdx, child)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
