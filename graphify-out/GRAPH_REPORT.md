# Graph Report - noted  (2026-10-25)

## Corpus Check
- 279 files · ~3,554,391 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 67 file(s) not represented in the graph (top: .css 41, .xml 10, (none) 4)

## Summary
- 2346 nodes · 4178 edges · 160 communities (136 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a40e941`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 2. Token Desain Eksak (Light Mode & Dark Mode)
- aiAssistant.js
- DesignSystemGenerator
- BM25
- comments.js
- package.json
- SettingsModal.jsx
- Laporan Investigasi REA: Fitur Autentikasi & Form Login (`Notion.app` v7.39.0 & `Noted`)
- search_stack
- search
- ExampleInstrumentedTest.java
- CatalogRefreshTest
- Neon
- Appendix B - Canonical Sources (read these before reinventing)
- test_design_system_mode.py
- UI/UX Pro Max - Design Intelligence
- status
- DatabaseBlock.jsx
- 3.2 Palet Warna Kanonikal (Light vs. Dark Mode)
- test_design_system_mode.py
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- 3. Daftar Deviasi Visual Teridentifikasi
- Notion vs Noted — Comprehensive Feature Gap Analysis & Development Task Plan
- Notion App - Full REA Analysis Report
- 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)
- AI SDK agents on Neon Functions
- main.cjs
- 2. Section Breakdown & Components
- db.js
- generate_design_system
- .oxlintrc.json
- vite.config.js
- Editor.jsx
- MainActivity.java
- validate_data.py
- PRD 03: Real-time Collaboration
- 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)
- tasteskill: Anti-Slop Frontend Skill
- 9. AI TELLS (Forbidden Patterns)
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- api/auth.js
- Subscribing to queries
- PRD 01: Electron Security Hardening
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- llmProxy.js
- PRD 02: Database System Overhaul
- Noted 📝
- App.jsx
- lucide-react
- _search_csv_detailed
- _style_is_dark_primary
- Lakebase Postgres Branching
- Neon Functions
- Neon Auth
- cloudSync.js
- Laporan Audit Paritas & Verifikasi QA: Fitur Autentikasi & Form Login
- GitHub Issue Templates for Noted Development
- schema.sqlite.js
- generate-qa-report.mjs
- offlineQueue
- Delivery payload
- detect_domain
- csv
- Neon AI Gateway
- _normalize
- Postgres Egress Optimizer
- Neon Object Storage
- Noted Development - Quick Reference Card
- Noted vs Notion - Comprehensive Development PRD Plan
- check-env.mjs
- rea-extract-index.mjs
- Spesifikasi Perilaku Clean-Room: Autentikasi & Form Login (Noted)
- utils/auth.js
- Server-side rendering
- Detailed Feature Requirements
- WebSocket Servers
- propertyTypes.js
- Function Triggers
- NotedDocsPage.jsx
- Development Roadmap
- verifyLoginCredentials
- Defining live queries
- Lakebase Postgres
- devDependencies
- drizzle-kit
- P0: Database System Overhaul
- APPENDICES - Real Source-Backed Reference Material
- Ponytail
- TestThresholdGate
- Bukti REA — Notion Desktop 7.39.0
- Optimistic mutations
- Feature Gap Analysis
- Laporan Audit QA Paritas Antarmuka: Notion Desktop vs. Noted Workspace
- Defining queries
- Technical Architecture
- Success Metrics
- scripts
- Testing Strategy
- _row_identities
- Ponytail Mode (Default: Full)
- Integrations and Observability
- rea-extract-surface.mjs
- App Flow & User Journeys
- Appendix
- Deployment & Release Plan
- Semantic Vector Search
- UI/UX Design Specifications
- Database Schema & Architecture
- Neon Realtime
- REA Scout (`rea-scout`)
- Client-side reactivity
- security.js
- collaboration-server.js
- mint-session-token.mjs
- react
- Production hardening for Neon Functions
- p0SecurityFixes.test.js
- REA Spec Writer (`rea-spec-writer`)
- REA Tester (`rea-tester`)
- REA UI Scout (`rea-ui-scout`)
- REA UI Tester (`rea-ui-tester`)
- test_catalog_refresh.py
- Sentry (errors, logs, and traces)
- REA Builder (`rea-builder`)
- Mastra agents with Mastra Studio observability
- test_data_contracts.py
- Shipping native binaries with a Function
- TestDiagnosticsContracts
- dependencies
- MCP servers on Neon Functions
- Server-sent events (SSE) on Neon Functions
- 0. BRIEF INFERENCE (Read the Room Before Anything Else)
- hybrid-search.md
- Managing Lakebase Search with Drizzle
- TestStackFlagWithDesignSystem
- Claimable Neon
- Full-Text Search with BM25 Ranking
- Setup Flow
- vercel.json
- Troubleshooting and Neon-Specific Performance
- allFeatures.spec.js
- neon/references/function-triggers.md
- parse-env.md
- sdk.md

## God Nodes (most connected - your core abstractions)
1. `react` - 85 edges
2. `App()` - 58 edges
3. `lucide-react` - 53 edges
4. `search()` - 44 edges
5. `DesignSystemGenerator` - 38 edges
6. `vitest` - 37 edges
7. `search_stack()` - 35 edges
8. `BlockItem()` - 30 edges
9. `scripts` - 28 edges
10. `getCurrentUser()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Next.js` --references--> `handler()`  [INFERRED]
  .agents/skills/neon-auth/references/managed-auth.md → api/auth.js
- `Plugin support` --references--> `handler()`  [INFERRED]
  .agents/skills/neon-auth/SKILL.md → api/auth.js
- `3. **By Component View** (Grouped)` --references--> `Editor()`  [INFERRED]
  rea_analysis/GITHUB_ISSUE_TEMPLATES.md → src/components/Editor/Editor.jsx
- `1.2 Perbandingan Arsitektur dengan `Noted` Saat Ini` --references--> `loginWithEmail()`  [INFERRED]
  reports/login.md → src/utils/auth.js
- `4.1 Inisialisasi & Persistensi Eksplisit `noted_device_id_v1` (`[Minor]` — D-03)` --references--> `logout()`  [INFERRED]
  comparison.md → src/utils/auth.js

## Import Cycles
- None detected.

## Communities (160 total, 24 thin omitted)

### Community 0 - "2. Token Desain Eksak (Light Mode & Dark Mode)"
Cohesion: 0.06
Nodes (34): 1.1 Diagram Hierarki DOM & Layout, 1.2 Spesifikasi Kontainer Berdasarkan Varian Layar, 1.3 Urutan Vertikal Elemen & Jarak Antar Blok (Spacing/Gaps), 1. Hierarki Layout & Struktur Kontainer (DOM, Flexbox & Grid), 2.1 Token Warna Latar (Surfaces & Backgrounds), 2.2 Token Warna Tipografi (Text & Icons), 2.3 Token Border & Garis Pemisah (Borders & Dividers), 2.4 Token Warna Tombol Utama (Primary Brand Buttons) (+26 more)

### Community 1 - "aiAssistant.js"
Cohesion: 0.12
Nodes (23): AIAssistantBar(), QUICK_ACTIONS, InlineAIResultCard(), ACTION_GROUPS, InlineAIToolbar(), LANGUAGE_OPTIONS, TONE_OPTIONS, ImportMarkdownModal() (+15 more)

### Community 2 - "DesignSystemGenerator"
Cohesion: 0.09
Nodes (4): DesignSystemGenerator, TestReasoningMatch, TestReasoningContract, TestEndToEndCoherence

### Community 3 - "BM25"
Cohesion: 0.14
Nodes (4): BM25, _suggest_identities(), TestBm25CoreBehavior, TestTokenizer

### Community 4 - "comments.js"
Cohesion: 0.23
Nodes (26): BlockCommentPopover(), CommentsDrawer(), NotionInlineCommentPill(), NotionMarginCommentCard(), BlockItem(), CoverPickerModal(), EmojiPicker(), PageHeader() (+18 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (25): author, description, main, name, private, type, version, @capacitor/android (+17 more)

### Community 6 - "SettingsModal.jsx"
Cohesion: 0.22
Nodes (17): 5.1 Mekanisme Sesi & Cookie di `Notion.app` (`[CONFIRMED]`), 5.2 Mekanisme Token & Sesi di `Noted` (`[CONFIRMED]`), 5. Mekanisme Token, Cookie, & Manajemen Sesi, NOTION_AVATAR_COLORS, SettingsModal(), Sidebar(), saveMcpConfig(), getSavedAccounts() (+9 more)

### Community 7 - "Laporan Investigasi REA: Fitur Autentikasi & Form Login (`Notion.app` v7.39.0 & `Noted`)"
Cohesion: 0.10
Nodes (20): 1.1 Arsitektur Autentikasi `Notion.app` (v7.39.0), 1.2 Perbandingan Arsitektur dengan `Noted` Saat Ini, 1. Ringkasan Fitur & Arsitektur Target, 2.1 Rute Autentikasi pada `Notion.app` (`[CONFIRMED]`), 2.2 Jembatan IPC & Context Bridge Terkait Autentikasi (`[CONFIRMED]`), 2. Titik Masuk & Pemicu Aksi Pengguna (Entry Points), 3.1 Metode 1: Login via Email (Langkah 1 Check Email -> Langkah 2 OTP / Magic Link / Password), 3.2 Metode 2: OAuth 2.0 Popup & Callback (Google, Apple, Microsoft) (+12 more)

### Community 8 - "search_stack"
Cohesion: 0.11
Nodes (6): _exact_stack_identifier(), search_stack(), _rows(), TestNativeDesktopStackFreshness, _rows(), TestWebStackFreshness

### Community 9 - "search"
Cohesion: 0.11
Nodes (5): search(), _style_search_destination(), TestSearchDomains, TestStyleTaxonomy, TestTextLayoutRetrieval

### Community 12 - "Neon"
Cohesion: 0.05
Nodes (36): Auth, 1. Install the Neon CLI, 2. Install the Neon MCP Server, 3. Install Neon Agent Skills, 4. Link Your Project and Get Started, Architecture: How to Use Neon, Backend Primitives, Bootstrap a New Project (+28 more)

### Community 13 - "Appendix B - Canonical Sources (read these before reinventing)"
Cohesion: 0.13
Nodes (15): Appendix B - Canonical Sources (read these before reinventing), Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon, Fluent UI, GOV.UK, Material Web (+7 more)

### Community 14 - "test_design_system_mode.py"
Cohesion: 0.13
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header() (+1 more)

### Community 15 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (17): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+9 more)

### Community 16 - "status"
Cohesion: 0.24
Nodes (10): Changing query parameters, Handling errors, initialData, React, RealtimeProvider, refreshQuery, useLiveQuery, utils (+2 more)

### Community 17 - "DatabaseBlock.jsx"
Cohesion: 0.09
Nodes (24): CalendarView(), DatabaseViewTabs(), VIEW_ICONS, FilterSortBar(), COMMON_FUNCTIONS, FormulaEditor(), RelationCellPicker(), RelationManager() (+16 more)

### Community 18 - "3.2 Palet Warna Kanonikal (Light vs. Dark Mode)"
Cohesion: 0.06
Nodes (30): 1. Metadata Target & Bukti Ekstraksi REA, 2.1 Multi-Window & Shell Architecture (Electron Layer), 2.2 Hierarki Komponen Pohon UI (DOM & React Tree), 2.3 Rincian Tata Letak Flexbox & Grid, 2. Struktur Hierarki Komponen & Sistem Tata Letak, 3.1 Tipografi & Font Stack Kanonikal, 3.2 Palet Warna Kanonikal (Light vs. Dark Mode), 3.3 Radius, Padding, Margin, dan Box Shadows (+22 more)

### Community 19 - "test_design_system_mode.py"
Cohesion: 0.09
Nodes (11): _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), _filter_anti_patterns_for_mode(), format_master_md(), _palette_is_dark(), _relative_luminance(), _select_palette_for_mode() (+3 more)

### Community 20 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 21 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 22 - "3. Daftar Deviasi Visual Teridentifikasi"
Cohesion: 0.09
Nodes (21): 1. Ringkasan Eksekutif & Skor Kesesuaian Visual (*Visual Match Rate*), 2.1 Komparasi Layout & Geometri Kontainer, 2.2 Komparasi Token Warna & Bayangan (Light Mode & Dark Mode), 2.3 Komparasi Tipografi, Input, Tombol & Respon Interaktif, 2. Tabel Komparasi Token Desain & Geometri (Target vs Hasil Build), 3. Daftar Deviasi Visual Teridentifikasi, 4.1 Rekomendasi Perbaikan pada [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css), 4.2 Rekomendasi Perbaikan pada [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx) (+13 more)

### Community 23 - "Notion vs Noted — Comprehensive Feature Gap Analysis & Development Task Plan"
Cohesion: 0.04
Nodes (45): 10. Prioritized Development Roadmap, 11. Estimated Effort Summary, 12. Quick Wins (Do This Week), 13. Noted's Competitive Advantages (Leverage These!), 14. Appendix: REA Evidence References, 15. Next Steps, 1. Architecture & Electron Hardening Comparison, 2. Editor & Block System Comparison (+37 more)

### Community 24 - "Notion App - Full REA Analysis Report"
Cohesion: 0.05
Nodes (39): 1. Electron Fuse Configuration, 2. JavaScript Application Analysis (app.asar), 3. Application Structure (Webpack Bundles), 4. Semantic Graph Analysis, 5. Security Assessment, 6. Technical Architecture Insights, 7. Artifacts & Evidence, 8. Recommendations (+31 more)

### Community 25 - "4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 26 - "AI SDK agents on Neon Functions"
Cohesion: 0.29
Nodes (7): 1. Declare the gateway and the function, 2. The handler: stream a tool-calling agent, 3. Generate images and persist them, 4. Call it directly from the client (don't proxy the stream), 5. Run and deploy, AI SDK agents on Neon Functions, Further reading

### Community 27 - "main.cjs"
Cohesion: 0.07
Nodes (40): acquireSingleInstanceLock(), { app, BrowserWindow, ipcMain, shell, dialog, Menu, session }, createMainWindow(), { createSecureHandler, validateSender }, fs, getSessionIdentity(), getUserConfigFilePath(), getWindowStateFilePath() (+32 more)

### Community 28 - "2. Section Breakdown & Components"
Cohesion: 0.14
Nodes (13): 1. Executive Summary & Design System, 2.1 Sticky Top Navigation Bar, 2.2 Hero Section, 2.3 Logo Marquee / Social Proof, 2.4 Bento Features Grid ("AI where your team works"), 2.5 Use Cases Grid ("See what Noted can do"), 2.6 Customer Testimonials ("Trusted by teams that ship"), 2.7 Global Traction & Metric Badges (+5 more)

### Community 29 - "db.js"
Cohesion: 0.20
Nodes (14): ensureSchema(), findUserByEmail(), getConnectionString(), getDrizzlePg(), getPool(), getSqliteDb(), saveUser(), getSessionFromRequest() (+6 more)

### Community 30 - "generate_design_system"
Cohesion: 0.08
Nodes (14): _detect_page_type(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system(), _resolve_dial(), safe_slug(), apply_decision_rules() (+6 more)

### Community 31 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 33 - "vite.config.js"
Cohesion: 0.13
Nodes (7): vite, @vitejs/plugin-react, { execSync }, { flipFuses, FuseVersion, FuseV1Options }, path, getMediaRoots(), isInsideAllowedRoot()

### Community 34 - "Editor.jsx"
Cohesion: 0.20
Nodes (21): BlockRichText, CODE_LANGUAGES, Editor(), getBlockIdFromNode(), MentionMenu(), BG_COLORS, BLOCK_PICKER_ITEMS, MobileEditorToolbar() (+13 more)

### Community 36 - "validate_data.py"
Cohesion: 0.07
Nodes (42): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract(), _check_catalog_contract() (+34 more)

### Community 37 - "PRD 03: Real-time Collaboration"
Cohesion: 0.06
Nodes (30): 1. Overview, 2. Current State vs Target State, 3.1 WebSocket Server (T-SYNC-001) - 10 days, 3.2 CRDT Integration with Yjs (T-SYNC-002) - 8 days, 3.3 Presence System (T-SYNC-003) - 3 days, 3.4 Conflict Resolution UI (T-SYNC-004) - 2 days, 3.5 Offline Queue (T-SYNC-005) - 2 days, 3.6 Typing Indicators (T-SYNC-006) - 1 day (+22 more)

### Community 38 - "10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 39 - "tasteskill: Anti-Slop Frontend Skill"
Cohesion: 0.14
Nodes (14): 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values), 1.B Use-Case Presets, 1.C How the Dials Drive Output, 1. THE THREE DIALS (Core Configuration), 2.A When to reach for a real design system (use official packages), 2.B When the brief is an aesthetic, not a system (+6 more)

### Community 40 - "9. AI TELLS (Forbidden Patterns)"
Cohesion: 0.25
Nodes (8): 9.A Visual & CSS, 9. AI TELLS (Forbidden Patterns), 9.B Typography, 9.C Layout & Spacing, 9.D Content & Data ("Jane Doe" Effect), 9.E External Resources & Components, 9.F Production-Test Tells (banned outright), 9.G EM-DASH BAN (the single most-violated Tell)

### Community 41 - "11. REDESIGN PROTOCOL"
Cohesion: 0.29
Nodes (7): 11.A Detect the Mode (first action), 11.B Audit Before Touching, 11.C Preservation Rules, 11.D Modernisation Levers (priority order), 11.E Decision Tree: Targeted Evolution vs Full Redesign, 11.F What Never Changes Silently, 11. REDESIGN PROTOCOL

### Community 42 - "3. DEFAULT ARCHITECTURE & CONVENTIONS"
Cohesion: 0.29
Nodes (7): 3.A Stack, 3.B State, 3.C Icons, 3.D Emoji Policy, 3. DEFAULT ARCHITECTURE & CONVENTIONS, 3.E Responsiveness & Layout Mechanics, 3.F Dependency Verification (mandatory)

### Community 43 - "6. PERFORMANCE & ACCESSIBILITY GUARDRAILS"
Cohesion: 0.29
Nodes (7): 6.A Hardware Acceleration, 6.B Reduced Motion (mandatory), 6.C Dark Mode (mandatory for any consumer-facing page), 6.D Core Web Vitals Targets, 6.E DOM Cost, 6.F Z-Index Restraint, 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### Community 44 - "api/auth.js"
Cohesion: 0.23
Nodes (13): checkRateLimit(), findUserByEmail(), getAllowedClientIds(), getClientIp(), handler(), otpStore, rateLimitMap, saveUser() (+5 more)

### Community 45 - "Subscribing to queries"
Cohesion: 0.17
Nodes (12): Contents, Debug subscriptions, Fetch from a server function, Fetch from an API endpoint, Getting the query to subscribe to, Handle errors, Listen for changes, Log client diagnostics (+4 more)

### Community 46 - "PRD 01: Electron Security Hardening"
Cohesion: 0.07
Nodes (27): 1. Overview, 2. Current State vs Target State, 3.1 Electron Fuses Configuration (T-ARCH-001), 3.2 Sandbox Mode (T-ARCH-002), 3.3 ASAR Integrity & Loading (T-ARCH-005), 3.4 IPC Sender Validation (T-ARCH-004), 3.5 Utility Process (T-ARCH-003) - Phase 1 Prep, 3. Requirements (+19 more)

### Community 48 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 49 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.22
Nodes (8): Logs: CLI, Loki, and SDK pagination, Loki-compatible read API, 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns, end()

### Community 50 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 51 - "llmProxy.js"
Cohesion: 0.21
Nodes (13): ALLOWED_LOCAL_HOSTS, createLlmProxyHandler(), DEFAULT_TARGETS, getAllowedUpstreamHosts(), getBaseUrl(), getForwardedHeaders(), isAllowedUpstream(), normalizeHostname() (+5 more)

### Community 52 - "PRD 02: Database System Overhaul"
Cohesion: 0.07
Nodes (27): 1. Overview, 2. Current State vs Target State, 3.1 Property System (T-DB-001) - 15 days, 3.2 Relations & Rollups (T-DB-004) - 15 days, 3.3 Formula Engine (T-DB-005) - 8 days, 3.4 Views System (T-DB-002) - 10 days, 3.5 Filters, Sorts, Groups (T-DB-003) - 8 days, 3.6 Advanced Features (T-DB-007, T-DB-008) - 5 days (+19 more)

### Community 53 - "Noted 📝"
Cohesion: 0.20
Nodes (9): 📦 Database & Drizzle CLI, ✨ Features, 🚀 Getting Started, Installation, 📄 License, Noted 📝, Prerequisites, Server environment (+1 more)

### Community 56 - "App.jsx"
Cohesion: 0.06
Nodes (58): yjs, App(), FIRST_WORKSPACE_LOGIN_KEY, PresenceIndicator(), RemoteCursor(), TypingIndicator(), ArchiveModal(), CommandPaletteModal() (+50 more)

### Community 57 - "lucide-react"
Cohesion: 0.11
Nodes (9): lucide-react, BreadcrumbBlock(), COMMON_PRESETS, MathEquationBlock(), TableOfContentsBlock(), VideoEmbedBlock(), WebBookmarkBlock(), COVER_PRESETS (+1 more)

### Community 58 - "_search_csv_detailed"
Cohesion: 0.10
Nodes (16): _contains_phrase(), _domain_keywords(), _file_signature(), _get_bm25(), _load_csv(), _load_csv_snapshot(), _load_product_keywords(), _load_rows_or_empty() (+8 more)

### Community 59 - "_style_is_dark_primary"
Cohesion: 0.21
Nodes (4): _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 60 - "Lakebase Postgres Branching"
Cohesion: 0.08
Nodes (25): Beta Support Guidance (Mandatory), Branch Type Decision, Branching in CI/CD, CLI usage, Console and API usage, Create a Normal Branch (Preferred for Real-Data Migration Testing), Create a Schema-Only Branch (Beta, Sensitive Data), Example 1: Migration testing with realistic data (+17 more)

### Community 61 - "Neon Functions"
Cohesion: 0.11
Nodes (18): Architecture: Where Functions Fit, Availability, Connecting to Postgres, Develop Locally and Deploy, Environment Variables, Function Triggers, Functions as an Agent Backend (Next.js and Similar Frameworks), Further Reading (+10 more)

### Community 65 - "Neon Auth"
Cohesion: 0.08
Nodes (23): Auth emails, Cross-subdomain vs bearer JWT, Data API identity, Environment, Managed Better Auth: implement login, Next.js, Organization invitations, Packages (+15 more)

### Community 66 - "cloudSync.js"
Cohesion: 0.21
Nodes (16): broadcastLocalChange(), currentSyncState, fetchRemoteWorkspace(), getCloudSyncState(), notedServerRequest(), notifyStatus(), pullCloudWorkspace(), pushRemoteWorkspace() (+8 more)

### Community 67 - "Laporan Audit Paritas & Verifikasi QA: Fitur Autentikasi & Form Login"
Cohesion: 0.15
Nodes (12): 1.1 Skor Paritas Keseluruhan, 1.2 Match Rate per Kategori Fungsional, 1. Executive Parity Scorecard (Ringkasan Match Rate), 2.1 Eksekusi Test Runner (`Vitest`), 2.3 Matriks Kasus Uji Standar (`TC-01` s/d `TC-15`), 2. Matriks Hasil Pengujian Otomatis & Verifikasi Skenario, 4.1 Inisialisasi & Persistensi Eksplisit `noted_device_id_v1` (`[Minor]` — D-03), 4.2 Penyelarasan Batas Panjang Email di Server `api/_lib/security.js` (`[Minor]` — D-04) (+4 more)

### Community 68 - "GitHub Issue Templates for Noted Development"
Cohesion: 0.11
Nodes (18): 1. **Roadmap View** (Timeline), 2. **Kanban View** (Status-based), 3. **By Component View** (Grouped), 4. **Security Tracking View**, 📋 `.github/ISSUE_TEMPLATE/ai-task.yml`, 📋 `.github/ISSUE_TEMPLATE/bug-report.yml`, 📋 `.github/ISSUE_TEMPLATE/database-task.yml`, 📋 `.github/ISSUE_TEMPLATE/feature-request.yml` (+10 more)

### Community 69 - "schema.sqlite.js"
Cohesion: 0.18
Nodes (9): drizzle-orm, pages, pages, trash, users, workspaceSettings, trash, users (+1 more)

### Community 70 - "generate-qa-report.mjs"
Cohesion: 0.14
Nodes (16): e2e, e2eRows, escapeHtml(), generatedAt, rootDir, skipE2e, sourceFiles, sourceRoots (+8 more)

### Community 72 - "Delivery payload"
Cohesion: 0.33
Nodes (6): Delivery payload, `parseTrigger` (Hono, schedule only), `parseTriggerDelivery` (both types), `parseTriggerInvocation` (`fetch`, schedule only), Subscribe to the sealed query, json()

### Community 74 - "csv"
Cohesion: 0.11
Nodes (6): resolve(), shipped_invocations(), SkillScriptPathsTest, read_rows(), read_rows(), TestTextLayoutDataContracts

### Community 75 - "Neon AI Gateway"
Cohesion: 0.12
Nodes (16): Availability, Build Agents with Mastra (Recommended), Build Agents with the Vercel AI SDK (Recommended), Enabling the gateway: plan and model-catalog gating, Environment Variables, Further Reading, Generate Embeddings with the AI SDK, List Available Models at Runtime (`/v1/models`) (+8 more)

### Community 76 - "_normalize"
Cohesion: 0.22
Nodes (5): _exact_match_diagnostic(), _legacy_successor_guidance(), _normalize(), _stack_query_requests_legacy(), _stack_row_filter()

### Community 77 - "Postgres Egress Optimizer"
Cohesion: 0.12
Nodes (16): Application-side aggregation, Check if pg_stat_statements is available, Diagnostic queries, Further Reading, Handle empty stats, High-frequency queries on static data, Interpret the results, JOIN duplication (+8 more)

### Community 78 - "Neon Object Storage"
Cohesion: 0.12
Nodes (15): Architecture: Where Object Storage Fits, Availability, Built-in Branch Logs, CLI Bucket and Object Commands, Environment Variables, Further Reading, Neon Documentation, Neon Infrastructure as Code (`neon.ts`) (+7 more)

### Community 79 - "Noted Development - Quick Reference Card"
Cohesion: 0.14
Nodes (13): 1. Verify Current Electron Fuses (Baseline), 2. Enable Electron Fuses (T-ARCH-001) - DO THIS FIRST, 3. Import Full Evidence Bundle for Deep Analysis, 🚀 Immediate Next Commands, 🛠️ Key Files to Modify (Priority Order), 📁 Local Files Created, Noted Development - Quick Reference Card, 📊 Notion Reference Numbers (Memorize These) (+5 more)

### Community 80 - "Noted vs Notion - Comprehensive Development PRD Plan"
Cohesion: 0.20
Nodes (9): Competitive Advantages, Critical Gaps, Current State Assessment, Executive Summary, Key Objectives, Noted vs Notion - Comprehensive Development PRD Plan, Table of Contents, Timeline (+1 more)

### Community 81 - "check-env.mjs"
Cohesion: 0.20
Nodes (6): localEnv, localIssues, rootDir, SERVER_VARS, serverIssues, shouldPush

### Community 82 - "rea-extract-index.mjs"
Cohesion: 0.20
Nodes (9): exports, limits, modules, outDir, raw, root, seen, storage (+1 more)

### Community 83 - "Spesifikasi Perilaku Clean-Room: Autentikasi & Form Login (Noted)"
Cohesion: 0.10
Nodes (20): 1. Ikhtisar & Prinsip Clean-Room, 2. Requirements Fungsional (`FR-01` s/d `FR-12`), 3.1 Konstanta Konfigurasi Autentikasi, 3.2 Struktur Objek `AuthUser`, 3.3 Struktur Objek `AuthSession`, 3.4 Struktur Objek `LoginFormPayload`, 3.5 Struktur Objek `AuthError`, 3. Model Data & Kontrak State (+12 more)

### Community 84 - "utils/auth.js"
Cohesion: 0.28
Nodes (17): applyDesktopSession(), AUTH_CONFIG, decodeSessionPayload(), describeAuthError(), fromBase64Url(), getAuthState(), getGoogleClientId(), handleSessionExpired() (+9 more)

### Community 85 - "Server-side rendering"
Cohesion: 0.13
Nodes (15): Contents, Create a `DbClient` per router, Define the collection, Examples, Keep row shapes identical, Keep secrets on the server, Open the connection in the browser, Render the initial rows straight away (+7 more)

### Community 86 - "Detailed Feature Requirements"
Cohesion: 0.22
Nodes (9): Detailed Feature Requirements, P0: Electron Security Hardening, P1: Real-time Collaboration, T-COLLAB-001: WebSocket Server (10 days), T-COLLAB-002: CRDT Integration (8 days), T-COLLAB-003: Presence System (3 days), T-SEC-001: Electron Fuses (2 days), T-SEC-002: Sandbox Mode (1 day) (+1 more)

### Community 87 - "WebSocket Servers"
Cohesion: 0.50
Nodes (4): Client must reconnect, Fan-out across isolates (do not skip this), Heartbeat (keep the socket alive), WebSocket Servers

### Community 89 - "propertyTypes.js"
Cohesion: 0.22
Nodes (8): getCompatibleFunctions(), getFunctionType(), RollupConfig(), DATE_FORMATS, NUMBER_FORMATS, PROPERTY_CATEGORIES, PROPERTY_TYPES, ROLLUP_FUNCTIONS

### Community 90 - "Function Triggers"
Cohesion: 0.22
Nodes (9): CLI, Fields, Function Triggers, Inheritance, Local `neon dev`, Logs, MCP backup, neon.ts (preferred) (+1 more)

### Community 91 - "NotedDocsPage.jsx"
Cohesion: 0.12
Nodes (29): FOOTER_DICTIONARY, NotedFooter(), COMMON_NAV_TEXTS, GITHUB_CONFIG, GithubIcon(), GithubNavPill(), showToast(), Toast() (+21 more)

### Community 92 - "Development Roadmap"
Cohesion: 0.29
Nodes (7): Development Roadmap, Milestone 1: Security Hardening (Week 1-3), Milestone 2: Database Foundation (Week 4-6), Milestone 3: Database Views & UI (Week 7-8), Milestone 4: Collaboration (Week 9-12), Milestone 5: AI & Polish (Week 13-15), Milestone 6: Platform (Week 16-20)

### Community 93 - "verifyLoginCredentials"
Cohesion: 0.23
Nodes (20): 2.2 Matriks Verifikasi Skenario Fungsional (Input Normal, Edge Cases, & Kondisi Error), 3. Daftar Perbedaan (Discrepancy Ledger), AccountAvatar(), LOGIN_I18N, NotionLoginModal(), createAuthError(), createAuthSession(), isElectronApp() (+12 more)

### Community 94 - "Defining live queries"
Cohesion: 0.33
Nodes (6): Defining live queries, Parameter types, Query parameters, Table requirements, Using a query builder or ORM, Using raw SQL

### Community 95 - "Lakebase Postgres"
Cohesion: 0.15
Nodes (13): Autoscaling, Branching, Connection Pooling, Gotchas, Instant Restore, IP Allow Lists, Lakebase Postgres, Lakebase Search (+5 more)

### Community 96 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, better-sqlite3, concurrently, cross-env, drizzle-kit, electron, electron-builder, jsdom (+11 more)

### Community 98 - "P0: Database System Overhaul"
Cohesion: 0.33
Nodes (6): P0: Database System Overhaul, T-DB-001: Property System (15 days), T-DB-002: Relations & Rollups (10 days), T-DB-003: Formula Engine (8 days), T-DB-004: Advanced Views (10 days), T-DB-005: Filters, Sorts, Groups (8 days)

### Community 99 - "APPENDICES - Real Source-Backed Reference Material"
Cohesion: 0.29
Nodes (6): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix C - Apple Liquid Glass: Honest Web Approximation, Safer web approximation skeleton, What is NOT official, What is official

### Community 100 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 102 - "Bukti REA — Notion Desktop 7.39.0"
Cohesion: 0.40
Nodes (4): Batasan yang perlu diketahui, Bukti REA — Notion Desktop 7.39.0, Isi, Regenerasi

### Community 103 - "Optimistic mutations"
Cohesion: 0.15
Nodes (13): Automatic management of optimistic state, Calling the routes from the frontend, Contents, How optimistic mutations work, Optimistic mutations, Render the app, Returning the `txid` from your backend, Running example (+5 more)

### Community 104 - "Feature Gap Analysis"
Cohesion: 0.40
Nodes (5): Architecture & Security (P0), Collaboration (P1), Database System (P0), Editor & Blocks (P1), Feature Gap Analysis

### Community 105 - "Laporan Audit QA Paritas Antarmuka: Notion Desktop vs. Noted Workspace"
Cohesion: 0.15
Nodes (12): 1. Executive Parity Scorecard, 2. Rincian Discrepancy Ledger & Status Resolusi Akhir, 3.1 Tipografi & Ketajaman Visual (`index.css` & `BlockItem.css`), 3.2 Floating Rounded Pill Tab Bar (`TabBar.css`), 3.3 Slender Workspace Sidebar (`Sidebar.css` & `index.css`), 3.4 Page Canvas Breathing Room (`PageHeader.css` & `Editor.css`), 3. Rincian Pembaruan Desain Modern ala Notion Desktop, 4. Residual Unknowns & REA Evidence IDs (+4 more)

### Community 106 - "Defining queries"
Cohesion: 0.17
Nodes (12): Authorization, Contents, Defining queries, Exposing an endpoint, Exposing queries, Live authorization, Renewing sealed queries, Sealing authorized queries (+4 more)

### Community 107 - "Technical Architecture"
Cohesion: 0.40
Nodes (5): Backend, Desktop (Electron), Frontend, Mobile (Capacitor), Technical Architecture

### Community 108 - "Success Metrics"
Cohesion: 0.40
Nodes (5): Differentiators, Feature Parity, Performance, Success Metrics, User Experience

### Community 109 - "scripts"
Cohesion: 0.07
Nodes (28): scripts, android:build, android:open, android:sync, build, db:generate, db:push, db:sqlite:push (+20 more)

### Community 110 - "Testing Strategy"
Cohesion: 0.40
Nodes (5): E2E Tests (Playwright), Integration Tests, Security Tests, Testing Strategy, Unit Tests

### Community 111 - "_row_identities"
Cohesion: 0.33
Nodes (3): _exact_row_identity(), _row_identities(), _style_identity()

### Community 112 - "Ponytail Mode (Default: Full)"
Cohesion: 0.50
Nodes (3): Decision Ladder, Guardrails (Never cut), Ponytail Mode (Default: Full)

### Community 113 - "Integrations and Observability"
Cohesion: 0.67
Nodes (3): Application instrumentation, Built-in branch logs, Integrations and Observability

### Community 114 - "rea-extract-surface.mjs"
Cohesion: 0.20
Nodes (9): allMembers, bridges, bridgeSummary, ipc, outDir, raw, root, storage (+1 more)

### Community 115 - "App Flow & User Journeys"
Cohesion: 0.50
Nodes (4): App Flow & User Journeys, Collaboration Journey, New User Journey, Power User Journey - Database

### Community 116 - "Appendix"
Cohesion: 0.50
Nodes (4): Appendix, Key Files to Modify, New Dependencies Needed, Resources

### Community 117 - "Deployment & Release Plan"
Cohesion: 0.50
Nodes (4): Beta Releases, Deployment & Release Plan, Production Release, Release Channels

### Community 118 - "Semantic Vector Search"
Cohesion: 0.18
Nodes (11): AI SDK (Recommended), Build the Index, Contents, Create the Extension, OpenAI SDK Alternative, Prepare Embeddings, Query, Semantic Vector Search (+3 more)

### Community 119 - "UI/UX Design Specifications"
Cohesion: 0.50
Nodes (4): Component Library Updates, Design Principles (Match Notion), Theme System, UI/UX Design Specifications

### Community 120 - "Database Schema & Architecture"
Cohesion: 0.67
Nodes (3): Current Schema (Neon PostgreSQL), Database Schema & Architecture, Sync Strategy

### Community 121 - "Neon Realtime"
Cohesion: 0.22
Nodes (9): Choose the Stack, Core Pattern, Define and Seal Queries, How It Works, More Docs, Neon Realtime, Optimistic Writes, Server-Side Rendering (+1 more)

### Community 123 - "REA Scout (`rea-scout`)"
Cohesion: 0.33
Nodes (5): Alur Kerja Investigasi, Format Output (`reports/[feature-name].md`), Otorisasi & Etika, REA Scout (`rea-scout`), Tugas Utama

### Community 124 - "Client-side reactivity"
Cohesion: 0.25
Nodes (8): Client-side reactivity, Contents, Create the collection, Manage optimistic state, Other frameworks, Query the collection, Seal a broader query, TanStack DB

### Community 125 - "security.js"
Cohesion: 0.14
Nodes (14): applyCors(), DEFAULT_DEV_ORIGINS, getAllowedOrigins(), isSameOrigin(), isValidEmail(), loadEnvOnce(), MAX_BLOCKS_BYTES, MAX_PAGES_PER_PUSH (+6 more)

### Community 126 - "collaboration-server.js"
Cohesion: 0.22
Nodes (6): y-websocket, http, server, { setupWSConnection }, WebSocket, wss

### Community 127 - "mint-session-token.mjs"
Cohesion: 0.25
Nodes (5): env, now, payload, payloadB64, signature

### Community 128 - "react"
Cohesion: 0.13
Nodes (11): react, @testing-library/react, vitest, BubbleMenu(), COLOR_OPTIONS, ColumnListBlock(), DEFAULT_2_COLS, PROPERTY_TYPES (+3 more)

### Community 129 - "Production hardening for Neon Functions"
Cohesion: 0.22
Nodes (9): Choose the caller shape, Function Triggers only, Limit authenticated application work, Native URL, Preserve existing clients, Production hardening for Neon Functions, Public consumers through a Worker, Reject these (+1 more)

### Community 130 - "p0SecurityFixes.test.js"
Cohesion: 0.52
Nodes (5): DEFAULT_AI_ALLOWED_HOSTS, getAiAllowedHosts(), isAllowedAiUrl(), normalizeHostname(), isMobileNativeApp()

### Community 131 - "REA Spec Writer (`rea-spec-writer`)"
Cohesion: 0.40
Nodes (4): Aturan Ketat Clean-Room (WAJIB DITAATI), REA Spec Writer (`rea-spec-writer`), Struktur Dokumen Output (`spec.md`), Tugas Utama

### Community 132 - "REA Tester (`rea-tester`)"
Cohesion: 0.40
Nodes (4): Format Output (`comparison.md`), Metodologi Pengujian Paritas, REA Tester (`rea-tester`), Tugas Utama

### Community 133 - "REA UI Scout (`rea-ui-scout`)"
Cohesion: 0.40
Nodes (4): Alur Kerja Inspeksi Visual, Format Output (`reports/ui-[feature-name].md`), REA UI Scout (`rea-ui-scout`), Tugas Utama

### Community 134 - "REA UI Tester (`rea-ui-tester`)"
Cohesion: 0.40
Nodes (4): Dimensi Audit Visual, Format Output (`ui-comparison.md`), REA UI Tester (`rea-ui-tester`), Tugas Utama

### Community 135 - "test_catalog_refresh.py"
Cohesion: 0.10
Nodes (9): _write_persisted_file(), CatalogSummaryLineEndingsTest, _load_generator(), TestMetricMath, build_ico(), main(), run(), sips_pad() (+1 more)

### Community 136 - "Sentry (errors, logs, and traces)"
Cohesion: 0.20
Nodes (10): 1. Initialize before anything else, 2. Provide the DSN as a deploy-time secret, 3. Create the request span and catch route errors, 4. Errors are for failures; logs are for the story, 5. Trace the agent itself, Environment variables, Other Node integrations, Sentry error monitoring on Neon Functions (+2 more)

### Community 137 - "REA Builder (`rea-builder`)"
Cohesion: 0.50
Nodes (3): Alur Kerja Pembangunan (Step-by-Step), Isolasi & Batasan Clean-Room (WAJIB DITAATI), REA Builder (`rea-builder`)

### Community 138 - "Mastra agents with Mastra Studio observability"
Cohesion: 0.25
Nodes (8): 1. Define the agent against the Neon AI Gateway, 2. Wire observability to Mastra Studio, 3. Structured output through the gateway, 4. Create the Mastra project + token with the CLI, 5. Pass the creds via `neon.ts` (third-party env), 6. Verify, Further reading, Mastra agents with Mastra Studio observability

### Community 139 - "test_data_contracts.py"
Cohesion: 0.13
Nodes (6): read_rows(), split_values(), style_identities(), TestGeneratedCatalogContract, TestLandingAndStackContract, TestStyleIdentityContract

### Community 140 - "Shipping native binaries with a Function"
Cohesion: 0.25
Nodes (7): `bundler: "none"`: ship a prebuilt directory, Custom `bundler`: return the file map, `externalPackages`: npm packages with a Node addon, Shipping native binaries with a Function, Size limits, Standalone executables, The runtime a binary lands on

### Community 142 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, drizzle-orm, @fontsource/plus-jakarta-sans, katex, lucide-react (+7 more)

### Community 143 - "MCP servers on Neon Functions"
Cohesion: 0.33
Nodes (6): Authenticating the server, MCP servers on Neon Functions, Option 1 — OAuth via the Better Auth MCP plugin (best for third-party clients), Option 2 — API key or session JWT via self-hosted Better Auth (simplest), Testing, The server

### Community 144 - "Server-sent events (SSE) on Neon Functions"
Cohesion: 0.25
Nodes (7): Caveats, Client, Minimal SSE endpoint (no framework), Push to every client, across isolates, Server-sent events (SSE) on Neon Functions, Wire format (just text), With Hono

### Community 146 - "0. BRIEF INFERENCE (Read the Room Before Anything Else)"
Cohesion: 0.40
Nodes (5): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline

### Community 147 - "hybrid-search.md"
Cohesion: 0.43
Nodes (3): Adapt the Hybrid Search, Hybrid Search, RRF Example

### Community 149 - "Managing Lakebase Search with Drizzle"
Cohesion: 0.25
Nodes (8): BM25 Index, Config, Extensions, Generate and Store Embeddings, Managing Lakebase Search with Drizzle, Query, Schema, Tune Per Query

### Community 161 - "Claimable Neon"
Cohesion: 0.29
Nodes (6): Claim, Claimable Neon, If neon claim is missing, Path, With REST, With the CLI

### Community 166 - "Full-Text Search with BM25 Ranking"
Cohesion: 0.33
Nodes (6): Full-Text Search with BM25 Ranking, Prepare and Index Text, Query and Interpret Scores, Set Parameters at Build Time or Per Query, Set the Candidate Limit, Use Prefilter Selectively

### Community 178 - "Setup Flow"
Cohesion: 0.33
Nodes (6): 1. Select the organization and project, 2. Get the connection string, 3. Pick the connection method and driver, 4. Set up the schema, Setup Flow, When to use pooled vs direct connections

### Community 185 - "vercel.json"
Cohesion: 0.50
Nodes (3): buildCommand, framework, outputDirectory

### Community 187 - "Troubleshooting and Neon-Specific Performance"
Cohesion: 0.33
Nodes (6): Choose CLI or MCP, Inspect Neon Cache Behavior Per Query, Interpret Results Safely, Performance Workflow, Pick the Diagnostic, Troubleshooting and Neon-Specific Performance

## Knowledge Gaps
- **14 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@fontsource/plus-jakarta-sans`, `@neon/env` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `search` to `Production hardening for Neon Functions`, `DesignSystemGenerator`, `BM25`, `validate_data.py`, `detect_domain`, `csv`, `_normalize`, `TestDiagnosticsContracts`, `_row_identities`, `_search_csv_detailed`, `generate_design_system`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `App()` (e.g. with `.connect()` and `.destroy()`) actually correct?**
  _`App()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `2. Token Desain Eksak (Light Mode & Dark Mode)` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Why does `Production hardening for Neon Functions` connect `Production hardening for Neon Functions` to `neon-functions/SKILL.md`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `aiAssistant.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12413793103448276 - nodes in this community are weakly interconnected._