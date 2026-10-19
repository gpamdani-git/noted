// Storage manager for noted - persists pages, theme, and workspace settings to localStorage
// Supports multi-account workspace isolation and user-specific page sets (Reverse Engineered from Notion Desktop Space Models)

import { INITIAL_PAGES } from '../constants/initialData';
import { getCurrentUser } from './comments';
import {
  setIndexedDBItem,
  getIndexedDBItem,
  checkStoragePersistence,
  requestStoragePersistence,
  formatStorageBytes
} from './persistentStorage';

export {
  checkStoragePersistence,
  requestStoragePersistence,
  formatStorageBytes
};

const STORAGE_KEYS = {
  PAGES: 'noted_pages_v2',
  ACTIVE_PAGE: 'noted_active_page_v2',
  THEME: 'noted_theme_v1',
  WORKSPACE_NAME: 'noted_workspace_name_v1',
  TRASH: 'noted_trash_v2'
};

export const getStorageScope = (user = null) => {
  const activeUser = user || getCurrentUser();
  if (activeUser && activeUser.isLoggedIn && activeUser.id) {
    return `user_${activeUser.id}`;
  }
  return 'guest';
};

// Generates personalized starter pages for newly logged-in accounts
export const createDefaultUserPages = (user) => {
  const userName = user?.name || 'Dani';
  const userFirstName = userName.split(' ')[0];
  const userEmail = user?.email || 'user@workspace.local';
  const now = Date.now();

  return [
    {
      id: `page-welcome-${user?.id || now}`,
      title: `Welcome, ${userFirstName}!`,
      icon: '👋',
      cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      parentId: null,
      isFavorite: true,
      isLocked: false,
      fullWidth: false,
      fontFamily: 'sans',
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: `b-welcome-h1-${now}`,
          type: 'heading_1',
          text: `Welcome to your personal workspace, ${userName}!`
        },
        {
          id: `b-welcome-callout-${now}`,
          type: 'callout',
          icon: '✨',
          text: `Ruang kerja ini terhubung dengan akun Google **${userEmail}**. Semua catatan, dokumen, dan proyek di sini tersimpan khusus untuk profil Anda.`
        },
        {
          id: `b-welcome-h2-todo-${now}`,
          type: 'heading_2',
          text: 'Langkah Awal untuk Memulai'
        },
        {
          id: `b-welcome-todo-1-${now}`,
          type: 'todo',
          text: `Berhasil masuk dengan akun Google (${userEmail})`,
          checked: true
        },
        {
          id: `b-welcome-todo-2-${now}`,
          type: 'todo',
          text: 'Coba ketik "/" pada baris baru untuk membuka menu blok Notion',
          checked: false
        },
        {
          id: `b-welcome-todo-3-${now}`,
          type: 'todo',
          text: 'Buat halaman baru atau sub-halaman di sidebar kiri',
          checked: false
        },
        {
          id: `b-welcome-todo-4-${now}`,
          type: 'todo',
          text: 'Beri bintang pada halaman penting untuk menyematkannya di Favorites',
          checked: false
        },
        {
          id: `b-welcome-div-${now}`,
          type: 'divider'
        },
        {
          id: `b-welcome-quote-${now}`,
          type: 'quote',
          text: '“Write freely, organize effortlessly. Think it. Plan it. Build it.”'
        }
      ]
    },
    {
      id: `page-projects-${user?.id || now}`,
      title: `${userFirstName}'s Projects & Tasks`,
      icon: '🎯',
      cover: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
      parentId: null,
      isFavorite: false,
      isLocked: false,
      fullWidth: true,
      fontFamily: 'sans',
      createdAt: now - 3600000,
      updatedAt: now,
      blocks: [
        {
          id: `b-proj-desc-${now}`,
          type: 'paragraph',
          text: 'Daftar proyek dan target prioritas yang sedang berjalan.'
        },
        {
          id: `b-proj-table-${now}`,
          type: 'table',
          viewType: 'table',
          headers: ['Task / Project', 'Category', 'Status', 'Target Date'],
          columnTypes: ['text', 'text', 'status', 'date'],
          rows: [
            ['Eksplorasi Noted Workspace', 'Personal', 'In progress', '2026-10-25'],
            ['Sinkronisasi Google Cloud OAuth', 'Setup', 'Done', '2026-10-19'],
            ['Penyusunan Rencana Kerja Mingguan', 'Planning', 'Not started', '2026-10-31']
          ]
        }
      ]
    },
    {
      id: `page-notes-${user?.id || now}`,
      title: 'Quick Notes & Journal',
      icon: '📝',
      cover: null,
      parentId: null,
      isFavorite: false,
      isLocked: false,
      fullWidth: false,
      fontFamily: 'sans',
      createdAt: now - 7200000,
      updatedAt: now,
      blocks: [
        {
          id: `b-notes-h2-${now}`,
          type: 'heading_2',
          text: 'Ide & Catatan Harian'
        },
        {
          id: `b-notes-p1-${now}`,
          type: 'paragraph',
          text: 'Tempat cepat untuk menangkap ide spontan, link penting, dan rangkuman kegiatan.'
        },
        {
          id: `b-notes-bullet-1-${now}`,
          type: 'bulleted_list_item',
          text: 'Gunakan AI Assistant (ikon spark di bawah) untuk merangkum atau menerjemahkan catatan.'
        },
        {
          id: `b-notes-bullet-2-${now}`,
          type: 'bulleted_list_item',
          text: 'Setiap blok dapat diberi komentar dan diskusi tim secara real-time.'
        }
      ]
    }
  ];
};

