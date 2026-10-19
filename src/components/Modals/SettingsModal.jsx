import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  LogIn,
  LogOut,
  Edit2,
  Check,
  Shield,
  HardDrive,
  Users,
  Database,
  UserPlus,
  Trash2,
  Cloud,
  CloudCheck,
  CloudOff,
  Copy,
  Code
} from 'lucide-react';
import {
  checkCloudDatabaseStatus
} from '../../utils/cloudSync';
import {
  exportWorkspaceJSON,
  checkStoragePersistence,
  requestStoragePersistence,
  formatStorageBytes,
  recoverWorkspaceFromIndexedDB
} from '../../utils/storage';
import {
  getSavedAccounts,
  switchAccount,
  updateUserProfile,
  removeAccountFromList,
  logoutAllAccounts
} from '../../utils/auth';
import { INITIAL_PAGES } from '../../constants/initialData';
import { loadMcpConfig, saveMcpConfig, testLlmConnection } from '../../utils/aiAssistant';
import './Modals.css';

const NOTION_AVATAR_COLORS = [
  '#2383e2', // Blue
  '#00897b', // Teal
  '#9065b0', // Purple
  '#e03e3e', // Red
  '#d9730d', // Orange
  '#0f7b6c', // Green
  '#6940a5', // Indigo
  '#37352f'  // Slate
];

const POSTGRESQL_DDL_SCHEMA = `-- Noted PostgreSQL Production Schema (Notion REA Engine)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  picture TEXT,
  avatar TEXT,
  color TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  icon TEXT,
  cover TEXT,
  parent_id TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  full_width BOOLEAN DEFAULT FALSE,
  font_family TEXT DEFAULT 'sans',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT DEFAULT 1,
  created_at BIGINT,
  updated_at BIGINT,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  icon TEXT,
  blocks JSONB,
  deleted_at BIGINT
);

CREATE TABLE IF NOT EXISTS workspace_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  open_tabs JSONB DEFAULT '[]'::jsonb,
  active_page_id TEXT,
  theme TEXT DEFAULT 'light',
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);`;

