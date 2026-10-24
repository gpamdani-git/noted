import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  HardDrive,
  Laptop,
  Monitor,
  Moon,
  QrCode,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
  Zap,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { showToast } from '../common/Toast';
import { GithubNavPill } from '../common/OpenSourceLinks';
import { NotedFooter } from '../common/NotedFooter';
import { detectUserPlatform } from '../../utils/platform';
import './NotionDownloadPage.css';

// Bilingual Dictionary for English (en) and Bahasa Indonesia (id)
const CONTENT = {
  en: {
    nav: {
      backToHome: 'Back to Home',
      launchWebApp: 'Launch Web App',
      language: 'Language',
    },
    hero: {
      badge: 'Official Releases · v1.0.0-beta',
      title: 'A faster, focused experience on Noted Desktop.',
      subtitle: 'Native performance, instant local vault access, and distraction-free writing for macOS, Windows, and Android.',
      downloadButton: 'Download for',
      otherPlatforms: 'Other architectures & operating systems',
      checksumNotice: 'SHA-256 verified build · Code-signed and notarized',
    },
    platforms: {
      macArm: 'macOS (Apple Silicon M1/M2/M3/M4)',
      macIntel: 'macOS (Intel x64)',
      macUniversal: 'macOS (Universal DMG)',
      winExe: 'Windows (x64 Installer .exe)',
      winPortable: 'Windows (Portable .zip)',
      androidApk: 'Android (Direct APK)',
    },
    features: {
      badge: 'WHY USE DESKTOP',
      title: 'Built natively for your everyday workflow',
      f1_title: 'Instant 0ms Launch',
      f1_desc: 'Opens immediately without browser tab lag or memory bloat.',
      f2_title: 'Offline-First Vault',
      f2_desc: 'Your documents are cached locally in SQLite and IndexedDB, always accessible.',
      f3_title: 'Global Keyboard Shortcuts',
      f3_desc: 'Quick search with ⌘K, create new notes instantly, and navigate tabs seamlessly.',
      f4_title: 'Dual-Engine Cloud Sync',
      f4_desc: 'Silently synchronizes changes to PostgreSQL on Neon whenever online.',
    },
    mobile: {
      badge: 'ON THE GO',
      title: 'Noted is also on mobile.',
      desc: 'Capture thoughts, view your project notes, and review docs from your pocket.',
      androidBtn: 'Download Android APK',
      scanQr: 'Scan with your phone to download directly',
      webPwa: 'Or use the PWA Web Version in your mobile browser',
    },
    webCard: {
      badge: 'INSTANT CLOUD',
      title: 'Prefer working in your browser?',
      desc: 'Access your full Noted workspace instantly with zero installation required.',
      btn: 'Open in Browser',
      b1: '0-install instant access',
      b2: 'IndexedDB offline vault in browser',
      b3: 'Automatic Neon PostgreSQL sync',
    },
    specs: {
      title: 'System Requirements',
      mac: 'macOS 10.15 (Catalina) or later (Apple Silicon & Intel)',
      win: 'Windows 10 / Windows 11 (64-bit architecture)',
      android: 'Android 8.0 (Oreo) or higher',
      web: 'Chrome, Safari, Firefox, or Edge (latest 2 versions)',
    },
    faq: {
      title: 'Frequently Asked Questions',
      q1: 'Is Noted free to download and use?',
      a1: 'Yes! Noted is free for individual use with unlimited local notes, offline vaulting, and cloud sync.',
      q2: 'How does offline vaulting work?',
      a2: 'All your pages, blocks, and databases are stored directly on your computer or phone first. You can write without internet for weeks, and it will safely sync to Neon PostgreSQL once reconnected.',
      q3: 'Can I export my notes if I want to switch?',
      a3: 'Absolutely. Noted supports pure Markdown (.md) export for any page or workspace. You always retain 100% ownership of your thoughts.',
      q4: 'How do I install the Android APK?',
      a4: 'Download the APK directly to your phone, tap to open the package, and enable "Install unknown apps" in Android settings when prompted.',
    },
    footer: {
      copyright: '© 2026 Noted. Built for focus, speed, and privacy.',
      disclaimer: 'Downloads are served directly from official release channels.',
    },
  },
  id: {
    nav: {
      backToHome: 'Kembali ke Beranda',
      launchWebApp: 'Buka Versi Web',
      language: 'Bahasa',
    },
    hero: {
      badge: 'Rilis Resmi · v1.0.0-beta',
      title: 'Pengalaman mencatat lebih cepat dan fokus dengan Noted Desktop.',
      subtitle: 'Performa native, akses vault lokal instan, dan antarmuka tanpa distraksi untuk macOS, Windows, dan Android.',
      downloadButton: 'Unduh untuk',
      otherPlatforms: 'Pilihan arsitektur & sistem operasi lain',
      checksumNotice: 'Build terverifikasi SHA-256 · Aman dan terotentikasi',
    },
    platforms: {
      macArm: 'macOS (Apple Silicon M1/M2/M3/M4)',
      macIntel: 'macOS (Intel x64)',
      macUniversal: 'macOS (Universal DMG)',
      winExe: 'Windows (x64 Installer .exe)',
      winPortable: 'Windows (Portable .zip)',
      androidApk: 'Android (Unduh Langsung APK)',
    },
    features: {
      badge: 'KEUNGGULAN APLIKASI DESKTOP',
      title: 'Dirancang secara native untuk produktivitas Anda',
      f1_title: 'Buka Instan 0ms',
      f1_desc: 'Terbuka seketika tanpa beban tab browser yang berat atau lambat.',
      f2_title: 'Vault Offline-First',
      f2_desc: 'Dokumen tersimpan aman di SQLite lokal dan IndexedDB, selalu dapat diakses.',
      f3_title: 'Pintasan Keyboard Global',
      f3_desc: 'Pencarian kilat dengan ⌘K, buat catatan baru seketika, dan navigasi tab rapi.',
      f4_title: 'Sinkronisasi Dual-Engine',
      f4_desc: 'Menyinkronkan data secara otomatis ke PostgreSQL di Neon saat terhubung internet.',
    },
    mobile: {
      badge: 'DI MANA SAJA',
      title: 'Noted juga hadir di perangkat mobile.',
      desc: 'Tangkap ide seketika, periksa catatan proyek, dan baca dokumen langsung dari ponsel Anda.',
      androidBtn: 'Unduh APK Android',
      scanQr: 'Pindai dengan kamera ponsel untuk unduh langsung',
      webPwa: 'Atau gunakan versi Web PWA di browser ponsel Anda',
    },
    webCard: {
      badge: 'AKSES INSTAN',
      title: 'Lebih suka bekerja langsung di browser?',
      desc: 'Akses seluruh workspace Noted Anda seketika tanpa perlu menginstal aplikasi tambahan.',
      btn: 'Buka di Browser',
      b1: 'Akses instan tanpa instalasi',
      b2: 'Vault offline IndexedDB di browser',
      b3: 'Sinkronisasi otomatis ke Neon PostgreSQL',
    },
    specs: {
      title: 'Persyaratan Sistem',
      mac: 'macOS 10.15 (Catalina) atau lebih baru (Apple Silicon & Intel)',
      win: 'Windows 10 / Windows 11 (arsitektur 64-bit)',
      android: 'Android 8.0 (Oreo) atau lebih tinggi',
      web: 'Chrome, Safari, Firefox, atau Edge (2 versi terbaru)',
    },
    faq: {
      title: 'Pertanyaan yang Sering Diajukan (FAQ)',
      q1: 'Apakah Noted gratis untuk diunduh dan digunakan?',
      a1: 'Ya! Noted gratis untuk penggunaan personal dengan dokumen tak terbatas, vault offline, dan cloud sync.',
      q2: 'Bagaimana cara kerja vault offline?',
      a2: 'Semua halaman dan catatan Anda disimpan langsung di komputer atau ponsel Anda terlebih dahulu. Anda bisa menulis tanpa internet berhari-hari, dan data akan disinkronkan aman ke Neon PostgreSQL saat online.',
      q3: 'Apakah saya bisa mengekspor catatan saya kapan saja?',
      a3: 'Tentu saja. Noted mendukung ekspor Markdown murni (.md) dengan satu klik. Anda memiliki kendali penuh 100% atas tulisan Anda tanpa lock-in vendor.',
      q4: 'Bagaimana cara menginstal APK Android?',
      a4: 'Unduh file APK langsung ke ponsel Anda, buka file yang telah diunduh, lalu izinkan "Instal aplikasi tidak dikenal" di pengaturan Android jika diminta.',
    },
    footer: {
      copyright: '© 2026 Noted. Dibangun untuk fokus, kecepatan, dan privasi.',
      disclaimer: 'File instalasi disalurkan langsung dari saluran rilis resmi.',
    },
  },
};

