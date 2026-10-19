import React, { useState, useRef, useEffect } from 'react';
import { AtSign, ArrowUp, X } from 'lucide-react';
import { getCurrentUser } from '../../utils/comments';
import './NotionInlineCommentPill.css';

export const NotionInlineCommentPill = ({
  placeholder = 'comment on',
  onSubmit,
  onCancel
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const user = getCurrentUser();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    if (onSubmit) {
      onSubmit(text.trim());
    }
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) onCancel();
    }
  };

  return (
    <div className="notion-inline-comment-pill animate-popover" onClick={(e) => e.stopPropagation()}>
      <div className="pill-avatar-indicator" style={{ backgroundColor: user.color || '#00897b' }}>
        {user.avatar || 'D'}
      </div>
      <input
        ref={inputRef}
        type="text"
        className="pill-text-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="pill-actions-row">
        <button
          type="button"
          className="pill-icon-btn"
          title="Mention a person or page"
          onClick={() => setText((prev) => prev + '@')}
        >
          <AtSign size={14} />
        </button>
        <button
          type="button"
          className={`pill-submit-circle-btn ${text.trim() ? 'active' : ''}`}
          disabled={!text.trim()}
          onClick={handleSubmit}
          title="Post comment (Enter)"
        >
          <ArrowUp size={13} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="pill-icon-btn pill-cancel-btn"
          title="Cancel (Esc)"
          onClick={onCancel}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
