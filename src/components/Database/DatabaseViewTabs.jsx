import React from 'react';
import { Plus, Table, Kanban, LayoutGrid, List, Calendar, Clock } from 'lucide-react';
import '../Editor/DatabaseBlock.css';

const VIEW_ICONS = {
  table: Table,
  board: Kanban,
  gallery: LayoutGrid,
  list: List,
  calendar: Calendar,
  timeline: Clock
};

const DatabaseViewTabs = ({ views = [{ id: 'default', name: 'Table', type: 'table' }], activeViewId, onViewChange, onAddView }) => {
  return (
    <div className="database-view-tabs" style={{ padding: '0 4px', borderBottom: '1px solid var(--border-color, rgba(55,53,47,0.09))' }}>
      {views.map(view => {
        const Icon = VIEW_ICONS[view.type] || Table;
        const isActive = activeViewId === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange(view.id)}
            className={`db-tab-btn ${isActive ? 'active' : ''}`}
          >
            <Icon size={14} />
            <span>{view.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onAddView && onAddView()}
        className="db-tab-btn"
        title="Add view"
      >
        <Plus size={14} />
        <span>Add view</span>
      </button>
    </div>
  );
};

export default DatabaseViewTabs;
