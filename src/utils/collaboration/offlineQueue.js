/**
 * Offline Mutation Queue (PRD-03 T-SYNC-005)
 * Queues local page/block mutations when offline and automatically replays upon reconnection.
 * Reverse Engineered from Notion Desktop offline sync engine.
 */

const STORAGE_KEY = 'noted_offline_mutation_queue_v1';

export class OfflineQueue {
  constructor(options = {}) {
    this.storageKey = options.storageKey || STORAGE_KEY;
    this.isReplaying = false;
    this.onReplayCallback = options.onReplay || null;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.replay());
    }
  }

  getQueue() {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  enqueue(mutation) {
    if (!mutation) return;
    const queue = this.getQueue();
    const item = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type: mutation.type || 'update_page',
      payload: mutation.payload || mutation
    };
    queue.push(item);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch (e) {
      console.warn('[OfflineQueue] Failed to persist mutation:', e);
    }
    return item;
  }

  clear() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {}
  }

  remove(mutationId) {
    const queue = this.getQueue().filter(m => m.id !== mutationId);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(queue));
    } catch {}
  }

  async replay(replayHandler = null) {
    if (this.isReplaying) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;

    this.isReplaying = true;
    const handler = replayHandler || this.onReplayCallback;

    try {
      for (const item of [...queue]) {
        if (handler) {
          await handler(item);
        }
        this.remove(item.id);
      }
    } catch (err) {
      console.error('[OfflineQueue] Replay interrupted:', err);
    } finally {
      this.isReplaying = false;
    }
  }

  getPendingCount() {
    return this.getQueue().length;
  }
}

export const offlineQueue = new OfflineQueue();

