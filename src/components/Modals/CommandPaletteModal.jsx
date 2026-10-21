import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, CornerDownLeft, X } from 'lucide-react';
import './Modals.css';

/**
 * The palette lists the workspace pages and the commands of the app.
 * A command is an object of the shape
 *   { id, title, section, icon, keywords, run }
 * where run is called when the entry is chosen.
 */
export const CommandPaletteModal = ({ pages, onSelectPage, onClose, commands = [] }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const cleanQuery = query.toLowerCase().trim();

  const pageResults = useMemo(() => {
    return pages
      .map((page) => {
        const titleMatch = (page.title || '').toLowerCase().includes(cleanQuery);
        let matchingBlock = null;

        if (!titleMatch && cleanQuery) {
          matchingBlock = page.blocks?.find((b) => {
            const text = (b.text || b.code || '').toLowerCase();
            return text.includes(cleanQuery);
          });
        }

        const isMatch = !cleanQuery || titleMatch || !!matchingBlock;
        return { page, titleMatch, matchingBlock, isMatch };
      })
      .filter((item) => item.isMatch);
  }, [pages, cleanQuery]);

  const commandResults = useMemo(() => {
    return commands.filter((cmd) => {
      if (!cleanQuery) return true;
      return (
        cmd.title.toLowerCase().includes(cleanQuery) ||
        (cmd.keywords || []).some((k) => k.toLowerCase().includes(cleanQuery))
      );
    });
  }, [commands, cleanQuery]);

  // The two lists share one cursor so the arrow keys move through both
  const entries = useMemo(
    () => [
      ...commandResults.map((cmd) => ({ kind: 'command', id: cmd.id, command: cmd })),
      ...pageResults.map((res) => ({ kind: 'page', id: res.page.id, result: res }))
    ],
    [commandResults, pageResults]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (entries.length > 0 ? (prev + 1) % entries.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (entries.length > 0 ? (prev - 1 + entries.length) % entries.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const entry = entries[selectedIndex];
        if (!entry) return;
        if (entry.kind === 'command') {
          entry.command.run();
        } else {
          onSelectPage(entry.result.page.id);
        }
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entries, selectedIndex, onSelectPage, onClose]);

  const runEntry = (entry) => {
    if (entry.kind === 'command') {
      entry.command.run();
    } else {
      onSelectPage(entry.result.page.id);
    }
    onClose();
  };

  let cursor = -1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="command-palette-card animate-popover" onClick={(e) => e.stopPropagation()}>
        <div className="command-search-bar">
          <Search size={18} className="search-icon-muted" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Search pages or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search pages or run a command"
          />
          <button className="command-close-btn" onClick={onClose} aria-label="Close the command palette">
            <X size={16} />
          </button>
        </div>

        <div className="command-results-list">
          {commandResults.length > 0 && (
            <div className="command-section-header">Actions</div>
          )}
          {commandResults.map((cmd) => {
            cursor += 1;
            const idx = cursor;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={`cmd-${cmd.id}`}
                className={`command-result-item ${isSelected ? 'active' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => runEntry({ kind: 'command', command: cmd })}
              >
                <div className="result-icon">{cmd.icon || '⚡'}</div>
                <div className="result-info">
                  <div className="result-title">{cmd.title}</div>
                  {cmd.section && <div className="result-snippet">{cmd.section}</div>}
                </div>
                <div className="result-enter-hint">
                  <CornerDownLeft size={12} />
                  <span>Run</span>
                </div>
              </div>
            );
          })}

          {pageResults.length > 0 && (
            <div className="command-section-header">Pages</div>
          )}
          {pageResults.map((res) => {
            cursor += 1;
            const idx = cursor;
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={res.page.id}
                className={`command-result-item ${isSelected ? 'active' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => runEntry({ kind: 'page', result: res })}
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

          {entries.length === 0 && (
            <div className="command-empty-state">
              No matching pages or commands found for "{query}"
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
