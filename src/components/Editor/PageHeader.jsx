import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import {
  Smile,
  Image,
  X,
  Link2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  MessageSquare,
  CornerDownRight,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Send,
  ExternalLink,
  Plus,
  Sparkles
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { CoverPickerModal } from './CoverPickerModal';
import {
  getPageLevelComments,
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
import './PageHeader.css';

export const PageHeader = ({
  page,
  onUpdatePage,
  fullWidth,
  backlinks = [],
  onNavigatePage,
  onOpenCommentsDrawer
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(false);

  // Kategori F: Page Discussions State
  const [pageComments, setPageComments] = useState(() => getPageLevelComments(page.id));
  const [isDiscussionExpanded, setIsDiscussionExpanded] = useState(false);
  const [currentUser, setUser] = useState(getCurrentUser());
  const [newCommentText, setNewCommentText] = useState('');
  const [inlineReplyTextMap, setInlineReplyTextMap] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const refreshPageComments = () => {
    if (!page?.id) return;
    setPageComments(getPageLevelComments(page.id));
  };

  useEffect(() => {
    refreshPageComments();
    setUser(getCurrentUser());
  }, [page.id]);

  useEffect(() => {
    const handleUpdate = () => {
      refreshPageComments();
    };
    window.addEventListener('noted_comments_updated', handleUpdate);
    return () => window.removeEventListener('noted_comments_updated', handleUpdate);
  }, [page.id]);

  const handlePostPageComment = (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment({
      pageId: page.id,
      blockId: null,
      text: newCommentText,
      author: currentUser
    });
    setNewCommentText('');
    refreshPageComments();
  };

  const handlePostInlineReply = (commentId) => {
    const text = inlineReplyTextMap[commentId];
    if (!text || !text.trim()) return;
    addReply({
      commentId,
      text,
      author: currentUser
    });
    setInlineReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
    refreshPageComments();
  };

  const handleToggleResolveInline = (commentId) => {
    toggleResolveComment(commentId);
    refreshPageComments();
  };

  const handleDeleteInlineComment = (commentId) => {
    deleteComment(commentId);
    refreshPageComments();
  };

  const handleDeleteInlineReply = (commentId, replyId) => {
    deleteReply(commentId, replyId);
    refreshPageComments();
  };

  const handleSelectPersona = (u) => {
    setCurrentUser(u);
    setUser(u);
    setShowPersonaMenu(false);
  };

  const titleTextareaRef = useRef(null);

  const adjustTitleHeight = (el) => {
    const target = el || titleTextareaRef.current;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    if (titleTextareaRef.current) {
      adjustTitleHeight(titleTextareaRef.current);
    }
  }, [page.title]);

  useEffect(() => {
    const handleResize = () => {
      if (titleTextareaRef.current) adjustTitleHeight(titleTextareaRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTitleChange = (e) => {
    if (page.isLocked) return;
    onUpdatePage({ title: e.target.value });
  };

  const handleAddIcon = () => {
    if (page.isLocked) return;
    onUpdatePage({ icon: '📝' });
    setShowEmojiPicker(true);
  };

  const handleAddCover = () => {
    if (page.isLocked) return;
    setShowCoverModal(true);
  };

  const isGradient = page.cover && page.cover.startsWith('linear-gradient');
  const isImage = page.cover && !isGradient;

  const widthClass = fullWidth ? 'page-full-width' : 'page-standard-width';

  return (
    <div className="page-header-container">
      {/* Cover Image Area */}
      {page.cover && (
        <div
          className="page-cover-banner"
          style={
            isGradient
              ? { background: page.cover }
              : isImage
              ? { backgroundImage: `url(${page.cover})` }
              : {}
          }
        >
          {!page.isLocked && (
            <div className="cover-controls-overlay">
              <button
                className="cover-control-btn"
                onClick={() => setShowCoverModal(true)}
              >
                <Image size={14} />
                <span>Change Cover</span>
              </button>
              <button
                className="cover-control-btn remove-btn"
                onClick={() => onUpdatePage({ cover: null })}
              >
                <X size={14} />
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Header Content */}
      <div className={`page-header-content ${widthClass} ${page.cover ? 'has-cover' : ''}`}>
        {/* Page Icon (Emoji) */}
        {page.icon ? (
          <div className="page-icon-wrapper">
            <button
              className="page-icon-btn"
              onClick={() => !page.isLocked && setShowEmojiPicker(!showEmojiPicker)}
              title={page.isLocked ? 'Halaman terkunci' : 'Change icon'}
              style={page.isLocked ? { cursor: 'default' } : {}}
            >
              {page.icon}
            </button>
            {!page.isLocked && showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  onUpdatePage({ icon: emoji });
                  setShowEmojiPicker(false);
                }}
                onClose={() => setShowEmojiPicker(false)}
                onRemove={() => {
                  onUpdatePage({ icon: null });
                  setShowEmojiPicker(false);
                }}
              />
            )}
          </div>
        ) : (
          !page.isLocked && (
            <div className="page-header-actions-bar">
              <button className="header-action-btn" onClick={handleAddIcon}>
                <Smile size={14} />
                <span>Add icon</span>
              </button>
              {!page.cover && (
                <button className="header-action-btn" onClick={handleAddCover}>
                  <Image size={14} />
                  <span>Add cover</span>
                </button>
              )}
            </div>
          )
        )}

        {/* When icon exists but cover doesn't, allow adding cover on hover */}
        {!page.isLocked && page.icon && !page.cover && (
          <div className="page-header-actions-bar inline-actions">
            <button className="header-action-btn" onClick={handleAddCover}>
              <Image size={14} />
              <span>Add cover</span>
            </button>
          </div>
        )}

        {/* Page Title */}
        <textarea
          ref={titleTextareaRef}
          rows={1}
          className="page-title-input"
          value={page.title || ''}
          placeholder="Untitled"
          readOnly={!!page.isLocked}
          disabled={!!page.isLocked}
          style={page.isLocked ? { cursor: 'default', userSelect: 'text' } : {}}
          onInput={(e) => adjustTitleHeight(e.target)}
          onChange={(e) => {
            handleTitleChange(e);
            adjustTitleHeight(e.target);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
        />

        {/* Bidirectional Backlinks Section */}
        {backlinks && backlinks.length > 0 && (
          <div className="page-backlinks-section">
            <button
              className={`backlinks-toggle-btn ${showBacklinks ? 'open' : ''}`}
              onClick={() => setShowBacklinks(!showBacklinks)}
            >
              <Link2 size={13} className="backlink-icon" />
              <span>
                {backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}
              </span>
              {showBacklinks ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {showBacklinks && (
              <div className="backlinks-drawer animate-popover">
                <div className="backlinks-drawer-header">Pages that link to this page</div>
                <div className="backlinks-list">
                  {backlinks.map((bPage) => (
                    <div
                      key={bPage.id}
                      className="backlink-card"
                      onClick={() => onNavigatePage && onNavigatePage(bPage.id)}
                    >
                      <span className="backlink-page-icon">{bPage.icon || '📄'}</span>
                      <div className="backlink-page-info">
                        <span className="backlink-page-title">{bPage.title || 'Untitled'}</span>
                        <span className="backlink-page-snippet">{bPage.snippet || 'Referenced in page blocks'}</span>
                      </div>
                      <ArrowUpRight size={13} className="backlink-arrow" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page Discussion Section (Kategori F - Notion REA Design) */}
        <div className="page-header-discussion-bar">
          <div className="discussion-bar-header-row">
            <button
              id="btn-header-page-comments"
              className={`page-discussion-trigger-btn ${isDiscussionExpanded ? 'is-active' : ''} ${
                pageComments.filter((c) => !c.resolved).length > 0 ? 'has-comments' : ''
              }`}
              onClick={() => setIsDiscussionExpanded(!isDiscussionExpanded)}
              title="Klik untuk membuka / menutup diskusi cepat halaman ini"
            >
              <MessageSquare size={13} className="text-accent" />
              <span>
                {pageComments.length > 0
                  ? `${pageComments.filter((c) => !c.resolved).length} diskusi halaman`
                  : 'Tambah komentar halaman...'}
              </span>
              {pageComments.length > 0 && (
                <span className="discussion-trigger-chevron">
                  {isDiscussionExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              )}
            </button>

            {/* Quick button to open side drawer */}
            <button
              id="btn-header-open-drawer"
              className="page-discussion-drawer-shortcut-btn"
              onClick={onOpenCommentsDrawer}
              title="Buka semua komentar & diskusi di panel samping"
            >
              <ExternalLink size={12} />
              <span>Panel Samping</span>
            </button>
          </div>

          {/* Expanded Inline Discussion Box */}
          {isDiscussionExpanded && (
            <div className="page-inline-discussions animate-fade-in">
              <div className="pid-header">
                <div className="pid-title-group">
                  <span className="pid-title">Diskusi Cepat Dokumen</span>
                  <span className="pid-count">
                    {pageComments.filter((c) => !c.resolved).length} aktif / {pageComments.length} total
                  </span>
                </div>

                <div className="pid-header-actions">
                  {/* Persona Switcher in PageHeader */}
                  <div className="pid-persona-selector">
                    <button
                      id="btn-inline-persona-switcher"
                      className="pid-persona-btn"
                      onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                      title={`Komentar sebagai: ${currentUser.name}`}
                    >
                      <span
                        className="user-avatar-badge micro"
                        style={{ backgroundColor: currentUser.color }}
                      >
                        {currentUser.avatar}
                      </span>
                      <span>{currentUser.name.split(' ')[0]}</span>
                    </button>
                    {showPersonaMenu && (
                      <div className="pid-persona-dropdown animate-popover">
                        <div className="pid-dropdown-title">Komentar Sebagai</div>
                        {AVAILABLE_USERS.map((u) => (
                          <div
                            key={u.id}
                            className={`pid-persona-item ${u.id === currentUser.id ? 'active' : ''}`}
                            onClick={() => handleSelectPersona(u)}
                          >
                            <span
                              className="user-avatar-badge micro"
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
                    id="btn-close-inline-discussion"
                    className="pid-close-btn"
                    onClick={() => setIsDiscussionExpanded(false)}
                    title="Tutup diskusi cepat"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Inline Comments Feed */}
              {pageComments.length > 0 && (
                <div className="pid-comments-list">
                  {pageComments.map((comm) => (
                    <div
                      key={comm.id}
                      className={`pid-comment-card ${comm.resolved ? 'is-resolved' : ''}`}
                    >
                      <div className="pid-comment-main">
                        <span
                          className="user-avatar-badge mini"
                          style={{ backgroundColor: comm.author.color }}
                        >
                          {comm.author.avatar}
                        </span>
                        <div className="pid-comment-body">
                          <div className="pid-comment-meta">
                            <span className="pid-author-name">{comm.author.name}</span>
                            <span className="pid-comment-time">
                              {formatCommentTime(comm.createdAt)}
                            </span>
                            {comm.resolved && (
                              <span className="pid-resolved-tag">Selesai</span>
                            )}
                          </div>
                          <div className="pid-comment-text">{comm.text}</div>

                          <div className="pid-actions-row">
                            <button
                              className="pid-act-btn"
                              onClick={() =>
                                setActiveReplyId(activeReplyId === comm.id ? null : comm.id)
                              }
                            >
                              <CornerDownRight size={11} />
                              <span>Balas</span>
                            </button>
                            <button
                              className={`pid-act-btn ${comm.resolved ? 'reopen' : 'resolve'}`}
                              onClick={() => handleToggleResolveInline(comm.id)}
                            >
                              {comm.resolved ? <RotateCcw size={11} /> : <CheckCircle2 size={11} />}
                              <span>{comm.resolved ? 'Buka Kembali' : 'Selesaikan'}</span>
                            </button>
                            <button
                              className="pid-act-btn delete"
                              onClick={() => handleDeleteInlineComment(comm.id)}
                              title="Hapus diskusi ini"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies Thread */}
                      {comm.replies && comm.replies.length > 0 && (
                        <div className="pid-replies-thread">
                          {comm.replies.map((rep) => (
                            <div key={rep.id} className="pid-reply-item">
                              <span
                                className="user-avatar-badge micro"
                                style={{ backgroundColor: rep.author.color }}
                              >
                                {rep.author.avatar}
                              </span>
                              <div className="pid-reply-content">
                                <div className="pid-comment-meta">
                                  <span className="pid-author-name">{rep.author.name}</span>
                                  <span className="pid-comment-time">
                                    {formatCommentTime(rep.createdAt)}
                                  </span>
                                  <button
                                    className="pid-reply-delete"
                                    onClick={() => handleDeleteInlineReply(comm.id, rep.id)}
                                    title="Hapus balasan"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                                <div className="pid-reply-text">{rep.text}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input Form */}
                      {activeReplyId === comm.id && (
                        <div className="pid-reply-form animate-fade-in">
                          <input
                            type="text"
                            className="pid-reply-input"
                            placeholder={`Balas sebagai ${currentUser.name.split(' ')[0]}...`}
                            value={inlineReplyTextMap[comm.id] || ''}
                            autoFocus
                            onChange={(e) =>
                              setInlineReplyTextMap({
                                ...inlineReplyTextMap,
                                [comm.id]: e.target.value
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePostInlineReply(comm.id);
                              if (e.key === 'Escape') setActiveReplyId(null);
                            }}
                          />
                          <button
                            className="pid-reply-send-btn"
                            onClick={() => handlePostInlineReply(comm.id)}
                          >
                            Kirim
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Discussion Composer */}
              <div className="pid-composer-box">
                <div className="pid-composer-avatar-row">
                  <span
                    className="user-avatar-badge mini"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.avatar}
                  </span>
                  <input
                    id="input-inline-page-comment"
                    type="text"
                    className="pid-composer-input"
                    placeholder="Tulis diskusi baru di bawah judul halaman ini..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostPageComment();
                    }}
                  />
                  <button
                    id="btn-submit-inline-comment"
                    className="pid-submit-btn"
                    disabled={!newCommentText.trim()}
                    onClick={handlePostPageComment}
                  >
                    <Send size={12} />
                    <span>Kirim</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cover Picker Modal */}
      {showCoverModal && (
        <CoverPickerModal
          currentCover={page.cover}
          onSelect={(cover) => onUpdatePage({ cover })}
          onRemove={() => onUpdatePage({ cover: null })}
          onClose={() => setShowCoverModal(false)}
        />
      )}
    </div>
  );
};
