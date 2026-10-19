// Storage and management utility for Page & Block Discussions (Kategori F)
// Reverse Engineered from Notion Desktop 7.39.0 recordModels & discussion threads

const STORAGE_KEY = 'noted_comments_v1';
const USER_STORAGE_KEY = 'noted_current_user_v1';

export const DEFAULT_USER = {
  id: 'user-dani',
  name: 'Dani Gpam',
  avatar: 'D',
  color: '#00897b' // Teal from Notion screenshot
};

export const AVAILABLE_USERS = [
  { id: 'user-dani', name: 'Dani Gpam', avatar: 'D', color: '#00897b' },
  { id: 'user-sarah', name: 'Sarah Product', avatar: 'S', color: '#ec4899' },
  { id: 'user-alex', name: 'Alex Architect', avatar: 'A', color: '#10b981' },
  { id: 'user-hudbird', name: 'Hudbird AI Reviewer', avatar: '🤖', color: '#8b5cf6' }
];

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
};

export const setCurrentUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to set current user:', err);
  }
};

// Initial seed comments for rich demonstration
const INITIAL_COMMENTS = [
  {
    id: 'comm-seed-welcome-1',
    pageId: 'page-welcome',
    blockId: 'b-callout-1',
    author: {
      id: 'user-dani',
      name: 'Dani Gpam',
      avatar: 'D',
      color: '#00897b'
    },
    text: 'Workspace baru sudah siap digunakan dengan antarmuka Notion yang sangat rapi!',
    createdAt: Date.now() - 21 * 60 * 1000,
    resolved: false,
    replies: [
      {
        id: 'reply-seed-welcome-1',
        author: {
          id: 'user-dani',
          name: 'Dani Gpam',
          avatar: 'D',
          color: '#00897b'
        },
        text: 'Semua shortcut markdown dan slash menu berfungsi dengan mulus.',
        createdAt: Date.now() - 20 * 60 * 1000
      }
    ]
  },
  {
    id: 'comm-seed-projects',
    pageId: 'page-projects',
    blockId: 'proj-desc-1',
    author: {
      id: 'user-dani',
      name: 'Dani Gpam',
      avatar: 'D',
      color: '#00897b'
    },
    text: 'Tabel database proyek ini terhubung dengan sistem filter dan sort real-time.',
    createdAt: Date.now() - 60000,
    resolved: false,
    replies: []
  }
];

export const getStoredComments = () => {
  if (typeof window === 'undefined') return INITIAL_COMMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMMENTS));
      return INITIAL_COMMENTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      let updated = false;
      if (!parsed.some((c) => c.id === 'comm-seed-page-1')) {
        parsed.unshift(INITIAL_COMMENTS[0]);
        updated = true;
      }
      if (!parsed.some((c) => c.id === 'comm-seed-projects')) {
        parsed.push(INITIAL_COMMENTS[1]);
        updated = true;
      }
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return INITIAL_COMMENTS;
  } catch (err) {
    console.error('Failed to load comments:', err);
    return INITIAL_COMMENTS;
  }
};

export const saveStoredComments = (comments) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    window.dispatchEvent(new CustomEvent('noted_comments_updated', { detail: { count: comments.length } }));
  } catch (err) {
    console.error('Failed to save comments:', err);
  }
};

export const getPageComments = (pageId) => {
  const all = getStoredComments();
  return all.filter((c) => c.pageId === pageId);
};

export const getBlockComments = (pageId, blockId) => {
  const all = getStoredComments();
  return all.filter((c) => c.pageId === pageId && c.blockId === blockId);
};

export const getPageLevelComments = (pageId) => {
  const all = getStoredComments();
  return all.filter((c) => c.pageId === pageId && !c.blockId);
};

export const getUnresolvedCount = (pageId) => {
  const pageComments = getPageComments(pageId);
  return pageComments.filter((c) => !c.resolved).length;
};

export const addComment = ({ pageId, blockId = null, text, author = null }) => {
  if (!text || !text.trim()) return null;
  const currentAuthor = author || getCurrentUser();
  const newComment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    pageId,
    blockId,
    author: currentAuthor,
    text: text.trim(),
    createdAt: Date.now(),
    resolved: false,
    replies: []
  };

  const all = getStoredComments();
  const updated = [newComment, ...all];
  saveStoredComments(updated);
  return newComment;
};

export const addReply = ({ commentId, text, author = null }) => {
  if (!text || !text.trim()) return null;
  const currentAuthor = author || getCurrentUser();
  const newReply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    author: currentAuthor,
    text: text.trim(),
    createdAt: Date.now()
  };

  const all = getStoredComments();
  const updated = all.map((c) => {
    if (c.id === commentId) {
      return {
        ...c,
        replies: [...(c.replies || []), newReply]
      };
    }
    return c;
  });

  saveStoredComments(updated);
  return newReply;
};

export const toggleResolveComment = (commentId) => {
  const all = getStoredComments();
  let nextResolvedState = false;
  const updated = all.map((c) => {
    if (c.id === commentId) {
      nextResolvedState = !c.resolved;
      return {
        ...c,
        resolved: nextResolvedState,
        resolvedAt: nextResolvedState ? Date.now() : null
      };
    }
    return c;
  });

  saveStoredComments(updated);
  return nextResolvedState;
};

export const deleteComment = (commentId) => {
  const all = getStoredComments();
  const updated = all.filter((c) => c.id !== commentId);
  saveStoredComments(updated);
  return updated;
};

export const deleteReply = (commentId, replyId) => {
  const all = getStoredComments();
  const updated = all.map((c) => {
    if (c.id === commentId) {
      return {
        ...c,
        replies: (c.replies || []).filter((r) => r.id !== replyId)
      };
    }
    return c;
  });
  saveStoredComments(updated);
  return updated;
};

export const formatCommentTime = (ts) => {
  if (!ts) return 'Baru saja';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h lalu`;
  const d = new Date(ts);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};
