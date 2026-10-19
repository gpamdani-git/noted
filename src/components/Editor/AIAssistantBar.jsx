import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CornerDownLeft,
  X,
  RotateCcw,
  Check,
  ListChecks,
  FileText,
  Wand2,
  Lightbulb,
  Languages,
  Bot
} from 'lucide-react';
import { runAiGeneration } from '../../utils/aiAssistant';
import './AIAssistantBar.css';

const QUICK_ACTIONS = [
  { id: 'summarize', label: 'Summarize page', icon: FileText },
  { id: 'action_items', label: 'Generate action items', icon: ListChecks },
  { id: 'improve_writing', label: 'Improve writing', icon: Wand2 },
  { id: 'brainstorm', label: 'Brainstorm ideas', icon: Lightbulb },
  { id: 'translate_en', label: 'Translate to English', icon: Languages },
  { id: 'translate_id', label: 'Terjemahkan ke Indonesia', icon: Languages },
];

export const AIAssistantBar = ({
  page,
  targetText = '',
  targetBlockId = null,
  onInsertBlocks,
  onReplaceText,
  onClose
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleRunAI = async (actionType = 'custom', customPrompt = null) => {
    const finalPrompt = customPrompt !== null ? customPrompt : prompt;
    if (actionType === 'custom' && !finalPrompt.trim()) return;

    setIsGenerating(true);
    setStreamedText('');
    setGeneratedResult(null);
    setLastAction(actionType);

    try {
      const result = await runAiGeneration({
        action: actionType,
        prompt: finalPrompt,
        targetText,
        page,
        onProgress: (chunk) => {
          setStreamedText(chunk);
        }
      });
      setGeneratedResult(result);
    } catch (err) {
      console.error('AI generation error:', err);
      setStreamedText('Maaf, terjadi kendala saat memproses permintaan AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRunAI('custom', prompt);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleApplyInsertBelow = () => {
    if (!generatedResult || !generatedResult.blocks) return;
    onInsertBlocks(generatedResult.blocks, targetBlockId);
    onClose();
  };

  const handleApplyReplace = () => {
    if (!generatedResult) return;
    if (targetText && onReplaceText) {
      onReplaceText(generatedResult.text);
    } else if (generatedResult.blocks) {
      onInsertBlocks(generatedResult.blocks, targetBlockId, true);
    }
    onClose();
  };

  const handleRetry = () => {
    handleRunAI(lastAction || 'custom', prompt);
  };

  return (
    <div className="ai-assistant-wrapper animate-popover" onClick={(e) => e.stopPropagation()}>
      <div className="ai-gradient-glow" />
      <div className="ai-assistant-card">
        {/* Top Input Bar */}
        <div className="ai-input-row">
          <div className="ai-sparkle-icon">
            <Sparkles size={16} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="ai-text-input"
            value={prompt}
            placeholder={
              targetText
                ? "Ask AI to edit selection or write..."
                : "Ask Hudbird AI to write anything, summarize, or extract tasks..."
            }
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <button
            className={`ai-send-btn ${prompt.trim() ? 'active' : ''}`}
            onClick={() => handleRunAI('custom', prompt)}
            disabled={!prompt.trim() || isGenerating}
            title="Generate (Enter)"
          >
            {isGenerating ? (
              <div className="ai-spinner" />
            ) : (
              <CornerDownLeft size={14} />
            )}
          </button>
          <button className="ai-close-btn" onClick={onClose} title="Cancel (Esc)">
            <X size={15} />
          </button>
        </div>

        {/* Quick Suggestion Pills (When no result yet) */}
        {!generatedResult && !isGenerating && (
          <div className="ai-suggestions-container">
            <div className="ai-suggestions-label">
              <Bot size={12} />
              <span>Hudbird AI & Local MCP Capabilities</span>
            </div>
            <div className="ai-pills-grid">
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className="ai-pill-btn"
                    onClick={() => handleRunAI(item.id)}
                  >
                    <Icon size={13} className="ai-pill-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Generation Progress View */}
        {isGenerating && (
          <div className="ai-output-stream-box">
            <div className="ai-stream-header">
              <Sparkles size={14} className="ai-rotating-sparkle" />
              <span>Hudbird AI is thinking & drafting...</span>
            </div>
            <div className="ai-stream-content">
              {streamedText || 'Menganalisis dokumen dan merumuskan respons...'}
              <span className="ai-typing-cursor" />
            </div>
          </div>
        )}

        {/* Result Ready Actions */}
        {generatedResult && !isGenerating && (
          <div className="ai-result-container">
            <div className="ai-result-preview">
              <div className="ai-result-badge">
                <Sparkles size={13} />
                <span>AI Draft Ready</span>
              </div>
              <div className="ai-result-text">
                {generatedResult.text}
              </div>
            </div>

            <div className="ai-result-actions-bar">
              <button
                className="ai-action-btn primary-btn"
                onClick={handleApplyInsertBelow}
                disabled={!!page?.isLocked}
                title={page?.isLocked ? "Halaman dikunci (buka kunci untuk menambah blok)" : "Insert below"}
              >
                <Check size={14} />
                <span>Insert below</span>
              </button>
              {targetText && (
                <button
                  className="ai-action-btn secondary-btn"
                  onClick={handleApplyReplace}
                  disabled={!!page?.isLocked}
                  title={page?.isLocked ? "Halaman dikunci (buka kunci untuk mengubah teks)" : "Replace selection"}
                >
                  <Wand2 size={14} />
                  <span>Replace selection</span>
                </button>
              )}
              <button
                className="ai-action-btn tertiary-btn"
                onClick={handleRetry}
              >
                <RotateCcw size={13} />
                <span>Try again</span>
              </button>
              <button
                className="ai-action-btn discard-btn"
                onClick={onClose}
              >
                <X size={13} />
                <span>Discard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
