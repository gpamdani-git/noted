import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  Copy,
  Database,
  Edit3,
  ExternalLink,
  HelpCircle,
  Menu,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Users,
  X
} from 'lucide-react';
import { DOCS_DATA } from './docsData';
import { renderInlineMarkdown } from '../../utils/markdownRenderer';
import { showToast } from '../common/Toast';
import { GithubNavPill } from '../common/OpenSourceLinks';
import { NotedFooter } from '../common/NotedFooter';
import notedLogo from '../../assets/noted-brand-logo.png';
import './NotedDocsPage.css';

// Icon resolver helper for categories
const CATEGORY_ICONS = {
  BookOpen: BookOpen,
  Edit3: Edit3,
  Database: Database,
  Cloud: Cloud,
  Users: Users,
  Shield: Shield
};

/**
 * Robust line-by-line Markdown Block Parser for Notion Docs
 * Accurately parses headings, unordered lists, ordered lists, callout boxes,
 * GFM tables, syntax code blocks, and body paragraphs without greedy collapses.
 */
export function parseMarkdownToBlocks(markdownText) {
  if (!markdownText) return [];

  const lines = markdownText.trim().split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip blank lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 2. Fenced Code Blocks (```)
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```(\w*)/);
      const language = langMatch ? langMatch[1] : '';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n')
      });
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.replace(/^####\s+/, '') });
      i++;
      continue;
    }

    // 4. Blockquotes or Callout Alerts (> [!NOTE] or > )
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      let isAlert = false;
      let alertType = 'note';

      while (i < lines.length && lines[i].trim().startsWith('>')) {
        let content = lines[i].trim().replace(/^>\s?/, '');
        if (content.startsWith('[!NOTE]') || content.startsWith('[!TIP]') || content.startsWith('[!IMPORTANT]')) {
          isAlert = true;
          if (content.includes('TIP')) alertType = 'tip';
          if (content.includes('IMPORTANT')) alertType = 'important';
          content = content.replace(/\[!(NOTE|TIP|IMPORTANT)\]/, '').trim();
        }
        if (content) quoteLines.push(content);
        i++;
      }
      blocks.push({
        type: isAlert ? 'callout' : 'quote',
        alertType,
        text: quoteLines.join(' ')
      });
      continue;
    }

    // 5. GFM Tables (| header |)
    if (trimmed.startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const cleanRows = tableLines.filter((r) => !r.includes(':---') && !r.includes('---'));
      if (cleanRows.length > 0) {
        const header = cleanRows[0]
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean);
        const rows = cleanRows.slice(1).map((r) =>
          r
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean)
        );
        blocks.push({
          type: 'table',
          header,
          rows
        });
      }
      continue;
    }

    // 6. Unordered Lists (- or *)
    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ul',
        items
      });
      continue;
    }

    // 7. Ordered Lists (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'ol',
        items
      });
      continue;
    }

    // 8. Paragraph: collect standard lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'p',
        text: paraLines.join(' ')
      });
    }
  }

  return blocks;
}

// Bilingual Synonym & Token Mapping for Smart Help Center Search
const SEARCH_SYNONYMS = {
  databases: ['database', 'tabel', 'table', 'kanban', 'board'],
  database: ['databases', 'tabel', 'table', 'kanban', 'board'],
  table: ['tabel', 'database', 'kolom', 'baris'],
  tabel: ['table', 'database', 'kanban'],
  kanban: ['board', 'database', 'tabel', 'table'],
  shortcuts: ['shortcut', 'pintasan', 'slash', '/', '⌘k', 'command'],
  shortcut: ['shortcuts', 'pintasan', 'slash', '/', '⌘k', 'command'],
  pintasan: ['shortcut', 'shortcuts', 'slash', '/', '⌘k', 'command'],
  slash: ['/', 'perintah', 'command', 'pintasan', 'shortcut'],
  export: ['ekspor', 'impor', 'import', 'markdown', '.md', 'pdf'],
  ekspor: ['export', 'impor', 'import', 'markdown', '.md', 'pdf'],
  markdown: ['.md', 'ekspor', 'export', 'format'],
  sync: ['sinkronisasi', 'tersinkronisasi', 'neon', 'cloud', 'postgresql'],
  sinkronisasi: ['sync', 'neon', 'cloud', 'postgresql'],
  vault: ['indexeddb', 'sqlite', 'offline', 'lokal', 'local'],
  offline: ['vault', 'indexeddb', 'sqlite', 'lokal', 'tamu', 'guest'],
  indexeddb: ['vault', 'offline', 'sqlite', 'lokal'],
  neon: ['postgresql', 'cloud', 'sync', 'sinkronisasi']
};

