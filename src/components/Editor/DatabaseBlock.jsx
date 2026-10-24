import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Table as TableIcon,
  Database,
  Kanban,
  LayoutGrid,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  X,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRightLeft,
  Type,
  Calendar,
  Hash,
  CheckSquare,
  Link as LinkIcon,
  Filter,
  ArrowUpDown,
  Search,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Star,
  Mail,
  Phone,
  User,
  Circle,
  Rows3,
  CalendarDays,
  Download,
  Upload,
  Calculator,
  Files
} from 'lucide-react';
import './DatabaseBlock.css';
import '../Database/DatabaseViews.css';
import { PROPERTY_TYPES as ENHANCED_PROPERTY_TYPES } from '../../utils/database/propertyTypes';
import { exportToCSV, exportToJSON, importFromCSV, downloadBlob } from '../../utils/database/importExport';
import { formulaEngine } from '../../utils/database/formulaEngine';
import { rollupCalculator } from '../../utils/database/rollupCalculator';
import RelationManager from '../Database/RelationManager';
import RollupConfig from '../Database/RollupConfig';
import FormulaEditor from '../Database/FormulaEditor';
import RelationCellPicker from '../Database/RelationCellPicker';
import CalendarView from '../Database/CalendarView';
import TimelineView from '../Database/TimelineView';
import FilterSortBar from '../Database/FilterSortBar';
import DatabaseViewTabs from '../Database/DatabaseViewTabs';
import { loadStoredPages } from '../../utils/storage';
import { getCurrentUser } from '../../utils/comments';

// Rich Column Property Types Specification
export const PROPERTY_TYPES = ENHANCED_PROPERTY_TYPES;



// Status presets with authentic Notion colors from screenshot
export const STATUS_OPTIONS = [
  { label: 'Not started', color: { bg: '#e3e2e0', text: '#37352f' } },
  { label: 'In progress', color: { bg: '#d3e5ef', text: '#183347' } },
  { label: 'Under review', color: { bg: '#e8deee', text: '#412454' } },
  { label: 'Done', color: { bg: '#dbeddb', text: '#1c3829' } },
  { label: 'Archived', color: { bg: '#e3e2e0', text: '#787774' } }
];

// Notion-style tag colors for multi-select
const TAG_COLORS = [
  { name: 'blue', bg: 'var(--color-blue-bg)', text: 'var(--color-blue)' },
  { name: 'green', bg: 'var(--color-green-bg)', text: 'var(--color-green)' },
  { name: 'orange', bg: 'var(--color-orange-bg)', text: 'var(--color-orange)' },
  { name: 'purple', bg: 'var(--color-purple-bg)', text: 'var(--color-purple)' },
  { name: 'pink', bg: 'var(--color-pink-bg)', text: 'var(--color-pink)' },
  { name: 'yellow', bg: 'var(--color-yellow-bg)', text: 'var(--color-yellow)' }
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
];

const getTagColor = (str) => {
  if (!str) return TAG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
};

