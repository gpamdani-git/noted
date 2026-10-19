import React, { useState } from 'react';
import { Check, MoreHorizontal, CornerDownRight, Trash2, Send } from 'lucide-react';
import { formatCommentTime } from '../../utils/comments';
import './NotionMarginCommentCard.css';

export const NotionMarginCommentCard = ({
  comment,
  onResolve,
  onDelete,
  onAddReply,
  currentUser
}) => {
  const [replyText, setReplyText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  if (!comment) return null;

  const handlePostReply = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!replyText.trim()) return;
    if (onAddReply) {
      onAddReply(comment.id, replyText.trim());
    }
    setReplyText('');
  };

  const formatShortTime = (timestamp) => {
    if (!timestamp) return 'now';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div
      className={`notion-margin-comment-card animate-fade-in ${comment.resolved ? 'is-resolved' : ''}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Thread Item 1: Main Comment */}
      <div className="notion-thread-entry">
        <div className="entry-avatar-column">
          <div
            className="entry-avatar"
            style={{ backgroundColor: comment.author?.color || '#00897b' }}
          >
            {comment.author?.avatar || 'D'}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="thread-connecting-line" />
          )}
        </div>

        <div className="entry-content-column">
          <div className="entry-header-row">
            <div className="entry-meta">
              <span className="entry-author-name">{comment.author?.name || 'Dani Gpam'}</span>
              <span className="entry-timestamp">{formatShortTime(comment.createdAt)}</span>
            </div>

            {/* Actions: Prominent Resolve checkmark and options */}
            <div className="entry-actions-hover">
              <button
                type="button"
                className="entry-act-btn resolve"
                title="Resolve comment"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onResolve) onResolve(comment.id);
                }}
              >
                <Check size={12} strokeWidth={2.5} />
              </button>
              <div className="entry-options-anchor">
                <button
                  type="button"
                  className="entry-act-btn"
                  title="More actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(!showOptionsMenu);
                  }}
                >
                  <MoreHorizontal size={12} />
                </button>
                {showOptionsMenu && (
                  <div className="entry-dropdown-menu animate-popover">
                    <button
                      type="button"
                      className="dropdown-menu-item delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete(comment.id);
                        setShowOptionsMenu(false);
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Delete thread</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="entry-text-body">{comment.text}</div>
        </div>
      </div>

      {/* Thread Item 2+: Replies matching Screenshot Image 1 & 2 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="notion-thread-replies-list">
          {comment.replies.map((rep, idx) => {
            const isLast = idx === comment.replies.length - 1;
            return (
              <div key={rep.id} className="notion-thread-entry reply-entry">
                <div className="entry-avatar-column">
                  <div
                    className="entry-avatar"
                    style={{ backgroundColor: rep.author?.color || '#00897b' }}
                  >
                    {rep.author?.avatar || 'D'}
                  </div>
                  {!isLast && <div className="thread-connecting-line" />}
                </div>

                <div className="entry-content-column">
                  <div className="entry-header-row">
                    <div className="entry-meta">
                      <span className="entry-author-name">{rep.author?.name || 'Dani Gpam'}</span>
                      <span className="entry-timestamp">{formatShortTime(rep.createdAt)}</span>
                    </div>
                  </div>
                  <div className="entry-text-body">{rep.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Directly Accessible Inline Reply Composer */}
      <form
        className="thread-reply-input-wrapper animate-fade-in"
        onSubmit={handlePostReply}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          className="thread-reply-field"
          placeholder="Reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              handlePostReply(e);
            }
          }}
        />
        <button
          type="submit"
          className="thread-reply-send"
          disabled={!replyText.trim()}
          title="Send reply"
          onClick={(e) => {
            e.stopPropagation();
            handlePostReply(e);
          }}
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
