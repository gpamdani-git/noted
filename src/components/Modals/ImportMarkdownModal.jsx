import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  FileText,
  CheckCircle2,
  Table as TableIcon,
  Code2,
  ListTodo,
  Quote,
  Image as ImageIcon,
  ArrowRight,
  ClipboardPaste,
  RotateCcw
} from 'lucide-react';
import { parseMarkdownToBlocks, parseMarkdownDocument } from '../../utils/aiAssistant';
import './ImportMarkdownModal.css';

const QUICK_ICONS = ['🤖', '✨', '📄', '💡', '📊', '🚀', '🧠', '⚡️', '📝', '🎯'];

const SAMPLE_AI_MARKDOWN = `# 🚀 Analisis Sistem & Arsitektur noted
Berikut adalah ringkasan hasil eksplorasi integrasi model AI lokal dan komponen block-editor:

## 📌 Ringkasan Eksekutif
Dokumen ini menguraikan arsitektur modular yang kompatibel dengan Notion 7.39.0 dan mendukung dual engine Ollama & LM Studio.

> [!NOTE]
> Seluruh pemrosesan teks dan embedding berjalan 100% lokal di mesin pengguna tanpa data bocor ke cloud.

## 🛠️ Item Tindakan (Action Items)
- [x] Reverse engineer block tree Notion 7.39.0
- [x] Implementasi multi-view database (Table, Kanban, Gallery)
- [ ] Integrasi automated smart-paste clipboard parser
- [ ] Optimasi rendering dokumen panjang

## 📊 Perbandingan Engine AI
| Fitur / Parameter | Ollama | LM Studio | Built-in Local |
|---|---|---|---|
| Port Standar | 11434 | 1234 | Embedded in-browser |
| Dukungan Model | GGUF / Ollama library | Semua format GGUF | Rule-based engine |
| Kecepatan Stream | Sangat Cepat | Sangat Cepat | Instan |

## 💻 Contoh Snippet Integrasi
\`\`\`javascript
// Client MCP Host Stream Runner
export async function streamAiResponse(prompt, onChunk) {
  const response = await fetch('/api/lmstudio/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.2-3b-instruct', stream: true })
  });
  return response;
}
\`\`\`

![Visual Arsitektur](/media/noted_app_demo.webp)
`;