export const SettingsModal = ({
  pages,
  onResetPages,
  onImportPages,
  theme,
  onToggleTheme,
  currentUser,
  onOpenLogin,
  onLogout,
  onClose,
  cloudSyncStatus = 'synced',
  lastSyncedAt = null,
  onTriggerCloudSync
}) => {
  const fileInputRef = useRef(null);
  const [mcpConfig, setMcpConfig] = useState(loadMcpConfig());
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Profile editing & storage persistence state (Notion REA)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.name || '');
  const [storageInfo, setStorageInfo] = useState({ isPersisted: false, isVaultActive: true, hasIndexedDB: true, usage: 0, quota: 0 });
  const [isRequestingPersist, setIsRequestingPersist] = useState(false);
  const [persistFeedback, setPersistFeedback] = useState(null);
  const [recoverStatus, setRecoverStatus] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState(getSavedAccounts());

  // PostgreSQL Cloud Sync state (Notion Dual-DB Engine)
  const [cloudStatus, setCloudStatus] = useState({ connected: false, configured: false, engine: 'PostgreSQL' });
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSqlSchema, setCopiedSqlSchema] = useState(false);

  useEffect(() => {
    checkStoragePersistence().then((info) => setStorageInfo(info));
    checkCloudDatabaseStatus().then((status) => setCloudStatus(status));
  }, []);

  const handleCheckCloudStatus = async () => {
    setIsCheckingCloud(true);
    const status = await checkCloudDatabaseStatus();
    setCloudStatus(status);
    setIsCheckingCloud(false);
  };

  const handleCopySqlSchema = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL_SCHEMA);
    setCopiedSqlSchema(true);
    setTimeout(() => setCopiedSqlSchema(false), 2000);
  };

  const handleSaveProfileName = () => {
    if (editedName.trim()) {
      updateUserProfile({ name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const handleEnablePersistence = async () => {
    setIsRequestingPersist(true);
    setPersistFeedback(null);
    const res = await requestStoragePersistence();
    const updated = await checkStoragePersistence();
    setStorageInfo(updated);
    setPersistFeedback({
      type: res.granted ? 'success' : 'info',
      message: res.message
    });
    setIsRequestingPersist(false);
  };

  const handleRecoverFromVault = async () => {
    const recovered = await recoverWorkspaceFromIndexedDB(currentUser);
    if (recovered && recovered.length > 0) {
      onImportPages(recovered);
      setRecoverStatus({ success: true, message: `Berhasil memulihkan ${recovered.length} halaman dari IndexedDB Vault!` });
    } else {
      setRecoverStatus({ success: false, message: 'Tidak ditemukan snapshot cadangan di IndexedDB Vault.' });
    }
  };

  const handleConfigChange = (key, value) => {
    const updated = { ...mcpConfig, [key]: value };
    setMcpConfig(updated);
    saveMcpConfig(updated);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testLlmConnection(mcpConfig);
      setTestResult(res);
      if (res.success && res.models && res.models.length > 0 && !res.models.includes(mcpConfig.model)) {
        handleConfigChange('model', res.models[0]);
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportBackup = () => {
    exportWorkspaceJSON(pages);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.pages && Array.isArray(json.pages)) {
          onImportPages(json.pages);
          alert('Workspace imported successfully!');
          onClose();
        } else if (Array.isArray(json)) {
          onImportPages(json);
          alert('Workspace imported successfully!');
          onClose();
        } else {
          alert('Invalid backup format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (window.confirm('Reset all workspace notes to original sample pages? This cannot be undone.')) {
      onResetPages(INITIAL_PAGES);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card animate-popover" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Settings & Preferences</div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="settings-body">
          {/* Account & Google OAuth Section */}
          <div className="settings-group">
            <div className="group-title">Account & Google Sign-In</div>
            
            <div className="settings-account-card">
              <div className="settings-account-profile">
                <div className="settings-account-avatar">
                  {currentUser?.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} />
                  ) : (
                    <span style={{ backgroundColor: currentUser?.color || '#00897b' }}>
                      {currentUser?.avatar || currentUser?.name?.[0] || 'D'}
                    </span>
                  )}
                </div>
                <div className="settings-account-details">
                  <div className="settings-account-name-wrap">
                    {isEditingName ? (
                      <div className="settings-name-input-group">
                        <input
                          type="text"
                          className="settings-name-input"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveProfileName()}
                          autoFocus
                        />
                        <button className="settings-name-save-btn" onClick={handleSaveProfileName}>
                          <Check size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="settings-account-name">
                          {currentUser?.name || 'Guest User'}
                        </span>
                        <button
                          className="settings-name-edit-btn"
                          title="Ubah nama tampilan profil"
                          onClick={() => {
                            setEditedName(currentUser?.name || '');
                            setIsEditingName(true);
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                    <div className="settings-account-status">
                      {currentUser?.isLoggedIn ? (
                        <span className="account-badge-logged-in">
                          <CheckCircle2 size={13} className="account-badge-icon" />
                          <span className="account-email">{currentUser.email}</span>
                          <span className="account-provider-tag">
                            {currentUser.loginProvider === 'google' ? 'Google Account' : 'Signed In'}
                          </span>
                        </span>
                      ) : (
                        <span className="account-badge-guest">
                          Mode Tamu (Offline Guest Mode) • Local Workspace
                        </span>
                      )}
                    </div>

                    {!currentUser?.picture && (
                      <div className="settings-avatar-colors-wrap">
                        <span className="text-muted-xs font-medium">Aksen:</span>
                        <div className="settings-avatar-colors-palette">
                          {NOTION_AVATAR_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`avatar-color-swatch ${(currentUser?.color || '#00897b') === c ? 'active' : ''}`}
                              style={{ backgroundColor: c }}
                              title={`Pilih warna ${c}`}
                              onClick={() => updateUserProfile({ color: c })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="settings-account-actions">
                  {currentUser?.isLoggedIn ? (
                    <button className="setting-btn-toggle" onClick={onLogout} title="Keluar akun">
                      <LogOut size={14} />
                      <span>Log out</span>
                    </button>
                  ) : (
                    <button
                      className="setting-action-btn settings-google-btn"
                      onClick={onOpenLogin}
                    >
                      <svg className="google-g-mini" width="14" height="14" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Log in with Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Storage Persistence & Clear Cache Protection Shield (Notion REA Engine) */}
              <div className="settings-storage-shield">
                <div className="storage-shield-header">
                  <div className="storage-shield-left">
                    <ShieldCheck size={16} className={(storageInfo.isPersisted || storageInfo.isVaultActive || storageInfo.hasIndexedDB) ? 'text-green-500' : 'text-amber-500'} />
                    <span className="font-semibold text-xs">Proteksi Data & Penyimpanan Permanen</span>
                  </div>
                  <span className={`storage-shield-badge ${(storageInfo.isPersisted || storageInfo.isVaultActive || storageInfo.hasIndexedDB) ? 'shield-protected' : 'shield-standard'}`}>
                    {storageInfo.isPersisted
                      ? '🛡️ OS Persistent + Vault'
                      : (storageInfo.isVaultActive || storageInfo.hasIndexedDB)
                      ? '🛡️ Protected (Vault Aktif)'
                      : '⚡ Standard Mode'}
                  </span>
                </div>
                <div className="storage-shield-text">
                  Semua catatan di-mirror otomatis ke database lokal <strong>IndexedDB Vault</strong> dan <strong>LocalStorage</strong>.
                  {storageInfo.usage > 0 && ` (Ukuran penyimpanan lokal: ~${formatStorageBytes(storageInfo.usage)})`}
                </div>
                <div className="storage-shield-actions">
                  {storageInfo.isPersisted ? (
                    <div className="storage-shield-active-pill">
                      <CheckCircle2 size={12} className="text-green-500" />
                      <span>OS Storage Persistence Aktif</span>
                    </div>
                  ) : (
                    <button
                      className="storage-btn-subtle"
                      onClick={handleEnablePersistence}
                      disabled={isRequestingPersist}
                      title="Minta izin browser agar data tidak dihapus saat disk laptop penuh"
                    >
                      <Shield size={12} />
                      <span>{isRequestingPersist ? 'Memeriksa...' : 'Aktifkan Storage Persistence'}</span>
                    </button>
                  )}
                  <button
                    className="storage-btn-subtle"
                    onClick={handleRecoverFromVault}
                    title="Pulihkan catatan dari cadangan IndexedDB jika cache browser terhapus"
                  >
                    <Database size={12} />
                    <span>Pulihkan dari IndexedDB Vault</span>
                  </button>
                </div>
                {persistFeedback && (
                  <div className={`mcp-test-badge ${persistFeedback.type === 'success' ? 'badge-success' : 'badge-info'}`} style={{ marginTop: '4px' }}>
                    <ShieldCheck size={12} />
                    <span>{persistFeedback.message}</span>
                  </div>
                )}
                {recoverStatus && (
                  <div className={`mcp-test-badge ${recoverStatus.success ? 'badge-success' : 'badge-error'}`} style={{ marginTop: '4px' }}>
                    {recoverStatus.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    <span>{recoverStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Multi-Account Switcher (Notion Desktop Space Models) */}
              {savedAccounts.length > 0 && (
                <div className="settings-saved-accounts">
                  <div className="text-muted-xs font-semibold" style={{ margin: '4px 0 2px 2px' }}>
                    AKUN TERSIMPAN ({savedAccounts.length})
                  </div>
                  {savedAccounts.map((acc) => (
                    <div key={acc.id} className="saved-account-row">
                      <div className="saved-account-info">
                        <div className="saved-account-avatar" style={{ backgroundColor: acc.color || '#2383e2' }}>
                          {acc.picture ? (
                            <img src={acc.picture} alt={acc.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            acc.avatar || acc.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <div className="saved-account-name">
                            {acc.name} {acc.id === currentUser?.id && <span style={{ color: '#059669', fontSize: '10px' }}>(Aktif)</span>}
                          </div>
                          <div className="saved-account-email">{acc.email}</div>
                        </div>
                      </div>
                      <div className="saved-account-actions">
                        {acc.id !== currentUser?.id ? (
                          <>
                            <button
                              className="btn-switch-account"
                              onClick={() => {
                                switchAccount(acc.id);
                                onClose();
                              }}
                            >
                              Beralih
                            </button>
                            <button
                              className="btn-remove-account"
                              title="Hapus akun dari daftar tersimpan"
                              onClick={() => {
                                if (window.confirm(`Hapus akun ${acc.name} (${acc.email}) dari daftar tersimpan?`)) {
                                  removeAccountFromList(acc.id);
                                  setSavedAccounts(getSavedAccounts());
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Aktif</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="saved-accounts-footer">
                    <button
                      className="btn-logout-all"
                      onClick={() => {
                        if (window.confirm('Keluar dari semua akun yang tersimpan? Workspace akan kembali ke Mode Tamu.')) {
                          logoutAllAccounts();
                          onClose();
                        }
                      }}
                    >
                      <LogOut size={12} />
                      <span>Keluar dari Semua Akun</span>
                    </button>
                  </div>
                </div>
              )}
          </div>

          <div className="menu-divider" />

          {/* Appearance Section */}
          <div className="settings-group">
            <div className="group-title">Appearance</div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Theme Mode</div>
                <div className="setting-desc">Switch between Notion dark and light aesthetics</div>
              </div>
              <button className="setting-btn-toggle" onClick={onToggleTheme}>
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>
            </div>
          </div>

          <div className="menu-divider" />

          {/* Backup & Data Management */}
          <div className="settings-group">
            <div className="group-title">Data & Backup</div>

            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Export Workspace Backup</div>
                <div className="setting-desc">Save all notes, tables, and blocks as a JSON file</div>
              </div>
              <button className="setting-action-btn" onClick={handleExportBackup}>
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Import Workspace</div>
                <div className="setting-desc">Restore notes from a previous noted backup file</div>
              </div>
              <button
                className="setting-action-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} />
                <span>Import JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label text-red">Reset Workspace</div>
                <div className="setting-desc">Restore original onboarding and template notes</div>
              </div>
              <button className="setting-action-btn danger-btn" onClick={handleResetToDemo}>
                <RotateCcw size={14} />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          <div className="menu-divider" />

          {/* Cloud & PostgreSQL Synchronization (Notion REA Dual-DB Engine) */}
          <div className="settings-group">
            <div className="group-title">Cloud & PostgreSQL Sync (Notion Engine)</div>

            <div className="settings-cloud-sync-card">
              <div className="cloud-sync-card-header">
                <div className="cloud-sync-header-left">
                  <Database size={16} className={cloudStatus.connected ? 'text-green-500' : 'text-blue-500'} />
                  <span className="font-semibold text-xs">Arsitektur Dual-DB: PostgreSQL (Cloud) + IndexedDB (Local)</span>
                </div>
                <span className={`cloud-status-badge ${cloudStatus.connected ? 'badge-connected' : 'badge-standby'}`}>
                  {cloudStatus.connected ? (
                    <>
                      <CheckCircle2 size={11} />
                      <span>Online ({cloudStatus.database || 'PostgreSQL'}) • {cloudStatus.latencyMs}ms</span>
                    </>
                  ) : (
                    <>
                      <CloudOff size={11} />
                      <span>Standby (Local Vault Aktif)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="cloud-sync-card-desc">
                Notion menggunakan PostgreSQL di server dan cache lokal di perangkat Anda. Aplikasi Noted ini siap di-deploy ke Vercel dengan sinkronisasi PostgreSQL otomatis via Vercel Serverless Functions (<code>/api/sync</code>).
              </div>

              <div className="cloud-sync-card-actions">
                <button
                  className="storage-btn-subtle"
                  onClick={handleCheckCloudStatus}
                  disabled={isCheckingCloud}
                  title="Periksa status koneksi ke endpoint PostgreSQL di Vercel"
                >
                  <RefreshCw size={12} className={isCheckingCloud ? 'spin-icon' : ''} />
                  <span>{isCheckingCloud ? 'Memeriksa...' : 'Cek Status Cloud'}</span>
                </button>

                {currentUser?.isLoggedIn && (
                  <button
                    className="storage-btn-subtle"
                    onClick={onTriggerCloudSync}
                    title="Kirim dan sinkronkan seluruh halaman lokal ke database PostgreSQL"
                  >
                    <CloudCheck size={12} />
                    <span>Sinkronkan Sekarang</span>
                  </button>
                )}

                <button
                  className="storage-btn-subtle"
                  onClick={() => setShowSqlSchema(!showSqlSchema)}
                  title="Tampilkan skema tabel DDL SQL untuk Supabase / Neon / Vercel Postgres"
                >
                  <Code size={12} />
                  <span>{showSqlSchema ? 'Tutup Skema SQL' : 'Skema SQL PostgreSQL'}</span>
                </button>
              </div>

              {showSqlSchema && (
                <div className="cloud-sql-schema-viewer animate-popover">
                  <div className="schema-viewer-header">
                    <span className="text-muted-xs font-semibold">SKEMA TABEL POSTGRESQL (users, pages, trash, workspace_settings)</span>
                    <button className="btn-copy-schema" onClick={handleCopySqlSchema}>
                      {copiedSqlSchema ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                      <span>{copiedSqlSchema ? 'Tersalin!' : 'Salin SQL'}</span>
                    </button>
                  </div>
                  <pre className="schema-sql-pre">
                    <code>{POSTGRESQL_DDL_SCHEMA}</code>
                  </pre>
                  <div className="schema-viewer-tip">
                    💡 <strong>Tips Vercel Deployment</strong>: Pasang variabel <code>POSTGRES_URL</code> di Project Settings Vercel. Endpoint serverless <code>/api/sync</code> akan otomatis membuat tabel di atas (*auto-migration*) tanpa perlu eksekusi manual!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="menu-divider" />

          {/* Hudbird AI & Local MCP / LLM Integration */}
          <div className="settings-group">
            <div className="group-title">Hudbird AI Engine & Local LLM (clientMcpHost)</div>
            
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">AI Engine Provider</div>
                <div className="setting-desc">Pilih engine inferensi untuk fitur Hudbird AI di noted</div>
              </div>
              <select
                className="mcp-select"
                value={mcpConfig.provider || 'builtin'}
                onChange={(e) => handleConfigChange('provider', e.target.value)}
              >
                <option value="builtin">⚡ Built-in Engine (Default / Offline)</option>
                <option value="ollama">🦙 Ollama (http://localhost:11434)</option>
                <option value="lmstudio">🧪 LM Studio (http://localhost:1234)</option>
                <option value="custom">🌐 Custom OpenAI-compatible URL</option>
              </select>
            </div>

            {mcpConfig.provider !== 'builtin' && (
              <div className="mcp-llm-config-box">
                {mcpConfig.provider === 'custom' && (
                  <div className="mcp-field-row">
                    <label className="mcp-field-label">API Endpoint</label>
                    <input
                      type="text"
                      className="mcp-input"
                      placeholder="http://localhost:8000"
                      value={mcpConfig.endpoint || ''}
                      onChange={(e) => handleConfigChange('endpoint', e.target.value)}
                    />
                  </div>
                )}

                <div className="mcp-field-row">
                  <label className="mcp-field-label">Model Name</label>
                  <div className="mcp-model-input-wrap">
                    <input
                      type="text"
                      className="mcp-input"
                      placeholder={mcpConfig.provider === 'ollama' ? 'llama3.2 atau deepseek-r1:8b' : 'local-model'}
                      value={mcpConfig.model || ''}
                      onChange={(e) => handleConfigChange('model', e.target.value)}
                    />
                  </div>
                  <div className="mcp-model-pills">
                    <span className="mcp-model-pill" onClick={() => handleConfigChange('model', 'llama3.2:1b')}>llama3.2:1b</span>
                    <span className="mcp-model-pill" onClick={() => handleConfigChange('model', 'llama3.2')}>llama3.2</span>
                    <span className="mcp-model-pill" onClick={() => handleConfigChange('model', 'deepseek-r1:8b')}>deepseek-r1:8b</span>
                    <span className="mcp-model-pill" onClick={() => handleConfigChange('model', 'mistral')}>mistral</span>
                    <span className="mcp-model-pill" onClick={() => handleConfigChange('model', 'qwen2.5')}>qwen2.5</span>
                  </div>
                </div>

                {mcpConfig.provider === 'custom' && (
                  <div className="mcp-field-row">
                    <label className="mcp-field-label">API Key (Optional)</label>
                    <input
                      type="password"
                      className="mcp-input"
                      placeholder="sk-..."
                      value={mcpConfig.apiKey || ''}
                      onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    />
                  </div>
                )}

                <div className="mcp-test-row">
                  <button
                    className="mcp-test-btn"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    <RefreshCw size={13} className={isTesting ? 'spin-anim' : ''} />
                    <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
                  </button>

                  {testResult && (
                    <div className={`mcp-test-badge ${testResult.success ? 'badge-success' : 'badge-error'}`}>
                      {testResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mcp-capabilities-card">
              <div className="mcp-card-title">
                <Sparkles size={14} className="text-ai-purple" />
                <span>Status & Kemampuan Hudbird AI</span>
              </div>
              <div className="mcp-status-summary">
                {mcpConfig.provider === 'builtin' ? (
                  <span className="text-muted-xs">⚡ Menggunakan Built-in Engine (Cepat, 100% offline di browser tanpa instalasi tambahan).</span>
                ) : (
                  <span className="text-muted-xs">🦙 Terhubung ke <strong>{mcpConfig.provider.toUpperCase()}</strong> (Model: <code>{mcpConfig.model || 'default'}</code>) untuk inferensi AI sungguhan.</span>
                )}
              </div>
              <div className="mcp-features-tags">
                <span className="mcp-tag">✨ Executive Summarization</span>
                <span className="mcp-tag">✅ Action Items Extraction</span>
                <span className="mcp-tag">✍️ Tone & Writing Enhancement</span>
                <span className="mcp-tag">💡 Brainstorming & Outlines</span>
                <span className="mcp-tag">🌐 Multi-language Translation</span>
                <span className="mcp-tag">📊 Table & Code Generation</span>
              </div>
            </div>
          </div>

          <div className="menu-divider" />

          {/* App Info */}
          <div className="settings-group">
            <div className="group-title">About noted app</div>
            <div className="noted-about-box">
              <div className="about-app-badge">
                <ShieldCheck size={16} />
                <span>noted app v1.1.0</span>
              </div>
              <p className="about-text">
                All-in-one connected workspace for notes, docs, and project management. Built with a modular design system, intelligent writing assistant, and offline-first persistence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
