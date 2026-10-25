# Notion vs Noted — Comprehensive Feature Gap Analysis & Development Task Plan

**Date:** 2026-10-21  
**Sources:** REA Analysis of Notion.app (Electron 30+, arm64) + Noted Source Code Audit

---

## Executive Summary

| Dimension | Notion (Production) | Noted (Current) | Gap Severity |
|-----------|---------------------|-----------------|--------------|
| **Architecture** | Multi-process Electron (14 windows, 2 utilities) | Single-window Electron + Web | 🔴 Critical |
| **Security** | Hardened fuses, context bridges, no native addons | Context isolation ✅, but no fuse hardening | 🟡 Medium |
| **Editor** | Block-based, 20+ block types, AI integrated | 20+ block types, AI ✅, but no multi-column layout | 🟡 Medium |
| **Sync** | Proprietary realtime (likely CRDT/OT) | Dual: Local (BroadcastChannel) + Cloud (Neon PostgreSQL) | 🟢 Good parity |
| **Collaboration** | Comments, mentions, discussions, presence | Comments, replies, mentions ✅, no presence | 🟡 Medium |
| **Database/Views** | Full database with views, filters, sorts, rollups | Basic table block only | 🔴 Critical |
| **Mobile** | Native iOS/Android | Capacitor wrapper (Android only) | 🟡 Medium |
| **AI** | Notion AI (proprietary) | Multi-provider (Ollama, LM Studio, OpenAI-compatible) | 🟢 Noted wins |
| **Extensibility** | API, webhooks, integrations | None yet | 🔴 Critical |

---

## 1. Architecture & Electron Hardening Comparison

### Notion (from REA)
```
┌─────────────────────────────────────────────────────────────┐
│  Notion.app (Electron 30.x, arm64, ~200MB Framework)       │
├─────────────────────────────────────────────────────────────┤
│  Fuses (Wire v1):                                           │
│  ✅ RunAsNode: DISABLED        ✅ Cookie Encryption: ON     │
│  ✅ NodeOptions: DISABLED       ✅ ASAR Integrity: ENFORCED │
│  ✅ CLI Inspect: DISABLED       ✅ OnlyLoadAppFromAsar: ON  │
│  ⚠️ FileProtocolExtra: ENABLED   ✅ WasmTrapHandlers: ON    │
├─────────────────────────────────────────────────────────────┤
│  14 BrowserWindow configs | 2 Utility processes             │
│  20 Context Bridges | 281 exposed API members               │
│  26 IPC Operations | 7 literal + 13 dynamic channels       │
│  5 Sender Validations | 0 Native Addons                     │
└─────────────────────────────────────────────────────────────┘
```

### Noted (Current)
```javascript
// electron/main.cjs - Single window, basic hardening
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,  // ✅ Good
  sandbox: false,          // ⚠️ Notion uses sandbox: true
  spellcheck: true
}
// ❌ NO fuse hardening (electron-builder doesn't configure fuses by default)
// ❌ Single main window only (no utility processes)
// ❌ No contextBridge exposure audit
```

### 🎯 Task Plan: Electron Hardening (Priority: P0 - Security)

| Task | Effort | Description |
|------|--------|-------------|
| **T-ARCH-001** | 2d | Configure Electron Fuses via `@electron/fuses` in `electron-builder` config |
| **T-ARCH-002** | 1d | Enable `sandbox: true` in webPreferences (test for breakage) |
| **T-ARCH-003** | 3d | Implement utility process for heavy operations (search indexing, AI embedding, sync) |
| **T-ARCH-004** | 2d | Audit and document all IPC channels; implement sender validation like Notion's 5 observations |
| **T-ARCH-005** | 1d | Add `OnlyLoadAppFromAsar` fuse equivalent via `electron-builder` `asarIntegrity` |
| **T-ARCH-006** | 2d | Implement multi-window support (popups for settings, share, notifications) |

---

## 2. Editor & Block System Comparison

