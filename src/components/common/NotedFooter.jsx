import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { GITHUB_CONFIG } from './OpenSourceLinks';
import './NotedFooter.css';

const FOOTER_DICTIONARY = {
  id: {
    brandQuote: 'Ruang kerja cerdas untuk catatan hierarkis, database, dan sinkronisasi real-time.',
    copyright: '© 2026 Noted. Dibangun untuk fokus, kecepatan, dan privasi pengguna.',
    columns: {
      docs: {
        title: 'Dokumentasi',
        links: [
          { label: 'Panduan Slash', type: 'docs' },
          { label: 'Database', type: 'docs' },
          { label: 'Vault Offline', type: 'docs' },
          { label: 'Pusat Bantuan', type: 'docs' }
        ]
      },
      platform: {
        title: 'Platform',
        links: [
          { label: 'macOS Desktop', type: 'download', platformKey: 'macArm' },
          { label: 'Windows Desktop', type: 'download', platformKey: 'winExe' },
          { label: 'Android App', type: 'download', platformKey: 'androidApk' },
          { label: 'Web Browser', type: 'app' }
        ]
      },
      openSource: {
        title: 'Open Source',
        links: [
          { label: 'GitHub Repository', href: GITHUB_CONFIG.repoUrl },
          { label: 'Fork di GitHub', href: GITHUB_CONFIG.forkUrl },
          { label: 'Beri Bintang (★)', href: GITHUB_CONFIG.repoUrl, isStar: true },
          { label: 'Laporkan Bug', href: GITHUB_CONFIG.issuesUrl },
          { label: 'Catatan Rilis', href: GITHUB_CONFIG.releasesUrl }
        ]
      },
      account: {
        title: 'Akun & Privasi',
        links: [
          { label: 'Masuk Google', type: 'login' },
          { label: 'Mode Tamu', type: 'app' },
          { label: 'Keamanan & Privasi', type: 'docs' },
          { label: 'Lisensi MIT', href: GITHUB_CONFIG.repoUrl }
        ]
      }
    }
  },
  en: {
    brandQuote: 'The connected workspace for hierarchical notes, databases, and real-time cloud sync.',
    copyright: '© 2026 Noted. Built for focus, speed, and user privacy.',
    columns: {
      docs: {
        title: 'Documentation',
        links: [
          { label: 'Slash Commands', type: 'docs' },
          { label: 'Databases', type: 'docs' },
          { label: 'Offline Vault', type: 'docs' },
          { label: 'Help Center', type: 'docs' }
        ]
      },
      platform: {
        title: 'Platform',
        links: [
          { label: 'macOS Desktop', type: 'download', platformKey: 'macArm' },
          { label: 'Windows Desktop', type: 'download', platformKey: 'winExe' },
          { label: 'Android App', type: 'download', platformKey: 'androidApk' },
          { label: 'Web Browser', type: 'app' }
        ]
      },
      openSource: {
        title: 'Open Source',
        links: [
          { label: 'GitHub Repository', href: GITHUB_CONFIG.repoUrl },
          { label: 'Fork on GitHub', href: GITHUB_CONFIG.forkUrl },
          { label: 'Star (★)', href: GITHUB_CONFIG.repoUrl, isStar: true },
          { label: 'Report an Issue', href: GITHUB_CONFIG.issuesUrl },
          { label: 'Release Notes', href: GITHUB_CONFIG.releasesUrl }
        ]
      },
      account: {
        title: 'Account & Privacy',
        links: [
          { label: 'Google Sign In', type: 'login' },
          { label: 'Guest Mode', type: 'app' },
          { label: 'Security & Privacy', type: 'docs' },
          { label: 'MIT License', href: GITHUB_CONFIG.repoUrl }
        ]
      }
    }
  }
};

export function NotedFooter({
  lang = 'id',
  onSetLang,
  onOpenApp,
  onOpenLanding,
  onOpenDownload,
  onOpenDocs,
  onOpenLogin
}) {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const current = FOOTER_DICTIONARY[lang] || FOOTER_DICTIONARY.id;

  const handleAction = (link) => {
    if (link.type === 'app' && onOpenApp) onOpenApp();
    else if (link.type === 'docs' && onOpenDocs) onOpenDocs();
    else if (link.type === 'download' && onOpenDownload) onOpenDownload(link.platformKey || null);
    else if (link.type === 'login') {
      if (onOpenLogin) onOpenLogin();
      else if (onOpenApp) onOpenApp();
    }
  };

  return (
    <footer className="noted-unified-footer">
      <div className="noted-unified-footer-inner">
        {/* Brand Column */}
        <div className="noted-footer-brand-col">
          <button
            type="button"
            className="noted-footer-brand"
            onClick={onOpenLanding}
            aria-label="Noted Home"
          >
            <div className="noted-footer-brand-icon">
              <img
                src="/noted-brand-logo.png"
                alt="Noted"
                className="noted-footer-brand-img"
              />
            </div>
            <span className="noted-footer-brand-title">Noted</span>
          </button>

          <p className="noted-footer-quote">{current.brandQuote}</p>

          {/* Strictly 2 Languages: Bahasa Indonesia and English (US) */}
          <div className="noted-footer-lang-wrap">
            <button
              type="button"
              className="noted-footer-lang-btn"
              onClick={() => setIsLangOpen((prev) => !prev)}
              aria-label="Select Language"
            >
              <Globe size={15} />
              <span>{lang === 'id' ? 'Bahasa Indonesia' : 'English (US)'}</span>
              {isLangOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isLangOpen && (
              <div className="noted-footer-lang-menu">
                <button
                  type="button"
                  className={`noted-footer-lang-item ${lang === 'id' ? 'active' : ''}`}
                  onClick={() => {
                    onSetLang?.('id');
                    setIsLangOpen(false);
                  }}
                >
                  Bahasa Indonesia
                </button>
                <button
                  type="button"
                  className={`noted-footer-lang-item ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => {
                    onSetLang?.('en');
                    setIsLangOpen(false);
                  }}
                >
                  English (US)
                </button>
              </div>
            )}
          </div>

          <p className="noted-footer-copy">{current.copyright}</p>
        </div>

        {/* 5 Standardized Link Columns */}
        <div className="noted-footer-grid">
          {Object.entries(current.columns).map(([colKey, col]) => (
            <div key={colKey} className="noted-footer-col">
              <h5>{col.title}</h5>
              {col.links.map((link, idx) => {
                if (link.href) {
                  return (
                    <a
                      key={idx}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{link.label}</span>
                    </a>
                  );
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAction(link)}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default NotedFooter;

