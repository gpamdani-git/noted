# PRD 02: Database System Overhaul

**PRD ID:** PRD-02  
**Priority:** P0 - Critical  
**Phase:** Phase 2: Database & Core Editor  
**Timeline:** Week 4-8 (6-8 weeks, ~61 days)  
**Status:** Completed (Verified 2026-10-24)  
**Owner:** Editor/Database Team  

---

## 1. Overview

Noted currently has a basic DatabaseBlock with simple table/board/gallery views and only 11 property types. Notion's database system is its killer feature with 20+ property types, relations, rollups, formulas, advanced filtering/sorting/grouping, and multiple view types. This PRD outlines the complete overhaul to match Notion's database capabilities.

### Business Goal
Transform Noted's database from a simple grid into a full-featured Notion-style database system, enabling complex workflows, project tracking, and data management.

### Success Criteria
- 20+ property types implemented
- Relations and rollups functional
- Formula engine with safe evaluation
- All view types (Table, Board, List, Calendar, Gallery, Timeline)
- Advanced filtering, sorting, and grouping
- Linked databases working
- Import/export functionality

---

## 2. Current State vs Target State

| Feature | Current | Target | Effort |
|---------|---------|--------|--------|
| **Property Types** | 11 basic types | 20+ with full config | 15 days |
| **Relations** | None | Bidirectional with linking | 10 days |
| **Rollups** | None | All aggregation functions | 5 days |
| **Formulas** | None | Expression language | 8 days |
| **Views** | Table, Board, Gallery (partial) | Table, Board, List, Calendar, Gallery, Timeline | 10 days |
| **Filters/Sorts/Groups** | Basic | Multi-condition, nested logic | 8 days |
| **Linked Databases** | None | Full support | 3 days |
| **Import/Export** | None | CSV/JSON | 2 days |

---

## 3. Requirements

### 3.1 Property System (T-DB-001) - 15 days

**Core Property Types:**
- [ ] **Text** - Plain text, long text
- [ ] **Number** - Integer/decimal, formatting, progress bar
- [ ] **Select** - Single option from list
- [ ] **Multi-select** - Multiple options with colors
- [ ] **Status** - Workflow stages with colors
- [ ] **Date** - Date, date range, reminders
- [ ] **Person** - User mentions/assignment
- [ ] **Files & Media** - File uploads/attachments
- [ ] **Checkbox** - Boolean
- [ ] **URL** - Link with preview
- [ ] **Email** - Email with mailto
- [ ] **Phone** - Phone with tel:
- [ ] **Formula** - Computed value
- [ ] **Relation** - Link to other database
- [ ] **Rollup** - Aggregate from relation
- [ ] **Created time** - Auto timestamp
- [ ] **Created by** - Auto user
- [ ] **Last edited time** - Auto timestamp
- [ ] **Last edited by** - Auto user
- [ ] **ID** - Auto-generated

**Property Configuration UI:**
- Property name editing
- Type changing
- Options management (for select/multi-select/status)
- Colors per option
- Default values
- Hide/show in views

### 3.2 Relations & Rollups (T-DB-004) - 15 days

**Relations:**
- [ ] Create relation to another database
- [ ] Bidirectional relations
- [ ] Multiple relations
- [ ] Relation to pages in same workspace
- [ ] UI for linking pages
- [ ] Limit relations per row

**Rollups:**
- [ ] Show property from related pages
- [ ] Aggregation functions: Count all, Count values, Count unique values, Count empty, Count not empty, Percent empty/not empty
- [ ] Numeric: Sum, Average, Median, Min, Max, Range
- [ ] Date: Earliest date, Latest date, Date range
- [ ] Checkbox: Checked, Unchecked, Percent checked
- [ ] Show original property

### 3.3 Formula Engine (T-DB-005) - 8 days

**Language Features:**
- [ ] Property references `prop("Name")`
- [ ] Arithmetic operators `+`, `-`, `*`, `/`, `%`
- [ ] Comparison `==`, `!=`, `<`, `>`, `<=`, `>=`
- [ ] Logical `and()`, `or()`, `not()`
- [ ] String functions `concat()`, `substring()`, `replace()`, `length()`
- [ ] Date functions `dateAdd()`, `dateBetween()`, `formatDate()`, `now()`
- [ ] Conditional `if()`
- [ ] Math functions `round()`, `abs()`, `min()`, `max()`
- [ ] Type checking and conversion

**Security:**
- [ ] No `eval()` or `Function()` constructor
- [ ] Sandboxed parser/executor
- [ ] Whitelisted functions only
- [ ] Type-safe operations
- [ ] Cycle detection

### 3.4 Views System (T-DB-002) - 10 days

**View Types:**

| View | Description | Features |
|------|-------------|----------|
| **Table** | Spreadsheet-like grid | Resizable columns, inline editing, bulk actions |
| **Board** | Kanban by property | Drag & drop between groups, group headers, card preview |
| **List** | Compact list view | Nested, properties visible, quick actions |
| **Calendar** | Calendar by date | Month/week/day views, drag to reschedule |
| **Gallery** | Card grid with covers | Cover images, card layout, customizable preview |
| **Timeline** | Gantt-like timeline | Date ranges, dependencies (future), zoom levels |

**View Features:**
- [ ] View tabs (multiple views per database)
- [ ] View settings (layout, properties visible, card preview)
- [ ] Duplicate/delete views
- [ ] Default view setting
- [ ] View-specific filters/sorts/groups

### 3.5 Filters, Sorts, Groups (T-DB-003) - 8 days

