# GitHub Issue Templates for Noted Development

Copy these templates to `.github/ISSUE_TEMPLATE/` in your repo.

---

## 📋 `.github/ISSUE_TEMPLATE/task-template.yml`

```yaml
name: Development Task
description: Standard task template for Noted development
title: "[TASK-ID] Brief descriptive title"
labels: ["task"]
body:
  - type: markdown
    attributes:
      value: |
        ## Task Overview
        Brief description of what needs to be done and why.

  - type: textarea
    id: context
    attributes:
      label: Context & Motivation
      description: Why is this task needed? Link to related issues, Notion parity gaps, user requests, etc.
      placeholder: |
        Notion has X feature which we lack. Users have requested this via...
        Related to: T-ARCH-001, T-DB-001
    validations:
      required: true

  - type: dropdown
    id: phase
    attributes:
      label: Phase
      description: Which development phase does this belong to?
      options:
        - Phase 1: Security & Foundation (Weeks 1-3)
        - Phase 2: Database & Core Editor (Weeks 4-8)
        - Phase 3: Real-time Collaboration (Weeks 9-12)
        - Phase 4: AI & Differentiation (Weeks 13-15)
        - Phase 5: Platform & Mobile (Weeks 16-20)
        - Quick Win (Do This Week)
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - P0 - Critical (Security/Blocker)
        - P1 - High (Core Feature)
        - P2 - Medium (Differentiator)
        - P3 - Low (Polish/Platform)
    validations:
      required: true

  - type: input
    id: effort
    attributes:
      label: Estimated Effort (days)
      description: How many days for a single developer?
      placeholder: "3"
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance Criteria
      description: Specific, testable criteria for completion
      placeholder: |
        - [ ] Criterion 1
        - [ ] Criterion 2
        - [ ] Criterion 3
    validations:
      required: true

  - type: textarea
    id: technical
    attributes:
      label: Technical Approach
      description: Implementation notes, files to modify, architecture decisions
      placeholder: |
        Files to modify:
        - electron/main.cjs
        - electron/preload.cjs
        - package.json (add @electron/fuses)

        Approach:
        1. Install @electron/fuses
        2. Configure in electron-builder
        3. Build and verify fuses with REA tool
    validations:
      required: false

  - type: checkboxes
    id: dependencies
    attributes:
      label: Dependencies
      description: Tasks that must be completed first
      options:
        - label: "Depends on T-ARCH-001 (Electron Fuses)"
        - label: "Depends on T-DB-001 (Property System)"
        - label: "No dependencies"

  - type: textarea
    id: testing
    attributes:
      label: Testing Strategy
      description: How to verify this works
      placeholder: |
        - Unit tests for X
        - E2E test for Y
        - Manual verification steps
        - REA analysis to confirm security posture
```

---

## 📋 `.github/ISSUE_TEMPLATE/bug-report.yml`

```yaml
name: Bug Report
description: Report a bug or regression
title: "[BUG] Brief description"
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        ## Bug Report
        Please provide clear steps to reproduce.

  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      placeholder: |
        1. Go to...
        2. Click...
        3. Observe...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      placeholder: What should happen?
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      placeholder: What actually happens?
    validations:
      required: true

  - type: dropdown
    id: platform
    attributes:
      label: Platform
      options:
        - macOS (Electron)
        - Windows (Electron)
        - Linux (Electron)
        - Web (Chrome)
        - Web (Firefox)
        - Web (Safari)
        - Android (Capacitor)
        - All platforms
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: App Version
      placeholder: "1.0.0 (from package.json)"
    validations:
      required: false

  - type: textarea
    id: logs
    attributes:
      label: Console Logs / Errors
      render: shell
      placeholder: Paste relevant console output here
    validations:
      required: false

  - type: checkboxes
    id: regression
    attributes:
      label: Regression Check
      options:
        - label: This worked in a previous version
        - label: This is a new feature that never worked
```

---

## 📋 `.github/ISSUE_TEMPLATE/feature-request.yml`

```yaml
name: Feature Request
description: Suggest a new feature or enhancement
title: "[FEATURE] Brief description"
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        ## Feature Request
        Describe the feature you'd like to see.

  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this solve? What user need?
      placeholder: |
        Users currently cannot...
        This is a gap vs Notion where...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: How should this work?
      placeholder: |
        Add a new block type / API endpoint / setting that...
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Other approaches you've thought about
      placeholder: |
        Could also do X, but Y is better because...
    validations:
      required: false

  - type: dropdown
    id: notion-parity
    attributes:
      label: Notion Parity
      description: Does Notion have this feature?
      options:
        - Yes, exact match needed
        - Yes, but we can improve on it
        - No, this is a Noted differentiator
        - Not applicable
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: Priority
      options:
        - P0 - Critical
        - P1 - High
        - P2 - Medium
        - P3 - Low / Nice to have
    validations:
      required: true
```

