import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopNav } from './components/TopNav/TopNav';
import { TabBar } from './components/Navigation/TabBar';
import { Editor } from './components/Editor/Editor';
import { CommandPaletteModal } from './components/Modals/CommandPaletteModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { TrashModal } from './components/Modals/TrashModal';
import { ArchiveModal } from './components/Modals/ArchiveModal';
import { ImportMarkdownModal } from './components/Modals/ImportMarkdownModal';
import { VersionHistoryDrawer } from './components/Modals/VersionHistoryDrawer';
import { PageAnalyticsModal } from './components/Modals/PageAnalyticsModal';
import { CommentsDrawer } from './components/Comments/CommentsDrawer';
import { NotionLoginModal } from './components/Auth/NotionLoginModal';
import { NotionLandingPage } from './components/Landing/NotionLandingPage';
import { NotionDownloadPage } from './components/Download/NotionDownloadPage';
import { NotedDocsPage } from './components/Docs/NotedDocsPage';
import { Toast, showToast } from './components/common/Toast';
import { getAuthState, logout as authLogout, updateUserProfile, applyDesktopSession, switchAccount, AUTH_CONFIG } from './utils/auth';
import { getSessionToken } from './utils/session';
import { getStoredComments, getDeletedCommentIds, applyRemoteComments } from './utils/comments';
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
import {
  triggerCloudSync,
  pullCloudWorkspace,
  broadcastLocalChange,
  subscribeToMultiTabSync,
  startLiveSyncPulse
} from './utils/cloudSync';
import { pageToMarkdown, downloadMarkdownFile } from './utils/markdown';
import { readPageIdFromUrl, writePageIdToUrl } from './utils/pageUrl';
import { checkForUpdates } from './utils/updater';
import { CollaborationProvider } from './utils/collaboration/yjsProvider';
import RemoteCursor from './components/Collaboration/RemoteCursor';
import TypingIndicator from './components/Collaboration/TypingIndicator';
import './App.css';

