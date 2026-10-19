// Version History Storage & Analytics Utility for noted (REA Notion Desktop spec)

const VERSION_STORAGE_KEY = 'noted_version_history_v1';

export const computeWordCount = (blocks = []) => {
  if (!Array.isArray(blocks)) return 0;
  return blocks.reduce((acc, b) => {
    const text = b.text || b.code || b.subtext || b.caption || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    let tableWords = 0;
    if (b.type === 'table' && Array.isArray(b.rows)) {
      tableWords = b.rows.flat().join(' ').trim().split(/\s+/).filter(Boolean).length;
    }
    let colWords = 0;
    if (b.type === 'column_list' && Array.isArray(b.columns)) {
      colWords = b.columns.reduce((cAcc, col) => {
        return cAcc + computeWordCount(col.blocks || []);
      }, 0);
    }
    return acc + words + tableWords + colWords;
  }, 0);
};

export const computeCharacterCount = (blocks = [], withSpaces = true) => {
  if (!Array.isArray(blocks)) return 0;
  return blocks.reduce((acc, b) => {
    let text = b.text || b.code || b.subtext || b.caption || '';
    if (b.type === 'table' && Array.isArray(b.rows)) {
      text += ' ' + b.rows.flat().join(' ');
    }
    if (b.type === 'column_list' && Array.isArray(b.columns)) {
      b.columns.forEach((col) => {
        (col.blocks || []).forEach((cb) => {
          text += ' ' + (cb.text || cb.code || '');
        });
      });
    }
    if (!withSpaces) {
      text = text.replace(/\s+/g, '');
    }
    return acc + text.length;
  }, 0);
};

export const computeBlockBreakdown = (blocks = []) => {
  const breakdown = {
    total: blocks.length,
    paragraph: 0,
    heading_1: 0,
    heading_2: 0,
    heading_3: 0,
    to_do: 0,
    to_do_completed: 0,
    bulleted_list_item: 0,
    numbered_list_item: 0,
    toggle: 0,
    quote: 0,
    callout: 0,
    code: 0,
    table: 0,
    column_list: 0,
    image: 0,
    bookmark: 0,
    video: 0,
    math: 0,
    table_of_contents: 0,
    breadcrumb: 0,
    divider: 0,
    link_to_page: 0
  };

  const processBlock = (b) => {
    if (!b) return;
    if (breakdown[b.type] !== undefined) {
      breakdown[b.type]++;
    }
    if (b.type === 'to_do' && b.checked) {
      breakdown.to_do_completed++;
    }
    if (b.type === 'column_list' && Array.isArray(b.columns)) {
      b.columns.forEach((col) => {
        (col.blocks || []).forEach(processBlock);
      });
    }
  };

  blocks.forEach(processBlock);
  return breakdown;
};

export const computeReadingTime = (wordCount) => {
  const wordsPerMinute = 220;
  const minutes = wordCount / wordsPerMinute;
  if (minutes < 0.5) return '< 1 min read';
  const rounded = Math.round(minutes);
  return `${rounded} min read`;
};

// Version History Persistence
export const getAllVersionsMap = () => {
  try {
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load version history', err);
    return {};
  }
};

export const getPageVersions = (pageId, currentPage = null) => {
  const all = getAllVersionsMap();
  let list = all[pageId] || [];

  // If no snapshot exists yet and currentPage is provided, initialize with current version
  if (list.length === 0 && currentPage) {
    const initialSnap = createSnapshotObject(currentPage, 'Initial Snapshot', false);
    list = [initialSnap];
    all[pageId] = list;
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }
  }

  return list;
};

const createSnapshotObject = (page, note = '', isManual = false) => {
  const blocks = page.blocks || [];
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    pageId: page.id,
    timestamp: Date.now(),
    title: page.title || 'Untitled',
    icon: page.icon || '📄',
    cover: page.cover || null,
    blocks: JSON.parse(JSON.stringify(blocks)),
    blockCount: blocks.length,
    wordCount: computeWordCount(blocks),
    note: note || (isManual ? 'Manual Snapshot' : 'Auto Snapshot'),
    isManual
  };
};

export const savePageSnapshot = (page, note = '', isManual = false) => {
  if (!page || !page.id) return null;
  const all = getAllVersionsMap();
  const list = all[page.id] || [];

  // Avoid creating identical duplicate snapshots within 30 seconds unless manual
  if (!isManual && list.length > 0) {
    const latest = list[0];
    const timeDiff = Date.now() - latest.timestamp;
    if (timeDiff < 30000 && JSON.stringify(latest.blocks) === JSON.stringify(page.blocks)) {
      return latest;
    }
  }

  const snapshot = createSnapshotObject(page, note, isManual);
  const updatedList = [snapshot, ...list].slice(0, 40); // Cap at 40 snapshots
  all[page.id] = updatedList;

  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save snapshot to storage', err);
  }

  return snapshot;
};

export const deletePageSnapshot = (pageId, snapshotId) => {
  const all = getAllVersionsMap();
  if (!all[pageId]) return [];
  all[pageId] = all[pageId].filter((s) => s.id !== snapshotId);
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to delete snapshot', err);
  }
  return all[pageId];
};