export const loadStoredPages = (user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? STORAGE_KEYS.PAGES : `noted_pages_${scope}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (scope === 'guest') {
          // Clean legacy test pages (page-page, page-rea-report, page-kategori-d)
          const legacyTestPageIds = ['page-page', 'page-rea-report', 'page-kategori-d'];
          const filtered = parsed.filter((p) => !legacyTestPageIds.includes(p.id));
          if (filtered.length !== parsed.length) {
            parsed = filtered.length > 0 ? filtered : [...INITIAL_PAGES];
            localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(parsed));
          }

          // Ensure pristine starter pages exist if empty
          if (parsed.length === 0) {
            parsed = [...INITIAL_PAGES];
            localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(parsed));
          }
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load pages for scope ${scope}`, err);
  }

  // If user is logged in and has no pages saved yet, create their personalized starter pages
  const activeUser = user || getCurrentUser();
  if (activeUser && activeUser.isLoggedIn) {
    const userStarterPages = createDefaultUserPages(activeUser);
    try {
      localStorage.setItem(key, JSON.stringify(userStarterPages));
    } catch (e) {
      console.warn('Failed to save default user pages:', e);
    }
    return userStarterPages;
  }

  return INITIAL_PAGES;
};

export const saveStoredPages = (pages, user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? STORAGE_KEYS.PAGES : `noted_pages_${scope}`;
  try {
    localStorage.setItem(key, JSON.stringify(pages));
    if (scope === 'guest') {
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));
    }
    // Asynchronously mirror into durable IndexedDB to survive browser cache clearing
    setIndexedDBItem(key, pages);
    setIndexedDBItem(`${key}_backup_snapshot`, { pages, timestamp: Date.now() });
  } catch (err) {
    console.error(`Failed to save pages for scope ${scope}`, err);
  }
};

/**
 * Recovers workspace pages from durable IndexedDB if localStorage was wiped
 */
export const recoverWorkspaceFromIndexedDB = async (user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? STORAGE_KEYS.PAGES : `noted_pages_${scope}`;
  try {
    const fromIdb = await getIndexedDBItem(key);
    if (fromIdb && Array.isArray(fromIdb) && fromIdb.length > 0) {
      localStorage.setItem(key, JSON.stringify(fromIdb));
      if (scope === 'guest') {
        localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(fromIdb));
      }
      return fromIdb;
    }
  } catch (err) {
    console.warn('Failed to recover from IndexedDB:', err);
  }
  return null;
};

export const loadStoredTrash = (user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? STORAGE_KEYS.TRASH : `noted_trash_${scope}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Failed to load trash from scope ${scope}`, err);
  }
  return [];
};

export const saveStoredTrash = (trashPages, user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? STORAGE_KEYS.TRASH : `noted_trash_${scope}`;
  try {
    localStorage.setItem(key, JSON.stringify(trashPages));
  } catch (err) {
    console.error(`Failed to save trash for scope ${scope}`, err);
  }
};

export const loadStoredOpenTabs = (user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? 'noted_open_tabs_v1' : `noted_open_tabs_${scope}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error(`Failed to load open tabs for scope ${scope}`, err);
  }
  return null;
};

export const saveStoredOpenTabs = (tabIds, user = null) => {
  const scope = getStorageScope(user);
  const key = scope === 'guest' ? 'noted_open_tabs_v1' : `noted_open_tabs_${scope}`;
  try {
    localStorage.setItem(key, JSON.stringify(tabIds));
  } catch (err) {
    console.error(`Failed to save open tabs for scope ${scope}`, err);
  }
};

export const loadTheme = () => {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark' || theme === 'light') return theme;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback
  }
  return 'light';
};

export const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme', err);
  }
};

export const exportWorkspaceJSON = (pages) => {
  const data = {
    app: 'noted',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    pages
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noted-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
