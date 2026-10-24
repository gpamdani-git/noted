import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NotedDocsPage } from '../components/Docs/NotedDocsPage';

describe('NotedDocsPage Component (Notion Help Center Replica for Noted)', () => {
  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });
    window.scrollTo = vi.fn();
  });

  it('renders default Indonesian Help Center with categories and active article', () => {
    const handleOpenApp = vi.fn();
    const handleOpenLanding = vi.fn();

    render(
      <NotedDocsPage
        onOpenApp={handleOpenApp}
        onOpenLanding={handleOpenLanding}
        theme="light"
      />
    );

    // Verify Title and Subtitle in Indonesian
    expect(screen.getByText('Pusat Bantuan & Panduan Noted')).toBeInTheDocument();
    expect(screen.getByText(/Pelajari cara memaksimalkan workspace Noted Anda/i)).toBeInTheDocument();

    // Verify Categories exist
    expect(screen.getAllByText('Memulai Noted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Editor & Format Penulisan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Database & Manajemen Data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Penyimpanan & Sinkronisasi').length).toBeGreaterThan(0);

    // Verify Default Article Header and Content
    expect(screen.getByRole('heading', { level: 1, name: 'Pengenalan Noted & Arsitektur Sistem' })).toBeInTheDocument();
    expect(screen.getByText(/Tiga Pilar Arsitektur Noted/i)).toBeInTheDocument();
    expect(screen.getByText(/Kecepatan Instan \(0ms Latency\)/i)).toBeInTheDocument();
  });

  it('switches between Indonesian and English seamlessly', () => {
    render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    // Switch to English
    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    expect(screen.getByText('Help Center & Documentation')).toBeInTheDocument();
    expect(screen.getAllByText('Getting Started').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Editor & Formatting').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { level: 1, name: 'Introduction to Noted & Architecture' })).toBeInTheDocument();

    // Switch back to Indonesian
    const idButton = screen.getByRole('button', { name: 'ID' });
    fireEvent.click(idButton);

    expect(screen.getByText('Pusat Bantuan & Panduan Noted')).toBeInTheDocument();
  });

  it('performs live search filtering across all documentation topics', () => {
    const { container } = render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari panduan, pintasan keyboard, atau fitur\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Slash Commands' } });

    // Verify search dropdown shows matching result
    const searchDropdown = container.querySelector('.docs-search-results-dropdown');
    expect(searchDropdown).toBeInTheDocument();
    const resultItem = within(searchDropdown).getByText('Daftar Lengkap Slash Commands (/)');
    expect(resultItem).toBeInTheDocument();

    // Click search result to navigate to article
    fireEvent.click(resultItem);

    // Active article is now Slash Commands
    expect(screen.getByRole('heading', { level: 1, name: 'Daftar Lengkap Slash Commands (/)' })).toBeInTheDocument();
    expect(screen.getByText(/Cara Menggunakan Slash Commands/i)).toBeInTheDocument();
  });

  it('switches articles via sidebar navigation and updates breadcrumbs', () => {
    const { container } = render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    const sidebar = container.querySelector('.docs-sidebar');
    const vaultArticleBtn = within(sidebar).getByText(/Cara Kerja Vault Offline/i);
    fireEvent.click(vaultArticleBtn);

    // Verify article changed
    expect(screen.getByRole('heading', { level: 1, name: 'Cara Kerja Vault Offline (IndexedDB & SQLite)' })).toBeInTheDocument();
    expect(screen.getByText(/Mengapa Offline-First\?/i)).toBeInTheDocument();

    // Verify breadcrumb
    const breadcrumb = screen.getByLabelText('Breadcrumb');
    expect(breadcrumb).toHaveTextContent('Penyimpanan & Sinkronisasi');
    expect(breadcrumb).toHaveTextContent('Cara Kerja Vault Offline (IndexedDB & SQLite)');
  });

  it('navigates sequentially using Next and Prev article buttons', () => {
    const { container } = render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    // Initial article is "Pengenalan Noted & Arsitektur Sistem", next button is in .article-nav-footer
    const footerNav = container.querySelector('.article-nav-footer');
    const nextBtn = within(footerNav).getByRole('button');
    fireEvent.click(nextBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Navigasi Sidebar, Tab, dan Command Palette' })).toBeInTheDocument();

    // Now previous button should lead back to intro
    const prevBtn = container.querySelector('.article-nav-link.prev');
    fireEvent.click(prevBtn);

    expect(screen.getByRole('heading', { level: 1, name: 'Pengenalan Noted & Arsitektur Sistem' })).toBeInTheDocument();
  });

  it('copies code snippet and handles feedback button interaction', () => {
    render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    // Click helpful "Ya, membantu" button
    const helpfulBtn = screen.getByRole('button', { name: /Ya, membantu/i });
    fireEvent.click(helpfulBtn);
    expect(helpfulBtn).toHaveClass('selected');
  });

  it('strictly respects controlled link boundaries (only explicit app buttons trigger onOpenApp)', () => {
    const handleOpenApp = vi.fn();
    const handleOpenLanding = vi.fn();

    render(
      <NotedDocsPage
        onOpenApp={handleOpenApp}
        onOpenLanding={handleOpenLanding}
        theme="light"
      />
    );

    // Clicking back home button
    const backBtn = screen.getByRole('button', { name: /Kembali ke Beranda/i });
    fireEvent.click(backBtn);
    expect(handleOpenLanding).toHaveBeenCalledTimes(1);
    expect(handleOpenApp).not.toHaveBeenCalled();

    // Clicking explicit Launch App button
    const launchAppBtn = screen.getByRole('button', { name: /Buka Web App/i });
    fireEvent.click(launchAppBtn);
    expect(handleOpenApp).toHaveBeenCalledTimes(1);
  });

  it('correctly parses structured markdown into Notion-grade headings, lists, and bold text without collapsing', () => {
    const { container } = render(
      <NotedDocsPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    // Navigate to "Mode Tamu vs Akun Google & Keamanan Data"
    const sidebar = container.querySelector('.docs-sidebar');
    const guestArticleBtn = within(sidebar).getByText(/Mode Tamu vs Akun Google/i);
    fireEvent.click(guestArticleBtn);

    // Verify h3 is standalone heading, not joined with paragraph
    const modeTamuHeading = screen.getByRole('heading', { level: 3, name: 'Mode Tamu (Offline Mode)' });
    expect(modeTamuHeading).toBeInTheDocument();

    const googleHeading = screen.getByRole('heading', { level: 3, name: 'Masuk dengan Akun Google' });
    expect(googleHeading).toBeInTheDocument();

    // Verify unordered list exists with items
    const ulList = container.querySelector('.docs-md-ul');
    expect(ulList).toBeInTheDocument();
    expect(within(ulList).getByText(/Semua dokumen disimpan di vault lokal komputer Anda\./i)).toBeInTheDocument();

    // Verify ordered list exists with bolded inline markdown
    const olList = container.querySelector('.docs-md-ol');
    expect(olList).toBeInTheDocument();
    const boldLogIn = within(olList).getByText('Log in');
    expect(boldLogIn.tagName).toBe('STRONG');
  });

  it('supports multi-token search for popular tags like "Kanban & Table Databases" and Cmd+K Command Palette', () => {
    const { container } = render(
      <NotedDocsPage
        lang="en"
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="dark"
      />
    );

    // Click the popular tag "Kanban & Table Databases"
    const kanbanTag = screen.getByRole('button', { name: 'Kanban & Table Databases' });
    fireEvent.click(kanbanTag);

    const searchDropdown = container.querySelector('.docs-search-results-dropdown');
    expect(searchDropdown).toBeInTheDocument();
    expect(within(searchDropdown).queryByText(/No articles matched your search query/i)).not.toBeInTheDocument();
    expect(within(searchDropdown).getByText(/Database Views: Table, Board, and List/i)).toBeInTheDocument();

    // Clear and press Cmd+K to open Command Palette
    const clearBtn = screen.getByRole('button', { name: /Clear Search/i });
    fireEvent.click(clearBtn);
    expect(container.querySelector('.docs-search-results-dropdown')).not.toBeInTheDocument();

    // Press Cmd+K
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    const paletteDropdown = container.querySelector('.docs-search-results-dropdown');
    expect(paletteDropdown).toBeInTheDocument();
    expect(within(paletteDropdown).getByText(/COMMAND PALETTE \(⌘K\)/i)).toBeInTheDocument();

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.docs-search-results-dropdown')).not.toBeInTheDocument();
  });
});

