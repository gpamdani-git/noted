import React, { useEffect } from 'react';
import { X, Archive, RotateCcw, Trash2 } from 'lucide-react';
import './Modals.css';

export const ArchiveModal = ({
  archivedPages,
  onRestorePage,
  onMoveToTrash,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="trash-modal-card animate-popover" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Archive</div>
          <div className="modal-header-actions">
            <button className="modal-close-btn" onClick={onClose} aria-label="Close the archive">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="trash-modal-body">
          {archivedPages.length === 0 ? (
            <div className="trash-empty-view">
              <Archive size={32} className="trash-empty-icon" />
              <div className="trash-empty-title">The archive is empty</div>
              <div className="trash-empty-desc">Archived pages stay out of the sidebar but keep their content.</div>
            </div>
          ) : (
            <div className="trash-items-list">
              {archivedPages.map((page) => (
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
                      onClick={() => onMoveToTrash(page.id)}
                      title="Move to the trash"
                    >
                      <Trash2 size={14} />
                      <span>Trash</span>
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
