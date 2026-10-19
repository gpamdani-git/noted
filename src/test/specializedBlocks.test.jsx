import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableOfContentsBlock } from '../components/Editor/TableOfContentsBlock';
import { MathEquationBlock } from '../components/Editor/MathEquationBlock';
import { WebBookmarkBlock } from '../components/Editor/WebBookmarkBlock';
import { VideoEmbedBlock } from '../components/Editor/VideoEmbedBlock';
import { BreadcrumbBlock } from '../components/Editor/BreadcrumbBlock';

describe('Specialized Blocks Test Suite', () => {
  describe('TableOfContentsBlock', () => {
    it('extracts H1, H2, and H3 headings and renders navigation buttons', () => {
      const allBlocks = [
        { id: 'b1', type: 'heading_1', text: 'Executive Overview' },
        { id: 'b2', type: 'paragraph', text: 'Some body text that should be ignored' },
        { id: 'b3', type: 'heading_2', text: 'Technical Architecture' },
        { id: 'b4', type: 'heading_3', text: 'Database Schema' },
        { id: 'b5', type: 'to_do', text: 'Check item' }
      ];

      render(<TableOfContentsBlock allBlocks={allBlocks} />);

      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
      expect(screen.getByText('Executive Overview')).toBeInTheDocument();
      expect(screen.getByText('Technical Architecture')).toBeInTheDocument();
      expect(screen.getByText('Database Schema')).toBeInTheDocument();
      expect(screen.queryByText('Some body text that should be ignored')).not.toBeInTheDocument();
    });

    it('renders empty hint when no headings exist on page', () => {
      const allBlocks = [
        { id: 'b1', type: 'paragraph', text: 'Just plain paragraphs' },
        { id: 'b2', type: 'to_do', text: 'Task item' }
      ];

      render(<TableOfContentsBlock allBlocks={allBlocks} />);
      expect(screen.getByText(/Tambahkan Heading/i)).toBeInTheDocument();
    });
  });

  describe('MathEquationBlock', () => {
    it('renders KaTeX equation preview and allows opening edit mode', () => {
      const block = {
        id: 'math-1',
        type: 'math',
        content: 'E = mc^2'
      };
      const handleUpdate = vi.fn();

      render(<MathEquationBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />);

      const editBtn = screen.getByTitle('Edit equation');
      expect(editBtn).toBeInTheDocument();
      fireEvent.click(editBtn);

      const textarea = screen.getByPlaceholderText(/Type LaTeX here/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.value).toBe('E = mc^2');

      fireEvent.change(textarea, { target: { value: '\\int_0^1 x dx' } });

      const doneBtn = screen.getByRole('button', { name: /Done/i });
      fireEvent.click(doneBtn);

      expect(handleUpdate).toHaveBeenCalledWith({ content: '\\int_0^1 x dx' });
    });

    it('saves equation on Cmd/Ctrl + Enter keyboard shortcut', () => {
      const block = {
        id: 'math-2',
        type: 'math',
        content: 'a^2 + b^2 = c^2'
      };
      const handleUpdate = vi.fn();

      render(<MathEquationBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />);

      const editBtn = screen.getByTitle('Edit equation');
      fireEvent.click(editBtn);

      const textarea = screen.getByPlaceholderText(/Type LaTeX here/i);
      fireEvent.change(textarea, { target: { value: 'x = \\frac{-b \\pm \\sqrt{D}}{2a}' } });

      // Trigger Cmd+Enter
      fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true });
      expect(handleUpdate).toHaveBeenCalledWith({ content: 'x = \\frac{-b \\pm \\sqrt{D}}{2a}' });
    });
  });

  describe('WebBookmarkBlock', () => {
    it('renders bookmark details with smart metadata for recognized domains', () => {
      const block = {
        id: 'bm-1',
        type: 'bookmark',
        url: 'https://github.com/noted/noted-app',
        title: 'GitHub: Where the world builds software',
        description: 'GitHub repository for noted',
        domain: 'github.com'
      };
      const handleUpdate = vi.fn();

      render(<WebBookmarkBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />);

      expect(screen.getByText('GitHub: Where the world builds software')).toBeInTheDocument();
      const domainElements = screen.getAllByText('github.com');
      expect(domainElements.length).toBeGreaterThanOrEqual(1);
    });

    it('allows entering a new URL and generates smart metadata', () => {
      const block = {
        id: 'bm-2',
        type: 'bookmark',
        url: ''
      };
      const handleUpdate = vi.fn();

      render(<WebBookmarkBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />);

      const urlInput = screen.getByPlaceholderText(/Paste web link/i);
      fireEvent.change(urlInput, { target: { value: 'https://react.dev' } });

      const createBtn = screen.getByRole('button', { name: /Create bookmark/i });
      fireEvent.click(createBtn);

      expect(handleUpdate).toHaveBeenCalledTimes(1);
      const updatePayload = handleUpdate.mock.calls[0][0];
      expect(updatePayload.url).toBe('https://react.dev');
      expect(updatePayload.domain).toBe('react.dev');
      expect(updatePayload.title).toContain('React');
    });
  });

  describe('VideoEmbedBlock', () => {
    it('converts YouTube standard and short URLs into privacy-enhanced embed URLs', () => {
      const block = {
        id: 'vid-1',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      };
      const handleUpdate = vi.fn();

      const { container } = render(
        <VideoEmbedBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe.src).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('converts Vimeo video URLs into player.vimeo.com embed', () => {
      const block = {
        id: 'vid-2',
        type: 'video',
        url: 'https://vimeo.com/76979871'
      };
      const handleUpdate = vi.fn();

      const { container } = render(
        <VideoEmbedBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe).not.toBeNull();
      expect(iframe.src).toBe('https://player.vimeo.com/video/76979871');
    });

    it('renders direct HTML5 video for .mp4 URLs', () => {
      const block = {
        id: 'vid-3',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      };
      const handleUpdate = vi.fn();

      const { container } = render(
        <VideoEmbedBlock block={block} onUpdateBlock={handleUpdate} isLocked={false} />
      );

      const videoEl = container.querySelector('video');
      expect(videoEl).not.toBeNull();
      expect(videoEl.src).toContain('BigBuckBunny.mp4');
    });
  });

  describe('BreadcrumbBlock', () => {
    it('computes and displays hierarchical trail from ancestor pages to current page', () => {
      const allPages = [
        { id: 'root-1', title: 'Engineering Hub', parentId: null, icon: '🚀' },
        { id: 'child-1', title: 'Architecture Docs', parentId: 'root-1', icon: '🏛️' },
        { id: 'subchild-1', title: 'Storage & Sync', parentId: 'child-1', icon: '💾' }
      ];
      const currentPage = allPages[2]; // Storage & Sync
      const handleNavigate = vi.fn();

      render(
        <BreadcrumbBlock
          currentPage={currentPage}
          allPages={allPages}
          onNavigatePage={handleNavigate}
        />
      );

      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Engineering Hub')).toBeInTheDocument();
      expect(screen.getByText('Architecture Docs')).toBeInTheDocument();
      expect(screen.getByText('Storage & Sync')).toBeInTheDocument();

      // Clicking an ancestor page navigates to it
      const parentLink = screen.getByTitle('Jump to Architecture Docs');
      fireEvent.click(parentLink);
      expect(handleNavigate).toHaveBeenCalledWith('child-1');

      // Current page button is disabled
      const currentBtn = screen.getByTitle('Current page');
      expect(currentBtn).toBeDisabled();
    });
  });
});
