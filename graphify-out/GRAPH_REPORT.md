# Graph Report - noted  (2026-10-20)

## Corpus Check
- 174 files · ~2,549,756 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 55 file(s) not represented in the graph (top: .css 34, .xml 10, (none) 3)

## Summary
- 1515 nodes · 2760 edges · 104 communities (77 shown, 27 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `21c2fa60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- core.py
- test_core_data_quality.py
- validate_data.py
- BM25
- BlockItem.jsx
- package.json
- App.jsx
- design_system.py
- search_stack
- search
- ExampleInstrumentedTest.java
- CatalogRefreshTest
- Neon
- Appendix B - Canonical Sources (read these before reinventing)
- format_ascii_box
- UI/UX Pro Max - Design Intelligence
- _palette_is_dark
- DatabaseBlock.jsx
- test_design_system_mode.py
- test_design_system_mode.py
- Pre-Delivery Checklist (canonical — the only one)
- Quick Reference
- test_data_contracts.py
- read_rows
- _normalize
- 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)
- main.cjs
- test_catalog_summary_line_endings.py
- read_rows
- schema.sqlite.js
- .oxlintrc.json
- vite.config.js
- Defining live queries
- MainActivity.java
- 0. BRIEF INFERENCE (Read the Room Before Anything Else)
- electron-builder.json
- 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)
- tasteskill: Anti-Slop Frontend Skill
- 9. AI TELLS (Forbidden Patterns)
- 11. REDESIGN PROTOCOL
- 3. DEFAULT ARCHITECTURE & CONVENTIONS
- 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS
- db.js
- _search_csv_detailed
- Client-side reactivity
- 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)
- 5. CONTEXT-AWARE PROACTIVITY
- 8. DARK MODE PROTOCOL
- 7. DIAL DEFINITIONS (Technical Reference)
- AI SDK agents on Neon Functions
- Noted 📝
- drizzle-kit
- TestThresholdGate
- generate_design_system
- Managed Better Auth: implement login
- Lakebase Postgres Branching
- Neon Functions
- CatalogSummaryLineEndingsTest
- test_core.py
- TestStackFlagWithDesignSystem
- TestFixtureValidation
- test_core.py
- Neon AI Gateway
- _domain_keywords
- Postgres Egress Optimizer
- Neon Object Storage
- Server-side rendering
- neon-functions/SKILL.md
- Function Triggers
- Lakebase Postgres
- devDependencies
- Optimistic mutations
- Subscribing to queries
- Defining queries
- scripts
- Semantic Vector Search
- Neon Realtime
- Production hardening for Neon Functions
- Sentry (errors, logs, and traces)
- Mastra agents with Mastra Studio observability
- Shipping native binaries with a Function
- dependencies
- Server-sent events (SSE) on Neon Functions
- hybrid-search.md
- Managing Lakebase Search with Drizzle
- Claimable Neon
- Full-Text Search with BM25 Ranking
- Setup Flow
- vercel.json
- Troubleshooting and Neon-Specific Performance
- @playwright/test
- Logs: CLI, Loki, and SDK pagination
- neon/references/function-triggers.md
- parse-env.md
- sdk.md

## God Nodes (most connected - your core abstractions)
1. `react` - 50 edges
2. `search()` - 44 edges
3. `DesignSystemGenerator` - 38 edges
4. `lucide-react` - 36 edges
5. `search_stack()` - 35 edges
6. `App()` - 33 edges
7. `BlockItem()` - 29 edges
8. `scripts` - 26 edges
9. `vitest` - 21 edges
10. `getCurrentUser()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Public consumers through a Worker` --references--> `search()`  [INFERRED]
  .agents/skills/neon-functions/references/production-hardening.md → .agents/skills/ui-ux-pro-max/scripts/core.py
- `1. Initialize before anything else` --references--> `main()`  [INFERRED]
  .agents/skills/neon-functions/references/sentry.md → .agents/skills/ui-ux-pro-max/scripts/validate_data.py
- `Environment Variables` --references--> `main()`  [INFERRED]
  .agents/skills/neon-functions/SKILL.md → .agents/skills/ui-ux-pro-max/scripts/validate_data.py
- `TestBm25CoreBehavior` --uses--> `BM25`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_core.py → .agents/skills/ui-ux-pro-max/scripts/core.py
- `TestEndToEndCoherence` --uses--> `DesignSystemGenerator`  [INFERRED]
  .agents/skills/ui-ux-pro-max/scripts/tests/test_design_system_mode.py → .agents/skills/ui-ux-pro-max/scripts/design_system.py

## Import Cycles
- None detected.

## Communities (104 total, 27 thin omitted)

### Community 0 - "core.py"
Cohesion: 0.09
Nodes (8): _passes_threshold(), _query_coverage(), resolve(), shipped_invocations(), SkillScriptPathsTest, read_rows(), read_rows(), TestTextLayoutDataContracts

### Community 1 - "test_core_data_quality.py"
Cohesion: 0.16
Nodes (10): read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _check_chart_contract(), _check_typography_contract(), _configured_font_names() (+2 more)

### Community 2 - "validate_data.py"
Cohesion: 0.11
Nodes (33): _catalog_date(), _check_app_interface_contract(), _check_catalog_contract(), _check_catalog_summary(), _check_color_contract(), _check_core_data_contract(), _check_file(), _check_font_catalog() (+25 more)

### Community 3 - "BM25"
Cohesion: 0.16
Nodes (4): BM25, _get_bm25(), _suggest_identities(), TestTokenizer

### Community 4 - "BlockItem.jsx"
Cohesion: 0.05
Nodes (89): lucide-react, react, @testing-library/react, vitest, BlockCommentPopover(), CommentsDrawer(), NotionInlineCommentPill(), NotionMarginCommentCard() (+81 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (24): author, description, main, name, private, type, version, @capacitor/android (+16 more)

### Community 6 - "App.jsx"
Cohesion: 0.06
Nodes (80): App(), NotionLoginModal(), CommandPaletteModal(), PageAnalyticsModal(), NOTION_AVATAR_COLORS, SettingsModal(), TrashModal(), VersionHistoryDrawer() (+72 more)

### Community 7 - "design_system.py"
Cohesion: 0.12
Nodes (7): _detect_page_type(), format_page_override_md(), _generate_intelligent_overrides(), persist_design_system(), safe_slug(), _write_persisted_file(), format_output()

### Community 8 - "search_stack"
Cohesion: 0.08
Nodes (10): _exact_stack_identifier(), _project_row(), search_stack(), _suggest_terms(), _valid_max_results(), _rows(), TestNativeDesktopStackFreshness, TestTextLayoutRetrieval (+2 more)

### Community 9 - "search"
Cohesion: 0.12
Nodes (4): search(), _style_search_destination(), TestSearchDomains, TestStyleTaxonomy

### Community 12 - "Neon"
Cohesion: 0.05
Nodes (36): Auth, 1. Install the Neon CLI, 2. Install the Neon MCP Server, 3. Install Neon Agent Skills, 4. Link Your Project and Get Started, Architecture: How to Use Neon, Backend Primitives, Bootstrap a New Project (+28 more)

### Community 13 - "Appendix B - Canonical Sources (read these before reinventing)"
Cohesion: 0.09
Nodes (21): APPENDICES - Real Source-Backed Reference Material, Appendix A - Install Commands per Design System, Appendix B - Canonical Sources (read these before reinventing), Appendix C - Apple Liquid Glass: Honest Web Approximation, Apple Liquid Glass (Apple platforms only), Atlassian, Bootstrap, Carbon (+13 more)

### Community 14 - "format_ascii_box"
Cohesion: 0.13
Nodes (9): ansi_ljust(), format_ascii_box(), add_wrapped(), wrap_text(), format_markdown(), hex_to_ansi(), _mode_support_labels(), section_header() (+1 more)

### Community 15 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.11
Nodes (17): Before Delivering App UI, Example Workflow, If a search returns 0 results, Output Formats, Query Contract, Rule Categories by Priority, Running the search tool, Step 1: Analyze User Requirements (+9 more)

### Community 16 - "_palette_is_dark"
Cohesion: 0.18
Nodes (4): _palette_is_dark(), _relative_luminance(), TestEndToEndCoherence, TestLuminance

### Community 17 - "DatabaseBlock.jsx"
Cohesion: 0.35
Nodes (9): CARD_GRADIENTS, DatabaseBlock(), DateCell(), formatDateDisplay(), getStatusColor(), getTagColor(), PROPERTY_TYPES, STATUS_OPTIONS (+1 more)

### Community 18 - "test_design_system_mode.py"
Cohesion: 0.15
Nodes (6): _filter_anti_patterns_for_mode(), _query_wants_dark(), _resolve_color_mode(), _style_is_dark_primary(), TestAntiPatternGating, TestModeResolution

### Community 19 - "test_design_system_mode.py"
Cohesion: 0.15
Nodes (6): _button_outline_text_color(), _contrast_ratio(), _derive_dark_palette(), format_master_md(), _select_palette_for_mode(), TestPaletteSelection

### Community 20 - "Pre-Delivery Checklist (canonical — the only one)"
Cohesion: 0.15
Nodes (12): Accessibility, Common Rules for Professional UI + Pre-Delivery Checklist, Icons & Visual Elements, Interaction, Interaction (App), Layout, Layout & Spacing, Light/Dark Mode (+4 more)

### Community 21 - "Quick Reference"
Cohesion: 0.15
Nodes (12): 10. Charts & Data (LOW), 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Style Selection (HIGH), 5. Layout & Responsive (HIGH), 6. Typography & Color (MEDIUM), 7. Animation (MEDIUM) (+4 more)

### Community 22 - "test_data_contracts.py"
Cohesion: 0.15
Nodes (7): apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), _validate_action(), split_values(), style_identities(), TestStyleIdentityContract

### Community 23 - "read_rows"
Cohesion: 0.23
Nodes (3): read_rows(), TestGeneratedCatalogContract, TestLandingAndStackContract

### Community 24 - "_normalize"
Cohesion: 0.13
Nodes (8): _exact_match_diagnostic(), _exact_row_identity(), _legacy_successor_guidance(), _normalize(), _row_identities(), _stack_query_requests_legacy(), _stack_row_filter(), _style_identity()

### Community 25 - "4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)"
Cohesion: 0.17
Nodes (12): 4.10 Quotes & Testimonials, 4.11 Page Theme Lock (Light / Dark Mode Consistency), 4.1 Typography, 4.2 Color Calibration, 4.3 Layout Diversification, 4.4 Materiality, Shadows, Cards, 4.5 Interactive UI States, 4.6 Data & Form Patterns (+4 more)

### Community 27 - "main.cjs"
Cohesion: 0.11
Nodes (15): { app, BrowserWindow, ipcMain, shell, dialog, Menu, session }, createMainWindow(), fs, getWindowStateFilePath(), gotTheLock, loadDatabaseUrl(), loadWindowState(), path (+7 more)

### Community 29 - "read_rows"
Cohesion: 0.10
Nodes (4): DesignSystemGenerator, _resolve_dial(), TestReasoningMatch, TestReasoningContract

### Community 30 - "schema.sqlite.js"
Cohesion: 0.18
Nodes (9): drizzle-orm, pages, pages, trash, users, workspaceSettings, trash, users (+1 more)

### Community 31 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 34 - "Defining live queries"
Cohesion: 0.33
Nodes (6): Defining live queries, Parameter types, Query parameters, Table requirements, Using a query builder or ORM, Using raw SQL

### Community 36 - "0. BRIEF INFERENCE (Read the Room Before Anything Else)"
Cohesion: 0.40
Nodes (5): 0.A Read these signals first, 0.B Output a one-line "Design Read" before generating, 0. BRIEF INFERENCE (Read the Room Before Anything Else), 0.C If the brief is ambiguous, ask one question, do not guess, 0.D Anti-Default Discipline

### Community 37 - "electron-builder.json"
Cohesion: 0.05
Nodes (40): appId, asar, copyright, directories, buildResources, output, dmg, contents (+32 more)

### Community 38 - "10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)"
Cohesion: 0.20
Nodes (10): 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know), Animation Library Choice, Cards & Containers, Galleries & Media, Hero Paradigms, Layout & Grids, Micro-Interactions & Effects, Navigation & Menus (+2 more)

### Community 39 - "tasteskill: Anti-Slop Frontend Skill"
Cohesion: 0.20
Nodes (10): 13. OUT OF SCOPE, 14. FINAL PRE-FLIGHT CHECK, 1.A Dial Inference (design read → dial values), 1.B Use-Case Presets, 1.C How the Dials Drive Output, 1. THE THREE DIALS (Core Configuration), 2.A When to reach for a real design system (use official packages), 2.B When the brief is an aesthetic, not a system (+2 more)

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

### Community 44 - "db.js"
Cohesion: 0.26
Nodes (9): ensureSchema(), getConnectionString(), getDrizzlePg(), getPool(), getSqliteDb(), handler(), handler(), better-sqlite3 (+1 more)

### Community 45 - "_search_csv_detailed"
Cohesion: 0.20
Nodes (5): _contains_phrase(), _rewrite_query_for_domain(), _search_csv(), _search_csv_detailed(), TestBm25CoreBehavior

### Community 46 - "Client-side reactivity"
Cohesion: 0.12
Nodes (16): Changing query parameters, Client-side reactivity, Contents, Create the collection, Handling errors, initialData, Manage optimistic state, Other frameworks (+8 more)

### Community 48 - "12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)"
Cohesion: 0.40
Nodes (5): 12.A File Location, 12.B Required Frontmatter, 12.C Required Body Sections, 12.D Block-Library Discipline, 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

### Community 49 - "5. CONTEXT-AWARE PROACTIVITY"
Cohesion: 0.40
Nodes (5): 5.A Sticky-Stack - Canonical Skeleton, 5.B Horizontal-Pan - Canonical Skeleton, 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative), 5. CONTEXT-AWARE PROACTIVITY, 5.D Forbidden Animation Patterns

### Community 50 - "8. DARK MODE PROTOCOL"
Cohesion: 0.40
Nodes (5): 8.A Token Strategy (pick one, stick to it), 8.B Do Not Prescribe Specific Colors Here, 8.C Default Mode, 8.D Test in Both Modes Before Finishing, 8. DARK MODE PROTOCOL

### Community 51 - "7. DIAL DEFINITIONS (Technical Reference)"
Cohesion: 0.50
Nodes (4): 7. DIAL DEFINITIONS (Technical Reference), DESIGN_VARIANCE (Level 1-10), MOTION_INTENSITY (Level 1-10), VISUAL_DENSITY (Level 1-10)

### Community 52 - "AI SDK agents on Neon Functions"
Cohesion: 0.29
Nodes (7): 1. Declare the gateway and the function, 2. The handler: stream a tool-calling agent, 3. Generate images and persist them, 4. Call it directly from the client (don't proxy the stream), 5. Run and deploy, AI SDK agents on Neon Functions, Further reading

### Community 53 - "Noted 📝"
Cohesion: 0.22
Nodes (8): 📦 Database & Drizzle CLI, ✨ Features, 🚀 Getting Started, Installation, 📄 License, Noted 📝, Prerequisites, 🛠️ Tech Stack

### Community 59 - "Managed Better Auth: implement login"
Cohesion: 0.08
Nodes (23): Auth emails, Cross-subdomain vs bearer JWT, Data API identity, Environment, Managed Better Auth: implement login, Next.js, Organization invitations, Packages (+15 more)

### Community 60 - "Lakebase Postgres Branching"
Cohesion: 0.08
Nodes (25): Beta Support Guidance (Mandatory), Branch Type Decision, Branching in CI/CD, CLI usage, Console and API usage, Create a Normal Branch (Preferred for Real-Data Migration Testing), Create a Schema-Only Branch (Beta, Sensitive Data), Example 1: Migration testing with realistic data (+17 more)

### Community 61 - "Neon Functions"
Cohesion: 0.08
Nodes (26): Application instrumentation, Architecture: Where Functions Fit, Availability, Built-in branch logs, Client must reconnect, Connecting to Postgres, Develop Locally and Deploy, Environment Variables (+18 more)

### Community 75 - "Neon AI Gateway"
Cohesion: 0.12
Nodes (16): Availability, Build Agents with Mastra (Recommended), Build Agents with the Vercel AI SDK (Recommended), Enabling the gateway: plan and model-catalog gating, Environment Variables, Further Reading, Generate Embeddings with the AI SDK, List Available Models at Runtime (`/v1/models`) (+8 more)

### Community 76 - "_domain_keywords"
Cohesion: 0.22
Nodes (6): _domain_keywords(), _file_signature(), _load_csv(), _load_csv_snapshot(), _load_product_keywords(), _load_rows_or_empty()

### Community 77 - "Postgres Egress Optimizer"
Cohesion: 0.12
Nodes (16): Application-side aggregation, Check if pg_stat_statements is available, Diagnostic queries, Further Reading, Handle empty stats, High-frequency queries on static data, Interpret the results, JOIN duplication (+8 more)

### Community 78 - "Neon Object Storage"
Cohesion: 0.12
Nodes (15): Architecture: Where Object Storage Fits, Availability, Built-in Branch Logs, CLI Bucket and Object Commands, Environment Variables, Further Reading, Neon Documentation, Neon Infrastructure as Code (`neon.ts`) (+7 more)

### Community 85 - "Server-side rendering"
Cohesion: 0.13
Nodes (15): Contents, Create a `DbClient` per router, Define the collection, Examples, Keep row shapes identical, Keep secrets on the server, Open the connection in the browser, Render the initial rows straight away (+7 more)

### Community 88 - "neon-functions/SKILL.md"
Cohesion: 0.29
Nodes (6): Authenticating the server, MCP servers on Neon Functions, Option 1 — OAuth via the Better Auth MCP plugin (best for third-party clients), Option 2 — API key or session JWT via self-hosted Better Auth (simplest), Testing, The server

### Community 90 - "Function Triggers"
Cohesion: 0.15
Nodes (13): CLI, Delivery payload, Fields, Function Triggers, Inheritance, Local `neon dev`, Logs, MCP backup (+5 more)

### Community 95 - "Lakebase Postgres"
Cohesion: 0.15
Nodes (13): Autoscaling, Branching, Connection Pooling, Gotchas, Instant Restore, IP Allow Lists, Lakebase Postgres, Lakebase Search (+5 more)

### Community 96 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, better-sqlite3, concurrently, cross-env, drizzle-kit, electron, electron-builder, jsdom (+11 more)

### Community 103 - "Optimistic mutations"
Cohesion: 0.15
Nodes (13): Automatic management of optimistic state, Calling the routes from the frontend, Contents, How optimistic mutations work, Optimistic mutations, Render the app, Returning the `txid` from your backend, Running example (+5 more)

### Community 105 - "Subscribing to queries"
Cohesion: 0.15
Nodes (13): Contents, Debug subscriptions, Fetch from a server function, Fetch from an API endpoint, Getting the query to subscribe to, Handle errors, Listen for changes, Log client diagnostics (+5 more)

### Community 106 - "Defining queries"
Cohesion: 0.17
Nodes (12): Authorization, Contents, Defining queries, Exposing an endpoint, Exposing queries, Live authorization, Renewing sealed queries, Sealing authorized queries (+4 more)

### Community 109 - "scripts"
Cohesion: 0.08
Nodes (26): scripts, android:build, android:open, android:sync, build, db:generate, db:push, db:sqlite:push (+18 more)

### Community 118 - "Semantic Vector Search"
Cohesion: 0.18
Nodes (11): AI SDK (Recommended), Build the Index, Contents, Create the Extension, OpenAI SDK Alternative, Prepare Embeddings, Query, Semantic Vector Search (+3 more)

### Community 121 - "Neon Realtime"
Cohesion: 0.20
Nodes (10): Choose the Stack, Core Pattern, Define and Seal Queries, How It Works, More Docs, Neon Realtime, Optimistic Writes, Server-Side Rendering (+2 more)

### Community 129 - "Production hardening for Neon Functions"
Cohesion: 0.22
Nodes (9): Choose the caller shape, Function Triggers only, Limit authenticated application work, Native URL, Preserve existing clients, Production hardening for Neon Functions, Public consumers through a Worker, Reject these (+1 more)

### Community 136 - "Sentry (errors, logs, and traces)"
Cohesion: 0.20
Nodes (10): 1. Initialize before anything else, 2. Provide the DSN as a deploy-time secret, 3. Create the request span and catch route errors, 4. Errors are for failures; logs are for the story, 5. Trace the agent itself, Environment variables, Other Node integrations, Sentry error monitoring on Neon Functions (+2 more)

### Community 138 - "Mastra agents with Mastra Studio observability"
Cohesion: 0.25
Nodes (8): 1. Define the agent against the Neon AI Gateway, 2. Wire observability to Mastra Studio, 3. Structured output through the gateway, 4. Create the Mastra project + token with the CLI, 5. Pass the creds via `neon.ts` (third-party env), 6. Verify, Further reading, Mastra agents with Mastra Studio observability

### Community 140 - "Shipping native binaries with a Function"
Cohesion: 0.29
Nodes (7): `bundler: "none"`: ship a prebuilt directory, Custom `bundler`: return the file map, `externalPackages`: npm packages with a Node addon, Shipping native binaries with a Function, Size limits, Standalone executables, The runtime a binary lands on

### Community 142 - "dependencies"
Cohesion: 0.17
Nodes (12): dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, drizzle-orm, katex, lucide-react, nanoid (+4 more)

### Community 144 - "Server-sent events (SSE) on Neon Functions"
Cohesion: 0.29
Nodes (7): Caveats, Client, Minimal SSE endpoint (no framework), Push to every client, across isolates, Server-sent events (SSE) on Neon Functions, Wire format (just text), With Hono

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
- **13 isolated node(s):** `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@neon/env`, `nanoid` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 733 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `search()` connect `search` to `core.py`, `Production hardening for Neon Functions`, `test_core.py`, `BM25`, `test_core_data_quality.py`, `design_system.py`, `search_stack`, `test_core.py`, `_domain_keywords`, `_search_csv_detailed`, `_normalize`, `read_rows`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `DesignSystemGenerator` (e.g. with `TestReasoningMatch` and `TestReasoningContract`) actually correct?**
  _`DesignSystemGenerator` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@capacitor/android`, `@capacitor/cli`, `@capacitor/core` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `core.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08858858858858859 - nodes in this community are weakly interconnected._
- **Why does `react` connect `BlockItem.jsx` to `DatabaseBlock.jsx`, `package.json`, `App.jsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `validate_data.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10685249709639953 - nodes in this community are weakly interconnected._
- **Why does `search_stack()` connect `search_stack` to `core.py`, `test_core.py`, `design_system.py`, `search`, `_domain_keywords`, `_search_csv_detailed`, `_normalize`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._