import React, { useState } from 'react';
import { EMOJI_CATEGORIES } from '../../constants/emojis';
import { Search, X } from 'lucide-react';
import './EmojiPicker.css';

export const EmojiPicker = ({ onSelect, onClose, onRemove }) => {
  const [search, setSearch] = useState('');

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    name: cat.name,
    emojis: cat.emojis.filter(e => !search || e.includes(search))
  })).filter(cat => cat.emojis.length > 0);

  return (
    <div className="emoji-picker-popover animate-popover" onClick={(e) => e.stopPropagation()}>
      <div className="emoji-picker-header">
        <div className="emoji-search-wrapper">
          <Search size={14} className="emoji-search-icon" />
          <input
            type="text"
            placeholder="Filter emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="emoji-search-input"
          />
        </div>
        {onRemove && (
          <button className="emoji-remove-btn" onClick={onRemove} title="Remove icon">
            Remove
          </button>
        )}
        <button className="emoji-close-btn" onClick={onClose}>
          <X size={14} />
        </button>
      </div>

      <div className="emoji-grid-container">
        {filteredCategories.map(cat => (
          <div key={cat.name} className="emoji-category-section">
            <div className="emoji-category-title">{cat.name}</div>
            <div className="emoji-grid">
              {cat.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  className="emoji-btn"
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="emoji-empty-state">No emojis found</div>
        )}
      </div>
    </div>
  );
};
