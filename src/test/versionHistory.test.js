import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeWordCount,
  computeCharacterCount,
  computeBlockBreakdown,
  computeReadingTime,
  savePageSnapshot,
  getPageVersions,
  deletePageSnapshot
} from '../utils/versionHistory';

describe('QA Suite 8: Version History & Page Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Page Analytics & Computations', () => {
    const sampleBlocks = [
      { id: '1', type: 'heading_1', text: 'Executive Summary' },
      { id: '2', type: 'paragraph', text: 'This document explains the entire architecture in detail.' },
      { id: '3', type: 'to_do', text: 'Complete code audit', checked: true },
      { id: '4', type: 'to_do', text: 'Deploy to production', checked: false },
      {
        id: '5',
        type: 'table',
        headers: ['Feature', 'Lead'],
        rows: [
          ['Editor', 'Dani'],
          ['AI Assistant', 'Hudbird']
        ]
      }
    ];

    it('computes accurate word count across standard blocks and tables', () => {
      const words = computeWordCount(sampleBlocks);
      expect(words).toBeGreaterThan(10);
    });

    it('computes character count with and without spaces', () => {
      const withSpaces = computeCharacterCount(sampleBlocks, true);
      const withoutSpaces = computeCharacterCount(sampleBlocks, false);
      expect(withSpaces).toBeGreaterThan(withoutSpaces);
    });

    it('generates a complete block breakdown by type', () => {
      const breakdown = computeBlockBreakdown(sampleBlocks);
      expect(breakdown.total).toBe(5);
      expect(breakdown.heading_1).toBe(1);
      expect(breakdown.paragraph).toBe(1);
      expect(breakdown.to_do).toBe(2);
      expect(breakdown.to_do_completed).toBe(1);
      expect(breakdown.table).toBe(1);
    });

    it('calculates human-readable reading time', () => {
      expect(computeReadingTime(50)).toBe('< 1 min read');
      expect(computeReadingTime(440)).toBe('2 min read');
    });
  });

  describe('Snapshot Management & Revision Restore', () => {
    const samplePage = {
      id: 'page-version-test',
      title: 'Sprint Retrospective',
      blocks: [
        { id: 'b-1', type: 'paragraph', text: 'Initial sprint retrospective notes.' }
      ]
    };

    it('creates and retrieves page snapshots', () => {
      const snap = savePageSnapshot(samplePage, 'First Draft', true);
      expect(snap).toBeDefined();
      expect(snap.pageId).toBe('page-version-test');
      expect(snap.note).toBe('First Draft');

      const versions = getPageVersions('page-version-test');
      expect(versions.length).toBeGreaterThanOrEqual(1);
      expect(versions[0].blocks[0].text).toBe('Initial sprint retrospective notes.');
    });

    it('deletes an individual snapshot cleanly', () => {
      const snap = savePageSnapshot(samplePage, 'Draft to Delete', true);
      const beforeDelete = getPageVersions('page-version-test');
      expect(beforeDelete.some((s) => s.id === snap.id)).toBe(true);

      deletePageSnapshot('page-version-test', snap.id);
      const afterDelete = getPageVersions('page-version-test');
      expect(afterDelete.some((s) => s.id === snap.id)).toBe(false);
    });
  });
});
