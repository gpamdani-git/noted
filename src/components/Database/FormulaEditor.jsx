import React, { useState, useEffect, useRef } from 'react';
import { X, Code, Sparkles, Check } from 'lucide-react';
import { formulaEngine } from '../../utils/database/formulaEngine';
import './DatabaseViews.css';

const COMMON_FUNCTIONS = [
  { name: 'add', snippet: 'add(1, 2)' },
  { name: 'subtract', snippet: 'subtract(10, 5)' },
  { name: 'multiply', snippet: 'multiply(4, 5)' },
  { name: 'divide', snippet: 'divide(20, 4)' },
  { name: 'concat', snippet: 'concat(prop("Name"), " - Done")' },
  { name: 'if', snippet: 'if(prop("Status"), "Yes", "No")' },
  { name: 'round', snippet: 'round(3.1415)' },
  { name: 'min', snippet: 'min(10, 20)' },
  { name: 'max', snippet: 'max(10, 20)' }
];

const FormulaEditor = ({
  columnName,
  initialFormula = '',
  headers = [],
  firstRow = [],
  onSave,
  onClose
}) => {
  const [formula, setFormula] = useState(initialFormula);
  const textareaRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Insert text into textarea at caret
  const insertText = (text) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const updated = formula.slice(0, start) + text + formula.slice(end);
    setFormula(updated);
    setTimeout(() => {
      el.focus();
      const newPos = start + text.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Live evaluation on first row
  let previewResult = '-';
  let previewError = null;
  if (formula.trim()) {
    try {
      const rowData = {};
      headers.forEach((h, i) => {
        const val = firstRow[i] ?? '';
        const num = Number(val);
        rowData[h] = !isNaN(num) && val !== '' ? num : val;
      });
      const properties = headers.map(h => ({ name: h }));
      previewResult = formulaEngine.evaluate(formula, rowData, properties);
      if (typeof previewResult === 'object') {
        previewResult = JSON.stringify(previewResult);
      }
    } catch (err) {
      previewError = err.message;
    }
  }

  const handleSave = () => {
    onSave && onSave(formula);
    onClose && onClose();
  };

  return (
    <div className="db-modal-backdrop" onClick={onClose}>
      <div className="db-modal-card db-formula-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="db-modal-header">
          <div className="db-modal-title">
            <Code size={16} />
            <span>Edit Formula ({columnName})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="db-modal-close-btn"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="db-formula-body">
          <div className="db-formula-input-wrap">
            <label className="db-formula-input-label">Formula Expression</label>
            <textarea
              ref={textareaRef}
              rows={3}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="db-formula-textarea"
              placeholder='e.g. add(prop("Price"), prop("Tax")) or concat(prop("Task"), " - WIP")'
              autoFocus
            />
          </div>

          {/* Quick Insert Properties */}
          {headers.length > 0 && (
            <div className="db-formula-props-section">
              <span className="db-formula-input-label">Insert Property</span>
              <div className="db-formula-chips">
                {headers.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => insertText(`prop("${h}")`)}
                    className="db-formula-chip-btn"
                  >
                    prop("{h}")
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Insert Functions */}
          <div className="db-formula-props-section">
            <span className="db-formula-input-label">Insert Function</span>
            <div className="db-formula-chips">
              {COMMON_FUNCTIONS.map((fn) => (
                <button
                  key={fn.name}
                  type="button"
                  onClick={() => insertText(fn.snippet)}
                  className="db-formula-chip-btn"
                >
                  {fn.name}()
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="db-formula-preview-card">
            <span style={{ color: 'var(--text-secondary)' }}>Live Preview (Row 1):</span>
            <span className="db-formula-preview-val">
              {previewError ? (
                <span style={{ color: '#eb5757', fontWeight: 500 }}>{previewError}</span>
              ) : (
                String(previewResult ?? '')
              )}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relation-footer" style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="relation-btn-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="relation-btn-create"
          >
            Save Formula
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulaEditor;

