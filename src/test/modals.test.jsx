import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageAnalyticsModal } from '../components/Modals/PageAnalyticsModal';
import { ImportMarkdownModal } from '../components/Modals/ImportMarkdownModal';

describe('Modals Test Suite', () => {
  describe('PageAnalyticsModal', () => {
    const samplePage = {
      id: 'p-analytics',
      title: 'Full Stack Engineering Guide',
      icon: '📘',
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-18T15:30:00.000Z',
      blocks: [
        { id: 'b1', type: 'heading_1', text: 'Architecture Overview' },
        { id: 'b2', type: 'paragraph', text: 'Noted is an ultra fast connected workspace.' },
        { id: 'b3', type: 'to_do', text: 'Design QA Test Plan', checked: true },
        { id: 'b4', type: 'to_do', text: 'Implement All Test Suites', checked: false },
        { id: 'b5', type: 'code', text: 'console.log("Noted Engine");', language: 'js' }
      ]
    };

    it('renders page statistics: words, characters, reading time, and block types', () => {
      const handleClose = vi.fn();
      render(<PageAnalyticsModal isOpen={true} onClose={handleClose} page={samplePage} />);

      expect(screen.getByText('Page Analytics & Details')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Engineering Guide')).toBeInTheDocument();

      // Words & characters & reading time
      expect(screen.getByText('Words')).toBeInTheDocument();
      expect(screen.getByText('Characters')).toBeInTheDocument();
      expect(screen.getByText('Reading Time')).toBeInTheDocument();
      expect(screen.getByText('Total Blocks')).toBeInTheDocument();

      // Block Breakdown
      expect(screen.getByText('Headings (H1 - H3)')).toBeInTheDocument();
      expect(screen.getByText('Checklists (To-Do)')).toBeInTheDocument();
      expect(screen.getByText('Code Blocks')).toBeInTheDocument();
    });

    it('closes on Escape key press or close button click', () => {
      const handleClose = vi.fn();
      render(<PageAnalyticsModal isOpen={true} onClose={handleClose} page={samplePage} />);

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Close button
      const closeBtn = screen.getByTitle('Tutup (Esc)');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(2);
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <PageAnalyticsModal isOpen={false} onClose={vi.fn()} page={samplePage} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('ImportMarkdownModal', () => {
    it('parses markdown input and calculates detected element counts', () => {
      const handleCreate = vi.fn();
      const handleAppend = vi.fn();
      const handleClose = vi.fn();

      render(
        <ImportMarkdownModal
          isOpen={true}
          onClose={handleClose}
          onCreatePageFromMarkdown={handleCreate}
          onAppendToCurrentPage={handleAppend}
          currentPageTitle="My Active Document"
        />
      );

      expect(screen.getByText('Import dari AI Chat / Markdown')).toBeInTheDocument();

      // Enter sample markdown
      const textarea = screen.getByPlaceholderText(/Tempel \(paste\) markdown/i);
      fireEvent.change(textarea, {
        target: {
          value: `# New Engineering Spec\n\n## Tasks\n- [ ] Task A\n- [x] Task B\n\n\`\`\`js\nconst x = 1;\n\`\`\``
        }
      });

      // Stats preview shows Terdeteksi
      expect(screen.getByText('Terdeteksi:')).toBeInTheDocument();

      // Click "Buat Catatan Baru"
      const createPageBtn = screen.getByRole('button', { name: /Buat Catatan Baru/i });
      fireEvent.click(createPageBtn);

      expect(handleCreate).toHaveBeenCalledTimes(1);
      const createdPage = handleCreate.mock.calls[0][0];
      expect(createdPage.title).toBe('New Engineering Spec');
      expect(createdPage.blocks.length).toBeGreaterThanOrEqual(4);
    });
  });
});