---

## 📋 `.github/ISSUE_TEMPLATE/security-audit.yml`

```yaml
name: Security Audit Task
description: Track security hardening tasks from REA analysis
title: "[SEC] Security hardening: Brief description"
labels: ["security", "hardening"]
body:
  - type: markdown
    attributes:
      value: |
        ## Security Hardening Task
        Derived from REA analysis of Notion.app Electron fuses and architecture.

  - type: dropdown
    id: finding
    attributes:
      label: REA Finding Reference
      description: Which REA finding does this address?
      options:
        - Electron Fuses: RunAsNode disabled
        - Electron Fuses: EnableCookieEncryption enabled
        - Electron Fuses: EnableNodeOptionsEnvironmentVariable disabled
        - Electron Fuses: EnableNodeCliInspectArguments disabled
        - Electron Fuses: EnableEmbeddedAsarIntegrityValidation enabled
        - Electron Fuses: OnlyLoadAppFromAsar enabled
        - Electron Fuses: GrantFileProtocolExtraPrivileges enabled (review)
        - Electron Fuses: WasmTrapHandlers enabled
        - Sandbox not enabled
        - CSP headers missing
        - IPC sender validation missing
        - ASAR integrity not enforced
        - Native addons present (Notion has 0)
        - Context bridge audit needed
    validations:
      required: true

  - type: textarea
    id: current-state
    attributes:
      label: Current State in Noted
      placeholder: |
        Noted currently has sandbox: false in webPreferences.
        No fuse configuration in electron-builder.
    validations:
      required: true

  - type: textarea
    id: target-state
    attributes:
      label: Target State (Notion Parity)
      placeholder: |
        Enable sandbox: true
        Configure @electron/fuses with all critical fuses matching Notion
    validations:
      required: true

  - type: textarea
    id: verification
    attributes:
      label: Verification Method
      placeholder: |
        1. Build signed app
        2. Run REA inspect_electron_fuses on built app
        3. Compare output with Notion reference (ev_48df8d3767a7394d292014e904dc0788e881b22d8544fec4f651be31cd4fe85d)
        4. Verify all critical fuses match
    validations:
      required: true
```

---

## 📋 `.github/ISSUE_TEMPLATE/database-task.yml`

```yaml
name: Database System Task
description: Task for the Notion-style database implementation
title: "[DB] Database: Brief description"
labels: ["database", "core-feature"]
body:
  - type: markdown
    attributes:
      value: |
        ## Database System Task
        Part of the Notion-parity database implementation (T-DB-XXX series).

  - type: dropdown
    id: component
    attributes:
      label: Database Component
      options:
        - Property Types System (T-DB-001)
        - View Engine - Table/Board/List/Calendar/Gallery/Timeline (T-DB-002)
        - Filter/Sort/Group UI (T-DB-003)
        - Relations & Rollups (T-DB-004)
        - Formula Engine (T-DB-005)
        - Database Block Integration (T-DB-006)
        - CSV/JSON Import/Export (T-DB-007)
        - Linked Databases (T-DB-008)
    validations:
      required: true

  - type: textarea
    id: property-types
    attributes:
      label: Property Types (if applicable)
      description: Which property types does this task cover?
      placeholder: |
        - Text, Number, Select, Multi-select
        - Date, Person, File, Checkbox
        - Relation, Rollup, Formula
        - Created time, Last edited time, Created by, Last edited by
    validations:
      required: false

  - type: textarea
    id: views
    attributes:
      label: Views (if applicable)
      description: Which view types does this task implement?
      placeholder: |
        - Table view
        - Board (Kanban) view
        - List view
        - Calendar view
        - Gallery view
        - Timeline/Gantt view
    validations:
      required: false

  - type: textarea
    id: schema-changes
    attributes:
      label: Database Schema Changes
      description: Drizzle schema modifications needed
      placeholder: |
        // drizzle.config.js additions
        export const databaseProperties = pgTable('database_properties', {
          id: text('id').primaryKey(),
          databaseId: text('database_id').references(() => databases.id),
          name: text('name'),
          type: text('type'), // 'text', 'number', 'select', 'relation', etc.
          config: jsonb('config'), // options for select, relation config, formula expression
          position: integer('position')
        });
    validations:
      required: false

  - type: textarea
    id: ui-components
    attributes:
      label: New UI Components Needed
      placeholder: |
        - PropertyTypeSelector (dropdown with 20+ types)
        - ViewSwitcher (tabs for Table/Board/List/Calendar/Gallery/Timeline)
        - FilterBuilder (visual query builder with AND/OR groups)
        - SortPanel (multi-column sort)
        - GroupBySelector
        - RelationPicker (page search + create new)
        - RollupConfigurator (target property + aggregation)
        - FormulaEditor (syntax highlighting, autocomplete, validation)
    validations:
      required: false
```

