import React, { useState, useEffect, useRef } from 'react';
import { FileText, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import './MentionMenu.css';

export const MentionMenu = ({
  filterText = '',
  pages = [],
  currentPageId = null,
  onSelectPage,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const cleanQuery = (filterText || '').toLowerCase().trim();

  // Filter available pages (excluding current page)
  const matchingPages = pages.filter((p) => {
    if (p.id === currentPageId) return false;
    if (!cleanQuery) return true;
    return (
      (p.title || '').toLowerCase().includes(cleanQuery) ||
      (p.id || '').toLowerCase().includes(cleanQuery)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (matchingPages.length === 0) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % matchingPages.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + matchingPages.length) % matchingPages.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (matchingPages[selectedIndex]) {
          onSelectPage(matchingPages[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchingPages, selectedIndex, onSelectPage, onClose]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  return (
    <div className="mention-menu-popover animate-popover" ref={menuRef}>
      <div className="mention-menu-header">
        <span className="mention-header-title">Link to an internal page</span>
        <span className="mention-header-hint">
          <kbd>↑↓</kbd> to navigate, <kbd>↵</kbd> to select
        </span>
      </div>

      <div className="mention-pages-list">
        {matchingPages.length > 0 ? (
          matchingPages.map((page, idx) => (
            <div
              key={page.id}
              className={`mention-page-item ${idx === selectedIndex ? 'active' : ''}`}
              onClick={() => onSelectPage(page)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="mention-item-left">
                <span className="mention-item-icon">{page.icon || '📄'}</span>
                <div className="mention-item-info">
                  <span className="mention-item-title">{page.title || 'Untitled'}</span>
                  <span className="mention-item-sub">
                    {page.blocks?.length || 0} blocks • Workspace
                  </span>
                </div>
              </div>
              <CornerDownLeft size={12} className="mention-enter-hint" />
            </div>
          ))
        ) : (
          <div className="mention-empty-state">
            <span>No matching pages found for "{filterText}"</span>
          </div>
        )}
      </div>
    </div>
  );
};
