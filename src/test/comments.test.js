import { describe, it, expect, beforeEach } from 'vitest';
import {
  addComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  getPageComments,
  getBlockComments,
  getCurrentUser
} from '../utils/comments';

describe('QA Suite 4: Comments & Discussions (Kategori F: Notion Discussions)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds a new block-level discussion comment', () => {
    const pageId = 'test-page-qa';
    const blockId = 'test-block-1';
    const comment = addComment({
      pageId,
      blockId,
      text: 'Perlu review lebih lanjut untuk performa query.',
      author: getCurrentUser()
    });

    expect(comment).toBeDefined();
    expect(comment.text).toBe('Perlu review lebih lanjut untuk performa query.');
    expect(comment.resolved).toBe(false);

    const blockComments = getBlockComments(pageId, blockId);
    expect(blockComments.length).toBeGreaterThanOrEqual(1);
    expect(blockComments.some((c) => c.id === comment.id)).toBe(true);
  });

  it('adds a reply to an existing comment thread', () => {
    const pageId = 'test-page-qa';
    const comment = addComment({
      pageId,
      text: 'Komentar awal',
      author: getCurrentUser()
    });

    const reply = addReply({
      commentId: comment.id,
      text: 'Balasan terhadap komentar awal',
      author: getCurrentUser()
    });

    expect(reply).toBeDefined();
    expect(reply.text).toBe('Balasan terhadap komentar awal');

    const comments = getPageComments(pageId);
    const updated = comments.find((c) => c.id === comment.id);
    expect(updated.replies.length).toBe(1);
    expect(updated.replies[0].text).toBe('Balasan terhadap komentar awal');
  });

  it('toggles comment resolution state (resolve & unresolve)', () => {
    const pageId = 'test-page-qa';
    const comment = addComment({
      pageId,
      text: 'Tugas ini butuh konfirmasi',
      author: getCurrentUser()
    });

    // 1. Resolve
    const resolvedState = toggleResolveComment(comment.id);
    expect(resolvedState).toBe(true);

    let updated = getPageComments(pageId).find((c) => c.id === comment.id);
    expect(updated.resolved).toBe(true);
    expect(updated.resolvedAt).toBeDefined();

    // 2. Unresolve
    const unresolvedState = toggleResolveComment(comment.id);
    expect(unresolvedState).toBe(false);

    updated = getPageComments(pageId).find((c) => c.id === comment.id);
    expect(updated.resolved).toBe(false);
  });

  it('deletes a comment thread cleanly', () => {
    const pageId = 'test-page-qa';
    const comment = addComment({
      pageId,
      text: 'Komentar sementara yang akan dihapus',
      author: getCurrentUser()
    });

    deleteComment(comment.id);

    const comments = getPageComments(pageId);
    expect(comments.some((c) => c.id === comment.id)).toBe(false);
  });

  it('filters active unresolved block comments properly for margin cards', () => {
    const pageId = 'test-page-margin';
    const blockId = 'test-block-margin-1';

    const comment = addComment({
      pageId,
      blockId,
      text: 'Floating margin comment test',
      author: getCurrentUser()
    });

    let activeList = getBlockComments(pageId, blockId).filter((c) => !c.resolved);
    expect(activeList.length).toBe(1);

    // Resolve comment
    toggleResolveComment(comment.id);
    activeList = getBlockComments(pageId, blockId).filter((c) => !c.resolved);
    expect(activeList.length).toBe(0);
  });
});
