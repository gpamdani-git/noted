import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, ArrowRight, CornerDownLeft, X } from 'lucide-react';
import './Modals.css';

export const CommandPaletteModal = ({ pages, onSelectPage, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const results = pages.map((page) => {
    const titleMatch = (page.title || '').toLowerCase().includes(query.toLowerCase());
    let matchingBlock = null;

    if (!titleMatch && query) {
      matchingBlock = page.blocks?.find((b) => {
        const text = (b.text || b.code || '').toLowerCase();
        return text.includes(query.toLowerCase());
      });
    }

    const isMatch = !query || titleMatch || !!matchingBlock;
    return {
      page,
      titleMatch,
      matchingBlock,
      isMatch
    };
  }).filter((item) => item.isMatch);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelectPage(results[selectedIndex].page.id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onSelectPage, onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="command-palette-card animate-popover" onClick={(e) => e.stopPropagation()}>
        <div className="command-search-bar">
          <Search size={18} className="search-icon-muted" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Search notes, pages, or blocks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="command-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="command-results-list">
          {results.map((res, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={res.page.id}
                className={`command-result-item ${isSelected ? 'active' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  onSelectPage(res.page.id);
                  onClose();
                }}
              >
                <div className="result-icon">{res.page.icon || '📄'}</div>
                <div className="result-info">
                  <div className="result-title">{res.page.title || 'Untitled'}</div>
                  {res.matchingBlock && (
                    <div className="result-snippet">
                      Matches: "{res.matchingBlock.text || res.matchingBlock.code}"
                    </div>
                  )}
                </div>
                <div className="result-enter-hint">
                  <CornerDownLeft size={12} />
                  <span>Jump</span>
                </div>
              </div>
            );
          })}

          {results.length === 0 && (
            <div className="command-empty-state">
              No matching pages found for "{query}"
            </div>
          )}
        </div>

        <div className="command-footer">
          <span className="footer-shortcut-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
          </span>
          <span className="footer-shortcut-hint">
            <kbd>↵</kbd> to open
          </span>
          <span className="footer-shortcut-hint">
            <kbd>esc</kbd> to dismiss
          </span>
        </div>
      </div>
    </div>
  );
};