### Notion Block Types (from REA webpack modules + public knowledge)
| Category | Blocks | Noted Status |
|----------|--------|--------------|
| **Text** | paragraph, heading_1/2/3, quote, callout, code, toggle | ✅ All implemented |
| **Lists** | bulleted_list_item, numbered_list_item, to_do | ✅ All implemented |
| **Media** | image, video, audio, pdf, file, bookmark | ✅ image, video, bookmark ✅; ❌ audio, pdf, file |
| **Embeds** | figma, framer, github, loom, miro, typeform, whimsical, etc. | ❌ Only basic web bookmark |
| **Database** | table, board, list, calendar, gallery, timeline | ❌ **Only basic table block** |
| **Advanced** | synced_block, template_button, breadcrumb, equation, TOC | ✅ equation, TOC, breadcrumb ✅; ❌ synced_block, template_button |
| **Layout** | column_list, column | ❌ **ColumnListBlock exists but not fully functional** |

### Noted Current Block Types (from BlockItem.jsx imports)
```javascript
// Implemented blocks:
DatabaseBlock, ColumnListBlock, TableOfContentsBlock, 
WebBookmarkBlock, VideoEmbedBlock, MathEquationBlock, BreadcrumbBlock,
// Basic: paragraph, heading_1/2/3, to_do, bulleted_list_item, 
// numbered_list_item, toggle, quote, callout, code, image, video, bookmark
```

### 🎯 Task Plan: Editor Parity (Priority: P1 - Core Product)

| Task | Effort | Description |
|------|--------|-------------|
| **T-EDIT-001** | 5d | **Database Block v2** - Full Notion-style database with views (table, board, list, calendar, gallery, timeline), filters, sorts, groupings, rollups, formulas |
| **T-EDIT-002** | 3d | **Column Layout** - Fix ColumnListBlock drag-resize, multi-column editing, responsive collapse |
| **T-EDIT-003** | 2d | **Synced Blocks** - Cross-page block synchronization with edit propagation |
| **T-EDIT-004** | 2d | **Template Buttons** - One-click page/block templating |
| **T-EDIT-005** | 1d | **Audio/PDF/File Blocks** - Native preview, download, inline playback |
| **T-EDIT-006** | 3d | **Embed Ecosystem** - Figma, GitHub, Loom, Miro, Typeform, Whimsical, Google Drive, etc. |
| **T-EDIT-007** | 2d | **Block Operations Parity** - Turn into page, duplicate, copy link, move to, delete, color background |
| **T-EDIT-008** | 1d | **Slash Menu Completeness** - Add missing block types, search, recent items |

---

## 3. Real-time Collaboration & Sync Comparison

### Notion (inferred from REA)
- **Realtime:** Proprietary WebSocket-based sync (likely CRDT or OT)
- **Presence:** User cursors, avatars, selection highlights
- **Conflict Resolution:** Server-authoritative with client prediction
- **Offline:** Local-first with background sync queue

### Noted (Current)
```javascript
// Dual sync architecture (App.jsx)
1. Local: BroadcastChannel API (multi-tab) ✅
2. Cloud: Neon PostgreSQL (Lakebase) via HTTP SQL API ✅
3. Live Sync Pulse: 10s polling + focus triggers ✅
4. Email Anchor Fallback: Account resolution across devices ✅
5. Optimistic UI: Local-first, background push ✅
```

**Missing vs Notion:**
- ❌ Real-time presence (cursors, avatars, typing indicators)
- ❌ Operational Transform / CRDT for concurrent editing
- ❌ WebSocket-based live sync (currently polling)
- ❌ Conflict resolution UI (Notion shows "edited by X")
- ❌ Shared editing sessions (multiplayer cursors)

### 🎯 Task Plan: Collaboration & Sync (Priority: P1 - Differentiator)

