import React, { useState, useEffect } from 'react';
import { X, Search, Link2, Database, Check, RefreshCw, Plus } from 'lucide-react';
import './DatabaseViews.css';

const RelationManager = ({
  currentDatabaseId,
  currentDatabaseName = 'This database',
  databases = [],
  onAddRelation,
  onCreateNewDatabase,
  onClose
}) => {
  const [selectedDb, setSelectedDb] = useState(null);
  const [relationType, setRelationType] = useState('single'); // single or dual
  const [search, setSearch] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Identify self database
  const selfDb = (databases || []).find(db => db.id === currentDatabaseId) || {
    id: currentDatabaseId,
    name: currentDatabaseName || 'This database',
    pageTitle: 'This table',
    isSelf: true
  };

  const otherDbs = (databases || []).filter(db => db.id !== currentDatabaseId);

  const searchLower = (search || '').toLowerCase().trim();
  const showSelf = !searchLower || (selfDb.name || '').toLowerCase().includes(searchLower) || 'this database self-relation'.includes(searchLower);
  const filteredOthers = otherDbs.filter(db =>
    (db.name || '').toLowerCase().includes(searchLower) ||
    (db.pageTitle || '').toLowerCase().includes(searchLower)
  );

  const handleSelect = (db) => {
    setSelectedDb(db);
    // Reset to single by default when switching
    setRelationType('single');
  };

  const handleCreateNew = () => {
    if (onCreateNewDatabase) {
      const newDb = onCreateNewDatabase();
      if (newDb) {
        setSelectedDb(newDb);
      }
    }
  };

  const handleCreate = () => {
    if (!selectedDb) return;
    const isSelf = selectedDb.id === currentDatabaseId;
    onAddRelation({
      targetDatabaseId: selectedDb.id,
      targetDatabaseName: selectedDb.name,
      type: relationType,
      isSelf,
      name: isSelf
        ? (relationType === 'dual' ? 'Parent item' : 'Related items')
        : `Related to ${selectedDb.name}`,
      symmetricName: isSelf
        ? 'Sub-items'
        : `Related to ${currentDatabaseName || 'Database'}`
    });
    onClose && onClose();
  };

  return (
    <div className="db-modal-backdrop" onClick={onClose}>
      <div className="db-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-modal-title">
            <Link2 size={16} color="var(--accent, #2383e2)" />
            <span>Add relation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="db-modal-close-btn"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="relation-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search databases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="relation-search-input"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="db-modal-close-btn"
              style={{ width: 20, height: 20 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Database List */}
        <div className="relation-db-list">
          {/* Section 1: Self-relation */}
          {showSelf && (
            <>
              <div className="relation-section-title">Self-relation</div>
              <button
                type="button"
                onClick={() => handleSelect(selfDb)}
                className={`relation-db-item ${selectedDb?.id === selfDb.id ? 'selected' : ''}`}
              >
                <div className="relation-db-icon-wrap" style={{ color: 'var(--accent, #2383e2)' }}>
                  <RefreshCw size={14} />
                </div>
                <div className="relation-db-meta">
                  <div className="relation-db-name">{selfDb.name} (This database)</div>
                  <div className="relation-db-page">
                    Link items within this same table (e.g. Sub-tasks, Dependencies)
                  </div>
                </div>
                {selectedDb?.id === selfDb.id && <Check size={16} color="var(--accent, #2383e2)" />}
              </button>
            </>
          )}

          {/* Section 2: Other databases */}
          {filteredOthers.length > 0 && (
            <>
              <div className="relation-section-title">Workspace Databases</div>
              {filteredOthers.map(db => {
                const isSelected = selectedDb?.id === db.id;
                return (
                  <button
                    key={db.id}
                    type="button"
                    onClick={() => handleSelect(db)}
                    className={`relation-db-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="relation-db-icon-wrap">
                      {db.pageIcon || <Database size={14} />}
                    </div>
                    <div className="relation-db-meta">
                      <div className="relation-db-name">{db.name || 'Untitled database'}</div>
                      <div className="relation-db-page">
                        {db.pageTitle ? `in ${db.pageTitle}` : 'Workspace table'}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--accent, #2383e2)" />}
                  </button>
                );
              })}
            </>
          )}

          {/* If no other databases found and search didn't match self */}
          {!showSelf && filteredOthers.length === 0 && (
            <div className="relation-empty-state">
              <span className="relation-empty-icon">🔍</span>
              <span className="relation-empty-title">No databases matching "{search}"</span>
              <span className="relation-empty-desc">
                Try searching for another name or create a new database below.
              </span>
            </div>
          )}

          {/* Quick Action: + Create New Companion Database */}
          {onCreateNewDatabase && (
            <button
              type="button"
              className="relation-create-new-btn"
              onClick={handleCreateNew}
            >
              <Plus size={14} />
              <span>Create new related database</span>
            </button>
          )}
        </div>

        {/* Footer Configuration */}
        {selectedDb && (
          <div className="relation-footer">
            {selectedDb.id === currentDatabaseId ? (
              <label className="relation-dual-toggle">
                <input
                  type="checkbox"
                  checked={relationType === 'dual'}
                  onChange={(e) => setRelationType(e.target.checked ? 'dual' : 'single')}
                />
                <span>Separate direction (Parent item & Sub-items)</span>
              </label>
            ) : (
              <label className="relation-dual-toggle">
                <input
                  type="checkbox"
                  checked={relationType === 'dual'}
                  onChange={(e) => setRelationType(e.target.checked ? 'dual' : 'single')}
                />
                <span>Show relation on <strong>{selectedDb.name}</strong> as well</span>
              </label>
            )}
            <div className="relation-action-btns">
              <button
                type="button"
                onClick={onClose}
                className="relation-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="relation-btn-create"
              >
                Create relation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelationManager;
