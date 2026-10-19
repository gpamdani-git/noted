import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CornerDownLeft,
  X,
  Wand2,
  CheckCheck,
  Minimize2,
  Maximize2,
  Smile,
  FileText,
  ListCollapse,
  Languages,
  HelpCircle,
  CheckSquare,
  ChevronRight
} from 'lucide-react';
import { runAiRewrite } from '../../utils/aiAssistant';
import { InlineAIResultCard } from './InlineAIResultCard';
import './InlineAIToolbar.css';

const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'direct', label: 'Direct' },
  { id: 'confident', label: 'Confident' },
  { id: 'friendly', label: 'Friendly' }
];

const LANGUAGE_OPTIONS = [
  { id: 'en', label: 'English' },
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'ja', label: 'Japanese (日本語)' },
  { id: 'es', label: 'Spanish (Español)' },
  { id: 'de', label: 'German (Deutsch)' },
  { id: 'fr', label: 'French (Français)' },
  { id: 'zh', label: 'Simplified Chinese (中文)' }
];

const ACTION_GROUPS = [
  {
    category: 'Edit or review selection',
    items: [
      { id: 'improve_writing', label: 'Improve writing', icon: Wand2 },
      { id: 'fix_spelling', label: 'Fix spelling & grammar', icon: CheckCheck },
      { id: 'make_shorter', label: 'Make shorter', icon: Minimize2 },
      { id: 'make_longer', label: 'Make longer', icon: Maximize2 },
      { id: 'change_tone', label: 'Change tone...', icon: Smile, hasSubmenu: 'tone' },
      { id: 'simplify', label: 'Simplify language', icon: FileText }
    ]
  },
  {
    category: 'Generate from selection',
    items: [
      { id: 'summarize', label: 'Summarize', icon: ListCollapse },
      { id: 'translate', label: 'Translate...', icon: Languages, hasSubmenu: 'translate' },
      { id: 'explain', label: 'Explain this', icon: HelpCircle },
      { id: 'action_items', label: 'Find action items', icon: CheckSquare }
    ]
  }
];

