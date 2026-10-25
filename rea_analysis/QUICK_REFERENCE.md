# Noted Development - Quick Reference Card

## 🔑 REA Evidence IDs (Bookmark These)

| Analysis | Evidence ID | Use For |
|----------|-------------|---------|
| **Electron Fuses** | `ev_48df8d3767a7394d292014e904dc0788e881b22d8544fec4f651be31cd4fe85d` | Verifying fuse hardening matches Notion |
| **JS App Graph (Full)** | `ev_142243f678441f5e17d8de16aba0095415b35ad2ae5f102b60661c919c6e2aae` | Deep-dive module/IPC/semantic analysis |
| **Summary View** | `ev_20de501020bb9af1d118232793da2cc83b6b456f5efd04e16671c7686a4369c7` | Quick stats, Electron architecture overview |

## 📁 Local Files Created

```
rea_analysis/
├── NOTION_APP_ANALYSIS_REPORT.md       # Full Notion REA analysis (human-readable)
├── NOTION_VS_NOTED_COMPARISON.md       # Gap analysis + 37-task roadmap
├── GITHUB_ISSUE_TEMPLATES.md           # Copy to .github/ISSUE_TEMPLATE/
├── electron_fuses_analysis.json        # Raw fuse data for verification
└── notion_app_full_analysis.json       # 102MB complete evidence bundle
```

## 🚀 Immediate Next Commands

### 1. Verify Current Electron Fuses (Baseline)
```bash
# Run REA on your built Noted app to see current state
npx rea inspect_electron_fuses --path /path/to/Noted.app
# Compare with Notion reference: ev_48df8d3767a7394d292014e904dc0788e881b22d8544fec4f651be31cd4fe85d
```

### 2. Enable Electron Fuses (T-ARCH-001) - DO THIS FIRST
```bash
# 1. Install fuse tooling
npm install --save-dev @electron/fuses

# 2. Add to electron-builder config (package.json or electron-builder.json)
"build": {
  "fuses": {
    "runAsNode": false,
    "enableCookieEncryption": true,
    "enableNodeOptionsEnvironmentVariable": false,
    "enableNodeCliInspectArguments": false,
    "enableEmbeddedAsarIntegrityValidation": true,
    "onlyLoadAppFromAsar": true,
    "loadBrowserProcessSpecificV8Snapshot": false,
    "grantFileProtocolExtraPrivileges": true,
    "wasmTrapHandlers": true
  }
}

# 3. Build and verify
npm run electron:build:mac
npx rea inspect_electron_fuses --path ./dist/mac/Noted.app
```

### 3. Import Full Evidence Bundle for Deep Analysis
```javascript
// In any REA session:
await tools.rea.import_evidence_bundle({
  path: "/Users/daniakbar/Documents/REA-Projects/noted/rea_analysis/notion_app_full_analysis.json"
});

// Then inspect specific modules:
await tools.rea.inspect_analysis_view({
  source: { kind: "retained-evidence", evidence_id: "ev_142243f678441f5e17d8de16aba0095415b35ad2ae5f102b60661c919c6e2aae" },
  view: { kind: "summary" }
});
```

## 📋 Task ID Quick Lookup

| ID | Title | Phase | Priority | Effort |
|----|-------|-------|----------|--------|
| **T-ARCH-001** | Electron Fuses | 1 | P0 | 2d |
| **T-ARCH-002** | Sandbox Enable | 1 | P0 | 1d |
| **T-ARCH-003** | Utility Process | 1 | P1 | 3d |
| **T-ARCH-004** | IPC Audit & Sender Validation | 1 | P0 | 2d |
| **T-ARCH-005** | ASAR Integrity | 1 | P0 | 1d |
| **T-ARCH-006** | Multi-window Support | 1 | P1 | 2d |
| **T-EDIT-001** | Database Block v2 | 2 | P0 | 5d |
| **T-EDIT-002** | Column Layout Fix | 2 | P1 | 3d |
| **T-EDIT-003** | Synced Blocks | 4 | P1 | 2d |
| **T-EDIT-004** | Template Buttons | 4 | P1 | 2d |
| **T-EDIT-005** | Audio/PDF/File Blocks | 2 | P1 | 1d |
| **T-EDIT-006** | Embed Ecosystem | 4 | P1 | 3d |
| **T-EDIT-007** | Block Operations Parity | 1 | P1 | 2d |
| **T-EDIT-008** | Slash Menu Completeness | 1 | P1 | 1d |
| **T-DB-001** | Property System | 2 | P0 | 15d |
| **T-DB-002** | View Engine | 2 | P0 | 10d |
| **T-DB-003** | Filter/Sort/Group UI | 2 | P0 | 8d |
| **T-DB-004** | Relations & Rollups | 2 | P0 | 10d |
| **T-DB-005** | Formula Engine | 2 | P0 | 8d |
| **T-DB-006** | Database Block Integration | 2 | P0 | 5d |
| **T-DB-007** | CSV/JSON Import/Export | 2 | P1 | 3d |
| **T-DB-008** | Linked Databases | 2 | P1 | 2d |
| **T-SYNC-001** | WebSocket Server | 3 | P1 | 10d |
| **T-SYNC-002** | CRDT Integration | 3 | P1 | 8d |
| **T-SYNC-003** | Presence System | 3 | P1 | 3d |
| **T-SYNC-004** | Conflict Resolution UI | 3 | P1 | 2d |
| **T-SYNC-005** | Offline Queue | 3 | P1 | 2d |
| **T-SYNC-006** | Typing Indicators | 3 | P2 | 1d |
| **T-AI-001** | RAG with pgvector | 4 | P2 | 3d |
| **T-AI-002** | AI Block Actions | 4 | P2 | 2d |
| **T-AI-003** | Custom Prompts UI | 4 | P2 | 2d |
| **T-AI-004** | Model Management | 4 | P2 | 1d |
| **T-AI-005** | AI Autocomplete | 4 | P2 | 2d |
| **T-UI-001** | Native Context Menus | 1 | P2 | 2d |
| **T-UI-002** | Dock Badge | 1 | P2 | 1d |
| **T-UI-003** | Window Vibrancy | 1 | P2 | 1d |
| **T-UI-004** | Touch Bar Support | 1 | P2 | 1d |
| **T-UI-005** | Drag & Drop Files | 1 | P2 | 2d |
| **T-UI-006** | Protocol Handler | 1 | P2 | 1d |
| **T-MOB-001** | iOS Capacitor | 5 | P3 | 5d |
| **T-MOB-002** | Share Extension | 5 | P3 | 3d |
| **T-MOB-003** | Biometric Lock | 5 | P3 | 3d |
| **T-MOB-004** | PWA/Offline | 5 | P3 | 2d |
| **T-MOB-005** | Mobile Editor Polish | 5 | P3 | 2d |
| **T-API-001** | REST API | 5 | P3 | 5d |
| **T-API-002** | Webhooks | 5 | P3 | 3d |
| **T-API-003** | OAuth 2.0 Server | 5 | P3 | 3d |
| **T-API-004** | API Keys | 5 | P3 | 2d |
| **T-API-005** | Plugin System | 5 | P3 | 5d |

