import React, { useState } from 'react';
import {
  BarChart2,
  X,
  FileText,
  Clock,
  Hash,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Calendar,
  Lock,
  Unlock,
  Type,
  Maximize2,
  ListTodo,
  Code2,
  Table as TableIcon,
  Bookmark,
  Video,
  Calculator,
  Image as ImageIcon
} from 'lucide-react';
import {
  computeWordCount,
  computeCharacterCount,
  computeBlockBreakdown,
  computeReadingTime
} from '../../utils/versionHistory';
import './PageAnalyticsModal.css';

export const PageAnalyticsModal = ({
  isOpen,
  onClose,
  page
}) => {
  const [copiedId, setCopiedId] = useState(false);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !page) return null;

  const blocks = page.blocks || [];
  const words = computeWordCount(blocks);
  const charsWithSpaces = computeCharacterCount(blocks, true);
  const charsNoSpaces = computeCharacterCount(blocks, false);
  const readingTime = computeReadingTime(words);
  const breakdown = computeBlockBreakdown(blocks);

  const todoTotal = breakdown.to_do;
  const todoDone = breakdown.to_do_completed;
  const todoPercent = todoTotal > 0 ? Math.round((todoDone / todoTotal) * 100) : 0;

  const formatDate = (ts) => {
    if (!ts) return 'Unknown';
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCopyPageId = () => {
    navigator.clipboard.writeText(page.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="analytics-modal-card animate-popover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <div className="analytics-header-icon-box">
              <BarChart2 size={16} />
            </div>
            <div>
              <div className="modal-title">Page Analytics & Details</div>
              <div className="modal-subtitle">
                <span className="page-icon">{page.icon || '📄'}</span>
                <span>{page.title || 'Untitled'}</span>
              </div>
            </div>
          </div>
          <button
            id="btn-close-analytics-modal"
            className="modal-close-btn"
            onClick={onClose}
            title="Tutup (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="analytics-modal-body">
          {/* Quick Metrics 4 Cards Grid */}
          <div className="analytics-metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <FileText size={15} className="text-blue" />
                <span className="metric-label">Words</span>
              </div>
              <div className="metric-number">{words.toLocaleString()}</div>
              <div className="metric-subtext">Total kata di halaman</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Hash size={15} className="text-purple" />
                <span className="metric-label">Characters</span>
              </div>
              <div className="metric-number">{charsWithSpaces.toLocaleString()}</div>
              <div className="metric-subtext">{charsNoSpaces.toLocaleString()} tanpa spasi</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Clock size={15} className="text-orange" />
                <span className="metric-label">Reading Time</span>
              </div>
              <div className="metric-number">{readingTime}</div>
              <div className="metric-subtext">Berdasarkan ~220 wpm</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <Layers size={15} className="text-green" />
                <span className="metric-label">Total Blocks</span>
              </div>
              <div className="metric-number">{blocks.length}</div>
              <div className="metric-subtext">Elemen konten independen</div>
            </div>
          </div>

          {/* Checklist Progress if to_dos exist */}
          {todoTotal > 0 && (
            <div className="analytics-todo-progress-card">
              <div className="todo-progress-header">
                <div className="todo-progress-label">
                  <ListTodo size={15} className="text-accent" />
                  <span>To-Do Completion Progress</span>
                </div>
                <div className="todo-progress-stats">
                  <span className="todo-stat-text">
                    {todoDone} / {todoTotal} tugas ({todoPercent}%)
                  </span>
                </div>
              </div>
              <div className="todo-progress-track">
                <div
                  className="todo-progress-fill"
                  style={{ width: `${todoPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Block Type Breakdown */}
          <div className="analytics-section">
            <div className="section-title">Block Types Breakdown</div>
            <div className="block-breakdown-grid">
              <div className="breakdown-item">
                <span className="breakdown-label">Paragraphs</span>
                <span className="breakdown-count">{breakdown.paragraph}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Headings (H1 - H3)</span>
                <span className="breakdown-count">
                  {breakdown.heading_1 + breakdown.heading_2 + breakdown.heading_3}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Lists (Bullet & Numbered)</span>
                <span className="breakdown-count">
                  {breakdown.bulleted_list_item + breakdown.numbered_list_item}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Checklists (To-Do)</span>
                <span className="breakdown-count">{breakdown.to_do}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Quotes & Callouts</span>
                <span className="breakdown-count">{breakdown.quote + breakdown.callout}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Code Blocks</span>
                <span className="breakdown-count">{breakdown.code}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Databases & Tables</span>
                <span className="breakdown-count">{breakdown.table}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Multi-Columns</span>
                <span className="breakdown-count">{breakdown.column_list}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Web Bookmarks</span>
                <span className="breakdown-count">{breakdown.bookmark}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Videos & Embeds</span>
                <span className="breakdown-count">{breakdown.video}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Math Equations (KaTeX)</span>
                <span className="breakdown-count">{breakdown.math}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Images & Media</span>
                <span className="breakdown-count">{breakdown.image}</span>
              </div>
            </div>
          </div>

          {/* Document Properties & Metadata */}
          <div className="analytics-section">
            <div className="section-title">Document Attributes</div>
            <div className="document-attributes-list">
              <div className="attribute-row">
                <div className="attr-label">
                  <Calendar size={13} />
                  <span>Created At</span>
                </div>
                <div className="attr-value">{formatDate(page.createdAt)}</div>
              </div>

              <div className="attribute-row">
                <div className="attr-label">
                  <Clock size={13} />
                  <span>Last Modified</span>
                </div>
                <div className="attr-value">{formatDate(page.updatedAt)}</div>
              </div>

              <div className="attribute-row">
                <div className="attr-label">
                  <Type size={13} />
                  <span>Font Family</span>
                </div>
                <div className="attr-value capitalize">
                  {page.fontFamily || 'Sans (Default)'}
                </div>
              </div>

              <div className="attribute-row">
                <div className="attr-label">
                  <Maximize2 size={13} />
                  <span>Layout Width</span>
                </div>
                <div className="attr-value">
                  {page.fullWidth ? 'Full width' : 'Centered standard (900px)'}
                </div>
              </div>

              <div className="attribute-row">
                <div className="attr-label">
                  {page.isLocked ? <Lock size={13} /> : <Unlock size={13} />}
                  <span>Lock Status</span>
                </div>
                <div className={`attr-value ${page.isLocked ? 'text-amber' : 'text-green'}`}>
                  {page.isLocked ? 'Locked (Read-Only)' : 'Editable'}
                </div>
              </div>

              <div className="attribute-row">
                <div className="attr-label">
                  <Hash size={13} />
                  <span>Internal Page ID</span>
                </div>
                <div className="attr-value page-id-row">
                  <code className="page-id-code">{page.id}</code>
                  <button
                    id="btn-copy-page-id"
                    className="copy-id-btn"
                    onClick={handleCopyPageId}
                    title="Copy Page ID"
                  >
                    {copiedId ? (
                      <Check size={12} className="text-green" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button id="btn-close-analytics-bottom" className="analytics-close-btn" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