| Task | Effort | Description |
|------|--------|-------------|
| **T-SYNC-001** | 10d | **WebSocket Server** - Deploy Neon Functions or separate Node.js WS server for realtime presence & editing |
| **T-SYNC-002** | 8d | **CRDT Integration** - Yjs or Automerge for conflict-free concurrent block editing |
| **T-SYNC-003** | 3d | **Presence System** - User cursors, selections, avatar stack, "X is editing" indicators |
| **T-SYNC-004** | 2d | **Conflict Resolution UI** - Notion-style "changes merged" / "conflict detected" banners |
| **T-SYNC-005** | 2d | **Offline Queue** - IndexedDB mutation queue with background replay |
| **T-SYNC-006** | 1d | **Typing Indicators** - "Dani is typing..." in blocks/comments |

---

## 4. Database & Views (Critical Gap)

### Notion Database Features
| Feature | Notion | Noted |
|---------|--------|-------|
| **Property Types** | 20+ (text, number, select, multi-select, date, person, file, relation, rollup, formula, checkbox, URL, email, phone, created_time, last_edited_time, created_by, last_edited_by) | ❌ Only basic table with text cells |
| **Views** | Table, Board (Kanban), List, Calendar, Gallery, Timeline, Gantt | ❌ None |
| **Filters** | Multi-condition, filter groups, nested AND/OR | ❌ None |
| **Sorts** | Multi-column, direction | ❌ None |
| **Groupings** | By any property, collapsible groups | ❌ None |
| **Rollups** | Aggregate related DB properties | ❌ None |
| **Formulas** | JS-like expression language | ❌ None |
| **Relations** | Bidirectional page links | ❌ None |

### Noted Current: `DatabaseBlock.jsx` = Basic HTML Table Only
```javascript
// Current implementation - just a grid editor
tableData: [
  ['Item', 'Status', 'Notes'],
  ['', '', ''],
  ['', '', '']
]
```

### 🎯 Task Plan: Database System (Priority: P0 - Killer Feature)

| Task | Effort | Description |
|------|--------|-------------|
| **T-DB-001** | 15d | **Property System** - 20+ property types with validation, serialization, UI editors |
| **T-DB-002** | 10d | **View Engine** - Table, Board, List, Calendar, Gallery, Timeline renderers |
| **T-DB-003** | 8d | **Filter/Sort/Group UI** - Notion-style sidebar panels with visual query builder |
| **T-DB-004** | 10d | **Relations & Rollups** - Bidirectional page linking, aggregate computations |
| **T-DB-005** | 8d | **Formula Engine** - Safe expression evaluator (Notion formula syntax) |
| **T-DB-006** | 5d | **Database Block Integration** - Replace current `DatabaseBlock.jsx` with full system |
| **T-DB-007** | 3d | **CSV/JSON Import/Export** - Notion-compatible import, property mapping |
| **T-DB-008** | 2d | **Linked Databases** - View same DB in multiple pages with different views |

---

## 5. AI Assistant Comparison

### Notion AI (Proprietary)
- Integrated in slash menu, inline, page-level
- Summarize, translate, improve writing, brainstorm, action items
- Context-aware (page content, workspace)
- Single provider (OpenAI/Anthropic proprietary)

### Noted AI (Current - Multi-Provider!)
```javascript
// api/ollama/[...path].js + api/lmstudio/[...path].js
// ai:fetch / ai:fetch-stream IPC channels (electron/main.cjs)
// AIAssistantBar.jsx + InlineAIToolbar.jsx
// Supports: Ollama (local), LM Studio (local), OpenAI-compatible APIs
```
**Noted Advantages:**
- ✅ Local-first (privacy)
- ✅ Multi-provider (Ollama, LM Studio, OpenAI, custom)
- ✅ Streaming responses
- ✅ Inline toolbar + sidebar assistant
- ✅ No API key required for local models

### 🎯 Task Plan: AI Enhancement (Priority: P2 - Differentiator)