## 🎯 This Week's Sprint (Copy to GitHub Project)

```markdown
## Sprint: Security Hardening & Quick Wins (Week 1)

### Must Do (P0)
- [ ] T-ARCH-001: Electron Fuses (2d)
- [ ] T-ARCH-002: Sandbox Enable (1d)
- [ ] T-ARCH-005: ASAR Integrity (1d)

### Should Do (P1)
- [ ] T-ARCH-004: IPC Audit & Sender Validation (2d)
- [ ] T-EDIT-007: Block Operations Parity (2d)

### Nice to Have (P2)
- [ ] T-UI-001: Native Context Menus (2d)
- [ ] T-UI-002: Dock Badge (1d)
- [ ] T-EDIT-005: Audio/PDF/File Blocks (1d)
- [ ] T-EDIT-002: Column Layout Fix (3d) ← Start this, spans sprint
```

## 🔍 REA Verification Commands

```bash
# After each security task, verify with REA:

# 1. Fuses
npx rea inspect_electron_fuses --path ./dist/mac/Noted.app

# 2. ASAR Integrity
npx rea analyze_javascript_application \
  --input-path ./dist/mac/Noted.app/Contents/Resources/app.asar \
  --format asar \
  --detail summary

# 3. Compare with Notion reference
# Check: ev_48df8d3767a7394d292014e904dc0788e881b22d8544fec4f651be31cd4fe85d
```

## 📊 Notion Reference Numbers (Memorize These)

| Metric | Notion | Target for Noted |
|--------|--------|------------------|
| **BrowserWindow configs** | 14 | ≥ 5 (main, settings, share, notifications, mobile preview) |
| **Context Bridges** | 20 | ≥ 10 (feature-scoped) |
| **Exposed API Members** | 281 | ≥ 100 |
| **IPC Literal Channels** | 7 | ≥ 5 |
| **IPC Dynamic Channels** | 13 | ≤ 5 (prefer literal) |
| **Sender Validations** | 5 | ≥ 5 |
| **Utility Processes** | 2 | ≥ 1 (search/AI/sync) |
| **Native Addons** | 0 | 0 ✅ |
| **ASAR Integrity** | ENFORCED | ENFORCED |
| **OnlyLoadAppFromAsar** | RESTRICTED | RESTRICTED |

## 🛠️ Key Files to Modify (Priority Order)

```
electron/main.cjs                    # T-ARCH-001,002,003,004,006
electron/preload.cjs                 # T-ARCH-004 (IPC audit)
electron/builder-config (or package.json)  # T-ARCH-001,005
src/components/Editor/BlockItem.jsx  # T-EDIT-002,005,007,008
src/components/Editor/DatabaseBlock.jsx  # T-DB-001 to 008 (major rewrite)
src/components/Editor/ColumnListBlock.jsx  # T-EDIT-002
src/utils/cloudSync.js               # T-SYNC-001,002,005
electron/menu.cjs                    # T-UI-001
```

## 📚 Reference Links

- **Notion REA Report:** `rea_analysis/NOTION_APP_ANALYSIS_REPORT.md`
- **Gap Analysis + Roadmap:** `rea_analysis/NOTION_VS_NOTED_COMPARISON.md`
- **GitHub Templates:** `rea_analysis/GITHUB_ISSUE_TEMPLATES.md`
- **Electron Fuses Doc:** https://www.electronjs.org/docs/latest/tutorial/fuses
- **@electron/fuses:** https://github.com/electron/fuses
- **Yjs (CRDT):** https://github.com/yjs/yjs
- **Neon Functions:** https://neon.tech/docs/serverless/functions
- **Capacitor iOS:** https://capacitorjs.com/docs/ios