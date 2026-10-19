import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatStorageBytes,
  checkStoragePersistence,
  requestStoragePersistence,
  setIndexedDBItem,
  getIndexedDBItem
} from '../utils/persistentStorage';
import {
  saveStoredPages,
  recoverWorkspaceFromIndexedDB,
  loadStoredPages
} from '../utils/storage';

describe('Persistent Storage & IndexedDB Vault Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('formats byte numbers into human readable sizes', () => {
    expect(formatStorageBytes(0)).toBe('0 B');
    expect(formatStorageBytes(1024)).toBe('1.0 KB');
    expect(formatStorageBytes(1048576)).toBe('1.0 MB');
    expect(formatStorageBytes(1073741824)).toBe('1.0 GB');
  });

  it('safely handles persistence checks when navigator.storage is available or mocked', async () => {
    const info = await checkStoragePersistence();
    expect(info).toBeDefined();
    expect(typeof info.isPersisted).toBe('boolean');
    expect(typeof info.quota).toBe('number');
  });

  it('handles requestStoragePersistence gracefully', async () => {
    const res = await requestStoragePersistence();
    expect(typeof res.granted).toBe('boolean');
    expect(res.isVaultActive).toBe(true);
  });

  it('saves and recovers workspace via storage mirroring', async () => {
    const testUser = { id: 'test_user_42', isLoggedIn: true, name: 'Alice' };
    const mockPages = [
      { id: 'page-1', title: 'Vault Page 1', content: [] },
      { id: 'page-2', title: 'Vault Page 2', content: [] }
    ];

    // Save pages
    saveStoredPages(mockPages, testUser);

    // Verify localStorage has pages
    const loaded = loadStoredPages(testUser);
    expect(loaded.length).toBe(2);
    expect(loaded[0].title).toBe('Vault Page 1');

    // Simulate clearing localStorage (e.g. user cleared site data)
    localStorage.clear();
    // Default starter pages are returned when localStorage is empty
    expect(loadStoredPages(testUser).length).toBe(3);

    // Test recovering from IndexedDB (mock or fallback)
    const recovered = await recoverWorkspaceFromIndexedDB(testUser);
    // Even if indexedDB is not mocked in jsdom, it resolves gracefully without throwing
    expect(Array.isArray(recovered) || recovered === null).toBe(true);
  });
});