export const FIRST_WORKSPACE_LOGIN_KEY = 'noted_first_workspace_login_shown_v1';

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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Global Language state (Indonesian 'id' vs English 'en')
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('noted_lang') || 'id';
    } catch {
      return 'id';
    }
  });

  const handleSetLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('noted_lang', newLang);
    } catch {
      // safe fallback
    }
  };

  // Marketing Website vs Download Page vs Docs vs Workspace View
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window === 'undefined') return 'app';
    if (import.meta.env?.MODE === 'test') return 'app';
    if (window.electronAPI?.isElectron || window.Capacitor?.isNativePlatform?.()) {
      return 'app';
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'docs') return 'docs';
    if (params.get('view') === 'download') return 'download';
    if (params.get('view') === 'landing') return 'landing';
    if (params.get('view') === 'app' || params.get('pageId')) return 'app';

    const saved = localStorage.getItem('noted_current_view');
    if (saved === 'app') return 'app';
    if (saved === 'docs') return 'docs';
    if (saved === 'download') return 'download';
    if (saved === 'landing') return 'landing';
    return 'landing';
  });

  const handleOpenWorkspace = () => {
    setCurrentView('app');
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      localStorage.setItem('noted_current_view', 'app');
      if (localStorage.getItem(FIRST_WORKSPACE_LOGIN_KEY) !== 'true' && !currentUser?.isLoggedIn) {
        localStorage.setItem(FIRST_WORKSPACE_LOGIN_KEY, 'true');
        setIsLoginModalOpen(true);
      }
      const url = new URL(window.location.href);
      if (
        url.searchParams.get('view') === 'landing' ||
        url.searchParams.get('view') === 'download' ||
        url.searchParams.get('view') === 'docs'
      ) {
        url.searchParams.delete('view');
        window.history.replaceState(window.history.state, '', url.toString());
      }
    } catch {
      // safe fallback
    }
  };

  const handleOpenLandingWebsite = () => {
    setCurrentView('landing');
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      localStorage.setItem('noted_current_view', 'landing');
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'landing');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  const [downloadTargetPlatform, setDownloadTargetPlatform] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('platform') || null;
    } catch {
      return null;
    }
  });

  const handleOpenDownloadPage = (platformKey = null) => {
    setDownloadTargetPlatform(platformKey || null);
    setCurrentView('download');
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      localStorage.setItem('noted_current_view', 'download');
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'download');
      if (platformKey) {
        url.searchParams.set('platform', platformKey);
      } else {
        url.searchParams.delete('platform');
      }
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  const handleOpenDocsPage = () => {
    setCurrentView('docs');
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      localStorage.setItem('noted_current_view', 'docs');
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'docs');
      window.history.replaceState(window.history.state, '', url.toString());
    } catch {
      // safe fallback
    }
  };

  // Ensure window scroll is enabled on marketing landing, download & docs pages and locked on desktop app workspace
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (currentView === 'landing' || currentView === 'download' || currentView === 'docs') {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
    }
  }, [currentView]);

  // First-time workspace access login popup prompt
  useEffect(() => {
    if (currentView !== 'app') return;
    try {
      if (localStorage.getItem(FIRST_WORKSPACE_LOGIN_KEY) !== 'true' && !currentUser?.isLoggedIn) {
        localStorage.setItem(FIRST_WORKSPACE_LOGIN_KEY, 'true');
        setIsLoginModalOpen(true);
      }
    } catch {
      // safe fallback
    }
  }, [currentView, currentUser]);

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
    const handleSwitchAccount = (e) => {
      const accountId = e.detail?.accountId;
      if (!accountId) return;
      const switched = switchAccount(accountId);
      if (switched) setCurrentUser(switched);
    };
    window.addEventListener('noted_auth_changed', handleAuthChange);
    window.addEventListener('noted_switch_account', handleSwitchAccount);
    return () => {
      window.removeEventListener('noted_auth_changed', handleAuthChange);
      window.removeEventListener('noted_switch_account', handleSwitchAccount);
    };
  }, []);

  // Deep link hand-off: when the web app is opened with ?notedAuth=desktop it
  // forwards the verified session back to the desktop app via noted://auth.
  //
  // The hand-off is retried whenever the sign-in state changes, because the
  // browser usually arrives before the user has signed in. Without the retry
  // the browser would stay on the web page and the desktop app would never
  // receive the session.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let handedOff = false;

    const forwardSessionToDesktop = () => {
      if (handedOff) return;
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('notedAuth') !== 'desktop') return;

        const token = getSessionToken();
        if (!token) return;

        handedOff = true;
        window.location.replace(`noted://auth?session=${encodeURIComponent(token)}`);
      } catch (err) {
        console.warn('[Noted Desktop] Auth hand-off notice:', err);
      }
    };

    forwardSessionToDesktop();
    window.addEventListener('noted_auth_changed', forwardSessionToDesktop);
    window.addEventListener('noted_session_updated', forwardSessionToDesktop);

    return () => {
      window.removeEventListener('noted_auth_changed', forwardSessionToDesktop);
      window.removeEventListener('noted_session_updated', forwardSessionToDesktop);
    };
  }, []);

  // Web page addressing: a copied link carries ?pageId= and reopens that page.
  const appliedUrlPageId = useRef(false);
  useEffect(() => {
    if (appliedUrlPageId.current) return;
    const requestedPageId = readPageIdFromUrl();
    if (!requestedPageId) return;
    if (!pages.some((p) => p.id === requestedPageId)) return;

    appliedUrlPageId.current = true;
    setOpenTabs((prev) => (prev.includes(requestedPageId) ? prev : [...prev, requestedPageId]));
    setActivePageId(requestedPageId);
  }, [pages]);

  useEffect(() => {
    if (!activePageId) return;
    writePageIdToUrl(activePageId);
  }, [activePageId]);

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
            if (remoteData.comments) {
              applyRemoteComments(remoteData.comments, remoteData.deletedCommentIds || []);
            }
            if (remoteData.resolvedUserId && remoteData.resolvedUserId !== currentUser.id) {
              updateUserProfile({ id: remoteData.resolvedUserId });
            }
          } else {
            // Seed cloud database with local pages if cloud is empty
            triggerCloudSync(
              currentUser,
              userPages,
              userTrash,
              { openTabs: userTabs, activePageId: initialTab, theme },
              getStoredComments(),
              getDeletedCommentIds(),
              true
            );
          }
        });
      }
    }
  }, [currentUser]);

  // Auth state change Toast notifications (Login / Logout / Switch Account)
  useEffect(() => {
    let prevUser = currentUser;

    const handleAuthChange = (e) => {
      const newUser = e.detail?.user;
      if (!newUser) return;

      // 1. Logged in from guest
      if (newUser.isLoggedIn && (!prevUser || !prevUser.isLoggedIn)) {
        showToast(`Berhasil masuk sebagai ${newUser.name || newUser.email}`, 'success');
      }
      // 2. Switched account
      else if (newUser.isLoggedIn && prevUser?.isLoggedIn && prevUser.id !== newUser.id) {
        showToast(`Beralih ke akun ${newUser.name || newUser.email}`, 'account');
      }
      // 3. Logged out to guest
      else if (!newUser.isLoggedIn && prevUser?.isLoggedIn) {
        showToast('Berhasil keluar. Beralih ke Mode Tamu (Offline)', 'logout');
      }

      prevUser = newUser;
    };

    window.addEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, handleAuthChange);
    return () => window.removeEventListener(AUTH_CONFIG.EVENTS.AUTH_CHANGED, handleAuthChange);
  }, [currentUser]);

  // Undo / Redo History Stack per page (Category B)
  const [pageHistory, setPageHistory] = useState({});

  // Sync theme with HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Desktop Platform & Deep-link detection (Notion REA Desktop Integration)
  useEffect(() => {
    // DOM fullscreen change listener for web & browser
    const handleDomFullscreen = () => {
      document.documentElement.classList.toggle('is-fullscreen', Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleDomFullscreen);

    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      document.documentElement.classList.add('is-electron');
      if (window.electronAPI.platform === 'darwin') {
        document.documentElement.classList.add('is-mac-desktop');
      } else if (window.electronAPI.platform === 'win32') {
        document.documentElement.classList.add('is-windows-desktop');
      }

      // Check initial macOS/Windows window fullscreen status
      window.electronAPI.isFullScreen?.().then((isFs) => {
        document.documentElement.classList.toggle('is-fullscreen', Boolean(isFs));
      });

      // Synchronize native window fullscreen events from Electron main process
      const cleanupFullscreen = window.electronAPI.onFullScreenChange?.((isFs) => {
        document.documentElement.classList.toggle('is-fullscreen', Boolean(isFs));
      });

      // Listen for deep link events (noted://)
      const cleanupDeepLink = window.electronAPI.onDeepLink?.((url) => {
        try {
          const parsed = new URL(url);

          // noted://auth?session=... - desktop sign-in hand-off
          const session = parsed.searchParams.get('session');
          if (session) {
            applyDesktopSession(session)
              .then((user) => setCurrentUser(user))
              .catch((err) => console.warn('[Noted Desktop] Session hand-off failed:', err.message));
            return;
          }

          // noted://open?pageId=... - open a page
          const pageId = parsed.searchParams.get('pageId');
          if (pageId) {
            setOpenTabs((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
            setActivePageId(pageId);
          }
        } catch (e) {
          console.warn('[Noted Desktop] Deep link notice:', e);
        }
      });

      return () => {
        document.removeEventListener('fullscreenchange', handleDomFullscreen);
        if (cleanupFullscreen) cleanupFullscreen();
        if (cleanupDeepLink) cleanupDeepLink();
      };
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleDomFullscreen);
    };
  }, []);

  // Listen for mobile Capacitor deep links (noted://auth?session=...)
  useEffect(() => {
    const handleCapacitorDeepLink = (e) => {
      const url = e?.detail;
      if (!url || typeof url !== 'string') return;
      try {
        const parsed = new URL(url);
        const session = parsed.searchParams.get('session');
        if (session) {
          applyDesktopSession(session)
            .then((user) => setCurrentUser(user))
            .catch((err) => console.warn('[Noted Mobile] Session hand-off failed:', err.message));
          return;
        }

        const pageId = parsed.searchParams.get('pageId');
        if (pageId) {
          setOpenTabs((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
          setActivePageId(pageId);
        }
      } catch (err) {
        console.warn('[Noted Mobile] Deep link parse failed:', err);
      }
    };

    window.addEventListener('capacitor:deep-link', handleCapacitorDeepLink);
    return () => {
      window.removeEventListener('capacitor:deep-link', handleCapacitorDeepLink);
    };
  }, []);

  // Flag to avoid re-triggering broadcast when applying incoming sync
  const isIncomingSyncRef = useRef(false);

  // 1. Multi-Tab Real-time Sync (Notion REA BroadcastChannel)
  useEffect(() => {
    const unsubscribe = subscribeToMultiTabSync((data) => {
      if (data.pages && Array.isArray(data.pages)) {
        isIncomingSyncRef.current = true;
        setPages(data.pages);
        if (data.trashPages && Array.isArray(data.trashPages)) {
          setTrashPages(data.trashPages);
        }
        setTimeout(() => {
          isIncomingSyncRef.current = false;
        }, 150);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Cross-device and Web <-> Local Live Sync Pulse (Notion REA Heartbeat & Focus triggers)
  useEffect(() => {
    if (!currentUser?.isLoggedIn) return;

    const cleanup = startLiveSyncPulse({
      getUser: () => currentUser,
      onRemoteUpdate: (remoteData) => {
        if (!remoteData || !remoteData.pages || remoteData.pages.length === 0) return;

        setPages((currentPages) => {
          const localMap = new Map(currentPages.map((p) => [p.id, p]));
          let hasNewer = false;

          for (const rPage of remoteData.pages) {
            const lPage = localMap.get(rPage.id);
            if (!lPage || (rPage.updatedAt || 0) > (lPage.updatedAt || 0)) {
              hasNewer = true;
              break;
            }
          }

          if (!hasNewer && remoteData.pages.length !== currentPages.length) {
            hasNewer = true;
          }

          if (hasNewer) {
            isIncomingSyncRef.current = true;
            setTimeout(() => {
              isIncomingSyncRef.current = false;
            }, 200);

            if (remoteData.trash) setTrashPages(remoteData.trash);
            if (remoteData.comments) {
              applyRemoteComments(remoteData.comments, remoteData.deletedCommentIds || []);
            }
            broadcastLocalChange({ pages: remoteData.pages, trashPages: remoteData.trash });
            return remoteData.pages;
          }

          return currentPages;
        });
      },
      intervalMs: 10000
    });

    return cleanup;
  }, [currentUser]);

  // Persist pages whenever they change for the current user
  useEffect(() => {
    saveStoredPages(pages, currentUser);
    if (!isIncomingSyncRef.current) {
      broadcastLocalChange({ pages, trashPages, activePageId });
      if (currentUser?.isLoggedIn) {
        triggerCloudSync(
          currentUser,
          pages,
          trashPages,
          { openTabs, activePageId, theme },
          getStoredComments(),
          getDeletedCommentIds()
        );
      }
    }
  }, [pages, currentUser]);

  // Persist trash whenever it changes for the current user
  useEffect(() => {
    saveStoredTrash(trashPages, currentUser);
    if (!isIncomingSyncRef.current) {
      broadcastLocalChange({ pages, trashPages, activePageId });
      if (currentUser?.isLoggedIn) {
        triggerCloudSync(
          currentUser,
          pages,
          trashPages,
          { openTabs, activePageId, theme },
          getStoredComments(),
          getDeletedCommentIds()
        );
      }
    }
  }, [trashPages, currentUser]);

  // A comment change is pushed to the cloud as well, so the discussions
  // follow the workspace to the other devices.
  useEffect(() => {
    const handleCommentsUpdated = () => {
      if (isIncomingSyncRef.current) return;
      if (!currentUser?.isLoggedIn) return;
      triggerCloudSync(
        currentUser,
        pages,
        trashPages,
        { openTabs, activePageId, theme },
        getStoredComments(),
        getDeletedCommentIds()
      );
    };

    window.addEventListener('noted_comments_updated', handleCommentsUpdated);
    return () => window.removeEventListener('noted_comments_updated', handleCommentsUpdated);
  }, [currentUser, pages, trashPages, openTabs, activePageId, theme]);

  // Persist open tabs whenever they change for the current user (Kategori G)
  useEffect(() => {
    saveStoredOpenTabs(openTabs, currentUser);
  }, [openTabs, currentUser]);

  const handleTriggerCloudSync = () => {
    if (currentUser?.isLoggedIn) {
      triggerCloudSync(
        currentUser,
        pages,
        trashPages,
        { openTabs, activePageId, theme },
        getStoredComments(),
        getDeletedCommentIds(),
        true
      );
    }
  };

  // Keep activePageId in openTabs if user navigates to an existing page
  useEffect(() => {
    if (activePageId && !openTabs.includes(activePageId)) {
      setOpenTabs((prev) => [...prev, activePageId]);
    }
  }, [activePageId]);

  // Real-time Collaboration (Yjs & Presence Protocol)
  const [collaborators, setCollaborators] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const collabProviderRef = useRef(null);

  useEffect(() => {
    // Only connect WebSocket collaboration if server URL is configured
    const collabServerUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_COLLAB_SERVER_URL;
    if (!collabServerUrl || !activePageId) {
      setCollaborators([]);
      setRemoteCursors([]);
      setTypingUsers([]);
      return;
    }

    try {
      const roomName = `noted_page_${activePageId}`;
      const provider = new CollaborationProvider(roomName, null, {
        serverUrl: collabServerUrl
      });
      collabProviderRef.current = provider;
      provider.connect();

      if (currentUser && currentUser.name) {
        provider.setUser({
          id: currentUser.id || 'guest',
          name: currentUser.name,
          color: currentUser.color,
          avatar: currentUser.avatar
        });
      }

      const updateUsers = () => {
        setCollaborators(provider.getUsers());
        setRemoteCursors(provider.getCursors());
        setTypingUsers(provider.getTypingUsers());
      };

      if (provider.awareness) {
        provider.awareness.on('change', updateUsers);
      }

      return () => {
        if (provider.awareness) {
          provider.awareness.off('change', updateUsers);
        }
        provider.destroy();
      };
    } catch {
      // Graceful fallback if WebSocket is not available
    }
  }, [activePageId, currentUser?.id, currentUser?.name]);

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

  const handleSelectPage = (pageId) => {
    handleOpenTab(pageId);
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

  // Archived pages stay in the workspace but are hidden from the sidebar
  const visiblePages = useMemo(() => pages.filter((p) => !p.isArchived), [pages]);
  const archivedPages = useMemo(() => pages.filter((p) => p.isArchived), [pages]);

  const activePage = visiblePages.find((p) => p.id === activePageId) || visiblePages[0];
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

  // Archive operations
  // An archived page keeps its content and stays in the workspace, it is only
  // hidden from the sidebar until it is restored.
  const handleArchivePage = (pageId) => {
    const pageToArchive = pages.find((p) => p.id === pageId);
    if (!pageToArchive) return;

    if (pageToArchive.isLocked) {
      alert('Halaman ini sedang dikunci (Read-Only). Buka kunci halaman terlebih dahulu sebelum mengarsipkan.');
      return;
    }

    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, isArchived: true, updatedAt: Date.now() } : p
      )
    );

    setOpenTabs((prevTabs) => {
      const filtered = prevTabs.filter((id) => id !== pageId);
      if (filtered.length === 0) {
        const remaining = visiblePages.filter((p) => p.id !== pageId);
        return remaining.length > 0 ? [remaining[0].id] : [];
      }
      return filtered;
    });

    if (activePageId === pageId) {
      const remaining = visiblePages.filter((p) => p.id !== pageId);
      setActivePageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRestoreArchivedPage = (pageId) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, isArchived: false, updatedAt: Date.now() } : p
      )
    );
  };

  const handleArchivedPageToTrash = (pageId) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    setTrashPages((prev) => [page, ...prev]);
  };

  const handleArchiveActivePage = () => {
    if (!activePageId) return;
    handleArchivePage(activePageId);
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

  const handleExportPage = async () => {
    if (!activePage) return;
    const md = pageToMarkdown(activePage);
    const safeTitle = (activePage.title || 'untitled').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const defaultFilename = `${safeTitle}.md`;

    if (typeof window !== 'undefined' && window.electronAPI?.showSaveDialog && window.electronAPI?.writeFile) {
      try {
        const result = await window.electronAPI.showSaveDialog({
          title: 'Export Page as Markdown',
          defaultPath: defaultFilename,
          filters: [
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePath) {
          await window.electronAPI.writeFile(result.filePath, md, 'utf-8');
          return;
        }
        if (result.canceled) return;
      } catch (err) {
        console.warn('[Export] Native save dialog fallback:', err);
      }
    }

    downloadMarkdownFile(activePage);
  };

  const handleShowAbout = async () => {
    try {
      const info = window.electronAPI?.getInfo ? await window.electronAPI.getInfo() : null;
      const version = info?.version || import.meta.env?.VITE_APP_VERSION || '1.0.0';
      const platform = info?.platform ? ` (${info.platform})` : '';
      alert(`Noted${platform}\nVersi ${version}\n\nWorkspace catatan lokal-first dengan sinkronisasi cloud opsional.`);
    } catch (err) {
      console.warn('[About] Could not read the app info:', err);
      alert('Noted\nInformasi versi tidak dapat dibaca.');
    }
  };

  const handleCheckForUpdates = async () => {
    const result = await checkForUpdates();
    if (result.status === 'available') {
      const open = window.electronAPI?.openExternal
        ? window.confirm(`Versi ${result.latest} tersedia (kamu memakai ${result.current}).\nBuka halaman unduhan?`)
        : false;
      if (open) {
        window.electronAPI.openExternal(result.url);
      }
      return;
    }
    if (result.status === 'current') {
      alert(`Noted ${result.current} adalah versi terbaru.`);
      return;
    }
    alert(`Pemeriksaan versi gagal: ${result.message}`);
  };

  const handleShowShortcuts = () => {
    const mod = navigator.platform?.toLowerCase().includes('mac') ? '⌘' : 'Ctrl';
    alert([
      'Pintasan keyboard Noted',
      '',
      `${mod} + K — Pencarian cepat`,
      `${mod} + \\ — Sembunyikan / tampilkan sidebar`,
      `${mod} + Shift + ] — Tab berikutnya`,
      `${mod} + Shift + [ — Tab sebelumnya`,
      `${mod} + 1…9 — Lompat ke tab`,
      `${mod} + P — Pencarian cepat`,
      `${mod} + O — Impor Markdown`,
      `${mod} + Shift + E — Ekspor halaman sebagai Markdown`,
      `${mod} + Shift + T — Buka Sampah`,
      `${mod} + , — Pengaturan`
    ].join('\n'));
  };

  // Native Application Menu Listener (macOS & Windows Notion REA Menus)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.onMenuAction) {
      const cleanupMenu = window.electronAPI.onMenuAction((action) => {
        switch (action) {
          case 'open-settings':
            setIsSettingsOpen(true);
            break;
          case 'about':
            handleShowAbout();
            break;
          case 'check-updates':
            handleCheckForUpdates();
            break;
          case 'new-page':
            handleCreatePage(null);
            break;
          case 'new-subpage':
            handleCreatePage(activePageId || null);
            break;
          case 'search':
            setIsSearchOpen(true);
            break;
          case 'import':
            setIsImportOpen(true);
            break;
          case 'export':
            handleExportPage();
            break;
          case 'trash':
            setIsTrashOpen(true);
            break;
          case 'toggle-sidebar':
            setIsSidebarCollapsed((prev) => !prev);
            break;
          case 'toggle-theme':
            handleToggleTheme();
            break;
          case 'shortcuts':
            handleShowShortcuts();
            break;
          default:
            break;
        }
      });
      return cleanupMenu;
    }
  }, [activePage, activePageId]);

  // Commands that the command palette can run. The palette is not only a
  // search over the pages, it also exposes the actions of the app.
  const paletteCommands = [
    {
      id: 'new-page',
      title: 'New page',
      section: 'Create',
      icon: '📄',
      keywords: ['create', 'add', 'new', 'page'],
      run: () => handleCreatePage(null)
    },
    {
      id: 'new-subpage',
      title: 'New subpage',
      section: 'Create',
      icon: '📂',
      keywords: ['create', 'add', 'new', 'child', 'nested'],
      run: () => handleCreatePage(activePageId || null)
    },
    {
      id: 'import',
      title: 'Import Markdown',
      section: 'Files',
      icon: '📥',
      keywords: ['import', 'markdown', 'upload', 'open'],
      run: () => setIsImportOpen(true)
    },
    {
      id: 'export',
      title: 'Export this page as Markdown',
      section: 'Files',
      icon: '📤',
      keywords: ['export', 'markdown', 'download', 'save'],
      run: handleExportPage
    },
    {
      id: 'toggle-theme',
      title: theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme',
      section: 'View',
      icon: theme === 'dark' ? '☀️' : '🌙',
      keywords: ['theme', 'dark', 'light', 'appearance', 'mode'],
      run: handleToggleTheme
    },
    {
      id: 'toggle-sidebar',
      title: 'Toggle the sidebar',
      section: 'View',
      icon: '↔️',
      keywords: ['sidebar', 'hide', 'show', 'collapse'],
      run: () => setIsSidebarCollapsed((prev) => !prev)
    },
    {
      id: 'open-settings',
      title: 'Open the settings',
      section: 'View',
      icon: '⚙️',
      keywords: ['settings', 'preferences', 'config', 'options'],
      run: () => setIsSettingsOpen(true)
    },
    {
      id: 'open-trash',
      title: 'Open the trash',
      section: 'Workspace',
      icon: '🗑️',
      keywords: ['trash', 'bin', 'deleted', 'restore'],
      run: () => setIsTrashOpen(true)
    },
    {
      id: 'open-archive',
      title: 'Open the archive',
      section: 'Workspace',
      icon: '🗄️',
      keywords: ['archive', 'archived', 'storage'],
      run: () => setIsArchiveOpen(true)
    },
    {
      id: 'analytics',
      title: 'Page analytics',
      section: 'Insights',
      icon: '📊',
      keywords: ['analytics', 'stats', 'statistics', 'insights'],
      run: () => setIsAnalyticsOpen(true)
    },
    {
      id: 'history',
      title: 'Version history',
      section: 'Insights',
      icon: '🕘',
      keywords: ['history', 'versions', 'restore', 'snapshots'],
      run: () => setIsHistoryOpen(true)
    },
    {
      id: 'comments',
      title: 'Comments and discussions',
      section: 'Insights',
      icon: '💬',
      keywords: ['comments', 'discussion', 'feedback', 'thread'],
      run: () => setIsCommentsOpen(true)
    },
    {
      id: 'toggle-lock',
      title: activePage?.isLocked ? 'Unlock this page' : 'Lock this page',
      section: 'Workspace',
      icon: activePage?.isLocked ? '🔓' : '🔒',
      keywords: ['lock', 'unlock', 'readonly', 'read only'],
      run: () => handleUpdateActivePage({ isLocked: !activePage?.isLocked })
    },
    {
      id: 'archive-page',
      title: 'Archive this page',
      section: 'Workspace',
      icon: '🗄️',
      keywords: ['archive', 'remove', 'hide', 'page'],
      run: handleArchiveActivePage
    },
    {
      id: 'open-website',
      title: 'Open Noted Website',
      section: 'Workspace',
      icon: '🌐',
      keywords: ['website', 'marketing', 'landing', 'home'],
      run: handleOpenLandingWebsite
    },
    {
      id: 'open-download',
      title: 'Download Desktop & Mobile Apps',
      section: 'Workspace',
      icon: '📥',
      keywords: ['download', 'desktop', 'mac', 'windows', 'android', 'mobile', 'apk'],
      run: handleOpenDownloadPage
    },
    {
      id: 'open-docs',
      title: 'Help Center & Documentation',
      section: 'Workspace',
      icon: '📖',
      keywords: ['docs', 'help', 'guide', 'panduan', 'bantuan', 'documentation'],
      run: handleOpenDocsPage
    }
  ];

  // If in docs view, render the Notion-exact Help Center / Docs page
  if (currentView === 'docs') {
    return (
      <div className="noted-app-root noted-page-transition" key="docs">
        <NotedDocsPage
          onOpenApp={handleOpenWorkspace}
          onOpenLanding={handleOpenLandingWebsite}
          onOpenDownload={handleOpenDownloadPage}
          lang={lang}
          onSetLang={handleSetLang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <Toast />
      </div>
    );
  }

  // If in download view, render the Notion-exact download page
  if (currentView === 'download') {
    return (
      <div className="noted-app-root noted-page-transition" key="download">
        <NotionDownloadPage
          onOpenApp={handleOpenWorkspace}
          onOpenLanding={handleOpenLandingWebsite}
          onOpenDocs={handleOpenDocsPage}
          targetPlatform={downloadTargetPlatform}
          lang={lang}
          onSetLang={handleSetLang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <Toast />
      </div>
    );
  }

  // If in landing view, render the Notion-exact marketing page
  if (currentView === 'landing') {
    return (
      <div className="noted-app-root noted-page-transition" key="landing">
        <NotionLandingPage
          onOpenApp={handleOpenWorkspace}
          onOpenDownload={handleOpenDownloadPage}
          onOpenDocs={handleOpenDocsPage}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          currentUser={currentUser}
          lang={lang}
          onSetLang={handleSetLang}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <NotionLoginModal
          isOpen={isLoginModalOpen}
          showEmailAuth={false}
          lang={lang}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoginModalOpen(false);
            handleOpenWorkspace();
          }}
        />
        <Toast />
      </div>
    );
  }

  return (
    <div className={`noted-app-layout noted-page-transition ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`} key="workspace">
      {/* Sidebar Navigation */}
      <Sidebar
        pages={visiblePages}
        archivedCount={archivedPages.length}
        onOpenArchive={() => setIsArchiveOpen(true)}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onArchivePage={handleArchivePage}
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
        onOpenWebsite={handleOpenLandingWebsite}
      />

      {/* Main Workspace Frame */}
      <main className="noted-main-workspace">
        {/* Notion Desktop Tab Bar (Unified Top Window Bar) */}
        <TabBar
          tabs={openTabs}
          pages={visiblePages}
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
              pages={visiblePages}
              onSelectPage={handleSelectPage}
              isSidebarCollapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
              onOpenAI={() => setIsAIOpen((prev) => !prev)}
              onOpenComments={() => setIsCommentsOpen((prev) => !prev)}
              onToggleFavorite={handleToggleFavorite}
              onUpdatePage={handleUpdateActivePage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onArchivePage={handleArchivePage}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenAnalytics={() => setIsAnalyticsOpen(true)}
              onOpenImportModal={() => setIsImportOpen(true)}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              cloudSyncStatus={cloudSyncStatus}
              lastSyncedAt={lastSyncedAt}
              onTriggerCloudSync={handleTriggerCloudSync}
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              collaborators={collaborators}
              onOpenWebsite={handleOpenLandingWebsite}
            />
            <RemoteCursor cursors={remoteCursors} />
            <Editor
              key={activePage.id}
              page={activePage}
              allPages={visiblePages}
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
            {typingUsers.length > 0 && (
              <div className="noted-typing-indicator-wrap">
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            )}
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
          pages={visiblePages}
          commands={paletteCommands}
          onSelectPage={handleSelectPage}
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
        showEmailAuth={false}
        lang={lang}
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

      {isArchiveOpen && (
        <ArchiveModal
          archivedPages={archivedPages}
          onRestorePage={handleRestoreArchivedPage}
          onMoveToTrash={handleArchivedPageToTrash}
          onClose={() => setIsArchiveOpen(false)}
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
        allPages={visiblePages}
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
      {/* Floating Toast Notifications */}
      <Toast />
    </div>
  );
}

export default App;