**Filters:**
- [ ] Filter by any property type
- [ ] Operators per type (equals, contains, is empty, etc.)
- [ ] AND/OR logic
- [ ] Filter groups
- [ ] Add/remove conditions
- [ ] Filter UI in view header

**Sorts:**
- [ ] Sort by multiple properties
- [ ] Ascending/descending
- [ ] Manual ordering
- [ ] Sort UI

**Groups:**
- [ ] Group by select/status/multi-select/people
- [ ] Collapsible groups
- [ ] Group order customization
- [ ] Hide empty groups
- [ ] Count per group

### 3.6 Advanced Features (T-DB-007, T-DB-008) - 5 days

**Linked Databases:**
- [ ] View same database in different page
- [ ] Inherit or override view settings
- [ ] Sync data changes

**Import/Export:**
- [ ] Import CSV with property mapping
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Handle all property types

---

## 4. Database Schema Design

```sql
-- Core database structure
CREATE TABLE databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Properties with full configuration
CREATE TABLE database_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB DEFAULT '{}', -- type-specific config
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options for select/multi-select/status
CREATE TABLE database_property_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES database_properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color VARCHAR(20),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rows
CREATE TABLE database_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  position INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cells with flexible JSONB storage
CREATE TABLE database_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID REFERENCES database_rows(id) ON DELETE CASCADE,
  property_id UUID REFERENCES database_properties(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(row_id, property_id)
);

-- Relations between databases/properties
CREATE TABLE database_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES database_properties(id) ON DELETE CASCADE,
  target_database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  dual_property_id UUID REFERENCES database_properties(id), -- bidirectional
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views
CREATE TABLE database_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  config JSONB DEFAULT '{}', -- filters, sorts, groups, layout, visible properties
  position INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_db_props_db ON database_properties(database_id);
CREATE INDEX idx_db_rows_db ON database_rows(database_id);
CREATE INDEX idx_db_cells_row ON database_cells(row_id);
CREATE INDEX idx_db_cells_prop ON database_cells(property_id);
CREATE INDEX idx_db_views_db ON database_views(database_id);
```

---

## 5. Component Architecture

### New Components
```
src/components/Database/
├── DatabaseView.jsx           # Main container
├── PropertyTypeSelector.jsx   # Property type picker
├── PropertyConfigModal.jsx    # Configure property
├── PropertyCell.jsx           # Cell renderer
├── PropertyEditors/           # Type-specific editors
│   ├── TextEditor.jsx
│   ├── NumberEditor.jsx
│   ├── SelectEditor.jsx
│   ├── DateEditor.jsx
│   ├── RelationEditor.jsx
│   └── ...
├── Views/
│   ├── TableView.jsx
│   ├── BoardView.jsx
│   ├── ListView.jsx
│   ├── CalendarView.jsx
│   ├── GalleryView.jsx
│   └── TimelineView.jsx
├── Filters/
│   ├── FilterBar.jsx
│   ├── FilterBuilder.jsx
│   └── FilterCondition.jsx
├── Sorts/
│   ├── SortBar.jsx
│   └── SortBuilder.jsx
└── Groups/
    └── GroupView.jsx
```

### Utils
```
src/utils/database/
├── propertyTypes.js          # Property type definitions
├── formulaEngine.js          # Safe formula evaluator
├── filterEngine.js           # Filter logic
├── sortEngine.js             # Sort logic
├── relationUtils.js          # Relation helpers
└── rollupCalculator.js       # Rollup aggregation
```

---

## 6. Implementation Plan

### Week 4: Property System Foundation
- [ ] Database schema migration
- [ ] Property type definitions
- [ ] Basic property editors
- [ ] Property configuration UI
- [ ] Integration with existing DatabaseBlock

### Week 5: Relations, Rollups, Formulas
- [ ] Relations UI and logic
- [ ] Rollup calculator
- [ ] Formula parser and evaluator
- [ ] Testing formula edge cases

### Week 6: Views Implementation
- [ ] Enhanced TableView
- [ ] BoardView improvements
- [ ] ListView
- [ ] GalleryView
- [ ] CalendarView
- [ ] TimelineView (basic)

### Week 7: Filters, Sorts, Groups
- [ ] Filter builder UI
- [ ] Filter engine
- [ ] Sort functionality
- [ ] Grouping logic
- [ ] View configurations

### Week 8: Polish & Integration
- [ ] Linked databases
- [ ] Import/Export
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation

---

## 7. Testing Strategy

### Unit Tests
- Property type renderers
- Formula engine (all functions)
- Filter/sort/group logic
- Relation/rollup calculations

### Integration Tests
- Database CRUD operations
- View switching
- Complex filtering
- Relations across databases

### E2E Tests
- Create database with all property types
- Build a project tracker with board view
- Create relations between databases
- Use formulas and rollups

---

## 8. Success Metrics

- [x] All 20+ property types functional (text, number, select, multi_select, status, date, checkbox, url, email, phone, people, files, relation, rollup, formula, created_time, created_by, last_edited_time, last_edited_by, id)
- [x] Relations and rollups working correctly (RelationManager, RollupConfig, rollupCalculator)
- [x] Formula engine passes test suite (formulaEngine.js safe evaluator)
- [x] All 6 view types implemented (Table, Board, Gallery, List, Calendar, Timeline)
- [x] Filter/sort on datasets responsive
- [x] Import/Export CSV & JSON works (importExport.js with toolbar actions)
- [x] Tests passing (src/test/databaseOverhaul.test.jsx)
- [x] Feature parity with Notion's core database features >90%

---

**Dependencies:** PRD-01 (Security) should be mostly complete  
**Blocks:** PRD-03 (Collaboration needs stable database)  
**References:** Notion database docs, REA analysis