---

## 📋 `.github/ISSUE_TEMPLATE/ai-task.yml`

```yaml
name: AI Enhancement Task
description: Task for AI assistant improvements
title: "[AI] AI: Brief description"
labels: ["ai", "enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        ## AI Enhancement Task
        Leverage Noted's multi-provider local-first AI advantage.

  - type: dropdown
    id: area
    attributes:
      label: AI Area
      options:
        - RAG / Workspace Q&A (T-AI-001)
        - AI Block Actions (T-AI-002)
        - Custom Prompts (T-AI-003)
        - Model Management UI (T-AI-004)
        - AI Autocomplete (T-AI-005)
        - New Provider Integration
        - Streaming/Performance Optimization
    validations:
      required: true

  - type: textarea
    id: providers
    attributes:
      label: Providers Affected
      placeholder: |
        - Ollama (local)
        - LM Studio (local)
        - OpenAI-compatible APIs
        - Anthropic
        - Google Gemini
        - Custom endpoint
    validations:
      required: false

  - type: textarea
    id: privacy
    attributes:
      label: Privacy Considerations
      description: How does this maintain local-first privacy?
      placeholder: |
        All embeddings computed locally with Ollama
        No data sent to external APIs without explicit user consent
    validations:
      required: true
```

---

## 📋 `.github/ISSUE_TEMPLATE/sync-task.yml`

```yaml
name: Sync & Collaboration Task
description: Task for realtime sync and collaboration features
title: "[SYNC] Sync: Brief description"
labels: ["sync", "collaboration", "realtime"]
body:
  - type: markdown
    attributes:
      value: |
        ## Sync & Collaboration Task
        Moving from polling to realtime WebSocket + CRDT.

  - type: dropdown
    id: component
    attributes:
      label: Sync Component
      options:
        - WebSocket Server (T-SYNC-001)
        - CRDT Integration - Yjs/Automerge (T-SYNC-002)
        - Presence System (T-SYNC-003)
        - Conflict Resolution UI (T-SYNC-004)
        - Offline Queue (T-SYNC-005)
        - Typing Indicators (T-SYNC-006)
    validations:
      required: true

  - type: textarea
    id: architecture
    attributes:
      label: Architecture Decisions
      placeholder: |
        WebSocket: Neon Functions (serverless, scales with DB)
        CRDT: Yjs (mature, good React bindings, WebRTC support)
        Presence: Yjs awareness protocol
        Conflict UI: Notion-style banner + inline markers
    validations:
      required: true

  - type: checkboxes
    id: compat
    attributes:
      label: Compatibility Requirements
      options:
        - label: Must not break existing local-first BroadcastChannel sync
        - label: Must not break existing Neon PostgreSQL cloud sync
        - label: Must work offline-first (queue mutations)
        - label: Must support multi-tab (BroadcastChannel + WS)
```

---

## 📋 `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Pull Request

### Related Issue
Closes #XXX

### Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security hardening
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement

### Description
Brief description of changes made.

### Testing
- [ ] Unit tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing completed
- [ ] Security verification (if applicable)

### Security Checklist (for security-related PRs)
- [ ] Electron fuses verified with REA
- [ ] Sandbox enabled and tested
- [ ] CSP headers added
- [ ] IPC sender validation implemented
- [ ] No new native addons introduced
- [ ] Context bridge audit completed

### Database Changes
- [ ] Drizzle migration created (`npm run db:generate`)
- [ ] Migration tested locally
- [ ] Schema changes documented

### Screenshots / Recordings
<!-- Add screenshots for UI changes -->

### Breaking Changes
<!-- List any breaking changes and migration path -->

### Checklist
- [ ] Code follows project style (ESLint, Prettier)
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, comments, types)
- [ ] No console.log left in production code
```

---

## 📋 `.github/workflows/ci.yml` (Reference)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e

  electron-build:
    runs-on: macos-latest
    needs: lint-and-test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run electron:build:mac
      # TODO: Add REA security verification step here
      # - run: npx rea inspect_electron_fuses ./dist/mac/Noted.app

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - uses: pypa/gh-action-pip-audit@v1
```

---

## 📋 Project Board Structure (GitHub Projects)

### Views to Create:

