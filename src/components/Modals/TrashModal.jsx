import React from 'react';
import { X, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import './Modals.css';

export const TrashModal = ({
  trashPages,
  onRestorePage,
  onPermanentDeletePage,
  onEmptyTrash,
  onClose
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="trash-modal-card animate-popover" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Trash</div>
          <div className="modal-header-actions">
            {trashPages.length > 0 && (
              <button className="empty-trash-btn" onClick={onEmptyTrash}>
                Empty Trash
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="trash-modal-body">
          {trashPages.length === 0 ? (
            <div className="trash-empty-view">
              <Trash2 size={32} className="trash-empty-icon" />
              <div className="trash-empty-title">Trash is empty</div>
              <div className="trash-empty-desc">Deleted pages will appear here for recovery.</div>
            </div>
          ) : (
            <div className="trash-items-list">
              {trashPages.map((page) => (
                <div key={page.id} className="trash-item-row">
                  <div className="trash-item-info">
                    <span className="trash-item-icon">{page.icon || '📄'}</span>
                    <span className="trash-item-title">{page.title || 'Untitled'}</span>
                  </div>
                  <div className="trash-item-actions">
                    <button
                      className="trash-action-btn restore-btn"
                      onClick={() => onRestorePage(page.id)}
                      title="Restore page"
                    >
                      <RotateCcw size={14} />
                      <span>Restore</span>
                    </button>
                    <button
                      className="trash-action-btn delete-perm-btn"
                      onClick={() => onPermanentDeletePage(page.id)}
                      title="Delete permanently"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
