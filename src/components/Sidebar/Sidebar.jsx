import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  FileText,
  Trash2,
  Archive,
  MoreHorizontal,
  Copy,
  Sun,
  Moon,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  CornerUpLeft,
  ExternalLink,
  Download,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Check,
  UserPlus,
  Globe
} from 'lucide-react';
import { getSavedAccounts, switchAccount } from '../../utils/auth';
import './Sidebar.css';

const MIN_SIDEBAR_WIDTH = 260;
const MAX_SIDEBAR_WIDTH = 520;
const DEFAULT_SIDEBAR_WIDTH = 260;

export const Sidebar = ({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
  onToggleFavorite,
  onOpenSearch,
  onOpenSettings,
  onOpenTrash,
  trashCount,
  onOpenArchive,
  archivedCount = 0,
  theme,
  onToggleTheme,
  isCollapsed,
  onToggleCollapse,
  onOpenImportModal,
  onReorderPages,
  onMovePageOrder,
  onMovePageToParent,
  onOpenInNewTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenWebsite
}) => {
  const [expandedPages, setExpandedPages] = useState({ 'page-projects': true });
  const [activeMenuPageId, setActiveMenuPageId] = useState(null);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isFavoritesCollapsed, setIsFavoritesCollapsed] = useState(false);
  const [isPrivateCollapsed, setIsPrivateCollapsed] = useState(false);
  const workspaceMenuRef = useRef(null);

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('noted_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleStartResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const clientX = moveEvent.clientX;
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX));
      setSidebarWidth(newWidth);
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    };

    const handleMouseUp = (upEvent) => {
      isResizingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const clientX = upEvent.clientX;
      const finalWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, clientX));
      setSidebarWidth(finalWidth);
      document.documentElement.style.setProperty('--sidebar-width', `${finalWidth}px`);
      try {
        localStorage.setItem('noted_sidebar_width', String(finalWidth));
      } catch (err) {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetWidth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    document.documentElement.style.setProperty('--sidebar-width', `${DEFAULT_SIDEBAR_WIDTH}px`);
    try {
      localStorage.setItem('noted_sidebar_width', String(DEFAULT_SIDEBAR_WIDTH));
    } catch (err) {}
  };

  // Close workspace popover when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    if (isWorkspaceMenuOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isWorkspaceMenuOpen]);

  // Drag & Drop Reordering and Hierarchy State
  const [draggedPageId, setDraggedPageId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const handleDragStart = (e, pageId) => {
    e.stopPropagation();
    setDraggedPageId(pageId);
    e.dataTransfer.setData('text/plain', pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetPage) => {
    if (!draggedPageId || draggedPageId === targetPage.id) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let position = 'inside';
    if (offsetY < height * 0.28) {
      position = 'before';
    } else if (offsetY > height * 0.72) {
      position = 'after';
    }

    setDropTarget({ pageId: targetPage.id, position });
  };

  const handleDragLeave = (e, pageId) => {
    e.stopPropagation();
    if (dropTarget?.pageId === pageId) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e, targetPage) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedPageId || draggedPageId === targetPage.id) {
      setDraggedPageId(null);
      setDropTarget(null);
      return;
    }

    const pos = dropTarget?.position || 'after';
    if (onReorderPages) {
      onReorderPages(draggedPageId, targetPage.id, pos);
    }

    if (pos === 'inside') {
      setExpandedPages((prev) => ({ ...prev, [targetPage.id]: true }));
    }

    setDraggedPageId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
    setDropTarget(null);
  };

  const toggleExpand = (pageId, e) => {
    e.stopPropagation();
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const handlePageClick = (pageId, e) => {
    if (e && (e.metaKey || e.ctrlKey)) {
      if (onOpenInNewTab) onOpenInNewTab(pageId);
      return;
    }
    onSelectPage(pageId);
    if (window.innerWidth <= 900 && !isCollapsed) {
      onToggleCollapse();
    }
  };

  const rootPages = pages.filter((p) => !p.parentId);
  const favoritePages = pages.filter((p) => p.isFavorite);

  const renderPageItem = (page, depth = 0) => {
    const isExpanded = !!expandedPages[page.id];
    const isActive = page.id === activePageId;
    const childPages = pages.filter((p) => p.parentId === page.id);
    const hasChildren = childPages.length > 0;

    const isDropTarget = dropTarget?.pageId === page.id;
    const dropPosClass = isDropTarget ? `drop-target-${dropTarget.position}` : '';
    const isDraggingClass = draggedPageId === page.id ? 'is-dragging' : '';

    return (
      <div key={page.id} className="sidebar-tree-node">
        <div
          className={`sidebar-page-item ${isActive ? 'active' : ''} ${dropPosClass} ${isDraggingClass}`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={(e) => handlePageClick(page.id, e)}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, page.id)}
          onDragOver={(e) => handleDragOver(e, page)}
          onDragLeave={(e) => handleDragLeave(e, page.id)}
          onDrop={(e) => handleDrop(e, page)}
          onDragEnd={handleDragEnd}
        >
          {/* Unified Lead Container: Icon by default, Chevron toggle on hover */}
          <div
            className="sidebar-page-lead"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(page.id, e);
            }}
          >
            <span className="page-icon-span">{page.icon || '📄'}</span>
            <button
              type="button"
              className="page-caret-btn"
              onClick={(e) => toggleExpand(page.id, e)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>

          {/* Page Title */}
          <span className="page-title-text">{page.title || 'Untitled'}</span>

          {/* Locked Badge */}
          {page.isLocked && (
            <span className="page-lock-indicator" title="Halaman dikunci (Read-Only)">
              <Lock size={12} className="sidebar-lock-icon" />
            </span>
          )}

          {/* Hover Action Buttons */}
          <div className="page-hover-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="page-hover-btn"
              title="More options"
              onClick={() =>
                setActiveMenuPageId(activeMenuPageId === page.id ? null : page.id)
              }
            >
              <MoreHorizontal size={13} />
            </button>

            <button
              className="page-hover-btn"
              title="Add subpage"
              onClick={() => onCreatePage(page.id)}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Page Context Menu Popover */}
          {activeMenuPageId === page.id && (
            <div
              className="page-item-menu animate-popover"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="page-menu-option"
                onClick={() => {
                  onToggleFavorite(page.id);
                  setActiveMenuPageId(null);
                }}
              >
                <Star size={14} className={page.isFavorite ? 'text-yellow' : ''} />
                <span>{page.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
              </button>
              <button
                className="page-menu-option"
                onClick={() => {
                  onDuplicatePage(page.id);
                  setActiveMenuPageId(null);
                }}
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>
              <button
                className="page-menu-option"
                onClick={() => {
                  if (onOpenInNewTab) onOpenInNewTab(page.id);
                  setActiveMenuPageId(null);
                }}
              >
                <ExternalLink size={14} />
                <span>Open in New Tab</span>
              </button>
              <div className="menu-divider" />
              <button
                className="page-menu-option"
                onClick={() => {
                  if (onMovePageOrder) onMovePageOrder(page.id, 'up');
                  setActiveMenuPageId(null);
                }}
              >
                <ArrowUp size={14} />
                <span>Move Up</span>
              </button>
              <button
                className="page-menu-option"
                onClick={() => {
                  if (onMovePageOrder) onMovePageOrder(page.id, 'down');
                  setActiveMenuPageId(null);
                }}
              >
                <ArrowDown size={14} />
                <span>Move Down</span>
              </button>
              {page.parentId && (
                <button
                  className="page-menu-option"
                  onClick={() => {
                    if (onMovePageToParent) onMovePageToParent(page.id, null);
                    setActiveMenuPageId(null);
                  }}
                >
                  <CornerUpLeft size={14} />
                  <span>Move out to Workspace</span>
                </button>
              )}
              <div className="menu-divider" />
              <button
                className={`page-menu-option delete-option ${page.isLocked ? 'locked-disabled' : ''}`}
                onClick={() => {
                  if (page.isLocked) {
                    alert('Halaman ini sedang dikunci. Silakan buka kunci halaman terlebih dahulu sebelum menghapusnya.');
                    return;
                  }
                  onDeletePage(page.id);
                  setActiveMenuPageId(null);
                }}
              >
                <Trash2 size={14} />
                <span>{page.isLocked ? 'Dikunci' : 'Delete'}</span>
              </button>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="sidebar-subpages">
            {hasChildren ? (
              childPages.map((child) => renderPageItem(child, depth + 1))
            ) : (
              <div
                className="sidebar-empty-subpages-hint"
                style={{ paddingLeft: `${(depth + 1) * 14 + 8}px` }}
              >
                No pages inside
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!isCollapsed && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onToggleCollapse}
        />
      )}
      <aside className={`noted-sidebar ${isCollapsed ? 'collapsed' : ''} ${isResizing ? 'is-resizing' : ''}`}>
        {/* Workspace Profile Header ala Notion Desktop */}
        <div className="sidebar-header" ref={workspaceMenuRef}>
          <div
            className="workspace-profile-btn"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            title="Workspace & Account"
          >
            <div className="workspace-avatar-notion">
              {currentUser?.picture ? (
                <img
                  src={currentUser.picture}
                  alt=""
                  className="workspace-user-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span
                className="workspace-avatar-letter"
                style={{
                  backgroundColor: currentUser?.color || '#2383e2',
                  display: currentUser?.picture ? 'none' : 'flex'
                }}
              >
                {currentUser?.avatar || currentUser?.name?.[0] || 'U'}
              </span>
            </div>
            <span className="workspace-name-notion">
              {currentUser?.isLoggedIn ? `${currentUser.name}'s Workspace` : 'Noted Workspace'}
            </span>
            <ChevronDown size={13} className={`workspace-chevron ${isWorkspaceMenuOpen ? 'open' : ''}`} />
          </div>

          {/* Notion-style Workspace Account Dropdown */}
          {isWorkspaceMenuOpen && (
            <div className="workspace-menu-popover animate-popover">
              <div className="workspace-popover-user-card">
                <div className="popover-user-avatar">
                  {currentUser?.picture ? (
                    <img
                      src={currentUser.picture}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span
                    style={{
                      backgroundColor: currentUser?.color || '#2383e2',
                      display: currentUser?.picture ? 'none' : 'flex'
                    }}
                  >
                    {currentUser?.avatar || currentUser?.name?.[0] || '💼'}
                  </span>
                </div>
                <div className="popover-user-details">
                  <div className="popover-user-name">{currentUser?.name || 'Guest User'}</div>
                  <div className="popover-user-email">
                    {currentUser?.email || 'Local offline workspace'}
                  </div>
                  <div className="popover-user-badge">
                    {currentUser?.isLoggedIn ? (
                      <span className="badge-logged-in">
                        <Check size={10} /> {currentUser.loginProvider === 'google' ? 'Google Account' : 'Signed In'}
                      </span>
                    ) : (
                      <span className="badge-guest">Offline Guest Mode</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="workspace-menu-divider" />

              {/* Account Switcher Section ala Notion */}
              {(() => {
                const allSaved = getSavedAccounts();
                const otherAccounts = allSaved.filter((acc) => acc.id !== currentUser?.id);
                const hasSwitchOptions = otherAccounts.length > 0 || (currentUser?.isLoggedIn);

                if (!hasSwitchOptions) return null;

                return (
                  <div className="workspace-accounts-section">
                    <div className="workspace-accounts-heading">Beralih Workspace</div>
                    {currentUser?.isLoggedIn && (
                      <button
                        className="workspace-popover-item account-switch-item"
                        onClick={() => {
                          setIsWorkspaceMenuOpen(false);
                          switchAccount('guest');
                        }}
                      >
                        <div className="popover-mini-avatar guest-avatar">💼</div>
                        <div className="popover-mini-info">
                          <span className="popover-mini-name">Guest Workspace</span>
                          <span className="popover-mini-sub">Local offline</span>
                        </div>
                      </button>
                    )}
                    {otherAccounts.map((acc) => (
                      <button
                        key={acc.id}
                        className="workspace-popover-item account-switch-item"
                        onClick={() => {
                          setIsWorkspaceMenuOpen(false);
                          switchAccount(acc.id);
                        }}
                      >
                        <div className="popover-mini-avatar">
                          {acc.picture ? (
                            <img
                              src={acc.picture}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <span
                            style={{
                              backgroundColor: acc.color || '#2383e2',
                              display: acc.picture ? 'none' : 'flex'
                            }}
                          >
                            {acc.avatar || acc.name?.[0] || 'U'}
                          </span>
                        </div>
                        <div className="popover-mini-info">
                          <span className="popover-mini-name">{acc.name}</span>
                          <span className="popover-mini-sub">{acc.email}</span>
                        </div>
                      </button>
                    ))}
                    <div className="workspace-menu-divider" />
                  </div>
                );
              })()}

              {currentUser?.isLoggedIn ? (
                <>
                  <button
                    className="workspace-popover-item"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onOpenLogin();
                    }}
                  >
                    <UserPlus size={14} className="text-muted" />
                    <span>Tambah Akun Lain</span>
                  </button>
                  <button
                    className="workspace-popover-item"
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={14} className="text-muted" />
                    <span>Log out</span>
                  </button>
                </>
              ) : (
                <button
                  className="workspace-popover-item primary-action"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    onOpenLogin();
                  }}
                >
                  <svg className="google-g-mini" width="14" height="14" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Log in with Google</span>
                </button>
              )}

              <button
                className="workspace-popover-item"
                onClick={() => {
                  setIsWorkspaceMenuOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings size={14} className="text-muted" />
                <span>Settings & Preferences</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Search Bar matching Notion Desktop */}
        <div className="sidebar-search-section">
          <button
            className="sidebar-search-bar-btn"
            onClick={onOpenSearch}
            title="Search (⌘K)"
          >
            <Search size={14} className="sidebar-search-icon" />
            <span className="sidebar-search-placeholder">Search</span>
            <kbd className="sidebar-search-kbd">⌘K</kbd>
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="sidebar-scrollable-content">
          {/* Section: Favorites - preserved ala Notion Desktop spec */}
          <div className="sidebar-section favorites-section">
            <div
              className="sidebar-section-header"
              onClick={() => setIsFavoritesCollapsed((prev) => !prev)}
            >
              <div className="sidebar-section-header-left">
                <button
                  type="button"
                  className={`section-caret-btn ${isFavoritesCollapsed ? 'is-collapsed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFavoritesCollapsed((prev) => !prev);
                  }}
                  title={isFavoritesCollapsed ? 'Expand Favorites' : 'Collapse Favorites'}
                >
                  {isFavoritesCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
                <span className="sidebar-section-title">Favorites</span>
              </div>
            </div>
            {!isFavoritesCollapsed && (
              <div className="sidebar-pages-list">
                {favoritePages.length > 0 ? (
                  favoritePages.map((favPage) => {
                    const childPages = pages.filter((p) => p.parentId === favPage.id);
                    const hasChildren = childPages.length > 0;
                    const isExpanded = !!expandedPages[`fav-${favPage.id}`];

                    return (
                      <React.Fragment key={`fav-${favPage.id}`}>
                        <div
                          className={`sidebar-page-item favorite-item ${
                            favPage.id === activePageId ? 'active' : ''
                          }`}
                          style={{ paddingLeft: '8px' }}
                          onClick={(e) => handlePageClick(favPage.id, e)}
                        >
                          <div
                            className="sidebar-page-lead"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPages((prev) => ({
                                ...prev,
                                [`fav-${favPage.id}`]: !prev[`fav-${favPage.id}`],
                              }));
                            }}
                          >
                            <span className="page-icon-span">{favPage.icon || '📄'}</span>
                            <button
                              type="button"
                              className="page-caret-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedPages((prev) => ({
                                  ...prev,
                                  [`fav-${favPage.id}`]: !prev[`fav-${favPage.id}`],
                                }));
                              }}
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          </div>

                          <span className="page-title-text">{favPage.title || 'Untitled'}</span>

                          <div className="page-hover-actions">
                            <button
                              type="button"
                              className="page-hover-btn"
                              title="Remove from favorites"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(favPage.id);
                              }}
                            >
                              <Star size={13} className="text-yellow star-filled" />
                            </button>
                            <button
                              type="button"
                              className="page-hover-btn"
                              title="More actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuPageId(
                                  activeMenuPageId === `fav-${favPage.id}` ? null : `fav-${favPage.id}`
                                );
                              }}
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </div>

                          {/* Menu Popover for favorite item */}
                          {activeMenuPageId === `fav-${favPage.id}` && (
                            <div
                              className="page-item-menu animate-popover"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="page-menu-option"
                                onClick={() => {
                                  onToggleFavorite(favPage.id);
                                  setActiveMenuPageId(null);
                                }}
                              >
                                <Star size={14} className="text-yellow star-filled" />
                                <span>Remove from Favorites</span>
                              </button>
                              <button
                                type="button"
                                className="page-menu-option"
                                onClick={() => {
                                  onDuplicatePage(favPage.id);
                                  setActiveMenuPageId(null);
                                }}
                              >
                                <Copy size={14} />
                                <span>Duplicate</span>
                              </button>
                              {onOpenInNewTab && (
                                <button
                                  type="button"
                                  className="page-menu-option"
                                  onClick={() => {
                                    onOpenInNewTab(favPage.id);
                                    setActiveMenuPageId(null);
                                  }}
                                >
                                  <ExternalLink size={14} />
                                  <span>Open in New Tab</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        {isExpanded &&
                          hasChildren &&
                          childPages.map((child) => renderPageItem(child, 1))}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <div className="sidebar-empty-favorites-hint">
                    <span>Star pages to see them here</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Private (Projects, page, Notes, etc.) */}
          <div className="sidebar-section">
            <div
              className="sidebar-section-header"
              onClick={() => setIsPrivateCollapsed((prev) => !prev)}
            >
              <div className="sidebar-section-header-left">
                <button
                  type="button"
                  className={`section-caret-btn ${isPrivateCollapsed ? 'is-collapsed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPrivateCollapsed((prev) => !prev);
                  }}
                  title={isPrivateCollapsed ? 'Expand Private' : 'Collapse Private'}
                >
                  {isPrivateCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
                <span className="sidebar-section-title">Private</span>
              </div>
              <button
                type="button"
                className="section-add-btn"
                title="Add a page"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreatePage(null);
                }}
              >
                <Plus size={13} />
              </button>
            </div>

            {!isPrivateCollapsed && (
              <div className="sidebar-pages-list">
                {rootPages.map((page) => renderPageItem(page))}
              </div>
            )}
          </div>

          {/* Section: Utility Links (Import, Archive, Trash, Website) */}
          <div className="sidebar-section utility-section">
            {onOpenWebsite && (
              <button className="utility-nav-link" onClick={onOpenWebsite} title="Noted Website">
                <Globe size={14} />
                <span>Website</span>
              </button>
            )}
            <button className="utility-nav-link" onClick={onOpenImportModal} title="Import Markdown / Notes">
              <Download size={14} />
              <span>Import</span>
            </button>
            <button className="utility-nav-link" onClick={onOpenArchive} title="Archive">
              <Archive size={14} />
              <span>Archive</span>
              {archivedCount > 0 && <span className="trash-badge">{archivedCount}</span>}
            </button>
            <button className="utility-nav-link" onClick={onOpenTrash} title="Trash">
              <Trash2 size={14} />
              <span>Trash</span>
              {trashCount > 0 && <span className="trash-badge">{trashCount}</span>}
            </button>
          </div>
        </div>

        {/* Guest Banner if not logged in */}
        {!currentUser?.isLoggedIn && (
          <div className="sidebar-guest-signin-prompt">
            <button className="sidebar-guest-signin-btn" onClick={onOpenLogin} title="Log in to your workspace">
              <svg className="google-g-mini" width="13" height="13" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Log in with Google</span>
            </button>
          </div>
        )}

        {/* Bottom Action Bar: New page, Settings, Theme */}
        <div className="sidebar-bottom-action-bar">
          <button
            className="bottom-action-new-page-btn"
            onClick={() => onCreatePage(null)}
            title="New page"
          >
            <Plus size={15} />
            <span>New page</span>
          </button>
          <button
            className="bottom-icon-tool-btn"
            onClick={onOpenSettings}
            title="Settings & Workspace"
          >
            <Settings size={15} />
          </button>
          <button
            className="bottom-icon-tool-btn theme-toggle-sidebar-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Sidebar Drag Resizer Handle */}
        {!isCollapsed && (
          <div
            className="sidebar-resizer"
            onMouseDown={handleStartResize}
            onDoubleClick={handleResetWidth}
            title="Drag to resize sidebar (double-click to reset)"
            role="separator"
            aria-orientation="vertical"
          />
        )}
      </aside>
    </>
  );
};
