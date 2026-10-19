import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStoredPages,
  saveStoredPages,
  loadStoredTrash,
  saveStoredTrash,
  loadTheme,
  saveTheme,
  loadStoredOpenTabs,
  saveStoredOpenTabs
} from '../utils/storage';

describe('QA Suite 7: Storage & Workspace Persistence (Notion REA)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads initial pages when storage is empty', () => {
    const pages = loadStoredPages();
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThan(0);
    // Initial pages should include essential workspace notes
    expect(pages.some((p) => p.id === 'page-page' || p.id === 'page-notes')).toBe(true);
  });

  it('saves and reloads custom pages properly', () => {
    const customPages = [
      {
        id: 'page-custom-1',
        title: 'Project Alpha',
        icon: '🚀',
        blocks: [{ id: 'b-1', type: 'paragraph', text: 'Alpha kickoff notes' }]
      }
    ];

    saveStoredPages(customPages);
    const loaded = loadStoredPages();
    expect(loaded.some((p) => p.id === 'page-custom-1')).toBe(true);
  });

  it('manages trash lifecycle (saving and reloading deleted pages)', () => {
    expect(loadStoredTrash()).toEqual([]);

    const trashedPages = [
      { id: 'trashed-1', title: 'Old Draft', deletedAt: Date.now() }
    ];
    saveStoredTrash(trashedPages);

    const reloaded = loadStoredTrash();
    expect(reloaded.length).toBe(1);
    expect(reloaded[0].id).toBe('trashed-1');
  });

  it('manages theme persistence (light vs dark mode)', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');

    saveTheme('light');
    expect(loadTheme()).toBe('light');
  });

  it('persists open tab IDs across sessions', () => {
    expect(loadStoredOpenTabs()).toBeNull();

    const openTabs = ['page-page', 'page-meetings', 'page-notes'];
    saveStoredOpenTabs(openTabs);

    const loadedTabs = loadStoredOpenTabs();
    expect(loadedTabs).toEqual(openTabs);
  });

  it('provides account-scoped workspace isolation and personalized starter pages', () => {
    // 1. Guest workspace has default pages
    const guestPages = loadStoredPages();
    expect(guestPages.some((p) => p.id === 'page-page' || p.id === 'page-projects')).toBe(true);

    // 2. Log in with Google user
    const googleUser = {
      id: 'google_109238',
      name: 'Dani Akbar',
      email: 'dani@gmail.com',
      isLoggedIn: true
    };

    // First time login initializes personalized starter pages
    const userPages = loadStoredPages(googleUser);
    expect(userPages.length).toBeGreaterThan(0);
    expect(userPages.some((p) => p.title.includes('Welcome, Dani!'))).toBe(true);
    expect(userPages.some((p) => p.title.includes("Dani's Projects & Tasks"))).toBe(true);

    // 3. User modifies their workspace by adding a new private page
    const updatedUserPages = [
      ...userPages,
      { id: 'page-secret-1', title: 'Dani Private Plan', blocks: [] }
    ];
    saveStoredPages(updatedUserPages, googleUser);

    // 4. Guest workspace remains completely untouched and isolated
    const reloadGuestPages = loadStoredPages();
    expect(reloadGuestPages.some((p) => p.id === 'page-secret-1')).toBe(false);

    // 5. Switching back to Google user loads their saved private pages
    const reloadUserPages = loadStoredPages(googleUser);
    expect(reloadUserPages.some((p) => p.id === 'page-secret-1')).toBe(true);
  });
});