export const InlineAIToolbar = ({
  position,
  selectedText = '',
  targetBlockId = null,
  page,
  onReplace,
  onInsertBelow,
  onClose,
  isLocked = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [result, setResult] = useState(null);
  const [lastOptions, setLastOptions] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'tone' | 'translate' | null
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [submenuOnLeft, setSubmenuOnLeft] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Flattened items list for arrow navigation
  const flatItems = ACTION_GROUPS.flatMap((g) => g.items);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle click outside to dismiss
  useEffect(() => {
    const handleMouseDownOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (!e.target.closest('.bubble-menu-toolbar')) {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleMouseDownOutside);
    return () => document.removeEventListener('mousedown', handleMouseDownOutside);
  }, [onClose]);

  // Adjust submenu side if near right edge of viewport
  useEffect(() => {
    if (activeSubmenu && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.right + 210 > window.innerWidth) {
        setSubmenuOnLeft(true);
      } else {
        setSubmenuOnLeft(false);
      }
    }
  }, [activeSubmenu]);

  const handleExecute = async (options) => {
    setIsGenerating(true);
    setStreamedText('');
    setResult(null);
    setLastOptions(options);
    setActiveSubmenu(null);

    try {
      const res = await runAiRewrite({
        action: options.action,
        tone: options.tone || 'professional',
        language: options.language || 'en',
        prompt: options.prompt || prompt,
        sourceText: selectedText,
        page,
        onProgress: (chunk) => {
          setStreamedText(chunk);
        }
      });
      setResult(res);
    } catch (err) {
      console.error('Inline AI error:', err);
      setStreamedText('Maaf, terjadi kendala saat memproses rewrite AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (lastOptions) {
      handleExecute(lastOptions);
    }
  };

  const handleApplyReplace = () => {
    if (!result) return;
    onReplace(result.text);
    onClose();
  };

  const handleApplyInsertBelow = () => {
    if (!result || !result.blocks) return;
    onInsertBelow(result.blocks, targetBlockId);
    onClose();
  };

  // Keyboard navigation & Shortcuts
  const handleKeyDown = (e) => {
    if (result) {
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleApplyReplace();
        return;
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleApplyInsertBelow();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (activeSubmenu) {
        setActiveSubmenu(null);
      } else {
        onClose();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (prompt.trim()) {
        handleExecute({ action: 'custom', prompt });
      } else {
        const item = flatItems[selectedIndex];
        if (item) {
          if (item.hasSubmenu) {
            setActiveSubmenu(item.hasSubmenu);
          } else {
            handleExecute({ action: item.id });
          }
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      const item = flatItems[selectedIndex];
      if (item?.hasSubmenu) {
        e.preventDefault();
        setActiveSubmenu(item.hasSubmenu);
      }
      return;
    }

    if (e.key === 'ArrowLeft' && activeSubmenu) {
      e.preventDefault();
      setActiveSubmenu(null);
      return;
    }
  };

  // Compute smart positioning on viewport (Notion 7.39.0 Desktop parity)
  const getStyle = () => {
    if (!position) return {};

    const cardWidth = 380;
    // Align horizontally with selection center, clamp within viewport margins
    const clampedCenter = Math.max(
      cardWidth / 2 + 16,
      Math.min(position.left, window.innerWidth - cardWidth / 2 - 16)
    );

    // Vertical placement:
    const bottomAnchor = position.bottom || (position.top + 28);
    const topAnchor = position.top;
    const spaceBelow = window.innerHeight - bottomAnchor;
    const spaceAbove = topAnchor;

    // Prefer opening below unless there's not enough room (< 390px) and there is more room above
    const shouldPlaceAbove = spaceBelow < 390 && spaceAbove > spaceBelow;

    const style = {
      left: `${clampedCenter}px`
    };

    if (shouldPlaceAbove) {
      // Place above selection
      style.top = `${Math.max(16, topAnchor - 8)}px`;
      style.transform = 'translate(-50%, -100%)';
    } else {
      // Place below selection
      style.top = `${Math.min(window.innerHeight - 80, bottomAnchor + 8)}px`;
      style.transform = 'translateX(-50%)';
    }

    return style;
  };

  return (
    <div
      ref={containerRef}
      className="inline-ai-toolbar-popover"
      style={getStyle()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <div className="inline-ai-card">
        {/* Top Input Bar */}
        <div className="inline-ai-input-row">
          <div className="inline-ai-wand-icon">
            <Sparkles size={14} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="inline-ai-input"
            value={prompt}
            placeholder={
              selectedText
                ? "Ask AI to edit or generate..."
                : "Ask AI to write anything..."
            }
            onChange={(e) => {
              setPrompt(e.target.value);
              setActiveSubmenu(null);
            }}
            disabled={isGenerating}
          />
          <button
            type="button"
            className={`inline-ai-submit-btn ${prompt.trim() ? 'active' : ''}`}
            onClick={() => prompt.trim() && handleExecute({ action: 'custom', prompt })}
            disabled={!prompt.trim() || isGenerating}
            title="Generate (Enter)"
          >
            <CornerDownLeft size={13} />
          </button>
          <button
            type="button"
            className="inline-ai-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={14} />
          </button>
        </div>

        {/* Live Stream or Diff Preview */}
        {(isGenerating || result) && (
          <InlineAIResultCard
            isGenerating={isGenerating}
            streamedText={streamedText}
            result={result}
            targetText={selectedText}
            onReplace={handleApplyReplace}
            onInsertBelow={handleApplyInsertBelow}
            onRetry={handleRetry}
            onDiscard={onClose}
            isLocked={isLocked}
          />
        )}

        {/* Quick Actions List (Only when not generating and no result yet) */}
        {!isGenerating && !result && (
          <div className="inline-ai-menu-wrapper">
            <div className="inline-ai-menu-list">
              {ACTION_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="inline-ai-group">
                  <div className="inline-ai-group-title">{group.category}</div>
                  {group.items.map((item) => {
                    const globalIdx = flatItems.findIndex((it) => it.id === item.id);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        className={`inline-ai-menu-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (item.hasSubmenu) {
                            setActiveSubmenu(item.hasSubmenu);
                          } else {
                            handleExecute({ action: item.id });
                          }
                        }}
                        onMouseEnter={() => {
                          setSelectedIndex(globalIdx);
                          if (item.hasSubmenu) {
                            setActiveSubmenu(item.hasSubmenu);
                          } else {
                            setActiveSubmenu(null);
                          }
                        }}
                      >
                        <div className="inline-ai-item-left">
                          <Icon size={14} className="inline-ai-item-icon" />
                          <span className="inline-ai-item-label">{item.label}</span>
                        </div>
                        {item.hasSubmenu && <ChevronRight size={13} className="inline-ai-chevron" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Submenu for Tone */}
            {activeSubmenu === 'tone' && (
              <div className={`inline-ai-submenu animate-popover ${submenuOnLeft ? 'submenu-left' : ''}`}>
                <div className="inline-ai-submenu-title">Select Tone</div>
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="inline-ai-submenu-item"
                    onClick={() => handleExecute({ action: 'change_tone', tone: t.id })}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Submenu for Translate */}
            {activeSubmenu === 'translate' && (
              <div className={`inline-ai-submenu animate-popover ${submenuOnLeft ? 'submenu-left' : ''}`}>
                <div className="inline-ai-submenu-title">Select Language</div>
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className="inline-ai-submenu-item"
                    onClick={() => handleExecute({ action: 'translate', language: l.id })}
                  >
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