export const ImportMarkdownModal = ({
  isOpen,
  onClose,
  onCreatePageFromMarkdown,
  onAppendToCurrentPage,
  currentPageTitle = ''
}) => {
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🤖');

  // Parse markdown live to compute detected blocks and preview
  const parsedData = useMemo(() => {
    return parseMarkdownDocument(rawMarkdown, 'Catatan Baru dari AI Chat');
  }, [rawMarkdown]);

  // Count element types
  const stats = useMemo(() => {
    const blocks = parsedData.blocks || [];
    let headings = 0;
    let tables = 0;
    let codeBlocks = 0;
    let todos = 0;
    let images = 0;
    let callouts = 0;

    for (const b of blocks) {
      if (b.type.startsWith('heading_')) headings++;
      else if (b.type === 'table') tables++;
      else if (b.type === 'code') codeBlocks++;
      else if (b.type === 'to_do') todos++;
      else if (b.type === 'image') images++;
      else if (b.type === 'callout' || b.type === 'quote') callouts++;
    }

    return {
      total: blocks.length,
      headings,
      tables,
      codeBlocks,
      todos,
      images,
      callouts
    };
  }, [parsedData]);

  // Sync auto-detected title from parsedData if customTitle is empty
  useEffect(() => {
    if (parsedData.title && !customTitle) {
      if (parsedData.icon) setSelectedIcon(parsedData.icon);
    }
  }, [parsedData]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawMarkdown(text);
      }
    } catch (err) {
      console.warn('Clipboard read permission denied:', err);
    }
  };

  const handleLoadSample = () => {
    setRawMarkdown(SAMPLE_AI_MARKDOWN);
    setCustomTitle('');
    setSelectedIcon('🚀');
  };

  const handleClear = () => {
    setRawMarkdown('');
    setCustomTitle('');
    setSelectedIcon('🤖');
  };

  const handleCreateNewPage = () => {
    const titleToUse = (customTitle.trim() || parsedData.title || 'Untitled AI Note');
    onCreatePageFromMarkdown({
      title: titleToUse,
      icon: selectedIcon || parsedData.icon || '🤖',
      blocks: parsedData.blocks
    });
    onClose();
  };

  const handleAppendCurrent = () => {
    if (onAppendToCurrentPage) {
      onAppendToCurrentPage(parsedData.blocks);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="import-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="import-modal-header">
          <div className="import-header-title-zone">
            <div className="import-header-icon-badge">
              <Sparkles size={18} className="text-ai-purple" />
            </div>
            <div>
              <h3 className="import-modal-title">Import dari AI Chat / Markdown</h3>
              <p className="import-modal-subtitle">
                Paste teks hasil chat dari ChatGPT, Claude, Antigravity, atau LLM lokal. Otomatis dikonversi menjadi blok Notion (tabel, code, to-do, gambar, dll).
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="import-modal-body">
          {/* Title and Icon Configuration */}
          <div className="import-meta-row">
            <div className="import-icon-selector">
              <span className="import-icon-current">{selectedIcon}</span>
              <div className="import-quick-icons">
                {QUICK_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`quick-emoji-btn ${selectedIcon === emoji ? 'active' : ''}`}
                    onClick={() => setSelectedIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="import-title-input-wrap">
              <label className="import-field-label">Judul Halaman (Opsional - otomatis dideteksi dari Heading 1)</label>
              <input
                type="text"
                className="import-title-input"
                placeholder={parsedData.title || 'Contoh: Rangkuman Riset AI'}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Action Helpers */}
          <div className="import-helpers-bar">
            <button type="button" className="helper-action-btn" onClick={handlePasteFromClipboard}>
              <ClipboardPaste size={13} />
              <span>Paste dari Clipboard</span>
            </button>
            <button type="button" className="helper-action-btn" onClick={handleLoadSample}>
              <Sparkles size={13} className="text-ai-purple" />
              <span>Muat Contoh Markdown Lengkap</span>
            </button>
            {rawMarkdown && (
              <button type="button" className="helper-action-btn clear-btn" onClick={handleClear}>
                <RotateCcw size={13} />
                <span>Bersihkan</span>
              </button>
            )}
          </div>

          {/* Markdown Textarea */}
          <div className="import-textarea-wrapper">
            <textarea
              className="import-markdown-textarea"
              rows={12}
              placeholder={`Tempel (paste) markdown dari AI chat di sini...\n\nContoh yang didukung otomatis:\n• # Heading 1, ## Heading 2, ### Heading 3\n• - [ ] Checklist to-do\n• - Bullet points\n• \`\`\`javascript Code blocks\n• | Header 1 | Header 2 | Tabel data\n• > [!NOTE] Callout tips\n• ![Deskripsi](/media/demo.webp) Gambar/animasi\n• --- Garis pembatas`}
              value={rawMarkdown}
              onChange={(e) => setRawMarkdown(e.target.value)}
              autoFocus
            />
          </div>

          {/* Live Detected Stats Chips */}
          <div className="import-stats-summary">
            <span className="stats-label">Terdeteksi:</span>
            <span className="stats-chip total-chip">
              <CheckCircle2 size={12} />
              <strong>{stats.total}</strong> Blok
            </span>
            {stats.headings > 0 && (
              <span className="stats-chip">
                <FileText size={12} />
                {stats.headings} Headings
              </span>
            )}
            {stats.tables > 0 && (
              <span className="stats-chip highlight-chip">
                <TableIcon size={12} />
                {stats.tables} Tabel
              </span>
            )}
            {stats.codeBlocks > 0 && (
              <span className="stats-chip">
                <Code2 size={12} />
                {stats.codeBlocks} Code Snippet
              </span>
            )}
            {stats.todos > 0 && (
              <span className="stats-chip">
                <ListTodo size={12} />
                {stats.todos} To-do
              </span>
            )}
            {stats.images > 0 && (
              <span className="stats-chip">
                <ImageIcon size={12} />
                {stats.images} Gambar/Media
              </span>
            )}
            {stats.callouts > 0 && (
              <span className="stats-chip">
                <Quote size={12} />
                {stats.callouts} Callout
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="import-modal-footer">
          <button className="import-btn-cancel" onClick={onClose}>
            Batal
          </button>

          <div className="import-btn-group-right">
            {onAppendToCurrentPage && currentPageTitle && (
              <button
                className="import-btn-secondary"
                onClick={handleAppendCurrent}
                disabled={!rawMarkdown.trim()}
                title={`Sisipkan ke "${currentPageTitle}"`}
              >
                Sisipkan ke Halaman Saat Ini
              </button>
            )}

            <button
              className="import-btn-primary"
              onClick={handleCreateNewPage}
              disabled={!rawMarkdown.trim()}
            >
              <span>Buat Catatan Baru ({stats.total} Blok)</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
