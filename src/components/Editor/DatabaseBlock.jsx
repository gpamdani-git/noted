import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Table as TableIcon,
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
  Star
} from 'lucide-react';
import './DatabaseBlock.css';

// Rich Column Property Types Specification
export const PROPERTY_TYPES = [
  { id: 'text', label: 'Text', icon: Type, description: 'Plain text notes and descriptions' },
  { id: 'status', label: 'Status', icon: CheckCircle2, description: 'Track progress (Not Started, In Progress, Done)' },
  { id: 'multi_select', label: 'Multi-select', icon: Tag, description: 'Multiple tags and categories' },
  { id: 'date', label: 'Date', icon: Calendar, description: 'Dates, deadlines, and reminders' },
  { id: 'number', label: 'Number', icon: Hash, description: 'Numeric values with progress bar' },
  { id: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Simple boolean toggle' },
  { id: 'url', label: 'URL', icon: LinkIcon, description: 'Clickable links and websites' }
];

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

export const DatabaseBlock = ({ block, onUpdateBlock, isLocked = false }) => {
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
    return 'text';
  };

  // Find column to group by for Kanban
  const statusColIdx = headers.findIndex((h) => h.toLowerCase() === 'status');
  const defaultGroupIdx = statusColIdx !== -1 ? statusColIdx : Math.min(headers.length - 1, 1);
  const groupByIndex = block.groupByCol !== undefined ? block.groupByCol : defaultGroupIdx;

  // Local interactive UI state
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // { colIdx: number, operator: string, value: string }
  const [filterConfig, setFilterConfig] = useState(block.filterConfig || null);
  // { colIdx: number, direction: 'asc' | 'desc' }
  const [sortConfig, setSortConfig] = useState(block.sortConfig || null);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
  const [activeColMenu, setActiveColMenu] = useState(null); // colIdx
  const [activeStatusCell, setActiveStatusCell] = useState(null); // { rIdx: number, cIdx: number }

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

  const kanbanColumns = existingGroups.length > 0
    ? existingGroups
    : ['To Do', 'In Progress', 'Completed'];

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
    initial[0] = `New Task ${rows.length + 1}`;
    initial[groupByIndex] = columnName;
    handleAddRow(initial);
  };

  const handleAddKanbanColumn = () => {
    if (isLocked) return;
    const newColName = prompt('Enter new column group name:');
    if (newColName && newColName.trim()) {
      handleAddCardToColumn(newColName.trim());
    }
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

  // --- Rich Cell Content Renderer ---
  const renderCellContent = (originalIndex, cIdx, cellValue) => {
    const colType = getColType(cIdx);
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

                        {/* Column Configuration Popover */}
                        {isMenuOpen && !isLocked && (
                          <div
                            className="db-col-menu-popover animate-popover"
                            onClick={(e) => e.stopPropagation()}
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
                          </div>
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
    </div>
  );
};