| Task | Effort | Description |
|------|--------|-------------|
| **T-AI-001** | 3d | **RAG Integration** - Workspace-aware Q&A using page embeddings (pgvector in Neon) |
| **T-AI-002** | 2d | **AI Block Actions** - "Summarize this page", "Extract action items", "Translate" as block operations |
| **T-AI-003** | 2d | **Custom Prompts** - User-defined prompt templates in settings |
| **T-AI-004** | 1d | **Model Management UI** - Download/pull Ollama models from settings |
| **T-AI-005** | 2d | **AI Autocomplete** - Ghost text suggestions while typing (Cursor-style) |

---

## 6. UI/UX Polish - Notion Desktop Parity

### Notion Desktop Details (from REA + observation)
| Feature | Notion | Noted | Gap |
|---------|--------|-------|-----|
| **Titlebar** | HiddenInset (macOS), titleBarOverlay (Win) | ✅ Implemented | ✅ |
| **Traffic Lights** | Custom position (18,15) | ✅ Implemented | ✅ |
| **Tab Bar** | Native-feeling, drag-reorder, favicon | ✅ TabBar.jsx | ✅ |
| **Breadcrumb** | Sub-bar under tabs | ✅ BreadcrumbBlock | ✅ |
| **Sidebar** | Collapsible, favorites, shared, private | ✅ Sidebar.jsx | ✅ |
| **Search** | Cmd+K palette with commands | ✅ CommandPaletteModal | ✅ |
| **Settings** | Modal with tabs | ✅ SettingsModal | ✅ |
| **Fullscreen** | Native macOS/Win | ✅ is-fullscreen class | ✅ |
| **Deep Links** | `noted://` protocol | ✅ Implemented | ✅ |
| **Window State** | Persist size/position/maximize | ✅ Implemented | ✅ |
| **Native Menus** | macOS menu bar + context menus | ✅ menu.cjs (partial) | 🟡 |
| **Dock/Taskbar** | Badge count, progress | ❌ Not implemented | 🟡 |
| **Spell Check** | Native + custom dictionary | ✅ spellcheck: true | ✅ |
| **Auto-Updates** | Sparkle (mac), NSIS (Win) | ✅ electron-builder | ✅ |

### 🎯 Task Plan: Desktop Polish (Priority: P2 - Polish)

| Task | Effort | Description |
|------|--------|-------------|
| **T-UI-001** | 2d | **Native Context Menus** - Right-click on blocks, sidebar, tabs (electron menu.cjs) |
| **T-UI-002** | 1d | **Dock Badge** - Unread comments, sync status on macOS dock / Win taskbar |
| **T-UI-003** | 1d | **Window Vibrancy** - macOS `window.setVibrancy('sidebar')` for sidebar |
| **T-UI-004** | 1d | **Touch Bar Support** (macOS) - Formatting shortcuts |
| **T-UI-005** | 2d | **Drag & Drop Files** - Native file drop → upload/embed |
| **T-UI-006** | 1d | **Protocol Handler Registration** - Ensure `noted://` works on fresh install |

---

## 7. Mobile & PWA (Capacitor)

### Notion Mobile
- Native iOS/Android apps
- Offline-first with background sync
- Native share extension
- Biometric unlock

### Noted Mobile
```json
// package.json
"@capacitor/android": "8.5.3",
"@capacitor/core": "8.5.3"
// android/ folder exists
```
**Status:** Android only, basic wrapper

### 🎯 Task Plan: Mobile (Priority: P3 - Later)

| Task | Effort | Description |
|------|--------|-------------|
| **T-MOB-001** | 5d | **iOS Capacitor Project** - `cap add ios`, configure Xcode, TestFlight |
| **T-MOB-002** | 3d | **Share Extension** - iOS/Android "Share to Noted" |
| **T-MOB-003** | 3d | **Biometric Lock** - FaceID/TouchID, Android BiometricPrompt |
| **T-MOB-004** | 2d | **Offline-First PWA** - Service worker, background sync, install prompt |
| **T-MOB-005** | 2d | **Mobile Editor Polish** - Touch-optimized toolbar, swipe gestures |

