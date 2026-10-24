import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { detectUserPlatform, PLATFORM_KEYS, DEFAULT_PLATFORM } from '../utils/platform';
import { NotionDownloadPage } from '../components/Download/NotionDownloadPage';
import { NotedFooter } from '../components/common/NotedFooter';

describe('Platform Auto-Detection, Targeted Selection, and Smooth Scroll', () => {
  beforeEach(() => {
    // Mock Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('detectUserPlatform logic', () => {
    it('detects Android devices correctly', () => {
      const mockNav = {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        platform: 'Linux armv8l'
      };
      expect(detectUserPlatform(mockNav)).toBe(PLATFORM_KEYS.ANDROID_APK);
    });

    it('detects Windows devices correctly', () => {
      const mockNav = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        platform: 'Win32'
      };
      expect(detectUserPlatform(mockNav)).toBe(PLATFORM_KEYS.WIN_EXE);
    });

    it('detects macOS devices correctly', () => {
      const mockNav = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        platform: 'MacIntel'
      };
      expect(detectUserPlatform(mockNav)).toBe(PLATFORM_KEYS.MAC_ARM);
    });

    it('falls back to default macArm when OS is unknown or unsupported', () => {
      const mockNav = {
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        platform: 'Linux x86_64'
      };
      expect(detectUserPlatform(mockNav)).toBe(DEFAULT_PLATFORM);
    });
  });

  describe('NotionDownloadPage targeted platform selection & scroll', () => {
    it('selects Windows architecture and triggers scroll when targetPlatform is winExe', async () => {
      render(
        <NotionDownloadPage
          targetPlatform="winExe"
          onOpenApp={vi.fn()}
          onOpenLanding={vi.fn()}
        />
      );

      // Verify button targets Windows installer
      expect(screen.getByText(/Unduh untuk Windows \(x64 Installer \.exe\)/i)).toBeInTheDocument();

      // Verify dropdown reflects winExe
      const dropdown = screen.getByLabelText(/Pilihan arsitektur/i);
      expect(dropdown.value).toBe('winExe');

      // Verify scrollIntoView was called for the download action box
      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      });
    });

    it('selects Android APK and triggers scroll when targetPlatform is androidApk', async () => {
      render(
        <NotionDownloadPage
          targetPlatform="androidApk"
          onOpenApp={vi.fn()}
          onOpenLanding={vi.fn()}
        />
      );

      expect(screen.getByText(/Unduh untuk Android \(Unduh Langsung APK\)/i)).toBeInTheDocument();
      const dropdown = screen.getByLabelText(/Pilihan arsitektur/i);
      expect(dropdown.value).toBe('androidApk');

      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      });
    });

    it('defaults to Indonesian language as the primary default', () => {
      render(
        <NotionDownloadPage
          onOpenApp={vi.fn()}
          onOpenLanding={vi.fn()}
        />
      );

      // Default language text checks
      expect(screen.getByText('Pengalaman mencatat lebih cepat dan fokus dengan Noted Desktop.')).toBeInTheDocument();
      expect(screen.getByText('Persyaratan Sistem')).toBeInTheDocument();
      expect(screen.getByText('Pertanyaan yang Sering Diajukan (FAQ)')).toBeInTheDocument();
    });
  });

  describe('NotedFooter platform links pass specific platform keys', () => {
    it('calls onOpenDownload with corresponding platform key when platform link is clicked', () => {
      const handleOpenDownload = vi.fn();
      render(<NotedFooter lang="id" onOpenDownload={handleOpenDownload} />);

      // Click macOS Desktop
      fireEvent.click(screen.getByRole('button', { name: /macOS Desktop/i }));
      expect(handleOpenDownload).toHaveBeenCalledWith('macArm');

      // Click Windows Desktop
      fireEvent.click(screen.getByRole('button', { name: /Windows Desktop/i }));
      expect(handleOpenDownload).toHaveBeenCalledWith('winExe');

      // Click Android App
      fireEvent.click(screen.getByRole('button', { name: /Android App/i }));
      expect(handleOpenDownload).toHaveBeenCalledWith('androidApk');
    });
  });
});

