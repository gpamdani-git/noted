import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPaletteModal } from '../components/Modals/CommandPaletteModal';
import { ArchiveModal } from '../components/Modals/ArchiveModal';
import { SlashMenu } from '../components/Editor/SlashMenu';
import { getStoredComments, saveStoredComments, applyRemoteComments, getDeletedCommentIds } from '../utils/comments';
import { sanitizeSyncPayload } from '../../api/_lib/security.js';

describe('Feature additions', () => {
  describe('Command palette', () => {
    const pages = [
      { id: 'p1', title: 'Architecture', icon: '📘', blocks: [{ id: 'b1', type: 'paragraph', text: 'Hello' }] },
      { id: 'p2', title: 'Roadmap', icon: '🗺️', blocks: [] }
    ];

    it('lists the commands of the app next to the pages', () => {
      const commands = [
        { id: 'c1', title: 'New page', section: 'Create', icon: '📄', keywords: ['create'], run: vi.fn() },
        { id: 'c2', title: 'Toggle the sidebar', section: 'View', icon: '↔️', keywords: ['sidebar'], run: vi.fn() }
      ];

      render(
        <CommandPaletteModal
          pages={pages}
          commands={commands}
          onSelectPage={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('New page')).toBeInTheDocument();
      expect(screen.getByText('Toggle the sidebar')).toBeInTheDocument();
      expect(screen.getByText('Architecture')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Pages')).toBeInTheDocument();
    });

    it('runs the selected command', () => {
      const run = vi.fn();
      const onClose = vi.fn();
      const commands = [
        { id: 'c1', title: 'New page', section: 'Create', icon: '📄', keywords: ['create'], run }
      ];

      render(
        <CommandPaletteModal
          pages={pages}
          commands={commands}
          onSelectPage={vi.fn()}
          onClose={onClose}
        />
      );

      fireEvent.click(screen.getByText('New page'));

      expect(run).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });

    it('filters the commands by the query', () => {
      const commands = [
        { id: 'c1', title: 'New page', section: 'Create', icon: '📄', keywords: ['create'], run: vi.fn() },
        { id: 'c2', title: 'Open the trash', section: 'Workspace', icon: '🗑️', keywords: ['trash'], run: vi.fn() }
      ];

      render(
        <CommandPaletteModal
          pages={pages}
          commands={commands}
          onSelectPage={vi.fn()}
          onClose={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText('Search pages or run a command'), {
        target: { value: 'trash' }
      });

      expect(screen.queryByText('New page')).not.toBeInTheDocument();
      expect(screen.getByText('Open the trash')).toBeInTheDocument();
    });
  });

  describe('Archive', () => {
    const archived = [
      { id: 'a1', title: 'Old notes', icon: '📦' },
      { id: 'a2', title: 'Another one', icon: '📦' }
    ];

    it('lists the archived pages', () => {
      render(
        <ArchiveModal
          archivedPages={archived}
          onRestorePage={vi.fn()}
          onMoveToTrash={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('Old notes')).toBeInTheDocument();
      expect(screen.getByText('Another one')).toBeInTheDocument();
    });

    it('shows an empty state when nothing is archived', () => {
      render(
        <ArchiveModal
          archivedPages={[]}
          onRestorePage={vi.fn()}
          onMoveToTrash={vi.fn()}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('The archive is empty')).toBeInTheDocument();
    });

    it('restores a page', () => {
      const onRestorePage = vi.fn();
      render(
        <ArchiveModal
          archivedPages={archived}
          onRestorePage={onRestorePage}
          onMoveToTrash={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const restoreButtons = screen.getAllByTitle('Restore page');
      fireEvent.click(restoreButtons[0]);
      expect(onRestorePage).toHaveBeenCalledWith('a1');
    });
  });

  describe('Slash menu coverage', () => {
    it('offers every block type that the editor can render', () => {
      const onSelect = vi.fn();
      render(<SlashMenu filterText="" onSelect={onSelect} onClose={vi.fn()} />);

      const expected = [
        'Text', 'Heading 1', 'Heading 2', 'Heading 3', 'To-do list',
        'Bulleted list', 'Numbered list', 'Toggle list', 'Code', 'Quote',
        'Callout', 'Table', 'Board', 'Gallery', '2 columns', '3 columns',
        'Divider', 'Link to page', 'Table of contents', 'Breadcrumb',
        'Equation', 'Image', 'Bookmark', 'Video', 'Comment'
      ];

      for (const title of expected) {
        expect(screen.getByText(title), `slash menu is missing "${title}"`).toBeInTheDocument();
      }
    });
  });

  describe('Comment sync', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('merges the remote comments into the local store', () => {
      saveStoredComments([
        { id: 'local-1', pageId: 'p1', text: 'Local', createdAt: 1, replies: [] }
      ]);

      applyRemoteComments([
        { id: 'remote-1', pageId: 'p1', text: 'Remote', createdAt: 2, replies: [] }
      ]);

      const ids = getStoredComments().map((c) => c.id).sort();
      expect(ids).toEqual(['local-1', 'remote-1']);
    });

    it('does not resurrect a comment that was deleted', () => {
      saveStoredComments([
        { id: 'gone-1', pageId: 'p1', text: 'Deleted here', createdAt: 1, replies: [] }
      ]);

      applyRemoteComments(
        [{ id: 'gone-1', pageId: 'p1', text: 'Deleted here', createdAt: 1, replies: [] }],
        ['gone-1']
      );

      expect(getStoredComments().map((c) => c.id)).not.toContain('gone-1');
    });

    it('lets the newer version of a comment win', () => {
      saveStoredComments([
        { id: 'c1', pageId: 'p1', text: 'Old text', createdAt: 1, updatedAt: 1, replies: [] }
      ]);

      applyRemoteComments([
        { id: 'c1', pageId: 'p1', text: 'New text', createdAt: 1, updatedAt: 5, replies: [] }
      ]);

      expect(getStoredComments()[0].text).toBe('New text');
    });
  });

  describe('Sync payload sanitiser', () => {
    it('keeps the archive flag of a page', () => {
      const result = sanitizeSyncPayload({
        pages: [{ id: 'p1', title: 'Archived', isArchived: true, blocks: [] }],
        trash: [],
        comments: [],
        deletedCommentIds: []
      });

      expect(result.ok).toBe(true);
      expect(result.payload.pages[0].isArchived).toBe(true);
    });

    it('keeps the comments and their tombstones', () => {
      const result = sanitizeSyncPayload({
        pages: [],
        trash: [],
        comments: [
          {
            id: 'c1',
            pageId: 'p1',
            text: 'A comment',
            author: { id: 'u1', name: 'Dani', email: 'dani@example.com' },
            createdAt: 123,
            resolved: false,
            replies: [{ id: 'r1', text: 'A reply', createdAt: 124 }]
          }
        ],
        deletedCommentIds: ['c9']
      });

      expect(result.ok).toBe(true);
      expect(result.payload.comments).toHaveLength(1);
      expect(result.payload.comments[0].text).toBe('A comment');
      expect(result.payload.comments[0].replies).toHaveLength(1);
      expect(result.payload.deletedCommentIds).toEqual(['c9']);
    });

    it('drops a comment that has no valid page', () => {
      const result = sanitizeSyncPayload({
        pages: [],
        trash: [],
        comments: [{ id: 'c1', pageId: '../etc', text: 'x' }],
        deletedCommentIds: []
      });

      expect(result.payload.comments).toHaveLength(0);
    });
  });
});
