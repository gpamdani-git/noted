import React, { useState } from 'react';
import { PROPERTY_TYPES, PROPERTY_CATEGORIES } from '../../utils/database/propertyTypes';
import './DatabaseViews.css';

const DatabasePropertySelector = ({ onSelect, existingProperties = [], onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTypes = PROPERTY_TYPES.filter(type => {
    const matchesSearch = type.label.toLowerCase().includes(search.toLowerCase()) ||
                         type.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || type.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [{ id: 'all', label: 'All' }, ...PROPERTY_CATEGORIES];

  return (
    <div
      className="db-modal-card"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: '280px',
        zIndex: 500,
        boxShadow: 'var(--shadow-popover, 0 10px 38px -10px rgba(22,23,24,0.25))'
      }}
    >
      <div className="relation-search-box" style={{ padding: '8px 12px' }}>
        <input
          type="text"
          placeholder="Search property type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="relation-search-input"
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`db-filter-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
            style={{ padding: '2px 6px', fontSize: 11 }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px' }}>
        {filteredTypes.map(type => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                onSelect(type.id);
                onClose && onClose();
              }}
              className="relation-db-item"
              style={{ padding: '6px 8px', borderRadius: 4 }}
            >
              <div className="relation-db-icon-wrap" style={{ width: 22, height: 22 }}>
                <Icon size={13} />
              </div>
              <div className="relation-db-meta">
                <div className="relation-db-name" style={{ fontSize: 12.5 }}>{type.label}</div>
                <div className="relation-db-page" style={{ fontSize: 11 }}>{type.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DatabasePropertySelector;
