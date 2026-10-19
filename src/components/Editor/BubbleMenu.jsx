import React, { useState } from 'react';
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Palette, Sparkles } from 'lucide-react';
import './BubbleMenu.css';

const COLOR_OPTIONS = [
  { label: 'Default', value: 'default', color: 'var(--text-primary)' },
  { label: 'Blue', value: '#337ea9', color: '#337ea9' },
  { label: 'Green', value: '#448361', color: '#448361' },
  { label: 'Orange', value: '#d9730d', color: '#d9730d' },
  { label: 'Red', value: '#d44c47', color: '#d44c47' },
  { label: 'Purple', value: '#9065b0', color: '#9065b0' },
];

export const BubbleMenu = ({ position, onFormat, onTriggerAI, onClose }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!position) return null;

  return (
    <div
      className="bubble-menu-toolbar"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="bubble-btn bubble-ai-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onTriggerAI && onTriggerAI()}
        title="Ask Hudbird AI to edit or improve text"
      >
        <Sparkles size={13} className="text-ai-sparkle" />
        <span className="bubble-ai-label">Ask AI</span>
      </button>

      <div className="bubble-divider" />

      <button
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('bold')}
        title="Bold (Cmd+B)"
      >
        <Bold size={14} />
      </button>
      <button
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('italic')}
        title="Italic (Cmd+I)"
      >
        <Italic size={14} />
      </button>
      <button
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('strikethrough')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </button>
      <button
        className="bubble-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onFormat('code')}
        title="Inline Code"
      >
        <Code size={14} />
      </button>

      <div className="bubble-divider" />

      <button
        className={`bubble-btn ${showColorPicker ? 'active' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShowColorPicker(!showColorPicker)}
        title="Color"
      >
        <Palette size={14} />
      </button>

      {showColorPicker && (
        <div className="bubble-color-dropdown animate-popover" onMouseDown={(e) => e.preventDefault()}>
          <div className="bubble-dropdown-title">Text Color</div>
          <div className="bubble-colors-list">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                className="bubble-color-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onFormat('color', c.value);
                  setShowColorPicker(false);
                }}
              >
                <span className="bubble-color-dot" style={{ backgroundColor: c.color }} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

