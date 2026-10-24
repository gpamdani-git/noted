import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Lock,
  Share2,
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
  RefreshCw,
  PanelLeft
} from 'lucide-react';
import { NotionOptionsMenu } from './NotionOptionsMenu';
import { DiscussionsPopover } from '../Navigation/DiscussionsPopover';
import { getUnresolvedCount } from '../../utils/comments';
import { downloadMarkdownFile, pageToMarkdown } from '../../utils/markdown';
import { buildShareablePageUrl } from '../../utils/pageUrl';
import PresenceIndicator from '../Collaboration/PresenceIndicator';
import './TopNav.css';

export const TopNav = ({
  page,
  pages = [],
  onSelectPage,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenAI,
  onOpenComments,
  onToggleFavorite,
  onUpdatePage,
  onDuplicatePage,
  onDeletePage,
  onArchivePage,
  onOpenHistory,
  onOpenAnalytics,
  onOpenImportModal,
  theme,
  onToggleTheme,
  cloudSyncStatus = 'synced',
  lastSyncedAt = null,
  onTriggerCloudSync,
  currentUser,
  onOpenLogin,
  collaborators = [],
  onOpenWebsite
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
    if (!page) return;
    // The desktop app uses its own protocol, the web build a query parameter.
    const link = buildShareablePageUrl(page.id);
    navigator.clipboard.writeText(link);
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

  const ancestors = useMemo(() => {
    if (!pages || !page) return [];
    const trail = [];
    let current = page;
    let guard = 0;
    while (current && current.parentId && guard < 50) {
      guard++;
      const parent = pages.find((p) => p.id === current.parentId);
      if (parent) {
        trail.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return trail;
  }, [pages, page]);

  if (!page) return null;

  return (
    <div className="noted-sub-breadcrumb-bar">
      {/* Left: Breadcrumbs & Privacy Badge ala Notion Desktop */}
      <div className="breadcrumb-bar-left">
        {onToggleSidebar && (
          <button
            className="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          >
            <PanelLeft size={16} />
          </button>
        )}
        <div className="breadcrumb-trail">
          {ancestors.map((anc) => (
            <React.Fragment key={anc.id}>
              <button
                type="button"
                className="breadcrumb-item-btn"
                onClick={() => onSelectPage && onSelectPage(anc.id)}
                title={anc.title || 'Untitled'}
              >
                <span className="breadcrumb-page-icon">{anc.icon || '📄'}</span>
                <span className="breadcrumb-page-title">{anc.title || 'Untitled'}</span>
              </button>
              <span className="breadcrumb-slash">/</span>
            </React.Fragment>
          ))}
          <div className="breadcrumb-title-link active-page">
            <span className="breadcrumb-page-icon">{page.icon || '📄'}</span>
            <span className="breadcrumb-page-title">{page.title || 'Untitled'}</span>
          </div>
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
              <div className="dropdown-item dropdown-item-disabled" title="Per-page permissions are not implemented in this build. Pages are only reachable by the signed-in account.">
                <Users size={13} />
                <span>Workspace (Team members)</span>
                <em className="dropdown-item-note">Not available</em>
              </div>
              <div className="dropdown-item dropdown-item-disabled" title="Publishing a page to the web is not implemented in this build.">
                <Globe size={13} />
                <span>Public Web (Anyone with link)</span>
                <em className="dropdown-item-note">Not available</em>
              </div>
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
            <Share2 size={13} className="share-btn-icon" />
            <span>Share</span>
          </button>

          {showShareMenu && (
            <>
              <div className="notion-share-mobile-backdrop" onClick={() => setShowShareMenu(false)} />
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
                <span>Print / Save as PDF</span>
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
          </>
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
          className={`tab-toolbar-btn copy-link-btn ${copiedPageLink ? 'copied' : ''}`}
          onClick={handleCopyPageLink}
          title={copiedPageLink ? 'Tautan disalin ke clipboard!' : 'Salin tautan halaman'}
        >
          {copiedPageLink ? <Check size={13} className="text-green" /> : <Link2 size={13} />}
        </button>

        {/* Real-time Collaboration Presence Indicator */}
        {collaborators && collaborators.length > 0 && (
          <PresenceIndicator users={collaborators} />
        )}

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

        {/* Visit Noted Website Button */}
        {onOpenWebsite && (
          <button
            className="tab-toolbar-btn website-btn"
            onClick={onOpenWebsite}
            title="Kunjungi Website Noted"
          >
            <Globe size={13} />
          </button>
        )}

        {/* Favorite Star Button */}
        <button
          className={`tab-toolbar-btn star-btn ${page.isFavorite ? 'favorited' : ''}`}
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
              onArchivePage={onArchivePage}
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
              currentUser={currentUser}
              onOpenLogin={onOpenLogin}
              onOpenWebsite={onOpenWebsite}
            />
          )}
        </div>
      </div>
    </div>
  );
};
