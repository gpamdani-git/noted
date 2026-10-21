import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCloudSyncState,
  checkCloudDatabaseStatus,
  pullCloudWorkspace,
  triggerCloudSync,
  broadcastLocalChange,
  subscribeToMultiTabSync,
  startLiveSyncPulse,
  tabId
} from '../utils/cloudSync';
import { setSessionToken, clearSessionToken } from '../utils/session';

describe('Cloud & PostgreSQL Sync Engine (Notion REA)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearSessionToken();
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

  it('pulls workspace data from the sync API when a session token is present', async () => {
    setSessionToken('server-issued-session-token');
    const mockUser = { id: 'user_test_99', isLoggedIn: true, name: 'Dani' };
    const mockResponse = {
      success: true,
      mode: 'cloud_postgres',
      pages: [{ id: 'p1', title: 'Remote Page 1', blocks: [] }],
      trash: [],
      workspaceSettings: { theme: 'light' }
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await pullCloudWorkspace(mockUser);
    expect(result).toBeDefined();
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].title).toBe('Remote Page 1');

    // The session token must be attached as a bearer token
    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer server-issued-session-token');
  });

  it('does not call the network when no cloud session exists', async () => {
    const mockUser = { id: 'user_test_99', isLoggedIn: true, name: 'Dani' };
    const fetchSpy = vi.spyOn(global, 'fetch');

    const result = await pullCloudWorkspace(mockUser);
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handles network failure during pull by falling back gracefully to offline status', async () => {
    setSessionToken('server-issued-session-token');
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

  it('provides a unique tabId for multi-tab synchronization', () => {
    expect(tabId).toBeDefined();
    expect(typeof tabId).toBe('string');
    expect(tabId.startsWith('tab_')).toBe(true);
  });

  it('broadcastLocalChange and subscribeToMultiTabSync function safely', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToMultiTabSync(callback);
    expect(typeof unsubscribe).toBe('function');

    expect(() => {
      broadcastLocalChange({ pages: [{ id: 'p1' }] });
    }).not.toThrow();

    unsubscribe();
  });

  it('startLiveSyncPulse initializes and cleans up event listeners', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const cleanup = startLiveSyncPulse({
      getUser: () => ({ id: 'u1', isLoggedIn: true }),
      onRemoteUpdate: vi.fn(),
      intervalMs: 50000
    });

    expect(typeof cleanup).toBe('function');
    expect(addEventSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function));

    cleanup();
    expect(removeEventSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(removeEventSpy).toHaveBeenCalledWith('online', expect.any(Function));
  });
});
