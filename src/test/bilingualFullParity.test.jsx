import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NotionLandingPage } from '../components/Landing/NotionLandingPage';
import { NotionDownloadPage } from '../components/Download/NotionDownloadPage';
import { NotedDocsPage } from '../components/Docs/NotedDocsPage';
import { NotionLoginModal } from '../components/Auth/NotionLoginModal';
import { NotedFooter } from '../components/common/NotedFooter';

describe('Comprehensive Bilingual (ID vs EN) Full Text Switching', () => {
  describe('NotionLandingPage full localization', () => {
    it('translates entire Landing page when switching from ID to EN', () => {
      const { rerender } = render(
        <NotionLandingPage
          lang="id"
          onOpenApp={vi.fn()}
          onOpenLogin={vi.fn()}
          onOpenDownload={vi.fn()}
          onOpenDocs={vi.fn()}
        />
      );

      // In ID
      expect(screen.getByText(/Ruang tenang untuk/i)).toBeInTheDocument();
      expect(screen.getByText(/tanpa batas\./i)).toBeInTheDocument();
      expect(screen.getByText('Vault Offline Lokal + Sinkronisasi Cloud Real-time')).toBeInTheDocument();
      expect(screen.getByText('Dibangun untuk kecepatan, privasi, dan fokus.')).toBeInTheDocument();
      expect(screen.getByText('Tersedia di semua platform yang Anda gunakan')).toBeInTheDocument();
      expect(screen.getByText('Mulai gunakan Noted sekarang.')).toBeInTheDocument();

      // Switch to EN
      rerender(
        <NotionLandingPage
          lang="en"
          onOpenApp={vi.fn()}
          onOpenLogin={vi.fn()}
          onOpenDownload={vi.fn()}
          onOpenDocs={vi.fn()}
        />
      );

      // In EN
      expect(screen.getByText(/A calm space to/i)).toBeInTheDocument();
      expect(screen.getByText(/without limits\./i)).toBeInTheDocument();
      expect(screen.getByText('Local-First Offline Vault + Real-time Cloud Sync')).toBeInTheDocument();
      expect(screen.getByText('Built for speed, privacy, and focus.')).toBeInTheDocument();
      expect(screen.getByText('Available across all the devices you use')).toBeInTheDocument();
      expect(screen.getByText('Start using Noted today.')).toBeInTheDocument();
    });
  });

  describe('NotionDownloadPage full localization', () => {
    it('translates entire Download page when switching from ID to EN', () => {
      const { rerender } = render(
        <NotionDownloadPage
          lang="id"
          onOpenApp={vi.fn()}
          onOpenLanding={vi.fn()}
        />
      );

      // In ID
      expect(screen.getByText('Pengalaman mencatat lebih cepat dan fokus dengan Noted Desktop.')).toBeInTheDocument();
      expect(screen.getByText('Rilis Resmi · v1.0.0-beta')).toBeInTheDocument();
      expect(screen.getByText('Dirancang secara native untuk produktivitas Anda')).toBeInTheDocument();
      expect(screen.getByText('AKSES INSTAN')).toBeInTheDocument();
      expect(screen.getByText('Akses instan tanpa instalasi')).toBeInTheDocument();

      // Switch to EN
      rerender(
        <NotionDownloadPage
          lang="en"
          onOpenApp={vi.fn()}
          onOpenLanding={vi.fn()}
        />
      );

      // In EN
      expect(screen.getByText('A faster, focused experience on Noted Desktop.')).toBeInTheDocument();
      expect(screen.getByText('Official Releases · v1.0.0-beta')).toBeInTheDocument();
      expect(screen.getByText('Built natively for your everyday workflow')).toBeInTheDocument();
      expect(screen.getByText('INSTANT CLOUD')).toBeInTheDocument();
      expect(screen.getByText('0-install instant access')).toBeInTheDocument();
    });
  });

  describe('NotionLoginModal full localization', () => {
    it('translates modal title, subtitles, buttons and legal terms in ID and EN', () => {
      const { rerender } = render(
        <NotionLoginModal
          isOpen={true}
          lang="id"
          onClose={vi.fn()}
        />
      );

      // In ID
      expect(screen.getByText('Pikirkan. Wujudkan.')).toBeInTheDocument();
      expect(screen.getByText('Masuk ke akun Noted Anda')).toBeInTheDocument();
      expect(screen.getByText('Lanjutkan dengan Google')).toBeInTheDocument();
      expect(screen.getByText('Lanjutkan sebagai Tamu (Offline Mode)')).toBeInTheDocument();
      expect(screen.getByText(/Dengan melanjutkan, Anda menyetujui Ketentuan Penggunaan/i)).toBeInTheDocument();

      // Switch to EN
      rerender(
        <NotionLoginModal
          isOpen={true}
          lang="en"
          onClose={vi.fn()}
        />
      );

      // In EN
      expect(screen.getByText('Think it. Make it.')).toBeInTheDocument();
      expect(screen.getByText('Log in to your Noted account')).toBeInTheDocument();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue as Guest (Offline Mode)')).toBeInTheDocument();
      expect(screen.getByText(/By continuing, you agree to Noted's Terms of Use/i)).toBeInTheDocument();
    });
  });

  describe('NotedFooter full localization', () => {
    it('translates all column titles and quotes in ID and EN', () => {
      const { rerender } = render(
        <NotedFooter
          lang="id"
          onOpenApp={vi.fn()}
          onOpenDocs={vi.fn()}
        />
      );

      // In ID
      expect(screen.getByText('Ruang kerja cerdas untuk catatan hierarkis, database, dan sinkronisasi real-time.')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { level: 5, name: 'Workspace' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'Dokumentasi' })).toBeInTheDocument();
      expect(screen.getByText('Panduan Slash')).toBeInTheDocument();
      expect(screen.getByText('Pusat Bantuan')).toBeInTheDocument();

      // Switch to EN
      rerender(
        <NotedFooter
          lang="en"
          onOpenApp={vi.fn()}
          onOpenDocs={vi.fn()}
        />
      );

      // In EN
      expect(screen.getByText('The connected workspace for hierarchical notes, databases, and real-time cloud sync.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 5, name: 'Documentation' })).toBeInTheDocument();
      expect(screen.getByText('Slash Commands')).toBeInTheDocument();
      expect(screen.getByText('Help Center')).toBeInTheDocument();
    });
  });
});
