/**
 * Yjs Collaboration Provider (PRD-03 T-SYNC-002, T-SYNC-003, T-SYNC-006)
 * Real-time collaboration with CRDT, Presence Cursors, and Typing Indicators
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

export class CollaborationProvider {
  constructor(roomName, doc, options = {}) {
    this.roomName = roomName;
    this.doc = doc || new Y.Doc();
    this.options = options;
    this.provider = null;
    this.awareness = null;
    this.connected = false;
    this.users = new Map();
    this.cursors = new Map();
    this.typing = new Map();
  }

  connect() {
    const serverUrl = this.options.serverUrl || 'ws://localhost:1234';
    
    try {
      this.provider = new WebsocketProvider(serverUrl, this.roomName, this.doc, {
        connect: true,
        awareness: new Awareness(this.doc)
      });
      
      this.awareness = this.provider.awareness;
      
      this.provider.on('status', ({ status }) => {
        this.connected = status === 'connected';
      });
      
      this.awareness.on('change', () => {
        this.users.clear();
        this.cursors.clear();
        this.typing.clear();

        this.awareness.getStates().forEach((state, clientId) => {
          if (clientId === this.doc.clientID) return;
          if (state.user) {
            this.users.set(clientId, state.user);
          }
          if (state.cursor && state.user) {
            this.cursors.set(clientId, { ...state.cursor, user: state.user });
          }
          if (state.typing && state.user) {
            this.typing.set(clientId, { ...state.typing, user: state.user });
          }
        });
      });
      
      return this.provider;
    } catch (error) {
      console.warn('Failed to connect to collaboration server:', error);
      throw error;
    }
  }

  setUser(user) {
    if (this.awareness) {
      this.awareness.setLocalStateField('user', {
        id: user.id,
        name: user.name,
        color: user.color || this.getRandomColor(),
        avatar: user.avatar
      });
    }
  }

  setCursor(cursor) {
    if (this.awareness) {
      this.awareness.setLocalStateField('cursor', cursor ? {
        x: cursor.x,
        y: cursor.y,
        blockId: cursor.blockId,
        updatedAt: Date.now()
      } : null);
    }
  }

  setTyping(isTyping, blockId = null) {
    if (this.awareness) {
      this.awareness.setLocalStateField('typing', isTyping ? {
        blockId,
        timestamp: Date.now()
      } : null);
    }
  }

  getUsers() {
    return Array.from(this.users.values());
  }

  getCursors() {
    return Array.from(this.cursors.values());
  }

  getTypingUsers() {
    return Array.from(this.typing.values());
  }

  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
    }
    this.connected = false;
  }

  destroy() {
    if (this.provider) {
      try {
        this.provider.destroy();
      } catch {}
      this.provider = null;
    }
    this.connected = false;
  }

  getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export function createCollaborationDoc() {
  return new Y.Doc();
}

export function createSharedText(doc, name) {
  return doc.getText(name);
}

export function createSharedMap(doc, name) {
  return doc.getMap(name);
}
