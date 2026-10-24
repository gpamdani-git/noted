import React, { useState } from 'react';
import { Video, ExternalLink, Copy, Check, Pencil, X, Play } from 'lucide-react';
import './VideoEmbedBlock.css';

export const VideoEmbedBlock = ({ block, onUpdateBlock, isLocked = false }) => {
  const [inputUrl, setInputUrl] = useState(block.url || '');
  const [isEditing, setIsEditing] = useState(!block.url);
  const [copied, setCopied] = useState(false);

  // Extract video provider & embed URL
  const parseVideoUrl = (rawUrl) => {
    if (!rawUrl) return null;
    const url = rawUrl.trim();

    // YouTube regex
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i
    );
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0&enablejsapi=1`
      };
    }

    // Vimeo regex
    const vimeoMatch = url.match(
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+))/i
    );
    if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[1])) {
      const vimeoId = vimeoMatch[3] || vimeoMatch[1];
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`
      };
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return {
        type: 'direct',
        embedUrl: url
      };
    }

    // Fallback iframe embed
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    return {
      type: 'generic',
      embedUrl: cleanUrl
    };
  };

  const videoData = parseVideoUrl(block.url);

  const handleSaveUrl = (e) => {
    e?.preventDefault();
    if (!inputUrl.trim() || isLocked) return;
    const clean = inputUrl.trim().startsWith('http')
      ? inputUrl.trim()
      : `https://${inputUrl.trim()}`;

    onUpdateBlock({
      url: clean
    });
    setIsEditing(false);
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (block.url) {
      navigator.clipboard.writeText(block.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenOriginal = (e) => {
    e.stopPropagation();
    if (block.url) {
      window.open(block.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="notion-video-wrapper">
      {isEditing && !isLocked ? (
        <form className="notion-video-input-box animate-popover" onSubmit={handleSaveUrl}>
          <Video size={16} className="video-input-icon" />
          <input
            type="text"
            className="video-url-input"
            placeholder="Paste video link (YouTube, Vimeo, MP4)..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            autoFocus
          />
          <button type="submit" className="video-submit-btn" disabled={!inputUrl.trim()}>
            Embed video
          </button>
          {block.url && (
            <button
              type="button"
              className="video-cancel-btn"
              onClick={() => setIsEditing(false)}
              title="Cancel"
            >
              <X size={14} />
            </button>
          )}
        </form>
      ) : (
        <div className="notion-video-container">
          <div className="notion-video-frame-container">
            {videoData?.type === 'direct' ? (
              <video
                src={videoData.embedUrl}
                controls
                className="notion-video-element"
                playsInline
              />
            ) : videoData?.embedUrl ? (
              <iframe
                src={videoData.embedUrl}
                title="Video embed"
                className="notion-video-element"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="notion-video-placeholder">
                <Play size={32} className="video-placeholder-icon" />
                <span>No video source provided</span>
              </div>
            )}

            {/* Hover Floating Controls */}
            {!isLocked && block.url && (
              <div className="video-hover-actions">
                <button
                  type="button"
                  className="video-action-btn"
                  onClick={handleCopy}
                  title="Copy video link"
                >
                  {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
                </button>
                <button
                  type="button"
                  className="video-action-btn"
                  onClick={() => {
                    setInputUrl(block.url || '');
                    setIsEditing(true);
                  }}
                  title="Change video URL"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  className="video-action-btn"
                  onClick={handleOpenOriginal}
                  title="Open in new window"
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          <input
            type="text"
            className="video-caption-input"
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
