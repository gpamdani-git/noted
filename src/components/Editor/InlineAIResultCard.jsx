import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  CornerDownLeft,
  RotateCcw,
  X,
  SplitSquareVertical,
  AlignLeft
} from 'lucide-react';

export const InlineAIResultCard = ({
  isGenerating = false,
  streamedText = '',
  result = null,
  targetText = '',
  onReplace,
  onInsertBelow,
  onRetry,
  onDiscard,
  isLocked = false
}) => {
  const [viewMode, setViewMode] = useState('diff'); // 'diff' | 'clean'

  if (isGenerating) {
    return (
      <div className="inline-ai-result-card animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
        <div className="inline-ai-stream-header">
          <Sparkles size={14} className="inline-ai-sparkle-spin text-ai-purple" />
          <span className="inline-ai-stream-title">Hudbird AI is rewriting selection...</span>
        </div>
        <div className="inline-ai-stream-body">
          {streamedText || 'Analyzing context and formulating rewrite...'}
          <span className="inline-ai-typing-cursor" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const diffTokens = result.diff || [];
  const hasDiff = diffTokens.some((t) => t.type === 'added' || t.type === 'removed');

  return (
    <div className="inline-ai-result-card animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
      {/* Header with mode switcher */}
      <div className="inline-ai-result-header">
        <div className="inline-ai-badge">
          <Sparkles size={13} className="text-ai-purple" />
          <span>AI Suggestion</span>
        </div>

        {hasDiff && (
          <div className="inline-ai-view-toggle">
            <button
              type="button"
              className={`inline-ai-toggle-btn ${viewMode === 'diff' ? 'active' : ''}`}
              onClick={() => setViewMode('diff')}
              title="Show changes (additions & deletions)"
            >
              <SplitSquareVertical size={12} />
              <span>Diff</span>
            </button>
            <button
              type="button"
              className={`inline-ai-toggle-btn ${viewMode === 'clean' ? 'active' : ''}`}
              onClick={() => setViewMode('clean')}
              title="Show proposed clean text"
            >
              <AlignLeft size={12} />
              <span>Clean</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="inline-ai-result-content">
        {viewMode === 'diff' && hasDiff ? (
          <div className="inline-ai-diff-box">
            {diffTokens.map((chunk, idx) => {
              if (chunk.type === 'removed') {
                return (
                  <del key={idx} className="inline-ai-diff-del">
                    {chunk.value}
                  </del>
                );
              }
              if (chunk.type === 'added') {
                return (
                  <ins key={idx} className="inline-ai-diff-ins">
                    {chunk.value}
                  </ins>
                );
              }
              return <span key={idx}>{chunk.value}</span>;
            })}
          </div>
        ) : (
          <div className="inline-ai-clean-box">
            {result.text}
          </div>
        )}
      </div>

      {/* Actions Toolbar */}
      <div className="inline-ai-actions-bar">
        <button
          type="button"
          className="inline-ai-action-btn primary-action"
          onClick={onReplace}
          disabled={isLocked}
          title={isLocked ? "Page is locked" : "Replace selected text (Enter)"}
        >
          <Check size={13} />
          <span>Replace selection</span>
          <kbd className="inline-ai-kbd">↵</kbd>
        </button>

        <button
          type="button"
          className="inline-ai-action-btn secondary-action"
          onClick={onInsertBelow}
          disabled={isLocked}
          title={isLocked ? "Page is locked" : "Insert as new block below (⌘+Enter)"}
        >
          <CornerDownLeft size={13} />
          <span>Insert below</span>
          <kbd className="inline-ai-kbd">⌘↵</kbd>
        </button>

        <button
          type="button"
          className="inline-ai-action-btn tertiary-action"
          onClick={onRetry}
          title="Try again with another variation"
        >
          <RotateCcw size={12} />
          <span>Try again</span>
        </button>

        <button
          type="button"
          className="inline-ai-action-btn discard-action"
          onClick={onDiscard}
          title="Discard and close (Esc)"
        >
          <X size={13} />
          <span>Discard</span>
          <kbd className="inline-ai-kbd">esc</kbd>
        </button>
      </div>
    </div>
  );
};
