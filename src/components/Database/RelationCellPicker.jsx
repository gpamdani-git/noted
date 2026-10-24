import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, Database, ExternalLink, Plus } from 'lucide-react';
import './DatabaseViews.css';

const RelationCellPicker = ({
  targetDatabase,
  selectedItems = [],
  onToggleItem,
  onClose,
  triggerRect = null
}) => {
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const targetRows = targetDatabase?.rows || [];
  const filteredRows = targetRows.filter(r => {
    const title = String(r[0] || 'Untitled');
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const searchTrimmed = search.trim();
  const exactMatchExists = targetRows.some(
    r => String(r[0] || '').toLowerCase() === searchTrimmed.toLowerCase()
  );

  const popoverWidth = 260;
  const popoverHeight = 280;
  let dynamicStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: `${popoverWidth}px`,
    zIndex: 1300,
    boxShadow: 'var(--shadow-popover)'
  };

  if (triggerRect && typeof window !== 'undefined') {
    const left = Math.max(12, Math.min(triggerRect.left, window.innerWidth - popoverWidth - 12));
    const top = (triggerRect.bottom + popoverHeight > window.innerHeight && triggerRect.top > popoverHeight)
      ? Math.max(10, triggerRect.top - popoverHeight - 4)
      : triggerRect.bottom + 4;
    dynamicStyle = {
      position: 'fixed',
      top,
      left,
      width: `${popoverWidth}px`,
      zIndex: 1300,
      boxShadow: 'var(--shadow-popover)'
    };
  }

  const popoverContent = (
    <div
      ref={popoverRef}
      className="db-modal-card animate-popover"
      style={dynamicStyle}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="relation-search-box" style={{ padding: '6px 10px' }}>
        <Search size={13} />
        <input
          type="text"
          placeholder={`Search ${targetDatabase?.name || 'items'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="relation-search-input"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="db-modal-close-btn"
            style={{ width: 18, height: 18 }}
          >
            <X size={11} />
          </button>
        )}
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px' }}>
        {filteredRows.length === 0 && !searchTrimmed ? (
          <div style={{ padding: '12px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
            No items in {targetDatabase?.name || 'database'}
          </div>
        ) : (
          filteredRows.map((r, i) => {
            const title = String(r[0] || `Item ${i + 1}`);
            const isSelected = selectedItems.includes(title);
            return (
              <button
                key={i}
                type="button"
                onClick={() => onToggleItem(title)}
                className={`relation-db-item ${isSelected ? 'selected' : ''}`}
                style={{ padding: '5px 8px', borderRadius: 4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: isSelected ? '1px solid var(--accent, #2383e2)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--accent, #2383e2)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {title}
                  </span>
                </div>
              </button>
            );
          })
        )}

        {/* Notion parity: Create [search] if typed and not already in list */}
        {searchTrimmed && !exactMatchExists && (
          <button
            type="button"
            onClick={() => {
              onToggleItem(searchTrimmed);
              setSearch('');
            }}
            className="relation-db-item"
            style={{ padding: '6px 8px', borderRadius: 4, color: 'var(--accent, #2383e2)', borderTop: '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                Link "{searchTrimmed}"
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popoverContent, document.body) : popoverContent;
};

export default RelationCellPicker;