---

## 8. Extensibility & API (Notion Parity)

### Notion Public API
- REST API (pages, databases, blocks, users, comments)
- Webhooks (page/database changes)
- OAuth 2.0 for integrations
- Internal API for desktop app

### Noted: None Yet

### 🎯 Task Plan: Platform & API (Priority: P3 - Platform)

| Task | Effort | Description |
|------|--------|-------------|
| **T-API-001** | 5d | **REST API** - `/api/pages`, `/api/databases`, `/api/blocks`, `/api/search` |
| **T-API-002** | 3d | **Webhooks** - `page.created`, `page.updated`, `database.row_added` |
| **T-API-003** | 3d | **OAuth 2.0 Server** - Authorization code flow, scopes, token refresh |
| **T-API-004** | 2d | **API Keys** - Personal integration tokens for scripts |
| **T-API-005** | 5d | **Plugin System** - WASM/JS sandbox for user scripts (like Notion formulas but programmable) |

---

## 9. Security Hardening Checklist (From REA Notion Analysis)

| Hardening | Notion | Noted | Action |
|-----------|--------|-------|--------|
| Electron Fuses | ✅ All critical | ❌ None | **T-ARCH-001** |
| Sandbox | ✅ | ⚠️ Disabled | **T-ARCH-002** |
| Context Isolation | ✅ | ✅ | OK |
| Node Integration | ✅ Disabled | ✅ Disabled | OK |
| Preload Only | ✅ | ✅ | OK |
| CSP Headers | ✅ Strict | ❌ None | Add CSP meta tag |
| ASAR Integrity | ✅ Enforced | ❌ | **T-ARCH-005** |
| IPC Sender Validation | ✅ 5 patterns | ❌ | **T-ARCH-004** |
| External Link Delegation | ✅ | ✅ | OK |
| Protocol Handler | ✅ | ✅ | OK |
| Native Addons | ✅ 0 | ✅ 0 | OK |

---

## 10. Prioritized Development Roadmap

### Phase 1: Security & Foundation (Weeks 1-3) 🔴
```
Sprint 1 (Week 1):
├── T-ARCH-001: Electron Fuses (2d)
├── T-ARCH-002: Sandbox enable (1d)
├── T-ARCH-005: ASAR integrity (1d)
└── T-ARCH-004: IPC audit & sender validation (2d)

Sprint 2 (Week 2):
├── T-ARCH-003: Utility process (3d)
├── T-ARCH-006: Multi-window support (2d)
├── T-EDIT-007: Block operations parity (2d)
└── T-UI-001: Native context menus (2d)

Sprint 3 (Week 3):
├── T-DB-001: Property system foundation (15d - start)
└── T-EDIT-008: Slash menu completeness (1d)
```

### Phase 2: Database & Core Editor (Weeks 4-8) 🔴
```
Sprint 4-5 (Weeks 4-5):
├── T-DB-001: Property system (complete)
├── T-DB-002: View engine - Table, Board, List
└── T-DB-006: Database block integration

Sprint 6-7 (Weeks 6-7):
├── T-DB-003: Filter/Sort/Group UI
├── T-DB-004: Relations & Rollups
└── T-EDIT-002: Column layout fix

Sprint 8 (Week 8):
├── T-DB-005: Formula engine
├── T-DB-007: CSV/JSON import/export
└── T-DB-008: Linked databases
```

### Phase 3: Real-time Collaboration (Weeks 9-12) 🟡
```
Sprint 9-10 (Weeks 9-10):
├── T-SYNC-001: WebSocket server (Neon Functions)
├── T-SYNC-002: CRDT integration (Yjs)
└── T-SYNC-005: Offline queue

Sprint 11-12 (Weeks 11-12):
├── T-SYNC-003: Presence system
├── T-SYNC-004: Conflict resolution UI
└── T-SYNC-006: Typing indicators
```