const getStatusColor = (statusStr) => {
  if (!statusStr) return STATUS_OPTIONS[0].color;
  const match = STATUS_OPTIONS.find((s) => s.label.toLowerCase() === statusStr.toLowerCase());
  if (match) return match.color;
  const tagCol = getTagColor(statusStr);
  return { bg: tagCol.bg, text: tagCol.text };
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

// Dedicated reliable Date Cell Component using modern showPicker() API
const DateCell = ({ value, onChange, isLocked }) => {
  const inputRef = useRef(null);

  const handleClick = () => {
    if (isLocked) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch (err) {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const formatted = formatDateDisplay(value);

  return (
    <div className="db-cell-date-wrap" onClick={handleClick} title="Click to pick date">
      <Calendar size={13} className="db-date-icon" />
      <span className={`db-date-display ${!formatted ? 'empty' : ''}`}>
        {formatted || 'Empty date'}
      </span>
      <input
        ref={inputRef}
        type="date"
        className="db-date-native-picker"
        value={value || ''}
        readOnly={isLocked}
        disabled={isLocked}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && !isLocked && (
        <button
          type="button"
          className="db-date-clear-btn"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
          }}
          title="Clear date"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
};

export const DatabaseBlock = ({
  block,
  onUpdateBlock,
  isLocked = false,
  allPages = [],
  currentPage = null,
  allBlocks = [],
  onAddBlockBelow = null
}) => {
  const viewType = block.viewType || 'table'; // 'table' | 'board' | 'gallery'
  const headers = block.headers || ['Name', 'Status', 'Tag'];
  const rows = block.rows || [];

  // Infer or retrieve column types
  const getColType = (colIdx) => {
    if (block.columnTypes && block.columnTypes[colIdx]) {
      return block.columnTypes[colIdx];
    }
    if (colIdx === 0) return 'text';
    const name = (headers[colIdx] || '').toLowerCase();
    if (name.includes('status') || name.includes('state')) return 'status';
    if (name.includes('tag') || name.includes('label') || name.includes('category')) return 'multi_select';
    if (name.includes('date') || name.includes('due') || name.includes('deadline')) return 'date';
    if (name.includes('number') || name.includes('score') || name.includes('count') || name.includes('progress') || name.includes('amount') || name.includes('price')) return 'number';
    if (name.includes('done') || name.includes('check') || name.includes('complete') || name.includes('active')) return 'checkbox';
    if (name.includes('url') || name.includes('link') || name.includes('website')) return 'url';
    if (name.includes('email') || name.includes('mail')) return 'email';
    if (name.includes('phone') || name.includes('telephone') || name.includes('mobile')) return 'phone';
    if (name.includes('owner') || name.includes('assignee') || name.includes('person') || name.includes('people') || name.includes('author') || name.includes('member')) return 'people';
    if (name.includes('priority') || name.includes('type') || name.includes('option') || name.includes('stage')) return 'select';
    return 'text';
  };

  // Find column to group by for Kanban
  const statusColIdx = headers.findIndex((h) => h.toLowerCase() === 'status');
  const defaultGroupIdx = statusColIdx !== -1 ? statusColIdx : Math.min(headers.length - 1, 1);
  const groupByIndex = block.groupByCol !== undefined ? block.groupByCol : defaultGroupIdx;

  const dateColIdx = headers.findIndex((_, idx) => getColType(idx) === 'date');

  const workspaceDatabases = useMemo(() => {
    try {
      const list = [];
      // 1. Always include current database itself for self-relations
      list.push({
        id: block.id,
        name: block.databaseTitle || block.title || 'This database',
        pageTitle: currentPage?.title || 'Current page',
        pageIcon: currentPage?.icon || '📊',
        headers: headers,
        columnTypes: headers.map((_, i) => getColType(i)),
        rows: rows,
        isSelf: true
      });

      // 2. Scan other table blocks on the current page
      (allBlocks || []).forEach(b => {
        if (b.type === 'table' && b.id !== block.id) {
          list.push({
            id: b.id,
            name: b.databaseTitle || b.title || 'Table on this page',
            pageTitle: currentPage?.title || 'Current page',
            pageIcon: currentPage?.icon || '📊',
            headers: b.tableHeaders || b.headers || ['Name'],
            columnTypes: b.columnTypes || [],
            rows: b.rows || []
          });
        }
      });

      // 3. Scan all other pages across the workspace
      const pagesToScan = (allPages && allPages.length > 0)
        ? allPages
        : (loadStoredPages(getCurrentUser ? getCurrentUser() : null) || []);

      pagesToScan.forEach(p => {
        if (currentPage && p.id === currentPage.id) return;
        const bList = Array.isArray(p.blocks) ? p.blocks : [];
        bList.forEach(b => {
          if (b.type === 'table' && b.id !== block.id && !list.some(item => item.id === b.id)) {
            list.push({
              id: b.id,
              name: b.databaseTitle || b.title || `Database in ${p.title || 'Untitled'}`,
              pageTitle: p.title || 'Untitled',
              pageIcon: p.icon || '📄',
              headers: b.tableHeaders || b.headers || ['Name'],
              columnTypes: b.columnTypes || [],
              rows: b.rows || []
            });
          }
        });
      });

      return list;
    } catch {
      return [{
        id: block.id,
        name: block.databaseTitle || 'This database',
        pageTitle: currentPage?.title || 'Current page',
        pageIcon: '📊',
        headers: headers,
        columnTypes: headers.map((_, i) => getColType(i)),
        rows: rows,
        isSelf: true
      }];
    }
  }, [allPages, allBlocks, block.id, block.databaseTitle, headers, rows, currentPage]);

  // Local interactive UI state
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showRelationManager, setShowRelationManager] = useState(false);
  const [activeRelationCol, setActiveRelationCol] = useState(null);
  const [showRollupConfig, setShowRollupConfig] = useState(false);
  const [activeRollupCol, setActiveRollupCol] = useState(null);
  const [showFormulaEditor, setShowFormulaEditor] = useState(false);
  const [activeFormulaCol, setActiveFormulaCol] = useState(null);
  const [activeCellPicker, setActiveCellPicker] = useState(null); // { rIdx, cIdx }
  const csvFileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  // { colIdx: number, operator: string, value: string }
  const [filterConfig, setFilterConfig] = useState(block.filterConfig || null);
  // { colIdx: number, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState(block.sortConfig || null);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [activeColMenu, setActiveColMenu] = useState(null); // colIdx
  const [colMenuPos, setColMenuPos] = useState(null); // { top, left }
  const [activeStatusCell, setActiveStatusCell] = useState(null); // { rIdx: number, cIdx: number }
  const [activeSelectCell, setActiveSelectCell] = useState(null); // { rIdx: number, cIdx: number }

  const containerRef = useRef(null);

  // The filter and the sort belong to the saved view, so they are written back
  // to the block and survive a reload. The initial write is skipped because the
  // state is already seeded from the block.
  const hasPersistedViewConfig = useRef(false);
  useEffect(() => {
    if (!hasPersistedViewConfig.current) {
      hasPersistedViewConfig.current = true;
      return;
    }
    onUpdateBlock(block.id, { filterConfig, sortConfig });
  }, [filterConfig, sortConfig]);

  // Modern click-outside dismissal: Avoids full-screen click blocking overlays!
  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Do not dismiss if clicking inside a portal popover (column menu or relation picker)
      if (e?.target && typeof e.target.closest === 'function') {
        if (e.target.closest('.db-col-menu-popover') || e.target.closest('.db-modal-card')) {
          return;
        }
      }
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowFilterPopover(false);
        setShowSortPopover(false);
        setActiveColMenu(null);
        setActiveStatusCell(null);
        setShowGroupSelector(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowFilterPopover(false);
        setShowSortPopover(false);
        setActiveColMenu(null);
        setActiveStatusCell(null);
        setShowGroupSelector(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dismiss floating column menu on outer scroll only (preserve inner popover scrolling)
  useEffect(() => {
    if (activeColMenu === null) return;
    const handleScroll = (e) => {
      // Do not dismiss when scrolling inside the property options list or popover
      if (e?.target && typeof e.target.closest === 'function') {
        if (e.target.closest('.db-col-menu-popover')) {
          return;
        }
      }
      setActiveColMenu(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [activeColMenu]);

  const setViewType = (type) => {
    onUpdateBlock(block.id, { viewType: type });
  };

  const setGroupByCol = (colIdx) => {
    if (isLocked) return;
    onUpdateBlock(block.id, { groupByCol: colIdx });
    setShowGroupSelector(false);
  };

  // --- Row & Cell Operations ---
  const handleTableCellChange = (rIdx, cIdx, val) => {
    if (isLocked) return;
    const newRows = rows.map((r, ri) =>
      ri === rIdx ? r.map((c, ci) => (ci === cIdx ? val : c)) : r
    );
    onUpdateBlock(block.id, { rows: newRows });
  };

  const handleTableHeaderChange = (cIdx, val) => {
    if (isLocked) return;
    const newHeaders = headers.map((h, ci) => (ci === cIdx ? val : h));
    onUpdateBlock(block.id, { headers: newHeaders });
  };

  const handleUpdateColumnType = (cIdx, newType) => {
    if (isLocked) return;
    const currentTypes = headers.map((_, idx) => getColType(idx));
    currentTypes[cIdx] = newType;
    onUpdateBlock(block.id, { columnTypes: currentTypes });
    setActiveColMenu(null);
    if (newType === 'relation') {
      setActiveRelationCol(cIdx);
      setShowRelationManager(true);
    } else if (newType === 'rollup') {
      setActiveRollupCol(cIdx);
      setShowRollupConfig(true);
    } else if (newType === 'formula') {
      setActiveFormulaCol(cIdx);
      setShowFormulaEditor(true);
    }
  };

  // REA NOTION BEHAVIOR:
  // When adding a new item, ensure it satisfies active filters so it is NEVER hidden!
  const handleAddRow = (initialValues = null) => {
    if (isLocked) return;
    const newRow = headers.map((h, i) => (initialValues && initialValues[i] !== undefined ? initialValues[i] : ''));
    if (!initialValues || !initialValues[0]) {
      newRow[0] = `New Item ${rows.length + 1}`;
    }

    // Auto-inherit active filter value so new row is immediately visible
    if (filterConfig && filterConfig.colIdx !== null && filterConfig.colIdx !== undefined) {
      const { colIdx, operator, value } = filterConfig;
      if (value && (operator === 'equals' || operator === 'contains')) {
        newRow[colIdx] = value;
      }
    }

    // Clear search query if it would hide the newly added item
    if (searchQuery.trim()) {
      setSearchQuery('');
    }

    // Dismiss any active popovers
    setShowFilterPopover(false);
    setShowSortPopover(false);
    setActiveColMenu(null);
    setActiveStatusCell(null);

    onUpdateBlock(block.id, { rows: [...rows, newRow] });
  };

  const handleDeleteRow = (rIdx) => {
    if (isLocked) return;
    const newRows = rows.filter((_, idx) => idx !== rIdx);
    onUpdateBlock(block.id, { rows: newRows });
    if (selectedRowIndex === rIdx) setSelectedRowIndex(null);
  };

  const handleAddColumn = (type = 'text') => {
    if (isLocked) return;
    const colNum = headers.length + 1;
    const newHeaders = [...headers, `Property ${colNum}`];
    const newRows = rows.map((row) => [...row, '']);
    const currentTypes = headers.map((_, idx) => getColType(idx));
    const newTypes = [...currentTypes, type];
    onUpdateBlock(block.id, { headers: newHeaders, rows: newRows, columnTypes: newTypes });
  };

  const handleDeleteColumn = (cIdx) => {
    if (isLocked || cIdx === 0) return;
    const newHeaders = headers.filter((_, idx) => idx !== cIdx);
    const newRows = rows.map((row) => row.filter((_, idx) => idx !== cIdx));
    const currentTypes = headers.map((_, idx) => getColType(idx));
    const newTypes = currentTypes.filter((_, idx) => idx !== cIdx);
    onUpdateBlock(block.id, { headers: newHeaders, rows: newRows, columnTypes: newTypes });
    setActiveColMenu(null);
  };

  // --- Kanban Operations ---
  const existingGroups = Array.from(
    new Set(rows.map((r) => (r[groupByIndex] || 'Unassigned').trim()))
  ).filter(Boolean);

  // Groups that were added by hand and have no rows yet
  const customGroups = Array.isArray(block.groups) ? block.groups : [];

  const kanbanColumns = Array.from(new Set([
    ...(existingGroups.length > 0 ? existingGroups : ['To Do', 'In Progress', 'Completed']),
    ...customGroups
  ]));

  const handleMoveCard = (rIdx, targetColumn) => {
    if (isLocked) return;
    const newRows = rows.map((r, idx) => {
      if (idx === rIdx) {
        const updated = [...r];
        updated[groupByIndex] = targetColumn;
        return updated;
      }
      return r;
    });
    onUpdateBlock(block.id, { rows: newRows });
  };

  const handleAddCardToColumn = (columnName) => {
    if (isLocked) return;
    const initial = headers.map(() => '');
    initial[groupByIndex] = columnName;
    handleAddRow(initial);
  };

  const handleAddKanbanColumn = () => {
    if (isLocked) return;
    const newColName = prompt('Enter new column group name:');
    if (!newColName || !newColName.trim()) return;
    const name = newColName.trim();
    if (kanbanColumns.some((c) => c.toLowerCase() === name.toLowerCase())) return;
    onUpdateBlock(block.id, { groups: [...customGroups, name] });
  };

  // --- Processing Pipeline: Search, Filter & Sort with Original Index Preservation ---
  const indexedRows = useMemo(() => {
    return rows.map((row, originalIndex) => ({ row, originalIndex }));
  }, [rows]);

  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return indexedRows;
    const q = searchQuery.toLowerCase().trim();
    return indexedRows.filter(({ row }) =>
      row.some((cell) => cell && String(cell).toLowerCase().includes(q))
    );
  }, [indexedRows, searchQuery]);

  const filteredRows = useMemo(() => {
    if (!filterConfig || filterConfig.colIdx === null || filterConfig.colIdx === undefined) {
      return searchedRows;
    }
    const { colIdx, operator, value } = filterConfig;
    const targetVal = (value || '').toLowerCase().trim();

    return searchedRows.filter(({ row }) => {
      const raw = row[colIdx];
      const cellStr = (raw !== undefined && raw !== null ? String(raw) : '').toLowerCase().trim();

      switch (operator) {
        case 'contains':
          return cellStr.includes(targetVal);
        case 'equals':
          return cellStr === targetVal;
        case 'not_equals':
          return cellStr !== targetVal;
        case 'is_empty':
          return cellStr === '';
        case 'is_not_empty':
          return cellStr !== '';
        default:
          return true;
      }
    });
  }, [searchedRows, filterConfig]);

  const processedRows = useMemo(() => {
    if (!sortConfig || sortConfig.colIdx === null || sortConfig.colIdx === undefined) {
      return filteredRows;
    }
    const { colIdx, direction } = sortConfig;
    const colType = getColType(colIdx);

    return [...filteredRows].sort((a, b) => {
      const valA = a.row[colIdx] || '';
      const valB = b.row[colIdx] || '';

      let cmp = 0;
      if (colType === 'number') {
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
        cmp = numA - numB;
      } else if (colType === 'checkbox') {
        const boolA = valA === 'true' || valA === '1' || valA === 'yes' ? 1 : 0;
        const boolB = valB === 'true' || valB === '1' || valB === 'yes' ? 1 : 0;
        cmp = boolA - boolB;
      } else if (colType === 'date') {
        const dateA = new Date(valA).getTime() || 0;
        const dateB = new Date(valB).getTime() || 0;
        cmp = dateA - dateB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }

      return direction === 'desc' ? -cmp : cmp;
    });
  }, [filteredRows, sortConfig, headers, block.columnTypes]);

  // --- Calendar View ---
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // The first date column of the table feeds the calendar
  const calendarDateColumnIndex = useMemo(() => {
    const idx = headers.findIndex((_, i) => i > 0 && getColType(i) === 'date');
    return idx;
  }, [headers, block.columnTypes]);

  const shiftMonth = (date, delta) =>
    new Date(date.getFullYear(), date.getMonth() + delta, 1);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // The week starts on Monday
    const leading = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - leading);
    const todayKey = new Date().toDateString();

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const key = date.toDateString();

      const events =
        calendarDateColumnIndex === -1
          ? []
          : processedRows
              .filter(({ row }) => {
                const raw = row[calendarDateColumnIndex];
                if (!raw) return false;
                const parsed = new Date(raw);
                return !isNaN(parsed.getTime()) && parsed.toDateString() === key;
              })
              .map(({ row, originalIndex }) => ({
                originalIndex,
                title: row[0] || 'Untitled'
              }));

      cells.push({
        key,
        day: date.getDate(),
        isToday: key === todayKey,
        isOutside: date.getMonth() !== month,
        events
      });
    }
    return cells;
  }, [calendarMonth, processedRows, calendarDateColumnIndex]);

  // The values that are already in use in a column are the options of a
  // single select, so the picker offers what the workspace really uses.
  const getSelectOptions = (colIdx) => {
    const values = new Set();
    for (const row of rows) {
      const raw = (row[colIdx] || '').toString().trim();
      if (raw) raw.split(',').forEach((v) => values.add(v.trim()));
    }
    return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b));
  };

  // --- Rich Cell Content Renderer ---
  const renderCellContent = (originalIndex, cIdx, cellValue) => {
    const colType = getColType(cIdx);
    const currentRow = rows[originalIndex] || [];
    const isTitle = cIdx === 0;

    if (isTitle) {
      return (
        <div className="db-cell-title-wrap">
          <input
            type="text"
            className="db-cell-input db-title-input"
            value={cellValue || ''}
            placeholder="Untitled"
            readOnly={isLocked}
            disabled={isLocked}
            onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
          />
          <button
            type="button"
            className="db-open-peek-btn"
            onClick={() => setSelectedRowIndex(originalIndex)}
            title="Open page details"
          >
            <Maximize2 size={11} />
            <span>OPEN</span>
          </button>
        </div>
      );
    }

    switch (colType) {
      case 'status': {
        const currentVal = cellValue || 'Not Started';
        const statusColor = getStatusColor(currentVal);
        const isPickerOpen =
          activeStatusCell &&
          activeStatusCell.rIdx === originalIndex &&
          activeStatusCell.cIdx === cIdx;

        return (
          <div className="db-cell-status-wrap">
            <button
              type="button"
              className="db-status-pill-btn"
              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) {
                  setActiveStatusCell(isPickerOpen ? null : { rIdx: originalIndex, cIdx });
                }
              }}
            >
              <span className="db-status-dot-circle">●</span>
              <span>{currentVal}</span>
            </button>

            {isPickerOpen && !isLocked && (
              <div
                className="db-status-picker-dropdown animate-popover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="db-popover-title">Select Status</div>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className="db-status-option"
                    onClick={() => {
                      handleTableCellChange(originalIndex, cIdx, opt.label);
                      setActiveStatusCell(null);
                    }}
                  >
                    <span
                      className="db-status-dot"
                      style={{ backgroundColor: opt.color.text }}
                    />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'multi_select': {
        const tags = (cellValue || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        return (
          <div className="db-cell-tags-wrap">
            <div className="db-tags-list">
              {tags.map((tag, tIdx) => {
                const tagColor = getTagColor(tag);
                return (
                  <span
                    key={tIdx}
                    className="db-tag-pill"
                    style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
            <input
              type="text"
              className={`db-cell-input ${tags.length > 0 ? 'hidden-until-focus' : ''}`}
              value={cellValue || ''}
              placeholder={tags.length === 0 ? 'Add tags (comma separated)...' : ''}
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
          </div>
        );
      }

      case 'date': {
        return (
          <DateCell
            value={cellValue}
            onChange={(val) => handleTableCellChange(originalIndex, cIdx, val)}
            isLocked={isLocked}
          />
        );
      }

      case 'number': {
        const numVal = parseFloat(cellValue);
        const isPercent = !isNaN(numVal) && numVal >= 0 && numVal <= 100;
        return (
          <div className="db-cell-number-wrap">
            <input
              type="number"
              className="db-cell-input db-number-input"
              value={cellValue || ''}
              placeholder="0"
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
            {isPercent && (
              <div className="db-mini-progress-bar" title={`${numVal}%`}>
                <div
                  className="db-mini-progress-fill"
                  style={{ width: `${numVal}%` }}
                />
              </div>
            )}
          </div>
        );
      }

      case 'checkbox': {
        const isChecked = cellValue === 'true' || cellValue === '1' || cellValue === 'yes';
        return (
          <div className="db-cell-checkbox-wrap">
            <button
              type="button"
              className={`db-checkbox-btn ${isChecked ? 'checked' : ''}`}
              disabled={isLocked}
              onClick={() => handleTableCellChange(originalIndex, cIdx, isChecked ? '' : 'true')}
              title={isChecked ? 'Checked' : 'Unchecked'}
            >
              {isChecked && <CheckSquare size={14} className="db-check-icon" />}
            </button>
          </div>
        );
      }

      case 'url': {
        const isValidUrl =
          cellValue &&
          (cellValue.startsWith('http://') || cellValue.startsWith('https://') || cellValue.includes('.'));
        const targetHref = cellValue && !cellValue.startsWith('http') ? `https://${cellValue}` : cellValue;
        return (
          <div className="db-cell-url-wrap">
            <LinkIcon size={12} className="db-url-icon" />
            <input
              type="text"
              className="db-cell-input db-url-input"
              value={cellValue || ''}
              placeholder="https://..."
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
            {isValidUrl && (
              <a
                href={targetHref}
                target="_blank"
                rel="noopener noreferrer"
                className="db-url-external-link"
                title="Open link in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        );
      }

      case 'select': {
        const selectOptions = getSelectOptions(cIdx);
        const currentVal = cellValue || '';
        const isPickerOpen =
          activeSelectCell &&
          activeSelectCell.rIdx === originalIndex &&
          activeSelectCell.cIdx === cIdx;
        const selectColor = currentVal ? getTagColor(currentVal) : null;

        return (
          <div className="db-cell-select-wrap">
            {currentVal ? (
              <button
                type="button"
                className="db-select-pill-btn"
                style={{ backgroundColor: selectColor.bg, color: selectColor.text }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) {
                    setActiveSelectCell(isPickerOpen ? null : { rIdx: originalIndex, cIdx });
                  }
                }}
                title="Change the value"
              >
                <span>{currentVal}</span>
              </button>
            ) : (
              <input
                type="text"
                className="db-cell-input"
                value=""
                placeholder="Empty"
                readOnly
                disabled={isLocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLocked) setActiveSelectCell({ rIdx: originalIndex, cIdx });
                }}
              />
            )}

            {isPickerOpen && !isLocked && (
              <div
                className="db-select-picker-dropdown animate-popover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="db-popover-title">Select a value</div>
                {selectOptions.map((opt) => {
                  const optColor = getTagColor(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      className="db-select-option"
                      onClick={() => {
                        handleTableCellChange(originalIndex, cIdx, opt);
                        setActiveSelectCell(null);
                      }}
                    >
                      <span
                        className="db-select-option-dot"
                        style={{ backgroundColor: optColor.text }}
                      />
                      <span>{opt}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="db-select-option db-select-option-clear"
                  onClick={() => {
                    handleTableCellChange(originalIndex, cIdx, '');
                    setActiveSelectCell(null);
                  }}
                >
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'email': {
        const mailHref = cellValue ? `mailto:${cellValue}` : null;
        return (
          <div className="db-cell-url-wrap">
            <Mail size={12} className="db-url-icon" />
            <input
              type="email"
              className="db-cell-input db-url-input"
              value={cellValue || ''}
              placeholder="name@example.com"
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
            {mailHref && (
              <a
                href={mailHref}
                className="db-url-external-link"
                title="Write an email"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail size={12} />
              </a>
            )}
          </div>
        );
      }

      case 'phone': {
        const telHref = cellValue ? `tel:${String(cellValue).replace(/\s+/g, '')}` : null;
        return (
          <div className="db-cell-url-wrap">
            <Phone size={12} className="db-url-icon" />
            <input
              type="tel"
              className="db-cell-input db-url-input"
              value={cellValue || ''}
              placeholder="+62 ..."
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
            {telHref && (
              <a
                href={telHref}
                className="db-url-external-link"
                title="Call this number"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={12} />
              </a>
            )}
          </div>
        );
      }

      case 'people': {
        const people = (cellValue || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);

        return (
          <div className="db-cell-tags-wrap">
            <div className="db-tags-list">
              {people.map((person, pIdx) => (
                <span key={pIdx} className="db-person-pill">
                  <span className="db-person-avatar">{person[0].toUpperCase()}</span>
                  <span className="db-person-name">{person}</span>
                </span>
              ))}
            </div>
            <input
              type="text"
              className={`db-cell-input ${people.length > 0 ? 'hidden-until-focus' : ''}`}
              value={cellValue || ''}
              placeholder={people.length === 0 ? 'Add people (comma separated)...' : ''}
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
          </div>
        );
      }

      case 'formula': {
        const formulaExpr = block.columnConfigs?.[cIdx]?.formula || (String(cellValue || '').startsWith('=') ? String(cellValue).slice(1) : cellValue);
        let evaluated = null;
        if (formulaExpr) {
          const currentRow = rows[originalIndex] || [];
          const rowData = {};
          headers.forEach((h, hIdx) => {
            rowData[h] = currentRow[hIdx];
          });
          const properties = headers.map((h) => ({ name: h }));
          evaluated = formulaEngine.evaluate(formulaExpr, rowData, properties);
        }
        return (
          <div
            className="db-cell-formula-wrap flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded"
            onClick={() => {
              if (!isLocked) {
                setActiveFormulaCol(cIdx);
                setShowFormulaEditor(true);
              }
            }}
            title="Click to edit formula"
          >
            <span className="font-mono text-xs text-gray-700 dark:text-gray-200 truncate">
              {evaluated !== null && evaluated !== undefined ? String(evaluated) : (formulaExpr ? '#ERROR' : 'fx Set formula')}
            </span>
            <Calculator size={11} className="text-gray-400 ml-1 shrink-0" />
          </div>
        );
      }

      case 'relation': {
        const relationCfg = block.columnConfigs?.[cIdx]?.relation;
        const targetDb = workspaceDatabases.find(d => d.id === relationCfg?.targetDatabaseId);

        let linkedItems = [];
        try {
          if (Array.isArray(cellValue)) {
            linkedItems = cellValue;
          } else if (cellValue && typeof cellValue === 'string') {
            linkedItems = cellValue.startsWith('[') ? JSON.parse(cellValue) : [cellValue];
          }
        } catch {
          if (cellValue) linkedItems = [String(cellValue)];
        }
        if (!Array.isArray(linkedItems)) linkedItems = [];

        const isPickerOpen = activeCellPicker?.rIdx === originalIndex && activeCellPicker?.cIdx === cIdx;

        return (
          <div
            className="db-cell-relation-wrap"
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', minHeight: 28, padding: '2px 4px' }}
          >
            {linkedItems.map((item, itemIdx) => (
              <span
                key={itemIdx}
                className="relation-chip-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'var(--bg-secondary, #f1f1ef)',
                  border: '1px solid var(--border-color, rgba(55,53,47,0.08))',
                  fontSize: 11.5,
                  color: 'var(--text-primary, #37352f)'
                }}
              >
                <LinkIcon size={10} color="var(--accent, #2383e2)" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                {!isLocked && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: 'var(--text-tertiary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = linkedItems.filter((_, idx) => idx !== itemIdx);
                      handleTableCellChange(originalIndex, cIdx, JSON.stringify(updated));
                    }}
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}

            {!isLocked && (
              <button
                type="button"
                className="db-relation-add-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--accent, #2383e2)',
                  fontSize: 11.5,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!relationCfg?.targetDatabaseId) {
                    setActiveRelationCol(cIdx);
                    setShowRelationManager(true);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActiveCellPicker(isPickerOpen ? null : { rIdx: originalIndex, cIdx, triggerRect: rect });
                  }
                }}
                title={relationCfg?.targetDatabaseId ? "Add linked item" : "Configure relation"}
              >
                <Plus size={11} />
                {linkedItems.length === 0 && <span>Link item</span>}
              </button>
            )}

            {isPickerOpen && targetDb && (
              <RelationCellPicker
                targetDatabase={targetDb}
                selectedItems={linkedItems}
                triggerRect={activeCellPicker?.triggerRect}
                onToggleItem={(itemTitle) => {
                  const exists = linkedItems.includes(itemTitle);
                  const updated = exists
                    ? linkedItems.filter(t => t !== itemTitle)
                    : [...linkedItems, itemTitle];
                  handleTableCellChange(originalIndex, cIdx, JSON.stringify(updated));
                }}
                onClose={() => setActiveCellPicker(null)}
              />
            )}
          </div>
        );
      }

      case 'rollup': {
        const rollupCfg = block.columnConfigs?.[cIdx] || {};
        let calculatedValue = null;

        if (rollupCfg.relationId && rollupCfg.targetProperty && rollupCfg.functionType) {
          const relColIdx = headers.findIndex(h => h === rollupCfg.relationId);
          if (relColIdx >= 0) {
            const relConfig = block.columnConfigs?.[relColIdx]?.relation;
            const targetDb = workspaceDatabases.find(d => d.id === relConfig?.targetDatabaseId);
            if (targetDb) {
              const cellRaw = currentRow[relColIdx];
              let linkedTitles = [];
              try {
                if (Array.isArray(cellRaw)) {
                  linkedTitles = cellRaw;
                } else if (cellRaw && typeof cellRaw === 'string') {
                  linkedTitles = cellRaw.startsWith('[') ? JSON.parse(cellRaw) : [cellRaw];
                }
              } catch {
                if (cellRaw) linkedTitles = [String(cellRaw)];
              }
              if (!Array.isArray(linkedTitles) && cellRaw) linkedTitles = [String(cellRaw)];

              const targetPropIdx = targetDb.headers.findIndex(h => h === rollupCfg.targetProperty);
              const relatedPages = targetDb.rows
                .filter(tr => linkedTitles.includes(tr[0]))
                .map(tr => ({
                  properties: {
                    [rollupCfg.targetProperty]: tr[targetPropIdx] !== undefined ? tr[targetPropIdx] : null
                  }
                }));

              if (relatedPages.length > 0) {
                calculatedValue = rollupCalculator.calculate(
                  relatedPages,
                  { name: rollupCfg.targetProperty },
                  rollupCfg.functionType
                );
              } else if (rollupCfg.functionType === 'count_all') {
                calculatedValue = 0;
              }
            }
          }
        }

        return (
          <div
            className="db-cell-rollup-wrap"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', cursor: 'pointer' }}
            onClick={() => {
              if (!isLocked) {
                setActiveRollupCol(cIdx);
                setShowRollupConfig(true);
              }
            }}
            title="Click to configure rollup"
          >
            <span style={{ fontSize: 12, color: calculatedValue !== null ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {calculatedValue !== null
                ? String(calculatedValue)
                : (rollupCfg.functionType ? '0' : 'Configure rollup')}
            </span>
            <Calculator size={11} color="var(--text-tertiary)" />
          </div>
        );
      }

      case 'created_time':
        return (
          <div className="text-xs text-gray-500 px-2 py-1 select-none">
            {block.createdAt ? new Date(block.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </div>
        );

      case 'created_by':
        return (
          <div className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 select-none flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">U</span>
            <span>User</span>
          </div>
        );

      case 'last_edited_time':
        return (
          <div className="text-xs text-gray-500 px-2 py-1 select-none">
            {block.updatedAt ? new Date(block.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </div>
        );

      case 'last_edited_by':
        return (
          <div className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 select-none flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">U</span>
            <span>User</span>
          </div>
        );

      case 'id':
        return (
          <div className="text-xs font-mono text-gray-400 px-2 py-1 select-none">
            #{originalIndex + 1}
          </div>
        );

      case 'files':
        return (
          <div className="db-cell-files-wrap flex items-center gap-1 px-2 py-1 text-xs text-gray-500">
            <Files size={12} className="text-gray-400 shrink-0" />
            <input
              type="text"
              className="db-cell-input text-xs"
              placeholder="Attach link or file..."
              value={cellValue || ''}
              readOnly={isLocked}
              disabled={isLocked}
              onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            className="db-cell-input"
            value={cellValue || ''}
            placeholder="Empty"
            readOnly={isLocked}
            disabled={isLocked}
            onChange={(e) => handleTableCellChange(originalIndex, cIdx, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="database-block-wrapper" ref={containerRef}>
      {/* Database Toolbar */}
      <div className="database-view-header">
        <div className="database-view-tabs">
          <button
            className={`db-tab-btn ${viewType === 'board' ? 'active' : ''}`}
            onClick={() => setViewType('board')}
            title={`Grouped by ${headers[groupByIndex] || 'Status'} (Board view)`}
          >
            <Kanban size={13} />
            <span>By {headers[groupByIndex] || 'Status'}</span>
          </button>
          <button
            className={`db-tab-btn ${viewType === 'table' ? 'active' : ''}`}
            onClick={() => setViewType('table')}
            title="All rows (Table view)"
          >
            <Star size={13} className="db-tab-star-icon" />
            <span>Table</span>
          </button>
          <button
            className={`db-tab-btn ${viewType === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewType('gallery')}
            title="Cover layout (Gallery view)"
          >
            <Calendar size={13} />
            <span>Gallery</span>
          </button>
          <button
            className={`db-tab-btn ${viewType === 'list' ? 'active' : ''}`}
            onClick={() => setViewType('list')}
            title="Compact list (List view)"
          >
            <Rows3 size={13} />
            <span>List</span>
          </button>
          <button
            className={`db-tab-btn ${viewType === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewType('calendar')}
            title="Months and deadlines (Calendar view)"
          >
            <CalendarDays size={13} />
            <span>Calendar</span>
          </button>
          <button
            className={`db-tab-btn ${viewType === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewType('timeline')}
            title="Gantt and deadlines (Timeline view)"
          >
            <Clock size={13} />
            <span>Timeline</span>
          </button>
        </div>

        {/* Database Search, Filter & Sort Controls */}
        <div className="database-view-actions">
          {/* Quick Search Bar */}
          <div className="db-search-wrap">
            <Search size={13} className="db-search-icon" />
            <input
              type="text"
              className="db-search-input"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="db-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="db-popover-anchor">
            <button
              type="button"
              className={`db-action-btn ${filterConfig ? 'active-filter' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPopover(!showFilterPopover);
                setShowSortPopover(false);
                setActiveColMenu(null);
              }}
              title="Filter items"
            >
              <Filter size={13} />
              <span>{filterConfig ? `${headers[filterConfig.colIdx] || 'Filter'}` : 'Filter'}</span>
              {filterConfig && (
                <span
                  className="db-action-clear-inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterConfig(null);
                  }}
                  title="Remove filter"
                >
                  <X size={11} />
                </span>
              )}
            </button>

            {showFilterPopover && (
              <div
                className="db-filter-popover animate-popover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="db-popover-title">Filter by Property</div>
                <div className="db-popover-field">
                  <label>Column</label>
                  <select
                    className="db-popover-select"
                    value={filterConfig?.colIdx ?? Math.min(1, headers.length - 1)}
                    onChange={(e) => {
                      const colIdx = parseInt(e.target.value, 10);
                      setFilterConfig((prev) => ({
                        colIdx,
                        operator: prev?.operator || 'contains',
                        value: prev?.value || ''
                      }));
                    }}
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="db-popover-field">
                  <label>Operator</label>
                  <select
                    className="db-popover-select"
                    value={filterConfig?.operator || 'contains'}
                    onChange={(e) => {
                      const operator = e.target.value;
                      setFilterConfig((prev) => ({
                        colIdx: prev?.colIdx ?? Math.min(1, headers.length - 1),
                        operator,
                        value: prev?.value || ''
                      }));
                    }}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does not equal</option>
                    <option value="is_empty">Is empty</option>
                    <option value="is_not_empty">Is not empty</option>
                  </select>
                </div>

                {(!filterConfig || (filterConfig.operator !== 'is_empty' && filterConfig.operator !== 'is_not_empty')) && (
                  <div className="db-popover-field">
                    <label>Value</label>
                    <input
                      type="text"
                      className="db-popover-input"
                      placeholder="Type filter value..."
                      value={filterConfig?.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilterConfig((prev) => ({
                          colIdx: prev?.colIdx ?? Math.min(1, headers.length - 1),
                          operator: prev?.operator || 'contains',
                          value
                        }));
                      }}
                    />
                  </div>
                )}

                <div className="db-popover-actions">
                  <button
                    type="button"
                    className="db-popover-btn-clear"
                    onClick={() => {
                      setFilterConfig(null);
                      setShowFilterPopover(false);
                    }}
                  >
                    Clear Filter
                  </button>
                  <button
                    type="button"
                    className="db-popover-btn-apply"
                    onClick={() => setShowFilterPopover(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Popover Button */}
          <div className="db-popover-anchor">
            <button
              type="button"
              className={`db-action-btn ${sortConfig ? 'active-sort' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowSortPopover(!showSortPopover);
                setShowFilterPopover(false);
                setActiveColMenu(null);
              }}
              title="Sort items"
            >
              <ArrowUpDown size={13} />
              <span>
                {sortConfig
                  ? `${headers[sortConfig.colIdx] || 'Sort'} (${sortConfig.direction === 'asc' ? '↑' : '↓'})`
                  : 'Sort'}
              </span>
              {sortConfig && (
                <span
                  className="db-action-clear-inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortConfig(null);
                  }}
                  title="Remove sort"
                >
                  <X size={11} />
                </span>
              )}
            </button>

            {showSortPopover && (
              <div
                className="db-sort-popover animate-popover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="db-popover-title">Sort by Property</div>
                <div className="db-popover-field">
                  <label>Column</label>
                  <select
                    className="db-popover-select"
                    value={sortConfig?.colIdx ?? 0}
                    onChange={(e) => {
                      const colIdx = parseInt(e.target.value, 10);
                      setSortConfig((prev) => ({
                        colIdx,
                        direction: prev?.direction || 'asc'
                      }));
                    }}
                  >
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="db-popover-field">
                  <label>Direction</label>
                  <div className="db-sort-dir-toggle">
                    <button
                      type="button"
                      className={`db-dir-btn ${(sortConfig?.direction || 'asc') === 'asc' ? 'active' : ''}`}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          colIdx: prev?.colIdx ?? 0,
                          direction: 'asc'
                        }))
                      }
                    >
                      <ArrowUp size={12} />
                      <span>Ascending</span>
                    </button>
                    <button
                      type="button"
                      className={`db-dir-btn ${sortConfig?.direction === 'desc' ? 'active' : ''}`}
                      onClick={() =>
                        setSortConfig((prev) => ({
                          colIdx: prev?.colIdx ?? 0,
                          direction: 'desc'
                        }))
                      }
                    >
                      <ArrowDown size={12} />
                      <span>Descending</span>
                    </button>
                  </div>
                </div>

                <div className="db-popover-actions">
                  <button
                    type="button"
                    className="db-popover-btn-clear"
                    onClick={() => {
                      setSortConfig(null);
                      setShowSortPopover(false);
                    }}
                  >
                    Clear Sort
                  </button>
                  <button
                    type="button"
                    className="db-popover-btn-apply"
                    onClick={() => setShowSortPopover(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Group By selector (for Board view) */}
          {viewType === 'board' && (
            <div className="db-group-by-wrapper">
              <span className="db-action-label">Group by:</span>
              <button
                type="button"
                className="db-group-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGroupSelector(!showGroupSelector);
                }}
              >
                <span>{headers[groupByIndex] || 'Column'}</span>
                <ChevronDown size={12} />
              </button>
              {showGroupSelector && (
                <div
                  className="db-dropdown-menu animate-popover"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="db-dropdown-title">Group by Column</div>
                  {headers.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`db-dropdown-item ${groupByIndex === i ? 'active' : ''}`}
                      onClick={() => setGroupByCol(i)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import / Export Actions */}
          <div className="db-import-export-wrap" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="file"
              ref={csvFileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const text = event.target?.result;
                  if (typeof text === 'string') {
                    const { headers: importedHeaders, rows: importedRows } = importFromCSV(text);
                    if (importedHeaders && importedHeaders.length > 0) {
                      onUpdateBlock(block.id, {
                        headers: importedHeaders,
                        rows: importedRows,
                        columnTypes: importedHeaders.map((_, i) => block.columnTypes?.[i] || 'text')
                      });
                    }
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="db-action-btn"
              title="Export as CSV"
              onClick={() => {
                const blob = exportToCSV(headers, rows);
                downloadBlob(blob, `${(block.title || 'database').replace(/\s+/g, '_')}.csv`);
              }}
            >
              <Download size={13} />
              <span>Export</span>
            </button>
            {!isLocked && (
              <button
                type="button"
                className="db-action-btn"
                title="Import CSV into table"
                onClick={() => csvFileInputRef.current?.click()}
              >
                <Upload size={13} />
                <span>Import</span>
              </button>
            )}
          </div>

          {/* New Item primary action */}
          {!isLocked && (
            <button
              type="button"
              className="db-add-btn"
              onClick={() => handleAddRow()}
              title="Add a new row (preserves active filters)"
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. TABLE VIEW */}
      {viewType === 'table' && (
        <div className="db-table-view">
          <div className="db-table-scroll">
            <table className="db-table">
              <thead>
                <tr>
                  {headers.map((header, cIdx) => {
                    const colType = getColType(cIdx);
                    const typeObj = PROPERTY_TYPES.find((t) => t.id === colType) || PROPERTY_TYPES[0];
                    const PropIcon = typeObj.icon;
                    const isMenuOpen = activeColMenu === cIdx;

                    return (
                      <th key={cIdx} className="db-th">
                        <div className="db-th-content">
                          <span className="db-th-type-icon" title={`Type: ${typeObj.label}`}>
                            <PropIcon size={12} />
                          </span>
                          <input
                            type="text"
                            className="db-th-input"
                            value={header}
                            readOnly={isLocked}
                            disabled={isLocked}
                            onChange={(e) => handleTableHeaderChange(cIdx, e.target.value)}
                          />
                          {!isLocked && (
                            <button
                              type="button"
                              className={`db-th-menu-trigger ${isMenuOpen ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const popoverWidth = 260;
                                const popoverHeight = 380;
                                const left = Math.max(12, Math.min(rect.left, window.innerWidth - popoverWidth - 12));
                                const top = (rect.bottom + popoverHeight > window.innerHeight)
                                  ? Math.max(10, rect.top - popoverHeight)
                                  : rect.bottom + 4;
                                setColMenuPos({ top, left });
                                setActiveColMenu(isMenuOpen ? null : cIdx);
                                setShowFilterPopover(false);
                                setShowSortPopover(false);
                              }}
                              title="Property settings & type"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          )}
                        </div>

                        {/* Column Configuration Popover rendered via Portal to avoid CSS transform clipping */}
                        {isMenuOpen && !isLocked && colMenuPos && typeof document !== 'undefined' && createPortal(
                          <div
                            className="db-col-menu-popover animate-popover"
                            style={{
                              position: 'fixed',
                              top: colMenuPos.top,
                              left: colMenuPos.left,
                              zIndex: 1300,
                              maxHeight: '80vh',
                              overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                          >
                            <div className="db-col-menu-section">
                              <div className="db-popover-title">Property Name</div>
                              <input
                                type="text"
                                className="db-col-menu-name-input"
                                value={header}
                                onChange={(e) => handleTableHeaderChange(cIdx, e.target.value)}
                              />
                            </div>

                            <div className="db-col-menu-section">
                              <div className="db-popover-title">Property Type</div>
                              <div className="db-type-options-list">
                                {PROPERTY_TYPES.map((t) => {
                                  const IconComponent = t.icon;
                                  const isSelected = colType === t.id;
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      className={`db-type-option-item ${isSelected ? 'selected' : ''}`}
                                      onClick={() => handleUpdateColumnType(cIdx, t.id)}
                                    >
                                      <IconComponent size={13} className="db-type-option-icon" />
                                      <div className="db-type-option-text">
                                        <div className="db-type-option-name">{t.label}</div>
                                        <div className="db-type-option-desc">{t.description}</div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="db-col-menu-section">
                              <div className="db-popover-title">Sort</div>
                              <div className="db-col-menu-sort-actions">
                                <button
                                  type="button"
                                  className="db-col-sort-btn"
                                  onClick={() => {
                                    setSortConfig({ colIdx: cIdx, direction: 'asc' });
                                    setActiveColMenu(null);
                                  }}
                                >
                                  <ArrowUp size={12} />
                                  <span>Sort Ascending</span>
                                </button>
                                <button
                                  type="button"
                                  className="db-col-sort-btn"
                                  onClick={() => {
                                    setSortConfig({ colIdx: cIdx, direction: 'desc' });
                                    setActiveColMenu(null);
                                  }}
                                >
                                  <ArrowDown size={12} />
                                  <span>Sort Descending</span>
                                </button>
                              </div>
                            </div>

                            {cIdx > 0 && (
                              <div className="db-col-menu-section danger">
                                <button
                                  type="button"
                                  className="db-col-delete-btn"
                                  onClick={() => handleDeleteColumn(cIdx)}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete Property</span>
                                </button>
                              </div>
                            )}
                          </div>,
                          document.body
                        )}
                      </th>
                    );
                  })}
                  {!isLocked && (
                    <th className="db-add-col-th">
                      <button
                        type="button"
                        className="db-add-col-btn"
                        onClick={() => handleAddColumn('text')}
                        title="Add property column"
                      >
                        <Plus size={14} />
                      </button>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {processedRows.map(({ row, originalIndex }) => (
                  <tr key={originalIndex} className="db-tr">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`db-td ${cIdx === 0 ? 'title-cell' : ''}`}
                      >
                        {renderCellContent(originalIndex, cIdx, cell)}
                      </td>
                    ))}
                    {!isLocked && (
                      <td className="db-row-action-td">
                        <button
                          type="button"
                          className="db-delete-row-btn"
                          onClick={() => handleDeleteRow(originalIndex)}
                          title="Delete row"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {processedRows.length === 0 && (
                  <tr>
                    <td colSpan={headers.length + 1} className="db-empty-state-td">
                      No matching items found.
                    </td>
                  </tr>
                )}
                {/* Notion-style bottom row to quickly append pages */}
                {!isLocked && (
                  <tr
                    className="db-bottom-add-tr"
                    onClick={() => handleAddRow()}
                    title="Click to add new row"
                  >
                    <td colSpan={headers.length + 1} className="db-bottom-add-td">
                      <Plus size={13} />
                      <span>{headers[0]?.toLowerCase().includes('project') ? 'New project' : 'New'}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BOARD (KANBAN) VIEW */}
      {viewType === 'board' && (
        <div className="db-kanban-view">
          <div className="db-kanban-board">
            {kanbanColumns.map((colName) => {
              const colColor = getTagColor(colName);
              const cardsInCol = processedRows.filter(
                ({ row }) => (row[groupByIndex] || 'Unassigned').trim().toLowerCase() === colName.toLowerCase()
              );

              return (
                <div key={colName} className="kanban-column">
                  {/* Column Header */}
                  <div className="kanban-column-header">
                    <span
                      className="kanban-column-pill"
                      style={{ backgroundColor: colColor.bg, color: colColor.text }}
                    >
                      {colName}
                    </span>
                    <span className="kanban-count-badge">{cardsInCol.length}</span>
                    {!isLocked && (
                      <button
                        type="button"
                        className="kanban-col-add-btn"
                        onClick={() => handleAddCardToColumn(colName)}
                        title={`Add card to ${colName}`}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Cards List */}
                  <div className="kanban-cards-list">
                    {cardsInCol.map(({ row, originalIndex }) => {
                      const title = row[0] || 'Untitled';
                      const properties = row.slice(1);

                      return (
                        <div
                          key={originalIndex}
                          className="kanban-card"
                          onClick={() => setSelectedRowIndex(originalIndex)}
                        >
                          <div className="kanban-card-title">{title}</div>

                          {/* Card Property Chips */}
                          <div className="kanban-card-properties">
                            {properties.map((prop, pIdx) => {
                              const actualColIdx = pIdx + 1;
                              if (actualColIdx === groupByIndex || !prop) return null;
                              const colType = getColType(actualColIdx);

                              if (colType === 'status') {
                                const stColor = getStatusColor(prop);
                                return (
                                  <span
                                    key={pIdx}
                                    className="kanban-prop-badge"
                                    style={{ backgroundColor: stColor.bg, color: stColor.text }}
                                  >
                                    {prop}
                                  </span>
                                );
                              }

                              if (colType === 'multi_select') {
                                const tags = prop.split(',').map((t) => t.trim()).filter(Boolean);
                                return tags.map((t, idx) => {
                                  const tagCol = getTagColor(t);
                                  return (
                                    <span
                                      key={`${pIdx}-${idx}`}
                                      className="kanban-prop-badge"
                                      style={{ backgroundColor: tagCol.bg, color: tagCol.text }}
                                    >
                                      {t}
                                    </span>
                                  );
                                });
                              }

                              if (colType === 'select') {
                                const selCol = getTagColor(prop);
                                return (
                                  <span
                                    key={pIdx}
                                    className="kanban-prop-badge"
                                    style={{ backgroundColor: selCol.bg, color: selCol.text }}
                                  >
                                    {prop}
                                  </span>
                                );
                              }

                              if (colType === 'people') {
                                const people = prop.split(',').map((p) => p.trim()).filter(Boolean);
                                return people.map((person, idx) => (
                                  <span key={`${pIdx}-${idx}`} className="kanban-prop-badge">
                                    <User size={10} />
                                    <span>{person}</span>
                                  </span>
                                ));
                              }

                              if (colType === 'date') {
                                return (
                                  <span key={pIdx} className="kanban-prop-badge date-badge">
                                    <Calendar size={10} />
                                    <span>{formatDateDisplay(prop)}</span>
                                  </span>
                                );
                              }

                              if (colType === 'checkbox') {
                                const isChecked = prop === 'true' || prop === '1';
                                return (
                                  <span key={pIdx} className={`kanban-prop-badge check-badge ${isChecked ? 'checked' : ''}`}>
                                    <CheckSquare size={10} />
                                    <span>{isChecked ? 'Done' : 'Pending'}</span>
                                  </span>
                                );
                              }

                              if (colType === 'number') {
                                const num = parseFloat(prop);
                                return (
                                  <span key={pIdx} className="kanban-prop-badge number-badge">
                                    <Hash size={10} />
                                    <span>{prop}</span>
                                    {!isNaN(num) && num >= 0 && num <= 100 && (
                                      <span className="kanban-mini-bar">
                                        <span className="kanban-mini-bar-fill" style={{ width: `${num}%` }} />
                                      </span>
                                    )}
                                  </span>
                                );
                              }

                              const tagCol = getTagColor(prop);
                              return (
                                <span
                                  key={pIdx}
                                  className="kanban-prop-badge"
                                  style={{ backgroundColor: tagCol.bg, color: tagCol.text }}
                                >
                                  {prop}
                                </span>
                              );
                            })}
                          </div>

                          {/* Quick Column Switcher on Card */}
                          {!isLocked && (
                            <div
                              className="kanban-card-footer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                className="kanban-quick-move-select"
                                value={colName}
                                disabled={isLocked}
                                onChange={(e) => handleMoveCard(originalIndex, e.target.value)}
                              >
                                {kanbanColumns.map((c) => (
                                  <option key={c} value={c}>
                                    → {c}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!isLocked && (
                      <button
                        type="button"
                        className="kanban-add-card-btn"
                        onClick={() => handleAddCardToColumn(colName)}
                      >
                        <Plus size={14} />
                        <span>New</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Column Button */}
            {!isLocked && (
              <div className="kanban-add-column-zone">
                <button type="button" className="kanban-add-col-btn" onClick={handleAddKanbanColumn}>
                  <Plus size={14} />
                  <span>Add group</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GALLERY VIEW */}
      {viewType === 'gallery' && (
        <div className="db-gallery-view">
          <div className="db-gallery-grid">
            {processedRows.map(({ row, originalIndex }) => {
              const title = row[0] || 'Untitled';
              const properties = row.slice(1);
              const gradient = CARD_GRADIENTS[originalIndex % CARD_GRADIENTS.length];

              return (
                <div
                  key={originalIndex}
                  className="gallery-card"
                  onClick={() => setSelectedRowIndex(originalIndex)}
                >
                  <div className="gallery-card-cover" style={{ background: gradient }} />
                  <div className="gallery-card-body">
                    <div className="gallery-card-title">{title}</div>
                    <div className="gallery-card-props">
                      {properties.map((prop, pIdx) => {
                        if (!prop) return null;
                        const headerName = headers[pIdx + 1] || 'Property';
                        const actualColIdx = pIdx + 1;
                        const colType = getColType(actualColIdx);

                        return (
                          <div key={pIdx} className="gallery-prop-row">
                            <span className="gallery-prop-name">{headerName}:</span>
                            {colType === 'status' ? (
                              <span
                                className="gallery-prop-badge"
                                style={{ backgroundColor: getStatusColor(prop).bg, color: getStatusColor(prop).text }}
                              >
                                {prop}
                              </span>
                            ) : colType === 'date' ? (
                              <span className="gallery-prop-badge date">
                                <Calendar size={10} />
                                {formatDateDisplay(prop)}
                              </span>
                            ) : colType === 'checkbox' ? (
                              <span className="gallery-prop-badge check">
                                {prop === 'true' || prop === '1' ? '✓ Completed' : 'Pending'}
                              </span>
                            ) : colType === 'people' ? (
                              <span className="gallery-prop-badge">
                                <User size={10} />
                                {prop.split(',').map((p) => p.trim()).filter(Boolean).join(', ')}
                              </span>
                            ) : colType === 'email' ? (
                              <span className="gallery-prop-badge">
                                <Mail size={10} />
                                {prop}
                              </span>
                            ) : colType === 'phone' ? (
                              <span className="gallery-prop-badge">
                                <Phone size={10} />
                                {prop}
                              </span>
                            ) : (
                              <span
                                className="gallery-prop-badge"
                                style={{ backgroundColor: getTagColor(prop).bg, color: getTagColor(prop).text }}
                              >
                                {prop}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Card Tile */}
            {!isLocked && (
              <button type="button" className="gallery-add-card-tile" onClick={() => handleAddRow()}>
                <Plus size={20} />
                <span>New Item</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. LIST VIEW */}
      {viewType === 'list' && (
        <div className="db-list-view">
          {processedRows.map(({ row, originalIndex }) => {
            const title = row[0] || 'Untitled';
            const properties = row.slice(1).filter(Boolean);

            return (
              <div
                key={originalIndex}
                className="db-list-row"
                onClick={() => setSelectedRowIndex(originalIndex)}
              >
                <span className="db-list-row-title">{title}</span>
                <div className="db-list-row-props">
                  {properties.map((prop, pIdx) => {
                    const actualColIdx = pIdx + 1;
                    const colType = getColType(actualColIdx);
                    const headerName = headers[actualColIdx] || 'Property';

                    if (colType === 'status') {
                      const stColor = getStatusColor(prop);
                      return (
                        <span
                          key={pIdx}
                          className="db-list-prop-pill"
                          style={{ backgroundColor: stColor.bg, color: stColor.text }}
                        >
                          {prop}
                        </span>
                      );
                    }
                    if (colType === 'date') {
                      return (
                        <span key={pIdx} className="db-list-prop-text">
                          <Calendar size={10} />
                          {formatDateDisplay(prop)}
                        </span>
                      );
                    }
                    if (colType === 'checkbox') {
                      return (
                        <span key={pIdx} className="db-list-prop-text">
                          <CheckSquare size={10} />
                          {prop === 'true' || prop === '1' ? 'Done' : 'Pending'}
                        </span>
                      );
                    }
                    if (colType === 'select') {
                      const selColor = getTagColor(prop);
                      return (
                        <span
                          key={pIdx}
                          className="db-list-prop-pill"
                          style={{ backgroundColor: selColor.bg, color: selColor.text }}
                        >
                          {prop}
                        </span>
                      );
                    }
                    return (
                      <span key={pIdx} className="db-list-prop-text" title={headerName}>
                        {prop}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {processedRows.length === 0 && (
            <div className="db-list-empty">No rows match the current filter</div>
          )}

          {!isLocked && (
            <button type="button" className="db-list-add-row" onClick={() => handleAddRow()}>
              <Plus size={14} />
              <span>New item</span>
            </button>
          )}
        </div>
      )}

      {/* 5. CALENDAR VIEW */}
      {viewType === 'calendar' && (
        <div className="db-calendar-view">
          <div className="db-calendar-toolbar">
            <button
              type="button"
              className="db-calendar-nav-btn"
              onClick={() => setCalendarMonth((prev) => shiftMonth(prev, -1))}
              title="Previous month"
            >
              <ChevronDown size={14} className="db-calendar-nav-icon flip-horizontal" />
            </button>
            <span className="db-calendar-title">
              {calendarMonth.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <button
              type="button"
              className="db-calendar-nav-btn"
              onClick={() => setCalendarMonth((prev) => shiftMonth(prev, 1))}
              title="Next month"
            >
              <ChevronDown size={14} className="db-calendar-nav-icon" />
            </button>
            <button
              type="button"
              className="db-calendar-today-btn"
              onClick={() => setCalendarMonth(new Date())}
            >
              Today
            </button>
          </div>

          <div className="db-calendar-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="db-calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="db-calendar-grid">
            {calendarCells.map((cell) => (
              <div
                key={cell.key}
                className={`db-calendar-cell ${cell.isToday ? 'today' : ''} ${cell.isOutside ? 'outside' : ''}`}
              >
                <div className="db-calendar-cell-day">{cell.day}</div>
                <div className="db-calendar-cell-events">
                  {cell.events.map((event) => (
                    <div
                      key={event.originalIndex}
                      className="db-calendar-event"
                      onClick={() => setSelectedRowIndex(event.originalIndex)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {calendarDateColumnIndex === -1 && (
            <div className="db-calendar-hint">
              This table has no date column, so the calendar stays empty. Add a date property to
              see the rows on a calendar.
            </div>
          )}
        </div>
      )}

      {/* 6. TIMELINE VIEW */}
      {viewType === 'timeline' && (
        <TimelineView
          rows={processedRows.map(r => r.row)}
          headers={headers}
          startDateIndex={dateColIdx >= 0 ? dateColIdx : undefined}
          onRowClick={(idx) => {
            const orig = processedRows[idx]?.originalIndex ?? idx;
            setSelectedRowIndex(orig);
          }}
        />
      )}

      {/* Notion-style Page Peek Modal for Card Details */}
      {selectedRowIndex !== null && rows[selectedRowIndex] && (
        <div
          className="db-peek-backdrop"
          onClick={() => setSelectedRowIndex(null)}
        >
          <div
            className="db-peek-modal animate-popover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="db-peek-header">
              <span className="db-peek-tag">Database Item</span>
              <div className="db-peek-header-actions">
                {!isLocked && (
                  <button
                    type="button"
                    className="db-peek-action-btn delete"
                    onClick={() => handleDeleteRow(selectedRowIndex)}
                    title="Delete item"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  className="db-peek-close-btn"
                  onClick={() => setSelectedRowIndex(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="db-peek-body">
              {/* Item Title */}
              <input
                type="text"
                className="db-peek-title-input"
                value={rows[selectedRowIndex][0] || ''}
                readOnly={isLocked}
                disabled={isLocked}
                placeholder="Item name..."
                onChange={(e) => handleTableCellChange(selectedRowIndex, 0, e.target.value)}
              />

              {/* Properties Grid */}
              <div className="db-peek-properties-list">
                {headers.slice(1).map((header, pIdx) => {
                  const actualColIdx = pIdx + 1;
                  const colType = getColType(actualColIdx);
                  const typeObj = PROPERTY_TYPES.find((t) => t.id === colType) || PROPERTY_TYPES[0];
                  const PropIcon = typeObj.icon;
                  const val = rows[selectedRowIndex][actualColIdx] || '';

                  return (
                    <div key={actualColIdx} className="db-peek-prop-row">
                      <div className="db-peek-prop-label">
                        <PropIcon size={13} className="db-peek-prop-icon" />
                        <span>{header}</span>
                        <span className="db-peek-prop-type-badge">{typeObj.label}</span>
                      </div>
                      <div className="db-peek-prop-value-wrap">
                        {colType === 'status' ? (
                          <div className="db-peek-status-control">
                            {STATUS_OPTIONS.map((opt) => {
                              const isSelected = (val || 'Not Started').toLowerCase() === opt.label.toLowerCase();
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  className={`db-peek-status-chip ${isSelected ? 'active' : ''}`}
                                  style={{
                                    backgroundColor: isSelected ? opt.color.bg : 'var(--bg-hover)',
                                    color: isSelected ? opt.color.text : 'var(--text-secondary)',
                                    borderColor: isSelected ? opt.color.text : 'transparent'
                                  }}
                                  onClick={() => !isLocked && handleTableCellChange(selectedRowIndex, actualColIdx, opt.label)}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : colType === 'checkbox' ? (
                          <button
                            type="button"
                            className={`db-peek-checkbox-toggle ${val === 'true' || val === '1' ? 'checked' : ''}`}
                            disabled={isLocked}
                            onClick={() =>
                              handleTableCellChange(
                                selectedRowIndex,
                                actualColIdx,
                                val === 'true' || val === '1' ? '' : 'true'
                              )
                            }
                          >
                            <CheckSquare size={14} />
                            <span>{val === 'true' || val === '1' ? 'Checked' : 'Unchecked'}</span>
                          </button>
                        ) : colType === 'date' ? (
                          <div className="db-peek-date-field">
                            <DateCell
                              value={val}
                              onChange={(newDate) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, newDate)
                              }
                              isLocked={isLocked}
                            />
                          </div>
                        ) : colType === 'select' ? (
                          <div className="db-peek-status-control">
                            {getSelectOptions(actualColIdx).map((opt) => {
                              const isSelected = val === opt;
                              const optColor = getTagColor(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`db-peek-status-chip ${isSelected ? 'active' : ''}`}
                                  style={{
                                    backgroundColor: isSelected ? optColor.bg : 'var(--bg-hover)',
                                    color: isSelected ? optColor.text : 'var(--text-secondary)',
                                    borderColor: isSelected ? optColor.text : 'transparent'
                                  }}
                                  onClick={() =>
                                    !isLocked &&
                                    handleTableCellChange(
                                      selectedRowIndex,
                                      actualColIdx,
                                      isSelected ? '' : opt
                                    )
                                  }
                                >
                                  {opt}
                                </button>
                              );
                            })}
                            {!val && <span className="db-peek-prop-hint">No value yet</span>}
                          </div>
                        ) : colType === 'email' ? (
                          <div className="db-peek-url-field">
                            <input
                              type="email"
                              className="db-peek-prop-input"
                              value={val}
                              readOnly={isLocked}
                              disabled={isLocked}
                              placeholder="name@example.com"
                              onChange={(e) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                              }
                            />
                            {val && (
                              <a href={`mailto:${val}`} className="db-peek-url-btn">
                                <Mail size={13} />
                                <span>Mail</span>
                              </a>
                            )}
                          </div>
                        ) : colType === 'phone' ? (
                          <div className="db-peek-url-field">
                            <input
                              type="tel"
                              className="db-peek-prop-input"
                              value={val}
                              readOnly={isLocked}
                              disabled={isLocked}
                              placeholder="+62 ..."
                              onChange={(e) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                              }
                            />
                            {val && (
                              <a
                                href={`tel:${String(val).replace(/\s+/g, '')}`}
                                className="db-peek-url-btn"
                              >
                                <Phone size={13} />
                                <span>Call</span>
                              </a>
                            )}
                          </div>
                        ) : colType === 'people' ? (
                          <div className="db-peek-prop-input-row">
                            <input
                              type="text"
                              className="db-peek-prop-input"
                              value={val}
                              readOnly={isLocked}
                              disabled={isLocked}
                              placeholder="Add people (comma separated)"
                              onChange={(e) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                              }
                            />
                          </div>
                        ) : colType === 'url' ? (
                          <div className="db-peek-url-field">
                            <input
                              type="text"
                              className="db-peek-prop-input"
                              value={val}
                              readOnly={isLocked}
                              disabled={isLocked}
                              placeholder="https://..."
                              onChange={(e) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                              }
                            />
                            {val && (
                              <a
                                href={val.startsWith('http') ? val : `https://${val}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="db-peek-url-btn"
                              >
                                <ExternalLink size={13} />
                                <span>Visit</span>
                              </a>
                            )}
                          </div>
                        ) : colType === 'number' ? (
                          <div className="db-peek-number-field">
                            <input
                              type="number"
                              className="db-peek-prop-input"
                              value={val}
                              readOnly={isLocked}
                              disabled={isLocked}
                              placeholder="0"
                              onChange={(e) =>
                                handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                              }
                            />
                            {!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100 && (
                              <div className="db-peek-progress-bar">
                                <div className="db-peek-progress-fill" style={{ width: `${parseFloat(val)}%` }} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            className="db-peek-prop-input"
                            value={val}
                            readOnly={isLocked}
                            disabled={isLocked}
                            placeholder="Empty"
                            onChange={(e) =>
                              handleTableCellChange(selectedRowIndex, actualColIdx, e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Relation Manager Modal */}
      {showRelationManager && (
        <RelationManager
          currentDatabaseId={block.id}
          currentDatabaseName={block.databaseTitle || block.title || 'This database'}
          databases={workspaceDatabases}
          onCreateNewDatabase={onAddBlockBelow ? () => {
            const newDbId = `table_${Date.now()}`;
            const newDb = {
              id: newDbId,
              type: 'table',
              databaseTitle: 'Related Tasks',
              headers: ['Task', 'Status', 'Assignee'],
              columnTypes: ['text', 'status', 'people'],
              rows: [
                ['Task 1', 'Not started', ''],
                ['Task 2', 'In progress', ''],
                ['Task 3', 'Done', '']
              ]
            };
            onAddBlockBelow(block.id, newDb);
            return {
              id: newDbId,
              name: newDb.databaseTitle,
              pageTitle: currentPage?.title || 'Current page',
              pageIcon: '📊',
              headers: newDb.headers,
              columnTypes: newDb.columnTypes,
              rows: newDb.rows
            };
          } : null}
          onAddRelation={(rel) => {
            const cIdx = activeRelationCol !== null ? activeRelationCol : headers.length;
            const newHeaders = [...headers];
            const currentTypes = headers.map((_, idx) => getColType(idx));
            const newTypes = [...currentTypes];
            const newConfigs = { ...(block.columnConfigs || {}) };

            if (activeRelationCol !== null) {
              newHeaders[cIdx] = rel.name || `Related to ${rel.targetDatabaseName || 'Database'}`;
              newTypes[cIdx] = 'relation';
              newConfigs[cIdx] = { ...(newConfigs[cIdx] || {}), relation: rel };
            } else {
              const newColName = rel.name || `Related to ${rel.targetDatabaseName || 'Database'}`;
              newHeaders.push(newColName);
              newTypes.push('relation');
              newConfigs[cIdx] = { relation: rel };
            }

            let updatedRows = activeRelationCol !== null ? rows : rows.map((r) => [...r, '']);

            // Dual relation support for self-database:
            // Automatically append symmetric column (e.g. Sub-items)
            if (rel.isSelf && rel.type === 'dual' && rel.symmetricName) {
              const symIdx = newHeaders.length;
              newHeaders.push(rel.symmetricName);
              newTypes.push('relation');
              newConfigs[symIdx] = {
                relation: {
                  targetDatabaseId: block.id,
                  targetDatabaseName: block.databaseTitle || 'This database',
                  type: 'dual',
                  isSelf: true,
                  name: rel.symmetricName
                }
              };
              updatedRows = updatedRows.map((r) => [...r, '']);
            }

            onUpdateBlock(block.id, {
              headers: newHeaders,
              columnTypes: newTypes,
              columnConfigs: newConfigs,
              rows: updatedRows
            });
            setShowRelationManager(false);
          }}
          onClose={() => setShowRelationManager(false)}
        />
      )}

      {/* Rollup Configuration Modal */}
      {showRollupConfig && (() => {
        const activeRollupRelationCol = headers.findIndex(
          h => h === block.columnConfigs?.[activeRollupCol]?.relationId
        );
        const activeRollupTargetDbId = activeRollupRelationCol >= 0
          ? block.columnConfigs?.[activeRollupRelationCol]?.relation?.targetDatabaseId
          : null;
        const activeRollupTargetDb = workspaceDatabases.find(d => d.id === activeRollupTargetDbId);
        const relatedPropertiesForRollup = activeRollupTargetDb
          ? activeRollupTargetDb.headers.map((h, i) => ({
              name: h,
              type: activeRollupTargetDb.columnTypes?.[i] || 'text'
            }))
          : null;

        return (
          <div className="db-modal-backdrop" onClick={() => setShowRollupConfig(false)}>
            <div className="db-modal-card" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
              <div className="db-modal-header">
                <div className="db-modal-title">
                  <Database size={16} />
                  <span>Configure Rollup ({headers[activeRollupCol]})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRollupConfig(false)}
                  className="db-modal-close-btn"
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <div style={{ padding: '16px 18px', maxHeight: '75vh', overflowY: 'auto' }}>
                <RollupConfig
                  columnConfig={block.columnConfigs?.[activeRollupCol] || {}}
                  headers={headers}
                  columnTypes={headers.map((_, i) => getColType(i))}
                  relatedProperties={relatedPropertiesForRollup}
                  onChange={(cfg) => {
                    if (activeRollupCol !== null) {
                      const newConfigs = { ...(block.columnConfigs || {}) };
                      newConfigs[activeRollupCol] = cfg;
                      onUpdateBlock(block.id, { columnConfigs: newConfigs });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Formula Editor Modal */}
      {showFormulaEditor && (
        <FormulaEditor
          columnName={headers[activeFormulaCol]}
          initialFormula={block.columnConfigs?.[activeFormulaCol]?.formula || ''}
          headers={headers}
          firstRow={rows[0] || []}
          onSave={(formula) => {
            if (activeFormulaCol !== null) {
              const newConfigs = { ...(block.columnConfigs || {}) };
              newConfigs[activeFormulaCol] = { ...(newConfigs[activeFormulaCol] || {}), formula };
              onUpdateBlock(block.id, { columnConfigs: newConfigs });
            }
          }}
          onClose={() => setShowFormulaEditor(false)}
        />
      )}
    </div>
  );
};
