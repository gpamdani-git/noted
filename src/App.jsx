import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';
import { TabBar } from './components/Navigation/TabBar';
import { Editor } from './components/Editor/Editor';
import { CommandPaletteModal } from './components/Modals/CommandPaletteModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { TrashModal } from './components/Modals/TrashModal';
import { ImportMarkdownModal } from './components/Modals/ImportMarkdownModal';
import { VersionHistoryDrawer } from './components/Modals/VersionHistoryDrawer';
import { PageAnalyticsModal } from './components/Modals/PageAnalyticsModal';
import { CommentsDrawer } from './components/Comments/CommentsDrawer';
import { NotionLoginModal } from './components/Auth/NotionLoginModal';
import { getAuthState, logout as authLogout } from './utils/auth';
import { savePageSnapshot } from './utils/versionHistory';
import {
  loadStoredPages,
  saveStoredPages,
  loadStoredTrash,
  saveStoredTrash,
  loadTheme,
  saveTheme,
  loadStoredOpenTabs,
  saveStoredOpenTabs
} from './utils/storage';
import { triggerCloudSync, pullCloudWorkspace } from './utils/cloudSync';
import './App.css';

export function App() {
  const [currentUser, setCurrentUser] = useState(() => getAuthState().user);
  const [pages, setPages] = useState(() => loadStoredPages(getAuthState().user));
  const [activePageId, setActivePageId] = useState(() => {
    const stored = loadStoredPages(getAuthState().user);
    return stored.length > 0 ? stored[0].id : null;
  });
  const [openTabs, setOpenTabs] = useState(() => {
    const saved = loadStoredOpenTabs(getAuthState().user);
    const storedPages = loadStoredPages(getAuthState().user);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const valid = saved.filter((id) => storedPages.some((p) => p.id === id));
      if (valid.length > 0) return valid;
    }
    return storedPages.length > 0 ? [storedPages[0].id] : [];
  });
  const [trashPages, setTrashPages] = useState(() => loadStoredTrash(getAuthState().user));
  const [theme, setTheme] = useState(loadTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 900;
    }
    return false;
  });

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Cloud Sync state and listener (Notion REA Dual-DB Engine)
  const [cloudSyncStatus, setCloudSyncStatus] = useState('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    const handleSyncStatus = (e) => {
      if (e.detail?.status) {
        setCloudSyncStatus(e.detail.status);
      }
      if (e.detail?.lastSyncedAt) {
        setLastSyncedAt(e.detail.lastSyncedAt);
      }
    };
    window.addEventListener('noted_cloud_sync_status', handleSyncStatus);
    return () => window.removeEventListener('noted_cloud_sync_status', handleSyncStatus);
  }, []);

  // Sync authentication state across components
  useEffect(() => {
    const handleAuthChange = (e) => {
      if (e.detail?.user) {
        setCurrentUser(e.detail.user);
      }
    };
    window.addEventListener('noted_auth_changed', handleAuthChange);
    return () => window.removeEventListener('noted_auth_changed', handleAuthChange);
  }, []);

  // Notion Desktop Workspace Switcher: Switch space and scope when account changes
  const prevUserIdRef = useRef(currentUser?.isLoggedIn ? currentUser?.id : 'guest');
  useEffect(() => {
    const currentScope = currentUser?.isLoggedIn ? currentUser?.id : 'guest';
    if (prevUserIdRef.current !== currentScope) {
      prevUserIdRef.current = currentScope;
      const userPages = loadStoredPages(currentUser);
      const userTrash = loadStoredTrash(currentUser);
      const userTabs = loadStoredOpenTabs(currentUser);

      setPages(userPages);
      setTrashPages(userTrash);

      let initialTab = null;
      if (userTabs && userTabs.length > 0 && userPages.some((p) => p.id === userTabs[0])) {
        initialTab = userTabs[0];
        setOpenTabs(userTabs);
      } else if (userPages.length > 0) {
        initialTab = userPages[0].id;
        setOpenTabs([initialTab]);
      } else {
        setOpenTabs([]);
      }

      setActivePageId(initialTab);
      setNavHistory(initialTab ? [initialTab] : []);
      setNavHistoryIndex(0);

      // Pull latest from PostgreSQL cloud if logged in
      if (currentUser?.isLoggedIn) {
        pullCloudWorkspace(currentUser).then((remoteData) => {
          if (remoteData && remoteData.pages && remoteData.pages.length > 0) {
            setPages(remoteData.pages);
            if (remoteData.trash) setTrashPages(remoteData.trash);
          } else {
            // Seed cloud database with local pages if cloud is empty
            triggerCloudSync(currentUser, userPages, userTrash, { openTabs: userTabs, activePageId: initialTab, theme }, true);
          }
        });
      }
    }
  }, [currentUser]);

  // Undo / Redo History Stack per page (Category B)
  const [pageHistory, setPageHistory] = useState({});

  // Sync theme with HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Persist pages whenever they change for the current user
  useEffect(() => {
    saveStoredPages(pages, currentUser);
    if (currentUser?.isLoggedIn) {
      triggerCloudSync(currentUser, pages, trashPages, { openTabs, activePageId, theme });
    }
  }, [pages, currentUser]);

  // Persist trash whenever it changes for the current user
  useEffect(() => {
    saveStoredTrash(trashPages, currentUser);
    if (currentUser?.isLoggedIn) {
      triggerCloudSync(currentUser, pages, trashPages, { openTabs, activePageId, theme });
    }
  }, [trashPages, currentUser]);

  // Persist open tabs whenever they change for the current user (Kategori G)
  useEffect(() => {
    saveStoredOpenTabs(openTabs, currentUser);
  }, [openTabs, currentUser]);

  const handleTriggerCloudSync = () => {
    if (currentUser?.isLoggedIn) {
      triggerCloudSync(currentUser, pages, trashPages, { openTabs, activePageId, theme }, true);
    }
  };

  // Keep activePageId in openTabs if user navigates to an existing page
  useEffect(() => {
    if (activePageId && !openTabs.includes(activePageId)) {
      setOpenTabs((prev) => [...prev, activePageId]);
    }
  }, [activePageId]);

  // Navigation history (< > back and forward)
  const [navHistory, setNavHistory] = useState(() => (activePageId ? [activePageId] : []));
  const [navHistoryIndex, setNavHistoryIndex] = useState(0);

  const handleNavBack = () => {
    if (navHistoryIndex > 0) {
      const prevIdx = navHistoryIndex - 1;
      setNavHistoryIndex(prevIdx);
      setActivePageId(navHistory[prevIdx]);
    }
  };

  const handleNavForward = () => {
    if (navHistoryIndex < navHistory.length - 1) {
      const nextIdx = navHistoryIndex + 1;
      setNavHistoryIndex(nextIdx);
      setActivePageId(navHistory[nextIdx]);
    }
  };

  // Tab operations (Kategori G: Desktop Multi-Tab Navigation)
  const handleSelectTab = (tabId) => {
    setActivePageId(tabId);
    setNavHistory((prev) => {
      const sliced = prev.slice(0, navHistoryIndex + 1);
      return [...sliced, tabId];
    });
    setNavHistoryIndex((prev) => prev + 1);
  };

  const handleOpenTab = (pageId) => {
    if (!openTabs.includes(pageId)) {
      setOpenTabs((prev) => [...prev, pageId]);
    }
    setActivePageId(pageId);
    setNavHistory((prev) => {
      const sliced = prev.slice(0, navHistoryIndex + 1);
      return [...sliced, pageId];
    });
    setNavHistoryIndex((prev) => prev + 1);
  };

  const handleCloseTab = (tabIdToClose) => {
    const tabIndex = openTabs.indexOf(tabIdToClose);
    const nextTabs = openTabs.filter((id) => id !== tabIdToClose);

    if (nextTabs.length === 0) {
      // If last tab is closed, create a fresh page
      const newId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newPage = {
        id: newId,
        title: 'Untitled',
        icon: '📄',
        cover: null,
        parentId: null,
        isFavorite: false,
        isLocked: false,
        fullWidth: false,
        fontFamily: 'sans',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }]
      };
      setPages((prev) => [newPage, ...prev]);
      setOpenTabs([newId]);
      setActivePageId(newId);
      return;
    }

    setOpenTabs(nextTabs);

    if (activePageId === tabIdToClose) {
      const newIndex = Math.min(tabIndex, nextTabs.length - 1);
      setActivePageId(nextTabs[newIndex]);
    }
  };

  const handleNewTab = () => {
    handleCreatePage(null);
  };

  const handleReorderTabs = (newTabs) => {
    setOpenTabs(newTabs);
  };

  const handleCloseOtherTabs = (currentTabId) => {
    setOpenTabs([currentTabId]);
    setActivePageId(currentTabId);
  };

  const handleCloseTabsToRight = (currentTabId) => {
    const idx = openTabs.indexOf(currentTabId);
    if (idx !== -1) {
      const nextTabs = openTabs.slice(0, idx + 1);
      setOpenTabs(nextTabs);
      if (!nextTabs.includes(activePageId)) {
        setActivePageId(currentTabId);
      }
    }
  };

  const handleDuplicateTab = (tabId) => {
    handleDuplicatePage(tabId);
  };

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // Auto-record snapshot on active page load/switch (Kategori E)
  useEffect(() => {
    if (activePage && activePage.blocks && activePage.blocks.length > 0) {
      savePageSnapshot(activePage, 'Auto Snapshot (Sesi Aktif)', false);
    }
  }, [activePageId]);

  const handleRestorePageVersion = (restoredData) => {
    if (!activePage) return;
    handleUpdateActivePage(restoredData, true);
  };

  const handleJumpToBlock = (blockId) => {
    const el = document.getElementById(`block-${blockId}`) || document.querySelector(`[data-block-id="${blockId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-comment-target');
      setTimeout(() => {
        el.classList.remove('highlight-comment-target');
      }, 2500);
    }
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleUpdateActivePage = (changes, recordHistory = true) => {
    if (!activePage) return;

    if (recordHistory && changes.blocks && activePage.blocks) {
      const prevJson = JSON.stringify(activePage.blocks);
      const nextJson = JSON.stringify(changes.blocks);
      if (prevJson !== nextJson) {
        setPageHistory((prev) => {
          const cur = prev[activePage.id] || { undo: [], redo: [] };
          const newUndo = [...cur.undo, activePage.blocks].slice(-30);
          return {
            ...prev,
            [activePage.id]: { undo: newUndo, redo: [] }
          };
        });
      }
    }

    setPages((prevPages) =>
      prevPages.map((p) =>
        p.id === activePage.id
          ? { ...p, ...changes, updatedAt: Date.now() }
          : p
      )
    );
  };

  const handleUndo = () => {
    if (!activePage || activePage.isLocked) return;
    const cur = pageHistory[activePage.id];
    if (!cur || !cur.undo || cur.undo.length === 0) return;

    const prevBlocks = cur.undo[cur.undo.length - 1];
    const newUndo = cur.undo.slice(0, -1);
    const newRedo = [activePage.blocks, ...(cur.redo || [])].slice(0, 30);

    setPageHistory((prev) => ({
      ...prev,
      [activePage.id]: { undo: newUndo, redo: newRedo }
    }));

    handleUpdateActivePage({ blocks: prevBlocks }, false);
  };

  const handleRedo = () => {
    if (!activePage || activePage.isLocked) return;
    const cur = pageHistory[activePage.id];
    if (!cur || !cur.redo || cur.redo.length === 0) return;

    const nextBlocks = cur.redo[0];
    const newRedo = cur.redo.slice(1);
    const newUndo = [...(cur.undo || []), activePage.blocks].slice(-30);

    setPageHistory((prev) => ({
      ...prev,
      [activePage.id]: { undo: newUndo, redo: newRedo }
    }));

    handleUpdateActivePage({ blocks: nextBlocks }, false);
  };

  // Global keyboard shortcuts (Cmd+K search, Cmd+\ sidebar, Cmd+P print, Cmd+Z undo, Cmd+T new tab, Cmd+W close tab, Cmd+1-9 tab switch)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const modKey = e.metaKey || e.ctrlKey;

      if (modKey && !e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      } else if (modKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activePageId) {
          handleCloseTab(activePageId);
        }
      } else if (modKey && !e.shiftKey && /^[1-8]$/.test(e.key)) {
        const targetIdx = parseInt(e.key, 10) - 1;
        if (openTabs[targetIdx]) {
          e.preventDefault();
          setActivePageId(openTabs[targetIdx]);
        }
      } else if (modKey && !e.shiftKey && e.key === '9') {
        if (openTabs.length > 0) {
          e.preventDefault();
          setActivePageId(openTabs[openTabs.length - 1]);
        }
      } else if ((e.ctrlKey && e.key === 'Tab' && !e.shiftKey) || (modKey && e.shiftKey && (e.key === ']' || e.key === '}'))) {
        e.preventDefault();
        const currentIdx = openTabs.indexOf(activePageId);
        if (currentIdx !== -1 && openTabs.length > 1) {
          const nextIdx = (currentIdx + 1) % openTabs.length;
          setActivePageId(openTabs[nextIdx]);
        }
      } else if ((e.ctrlKey && e.key === 'Tab' && e.shiftKey) || (modKey && e.shiftKey && (e.key === '[' || e.key === '{'))) {
        e.preventDefault();
        const currentIdx = openTabs.indexOf(activePageId);
        if (currentIdx !== -1 && openTabs.length > 1) {
          const prevIdx = (currentIdx - 1 + openTabs.length) % openTabs.length;
          setActivePageId(openTabs[prevIdx]);
        }
      } else if (modKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (modKey && e.key === '\\') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      } else if (modKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      } else if (modKey && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput) {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        }
      } else if (modKey && e.key.toLowerCase() === 'y') {
        const activeEl = document.activeElement;
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activePage, pageHistory, openTabs, activePageId]);

  // Sidebar Page Reordering & Hierarchy (Category B)
  const handleReorderPages = (sourceId, targetId, position = 'after') => {
    if (sourceId === targetId) return;

    setPages((prevPages) => {
      const sourcePage = prevPages.find((p) => p.id === sourceId);
      const targetPage = prevPages.find((p) => p.id === targetId);
      if (!sourcePage || !targetPage) return prevPages;

      // Prevent dragging a parent inside its own descendant
      if (position === 'inside') {
        let curr = targetPage;
        while (curr) {
          if (curr.id === sourceId) return prevPages;
          curr = prevPages.find((p) => p.id === curr.parentId);
        }
        return prevPages.map((p) =>
          p.id === sourceId ? { ...p, parentId: targetId, updatedAt: Date.now() } : p
        );
      }

      // Reorder before or after target at the same parent level
      const newParentId = targetPage.parentId || null;
      const filtered = prevPages.filter((p) => p.id !== sourceId);
      const targetIndex = filtered.findIndex((p) => p.id === targetId);
      if (targetIndex === -1) return prevPages;

      const updatedSource = { ...sourcePage, parentId: newParentId, updatedAt: Date.now() };
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

      const newPages = [...filtered];
      newPages.splice(insertIndex, 0, updatedSource);
      return newPages;
    });
  };

  const handleMovePageOrder = (pageId, direction = 'up') => {
    setPages((prevPages) => {
      const page = prevPages.find((p) => p.id === pageId);
      if (!page) return prevPages;
      const siblings = prevPages.filter((p) => p.parentId === page.parentId);
      const siblingIdx = siblings.findIndex((p) => p.id === pageId);
      const targetSiblingIdx = direction === 'up' ? siblingIdx - 1 : siblingIdx + 1;
      if (targetSiblingIdx < 0 || targetSiblingIdx >= siblings.length) return prevPages;
      const targetSibling = siblings[targetSiblingIdx];

      const idx1 = prevPages.findIndex((p) => p.id === pageId);
      const idx2 = prevPages.findIndex((p) => p.id === targetSibling.id);
      const newPages = [...prevPages];
      const temp = newPages[idx1];
      newPages[idx1] = newPages[idx2];
      newPages[idx2] = temp;
      return newPages;
    });
  };

  const handleMovePageToParent = (pageId, newParentId) => {
    setPages((prevPages) =>
      prevPages.map((p) =>
        p.id === pageId ? { ...p, parentId: newParentId, updatedAt: Date.now() } : p
      )
    );
  };

  const handleCreatePage = (parentId = null) => {
    const newId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newPage = {
      id: newId,
      title: 'Untitled',
      icon: '📄',
      cover: null,
      parentId,
      isFavorite: false,
      isLocked: false,
      fullWidth: false,
      fontFamily: 'sans',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: [
        {
          id: `block-${Date.now()}`,
          type: 'paragraph',
          text: ''
        }
      ]
    };

    setPages((prev) => [newPage, ...prev]);
    setOpenTabs((prev) => [...prev, newId]);
    setActivePageId(newId);
  };

  const handleDeletePage = (pageId) => {
    const pageToDelete = pages.find((p) => p.id === pageId);
    if (!pageToDelete) return;

    if (pageToDelete.isLocked) {
      alert('Halaman ini sedang dikunci (Read-Only). Silakan buka kunci halaman terlebih dahulu sebelum memindahkannya ke Trash.');
      return;
    }

    // Remove from pages and add to trash
    const remaining = pages.filter((p) => p.id !== pageId);
    setPages(remaining);
    setTrashPages((prev) => [pageToDelete, ...prev]);

    // Also remove from openTabs
    setOpenTabs((prevTabs) => {
      const filtered = prevTabs.filter((id) => id !== pageId);
      if (filtered.length === 0 && remaining.length > 0) {
        return [remaining[0].id];
      }
      return filtered;
    });

    // If active page was deleted, switch to another page
    if (activePageId === pageId) {
      setActivePageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleDuplicatePage = (pageId) => {
    const source = pages.find((p) => p.id === pageId);
    if (!source) return;

    const duplicatedId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duplicatedPage = {
      ...JSON.parse(JSON.stringify(source)),
      id: duplicatedId,
      title: `${source.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    setPages((prev) => [duplicatedPage, ...prev]);
    setOpenTabs((prev) => [...prev, duplicatedId]);
    setActivePageId(duplicatedId);
  };

  const handleToggleFavorite = (pageId) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  // Trash operations
  const handleRestorePage = (pageId) => {
    const pageToRestore = trashPages.find((p) => p.id === pageId);
    if (!pageToRestore) return;

    setTrashPages((prev) => prev.filter((p) => p.id !== pageId));
    setPages((prev) => [pageToRestore, ...prev]);
    setOpenTabs((prev) => (prev.includes(pageToRestore.id) ? prev : [...prev, pageToRestore.id]));
    setActivePageId(pageToRestore.id);
  };

  const handlePermanentDeletePage = (pageId) => {
    setTrashPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const handleEmptyTrash = () => {
    if (window.confirm('Empty trash permanently? This cannot be undone.')) {
      setTrashPages([]);
    }
  };

  const handleResetPages = (newPages) => {
    setPages(newPages);
    if (newPages.length > 0) {
      setActivePageId(newPages[0].id);
      setOpenTabs([newPages[0].id]);
    } else {
      setOpenTabs([]);
    }
    setTrashPages([]);
  };

  const handleImportPages = (importedPages) => {
    setPages(importedPages);
    if (importedPages.length > 0) {
      setActivePageId(importedPages[0].id);
      setOpenTabs([importedPages[0].id]);
    }
  };

  const handleCreatePageFromMarkdown = ({ title, icon, blocks }) => {
    const newId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newPage = {
      id: newId,
      title: title || 'Imported AI Chat',
      icon: icon || '🤖',
      cover: null,
      parentId: null,
      isFavorite: false,
      isLocked: false,
      fullWidth: false,
      fontFamily: 'sans',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      blocks: blocks && blocks.length > 0 ? blocks : [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }]
    };

    setPages((prev) => [newPage, ...prev]);
    setOpenTabs((prev) => [...prev, newId]);
    setActivePageId(newId);
  };

  const handleAppendBlocksToActivePage = (newBlocks) => {
    if (!activePage || !newBlocks || newBlocks.length === 0) return;
    const currentBlocks = [...activePage.blocks];
    // If the active page only has 1 empty paragraph, replace it
    if (currentBlocks.length === 1 && currentBlocks[0].type === 'paragraph' && !currentBlocks[0].text?.trim()) {
      handleUpdateActivePage({ blocks: newBlocks });
    } else {
      handleUpdateActivePage({ blocks: [...currentBlocks, ...newBlocks] });
    }
  };

  return (
    <div className="noted-app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        onSelectPage={(id) => setActivePageId(id)}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onToggleFavorite={handleToggleFavorite}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTrash={() => setIsTrashOpen(true)}
        onOpenImportModal={() => setIsImportOpen(true)}
        onReorderPages={handleReorderPages}
        onMovePageOrder={handleMovePageOrder}
        onMovePageToParent={handleMovePageToParent}
        trashCount={trashPages.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenInNewTab={handleOpenTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          authLogout();
          setCurrentUser(getAuthState().user);
        }}
      />

      {/* Main Workspace Frame */}
      <main className="noted-main-workspace">
        {/* Notion Desktop Tab Bar (Unified Top Window Bar) */}
        <TabBar
          tabs={openTabs}
          pages={pages}
          activeTabId={activePageId}
          activePage={activePage}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onReorderTabs={handleReorderTabs}
          onCloseOtherTabs={handleCloseOtherTabs}
          onCloseTabsToRight={handleCloseTabsToRight}
          onDuplicateTab={handleDuplicateTab}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          canGoBack={navHistoryIndex > 0}
          canGoForward={navHistoryIndex < navHistory.length - 1}
          onGoBack={handleNavBack}
          onGoForward={handleNavForward}
        />

        {activePage ? (
          <>
            {/* Notion Desktop Sub-Breadcrumb Bar */}
            <TopNav
              page={activePage}
              onOpenAI={() => setIsAIOpen((prev) => !prev)}
              onOpenComments={() => setIsCommentsOpen((prev) => !prev)}
              onToggleFavorite={handleToggleFavorite}
              onUpdatePage={handleUpdateActivePage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenAnalytics={() => setIsAnalyticsOpen(true)}
              onOpenImportModal={() => setIsImportOpen(true)}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              cloudSyncStatus={cloudSyncStatus}
              lastSyncedAt={lastSyncedAt}
              onTriggerCloudSync={handleTriggerCloudSync}
            />
            <Editor
              key={activePage.id}
              page={activePage}
              allPages={pages}
              onNavigatePage={(id) => handleSelectTab(id)}
              onUpdatePage={handleUpdateActivePage}
              isAIOpen={isAIOpen}
              onCloseAI={() => setIsAIOpen(false)}
              canUndo={(pageHistory[activePage.id]?.undo?.length || 0) > 0}
              canRedo={(pageHistory[activePage.id]?.redo?.length || 0) > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onOpenComments={() => setIsCommentsOpen(true)}
            />
          </>
        ) : (
          <div className="empty-workspace-view">
            <div className="empty-workspace-card">
              <h2>No page selected</h2>
              <p>Create a new page or select one from the sidebar to start writing.</p>
              <button
                className="btn-create-first-page"
                onClick={() => handleCreatePage(null)}
              >
                + Create a page
              </button>
            </div>
          </div>
        )}

        {/* Notion Desktop Floating AI Action Button (Bottom-Right FAB) */}
        <button
          className="notion-floating-ai-fab"
          onClick={() => setIsAIOpen((prev) => !prev)}
          title="Notion AI Assistant (Space / ⌘J)"
        >
          <svg
            className="notion-ai-mascot-svg"
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="13" cy="14" r="10" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="10" cy="12.5" r="1.2" fill="currentColor" />
            <circle cx="16" cy="12.5" r="1.2" fill="currentColor" />
            <path d="M10 16.5C11.5 18.5 14.5 18.5 16 16.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="20" y1="10" x2="26" y2="4" stroke="#e03e3e" strokeWidth="3" strokeLinecap="round" />
            <line x1="17" y1="13" x2="20" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </main>

      {/* Modals */}
      {isSearchOpen && (
        <CommandPaletteModal
          pages={pages}
          onSelectPage={(id) => setActivePageId(id)}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          pages={pages}
          onResetPages={handleResetPages}
          onImportPages={handleImportPages}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
          onOpenLogin={() => {
            setIsSettingsOpen(false);
            setIsLoginModalOpen(true);
          }}
          onLogout={() => {
            authLogout();
            setCurrentUser(getAuthState().user);
          }}
          onClose={() => setIsSettingsOpen(false)}
          cloudSyncStatus={cloudSyncStatus}
          lastSyncedAt={lastSyncedAt}
          onTriggerCloudSync={handleTriggerCloudSync}
        />
      )}

      {/* Notion Desktop Authentication Modal (Reverse Engineered from Notion DMG) */}
      <NotionLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginModalOpen(false);
        }}
      />

      {isTrashOpen && (
        <TrashModal
          trashPages={trashPages}
          onRestorePage={handleRestorePage}
          onPermanentDeletePage={handlePermanentDeletePage}
          onEmptyTrash={handleEmptyTrash}
          onClose={() => setIsTrashOpen(false)}
        />
      )}

      {/* Import from AI Chat / Markdown Modal */}
      <ImportMarkdownModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onCreatePageFromMarkdown={handleCreatePageFromMarkdown}
        onAppendToCurrentPage={handleAppendBlocksToActivePage}
        currentPageTitle={activePage?.title}
      />

      {/* Version History Drawer (Kategori E) */}
      <VersionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        page={activePage}
        allPages={pages}
        onRestorePage={handleRestorePageVersion}
      />

      {/* Page Analytics & Details Modal (Kategori E) */}
      <PageAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        page={activePage}
      />

      {/* Comments & Discussions Drawer (Kategori F) */}
      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        page={activePage}
        onJumpToBlock={handleJumpToBlock}
      />
    </div>
  );
}

export default App;
