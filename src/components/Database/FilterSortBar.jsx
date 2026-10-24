import React, { useState } from 'react';
import { Filter, ArrowUpDown, Plus, X } from 'lucide-react';
import './DatabaseViews.css';

const FilterSortBar = ({ properties = [], onFilterChange, onSortChange, filterConfig, sortConfig }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filters, setFilters] = useState(filterConfig?.conditions || []);
  const [sorts, setSorts] = useState(sortConfig ? [sortConfig] : []);

  const operators = {
    text: ['contains', 'does not contain', 'is', 'is not', 'starts with', 'ends with', 'is empty', 'is not empty'],
    number: ['equals', 'does not equal', 'greater than', 'less than', 'greater or equal', 'less or equal', 'is empty', 'is not empty'],
    select: ['is', 'is not', 'is empty', 'is not empty'],
    multi_select: ['contains', 'does not contain', 'is empty', 'is not empty'],
    date: ['is', 'is before', 'is after', 'is on or before', 'is on or after', 'is empty', 'is not empty'],
    checkbox: ['is true', 'is false']
  };

  const addFilter = () => {
    setFilters([...filters, { property: properties[0]?.name || '', operator: 'is', value: '' }]);
  };

  const removeFilter = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    onFilterChange && onFilterChange({ conditions: newFilters });
  };

  const addSort = () => {
    setSorts([...sorts, { property: properties[0]?.name || '', direction: 'asc' }]);
  };

  return (
    <div className="db-filter-sort-toolbar" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setShowFilter(!showFilter)}
        className={`db-filter-pill-btn ${filters.length > 0 ? 'active' : ''}`}
      >
        <Filter size={12} />
        <span>Filter {filters.length > 0 ? `(${filters.length})` : ''}</span>
      </button>

      <button
        type="button"
        onClick={() => setShowSort(!showSort)}
        className={`db-filter-pill-btn ${sorts.length > 0 ? 'active' : ''}`}
      >
        <ArrowUpDown size={12} />
        <span>Sort {sorts.length > 0 ? `(${sorts.length})` : ''}</span>
      </button>

      {/* Filter Popover */}
      {showFilter && (
        <div
          className="db-modal-card"
          style={{
            position: 'absolute',
            top: '32px',
            left: '8px',
            width: '320px',
            zIndex: 100,
            padding: '12px',
            boxShadow: 'var(--shadow-md, 0 8px 24px rgba(15,15,15,0.12))'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Filters</span>
            <button
              type="button"
              onClick={() => setShowFilter(false)}
              className="db-modal-close-btn"
            >
              <X size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {filters.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '4px 0' }}>No filters applied</div>
            ) : (
              filters.map((filter, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: '3px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)'
                    }}
                  >
                    {properties.map(p => <option key={p.name}>{p.name}</option>)}
                  </select>
                  <select
                    style={{
                      flex: 1,
                      fontSize: 12,
                      padding: '3px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)'
                    }}
                  >
                    {operators.text.map(op => <option key={op}>{op}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeFilter(idx)}
                    className="db-modal-close-btn"
                    style={{ width: 22, height: 22 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={addFilter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--accent, #2383e2)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginTop: 8,
              padding: '2px 0'
            }}
          >
            <Plus size={12} />
            <span>Add filter</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterSortBar;
