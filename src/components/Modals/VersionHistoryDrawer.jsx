import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Check,
  Clock,
  Sparkles,
  ArrowLeft,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  getPageVersions,
  savePageSnapshot,
  deletePageSnapshot
} from '../../utils/versionHistory';
import { renderInlineMarkdown } from '../../utils/markdownRenderer';
import './VersionHistoryDrawer.css';

export const VersionHistoryDrawer = ({
  isOpen,
  onClose,
  page,
  allPages = [],
  onRestorePage
}) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoredSuccess, setRestoredSuccess] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    if (isOpen && page) {
      const list = getPageVersions(page.id, page);
      setVersions(list);
      // Default to no preview initially
      setSelectedVersion(null);
      setRestoredSuccess(false);
    }
  }, [isOpen, page?.id]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showNoteInput) {
          setShowNoteInput(false);
        } else if (selectedVersion) {
          setSelectedVersion(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showNoteInput, selectedVersion, onClose]);

  if (!isOpen || !page) return null;

  const handleCreateSnapshot = () => {
    const note = customNote.trim() || 'Manual Snapshot';
    const newSnap = savePageSnapshot(page, note, true);
    if (newSnap) {
      const updated = getPageVersions(page.id, page);
      setVersions(updated);
      setCustomNote('');
      setShowNoteInput(false);
    }
  };

  const handleDeleteSnapshot = (e, snapId) => {
    e.stopPropagation();
    if (window.confirm('Hapus snapshot riwayat versi ini?')) {
      const updated = deletePageSnapshot(page.id, snapId);
      setVersions(updated);
      if (selectedVersion?.id === snapId) {
        setSelectedVersion(null);
      }
    }
  };

  const handleRestore = (snap) => {
    if (!snap) return;
    const confirmRestore = window.confirm(
      `Pulihkan halaman ke versi "${snap.note}" dari ${formatDate(snap.timestamp)}?\n(Versi saat ini akan otomatis disimpan sebagai snapshot cadangan).`
    );
    if (!confirmRestore) return;

    // 1. Take a snapshot of the current state before restoring
    savePageSnapshot(page, 'Cadangan sebelum memulihkan versi', false);

    // 2. Perform restoration
    if (onRestorePage) {
      onRestorePage({
        blocks: JSON.parse(JSON.stringify(snap.blocks || [])),
        title: snap.title || page.title,
        cover: snap.cover !== undefined ? snap.cover : page.cover,
        icon: snap.icon || page.icon
      });
    }

    setRestoredSuccess(true);
    setTimeout(() => {
      setRestoredSuccess(false);
      onClose();
    }, 1200);
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Hari ini, ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`;
  };

  const getRelativeTime = (ts) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <div className="version-drawer-backdrop" onClick={onClose}>
      <div
        className="version-drawer-container animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="version-drawer-header">
          <div className="header-title-box">
            <div className="header-badge">
              <History size={16} className="text-accent" />
              <span>Page History</span>
            </div>
            <div className="header-page-title" title={page.title || 'Untitled'}>
              <span className="page-icon">{page.icon || '📄'}</span>
              <span className="page-text">{page.title || 'Untitled'}</span>
            </div>
          </div>
          <button id="btn-close-history-drawer" className="drawer-close-btn" onClick={onClose} title="Tutup (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Snapshot Quick Action Bar */}
        <div className="drawer-actions-bar">
          {!showNoteInput ? (
            <button
              id="btn-take-snapshot"
              className="take-snapshot-btn"
              onClick={() => setShowNoteInput(true)}
              title="Buat snapshot manual saat ini"
            >
              <Plus size={14} />
              <span>Simpan Snapshot Sekarang</span>
            </button>
          ) : (
            <div className="custom-snapshot-input-row">
              <input
                id="input-snapshot-note"
                type="text"
                className="snapshot-note-input"
                placeholder="Catatan versi (misal: 'Sebelum revisi')..."
                value={customNote}
                autoFocus
                onChange={(e) => setCustomNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSnapshot();
                  if (e.key === 'Escape') setShowNoteInput(false);
                }}
              />
              <button id="btn-save-snapshot" className="snapshot-save-btn" onClick={handleCreateSnapshot}>
                Simpan
              </button>
              <button
                id="btn-cancel-snapshot"
                className="snapshot-cancel-btn"
                onClick={() => setShowNoteInput(false)}
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {restoredSuccess && (
          <div className="version-restore-alert success animate-fade-in">
            <Check size={16} />
            <span>Halaman berhasil dipulihkan ke versi pilihan!</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="version-drawer-body">
          {/* If Previewing a Version */}
          {selectedVersion ? (
            <div className="version-preview-pane">
              <div className="preview-top-toolbar">
                <button
                  id="btn-preview-back"
                  className="preview-back-btn"
                  onClick={() => setSelectedVersion(null)}
                >
                  <ArrowLeft size={14} />
                  <span>Kembali ke Daftar</span>
                </button>
                <div className="preview-info-tag">
                  <Clock size={12} />
                  <span>{formatDate(selectedVersion.timestamp)}</span>
                </div>
                <button
                  id="btn-preview-restore-action"
                  className="preview-restore-action-btn"
                  onClick={() => handleRestore(selectedVersion)}
                  title="Pulihkan seluruh konten halaman ke snapshot ini"
                >
                  <RotateCcw size={14} />
                  <span>Pulihkan Versi Ini</span>
                </button>
              </div>

              <div className="preview-version-card-meta">
                <div className="preview-meta-title">
                  {selectedVersion.icon && (
                    <span className="preview-icon">{selectedVersion.icon}</span>
                  )}
                  <span>{selectedVersion.title || 'Untitled'}</span>
                </div>
                <div className="preview-meta-stats">
                  <span>{selectedVersion.blockCount} blok</span>
                  <span>•</span>
                  <span>{selectedVersion.wordCount} kata</span>
                  <span>•</span>
                  <span className="preview-note-text">{selectedVersion.note}</span>
                </div>
              </div>

              {/* Read-Only Blocks Preview */}
              <div className="preview-blocks-container">
                {selectedVersion.blocks && selectedVersion.blocks.length > 0 ? (
                  selectedVersion.blocks.map((b, idx) => (
                    <div key={b.id || idx} className={`preview-block-item type-${b.type}`}>
                      {b.type === 'heading_1' && (
                        <h1 className="preview-h1">{b.text || 'Heading 1'}</h1>
                      )}
                      {b.type === 'heading_2' && (
                        <h2 className="preview-h2">{b.text || 'Heading 2'}</h2>
                      )}
                      {b.type === 'heading_3' && (
                        <h3 className="preview-h3">{b.text || 'Heading 3'}</h3>
                      )}
                      {b.type === 'paragraph' && (
                        <p className="preview-p">
                          {renderInlineMarkdown(b.text || '', { allPages })}
                        </p>
                      )}
                      {b.type === 'to_do' && (
                        <div className={`preview-todo ${b.checked ? 'completed' : ''}`}>
                          <input type="checkbox" checked={!!b.checked} readOnly />
                          <span>{renderInlineMarkdown(b.text || '', { allPages })}</span>
                        </div>
                      )}
                      {b.type === 'bulleted_list_item' && (
                        <div className="preview-list-item">
                          <span className="preview-bullet">•</span>
                          <span>{renderInlineMarkdown(b.text || '', { allPages })}</span>
                        </div>
                      )}
                      {b.type === 'numbered_list_item' && (
                        <div className="preview-list-item">
                          <span className="preview-num">
                            {(() => {
                              let count = 1;
                              const bList = selectedVersion?.blocks;
                              if (Array.isArray(bList)) {
                                for (let i = idx - 1; i >= 0; i--) {
                                  if (bList[i]?.type === 'numbered_list_item') {
                                    count++;
                                  } else {
                                    break;
                                  }
                                }
                              }
                              return count;
                            })()}.
                          </span>
                          <span>{renderInlineMarkdown(b.text || '', { allPages })}</span>
                        </div>
                      )}
                      {b.type === 'quote' && (
                        <blockquote className="preview-quote">{b.text}</blockquote>
                      )}
                      {b.type === 'callout' && (
                        <div className="preview-callout">
                          <span className="callout-emoji">{b.icon || '💡'}</span>
                          <span>{b.text}</span>
                        </div>
                      )}
                      {b.type === 'code' && (
                        <pre className="preview-code-block">
                          <code>{b.code || '// Empty code'}</code>
                        </pre>
                      )}
                      {b.type === 'bookmark' && (
                        <div className="preview-bookmark-box">
                          🔖 {b.title || b.url || 'Web Bookmark'}
                        </div>
                      )}
                      {b.type === 'video' && (
                        <div className="preview-video-box">
                          📹 Video Embed ({b.url || 'No URL'})
                        </div>
                      )}
                      {b.type === 'math' && (
                        <div className="preview-math-box">
                          📐 Math Formula: <code>{b.content}</code>
                        </div>
                      )}
                      {b.type === 'divider' && <hr className="preview-divider" />}
                    </div>
                  ))
                ) : (
                  <div className="preview-empty">Halaman kosong pada versi ini.</div>
                )}
              </div>
            </div>
          ) : (
            /* Version Snapshots List */
            <div className="versions-list">
              <div className="versions-list-header">
                <span className="list-count-label">
                  {versions.length} Versi Tersimpan
                </span>
                <span className="list-hint">Pilih versi untuk melihat preview</span>
              </div>

              {versions.map((snap, index) => {
                const isCurrent = index === 0;
                return (
                  <div
                    key={snap.id}
                    className={`version-card-item ${isCurrent ? 'is-current' : ''}`}
                    onClick={() => setSelectedVersion(snap)}
                  >
                    <div className="version-card-main">
                      <div className="version-card-top">
                        <span className="version-timestamp">
                          {formatDate(snap.timestamp)}
                        </span>
                        <span className="version-rel-time">
                          ({getRelativeTime(snap.timestamp)})
                        </span>
                        {isCurrent && (
                          <span className="version-tag-badge current">Aktif</span>
                        )}
                        {snap.isManual && !isCurrent && (
                          <span className="version-tag-badge manual">Manual</span>
                        )}
                      </div>

                      <div className="version-note-title">
                        {snap.note || 'Snapshot Halaman'}
                      </div>

                      <div className="version-stats-row">
                        <span>{snap.blockCount} blok</span>
                        <span>•</span>
                        <span>{snap.wordCount} kata</span>
                      </div>
                    </div>

                    <div className="version-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`btn-version-preview-${index}`}
                        className="version-action-btn view-btn"
                        title="Lihat isi versi ini"
                        onClick={() => setSelectedVersion(snap)}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                      <button
                        id={`btn-version-restore-${index}`}
                        className="version-action-btn restore-btn"
                        title="Pulihkan ke versi ini"
                        onClick={() => handleRestore(snap)}
                      >
                        <RotateCcw size={13} />
                        <span>Pulihkan</span>
                      </button>
                      {!isCurrent && (
                        <button
                          className="version-action-btn delete-btn"
                          title="Hapus snapshot ini"
                          onClick={(e) => handleDeleteSnapshot(e, snap.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {versions.length === 0 && (
                <div className="versions-empty-state">
                  <History size={32} className="empty-icon" />
                  <div className="empty-title">Belum ada riwayat versi</div>
                  <p className="empty-desc">
                    Snapshot versi akan otomatis disimpan saat Anda melakukan perubahan
                    atau saat Anda menekan tombol Simpan Snapshot di atas.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
