import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotionDownloadPage } from '../components/Download/NotionDownloadPage';

describe('NotionDownloadPage Component (Bilingual & Controlled Actions)', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-download-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders default Indonesian content with official beta release details', () => {
    const handleOpenApp = vi.fn();
    const handleOpenLanding = vi.fn();

    render(
      <NotionDownloadPage
        onOpenApp={handleOpenApp}
        onOpenLanding={handleOpenLanding}
        theme="light"
      />
    );

    // Verify Title and Subtitle in Indonesian
    expect(screen.getByText(/Pengalaman mencatat lebih cepat dan fokus dengan Noted Desktop\./i)).toBeInTheDocument();
    expect(screen.getByText(/Rilis Resmi · v1\.0\.0-beta/i)).toBeInTheDocument();
    expect(screen.getByText(/Pilihan arsitektur & sistem operasi lain:/i)).toBeInTheDocument();

    // Verify System Requirements and FAQ headers
    expect(screen.getByText('Persyaratan Sistem')).toBeInTheDocument();
    expect(screen.getByText('Pertanyaan yang Sering Diajukan (FAQ)')).toBeInTheDocument();
  });

  it('supports seamless bilingual switching between Indonesian and English', () => {
    render(
      <NotionDownloadPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    // Switch to English
    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    expect(screen.getByText(/A faster, focused experience on Noted Desktop\./i)).toBeInTheDocument();
    expect(screen.getByText(/Official Releases · v1\.0\.0-beta/i)).toBeInTheDocument();
    expect(screen.getByText('System Requirements')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();

    // Switch back to Indonesian
    const idButton = screen.getByRole('button', { name: 'ID' });
    fireEvent.click(idButton);

    expect(screen.getByText(/Pengalaman mencatat lebih cepat dan fokus dengan Noted Desktop\./i)).toBeInTheDocument();
  });

  it('updates target architecture download button when selector changes', () => {
    render(
      <NotionDownloadPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    const select = screen.getByLabelText(/Pilihan arsitektur & sistem operasi lain:/i);
    expect(select.value).toBe('macArm');

    // Change to Windows Setup .exe
    fireEvent.change(select, { target: { value: 'winExe' } });
    expect(screen.getByText(/Unduh untuk Windows \(x64 Installer \.exe\)/i)).toBeInTheDocument();

    // Change to macOS Intel
    fireEvent.change(select, { target: { value: 'macIntel' } });
    expect(screen.getByText(/Unduh untuk macOS \(Intel x64\)/i)).toBeInTheDocument();
  });

  it('triggers safe file download on download button click without calling onOpenApp', () => {
    const handleOpenApp = vi.fn();
    render(
      <NotionDownloadPage
        onOpenApp={handleOpenApp}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Unduh untuk macOS/i });
    fireEvent.click(downloadBtn);

    // Download blob created, onOpenApp was NOT invoked
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(handleOpenApp).not.toHaveBeenCalled();
  });

  it('only navigates to workspace when explicit Web App buttons are clicked', () => {
    const handleOpenApp = vi.fn();
    const handleOpenLanding = vi.fn();

    render(
      <NotionDownloadPage
        onOpenApp={handleOpenApp}
        onOpenLanding={handleOpenLanding}
        theme="light"
      />
    );

    // Back to home button
    const backBtn = screen.getByRole('button', { name: /Kembali ke Beranda/i });
    fireEvent.click(backBtn);
    expect(handleOpenLanding).toHaveBeenCalledTimes(1);
    expect(handleOpenApp).not.toHaveBeenCalled();

    // Header Web App link
    const headerWebBtn = screen.getByRole('button', { name: /Buka Versi Web/i });
    fireEvent.click(headerWebBtn);
    expect(handleOpenApp).toHaveBeenCalledTimes(1);

    // Card Web App link
    const cardWebBtn = screen.getByRole('button', { name: /Buka di Browser/i });
    fireEvent.click(cardWebBtn);
    expect(handleOpenApp).toHaveBeenCalledTimes(2);
  });

  it('toggles FAQ accordion questions open and closed', () => {
    render(
      <NotionDownloadPage
        onOpenApp={vi.fn()}
        onOpenLanding={vi.fn()}
        theme="light"
      />
    );

    const questionBtn = screen.getByRole('button', { name: /Apakah Noted gratis untuk diunduh dan digunakan\?/i });
    expect(screen.queryByText(/Ya! Noted gratis untuk penggunaan personal/i)).not.toBeInTheDocument();

    // Open FAQ
    fireEvent.click(questionBtn);
    expect(screen.getByText(/Ya! Noted gratis untuk penggunaan personal/i)).toBeInTheDocument();

    // Close FAQ
    fireEvent.click(questionBtn);
    expect(screen.queryByText(/Ya! Noted gratis untuk penggunaan personal/i)).not.toBeInTheDocument();
  });
});

