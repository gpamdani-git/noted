# Noted vs Notion - Comprehensive Development PRD Plan

**Document Version:** 1.0  
**Date:** 2026-10-22  
**Author:** Development Team  
**Status:** In Review  
**Target:** Close feature gaps with Notion while leveraging Noted's competitive advantages

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Competitive Advantages](#competitive-advantages)
4. [Feature Gap Analysis](#feature-gap-analysis)
5. [Detailed Feature Requirements](#detailed-feature-requirements)
6. [UI/UX Design Specifications](#uiux-design-specifications)
7. [Database Schema & Architecture](#database-schema--architecture)
8. [App Flow & User Journeys](#app-flow--user-journeys)
9. [Technical Architecture](#technical-architecture)
10. [Development Roadmap](#development-roadmap)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & Release Plan](#deployment--release-plan)
13. [Success Metrics](#success-metrics)
14. [Appendix](#appendix)

---

## Executive Summary

This PRD outlines the development plan to bring Noted to feature parity with Notion while capitalizing on our unique strengths. Based on REA reverse engineering analysis of Notion.app, we've identified critical gaps in database functionality, collaboration features, and security hardening, alongside opportunities to differentiate through local-first AI and multi-provider support.

### Key Objectives
- **Close critical gaps**: Full database system with views, filters, sorts, relations, and formulas
- **Enhance collaboration**: Real-time presence, CRDT-based editing, conflict resolution
- **Harden security**: Electron fuses, sandboxing, IPC validation matching Notion's security model
- **Maintain differentiation**: Leverage local-first AI, multi-provider support, and data ownership
- **Improve desktop parity**: Polish UI/UX to match Notion's native feel

### Timeline
- **Phase 1 (Weeks 1-3)**: Security & Foundation
- **Phase 2 (Weeks 4-8)**: Database & Core Editor  
- **Phase 3 (Weeks 9-12)**: Real-time Collaboration
- **Phase 4 (Weeks 13-15)**: AI & Differentiation
- **Phase 5 (Weeks 16-20)**: Platform & Mobile

**Total Estimated Effort:** ~133 developer days (~16-29 weeks depending on team size)

---

## Current State Assessment

### What We Have (Strengths)

| Area | Status | Notes |
|------|--------|-------|
| **Core Editor** | ✅ Strong | 20+ block types, slash menu, bubble menu, markdown support |
| **Database Block (Basic)** | 🟡 Partial | Table, board, gallery views exist but missing property system, filters, sorts, relations, formulas |
| **AI Integration** | ✅ Strong (Differentiator) | Multi-provider (Ollama, LM Studio, OpenAI-compatible), local-first, inline + sidebar |
| **Sync Architecture** | ✅ Strong | Dual sync (BroadcastChannel + Neon PostgreSQL), optimistic UI, offline capable |
| **Comments** | ✅ Good | Threaded comments, replies, mentions |
| **Authentication** | ✅ Good | Email auth, sessions, cloud sync |
| **Desktop App** | ✅ Good | Electron app with tabs, sidebar, command palette |

### Critical Gaps

| Area | Priority | Gap Description |
|------|----------|-----------------|
| **Full Database System** | P0 | Missing property types (relations, rollups, formulas), advanced filters/sorts/groups, calendar/timeline views |
| **Electron Security** | P0 | No fuses, sandbox disabled, missing IPC sender validation, no ASAR integrity |
| **Real-time Collaboration** | P1 | No presence, cursors, typing indicators, CRDT/OT, WebSocket sync |
| **Advanced Editor Features** | P1 | Missing synced blocks, template buttons, full column layout, audio/PDF/file blocks, embeds ecosystem |
| **Extensibility** | P3 | No public API, webhooks, OAuth, plugin system |

---

## Competitive Advantages

We need to double down on these differentiators while closing gaps:

| Advantage | Current | Plan |
|-----------|---------|------|
| **Local-First AI** | ✅ Implemented | Enhance with RAG, workspace-aware Q&A, AI autocomplete |
| **Multi-Provider AI** | ✅ Implemented | Add model management UI, custom prompt templates, provider comparisons |
| **Data Ownership** | ✅ Implemented | Emphasize SQL portability, self-hosting options, export formats |
| **Offline-First** | ✅ Implemented | Strengthen offline queue, conflict resolution, background sync |
| **Privacy-Focused** | ✅ Implemented | Maintain local models, avoid sending to Notion's servers |

---

## Feature Gap Analysis

### Architecture & Security (P0)

| Feature | Notion | Noted | Action Required |
|---------|--------|-------|-----------------|
| **Electron Fuses** | ✅ Hardened (RunAsNode disabled, ASAR integrity, OnlyLoadAppFromAsar) | ❌ None | Implement via @electron/fuses in electron-builder |
| **Sandbox Mode** | ✅ Enabled | ❌ Disabled | Enable with testing for compatibility |
| **IPC Sender Validation** | ✅ 5 patterns observed | ❌ Missing | Audit all IPC channels, add validation |
| **ASAR Integrity** | ✅ Enforced | ❌ Missing | Enable electron-builder asarIntegrity |
| **Utility Processes** | ✅ 2 processes | ❌ None | Implement for heavy operations (search, AI, sync) |
| **Multi-window Support** | ✅ 14 windows | ❌ Single window | Add popups for settings, share, notifications |

### Editor & Blocks (P1)

| Block Type | Notion | Noted | Priority |
|------------|--------|-------|----------|
| **Synced Blocks** | ✅ | ❌ | P1 |
| **Template Buttons** | ✅ | ❌ | P1 |
| **Audio Blocks** | ✅ | ❌ | P1 |
| **PDF/File Blocks** | ✅ | ❌ | P1 |
| **Column Layout** | ✅ | 🟡 Partial (broken resize) | P1 |
| **Embed Ecosystem** (Figma, Loom, GitHub, Miro) | ✅ | ❌ (only basic bookmark) | P1 |
| **Turn into Page** | ✅ | 🟡 Partial | P1 |
| **Block Colors/Backgrounds** | ✅ | 🟡 Limited | P2 |

### Database System (P0)

| Feature | Notion | Noted | Priority |
|---------|--------|-------|----------|
| **Property Types (20+)** | ✅ | 🟡 11 types basic | P0 |
| **Relations** | ✅ Bidirectional | ❌ | P0 |
| **Rollups** | ✅ | ❌ | P0 |
| **Formulas** | ✅ Expression language | ❌ | P0 |
| **Views** (Table, Board, List, Calendar, Gallery, Timeline) | ✅ All 6+ | 🟡 Table, Board, Gallery | P0 |
| **Filters** (multi-condition, groups) | ✅ | 🟡 Basic | P0 |
| **Sorts** (multi-column) | ✅ | 🟡 Basic | P0 |
| **Groupings** | ✅ | 🟡 Basic | P0 |
| **Linked Databases** | ✅ | ❌ | P0 |
| **CSV/JSON Import/Export** | ✅ | ❌ | P0 |

### Collaboration (P1)

| Feature | Notion | Noted | Priority |
|---------|--------|-------|----------|
| **Real-time Presence** | ✅ Cursors/avatars | ❌ | P1 |
| **Multiplayer Editing** | ✅ CRDT/OT | ❌ (last-write-wins) | P1 |
| **Typing Indicators** | ✅ | ❌ | P1 |
| **Conflict Resolution UI** | ✅ | ❌ | P1 |
| **WebSocket Sync** | ✅ | ❌ (10s polling) | P1 |
| **Offline Queue** | ✅ | 🟡 Basic | P1 |

---

## Detailed Feature Requirements

### P0: Database System Overhaul

#### T-DB-001: Property System (15 days)
**Goal:** Implement full property type system matching Notion

**Requirements:**
- [ ] Support all core property types: Text, Number, Select, Multi-select, Status, Date, Checkbox, URL, Email, Phone, People, Files
- [ ] Property configuration UI (edit name, type, options, colors)
- [ ] Type-specific cell renderers and editors
- [ ] Data serialization/deserialization
- [ ] Validation per property type
- [ ] Property ordering and visibility

**Acceptance Criteria:**
- Can create database with all property types
- Properties persist correctly in cloud sync
- Type conversion works with warnings

#### T-DB-002: Relations & Rollups (10 days)
**Goal:** Bidirectional page linking and aggregate computations

**Requirements:**
- [ ] Relation property: link to pages in same/other database
- [ ] Bidirectional sync of relations
- [ ] Rollup property: aggregate from related pages (count, sum, average, min, max, etc.)
- [ ] UI for configuring relations and rollups
- [ ] Performance optimization for large relation sets

#### T-DB-003: Formula Engine (8 days)
**Goal:** Safe expression evaluator with Notion formula syntax

**Requirements:**
- [ ] Parser for formula expressions
- [ ] Built-in functions (if, concat, dateAdd, round, etc.)
- [ ] Property references
- [ ] Type coercion
- [ ] Sandboxed execution (no eval)
- [ ] Formula autocomplete

#### T-DB-004: Advanced Views (10 days)
**Goal:** Calendar, Gallery, Timeline views

**Requirements:**
- [ ] Calendar view: date property mapping, month/week view
- [ ] Gallery view: cover property, card layout
- [ ] Timeline view: date range support
- [ ] View switching with state persistence
- [ ] View-specific configurations

#### T-DB-005: Filters, Sorts, Groups (8 days)
**Goal:** Notion-style query builder

**Requirements:**
- [ ] Multi-condition filters with AND/OR
- [ ] Filter groups (nested logic)
- [ ] Multi-column sorting
- [ ] Grouping by property with collapsible sections
- [ ] Save view configurations

### P0: Electron Security Hardening

#### T-SEC-001: Electron Fuses (2 days)
**Goal:** Implement fuses matching Notion's security model

**Implementation:**
```javascript
// electron-builder.config.js
const { FlipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

afterPack: async (context) => {
  await FlipFuses(
    path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`),
    {
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
      [FuseV1Options.EnableWebAssemblyTrapHandlers]: true,
    }
  );
}
```

#### T-SEC-002: Sandbox Mode (1 day)
**Goal:** Enable sandbox with compatibility testing

**Changes:**
```javascript
// electron/main.cjs
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true, // Changed from false
  spellcheck: true
}
```

#### T-SEC-003: IPC Sender Validation (2 days)
**Goal:** Validate all IPC calls like Notion

**Pattern:**
```javascript
ipcMain.handle('some-channel', async (event, ...args) => {
  // Validate sender
  if (!validateSender(event)) {
    throw new Error('Unauthorized IPC call');
  }
  // ... handle
});
```

### P1: Real-time Collaboration

#### T-COLLAB-001: WebSocket Server (10 days)
**Goal:** Replace polling with real-time sync

**Options:**
1. Deploy WebSocket server to Neon Functions (serverless)
2. Separate Node.js server (Railway/Render)
3. Use Pusher/Ably (third-party) - not preferred

**Recommendation:** Neon Functions with WebSocket support or separate server

#### T-COLLAB-002: CRDT Integration (8 days)
**Goal:** Conflict-free concurrent editing with Yjs

**Implementation:**
- Integrate Yjs for document state
- Y-Websocket provider
- Sync with existing storage layer
- Awareness for presence

#### T-COLLAB-003: Presence System (3 days)
**Goal:** Cursors, avatars, typing indicators

**Features:**
- User presence in page
- Cursor positions
- Selection highlights
- Typing indicators in blocks
- Avatar stack

---

## UI/UX Design Specifications

### Design Principles (Match Notion)
1. **Minimalism**: Clean, distraction-free interface
2. **Typography**: System fonts, clear hierarchy
3. **Spacing**: Consistent 4px grid system
4. **Color**: Subtle grays with accent colors
5. **Motion**: Smooth, purposeful animations
6. **Accessibility**: Keyboard navigation, screen reader support

### Component Library Updates

| Component | Changes Needed |
|-----------|----------------|
| **DatabaseBlock** | Complete rewrite with property system, views |
| **BlockItem** | Support synced blocks, improved drag/drop |
| **SlashMenu** | Add all missing block types, search improvements |
| **Sidebar** | Enhanced navigation, favorites, templates |
| **CommandPalette** | Add database commands, AI actions |
| **TopNav** | Polish sharing, comments, presence |

### Theme System
Maintain existing CSS variables, ensure dark mode compatibility.

---

## Database Schema & Architecture

### Current Schema (Neon PostgreSQL)

Based on existing codebase patterns, we need to extend schema for:

```sql
-- Databases
CREATE TABLE databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Database Properties
CREATE TABLE database_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- text, number, select, multi_select, date, checkbox, url, email, phone, people, relation, rollup, formula
  config JSONB, -- type-specific configuration
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Database Rows
CREATE TABLE database_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id), -- optional link to page
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Database Cells
CREATE TABLE database_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID REFERENCES database_rows(id) ON DELETE CASCADE,
  property_id UUID REFERENCES database_properties(id) ON DELETE CASCADE,
  value JSONB, -- flexible storage for different types
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(row_id, property_id)
);

-- Relations
CREATE TABLE database_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_property_id UUID REFERENCES database_properties(id),
  target_database_id UUID REFERENCES databases(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Views
CREATE TABLE database_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- table, board, list, calendar, gallery, timeline
  config JSONB, -- filters, sorts, groups, layout
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Sync Strategy
- Extend existing cloud sync to handle database entities
- Use optimistic updates with conflict resolution
- Maintain local-first with IndexedDB caching
- Background sync every 10s + on focus (current pattern)

---

## App Flow & User Journeys

### New User Journey
1. **Onboarding** - Quick tour of features
2. **First Page** - Create first page with blocks
3. **Database Creation** - Guide to create first database
4. **AI Setup** - Prompt to configure local AI (Ollama) or cloud
5. **Sync Setup** - Optional account creation for cloud sync

### Power User Journey - Database
1. Create database block → Choose template or blank
2. Add properties → Configure types and options
3. Add rows → Fill data
4. Create views → Table, Board, Calendar etc.
5. Add filters/sorts → Organize data
6. Link databases → Create relations
7. Add formulas/rollups → Compute values

### Collaboration Journey
1. Share page → Generate share link
2. Invite collaborators → Add emails
3. Real-time editing → See cursors and presence
4. Comments → Threaded discussions
5. Resolve conflicts → Review merge UI

---

## Technical Architecture

### Frontend
- **Framework**: React 18 + Vite
- **State Management**: React hooks + context (existing pattern)
- **Styling**: CSS modules + CSS variables
- **Editor**: Custom block-based editor (existing)
- **Database UI**: React components with virtualization for large tables

### Backend
- **Cloud Sync**: Neon PostgreSQL (existing)
- **API Routes**: Vercel Functions (`/api/`)
- **Real-time**: WebSocket server (new - Neon Functions or separate)
- **AI Proxy**: Existing Ollama/LMStudio/OpenAI proxies

### Desktop (Electron)
- **Main Process**: `electron/main.cjs`
- **Preload**: `electron/preload.cjs`
- **Builder**: electron-builder with fuses
- **Security**: contextIsolation, sandbox (to be enabled), fuses

### Mobile (Capacitor)
- **Android**: Existing setup
- **iOS**: To be added
- **PWA**: Service worker for offline

---

## Development Roadmap

### Milestone 1: Security Hardening (Week 1-3)
- [ ] **Week 1**: Electron fuses, sandbox prep, CSP
- [ ] **Week 2**: IPC audit and validation, utility process
- [ ] **Week 3**: Multi-window, testing, security review

**Deliverable**: Hardened Electron app matching Notion security baseline

### Milestone 2: Database Foundation (Week 4-6)
- [ ] **Week 4**: Property system architecture, basic types
- [ ] **Week 5**: Relations and rollups
- [ ] **Week 6**: Formula engine foundation

**Deliverable**: Core property system functional

### Milestone 3: Database Views & UI (Week 7-8)
- [ ] **Week 7**: Table view enhancements, filters/sorts/groups
- [ ] **Week 8**: Calendar, Gallery views, board improvements

**Deliverable**: Full database experience

### Milestone 4: Collaboration (Week 9-12)
- [ ] **Week 9-10**: WebSocket server, Yjs integration
- [ ] **Week 11-12**: Presence, cursors, conflict resolution

**Deliverable**: Real-time collaboration

### Milestone 5: AI & Polish (Week 13-15)
- [ ] **Week 13-14**: RAG, AI autocomplete, model management
- [ ] **Week 15**: Synced blocks, templates, embeds

**Deliverable**: Enhanced AI features

### Milestone 6: Platform (Week 16-20)
- [ ] **Week 16-18**: REST API, webhooks, OAuth
- [ ] **Week 19-20**: iOS, PWA, final polish

**Deliverable**: Platform extensibility

---

## Testing Strategy

### Unit Tests
- Property type renderers/editors
- Formula engine
- Filter/sort/group logic
- IPC validation
- Sync logic

### Integration Tests
- Database operations end-to-end
- Real-time collaboration scenarios
- AI provider integration
- Cloud sync

### E2E Tests (Playwright)
- Database creation and management
- Multi-view workflows
- Collaboration flows
- Electron app flows

### Security Tests
- IPC injection attempts
- Sandbox escape tests
- ASAR tampering detection
- XSS in content

---

## Deployment & Release Plan

### Beta Releases
- **Beta 1** (End of Phase 2): Database system
- **Beta 2** (End of Phase 3): Collaboration features
- **Beta 3** (End of Phase 4): AI enhancements

### Production Release
- **v2.0.0** (End of Phase 5): Full parity + differentiators
- Electron builds for macOS (arm64/x64), Windows, Linux
- Android APK via Capacitor
- iOS via Capacitor (TestFlight)

### Release Channels
- GitHub Releases
- Auto-updater via electron-updater
- Website download page

---

## Success Metrics

### Feature Parity
- [ ] Database feature completeness: >90% vs Notion
- [ ] Block type coverage: >90% vs Notion
- [ ] Editor operations: >95% parity

### Performance
- [ ] App launch time: <2s
- [ ] Large database load: <1s
- [ ] Real-time sync latency: <200ms
- [ ] AI response streaming: <500ms first token

### User Experience
- [ ] Crash rate: <0.1%
- [ ] User satisfaction: >4.5/5
- [ ] Adoption of new features: >40%

### Differentiators
- [ ] Local AI usage: >30% of AI interactions
- [ ] Offline usage: >20% of sessions
- [ ] Multi-provider usage: >25% use non-OpenAI

---

## Appendix

### Resources
- [Notion API Documentation](https://developers.notion.com/)
- [Electron Security Guide](https://www.electronjs.org/docs/latest/tutorial/security)
- [Yjs Documentation](https://docs.yjs.dev/)
- [REA Analysis Files](./rea_analysis/)

### Key Files to Modify
- `electron/main.cjs` - Security hardening
- `electron-builder.json` - Fuses configuration
- `src/components/Editor/DatabaseBlock.jsx` - Complete rewrite
- `src/utils/cloudSync.js` - Extended schema
- `package.json` - New dependencies

### New Dependencies Needed
```json
{
  "@electron/fuses": "^1.8.0",
  "yjs": "^13.6.0",
  "y-websocket": "^2.0.0",
  "y-indexeddb": "^9.0.0",
  "react-virtualized": "^9.22.0",
  "date-fns": "^3.0.0",
  "chrono-node": "^2.7.0"
}
```

---

**Document Owner:** Engineering Team  
**Reviewers:** Product, Design, Security  
**Last Updated:** 2026-10-22  
**Next Review:** Weekly during development