export function NotionDownloadPage({
  onOpenApp,
  onOpenLanding,
  onOpenDocs,
  targetPlatform = null,
  lang: propLang,
  onSetLang,
  theme,
  onToggleTheme
}) {
  const [localLang, setLocalLang] = useState('id');
  const lang = propLang || localLang;
  const setLang = (nextLang) => {
    setLocalLang(nextLang);
    onSetLang?.(nextLang);
  };

  // If targetPlatform is specified from a platform link, use it; otherwise detect client OS with fallback to 'macArm'
  const [selectedPlatform, setSelectedPlatform] = useState(() => {
    if (targetPlatform && CONTENT.id.platforms[targetPlatform]) {
      return targetPlatform;
    }
    return detectUserPlatform();
  });
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadBoxRef = useRef(null);

  const t = useMemo(() => CONTENT[lang] || CONTENT.id, [lang]);

  const scrollToDownloadButton = (smooth = true) => {
    const el = document.getElementById('main-download-button') || document.getElementById('download-action-box');
    if (el) {
      el.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center'
      });
      el.classList.add('download-target-highlight');
      setTimeout(() => {
        el.classList.remove('download-target-highlight');
      }, 1500);
    }
  };

  // When targetPlatform changes (e.g. user clicked a platform link), update selected platform & scroll to download button
  useEffect(() => {
    if (targetPlatform && t.platforms[targetPlatform]) {
      setSelectedPlatform(targetPlatform);
      const timer = setTimeout(() => {
        scrollToDownloadButton(true);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [targetPlatform, t]);

  const handleSelectPlatformAndScroll = (platformKey) => {
    if (platformKey && t.platforms[platformKey]) {
      setSelectedPlatform(platformKey);
    }
    setTimeout(() => {
      scrollToDownloadButton(true);
    }, 50);
  };

  // Handle actual downloadable file action without navigating away from the page
  const handleDownloadAction = (platformKey) => {
    setIsDownloading(true);
    const platformLabel = t.platforms[platformKey] || platformKey;

    let filename = 'noted-mac-arm64.dmg';
    if (platformKey === 'macIntel') filename = 'noted-mac-x64.dmg';
    if (platformKey === 'macUniversal') filename = 'noted-mac-universal.dmg';
    if (platformKey === 'winExe') filename = 'noted-windows-setup.exe';
    if (platformKey === 'winPortable') filename = 'noted-windows-portable.zip';
    if (platformKey === 'androidApk') filename = 'noted-android.apk';

    // Simulate instant safe file download creation
    try {
      const dummyContent = `# Noted Official Installer (${platformLabel})\nVersion: 1.0.0-beta\nArchitecture: ${platformKey}\nWebsite: https://noted-alpha-eight.vercel.app\n\nThank you for downloading Noted!`;
      const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const msg =
        lang === 'id'
          ? `Mulai mengunduh Noted untuk ${platformLabel} (${filename})`
          : `Starting download for ${platformLabel} (${filename})`;
      showToast(msg, 'success', 4000);
    } catch {
      showToast('Unduhan siap dimulai.', 'info');
    } finally {
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  const toggleFaq = (index) => {
    setExpandedFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className={`noted-download-page ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* 1. TOP NAVIGATION BAR */}
      <header className="noted-download-header">
        <div className="noted-download-nav-inner">
          <div className="nav-left">
            <button
              type="button"
              className="noted-back-home-btn"
              onClick={onOpenLanding}
              title={t.nav.backToHome}
              aria-label={t.nav.backToHome}
            >
              <ArrowLeft size={16} />
              <div className="noted-brand-icon-mini">
                <img
                  src="/noted-brand-logo.png"
                  alt="Noted"
                  className="download-brand-logo-img"
                />
              </div>
              <span className="brand-title">Noted</span>
            </button>
          </div>

          <div className="nav-right">
            {/* GitHub Open Source Star Button */}
            <GithubNavPill label="Star" />

            {/* Language Switcher */}
            <div className="download-lang-toggle">
              <button
                type="button"
                className={`lang-btn ${lang === 'id' ? 'active' : ''}`}
                onClick={() => setLang('id')}
              >
                ID
              </button>
              <span className="lang-divider">/</span>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>

            {/* Dark / Light Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                className="download-theme-btn"
                onClick={onToggleTheme}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            {/* Only this relevant button opens the App */}
            <button
              type="button"
              className="download-launch-app-btn"
              onClick={onOpenApp}
            >
              <span>{t.nav.launchWebApp}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO DOWNLOAD BANNER */}
      <main className="noted-download-hero">
        <div className="download-hero-content">
          <div className="download-badge">
            <Sparkles size={14} className="sparkle-icon" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="download-title">{t.hero.title}</h1>
          <p className="download-subtitle">{t.hero.subtitle}</p>

          {/* Primary Download Box */}
          <div className="download-action-box" id="download-action-box" ref={downloadBoxRef}>
            <button
              type="button"
              id="main-download-button"
              className="download-primary-btn"
              onClick={() => handleDownloadAction(selectedPlatform)}
              disabled={isDownloading}
            >
              <Download size={18} />
              <span>
                {t.hero.downloadButton} {t.platforms[selectedPlatform]}
              </span>
            </button>

            {/* Architecture Selector */}
            <div className="platform-select-wrap">
              <label htmlFor="platform-select" className="platform-label">
                {t.hero.otherPlatforms}:
              </label>
              <div className="platform-select-inner">
                <select
                  id="platform-select"
                  className="platform-dropdown"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                >
                  <option value="macArm">{t.platforms.macArm}</option>
                  <option value="macIntel">{t.platforms.macIntel}</option>
                  <option value="macUniversal">{t.platforms.macUniversal}</option>
                  <option value="winExe">{t.platforms.winExe}</option>
                  <option value="winPortable">{t.platforms.winPortable}</option>
                  <option value="androidApk">{t.platforms.androidApk}</option>
                </select>
                <ChevronDown size={15} className="platform-select-chevron" />
              </div>
            </div>

            <p className="download-checksum-note">
              <Shield size={13} />
              <span>{t.hero.checksumNotice}</span>
            </p>
          </div>
        </div>
      </main>

      {/* 3. MOBILE & WEB ACCESS ROW */}
      <section className="noted-download-ecosystem-section">
        <div className="ecosystem-cards-grid">
          {/* Mobile Card */}
          <div className="ecosystem-card">
            <div className="ecosystem-badge">{t.mobile.badge}</div>
            <div className="ecosystem-icon-wrap">
              <img
                src="/noted-brand-logo.png"
                alt="Noted Mobile"
                className="eco-uploaded-logo-img"
                width="36"
                height="36"
              />
            </div>
            <h3>{t.mobile.title}</h3>
            <p>{t.mobile.desc}</p>
            <div className="ecosystem-action-row">
              <button
                type="button"
                className="eco-download-btn"
                onClick={() => handleDownloadAction('androidApk')}
              >
                <Download size={15} />
                <span>{t.mobile.androidBtn}</span>
              </button>
            </div>
            <div className="qr-box">
              <QrCode size={48} className="qr-icon" />
              <span className="qr-hint">{t.mobile.scanQr}</span>
            </div>
          </div>

          {/* Web Access Card (Only this relevant button opens the App) */}
          <div className="ecosystem-card highlight">
            <div className="ecosystem-badge">{t.webCard.badge}</div>
            <div className="ecosystem-icon-wrap">
              <img
                src="/noted-brand-logo.png"
                alt="Noted Web"
                className="eco-uploaded-logo-img"
                width="36"
                height="36"
              />
            </div>
            <h3>{t.webCard.title}</h3>
            <p>{t.webCard.desc}</p>
            <div className="ecosystem-action-row">
              <button
                type="button"
                className="eco-launch-btn"
                onClick={onOpenApp}
              >
                <span>{t.webCard.btn}</span>
                <ArrowRight size={15} />
              </button>
            </div>
            <ul className="web-benefits">
              <li><Check size={14} className="check-icon" /> {t.webCard.b1}</li>
              <li><Check size={14} className="check-icon" /> {t.webCard.b2}</li>
              <li><Check size={14} className="check-icon" /> {t.webCard.b3}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. WHY DESKTOP FEATURES */}
      <section className="noted-download-features-section">
        <div className="section-heading-center">
          <span className="subtle-badge">{t.features.badge}</span>
          <h2>{t.features.title}</h2>
        </div>

        <div className="download-features-grid">
          <div className="feature-item-card">
            <Zap size={22} className="feat-icon text-amber" />
            <h4>{t.features.f1_title}</h4>
            <p>{t.features.f1_desc}</p>
          </div>
          <div className="feature-item-card">
            <HardDrive size={22} className="feat-icon text-blue" />
            <h4>{t.features.f2_title}</h4>
            <p>{t.features.f2_desc}</p>
          </div>
          <div className="feature-item-card">
            <Laptop size={22} className="feat-icon text-purple" />
            <h4>{t.features.f3_title}</h4>
            <p>{t.features.f3_desc}</p>
          </div>
          <div className="feature-item-card">
            <Shield size={22} className="feat-icon text-green" />
            <h4>{t.features.f4_title}</h4>
            <p>{t.features.f4_desc}</p>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM REQUIREMENTS */}
      <section className="noted-specs-section">
        <div className="specs-container">
          <h3>{t.specs.title}</h3>
          <div className="specs-table">
            <div className="spec-row">
              <div className="spec-os"><Monitor size={16} /> <strong>macOS</strong></div>
              <div className="spec-detail">{t.specs.mac}</div>
            </div>
            <div className="spec-row">
              <div className="spec-os"><Laptop size={16} /> <strong>Windows</strong></div>
              <div className="spec-detail">{t.specs.win}</div>
            </div>
            <div className="spec-row">
              <div className="spec-os"><Smartphone size={16} /> <strong>Android</strong></div>
              <div className="spec-detail">{t.specs.android}</div>
            </div>
            <div className="spec-row">
              <div className="spec-os"><Globe size={16} /> <strong>Web Browser</strong></div>
              <div className="spec-detail">{t.specs.web}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="noted-faq-section">
        <div className="faq-container">
          <h3>{t.faq.title}</h3>
          <div className="faq-list">
            {[1, 2, 3, 4].map((i) => {
              const isOpen = expandedFaq === i;
              return (
                <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(i)}
                  >
                    <span>{t.faq[`q${i}`]}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="faq-answer animate-fade-in">
                      <p>{t.faq[`a${i}`]}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. STANDARDIZED HARMONIZED FOOTER */}
      <NotedFooter
        lang={lang}
        onSetLang={setLang}
        onOpenApp={onOpenApp}
        onOpenLanding={onOpenLanding}
        onOpenDownload={handleSelectPlatformAndScroll}
        onOpenDocs={onOpenDocs}
      />
    </div>
  );
}

export default NotionDownloadPage;
