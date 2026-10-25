import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  Code2
} from 'lucide-react';
import { GithubNavPill, GITHUB_CONFIG } from '../common/OpenSourceLinks';
import { NotedFooter } from '../common/NotedFooter';
import notedLogo from '../../assets/noted-brand-logo.png';
import { LANDING_CONTENT } from './landingData';
import {
  NotedHero3DCanvas,
  ProductMenuIllustration,
  PlatformCardIllustration,
  CapabilityCardIllustration,
  PhilosophyIllustration
} from './NotedIllustrations';
import './NotionLandingPage.css';

export function NotionLandingPage({
  onOpenApp,
  onOpenDownload,
  onOpenDocs,
  onOpenLogin,
  currentUser,
  lang = 'id',
  onSetLang,
  theme,
  onToggleTheme
}) {
  const t = useMemo(() => LANDING_CONTENT[lang] || LANDING_CONTENT.id, [lang]);
  const rotatingWords = t.hero.rotatingWords;
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [activeBentoTab, setActiveBentoTab] = useState('sync');
  const [interactiveTasks, setInteractiveTasks] = useState(t.mockup.tasks);
  const [activeHeroStage, setActiveHeroStage] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const productMenuTimerRef = useRef(null);

  const handleOpenProductMenu = () => {
    if (productMenuTimerRef.current) {
      clearTimeout(productMenuTimerRef.current);
      productMenuTimerRef.current = null;
    }
    setIsProductMenuOpen(true);
  };

  const handleCloseProductMenu = () => {
    if (productMenuTimerRef.current) {
      clearTimeout(productMenuTimerRef.current);
    }
    productMenuTimerRef.current = setTimeout(() => {
      setIsProductMenuOpen(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (productMenuTimerRef.current) {
        clearTimeout(productMenuTimerRef.current);
      }
    };
  }, []);

  // Sync interactive tasks when language changes
  useEffect(() => {
    setInteractiveTasks(t.mockup.tasks);
  }, [t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [rotatingWords]);

  // Continuous 4-stage Hero Looping Animation ("Noted App in Action")
  useEffect(() => {
    if (isHeroPaused) return undefined;
    const stageTimer = setInterval(() => {
      setActiveHeroStage((prev) => (prev + 1) % 4);
    }, 3200);
    return () => clearInterval(stageTimer);
  }, [isHeroPaused]);

  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setHeroTilt({ x: normX, y: normY });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0 });
    setIsHeroPaused(false);
  };

  const toggleTask = (id) => {
    setInteractiveTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div className={`noted-landing-container ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* 1. STICKY TOP NAVIGATION BAR (No Pricing Button) */}
      <header className="noted-landing-header">
        <div className="noted-landing-nav-inner">
          {/* Logo & Brand + Nav Dropdown */}
          <div className="noted-nav-left-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              className="noted-landing-brand"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              role="button"
              tabIndex={0}
            >
              <div className="noted-brand-icon">
                <img
                  src={notedLogo}
                  alt="Noted"
                  className="noted-brand-logo-img"
                />
              </div>
              <span className="noted-brand-name">Noted</span>
            </div>

            {/* Desktop Nav Links with Product Dropdown (No Pricing) */}
            <nav className="noted-landing-nav-links" aria-label="Main Navigation">
              <div
                className="noted-nav-dropdown-wrapper"
                onMouseEnter={handleOpenProductMenu}
                onMouseLeave={handleCloseProductMenu}
              >
                <button
                  type="button"
                  className="noted-nav-link-btn"
                  onClick={() => setIsProductMenuOpen((prev) => !prev)}
                  aria-expanded={isProductMenuOpen}
                >
                  <span>{t.nav.product}</span>
                  <ChevronDown size={14} className={`noted-chevron ${isProductMenuOpen ? 'open' : ''}`} />
                </button>

                {isProductMenuOpen && (
                  <div
                    role="menu"
                    className="noted-nav-dropdown-menu animate-fade-in"
                    onMouseEnter={handleOpenProductMenu}
                    onMouseLeave={handleCloseProductMenu}
                  >
                    <div className="noted-dropdown-col">
                      <span className="noted-dropdown-category">{t.nav.coreSystem}</span>
                      <button
                        type="button"
                        className="noted-dropdown-item"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          if (onOpenDocs) onOpenDocs();
                        }}
                      >
                        <ProductMenuIllustration type="docs" />
                        <div>
                          <strong>{t.nav.docsWikisTitle}</strong>
                          <p>{t.nav.docsWikisDesc}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="noted-dropdown-item"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          if (onOpenApp) onOpenApp();
                        }}
                      >
                        <ProductMenuIllustration type="database" />
                        <div>
                          <strong>{t.nav.databasesTitle}</strong>
                          <p>{t.nav.databasesDesc}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="noted-dropdown-item"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          if (onOpenApp) onOpenApp();
                        }}
                      >
                        <ProductMenuIllustration type="ai" />
                        <div>
                          <strong>{t.nav.aiAgentsTitle}</strong>
                          <p>{t.nav.aiAgentsDesc}</p>
                        </div>
                      </button>
                    </div>

                    <div className="noted-dropdown-col noted-dropdown-subcol">
                      <span className="noted-dropdown-category">{t.nav.downloads}</span>
                      <button
                        type="button"
                        className="noted-dropdown-item"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          if (onOpenDownload) onOpenDownload('macArm');
                        }}
                      >
                        <ProductMenuIllustration type="desktop" />
                        <div>
                          <strong>{t.nav.desktopTitle}</strong>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="noted-dropdown-item"
                        onClick={() => {
                          setIsProductMenuOpen(false);
                          if (onOpenDownload) onOpenDownload('androidApk');
                        }}
                      >
                        <ProductMenuIllustration type="mobile" />
                        <div>
                          <strong>{t.nav.mobileTitle}</strong>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="noted-landing-nav-actions">
            {/* GitHub Open Source Star Button */}
            <GithubNavPill label="Star" />

            {/* Language Switcher */}
            <div className="download-lang-toggle">
              <button
                type="button"
                className={`lang-btn ${lang === 'id' ? 'active' : ''}`}
                onClick={() => onSetLang?.('id')}
              >
                ID
              </button>
              <span className="lang-divider">/</span>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => onSetLang?.('en')}
              >
                EN
              </button>
            </div>

            {onToggleTheme && (
              <button
                type="button"
                className="noted-theme-toggle-btn"
                onClick={onToggleTheme}
                aria-label="Toggle Dark/Light Mode"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            {currentUser && !currentUser.isGuest ? (
              <button
                type="button"
                className="noted-primary-cta-btn"
                onClick={onOpenApp}
              >
                <span>{lang === 'id' ? 'Buka Workspace' : 'Open Workspace'}</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="noted-nav-link-text noted-login-link"
                  onClick={onOpenLogin}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="noted-primary-cta-btn"
                  onClick={onOpenApp}
                >
                  <span>{t.nav.startFree}</span>
                  <ArrowRight size={15} />
                </button>
              </>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="noted-mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="noted-mobile-nav-drawer animate-fade-in">
            <button
              type="button"
              className="mobile-nav-item"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDownload?.();
              }}
            >
              {t.nav.downloadApps}
            </button>
            <button
              type="button"
              className="mobile-nav-item"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDocs?.();
              }}
            >
              {lang === 'id' ? 'Pusat Bantuan & Docs' : 'Help Center & Docs'}
            </button>
            <a
              href={GITHUB_CONFIG.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              GitHub (★ Star)
            </a>
            {currentUser && !currentUser.isGuest ? (
              <button
                type="button"
                className="mobile-cta-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenApp?.();
                }}
              >
                <span>{lang === 'id' ? 'Buka Workspace' : 'Open Workspace'}</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenLogin?.();
                  }}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="mobile-cta-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenApp?.();
                  }}
                >
                  <span>{t.nav.startFree}</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
            <div className="mobile-drawer-lang-row">
              <span className="mobile-drawer-lang-label">
                {lang === 'id' ? 'Bahasa:' : 'Language:'}
              </span>
              <div className="mobile-drawer-lang-btns">
                <button
                  type="button"
                  className={`mobile-lang-pill ${lang === 'id' ? 'active' : ''}`}
                  onClick={() => onSetLang?.('id')}
                >
                  Bahasa Indonesia
                </button>
                <button
                  type="button"
                  className={`mobile-lang-pill ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => onSetLang?.('en')}
                >
                  English (US)
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <main className="noted-landing-hero">
        <div className="noted-hero-content">
          <div className="noted-hero-badge">
            <Sparkles size={14} className="hero-sparkle" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="noted-hero-title">
            {t.hero.titlePrefix} <br className="hero-break" />
            <span className="hero-rotating-word" key={currentWordIndex}>
              {rotatingWords[currentWordIndex]}
            </span>{' '}
            {t.hero.titleSuffix}
          </h1>

          <p className="noted-hero-subtitle">
            {t.hero.subtitle}
          </p>

          <div className="noted-hero-actions">
            <button type="button" className="noted-btn-hero-primary" onClick={onOpenApp}>
              <span>{t.hero.startFree}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="noted-btn-hero-secondary"
              onClick={onOpenDownload}
            >
              <span>{t.hero.downloadApp}</span>
            </button>
          </div>
        </div>

        {/* 3D Interactive Looping Animation Stage: "Noted App in Action" */}
        <div
          className="noted-hero-mockup-wrapper noted-hero-3d-stage"
          onMouseMove={handleHeroMouseMove}
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={handleHeroMouseLeave}
        >
          {/* 3D Polyhedron & Orbital Data-Flow Canvas + 4-Stage Looping Workflow Stepper (ABOVE Browser Illustration) */}
          <div className="noted-hero-loop-engine">
            <div className="hero-loop-header">
              <span className="hero-loop-badge">
                <span className="loop-live-dot" />
                {t.heroFlow?.engineBadge}
              </span>
              <span className="hero-loop-live-snippet">
                {t.heroFlow?.stages?.[activeHeroStage]?.liveSnippet}
              </span>
            </div>

            {/* 3D Orbital Canvas */}
            <NotedHero3DCanvas activeStage={activeHeroStage} theme={theme} tilt={heroTilt} />

            {/* 4-Stage Interactive Looping Stepper Pills */}
            <div className="hero-loop-stages-grid" role="Region" aria-label="Noted Workflow Loop">
              {(t.heroFlow?.stages || []).map((stage, idx) => {
                const isActive = activeHeroStage === idx;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    data-testid={`hero-loop-stage-${stage.id}`}
                    className={`hero-loop-stage-card ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveHeroStage(idx)}
                  >
                    <div className="stage-card-head">
                      <span className="stage-step-pill">{stage.step}</span>
                      <strong className="stage-card-title">{stage.title}</strong>
                    </div>
                    <p className="stage-card-desc">{stage.desc}</p>
                    <div className="stage-progress-track">
                      <div className={`stage-progress-fill ${isActive ? 'animating' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Preview Window (Browser Illustration) */}
          <div className="noted-3d-perspective-rig">
            <div className="noted-mockup-window">
              {/* Window Titlebar */}
              <div className="noted-mockup-titlebar">
                <div className="window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="window-tab">
                  <ProductMenuIllustration type="docs" />
                  <span className="tab-title">{t.mockup.tabTitle}</span>
                </div>
                <div className="window-actions">
                  <span className="live-status-chip">
                    <span className="pulse-indicator" />
                    {t.mockup.vaultStatus}
                  </span>
                </div>
              </div>

              {/* Mockup Body: Split Sidebar & Content */}
              <div className="noted-mockup-body">
                {/* Mockup Mini-Sidebar */}
                <aside className="noted-mockup-sidebar">
                  <div className="mockup-sidebar-header">
                    <div className="user-avatar-mini">
                      <img src={notedLogo} alt="Noted" className="mockup-avatar-logo-img" />
                    </div>
                    <span className="workspace-name">{t.mockup.workspaceName}</span>
                  </div>
                  <div className="mockup-sidebar-section">
                    <span className="section-label">{t.mockup.favoritesLabel}</span>
                    <div className={`sidebar-mock-row ${activeHeroStage === 0 ? 'active' : ''}`}>
                      <ProductMenuIllustration type="docs" />
                      <span>{t.mockup.roadmap}</span>
                    </div>
                    <div className={`sidebar-mock-row ${activeHeroStage === 2 ? 'active' : ''}`}>
                      <PhilosophyIllustration iconType="zap" />
                      <span>{t.mockup.architecture}</span>
                    </div>
                    <div className={`sidebar-mock-row ${activeHeroStage === 1 ? 'active' : ''}`}>
                      <ProductMenuIllustration type="ai" />
                      <span>{t.mockup.ideaSandbox}</span>
                    </div>
                    <div className={`sidebar-mock-row ${activeHeroStage === 3 ? 'active' : ''}`}>
                      <ProductMenuIllustration type="database" />
                      <span>{t.mockup.knowledgeWiki}</span>
                    </div>
                  </div>
                  <div className="mockup-sidebar-footer">
                    <div className="sidebar-mock-row">
                      <PhilosophyIllustration iconType="cloud" />
                      <span>{t.mockup.settingsCloud}</span>
                    </div>
                  </div>
                </aside>

                {/* Mockup Editor Canvas */}
                <div className="noted-mockup-editor">
                  <div className="mockup-page-header">
                    <span className="mockup-page-icon">
                      <ProductMenuIllustration type="docs" />
                    </span>
                    <h2 className="mockup-page-heading">{t.mockup.tabTitle}</h2>
                  </div>

                  {/* Callout Block */}
                  <div className="mockup-callout">
                    <span className="callout-icon">
                      <PhilosophyIllustration iconType="zap" />
                    </span>
                    <div className="callout-text">
                      <strong>{t.mockup.calloutHeading}</strong> {t.mockup.calloutText}
                    </div>
                  </div>

                  {/* Interactive Checklist Block */}
                  <div className="mockup-tasks-section">
                    <div className="tasks-header">
                      <span>{t.mockup.checklistTitle}</span>
                      <span className="tasks-count">
                        {interactiveTasks.filter((task) => task.completed).length}/{interactiveTasks.length} {t.mockup.checkedCount}
                      </span>
                    </div>
                    <div className="tasks-list">
                      {interactiveTasks.map((task) => (
                        <label
                          key={task.id}
                          className={`mockup-task-item ${task.completed ? 'completed' : ''}`}
                          onClick={() => toggleTask(task.id)}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTask(task.id)}
                          />
                          <span className="task-custom-checkbox">
                            {task.completed && <Check size={12} />}
                          </span>
                          <span className="task-label">{task.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Floating AI Assistant Bubble */}
                  <div className={`mockup-ai-floating-bar animate-pulse-glow ${activeHeroStage === 1 ? 'ai-stage-highlight' : ''}`}>
                    <div className="ai-icon-pulse">
                      <Sparkles size={16} />
                    </div>
                    <div className="ai-text-input">
                      <span className="ai-prompt-prefix">{t.mockup.aiPrefix}</span>
                      <span className="ai-prompt-body">{t.mockup.aiDrafting}</span>
                    </div>
                    <span className="ai-action-badge">{t.mockup.aiReady}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. PLATFORM AVAILABILITY (Custom Isometric Illustrations) */}
      <section className="noted-social-proof-section">
        <p className="noted-social-proof-label">{t.socialProof.label}</p>
        <div className="noted-logos-grid platform-grid">
          <div className="platform-card" onClick={() => onOpenDownload?.('macArm')} role="button" tabIndex={0}>
            <PlatformCardIllustration type="desktop" />
            <div className="platform-text">
              <strong>{t.socialProof.desktopTitle}</strong>
              <span>{t.socialProof.desktopSub}</span>
            </div>
          </div>
          <div className="platform-card" onClick={() => onOpenDownload?.('androidApk')} role="button" tabIndex={0}>
            <PlatformCardIllustration type="mobile" />
            <div className="platform-text">
              <strong>{t.socialProof.mobileTitle}</strong>
              <span>{t.socialProof.mobileSub}</span>
            </div>
          </div>
          <div className="platform-card" onClick={onOpenApp} role="button" tabIndex={0}>
            <PlatformCardIllustration type="web" />
            <div className="platform-text">
              <strong>{t.socialProof.webTitle}</strong>
              <span>{t.socialProof.webSub}</span>
            </div>
          </div>
          <div className="platform-card" onClick={onOpenApp} role="button" tabIndex={0}>
            <PlatformCardIllustration type="vault" />
            <div className="platform-text">
              <strong>{t.socialProof.vaultTitle}</strong>
              <span>{t.socialProof.vaultSub}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENTO FEATURE GRID */}
      <section className="noted-bento-section" id="features">
        <div className="noted-section-header">
          <span className="noted-badge-subtle">{t.bento.badge}</span>
          <h2 className="noted-section-title">{t.bento.title}</h2>
          <p className="noted-section-desc">{t.bento.desc}</p>
        </div>

        {/* Tab Controls with Custom Illustrations */}
        <div className="noted-bento-tabs" role="tablist">
          <button
            type="button"
            className={`bento-tab-btn ${activeBentoTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveBentoTab('sync')}
            role="tab"
            aria-selected={activeBentoTab === 'sync'}
          >
            <PhilosophyIllustration iconType="cloud" />
            <span>{t.bento.tabs.sync}</span>
          </button>
          <button
            type="button"
            className={`bento-tab-btn ${activeBentoTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveBentoTab('editor')}
            role="tab"
            aria-selected={activeBentoTab === 'editor'}
          >
            <ProductMenuIllustration type="docs" />
            <span>{t.bento.tabs.editor}</span>
          </button>
          <button
            type="button"
            className={`bento-tab-btn ${activeBentoTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveBentoTab('privacy')}
            role="tab"
            aria-selected={activeBentoTab === 'privacy'}
          >
            <PhilosophyIllustration iconType="shield" />
            <span>{t.bento.tabs.privacy}</span>
          </button>
        </div>

        {/* Bento Cards Showcase */}
        <div className="noted-bento-card-container">
          {activeBentoTab === 'sync' && (
            <div className="noted-bento-card animate-fade-in">
              <div className="bento-card-info">
                <span className="bento-badge">{t.bento.sync.badge}</span>
                <h3 className="bento-card-title">{t.bento.sync.title}</h3>
                <p className="bento-card-text">{t.bento.sync.text}</p>
                <ul className="bento-bullet-list">
                  {t.bento.sync.bullets.map((b, i) => (
                    <li key={i}><Check size={16} className="bullet-check" /> {b}</li>
                  ))}
                </ul>
                <button type="button" className="bento-cta-btn" onClick={onOpenApp}>
                  <span>{t.bento.sync.cta}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="bento-card-visual">
                <div className="bento-doc-preview">
                  <div className="doc-preview-header">
                    <span className="doc-tag">{t.bento.sync.previewTag}</span>
                    <span className="doc-meta">{t.bento.sync.previewStatus}</span>
                  </div>
                  <h4>{t.bento.sync.previewTitle}</h4>
                  <p>{t.bento.sync.previewDesc}</p>
                  <div className="doc-code-block">
                    <code>syncEngine.pushToNeon(&#123; status: 'synced', vault: 'IndexedDB' &#125;);</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeBentoTab === 'editor' && (
            <div className="noted-bento-card animate-fade-in">
              <div className="bento-card-info">
                <span className="bento-badge">{t.bento.editor.badge}</span>
                <h3 className="bento-card-title">{t.bento.editor.title}</h3>
                <p className="bento-card-text">{t.bento.editor.text}</p>
                <ul className="bento-bullet-list">
                  {t.bento.editor.bullets.map((b, i) => (
                    <li key={i}><Check size={16} className="bullet-check" /> {b}</li>
                  ))}
                </ul>
                <button type="button" className="bento-cta-btn" onClick={onOpenApp}>
                  <span>{t.bento.editor.cta}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="bento-card-visual">
                <div className="bento-search-preview">
                  <div className="search-mock-bar">
                    <ProductMenuIllustration type="docs" />
                    <span>{t.bento.editor.previewBar}</span>
                  </div>
                  <div className="search-result-card">
                    <div className="result-chip">{t.bento.editor.previewChip}</div>
                    <p className="result-text">{t.bento.editor.previewText}</p>
                    <div className="result-citation">
                      <Code2 size={13} />
                      <span>{t.bento.editor.previewCitation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeBentoTab === 'privacy' && (
            <div className="noted-bento-card animate-fade-in">
              <div className="bento-card-info">
                <span className="bento-badge">{t.bento.privacy.badge}</span>
                <h3 className="bento-card-title">{t.bento.privacy.title}</h3>
                <p className="bento-card-text">{t.bento.privacy.text}</p>
                <ul className="bento-bullet-list">
                  {t.bento.privacy.bullets.map((b, i) => (
                    <li key={i}><Check size={16} className="bullet-check" /> {b}</li>
                  ))}
                </ul>
                <button type="button" className="bento-cta-btn" onClick={onOpenApp}>
                  <span>{t.bento.privacy.cta}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="bento-card-visual">
                <div className="bento-agent-preview">
                  <div className="agent-status-row">
                    <span className="agent-dot green" />
                    <span className="agent-title">{t.bento.privacy.previewTitle}</span>
                    <span className="agent-badge">{t.bento.privacy.previewBadge}</span>
                  </div>
                  <div className="agent-log-box">
                    <div className="log-line">{t.bento.privacy.log1}</div>
                    <div className="log-line">{t.bento.privacy.log2}</div>
                    <div className="log-line success">{t.bento.privacy.log3}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. CAPABILITIES GRID (Custom Miniature UI Illustrations) */}
      <section className="noted-usecases-section">
        <div className="noted-section-header">
          <span className="noted-badge-subtle">{t.capabilities.badge}</span>
          <h2 className="noted-section-title">{t.capabilities.title}</h2>
          <p className="noted-section-desc">{t.capabilities.desc}</p>
        </div>

        <div className="noted-usecases-grid">
          {t.capabilities.items.map((item, idx) => (
            <div key={idx} className="usecase-card">
              <div className="usecase-illustration-box">
                <CapabilityCardIllustration illustKey={item.illustKey} />
              </div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CORE PHILOSOPHY (Custom Architectural Emblems) */}
      <section className="noted-testimonials-section" id="testimonials">
        <div className="noted-section-header">
          <span className="noted-badge-subtle">{t.philosophy.badge}</span>
          <h2 className="noted-section-title">{t.philosophy.title}</h2>
        </div>

        <div className="noted-testimonials-grid">
          {t.philosophy.items.map((item, idx) => (
            <div key={idx} className="testimonial-card">
              <blockquote>{item.quote}</blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <PhilosophyIllustration iconType={item.iconType} />
                </div>
                <div className="author-info">
                  <strong>{item.author}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="noted-cta-section">
        <div className="noted-cta-box">
          <h2 className="cta-heading">{t.cta.heading}</h2>
          <p className="cta-subheading">{t.cta.subheading}</p>
          <div className="cta-button-row">
            <button type="button" className="noted-btn-hero-primary" onClick={onOpenApp}>
              <span>{t.cta.startFree}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="noted-btn-hero-secondary"
              onClick={onOpenLogin}
            >
              <span>{t.cta.loginGoogle}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. STANDARDIZED HARMONIZED FOOTER */}
      <NotedFooter
        lang={lang}
        onSetLang={onSetLang}
        onOpenApp={onOpenApp}
        onOpenLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onOpenDownload={onOpenDownload}
        onOpenDocs={onOpenDocs}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
}

export default NotionLandingPage;
