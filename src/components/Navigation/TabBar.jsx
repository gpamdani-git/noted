import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Check
} from 'lucide-react';
import './TabBar.css';

export const TabBar = ({
  tabs = [],
  pages = [],
  activeTabId,
  activePage,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onReorderTabs,
  onCloseOtherTabs,
  onCloseTabsToRight,
  onDuplicateTab,
  isSidebarCollapsed,
  onToggleSidebar,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward
}) => {
  const [contextMenu, setContextMenu] = useState(null); // { x, y, tabId }
  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);
  const [copiedLinkTabId, setCopiedLinkTabId] = useState(null);

  const tabListRef = useRef(null);
  const contextMenuRef = useRef(null);

  // Close context menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Drag and drop tab reordering handlers
  const handleDragStart = (e, index) => {
    setDraggedTabIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTabIndex !== index) {
      setDragOverTabIndex(index);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedTabIndex === null || draggedTabIndex === dropIndex) return;

    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(draggedTabIndex, 1);
    newTabs.splice(dropIndex, 0, movedTab);

    if (onReorderTabs) {
      onReorderTabs(newTabs);
    }
  };

  const handleDragEnd = () => {
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  // Tab right click context menu
  const handleTabContextMenu = (e, tabId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: e.clientX,
      y: rect.bottom + 2,
      tabId
    });
  };

  // Horizontal mouse wheel scrolling on tab bar
  const handleWheel = (e) => {
    if (tabListRef.current) {
      tabListRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleCopyTabLink = (tabId) => {
    navigator.clipboard.writeText(`${window.location.origin}/#${tabId}`);
    setCopiedLinkTabId(tabId);
    setTimeout(() => {
      setCopiedLinkTabId(null);
      setContextMenu(null);
    }, 1200);
  };

  return (
    <div className="noted-tab-bar" onWheel={handleWheel}>
      {/* Left Strip: Window Nav Buttons + Tabs Strip */}
      <div className="tab-bar-left-zone">
        {/* Sidebar Toggle Button */}
        <button
          className="window-nav-icon-btn"
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Buka Sidebar (⌘\\)' : 'Tutup Sidebar (⌘\\)'}
        >
          <PanelLeft size={15} />
        </button>

        {/* History Navigation Buttons */}
        <div className="window-nav-arrows">
          <button
            className="window-nav-icon-btn arrow-btn"
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Kembali"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="window-nav-icon-btn arrow-btn"
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Maju"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Scrollable Tab Strip */}
        <div className="tab-bar-strip" ref={tabListRef}>
          {tabs.map((tabId, index) => {
            const page = pages.find((p) => p.id === tabId);
            if (!page) return null;

            const isActive = tabId === activeTabId;
            const isDragging = draggedTabIndex === index;
            const isDragOver = dragOverTabIndex === index;

            return (
              <div
                key={tabId}
                id={`tab-item-${tabId}`}
                className={`tab-item ${isActive ? 'active' : ''} ${isDragging ? 'is-dragging' : ''} ${
                  isDragOver ? 'is-drag-over' : ''
                }`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectTab(tabId)}
                onContextMenu={(e) => handleTabContextMenu(e, tabId)}
                title={`${page.title || 'Untitled'} (Tab ${index + 1})`}
              >
                {/* Page Icon */}
                <span className="tab-page-icon">{page.icon || '📄'}</span>

                {/* Page Title */}
                <span className="tab-page-title">{page.title || 'Untitled'}</span>

                {/* Close Tab Button */}
                <button
                  id={`btn-close-tab-${tabId}`}
                  className="tab-close-btn"
                  title="Tutup tab (⌘W)"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabId);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* New Tab Button */}
          <button
            id="btn-add-new-tab"
            className="tab-add-btn"
            onClick={onNewTab}
            title="Buka tab baru (⌘T)"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="tab-context-menu animate-popover"
          style={{
            top: `${contextMenu.y}px`,
            left: `${Math.max(12, Math.min(contextMenu.x, window.innerWidth - 220))}px`
          }}
        >
          <button
            className="tab-context-item"
            onClick={() => {
              onCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            <X size={13} />
            <span>Tutup Tab</span>
            <kbd className="context-kbd">⌘W</kbd>
          </button>
          <button
            className="tab-context-item"
            onClick={() => {
              if (onCloseOtherTabs) onCloseOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
            disabled={tabs.length <= 1}
          >
            <span>Tutup Tab Lainnya</span>
          </button>
          <button
            className="tab-context-item"
            onClick={() => {
              if (onCloseTabsToRight) onCloseTabsToRight(contextMenu.tabId);
              setContextMenu(null);
            }}
            disabled={tabs.indexOf(contextMenu.tabId) === tabs.length - 1}
          >
            <span>Tutup Tab di Sebelah Kanan</span>
          </button>
          <div className="tab-context-divider" />
          <button
            className="tab-context-item"
            onClick={() => {
              if (onDuplicateTab) onDuplicateTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            <Copy size={13} />
            <span>Duplikatkan Tab</span>
          </button>
          <button
            className="tab-context-item"
            onClick={() => handleCopyTabLink(contextMenu.tabId)}
          >
            {copiedLinkTabId === contextMenu.tabId ? (
              <>
                <Check size={13} className="text-green" />
                <span>Tautan Disalin!</span>
              </>
            ) : (
              <>
                <ExternalLink size={13} />
                <span>Salin Tautan Tab</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
