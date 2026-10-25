# PRD 03: Real-time Collaboration

**PRD ID:** PRD-03  
**Priority:** P1 - High  
**Phase:** Phase 3: Real-time Collaboration  
**Timeline:** Week 9-12 (4 weeks, ~26 days)  
**Status:** In Progress (Foundation & Client Presence Implemented 2026-10-24)  
**Owner:** Collaboration Team  

---

## 1. Overview

Noted currently uses polling-based sync (10s intervals) with BroadcastChannel for multi-tab sync. Notion has true real-time multiplayer with presence, cursors, typing indicators, and conflict-free collaborative editing. This PRD implements WebSocket-based real-time sync with CRDT (Yjs) for conflict-free editing and full presence features.

### Business Goal
Enable real-time multiplayer collaboration to compete with Notion's collaborative features while maintaining Noted's local-first architecture.

### Success Criteria
- WebSocket server deployed and operational
- Yjs CRDT integration for conflict-free block editing
- Real-time presence with cursors and avatars
- Typing indicators
- Conflict resolution UI
- Offline queue with automatic replay
- <200ms sync latency

---

## 2. Current State vs Target State

| Feature | Current | Target | Gap |
|---------|---------|--------|-----|
| **Sync Method** | HTTP polling (10s) + BroadcastChannel | WebSocket real-time | Critical |
| **Conflict Resolution** | Last-write-wins | CRDT (conflict-free) | Critical |
| **Presence** | None | Cursors, avatars, selection | Critical |
| **Typing Indicators** | None | Per-block/user indicators | High |
| **Multiplayer Editing** | Single user effective | Multiple simultaneous users | Critical |
| **Offline Support** | Basic optimistic UI | Queue with replay | High |

---

## 3. Requirements

### 3.1 WebSocket Server (T-SYNC-001) - 10 days

**Architecture Options:**
1. **Neon Functions** - Serverless, scales to zero, integrated with DB
2. **Separate Node.js server** (Railway/Render/Fly.io) - More control, persistent
3. **Pusher/Ably** - Third-party, easier but cost

**Recommendation:** Start with separate Node.js WebSocket server for reliability, can migrate to Neon Functions later.

**Server Features:**
- [ ] WebSocket connection management
- [ ] Room-based (per page/workspace)
- [ ] Authentication via session tokens
- [ ] Message routing
- [ ] Heartbeat/ping-pong
- [ ] Reconnection handling
- [ ] Rate limiting
- [ ] Logging

**Tech Stack:**
```json
{
  "dependencies": {
    "ws": "^8.16.0",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0"
  }
}
```

### 3.2 CRDT Integration with Yjs (T-SYNC-002) - 8 days

**Why Yjs:**
- Battle-tested for collaborative editing
- Works offline
- Efficient binary encoding
- Rich ecosystem (y-websocket, y-indexeddb)
- Used by many Notion alternatives

**Implementation:**
- [ ] Install Yjs dependencies
- [ ] Convert block tree to Y.Doc structure
- [ ] Integrate with existing editor
- [ ] y-websocket provider for sync
- [ ] y-indexeddb for offline persistence
- [ ] Awareness protocol for presence
- [ ] Sync with existing storage

**Yjs Structure:**
```javascript
const ydoc = new Y.Doc();
const yblocks = ydoc.getArray('blocks');
const ymeta = ydoc.getMap('meta');
```

### 3.3 Presence System (T-SYNC-003) - 3 days

**Features:**
- [ ] User awareness (name, avatar, color)
- [ ] Cursor positions (page coordinates)
- [ ] Text selection ranges
- [ ] Active users list
- [ ] Avatar stack in top nav
- [ ] "X users viewing" indicator

**UI Components:**
```jsx
// src/components/Collaboration/PresenceAvatars.jsx
// src/components/Collaboration/RemoteCursor.jsx
// src/components/Collaboration/SelectionHighlight.jsx
```

### 3.4 Conflict Resolution UI (T-SYNC-004) - 2 days

**Scenarios:**
- [ ] Concurrent edits to same block
- [ ] Offline edits merged on reconnect
- [ ] Deletion conflicts
- [ ] Structural changes

