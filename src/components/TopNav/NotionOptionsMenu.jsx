import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Link as LinkIcon,
  Copy,
  Trash2,
  Layout,
  Lock,
  FileDown,
  Download,
  Clock,
  History,
  MessageSquare,
  Check,
  ChevronRight,
  Sun,
  Moon,
  LogIn
} from 'lucide-react';
import './NotionOptionsMenu.css';

export const NotionOptionsMenu = ({
  page,
  onUpdatePage,
  onDuplicatePage,
  onDeletePage,
  onCopyLink,
  onOpenHistory,
  onOpenAnalytics,
  onOpenImport,
  onOpenComments,
  onExportMarkdown,
  onPrintPDF,
  onClose,
  theme,
  onToggleTheme,
  currentUser,
  onOpenLogin
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef(null);

  // Focus search input on mount (desktop only to prevent keyboard popup on mobile)
  useEffect(() => {
    if (inputRef.current && window.innerWidth > 768) {
      inputRef.current.focus();
    }
  }, []);

  const handleCopyLink = () => {
    if (onCopyLink) {
      onCopyLink();
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      onClose();
    }, 1000);
  };

  const handleToggleLock = () => {
    if (onUpdatePage && page) {
      onUpdatePage({ isLocked: !page.isLocked });
    }
  };

  const query = searchQuery.trim().toLowerCase();

  // Definition of action items to support live filtering
  const allActions = [
    {
      id: 'copy-link',
      label: 'Copy link',
      icon: LinkIcon,
      shortcut: '⌘L',
      section: 'actions',
      onClick: handleCopyLink
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      hasChevron: true,
      section: 'actions',
      onClick: () => {
        if (onDuplicatePage && page) onDuplicatePage(page.id);
        onClose();
      }
    },
    {
      id: 'trash',
      label: 'Move to Trash',
      icon: Trash2,
      section: 'actions',
      onClick: () => {
        if (page?.isLocked) {
          alert('Halaman ini sedang dikunci. Silakan buka kunci halaman terlebih dahulu.');
          return;
        }
        if (onDeletePage && page) onDeletePage(page.id);
        onClose();
      }
    },
    {
      id: 'customize-layout',
      label: 'Customize layout (Full width)',
      icon: Layout,
      isToggle: true,
      checked: !!page?.fullWidth,
      section: 'toggles',
      onClick: () => {
        if (onUpdatePage && page) {
          onUpdatePage({ fullWidth: !page.fullWidth });
        }
        onClose();
      }
    },
    {
      id: 'lock-database',
      label: 'Lock page (Read-only)',
      icon: Lock,
      isToggle: true,
      checked: !!page?.isLocked,
      section: 'toggles',
      onClick: handleToggleLock
    },
    {
      id: 'import',
      label: 'Import Markdown / AI Chat',
      icon: Download,
      section: 'data',
      onClick: () => {
        if (onOpenImport) onOpenImport();
        onClose();
      }
    },
    {
      id: 'export',
      label: 'Export Markdown',
      icon: FileDown,
      section: 'data',
      onClick: () => {
        if (onExportMarkdown) onExportMarkdown();
        onClose();
      }
    },
    {
      id: 'updates-analytics',
      label: 'Page analytics & word count',
      icon: Clock,
      section: 'history',
      onClick: () => {
        if (onOpenAnalytics) onOpenAnalytics();
        onClose();
      }
    },
    {
      id: 'version-history',
      label: 'Version history',
      icon: History,
      section: 'history',
      onClick: () => {
        if (onOpenHistory) onOpenHistory();
        onClose();
      }
    },
    {
      id: 'comments',
      label: 'Comments & discussions',
      icon: MessageSquare,
      section: 'preferences',
      onClick: () => {
        if (onOpenComments) onOpenComments();
        onClose();
      }
    },
    {
      id: 'theme',
      label: theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode',
      icon: theme === 'dark' ? Sun : Moon,
      section: 'preferences',
      onClick: () => {
        if (onToggleTheme) onToggleTheme();
        onClose();
      }
    },
    ...(!currentUser?.isLoggedIn && onOpenLogin ? [{
      id: 'login',
      label: 'Log in / Masuk Akun',
      icon: LogIn,
      section: 'account',
      onClick: () => {
        onClose();
        onOpenLogin();
      }
    }] : [])
  ];

  const filteredActions = query
    ? allActions.filter((a) => a.label.toLowerCase().includes(query))
    : allActions;

  return (
    <>
      <div className="notion-options-mobile-backdrop" onClick={onClose} />
      <div className="notion-options-popover animate-popover" onClick={(e) => e.stopPropagation()}>
      {/* 1. Search Bar */}
      <div className="notion-menu-search-wrap">
        <Search size={14} className="notion-menu-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="notion-menu-search-input"
          placeholder="Search actions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="notion-menu-items-list">
        {query ? (
          // Filtered list
          filteredActions.length > 0 ? (
            filteredActions.map((item) => (
              <div
                key={item.id}
                className="notion-menu-row"
                onClick={item.onClick}
              >
                <div className="notion-menu-row-left">
                  <item.icon size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">{item.label}</span>
                </div>
                <div className="notion-menu-row-right">
                  {item.shortcut && <kbd className="notion-shortcut-kbd">{item.shortcut}</kbd>}
                  {item.hasChevron && <ChevronRight size={13} className="notion-chevron-icon" />}
                  {item.badge && <span className="notion-menu-badge">{item.badge}</span>}
                  {item.isToggle && (
                    <span className={`notion-menu-switch ${item.checked ? 'checked' : ''}`}>
                      <span className="switch-knob" />
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="notion-menu-empty">No matching actions</div>
          )
        ) : (
          // Default grouped view matching Notion Desktop screenshot exactly
          <>
            {/* Section 1: Page Actions */}
            <div className="notion-menu-group">
              <div className="notion-menu-row" onClick={handleCopyLink}>
                <div className="notion-menu-row-left">
                  {copiedLink ? (
                    <Check size={15} className="text-green notion-menu-item-icon" />
                  ) : (
                    <LinkIcon size={15} className="notion-menu-item-icon" />
                  )}
                  <span className="notion-menu-item-label">
                    {copiedLink ? 'Link copied!' : 'Copy link'}
                  </span>
                </div>
                <div className="notion-menu-row-right">
                  <kbd className="notion-shortcut-kbd">⌘L</kbd>
                </div>
              </div>

              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onDuplicatePage && page) onDuplicatePage(page.id);
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <Copy size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Duplicate</span>
                </div>
                <div className="notion-menu-row-right">
                  <ChevronRight size={13} className="notion-chevron-icon" />
                </div>
              </div>

              <div
                className="notion-menu-row"
                onClick={() => {
                  if (page?.isLocked) {
                    alert('Halaman ini sedang dikunci. Silakan buka kunci halaman terlebih dahulu.');
                    return;
                  }
                  if (onDeletePage && page) onDeletePage(page.id);
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <Trash2 size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Move to Trash</span>
                </div>
              </div>
            </div>

            <div className="notion-menu-divider" />

            {/* Section 2: Layout & Protection */}
            <div className="notion-menu-group">
              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onUpdatePage && page) {
                    onUpdatePage({ fullWidth: !page.fullWidth });
                  }
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <Layout size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Full width layout</span>
                </div>
                <div className="notion-menu-row-right">
                  <span className={`notion-menu-switch ${page?.fullWidth ? 'checked' : ''}`}>
                    <span className="switch-knob" />
                  </span>
                </div>
              </div>

              <div className="notion-menu-row" onClick={handleToggleLock}>
                <div className="notion-menu-row-left">
                  <Lock size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Lock page</span>
                </div>
                <div className="notion-menu-row-right">
                  <span className={`notion-menu-switch ${page?.isLocked ? 'checked' : ''}`}>
                    <span className="switch-knob" />
                  </span>
                </div>
              </div>
            </div>

            <div className="notion-menu-divider" />

            {/* Section 3: Import & Export */}
            <div className="notion-menu-group">
              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onOpenImport) onOpenImport();
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <Download size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Import Markdown</span>
                </div>
              </div>

              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onExportMarkdown) onExportMarkdown();
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <FileDown size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Export Markdown</span>
                </div>
              </div>
            </div>

            <div className="notion-menu-divider" />

            {/* Section 4: History & Analytics */}
            <div className="notion-menu-group">
              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onOpenAnalytics) onOpenAnalytics();
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <Clock size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Page analytics</span>
                </div>
              </div>

              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onOpenHistory) onOpenHistory();
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <History size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Version history</span>
                </div>
              </div>
            </div>

            <div className="notion-menu-divider" />

            {/* Section 5: Comments & Theme */}
            <div className="notion-menu-group">
              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onOpenComments) onOpenComments();
                  onClose();
                }}
              >
                <div className="notion-menu-row-left">
                  <MessageSquare size={15} className="notion-menu-item-icon" />
                  <span className="notion-menu-item-label">Comments & discussions</span>
                </div>
              </div>

              <div
                className="notion-menu-row"
                onClick={() => {
                  if (onToggleTheme) onToggleTheme();
                }}
              >
                <div className="notion-menu-row-left">
                  {theme === 'dark' ? (
                    <Sun size={15} className="notion-menu-item-icon" />
                  ) : (
                    <Moon size={15} className="notion-menu-item-icon" />
                  )}
                  <span className="notion-menu-item-label">
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </span>
                </div>
              </div>

              {!currentUser?.isLoggedIn && onOpenLogin && (
                <div
                  className="notion-menu-row login-menu-row"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  style={{ marginTop: 2, background: 'rgba(35, 131, 226, 0.08)', borderRadius: 6 }}
                >
                  <div className="notion-menu-row-left">
                    <LogIn size={15} className="notion-menu-item-icon" style={{ color: '#2383e2' }} />
                    <span className="notion-menu-item-label" style={{ fontWeight: 600, color: '#2383e2' }}>
                      Log in to Noted
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </>
  );
};
