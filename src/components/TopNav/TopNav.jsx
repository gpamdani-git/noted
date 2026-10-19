import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  ChevronDown,
  MessageSquare,
  Sparkles,
  Users,
  Globe,
  Check,
  Star,
  Link2,
  MoreHorizontal,
  Download,
  Printer,
  Copy,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { NotionOptionsMenu } from './NotionOptionsMenu';
import { DiscussionsPopover } from '../Navigation/DiscussionsPopover';
import { getUnresolvedCount } from '../../utils/comments';
import { downloadMarkdownFile, pageToMarkdown } from '../../utils/markdown';
import './TopNav.css';

export const TopNav = ({
  page,
  onOpenAI,
  onOpenComments,
  onToggleFavorite,
  onUpdatePage,
  onDuplicatePage,
  onDeletePage,
  onOpenHistory,
  onOpenAnalytics,
  onOpenImportModal,
  theme,
  onToggleTheme,
  cloudSyncStatus = 'synced',
  lastSyncedAt = null,
  onTriggerCloudSync
}) => {
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [privacySetting, setPrivacySetting] = useState('Private');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showDiscussions, setShowDiscussions] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [copiedPageLink, setCopiedPageLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const privacyRef = useRef(null);
  const shareMenuRef = useRef(null);
  const discussionsMenuRef = useRef(null);
  const optionsMenuRef = useRef(null);

  // Unresolved comments count for Kategori F
  const [unresolvedComments, setUnresolvedComments] = useState(() =>
    page ? getUnresolvedCount(page.id) : 0
  );

  useEffect(() => {
    if (!page) return;
    setUnresolvedComments(getUnresolvedCount(page.id));
    const handleUpdate = () => setUnresolvedComments(getUnresolvedCount(page.id));
    window.addEventListener('noted_comments_updated', handleUpdate);
    return () => window.removeEventListener('noted_comments_updated', handleUpdate);
  }, [page?.id]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (privacyRef.current && !privacyRef.current.contains(e.target)) {
        setShowPrivacyMenu(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
        setShowShareMenu(false);
      }
      if (discussionsMenuRef.current && !discussionsMenuRef.current.contains(e.target)) {
        setShowDiscussions(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowPrivacyMenu(false);
        setShowShareMenu(false);
        setShowDiscussions(false);
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedPageLink(true);
    setTimeout(() => setCopiedPageLink(false), 1500);
  };

  const handleCopyMarkdown = () => {
    if (!page) return;
    const md = pageToMarkdown(page);
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  if (!page) return null;

  return (
    <div className="noted-sub-breadcrumb-bar">
      {/* Left: Breadcrumbs & Privacy Badge ala Notion Desktop */}
      <div className="breadcrumb-bar-left">
        <div className="breadcrumb-title-link">
          <span className="breadcrumb-page-icon">{page.icon || '📄'}</span>
          <span className="breadcrumb-page-title">{page.title || 'Untitled'}</span>
        </div>

        {/* Notion-style "🔒 Private ˅" Selector */}
        <div className="breadcrumb-privacy-wrap" ref={privacyRef}>
          <button
            className="breadcrumb-privacy-btn"
            onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
            title="Page sharing and permissions"
          >
            <Lock size={12} className="privacy-lock-icon" />
            <span>{privacySetting}</span>
            <ChevronDown size={11} className="privacy-chevron-icon" />
          </button>

          {showPrivacyMenu && (
            <div className="privacy-dropdown-menu animate-popover">
              <div className="dropdown-title">Sharing & Access</div>
              <button
                className={`dropdown-item ${privacySetting === 'Private' ? 'active-privacy' : ''}`}
                onClick={() => {
                  setPrivacySetting('Private');
                  setShowPrivacyMenu(false);
                }}
              >
                <Lock size={13} />
                <span>Private (Only you)</span>
                {privacySetting === 'Private' && <Check size={13} className="check-icon" />}
              </button>
              <button
                className={`dropdown-item ${privacySetting === 'Workspace' ? 'active-privacy' : ''}`}
                onClick={() => {
                  setPrivacySetting('Workspace');
                  setShowPrivacyMenu(false);
                }}
              >
                <Users size={13} />
                <span>Workspace (Team members)</span>
                {privacySetting === 'Workspace' && <Check size={13} className="check-icon" />}
              </button>
              <button
                className={`dropdown-item ${privacySetting === 'Public' ? 'active-privacy' : ''}`}
                onClick={() => {
                  setPrivacySetting('Public');
                  setShowPrivacyMenu(false);
                }}
              >
                <Globe size={13} />
                <span>Public Web (Anyone with link)</span>
                {privacySetting === 'Public' && <Check size={13} className="check-icon" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: All Page Action Buttons (Moved down from TabBar as requested) */}
      <div className="breadcrumb-bar-right">
        {/* Share Button matching Notion Desktop */}
        <div className="tab-menu-wrapper" ref={shareMenuRef}>
          <button
            className={`tab-share-text-btn ${showShareMenu ? 'active' : ''}`}
            onClick={() => setShowShareMenu(!showShareMenu)}
            title="Share & Export"
          >
            <Lock size={12} className="share-lock-icon" />
            <span>Share</span>
          </button>

          {showShareMenu && (
            <div className="notion-share-popover animate-popover">
              <div className="dropdown-title">Share & Export</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  downloadMarkdownFile(page);
                  setShowShareMenu(false);
                }}
              >
                <Download size={14} />
                <span>Export as Markdown (.md)</span>
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowShareMenu(false);
                  window.print();
                }}
              >
                <Printer size={14} />
                <span>Export to PDF / Print</span>
              </button>
              <button className="dropdown-item" onClick={handleCopyMarkdown}>
                {copiedMarkdown ? (
                  <>
                    <Check size={14} className="text-green" />
                    <span>Markdown Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Markdown to Clipboard</span>
                  </>
                )}
              </button>
              <div className="menu-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  if (onOpenImportModal) onOpenImportModal();
                  setShowShareMenu(false);
                }}
              >
                <Sparkles size={14} className="text-ai-purple" />
                <span>Import AI Chat / Markdown</span>
              </button>
              <div className="menu-divider" />
              <button className="dropdown-item" onClick={handleCopyPageLink}>
                {copiedPageLink ? (
                  <>
                    <Check size={14} className="text-green" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={14} />
                    <span>Copy Page Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Discussions / Add Comment Button */}
        <div className="tab-menu-wrapper" ref={discussionsMenuRef}>
          <button
            className={`breadcrumb-comments-btn ${showDiscussions ? 'active' : ''}`}
            onClick={() => setShowDiscussions(!showDiscussions)}
            title={unresolvedComments > 0 ? `${unresolvedComments} unread comments` : 'Open comments'}
          >
            <MessageSquare size={13} />
            <span>
              {unresolvedComments > 0 ? `${unresolvedComments} comments` : 'Add comment'}
            </span>
            {unresolvedComments > 0 && <span className="breadcrumb-comment-dot" />}
          </button>

          {showDiscussions && (
            <DiscussionsPopover
              pageId={page?.id}
              pageTitle={page?.title || 'Page'}
              onOpenFullComments={onOpenComments}
              onClose={() => setShowDiscussions(false)}
            />
          )}
        </div>

        {/* Ask AI ghost button */}
        <button
          className="breadcrumb-ai-btn"
          onClick={onOpenAI}
          title="Hudbird AI Assistant (Space / ⌘J)"
        >
          <Sparkles size={13} className="ai-ghost-sparkle" />
          <span>Ask AI</span>
        </button>

        {/* Copy Page Link Button */}
        <button
          className={`tab-toolbar-btn ${copiedPageLink ? 'copied' : ''}`}
          onClick={handleCopyPageLink}
          title={copiedPageLink ? 'Tautan disalin ke clipboard!' : 'Salin tautan halaman'}
        >
          {copiedPageLink ? <Check size={13} className="text-green" /> : <Link2 size={13} />}
        </button>

        {/* Notion PostgreSQL Cloud Sync Status Indicator */}
        <button
          className={`tab-toolbar-btn cloud-sync-btn ${cloudSyncStatus}`}
          onClick={onTriggerCloudSync}
          title={
            cloudSyncStatus === 'syncing'
              ? 'Sedang menyinkronkan ke PostgreSQL...'
              : cloudSyncStatus === 'synced'
              ? `Tersimpan di Cloud PostgreSQL${lastSyncedAt ? ` (${new Date(lastSyncedAt).toLocaleTimeString()})` : ''}`
              : cloudSyncStatus === 'offline'
              ? 'Mode Offline - Tersimpan aman di IndexedDB Vault'
              : 'Mode Tamu - Tersimpan di Local Vault'
          }
        >
          {cloudSyncStatus === 'syncing' ? (
            <RefreshCw size={13} className="spin-icon text-muted" />
          ) : cloudSyncStatus === 'synced' ? (
            <CloudCheck size={14} className="text-green-500" />
          ) : cloudSyncStatus === 'offline' ? (
            <CloudOff size={14} className="text-amber-500" />
          ) : (
            <Cloud size={14} className="text-muted" />
          )}
        </button>

        {/* Favorite Star Button */}
        <button
          className={`tab-toolbar-btn ${page.isFavorite ? 'favorited' : ''}`}
          onClick={() => onToggleFavorite && onToggleFavorite(page.id)}
          title={page.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
        >
          <Star size={13} className={page.isFavorite ? 'star-filled' : ''} />
        </button>

        {/* Options Menu Button ("...") */}
        <div className="tab-menu-wrapper" ref={optionsMenuRef}>
          <button
            id="nav-options-btn"
            className={`tab-toolbar-btn ${showOptionsMenu ? 'active' : ''}`}
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            title="Style and layout settings"
          >
            <MoreHorizontal size={14} />
          </button>

          {showOptionsMenu && (
            <NotionOptionsMenu
              page={page}
              onUpdatePage={onUpdatePage}
              onDuplicatePage={onDuplicatePage}
              onDeletePage={onDeletePage}
              onCopyLink={handleCopyPageLink}
              onOpenHistory={onOpenHistory}
              onOpenAnalytics={onOpenAnalytics}
              onOpenImport={onOpenImportModal}
              onOpenComments={onOpenComments}
              onExportMarkdown={() => downloadMarkdownFile(page)}
              onPrintPDF={() => window.print()}
              onClose={() => setShowOptionsMenu(false)}
              theme={theme}
              onToggleTheme={onToggleTheme}
            />
          )}
        </div>
      </div>
    </div>
  );
};