**UI:**
- [ ] "Changes merged" toast notification
- [ ] Conflict resolution modal (if manual resolution needed)
- [ ] Version history integration
- [ ] Undo/redo awareness

### 3.5 Offline Queue (T-SYNC-005) - 2 days

**Features:**
- [ ] Queue mutations while offline
- [ ] IndexedDB for queue storage
- [ ] Automatic replay on reconnect
- [ ] Retry with exponential backoff
- [ ] Queue status indicator
- [ ] Conflict resolution on replay

### 3.6 Typing Indicators (T-SYNC-006) - 1 day

**Features:**
- [ ] Show "User is typing..." in active block
- [ ] Debounced typing events
- [ ] Auto-clear after timeout
- [ ] Multiple users typing

---

## 4. Technical Architecture

### WebSocket Server Structure
```javascript
// server/websocket/index.js
const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocket.Server({ port: 1234 });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { docName: getDocName(req) });
});
```

### Client Integration
```javascript
// src/utils/collaboration/yjsProvider.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export function setupCollaboration(docId, user) {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(
    'wss://collab.noted.app',
    docId,
    ydoc
  );
  const persistence = new IndexeddbPersistence(docId, ydoc);
  
  // Setup awareness
  provider.awareness.setLocalStateField('user', user);
  
  return { ydoc, provider, awareness: provider.awareness };
}
```

### Message Protocol
```javascript
// Client -> Server
{ type: 'sync', docId: '...', update: Uint8Array }
{ type: 'awareness', docId: '...', state: {...} }
{ type: 'presence', docId: '...', cursor: {...} }

// Server -> Client
{ type: 'sync', update: Uint8Array }
{ type: 'awareness', states: [...] }
```

---

## 5. Security Considerations

- [ ] JWT authentication for WebSocket connections
- [ ] Room access control (check page permissions)
- [ ] Rate limiting per user
- [ ] Message size limits
- [ ] Input validation
- [ ] CORS/origin checking
- [ ] TLS/WSS in production

---

## 6. Implementation Plan

### Week 9: WebSocket Server & Basic Sync
- [ ] Setup WebSocket server (separate repo/service)
- [ ] Authentication
- [ ] Room management
- [ ] Basic Yjs sync
- [ ] Deploy to staging

### Week 10: Yjs Integration & Editor Sync
- [ ] Integrate Yjs with block editor
- [ ] Block tree synchronization
- [ ] Text editing sync
- [ ] Offline persistence
- [ ] Testing basic collaboration

### Week 11: Presence & Cursors
- [ ] Awareness protocol
- [ ] Cursor rendering
- [ ] Avatar stack
- [ ] Selection highlights
- [ ] User list

### Week 12: Polish & Edge Cases
- [ ] Typing indicators
- [ ] Conflict resolution UI
- [ ] Offline queue
- [ ] Reconnection handling
- [ ] Performance testing
- [ ] Production deployment

---

## 7. Testing Strategy

### Unit Tests
- Yjs document operations
- Presence state management
- Offline queue logic

### Integration Tests
- Two clients editing same document
- Offline edit sync
- Reconnection scenarios
- Permission checks

### Load Tests
- 10 concurrent users per page
- 100 messages/second
- Latency measurement

---

## 8. Success Metrics

- [ ] Sync latency: <200ms p95
- [ ] Concurrent users: Support 10+ per page
- [ ] Offline sync: 100% of queued edits replayed
- [ ] Conflict resolution: 0 data loss
- [ ] Connection uptime: >99.9%
- [ ] Reconnection success: >99%

---

## 9. Deployment

### Server Deployment
- Deploy to Railway/Render/Fly.io
- Environment variables for auth, DB
- Redis for scaling (if multi-instance)
- Monitoring with logs/metrics

### Client Changes
- Add collaboration dependencies
- Feature flag for collaboration
- Graceful fallback to polling if WS fails

---

**Dependencies:** PRD-02 (Database must be stable)  
**Blocks:** None  
**References:** Yjs docs, y-websocket, Notion collaboration behavior