### Phase 4: AI & Differentiation (Weeks 13-15) 🟢
```
Sprint 13 (Week 13):
├── T-AI-001: RAG with pgvector
├── T-AI-002: AI block actions

Sprint 14 (Week 14):
├── T-AI-003: Custom prompts UI
├── T-AI-004: Model management
└── T-AI-005: AI autocomplete

Sprint 15 (Week 15):
├── T-EDIT-003: Synced blocks
├── T-EDIT-004: Template buttons
└── T-EDIT-006: Embed ecosystem
```

### Phase 5: Platform & Mobile (Weeks 16-20) 🔵
```
Sprint 16-17: T-API-001 to T-API-005 (REST API, Webhooks, OAuth, Plugins)
Sprint 18-19: T-MOB-001 to T-MOB-005 (iOS, Share Ext, Biometric, PWA)
Sprint 20: Polish, beta testing, launch prep
```

---

## 11. Estimated Effort Summary

| Phase | Tasks | Total Days | Weeks (1 dev) | Weeks (2 devs) |
|-------|-------|------------|---------------|----------------|
| **1. Security & Foundation** | 6 | 11d | 3 | 2 |
| **2. Database & Core Editor** | 8 | 61d | 13 | 7 |
| **3. Real-time Collaboration** | 6 | 26d | 6 | 3 |
| **4. AI & Differentiation** | 7 | 15d | 3 | 2 |
| **5. Platform & Mobile** | 10 | 20d | 4 | 2 |
| **TOTAL** | **37** | **~133d** | **~29 weeks** | **~16 weeks** |

---

## 12. Quick Wins (Do This Week)

| Task | Effort | Impact |
|------|--------|--------|
| Enable Electron fuses | 2d | 🔒 Security parity |
| Add CSP headers | 0.5d | 🔒 Security |
| Fix ColumnListBlock | 2d | ✨ Editor parity |
| Add audio/pdf/file blocks | 1d | ✨ Editor parity |
| Native context menus | 2d | 🖥️ Desktop feel |
| Dock badge / taskbar | 1d | 🖥️ Desktop feel |

---

## 13. Noted's Competitive Advantages (Leverage These!)

| Advantage | Description | Marketing Angle |
|-----------|-------------|-----------------|
| **Local-First AI** | Ollama/LM Studio = private, free, offline | "Your data never leaves your machine" |
| **Multi-Provider AI** | Not locked to one vendor | "Bring your own model" |
| **Open Sync Protocol** | Neon PostgreSQL = standard SQL, portable | "Own your data, sync anywhere" |
| **Local-First Architecture** | Works fully offline, no account required | "Zero-knowledge by default" |
| **Extensible** | Plugin system planned | "Program your workspace" |
| **Cost** | Free tier generous, self-hostable | "Notion features, Notion price" |

---

## 14. Appendix: REA Evidence References

| Analysis | Evidence ID | Location |
|----------|-------------|----------|
| Electron Fuses | `ev_48df8d3767a7394d292014e904dc0788e881b22d8544fec4f651be31cd4fe85d` | `rea_analysis/electron_fuses_analysis.json` |
| JS Application Graph | `ev_142243f678441f5e17d8de16aba0095415b35ad2ae5f102b60661c919c6e2aae` | `rea_analysis/notion_app_full_analysis.json` |
| Summary View | `ev_20de501020bb9af1d118232793da2cc83b6b456f5efd04e16671c7686a4369c7` | In bundle |

---

## 15. Next Steps

1. **Immediate:** Run `T-ARCH-001` (Electron fuses) - highest ROI security fix
2. **This Sprint:** Start `T-DB-001` (Property system) - longest lead time
3. **Parallel:** `T-SYNC-001` (WebSocket server) can start independently
4. **Track:** Create GitHub issues for each task with this naming convention
5. **Review:** Bi-weekly architecture review against this plan

---

*Generated from REA reverse engineering of Notion.app v7.39.0+ and source audit of Noted v1.0.0*