const STOP_WORDS = new Set([
  'and', 'dan', 'or', 'atau', 'the', 'di', 'ke', 'dari', 'for', 'untuk', 'with', 'dengan', 'yang', 'in', 'on', 'to', 'of'
]);

/**
 * Smart multi-token & synonym-aware search for Help Center articles.
 * Handles multi-word topic pills like "Kanban & Table Databases" or "Pintasan Slash (/)"
 * as well as natural-language queries in Indonesian and English.
 */
export function searchDocsArticles(rawQuery, allArticles) {
  if (!rawQuery || !rawQuery.trim()) return [];
  const q = rawQuery.toLowerCase().trim();

  // Extract meaningful search tokens
  const rawTokens = q
    .replace(/[()[\]&,+:;]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, '').trim())
    .filter((t) => t && !STOP_WORDS.has(t));

  // Preserve "/" if the user explicitly searched for slash or "/"
  if (q.includes('/') && !rawTokens.includes('/')) {
    rawTokens.push('/');
  }

  const tokens = rawTokens.length > 0 ? rawTokens : [q];

  const scored = [];
  for (const article of allArticles) {
    const titleLower = (article.title || '').toLowerCase();
    const summaryLower = (article.summary || '').toLowerCase();
    const categoryLower = (article.categoryName || '').toLowerCase();
    const contentLower = (article.content || '').toLowerCase();

    let score = 0;
    let matchedTokens = 0;

    // 1. Exact full-phrase match bonus
    if (titleLower.includes(q)) score += 120;
    if (summaryLower.includes(q)) score += 70;
    if (categoryLower.includes(q)) score += 50;
    if (contentLower.includes(q)) score += 35;

    // 2. Token + synonym matching
    for (const token of tokens) {
      const candidates = [token, ...(SEARCH_SYNONYMS[token] || [])];
      let tokenMatched = false;

      for (const cand of candidates) {
        const isPrimary = cand === token;
        const weight = isPrimary ? 1 : 0.75;

        if (titleLower.includes(cand)) {
          score += 36 * weight;
          tokenMatched = true;
        }
        if (summaryLower.includes(cand)) {
          score += 20 * weight;
          tokenMatched = true;
        }
        if (categoryLower.includes(cand)) {
          score += 15 * weight;
          tokenMatched = true;
        }
        if (contentLower.includes(cand)) {
          score += 10 * weight;
          tokenMatched = true;
        }
      }

      if (tokenMatched) {
        matchedTokens += 1;
      }
    }

    if (score > 0) {
      scored.push({
        article,
        score,
        matchedTokens
      });
    }
  }

  scored.sort((a, b) => {
    if (b.matchedTokens !== a.matchedTokens) {
      return b.matchedTokens - a.matchedTokens;
    }
    return b.score - a.score;
  });

  return scored.map((item) => item.article);
}