#### 1. **Roadmap View** (Timeline)
```
Phase 1: Security & Foundation (Weeks 1-3)
├── T-ARCH-001: Electron Fuses [P0, 2d]
├── T-ARCH-002: Sandbox Enable [P0, 1d]
├── T-ARCH-005: ASAR Integrity [P0, 1d]
├── T-ARCH-004: IPC Audit & Sender Validation [P0, 2d]
├── T-ARCH-003: Utility Process [P1, 3d]
├── T-ARCH-006: Multi-window Support [P1, 2d]
├── T-EDIT-007: Block Operations Parity [P1, 2d]
└── T-UI-001: Native Context Menus [P2, 2d]

Phase 2: Database & Core Editor (Weeks 4-8)
├── T-DB-001: Property System [P0, 15d]
├── T-DB-002: View Engine [P0, 10d]
├── T-DB-006: Database Block Integration [P0, 5d]
├── T-DB-003: Filter/Sort/Group UI [P0, 8d]
├── T-DB-004: Relations & Rollups [P0, 10d]
├── T-EDIT-002: Column Layout Fix [P1, 3d]
├── T-DB-005: Formula Engine [P0, 8d]
├── T-DB-007: CSV/JSON Import/Export [P1, 3d]
└── T-DB-008: Linked Databases [P1, 2d]

Phase 3: Real-time Collaboration (Weeks 9-12)
├── T-SYNC-001: WebSocket Server [P1, 10d]
├── T-SYNC-002: CRDT Integration [P1, 8d]
├── T-SYNC-005: Offline Queue [P1, 2d]
├── T-SYNC-003: Presence System [P1, 3d]
├── T-SYNC-004: Conflict Resolution UI [P1, 2d]
└── T-SYNC-006: Typing Indicators [P2, 1d]

Phase 4: AI & Differentiation (Weeks 13-15)
├── T-AI-001: RAG with pgvector [P2, 3d]
├── T-AI-002: AI Block Actions [P2, 2d]
├── T-AI-003: Custom Prompts UI [P2, 2d]
├── T-AI-004: Model Management [P2, 1d]
├── T-AI-005: AI Autocomplete [P2, 2d]
├── T-EDIT-003: Synced Blocks [P1, 2d]
├── T-EDIT-004: Template Buttons [P1, 2d]
└── T-EDIT-006: Embed Ecosystem [P1, 3d]

Phase 5: Platform & Mobile (Weeks 16-20)
├── T-API-001: REST API [P3, 5d]
├── T-API-002: Webhooks [P3, 3d]
├── T-API-003: OAuth 2.0 Server [P3, 3d]
├── T-API-004: API Keys [P3, 2d]
├── T-API-005: Plugin System [P3, 5d]
├── T-MOB-001: iOS Capacitor [P3, 5d]
├── T-MOB-002: Share Extension [P3, 3d]
├── T-MOB-003: Biometric Lock [P3, 3d]
├── T-MOB-004: PWA/Offline [P3, 2d]
└── T-MOB-005: Mobile Editor Polish [P3, 2d]

Quick Wins (This Week)
├── T-ARCH-001: Electron Fuses [P0, 2d]
├── T-ARCH-005: ASAR Integrity [P0, 1d]
├── T-EDIT-002: Column Layout Fix [P1, 3d]
├── T-EDIT-005: Audio/PDF/File Blocks [P1, 1d]
├── T-UI-001: Native Context Menus [P2, 2d]
└── T-UI-002: Dock Badge [P2, 1d]
```

#### 2. **Kanban View** (Status-based)
Columns: `Backlog` → `Ready` → `In Progress` → `In Review` → `Done`

#### 3. **By Component View** (Grouped)
Groups: `Architecture`, `Editor`, `Database`, `Sync`, `AI`, `UI/Desktop`, `Mobile`, `Platform/API`

#### 4. **Security Tracking View**
Filter: `label:security` - Track all hardening tasks

---

## 📋 Label Scheme

```bash
# Priority
P0 - Critical (red)
P1 - High (orange)
P2 - Medium (yellow)
P3 - Low (green)

# Type
task (blue)
bug (red)
enhancement (purple)
security (red)
database (purple)
ai (green)
sync (blue)
ui (pink)
mobile (orange)
platform (gray)

# Phase
phase-1 (red)
phase-2 (orange)
phase-3 (yellow)
phase-4 (green)
phase-5 (blue)
quick-win (purple)

# Status
blocked (red)
needs-review (yellow)
ready-for-qa (green)
```

---

## 📋 Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| `M1: Security Hardened` | Week 3 | All P0 security tasks complete, REA verification passes |
| `M2: Database MVP` | Week 8 | Property system, Table/Board/List views, basic filters working |
| `M3: Database Complete` | Week 12 | All views, relations, rollups, formulas working |
| `M4: Realtime Sync` | Week 16 | WebSocket + CRDT + Presence working |
| `M5: AI Differentiation` | Week 18 | RAG, AI autocomplete, custom prompts shipped |
| `M6: Platform Ready` | Week 22 | REST API, OAuth, iOS app, Plugin system |
| `M7: v1.0 Launch` | Week 24 | All phases complete, beta tested, docs done |