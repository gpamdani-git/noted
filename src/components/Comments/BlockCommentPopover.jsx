import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  CornerDownRight,
  Trash2,
  User,
  RotateCcw
} from 'lucide-react';
import {
  getBlockComments,
  addComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  deleteReply,
  formatCommentTime,
  getCurrentUser,
  setCurrentUser,
  AVAILABLE_USERS
} from '../../utils/comments';
import './BlockCommentPopover.css';

export const BlockCommentPopover = ({
  pageId,
  blockId,
  blockText = '',
  isOpen,
  onClose,
  onCommentChange
}) => {
  const [comments, setComments] = useState([]);
  const [currentUser, setUser] = useState(getCurrentUser());
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const popoverRef = useRef(null);
  const textareaRef = useRef(null);

  const refreshComments = () => {
    if (!pageId || !blockId) return;
    const list = getBlockComments(pageId, blockId);
    setComments(list);
    if (onCommentChange) onCommentChange();
  };

  useEffect(() => {
    if (isOpen) {
      refreshComments();
      setUser(getCurrentUser());
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
    }
  }, [isOpen, pageId, blockId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePostComment = (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment({
      pageId,
      blockId,
      text: newCommentText,
      author: currentUser
    });
    setNewCommentText('');
    refreshComments();
  };

  const handlePostReply = (commentId) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;
    addReply({
      commentId,
      text,
      author: currentUser
    });
    setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
    refreshComments();
  };

  const handleToggleResolve = (commentId) => {
    toggleResolveComment(commentId);
    refreshComments();
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(commentId);
    refreshComments();
  };

  const handleDeleteReply = (commentId, replyId) => {
    deleteReply(commentId, replyId);
    refreshComments();
  };

  const handleSelectUser = (u) => {
    setCurrentUser(u);
    setUser(u);
    setShowUserMenu(false);
  };

  const blockSnippet = blockText
    ? blockText.length > 50
      ? `${blockText.slice(0, 50)}...`
      : blockText
    : 'Blok ini';

  return (
    <div className="block-comment-overlay" onClick={onClose}>
      <div
        className="block-comment-popover animate-popover"
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bcp-header">
          <div className="bcp-header-left">
            <MessageSquare size={14} className="text-accent" />
            <span className="bcp-title">Diskusi Blok</span>
            <span className="bcp-snippet" title={blockText}>
              "{blockSnippet}"
            </span>
          </div>
          <div className="bcp-header-right">
            {/* User persona switcher */}
            <div className="user-persona-box">
              <button
                className="user-persona-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={`Komentar sebagai: ${currentUser.name}`}
              >
                <span
                  className="user-avatar-badge"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.avatar}
                </span>
                <span className="user-name-label">{currentUser.name.split(' ')[0]}</span>
              </button>
              {showUserMenu && (
                <div className="user-persona-dropdown animate-popover">
                  <div className="user-dropdown-title">Pilih Akun / Persona</div>
                  {AVAILABLE_USERS.map((u) => (
                    <div
                      key={u.id}
                      className={`user-option-item ${u.id === currentUser.id ? 'active' : ''}`}
                      onClick={() => handleSelectUser(u)}
                    >
                      <span
                        className="user-avatar-badge"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.avatar}
                      </span>
                      <span>{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="bcp-close-btn" onClick={onClose} title="Tutup (Esc)">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* List of existing threads on this block */}
        <div className="bcp-threads-list">
          {comments.map((comm) => (
            <div
              key={comm.id}
              className={`bcp-thread-card ${comm.resolved ? 'is-resolved' : ''}`}
            >
              <div className="bcp-comment-main">
                <span
                  className="comment-author-avatar"
                  style={{ backgroundColor: comm.author.color }}
                >
                  {comm.author.avatar}
                </span>
                <div className="comment-content-box">
                  <div className="comment-meta-row">
                    <span className="comment-author-name">{comm.author.name}</span>
                    <span className="comment-time">{formatCommentTime(comm.createdAt)}</span>
                    {comm.resolved && (
                      <span className="comment-resolved-tag">Selesai</span>
                    )}
                  </div>
                  <div className="comment-text-body">{comm.text}</div>

                  {/* Actions for this thread */}
                  <div className="comment-actions-bar">
                    <button
                      className="comment-act-btn"
                      onClick={() =>
                        setActiveReplyId(activeReplyId === comm.id ? null : comm.id)
                      }
                    >
                      <CornerDownRight size={12} />
                      <span>Balas</span>
                    </button>
                    <button
                      className={`comment-act-btn ${comm.resolved ? 'reopen-btn' : 'resolve-btn'}`}
                      onClick={() => handleToggleResolve(comm.id)}
                      title={comm.resolved ? 'Buka kembali diskusi' : 'Tandai selesai'}
                    >
                      {comm.resolved ? <RotateCcw size={12} /> : <CheckCircle2 size={12} />}
                      <span>{comm.resolved ? 'Buka Kembali' : 'Selesaikan'}</span>
                    </button>
                    <button
                      className="comment-act-btn delete-btn"
                      onClick={() => handleDeleteComment(comm.id)}
                      title="Hapus komentar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Nested Replies */}
              {comm.replies && comm.replies.length > 0 && (
                <div className="comment-replies-list">
                  {comm.replies.map((rep) => (
                    <div key={rep.id} className="comment-reply-item">
                      <span
                        className="comment-author-avatar mini"
                        style={{ backgroundColor: rep.author.color }}
                      >
                        {rep.author.avatar}
                      </span>
                      <div className="reply-content-box">
                        <div className="comment-meta-row">
                          <span className="comment-author-name">{rep.author.name}</span>
                          <span className="comment-time">
                            {formatCommentTime(rep.createdAt)}
                          </span>
                          <button
                            className="reply-delete-btn"
                            onClick={() => handleDeleteReply(comm.id, rep.id)}
                            title="Hapus balasan"
                          >
                            <X size={11} />
                          </button>
                        </div>
                        <div className="reply-text-body">{rep.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Input if activated */}
              {activeReplyId === comm.id && (
                <div className="bcp-reply-input-box animate-fade-in">
                  <input
                    type="text"
                    className="reply-input-field"
                    placeholder="Tulis balasan..."
                    value={replyTextMap[comm.id] || ''}
                    autoFocus
                    onChange={(e) =>
                      setReplyTextMap({ ...replyTextMap, [comm.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostReply(comm.id);
                      if (e.key === 'Escape') setActiveReplyId(null);
                    }}
                  />
                  <button
                    className="reply-submit-btn"
                    onClick={() => handlePostReply(comm.id)}
                  >
                    Kirim
                  </button>
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <div className="bcp-empty-state">
              Belum ada komentar di blok ini. Tulis tanggapan atau catatan pertama di bawah.
            </div>
          )}
        </div>

        {/* New Comment Input at Bottom */}
        <div className="bcp-input-zone">
          <textarea
            ref={textareaRef}
            className="bcp-textarea"
            placeholder="Tulis komentar... (Tekan ⌘+Enter untuk kirim)"
            rows={2}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handlePostComment(e);
              }
            }}
          />
          <div className="bcp-input-footer">
            <span className="bcp-hint">⌘ + Enter untuk mengirim</span>
            <button
              id="btn-post-block-comment"
              className="bcp-send-btn"
              disabled={!newCommentText.trim()}
              onClick={handlePostComment}
            >
              <Send size={13} />
              <span>Kirim</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