export function NotedDocsPage({
  onOpenApp,
  onOpenLanding,
  onOpenDownload,
  lang: propLang,
  onSetLang,
  theme,
  onToggleTheme
}) {
  const [localLang, setLocalLang] = useState('id'); // Default Indonesian
  const lang = propLang || localLang;
  const setLang = (nextLang) => {
    setLocalLang(nextLang);
    onSetLang?.(nextLang);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState('getting-started');
  const [activeArticleId, setActiveArticleId] = useState('intro-to-noted');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const t = useMemo(() => DOCS_DATA[lang] || DOCS_DATA.id, [lang]);

  // Flatten all articles for search index and prev/next resolution
  const allArticles = useMemo(() => {
    const list = [];
    t.categories.forEach((cat) => {
      cat.articles.forEach((art) => {
        list.push({
          ...art,
          categoryId: cat.id,
          categoryName: cat.name
        });
      });
    });
    return list;
  }, [t]);

  // Current active article resolution
  const currentArticle = useMemo(() => {
    return allArticles.find((a) => a.id === activeArticleId) || allArticles[0];
  }, [allArticles, activeArticleId]);

  // Parse current article markdown to Notion AST blocks
  const articleBlocks = useMemo(() => {
    return parseMarkdownToBlocks(currentArticle?.content || '');
  }, [currentArticle]);

  // Current active category resolution
  const currentCategory = useMemo(() => {
    return t.categories.find((c) => c.id === currentArticle?.categoryId) || t.categories[0];
  }, [t, currentArticle]);

  // Smart search results (or all articles when ⌘K Command Palette is opened with empty query)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return isPaletteOpen ? allArticles : [];
    }
    return searchDocsArticles(searchQuery, allArticles);
  }, [searchQuery, allArticles, isPaletteOpen]);

  // Find previous and next article
  const currentIdx = allArticles.findIndex((a) => a.id === currentArticle?.id);
  const prevArticle = currentIdx > 0 ? allArticles[currentIdx - 1] : null;
  const nextArticle = currentIdx < allArticles.length - 1 ? allArticles[currentIdx + 1] : null;

  const handleSelectArticle = (catId, artId) => {
    setActiveCategoryId(catId);
    setActiveArticleId(artId);
    setSearchQuery('');
    setIsPaletteOpen(false);
    setSelectedResultIndex(0);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePopularTagClick = (tag) => {
    setSearchQuery(tag);
    setIsPaletteOpen(true);
    setSelectedResultIndex(0);
    const matched = searchDocsArticles(tag, allArticles);
    if (matched.length > 0) {
      setActiveCategoryId(matched[0].categoryId);
      setActiveArticleId(matched[0].id);
    }
  };

  const handleOpenCommandPalette = () => {
    setIsPaletteOpen(true);
    setSelectedResultIndex(0);
    const input = document.getElementById('docs-search-input');
    input?.focus();
  };

  const handleFeedback = (type) => {
    setFeedback((prev) => ({
      ...prev,
      [currentArticle.id]: type
    }));
    showToast(t.meta.helpfulFeedback, 'success', 2500);
  };

  const handleCopyCode = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(text);
      showToast(lang === 'id' ? 'Teks disalin ke clipboard!' : 'Copied to clipboard!', 'success');
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch {
      // safe fallback
    }
  };

  // Keyboard shortcut listener: `⌘K` / `Ctrl+K` opens Command Palette & Search, Escape closes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
        setSelectedResultIndex(0);
        const input = document.getElementById('docs-search-input');
        input?.focus();
      } else if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`noted-docs-page ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="docs-header">
        <div className="docs-nav-inner">
          <div className="docs-nav-left">
            <button
              type="button"
              className="docs-back-btn"
              onClick={onOpenLanding}
              aria-label={t.meta.backToHome}
              title={t.meta.backToHome}
            >
              <ArrowLeft size={16} />
              <div className="docs-brand-badge">
                <img
                  src={notedLogo}
                  alt="Noted"
                  className="docs-brand-logo-img"
                />
              </div>
              <span className="brand-name">Noted</span>
            </button>
            <span className="docs-header-divider">/</span>
            <span className="docs-section-badge">{lang === 'id' ? 'Bantuan' : 'Docs'}</span>
          </div>

          <div className="docs-nav-right">
            {/* GitHub Open Source Star Button */}
            <GithubNavPill label="Star" />

            {/* Language Switcher */}
            <div className="docs-lang-toggle">
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
                className="docs-theme-btn"
                onClick={onToggleTheme}
                title="Toggle Theme"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            )}

            {/* Only this explicit button opens the Workspace App */}
            <button
              type="button"
              className="docs-launch-btn"
              onClick={onOpenApp}
            >
              <span>{t.meta.launchApp}</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="docs-mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              aria-label="Toggle Sidebar"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SEARCH BANNER */}
      <section className="docs-hero-section">
        <div className="docs-hero-container">
          <div className="docs-hero-badge">
            <Sparkles size={13} />
            <span>{t.meta.siteTitle}</span>
          </div>
          <h1 className="docs-hero-title">{t.meta.heroTitle}</h1>
          <p className="docs-hero-subtitle">{t.meta.heroSubtitle}</p>

          {/* Search Bar Input + ⌘K Command Palette */}
          <div className="docs-search-bar-wrap">
            <div className="docs-search-bar">
              <Search size={18} className="search-icon" />
              <input
                id="docs-search-input"
                type="text"
                placeholder={t.meta.searchPlaceholder}
                value={searchQuery}
                onFocus={() => setIsPaletteOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsPaletteOpen(true);
                  setSelectedResultIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedResultIndex((prev) =>
                      searchResults.length > 0 ? (prev + 1) % searchResults.length : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedResultIndex((prev) =>
                      searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0
                    );
                  } else if (e.key === 'Enter' && searchResults.length > 0) {
                    e.preventDefault();
                    const picked = searchResults[selectedResultIndex] || searchResults[0];
                    if (picked) {
                      handleSelectArticle(picked.categoryId, picked.id);
                    }
                  } else if (e.key === 'Escape') {
                    setIsPaletteOpen(false);
                    setSearchQuery('');
                  }
                }}
                autoComplete="off"
              />
              {searchQuery || isPaletteOpen ? (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setIsPaletteOpen(false);
                  }}
                  aria-label="Clear Search"
                >
                  <X size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="docs-cmdk-btn"
                  className="search-shortcut-hint"
                  onClick={handleOpenCommandPalette}
                  title="Command Palette (⌘K)"
                >
                  ⌘K
                </button>
              )}
            </div>

            {/* Live Search & ⌘K Command Palette Results Dropdown */}
            {(searchQuery || isPaletteOpen) && (
              <div
                className="docs-search-results-dropdown animate-fade-in"
                role="listbox"
                aria-label="Docs Search Results"
              >
                <div className="docs-palette-header">
                  <span>
                    {searchQuery.trim()
                      ? `${searchResults.length} ${lang === 'id' ? 'panduan cocok' : 'matching guides'}`
                      : lang === 'id'
                        ? 'COMMAND PALETTE (⌘K) · NAVIGASI CEPAT & PANDUAN'
                        : 'COMMAND PALETTE (⌘K) · QUICK ACTIONS & GUIDES'}
                  </span>
                  <span className="docs-palette-esc-hint">ESC</span>
                </div>

                {!searchQuery.trim() && (
                  <div className="docs-palette-quick-actions">
                    <button
                      type="button"
                      className="docs-palette-action-pill"
                      onClick={() => {
                        setIsPaletteOpen(false);
                        onOpenApp?.();
                      }}
                    >
                      <ArrowRight size={13} />
                      <span>{lang === 'id' ? 'Buka Workspace Noted' : 'Open Noted Workspace'}</span>
                    </button>
                    {onOpenDownload && (
                      <button
                        type="button"
                        className="docs-palette-action-pill"
                        onClick={() => {
                          setIsPaletteOpen(false);
                          onOpenDownload();
                        }}
                      >
                        <Cloud size={13} />
                        <span>{lang === 'id' ? 'Unduh Desktop & Mobile' : 'Download Desktop & Mobile'}</span>
                      </button>
                    )}
                    {onToggleTheme && (
                      <button
                        type="button"
                        className="docs-palette-action-pill"
                        onClick={() => {
                          onToggleTheme();
                        }}
                      >
                        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                        <span>{lang === 'id' ? 'Ganti Tema Gelap/Terang' : 'Toggle Dark/Light Theme'}</span>
                      </button>
                    )}
                  </div>
                )}

                {searchResults.length > 0 ? (
                  <div className="search-results-list">
                    {searchResults.map((result, idx) => (
                      <div
                        key={result.id}
                        className={`search-result-item ${idx === selectedResultIndex ? 'selected' : ''}`}
                        onClick={() => handleSelectArticle(result.categoryId, result.id)}
                        onMouseEnter={() => setSelectedResultIndex(idx)}
                        role="option"
                        aria-selected={idx === selectedResultIndex}
                        tabIndex={0}
                      >
                        <span className="result-category">{result.categoryName}</span>
                        <h4 className="result-title">{result.title}</h4>
                        <p className="result-summary">{result.summary}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="search-no-results">
                    <HelpCircle size={24} className="no-res-icon" />
                    <p>{t.meta.noResultsFound}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Popular Searches Tags */}
          <div className="docs-popular-tags">
            <span className="popular-label">{t.meta.popularTopicsTitle}:</span>
            <div className="tags-list">
              {t.popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`popular-tag-btn ${searchQuery === tag ? 'active' : ''}`}
                  onClick={() => handlePopularTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN DOCS CANVAS (SIDEBAR + ARTICLE VIEW) */}
      <div className="docs-main-layout">
        <div className="docs-layout-container">
          {/* Left Documentation Sidebar */}
          <aside className={`docs-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header-label">{t.meta.categoriesTitle}</div>
            <nav className="docs-categories-tree">
              {t.categories.map((cat) => {
                const IconComponent = CATEGORY_ICONS[cat.icon] || BookOpen;
                const isCatActive = cat.id === currentArticle?.categoryId;

                return (
                  <div key={cat.id} className="category-group">
                    <div
                      className={`category-title-row ${isCatActive ? 'active' : ''}`}
                      onClick={() => {
                        // Open first article in category
                        if (cat.articles.length > 0) {
                          handleSelectArticle(cat.id, cat.articles[0].id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <IconComponent size={16} className="cat-icon" />
                      <span>{cat.name}</span>
                    </div>

                    <ul className="category-articles-list">
                      {cat.articles.map((art) => {
                        const isArtActive = art.id === currentArticle?.id;
                        return (
                          <li key={art.id}>
                            <button
                              type="button"
                              className={`article-link-btn ${isArtActive ? 'active' : ''}`}
                              onClick={() => handleSelectArticle(cat.id, art.id)}
                            >
                              <span className="art-bullet" />
                              <span className="art-title">{art.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </aside>

          {/* Right Article Viewer Canvas */}
          <main className="docs-article-canvas">
            {/* Breadcrumb row */}
            <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
              <span>Docs</span>
              <ChevronRight size={13} className="crumb-sep" />
              <span>{currentCategory?.name}</span>
              <ChevronRight size={13} className="crumb-sep" />
              <span className="active-crumb">{currentArticle?.title}</span>
            </nav>

            {/* Article Header */}
            <header className="article-header">
              <h1 className="article-title">{currentArticle?.title}</h1>
              <p className="article-summary">{currentArticle?.summary}</p>

              <div className="article-meta-bar">
                <span className="meta-item">
                  <Clock size={14} />
                  <span>
                    {currentArticle?.readTime} {t.meta.readingTime}
                  </span>
                </span>
                <span className="meta-sep">•</span>
                <span className="meta-item">
                  <span>
                    {t.meta.lastUpdated}: {currentArticle?.updated}
                  </span>
                </span>
              </div>
            </header>

            {/* Article Content Render (Notion-grade AST formatting) */}
            <article className="article-body">
              {articleBlocks.map((block, idx) => {
                switch (block.type) {
                  case 'h1':
                    return (
                      <h1 key={idx} className="docs-md-h1">
                        {renderInlineMarkdown(block.text)}
                      </h1>
                    );
                  case 'h2':
                    return (
                      <h2 key={idx} className="docs-md-h2">
                        {renderInlineMarkdown(block.text)}
                      </h2>
                    );
                  case 'h3':
                    return (
                      <h3 key={idx} className="docs-md-h3">
                        {renderInlineMarkdown(block.text)}
                      </h3>
                    );
                  case 'h4':
                    return (
                      <h4 key={idx} className="docs-md-h4">
                        {renderInlineMarkdown(block.text)}
                      </h4>
                    );
                  case 'p':
                    return (
                      <p key={idx} className="docs-md-p">
                        {renderInlineMarkdown(block.text)}
                      </p>
                    );
                  case 'ul':
                    return (
                      <ul key={idx} className="docs-md-ul">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="docs-md-li">
                            {renderInlineMarkdown(item)}
                          </li>
                        ))}
                      </ul>
                    );
                  case 'ol':
                    return (
                      <ol key={idx} className="docs-md-ol">
                        {block.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="docs-md-li">
                            {renderInlineMarkdown(item)}
                          </li>
                        ))}
                      </ol>
                    );
                  case 'callout':
                    return (
                      <div key={idx} className={`docs-callout-box ${block.alertType}`}>
                        <Sparkles size={16} className="callout-icon" />
                        <div className="callout-text">{renderInlineMarkdown(block.text)}</div>
                      </div>
                    );
                  case 'quote':
                    return (
                      <blockquote key={idx} className="docs-md-quote">
                        <p>{renderInlineMarkdown(block.text)}</p>
                      </blockquote>
                    );
                  case 'table':
                    return (
                      <div key={idx} className="docs-table-wrap">
                        <table className="docs-data-table">
                          <thead>
                            <tr>
                              {block.header.map((h, hIdx) => (
                                <th key={hIdx}>{renderInlineMarkdown(h)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx}>{renderInlineMarkdown(cell)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  case 'code':
                    return (
                      <div key={idx} className="docs-code-wrap">
                        <div className="code-header-bar">
                          <span className="code-lang-label">{block.language || 'text'}</span>
                          <button
                            type="button"
                            className="code-copy-btn"
                            onClick={() => handleCopyCode(block.code)}
                            title="Copy snippet"
                          >
                            {copiedSnippet === block.code ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                            <span>{copiedSnippet === block.code ? (lang === 'id' ? 'Tersalin' : 'Copied') : (lang === 'id' ? 'Salin' : 'Copy')}</span>
                          </button>
                        </div>
                        <pre>
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </article>

            {/* Helpful Feedback Box */}
            <div className="article-feedback-card">
              <span className="feedback-prompt">{t.meta.helpfulPrompt}</span>
              <div className="feedback-buttons">
                <button
                  type="button"
                  className={`feedback-btn ${feedback[currentArticle.id] === 'yes' ? 'selected' : ''}`}
                  onClick={() => handleFeedback('yes')}
                >
                  <ThumbsUp size={14} />
                  <span>{t.meta.helpfulYes}</span>
                </button>
                <button
                  type="button"
                  className={`feedback-btn ${feedback[currentArticle.id] === 'no' ? 'selected' : ''}`}
                  onClick={() => handleFeedback('no')}
                >
                  <ThumbsDown size={14} />
                  <span>{t.meta.helpfulNo}</span>
                </button>
              </div>
            </div>

            {/* Prev / Next Article Navigation Footer */}
            <div className="article-nav-footer">
              {prevArticle ? (
                <button
                  type="button"
                  className="article-nav-link prev"
                  onClick={() => handleSelectArticle(prevArticle.categoryId, prevArticle.id)}
                >
                  <span className="nav-sub">{t.meta.prevArticle}</span>
                  <div className="nav-main">
                    <ArrowLeft size={16} />
                    <span>{prevArticle.title}</span>
                  </div>
                </button>
              ) : (
                <div className="article-nav-link placeholder" />
              )}

              {nextArticle ? (
                <button
                  type="button"
                  className="article-nav-link next"
                  onClick={() => handleSelectArticle(nextArticle.categoryId, nextArticle.id)}
                >
                  <span className="nav-sub">{t.meta.nextArticle}</span>
                  <div className="nav-main">
                    <span>{nextArticle.title}</span>
                    <ArrowRight size={16} />
                  </div>
                </button>
              ) : (
                <div className="article-nav-link placeholder" />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 4. STANDARDIZED HARMONIZED FOOTER */}
      <NotedFooter
        lang={lang}
        onSetLang={setLang}
        onOpenApp={onOpenApp}
        onOpenLanding={onOpenLanding}
        onOpenDownload={onOpenDownload}
        onOpenDocs={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}

export default NotedDocsPage;

