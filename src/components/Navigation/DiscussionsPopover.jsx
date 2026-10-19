import React, { useEffect, useRef } from 'react';
import { MessageSquare, ExternalLink, X } from 'lucide-react';
import { getPageComments, formatCommentTime } from '../../utils/comments';
import './DiscussionsPopover.css';

export const DiscussionsPopover = ({
  pageId,
  pageTitle = 'Page',
  onOpenFullComments,
  onClose
}) => {
  const popoverRef = useRef(null);
  const comments = pageId ? getPageComments(pageId) : [];
  const unresolvedComments = comments.filter((c) => !c.resolved);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="notion-discussions-popover animate-popover" ref={popoverRef}>
      {/* Header matching Notion Desktop Screenshot 5 */}
      <div className="notion-discussions-header">
        <div className="notion-discussions-title-row">
          <span className="notion-discussions-title">Discussions</span>
        </div>
        <div className="notion-discussions-header-actions">
          <button className="notion-discussions-icon-btn" onClick={onClose} title="Close (Esc)">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Discussion Threads List */}
      <div className="notion-discussions-list">
        {comments.length > 0 ? (
          comments.map((comm) => (
            <div
              key={comm.id}
              className="notion-discussions-item"
              onClick={() => {
                if (onOpenFullComments) onOpenFullComments();
                onClose();
              }}
            >
              <div
                className="notion-discussions-avatar"
                style={{ backgroundColor: comm.author?.color || '#00897b' }}
              >
                {comm.author?.avatar || 'D'}
              </div>
              <div className="notion-discussions-content">
                <div className="notion-discussions-meta">
                  <span className="notion-discussions-author">
                    {comm.author?.name || 'Dani Gpam'}
                  </span>
                  <span className="notion-discussions-time">
                    {formatCommentTime(comm.createdAt)}
                  </span>
                </div>
                <div className="notion-discussions-text">{comm.text}</div>
                {comm.replies && comm.replies.length > 0 && (
                  <div className="notion-discussions-replies-count">
                    {comm.replies.length} {comm.replies.length === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="notion-discussions-empty">
            <MessageSquare size={20} className="empty-icon" />
            <span className="empty-title">No discussions yet</span>
            <span className="empty-subtitle">
              Comments and discussions on "{pageTitle}" will appear here.
            </span>
          </div>
        )}
      </div>

      {/* Footer matching Notion Screenshot 5: "See all" pill button */}
      <div className="notion-discussions-footer">
        <button
          className="notion-discussions-see-all-btn"
          onClick={() => {
            if (onOpenFullComments) onOpenFullComments();
            onClose();
          }}
        >
          <span>See all</span>
          <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
};
