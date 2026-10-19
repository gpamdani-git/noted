import React, { useState } from 'react';
import { Bookmark, ExternalLink, Copy, Check, Pencil, Globe, X } from 'lucide-react';
import './WebBookmarkBlock.css';

export const WebBookmarkBlock = ({ block, onUpdateBlock, isLocked = false }) => {
  const [inputUrl, setInputUrl] = useState(block.url || '');
  const [isEditing, setIsEditing] = useState(!block.url);
  const [copied, setCopied] = useState(false);

  // Extract metadata and domain
  const getDomain = (url) => {
    try {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      return u.hostname.replace('www.', '');
    } catch (e) {
      return url || '';
    }
  };

  const domain = getDomain(block.url || '');
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : null;

  // Preset smart metadata hints for famous developer/knowledge sites
  const getSmartMetadata = (url, domain) => {
    const d = domain.toLowerCase();
    if (d.includes('github.com')) {
      return {
        title: 'GitHub: Where the world builds software',
        description: 'GitHub is where over 100 million developers shape the future of software, together.'
      };
    }
    if (d.includes('react.dev')) {
      return {
        title: 'React – The library for web and native user interfaces',
        description: 'React lets you build user interfaces out of individual pieces called components.'
      };
    }
    if (d.includes('notion.so') || d.includes('notion.site')) {
      return {
        title: 'Notion – Connected workspace for wiki, docs & projects',
        description: 'A new tool that blends your everyday work apps into one. It is the all-in-one workspace.'
      };
    }
    if (d.includes('developer.mozilla.org')) {
      return {
        title: 'MDN Web Docs',
        description: 'The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs.'
      };
    }
    return {
      title: block.title || domain,
      description: block.description || `Visit ${domain} to read more.`
    };
  };

  const handleCreateBookmark = (e) => {
    e?.preventDefault();
    if (!inputUrl.trim() || isLocked) return;
    const cleanUrl = inputUrl.trim().startsWith('http')
      ? inputUrl.trim()
      : `https://${inputUrl.trim()}`;
    const dom = getDomain(cleanUrl);
    const meta = getSmartMetadata(cleanUrl, dom);

    onUpdateBlock({
      url: cleanUrl,
      title: meta.title,
      description: meta.description,
      domain: dom
    });
    setIsEditing(false);
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    if (block.url) {
      navigator.clipboard.writeText(block.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenUrl = (e) => {
    e.stopPropagation();
    if (block.url) {
      window.open(block.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="notion-bookmark-wrapper">
      {isEditing && !isLocked ? (
        <form className="notion-bookmark-input-box animate-popover" onSubmit={handleCreateBookmark}>
          <Bookmark size={16} className="bookmark-input-icon" />
          <input
            type="text"
            className="bookmark-url-input"
            placeholder="Paste web link (e.g. https://github.com or react.dev)..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            autoFocus
          />
          <button type="submit" className="bookmark-submit-btn" disabled={!inputUrl.trim()}>
            Create bookmark
          </button>
          {block.url && (
            <button
              type="button"
              className="bookmark-cancel-btn"
              onClick={() => setIsEditing(false)}
              title="Cancel"
            >
              <X size={14} />
            </button>
          )}
        </form>
      ) : (
        <div className="notion-bookmark-container">
          <div
            className="notion-bookmark-card"
            onClick={handleOpenUrl}
            title={`Open ${block.url} in new tab`}
          >
            {/* Left Content Area */}
            <div className="bookmark-content">
              <div className="bookmark-title">
                {block.title || domain || 'Web Bookmark'}
              </div>
              <div className="bookmark-desc">
                {block.description || `Read content on ${domain}...`}
              </div>
              <div className="bookmark-meta">
                {faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt=""
                    className="bookmark-favicon"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe size={13} className="bookmark-globe-icon" />
                )}
                <span className="bookmark-domain">{domain || block.url}</span>
                <ExternalLink size={11} className="bookmark-meta-arrow" />
              </div>
            </div>

            {/* Right Visual Cover */}
            <div className="bookmark-cover">
              <div className="bookmark-cover-badge">
                <Globe size={22} className="bookmark-cover-icon" />
                <span>{domain}</span>
              </div>
            </div>

            {/* Floating Action Buttons on Hover */}
            {!isLocked && (
              <div className="bookmark-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="bookmark-action-btn"
                  onClick={handleCopyLink}
                  title="Copy link"
                >
                  {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                </button>
                <button
                  type="button"
                  className="bookmark-action-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit link"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="bookmark-action-btn"
                  onClick={handleOpenUrl}
                  title="Open in new window"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Optional Caption Input */}
          <input
            type="text"
            className="bookmark-caption-input"
            value={block.caption || ''}
            readOnly={isLocked}
            disabled={isLocked}
            placeholder="Add a caption..."
            onChange={(e) => onUpdateBlock({ caption: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};
