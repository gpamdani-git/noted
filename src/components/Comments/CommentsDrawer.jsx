import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  CheckCircle2,
  RotateCcw,
  Trash2,
  CornerDownRight,
  Send,
  ExternalLink,
  Filter,
  Check,
  User,
  Sparkles
} from 'lucide-react';
import {
  getPageComments,
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
import './CommentsDrawer.css';

export const CommentsDrawer = ({
  isOpen,
  onClose,
  page,
  onJumpToBlock
}) => {
  const [filterTab, setFilterTab] = useState('open'); // 'open' | 'resolved'
  const [comments, setComments] = useState([]);
  const [currentUser, setUser] = useState(getCurrentUser());
  const [newPageCommentText, setNewPageCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const drawerRef = useRef(null);

  const refreshComments = () => {
    if (!page?.id) return;
    const list = getPageComments(page.id);
    setComments(list);
  };

  useEffect(() => {
    if (isOpen && page) {
      refreshComments();
      setUser(getCurrentUser());
      setActiveReplyId(null);
    }
  }, [isOpen, page?.id]);

  // Listen to external comment updates
  useEffect(() => {
    const handleUpdate = () => {
      refreshComments();
    };
    window.addEventListener('noted_comments_updated', handleUpdate);
    return () => window.removeEventListener('noted_comments_updated', handleUpdate);
  }, [page?.id]);

  // Handle Escape key
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

  if (!isOpen || !page) return null;

  const openComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);
  const activeList = filterTab === 'open' ? openComments : resolvedComments;

  const handlePostPageComment = (e) => {
    if (e) e.preventDefault();
    if (!newPageCommentText.trim()) return;
    addComment({
      pageId: page.id,
      blockId: null, // Page-level
      text: newPageCommentText,
      author: currentUser
    });
    setNewPageCommentText('');
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

  const getBlockSnippet = (blockId) => {
    if (!blockId || !page.blocks) return null;
    const found = page.blocks.find((b) => b.id === blockId);
    if (!found) return 'Blok Dokumen';
    const raw = found.text || found.code || found.url || found.caption || found.title || found.type;
    return raw.length > 45 ? `${raw.slice(0, 45)}...` : raw;
  };

  return (
    <div className="comments-drawer-backdrop" onClick={onClose}>
      <div
        className="comments-drawer-container animate-slide-left"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="cd-header">
          <div className="cd-header-main">
            <div className="cd-header-title-row">
              <div className="cd-badge">
                <MessageSquare size={15} className="text-accent" />
                <span>Page Discussions</span>
              </div>
              <div className="cd-page-meta" title={page.title || 'Untitled'}>
                <span className="cd-page-icon">{page.icon || '📄'}</span>
                <span className="cd-page-title">{page.title || 'Untitled'}</span>
              </div>
            </div>

            <div className="cd-header-controls">
              {/* Persona Switcher */}
              <div className="cd-persona-wrapper">
                <button
                  id="btn-comments-persona-switcher"
                  className="cd-persona-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={`Aktif sebagai: ${currentUser.name}`}
                >
                  <span
                    className="user-avatar-badge"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.avatar}
                  </span>
                  <span className="user-name-short">{currentUser.name.split(' ')[0]}</span>
                </button>
                {showUserMenu && (
                  <div className="user-persona-dropdown animate-popover">
                    <div className="user-dropdown-title">Komentar Sebagai</div>
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

              <button
                id="btn-close-comments-drawer"
                className="cd-close-btn"
                onClick={onClose}
                title="Tutup (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs (Open vs Resolved) */}
          <div className="cd-filter-tabs">
            <button
              id="btn-tab-open-comments"
              className={`cd-tab-btn ${filterTab === 'open' ? 'active' : ''}`}
              onClick={() => setFilterTab('open')}
            >
              <span>Aktif</span>
              <span className="cd-tab-count">{openComments.length}</span>
            </button>
            <button
              id="btn-tab-resolved-comments"
              className={`cd-tab-btn ${filterTab === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilterTab('resolved')}
            >
              <span>Selesai</span>
              <span className="cd-tab-count">{resolvedComments.length}</span>
            </button>
          </div>
        </div>

        {/* New Page-level Discussion Composer */}
        <div className="cd-new-discussion-box">
          <div className="cd-composer-header">
            <span
              className="user-avatar-badge mini"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </span>
            <span className="cd-composer-label">Tambah Diskusi Halaman</span>
          </div>
          <div className="cd-composer-input-row">
            <input
              id="input-page-comment"
              type="text"
              className="cd-composer-input"
              placeholder="Tulis tanggapan atau catatan baru untuk halaman ini..."
              value={newPageCommentText}
              onChange={(e) => setNewPageCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePostPageComment();
              }}
            />
            <button
              id="btn-submit-page-comment"
              className="cd-composer-submit-btn"
              disabled={!newPageCommentText.trim()}
              onClick={handlePostPageComment}
            >
              <Send size={13} />
              <span>Kirim</span>
            </button>
          </div>
        </div>

        {/* Comments Feed List */}
        <div className="cd-feed-body">
          {activeList.map((comm) => {
            const blockSnippet = getBlockSnippet(comm.blockId);
            const isBlockComment = !!comm.blockId;

            return (
              <div
                key={comm.id}
                className={`cd-thread-card ${comm.resolved ? 'is-resolved' : ''}`}
              >
                {/* Target context banner */}
                <div className="cd-target-banner">
                  {isBlockComment ? (
                    <button
                      className="cd-jump-block-btn"
                      onClick={() => {
                        if (onJumpToBlock) onJumpToBlock(comm.blockId);
                      }}
                      title="Lompat ke blok ini di halaman"
                    >
                      <MessageSquare size={12} className="text-accent" />
                      <span className="cd-target-type">Komentar Blok:</span>
                      <span className="cd-target-snippet">"{blockSnippet}"</span>
                      <ExternalLink size={11} className="cd-jump-icon" />
                    </button>
                  ) : (
                    <div className="cd-page-discussion-tag">
                      <Sparkles size={12} className="text-purple" />
                      <span>Diskusi Halaman Utama</span>
                    </div>
                  )}

                  {comm.resolved && (
                    <span className="cd-resolved-badge">Selesai</span>
                  )}
                </div>

                {/* Main Comment */}
                <div className="cd-comment-main-row">
                  <span
                    className="comment-author-avatar"
                    style={{ backgroundColor: comm.author.color }}
                  >
                    {comm.author.avatar}
                  </span>
                  <div className="cd-comment-content">
                    <div className="cd-meta-header">
                      <span className="comment-author-name">{comm.author.name}</span>
                      <span className="comment-time">{formatCommentTime(comm.createdAt)}</span>
                    </div>
                    <div className="cd-text-body">{comm.text}</div>

                    {/* Actions */}
                    <div className="cd-actions-row">
                      <button
                        className="cd-act-btn"
                        onClick={() =>
                          setActiveReplyId(activeReplyId === comm.id ? null : comm.id)
                        }
                      >
                        <CornerDownRight size={12} />
                        <span>Balas</span>
                      </button>
                      <button
                        className={`cd-act-btn ${comm.resolved ? 'reopen' : 'resolve'}`}
                        onClick={() => handleToggleResolve(comm.id)}
                        title={comm.resolved ? 'Buka kembali diskusi' : 'Tandai selesai'}
                      >
                        {comm.resolved ? <RotateCcw size={12} /> : <CheckCircle2 size={12} />}
                        <span>{comm.resolved ? 'Buka Kembali' : 'Selesaikan'}</span>
                      </button>
                      <button
                        className="cd-act-btn delete"
                        onClick={() => handleDeleteComment(comm.id)}
                        title="Hapus diskusi ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies Thread */}
                {comm.replies && comm.replies.length > 0 && (
                  <div className="cd-replies-thread">
                    {comm.replies.map((rep) => (
                      <div key={rep.id} className="cd-reply-row">
                        <span
                          className="comment-author-avatar mini"
                          style={{ backgroundColor: rep.author.color }}
                        >
                          {rep.author.avatar}
                        </span>
                        <div className="cd-reply-content">
                          <div className="cd-meta-header">
                            <span className="comment-author-name">{rep.author.name}</span>
                            <span className="comment-time">
                              {formatCommentTime(rep.createdAt)}
                            </span>
                            <button
                              className="cd-reply-delete-btn"
                              onClick={() => handleDeleteReply(comm.id, rep.id)}
                              title="Hapus balasan"
                            >
                              <X size={11} />
                            </button>
                          </div>
                          <div className="cd-reply-text">{rep.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input Form */}
                {activeReplyId === comm.id && (
                  <div className="cd-reply-form animate-fade-in">
                    <input
                      type="text"
                      className="cd-reply-input"
                      placeholder={`Balas sebagai ${currentUser.name.split(' ')[0]}...`}
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
                      className="cd-reply-submit-btn"
                      onClick={() => handlePostReply(comm.id)}
                    >
                      Kirim
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {activeList.length === 0 && (
            <div className="cd-empty-feed">
              <MessageSquare size={32} className="cd-empty-icon" />
              <div className="cd-empty-title">
                {filterTab === 'open'
                  ? 'Tidak ada diskusi aktif'
                  : 'Belum ada diskusi yang diselesaikan'}
              </div>
              <p className="cd-empty-desc">
                {filterTab === 'open'
                  ? 'Tambahkan komentar pada blok teks atau gunakan form di atas untuk memulai diskusi baru di halaman ini.'
                  : 'Diskusi yang telah ditandai selesai akan tersimpan di sini.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
