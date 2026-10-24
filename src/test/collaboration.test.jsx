import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CollaborationProvider,
  createCollaborationDoc,
  createSharedText,
  createSharedMap
} from '../utils/collaboration/yjsProvider';
import PresenceIndicator from '../components/Collaboration/PresenceIndicator';
import RemoteCursor from '../components/Collaboration/RemoteCursor';
import TypingIndicator from '../components/Collaboration/TypingIndicator';
import { OfflineQueue } from '../utils/collaboration/offlineQueue';
import { TopNav } from '../components/TopNav/TopNav';

describe('Real-time Collaboration & Presence (PRD-03)', () => {
  describe('Yjs CRDT Collaboration Provider (yjsProvider.js)', () => {
    it('initializes a collaboration doc and sub-types', () => {
      const doc = createCollaborationDoc();
      expect(doc).toBeDefined();

      const sharedText = createSharedText(doc, 'content');
      sharedText.insert(0, 'Hello CRDT');
      expect(sharedText.toString()).toBe('Hello CRDT');

      const sharedMap = createSharedMap(doc, 'meta');
      sharedMap.set('author', 'Dani');
      expect(sharedMap.get('author')).toBe('Dani');
    });

    it('manages provider lifecycle and state cleanly', () => {
      const doc = createCollaborationDoc();
      const provider = new CollaborationProvider('room-test', doc);

      expect(provider.roomName).toBe('room-test');
      expect(provider.connected).toBe(false);
      expect(provider.getUsers()).toEqual([]);

      const randomColor = provider.getRandomColor();
      expect(randomColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

      // Clean destroy without exceptions
      expect(() => provider.destroy()).not.toThrow();
    });
  });

  describe('Presence Indicator Component (PresenceIndicator.jsx)', () => {
    it('returns null when no users are active', () => {
      const { container } = render(<PresenceIndicator users={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders user avatars with colored circles and initials', () => {
      const mockUsers = [
        { id: 'u1', name: 'Dani Akbar', color: '#FF6B6B' },
        { id: 'u2', name: 'Alex River', color: '#4ECDC4' }
      ];

      render(<PresenceIndicator users={mockUsers} />);

      expect(screen.getByText('D')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByTitle('Dani Akbar')).toBeInTheDocument();
      expect(screen.getByTitle('Alex River')).toBeInTheDocument();
    });

    it('displays overflow indicator when more than 5 users are collaborating', () => {
      const mockUsers = [
        { id: '1', name: 'User 1', color: '#111' },
        { id: '2', name: 'User 2', color: '#222' },
        { id: '3', name: 'User 3', color: '#333' },
        { id: '4', name: 'User 4', color: '#444' },
        { id: '5', name: 'User 5', color: '#555' },
        { id: '6', name: 'User 6', color: '#666' },
        { id: '7', name: 'User 7', color: '#777' }
      ];

      render(<PresenceIndicator users={mockUsers} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('Remote Cursors & Typing Indicators (T-SYNC-003, T-SYNC-006)', () => {
    it('renders remote collaborator cursors', () => {
      const cursors = [
        { x: 120, y: 250, user: { name: 'Sarah', color: '#e83e8c' } }
      ];
      render(<RemoteCursor cursors={cursors} />);
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    it('renders typing indicator when peers type', () => {
      const typingUsers = [
        { user: { name: 'Alex' } }
      ];
      render(<TypingIndicator typingUsers={typingUsers} />);
      expect(screen.getByText('Alex is typing...')).toBeInTheDocument();
    });

    it('handles multiple users typing format correctly', () => {
      const typingUsers = [
        { user: { name: 'Alex' } },
        { user: { name: 'Sarah' } }
      ];
      render(<TypingIndicator typingUsers={typingUsers} />);
      expect(screen.getByText('Alex and Sarah are typing...')).toBeInTheDocument();
    });
  });

  describe('Offline Mutation Queue (T-SYNC-005)', () => {
    let queue;

    beforeEach(() => {
      localStorage.clear();
      queue = new OfflineQueue({ storageKey: 'test_offline_queue' });
    });

    it('enqueues mutations and persists them to storage', () => {
      expect(queue.getPendingCount()).toBe(0);

      const item = queue.enqueue({ type: 'update_block', payload: { blockId: 'b1', text: 'Hello' } });
      expect(item).toBeDefined();
      expect(queue.getPendingCount()).toBe(1);

      const stored = queue.getQueue();
      expect(stored[0].payload.text).toBe('Hello');
    });

    it('replays mutations in FIFO order and removes processed items', async () => {
      queue.enqueue({ type: 'm1', payload: 'first' });
      queue.enqueue({ type: 'm2', payload: 'second' });

      const replayed = [];
      await queue.replay(async (item) => {
        replayed.push(item.payload);
      });

      expect(replayed).toEqual(['first', 'second']);
      expect(queue.getPendingCount()).toBe(0);
    });
  });

  describe('TopNav Presence Integration', () => {
    const mockPage = { id: 'p1', title: 'Collaborative Doc', isFavorite: false };

    it('renders presence indicator when collaborators are passed', () => {
      const collaborators = [{ id: 'collab-1', name: 'Dani', color: '#FF6B6B' }];
      render(
        <TopNav
          page={mockPage}
          currentUser={{ id: 'current', name: 'Dani' }}
          collaborators={collaborators}
        />
      );

      expect(screen.getByTitle('Dani')).toBeInTheDocument();
    });
  });
});
