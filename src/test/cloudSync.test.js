import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCloudSyncState,
  checkCloudDatabaseStatus,
  pullCloudWorkspace,
  triggerCloudSync
} from '../utils/cloudSync';

describe('Cloud & PostgreSQL Sync Engine (Notion REA)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides the current sync state synchronously', () => {
    const state = getCloudSyncState();
    expect(state).toBeDefined();
    expect(['synced', 'syncing', 'offline', 'local']).toContain(state.status);
  });

  it('handles guest user in pullCloudWorkspace gracefully without network requests', async () => {
    const guestUser = { id: 'guest', isLoggedIn: false };
    const res = await pullCloudWorkspace(guestUser);
    expect(res).toBeNull();
  });

  it('handles guest user in triggerCloudSync without network requests', () => {
    const guestUser = { id: 'guest', isLoggedIn: false };
    triggerCloudSync(guestUser, []);
    expect(getCloudSyncState().status).toBe('local');
  });

  it('pulls workspace data from remote PostgreSQL when user is logged in', async () => {
    const mockUser = { id: 'user_test_99', isLoggedIn: true, name: 'Dani' };
    const mockResponse = {
      success: true,
      mode: 'cloud_postgres',
      pages: [{ id: 'p1', title: 'Remote Page 1', blocks: [] }],
      trash: [],
      workspaceSettings: { theme: 'light' }
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await pullCloudWorkspace(mockUser);
    expect(result).toBeDefined();
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].title).toBe('Remote Page 1');
  });

  it('handles network failure during pull by falling back gracefully to offline status', async () => {
    const mockUser = { id: 'user_test_99', isLoggedIn: true, name: 'Dani' };

    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    const result = await pullCloudWorkspace(mockUser);
    expect(result).toBeNull();
    expect(getCloudSyncState().status).toBe('offline');
  });

  it('handles checkCloudDatabaseStatus with remote status response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        connected: true,
        configured: true,
        engine: 'PostgreSQL',
        database: 'noted_prod',
        latencyMs: 14
      })
    });

    const status = await checkCloudDatabaseStatus();
    expect(status.connected).toBe(true);
    expect(status.engine).toBe('PostgreSQL');
    expect(status.database).toBe('noted_prod');
  });
});
