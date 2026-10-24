import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NotionLandingPage } from '../components/Landing/NotionLandingPage';
import { NotionDownloadPage } from '../components/Download/NotionDownloadPage';
import { NotedDocsPage } from '../components/Docs/NotedDocsPage';
import { NotedFooter } from '../components/common/NotedFooter';
import { GITHUB_CONFIG } from '../components/common/OpenSourceLinks';

describe('Harmonized Navigation, Strictly 2 Languages & Open Source Parity', () => {
  it('NotedFooter only displays strictly 2 languages (Bahasa Indonesia & English) and no extra dummy languages', () => {
    const handleSetLang = vi.fn();
    render(<NotedFooter lang="id" onSetLang={handleSetLang} />);

    // Open language menu
    const langBtn = screen.getByRole('button', { name: /Select Language/i });
    fireEvent.click(langBtn);

    // Verify exactly 2 language options are present
    expect(screen.getByRole('button', { name: 'Bahasa Indonesia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English (US)' })).toBeInTheDocument();

    // Verify dummy languages from Notion are NOT present
    expect(screen.queryByText('日本語')).not.toBeInTheDocument();
    expect(screen.queryByText('Français')).not.toBeInTheDocument();
    expect(screen.queryByText('Deutsch')).not.toBeInTheDocument();
    expect(screen.queryByText('Español')).not.toBeInTheDocument();

    // Clicking English calls onSetLang with 'en'
    fireEvent.click(screen.getByRole('button', { name: 'English (US)' }));
    expect(handleSetLang).toHaveBeenCalledWith('en');
  });

  it('renders 4 standardized columns in the simplified footer with Open Source and preserved useful links', () => {
    const handleOpenApp = vi.fn();
    const handleOpenDocs = vi.fn();
    const handleOpenDownload = vi.fn();

    render(
      <NotedFooter
        lang="id"
        onOpenApp={handleOpenApp}
        onOpenDocs={handleOpenDocs}
        onOpenDownload={handleOpenDownload}
      />
    );

    // Workspace column is removed
    expect(screen.queryByRole('heading', { level: 5, name: 'Workspace' })).not.toBeInTheDocument();

    // 4 standardized column headings
    expect(screen.getByRole('heading', { level: 5, name: 'Dokumentasi' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'Platform' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'Open Source' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: 'Akun & Privasi' })).toBeInTheDocument();

    // Open Source items
    const repoLink = screen.getByRole('link', { name: 'GitHub Repository' });
    expect(repoLink).toHaveAttribute('href', GITHUB_CONFIG.repoUrl);

    const forkLink = screen.getByRole('link', { name: 'Fork di GitHub' });
    expect(forkLink).toHaveAttribute('href', GITHUB_CONFIG.forkUrl);

    const starLink = screen.getByRole('link', { name: /Beri Bintang/i });
    expect(starLink).toHaveAttribute('href', GITHUB_CONFIG.repoUrl);

    const issuesLink = screen.getByRole('link', { name: 'Laporkan Bug' });
    expect(issuesLink).toHaveAttribute('href', GITHUB_CONFIG.issuesUrl);

    const releasesLink = screen.getByRole('link', { name: /Catatan Rilis/i });
    expect(releasesLink).toHaveAttribute('href', GITHUB_CONFIG.releasesUrl);

    // Simplified useful links
    fireEvent.click(screen.getByRole('button', { name: 'Pusat Bantuan' }));
    expect(handleOpenDocs).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /macOS Desktop/i }));
    expect(handleOpenDownload).toHaveBeenCalled();
  });

  it('renders GitHub Star pill and clean navigation in Landing page navbar', () => {
    render(<NotionLandingPage lang="id" onSetLang={vi.fn()} currentUser={null} />);

    const starPills = screen.getAllByRole('link', { name: /Star Noted on GitHub/i });
    expect(starPills.length).toBeGreaterThan(0);
    expect(starPills[0]).toHaveAttribute('href', GITHUB_CONFIG.repoUrl);

    // Direct Download & Doc buttons removed from header nav for a cleaner Notion style
    expect(screen.queryByRole('button', { name: 'Unduh' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bantuan' })).not.toBeInTheDocument();
  });

  it('renders GitHub Star pill and minimalist navigation in Download page navbar', () => {
    render(<NotionDownloadPage lang="id" onSetLang={vi.fn()} onOpenDocs={vi.fn()} />);

    const starPill = screen.getByRole('link', { name: /Star Noted on GitHub/i });
    expect(starPill).toBeInTheDocument();
    expect(starPill).toHaveAttribute('href', GITHUB_CONFIG.repoUrl);

    // Direct Docs button removed from header nav
    expect(screen.queryByRole('button', { name: 'Bantuan' })).not.toBeInTheDocument();
  });

  it('renders GitHub Star pill and minimalist navigation in Docs page navbar', () => {
    render(<NotedDocsPage lang="id" onSetLang={vi.fn()} onOpenDownload={vi.fn()} />);

    const starPill = screen.getByRole('link', { name: /Star Noted on GitHub/i });
    expect(starPill).toBeInTheDocument();
    expect(starPill).toHaveAttribute('href', GITHUB_CONFIG.repoUrl);

    // Direct Download button removed from header nav
    expect(screen.queryByRole('button', { name: 'Unduh' })).not.toBeInTheDocument();
  });
});

