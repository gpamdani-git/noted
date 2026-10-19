import React, { useState } from 'react';
import { COVER_PRESETS } from '../../constants/covers';
import { X, Check } from 'lucide-react';
import './CoverPickerModal.css';

export const CoverPickerModal = ({ currentCover, onSelect, onClose, onRemove }) => {
  const [tab, setTab] = useState('gradients'); // 'gradients' | 'photos'

  const gradients = COVER_PRESETS.filter(p => p.gradient);
  const photos = COVER_PRESETS.filter(p => p.url);

  return (
    <div className="cover-picker-overlay" onClick={onClose}>
      <div className="cover-picker-modal animate-popover" onClick={e => e.stopPropagation()}>
        <div className="cover-picker-header">
          <div className="cover-picker-tabs">
            <button
              className={`cover-tab-btn ${tab === 'gradients' ? 'active' : ''}`}
              onClick={() => setTab('gradients')}
            >
              Gradients
            </button>
            <button
              className={`cover-tab-btn ${tab === 'photos' ? 'active' : ''}`}
              onClick={() => setTab('photos')}
            >
              Curated Photos
            </button>
          </div>
          <div className="cover-picker-actions">
            {currentCover && (
              <button className="cover-remove-btn" onClick={() => { onRemove(); onClose(); }}>
                Remove Cover
              </button>
            )}
            <button className="cover-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="cover-grid-content">
          {tab === 'gradients' ? (
            <div className="cover-grid">
              {gradients.map(preset => {
                const isSelected = currentCover === preset.gradient;
                return (
                  <button
                    key={preset.id}
                    className={`cover-card ${isSelected ? 'selected' : ''}`}
                    style={{ background: preset.gradient }}
                    onClick={() => {
                      onSelect(preset.gradient);
                      onClose();
                    }}
                  >
                    <span className="cover-name">{preset.name}</span>
                    {isSelected && (
                      <div className="cover-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="cover-grid">
              {photos.map(preset => {
                const isSelected = currentCover === preset.url;
                return (
                  <button
                    key={preset.id}
                    className={`cover-card photo-card ${isSelected ? 'selected' : ''}`}
                    style={{ backgroundImage: `url(${preset.url})` }}
                    onClick={() => {
                      onSelect(preset.url);
                      onClose();
                    }}
                  >
                    <span className="cover-name photo-name">{preset.name}</span>
                    {isSelected && (
                      <div className="cover-check-badge">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
