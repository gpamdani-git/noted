import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { Sigma, Copy, Check, Pencil, X, Sparkles } from 'lucide-react';
import './MathEquationBlock.css';

const COMMON_PRESETS = [
  {
    name: 'Quadratic Formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
  },
  {
    name: "Euler's Identity",
    latex: 'e^{i\\pi} + 1 = 0'
  },
  {
    name: 'Calculus Integral',
    latex: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)'
  },
  {
    name: 'Summation',
    latex: '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}'
  },
  {
    name: 'Normal Distribution',
    latex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}'
  }
];

export const MathEquationBlock = ({ block, onUpdateBlock, isLocked = false }) => {
  const [isEditing, setIsEditing] = useState(!block.content && !isLocked);
  const [latexInput, setLatexInput] = useState(block.content || '');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLatexInput(block.content || '');
  }, [block.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const renderKatexHtml = (formula) => {
    if (!formula?.trim()) return '';
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
      });
    } catch (err) {
      return `<span class="katex-error">${err.message}</span>`;
    }
  };

  const handleSave = () => {
    if (isLocked) return;
    onUpdateBlock({ content: latexInput.trim() });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLatexInput(block.content || '');
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (block.content) {
      navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePresetClick = (presetLatex) => {
    setLatexInput(presetLatex);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="notion-math-wrapper">
      {isEditing && !isLocked ? (
        <div className="notion-math-editor animate-popover">
          <div className="notion-math-editor-header">
            <div className="math-header-title">
              <Sigma size={15} className="math-header-icon" />
              <span>Edit Math Equation (LaTeX)</span>
            </div>
            <button
              type="button"
              className="math-close-btn"
              onClick={() => {
                setIsEditing(false);
                setLatexInput(block.content || '');
              }}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Presets */}
          <div className="math-presets-bar">
            <span className="presets-label">
              <Sparkles size={12} /> Presets:
            </span>
            <div className="presets-scroll">
              {COMMON_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="preset-pill-btn"
                  onClick={() => handlePresetClick(p.latex)}
                  title={p.latex}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX Input Textarea */}
          <textarea
            ref={textareaRef}
            className="notion-math-textarea"
            placeholder="Type LaTeX here... (e.g. E = mc^2 or \frac{a}{b})"
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />

          {/* Live Preview Container */}
          <div className="math-live-preview">
            <div className="preview-label">Live Preview:</div>
            {latexInput.trim() ? (
              <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: renderKatexHtml(latexInput) }}
              />
            ) : (
              <div className="preview-empty">Equation will appear here...</div>
            )}
          </div>

          <div className="notion-math-editor-footer">
            <span className="shortcut-hint">Press ⌘+Enter to save</span>
            <div className="footer-actions">
              <button
                type="button"
                className="math-cancel-action"
                onClick={() => {
                  setIsEditing(false);
                  setLatexInput(block.content || '');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="math-done-btn"
                onClick={handleSave}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`notion-math-display ${!block.content ? 'is-empty' : ''}`}
          onClick={() => {
            if (!isLocked) setIsEditing(true);
          }}
          title={isLocked ? 'Equation (Locked)' : 'Click to edit equation'}
        >
          {block.content ? (
            <div
              className="math-rendered-formula"
              dangerouslySetInnerHTML={{ __html: renderKatexHtml(block.content) }}
            />
          ) : (
            <div className="math-empty-placeholder">
              <Sigma size={18} className="math-placeholder-icon" />
              <span>Click to add a math equation...</span>
            </div>
          )}

          {/* Floating Actions on Hover */}
          {block.content && (
            <div className="math-hover-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="math-action-btn"
                onClick={handleCopy}
                title="Copy LaTeX"
              >
                {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
              </button>
              {!isLocked && (
                <button
                  type="button"
                  className="math-action-btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit equation"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
