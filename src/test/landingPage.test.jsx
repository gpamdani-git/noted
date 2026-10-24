import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotionLandingPage } from '../components/Landing/NotionLandingPage';

describe('NotionLandingPage Component (Authentic Noted Workspace Edition - Fully Bilingual)', () => {
  it('renders default Indonesian navbar without pricing button and with authentic Noted brand & CTAs', () => {
    const handleOpenApp = vi.fn();
    const handleOpenLogin = vi.fn();

    render(
      <NotionLandingPage
        lang="id"
        onOpenApp={handleOpenApp}
        onOpenLogin={handleOpenLogin}
        currentUser={null}
        theme="light"
      />
    );

    // Verify Brand
    expect(screen.getAllByText('Noted').length).toBeGreaterThan(0);

    // Verify Navbar has NO pricing button
    expect(screen.queryByRole('button', { name: /^Pricing$/i })).not.toBeInTheDocument();

    // Verify Hero Heading in Indonesian
    expect(screen.getByText(/Ruang tenang untuk/i)).toBeInTheDocument();
    expect(screen.getByText(/tanpa batas\./i)).toBeInTheDocument();

    // Verify CTAs
    const freeButtons = screen.getAllByRole('button', { name: /Mulai Gratis/i });
    expect(freeButtons.length).toBeGreaterThan(0);
    fireEvent.click(freeButtons[0]);
    expect(handleOpenApp).toHaveBeenCalled();

    // Verify Login button
    const loginBtn = screen.getByRole('button', { name: /Log in/i });
    fireEvent.click(loginBtn);
    expect(handleOpenLogin).toHaveBeenCalled();
  });

  it('renders English content when lang is en', () => {
    render(
      <NotionLandingPage
        lang="en"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    // Verify Hero Heading in English
    expect(screen.getByText(/A calm space to/i)).toBeInTheDocument();
    expect(screen.getByText(/without limits\./i)).toBeInTheDocument();

    // Verify CTAs in English
    expect(screen.getAllByText(/Get Started Free/i).length).toBeGreaterThan(0);
  });

  it('renders interactive workspace mockup with localized tasks', () => {
    // Test Indonesian mockup
    const { rerender } = render(
      <NotionLandingPage
        lang="id"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    expect(screen.getAllByText('Peta Jalan Produk & Arsitektur').length).toBeGreaterThan(0);
    expect(screen.getByText('Vault IndexedDB · Tersinkron ke Neon')).toBeInTheDocument();

    const idTask = screen.getByText('Tulis dengan slash commands (/) & pintasan markdown');
    expect(idTask).toBeInTheDocument();
    fireEvent.click(idTask);

    // Test English mockup
    rerender(
      <NotionLandingPage
        lang="en"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    expect(screen.getAllByText('Product Roadmap & Architecture').length).toBeGreaterThan(0);
    expect(screen.getByText('IndexedDB Vault · Neon Synced')).toBeInTheDocument();
    const enTask = screen.getByText('Write with slash commands (/) & markdown shortcuts');
    expect(enTask).toBeInTheDocument();
    fireEvent.click(enTask);
  });

  it('allows switching bento tabs for authentic Noted architecture features in Indonesian and English', () => {
    // Indonesian
    const { rerender } = render(
      <NotionLandingPage
        lang="id"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    // Default tab in ID
    expect(screen.getByText('Akses 0ms offline, sinkronisasi otomatis ke cloud.')).toBeInTheDocument();

    // Switch to Block-Based Editor in ID
    const editorTabId = screen.getByRole('tab', { name: /2\. Editor Berbasis Blok/i });
    fireEvent.click(editorTabId);
    expect(screen.getByText('Ketik cepat dengan slash commands & markdown.')).toBeInTheDocument();

    // Switch to Zero Vendor Lock-in in ID
    const privacyTabId = screen.getByRole('tab', { name: /3\. Bebas Vendor Lock-in/i });
    fireEvent.click(privacyTabId);
    expect(screen.getByText('Catatan adalah milik Anda sepenuhnya.')).toBeInTheDocument();

    // English
    rerender(
      <NotionLandingPage
        lang="en"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    // In EN
    const syncTabEn = screen.getByRole('tab', { name: /1\. Local-First & Dual Sync/i });
    fireEvent.click(syncTabEn);
    expect(screen.getByText('0ms offline access with automatic cloud sync.')).toBeInTheDocument();

    const editorTabEn = screen.getByRole('tab', { name: /2\. Block-Based Editor/i });
    fireEvent.click(editorTabEn);
    expect(screen.getByText('Type fast with slash commands & markdown.')).toBeInTheDocument();

    const privacyTabEn = screen.getByRole('tab', { name: /3\. Zero Vendor Lock-in/i });
    fireEvent.click(privacyTabEn);
    expect(screen.getByText('Your notes belong to you 100%.')).toBeInTheDocument();
  });

  it('renders platform availability and design principles in both languages', () => {
    const { rerender } = render(
      <NotionLandingPage
        lang="id"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    // ID
    expect(screen.getByText('Desktop App')).toBeInTheDocument();
    expect(screen.getByText('Mobile App')).toBeInTheDocument();
    expect(screen.getByText('Web App')).toBeInTheDocument();
    expect(screen.getByText('Offline Vault')).toBeInTheDocument();
    expect(screen.getByText(/Cepat & Ringan/i)).toBeInTheDocument();
    expect(screen.getByText(/Privasi & Kebebasan/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dual-Engine Sync/i).length).toBeGreaterThan(0);

    // EN
    rerender(
      <NotionLandingPage
        lang="en"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    expect(screen.getByText(/Fast & Lightweight/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy & Freedom/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Dual-Engine Sync/i).length).toBeGreaterThan(0);
  });

  it('renders 3D Hero Looping Animation stages below the browser illustration and bespoke custom SVG illustrations', () => {
    const { container } = render(
      <NotionLandingPage
        lang="id"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="dark"
      />
    );

    // Verify 3D engine (.noted-hero-loop-engine) is positioned ABOVE browser illustration (.noted-3d-perspective-rig)
    const mockupWrapper = container.querySelector('.noted-hero-mockup-wrapper');
    const childrenClasses = Array.from(mockupWrapper.children).map((el) => el.className);
    expect(childrenClasses[0]).toContain('noted-hero-loop-engine');
    expect(childrenClasses[1]).toContain('noted-3d-perspective-rig');

    // 3D Canvas & 4-stage interactive looping workflow
    expect(screen.getByTestId('hero-3d-canvas')).toBeInTheDocument();
    const stageWrite = screen.getByTestId('hero-loop-stage-write');
    const stageAi = screen.getByTestId('hero-loop-stage-ai');
    const stageVault = screen.getByTestId('hero-loop-stage-vault');
    const stageSync = screen.getByTestId('hero-loop-stage-sync');

    expect(stageWrite).toHaveClass('active');
    fireEvent.click(stageVault);
    expect(stageVault).toHaveClass('active');
    expect(screen.getByText(/Blok dikunci ke SQLite\/IndexedDB/i)).toBeInTheDocument();

    fireEvent.click(stageSync);
    expect(stageSync).toHaveClass('active');
    expect(screen.getByText(/Tersinkron ke Neon Lakebase/i)).toBeInTheDocument();

    fireEvent.click(stageAi);
    expect(stageAi).toHaveClass('active');

    // Verify custom SVG illustrations replace generic icons across sections
    expect(screen.getByTestId('platform-illust-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('platform-illust-mobile')).toBeInTheDocument();
    expect(screen.getByTestId('platform-illust-web')).toBeInTheDocument();
    expect(screen.getAllByTestId('platform-illust-vault').length).toBeGreaterThan(0);

    expect(screen.getByTestId('capability-illust-cmdPalette')).toBeInTheDocument();
    expect(screen.getByTestId('capability-illust-versionHistory')).toBeInTheDocument();
    expect(screen.getByTestId('capability-illust-comments')).toBeInTheDocument();
    expect(screen.getByTestId('capability-illust-themeMode')).toBeInTheDocument();
    expect(screen.getByTestId('capability-illust-markdownExport')).toBeInTheDocument();
    expect(screen.getByTestId('capability-illust-databaseKanban')).toBeInTheDocument();

    expect(screen.getAllByTestId('philosophy-illust-zap').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('philosophy-illust-shield').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('philosophy-illust-cloud').length).toBeGreaterThan(0);
  });

  it('keeps Product dropdown open when hovering from trigger button into dropdown menu', () => {
    vi.useFakeTimers();
    render(
      <NotionLandingPage
        lang="id"
        onOpenApp={vi.fn()}
        onOpenLogin={vi.fn()}
        currentUser={null}
        theme="light"
      />
    );

    const productBtn = screen.getByRole('button', { name: /Produk/i });
    const wrapper = productBtn.closest('.noted-nav-dropdown-wrapper');

    // Hover onto wrapper opens dropdown with custom product illustrations
    fireEvent.mouseEnter(wrapper);
    const dropdownMenu = screen.getByRole('menu');
    expect(dropdownMenu).toBeInTheDocument();
    expect(screen.getAllByTestId('product-illust-docs').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('product-illust-database').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('product-illust-ai').length).toBeGreaterThan(0);

    // Mouse briefly leaves trigger wrapper on its way to the menu (< 180ms)
    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    // Still open!
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Mouse enters the dropdown menu -> cancels close timer
    fireEvent.mouseEnter(dropdownMenu);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Mouse leaves dropdown menu completely -> closes after delay
    fireEvent.mouseLeave(dropdownMenu);
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
