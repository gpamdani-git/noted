import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageHeader } from './PageHeader';
import { BlockItem } from './BlockItem';
import { BubbleMenu } from './BubbleMenu';
import { AIAssistantBar } from './AIAssistantBar';
import { InlineAIToolbar } from './InlineAIToolbar';
import { MobileEditorToolbar } from './MobileEditorToolbar';
import { Plus, Trash2, Copy, X, Lock, Unlock, Sparkles } from 'lucide-react';
import { STARTER_TEMPLATES } from '../../constants/starterTemplates';
import { parseMarkdownToBlocks } from '../../utils/aiAssistant';
import { applyColorToText, applyMarkdownFormat, cleanFormattedText, flattenDoubleSpans } from '../../utils/formattingUtils';
import { getPageComments } from '../../utils/comments';
import './Editor.css';

// Helper to find block id from DOM node
const getBlockIdFromNode = (node) => {
  if (!node) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return el?.closest('[data-block-id]')?.getAttribute('data-block-id') || null;
};

export const Editor = ({
  page,
  allPages = [],
  onNavigatePage,
  onUpdatePage,
  isAIOpen,
  onCloseAI,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenComments
}) => {
  const [bubblePos, setBubblePos] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [focusIndex, setFocusIndex] = useState(null);
  const [aiContext, setAiContext] = useState({ active: false, targetBlockId: null, targetText: '' });
  const [inlineAIState, setInlineAIState] = useState({
    active: false,
    position: null,
    selectedText: '',
    targetBlockId: null,
    range: null
  });
  const [selectedBlockIds, setSelectedBlockIds] = useState(new Set());
  const [lastSelectedBlockId, setLastSelectedBlockId] = useState(null);
  const editorBodyRef = useRef(null);
  const lastSelectionInfoRef = useRef(null);

  const [hasActiveComments, setHasActiveComments] = useState(() => {
    if (!page?.id) return false;
    return getPageComments(page.id).some((c) => !c.resolved && c.blockId);
  });

  useEffect(() => {
    const checkComments = () => {
      if (!page?.id) {
        setHasActiveComments(false);
        return;
      }
      const hasUnresolved = getPageComments(page.id).some((c) => !c.resolved && c.blockId);
      setHasActiveComments(hasUnresolved);
    };
    checkComments();
    window.addEventListener('noted_comments_updated', checkComments);
    return () => window.removeEventListener('noted_comments_updated', checkComments);
  }, [page?.id]);

  // Compute bidirectional backlinks across the entire workspace
  const backlinks = useMemo(() => {
    if (!page || !allPages || allPages.length === 0) return [];
    const targetId = page.id;
    const targetTitle = (page.title || '').toLowerCase().trim();
    const results = [];

    for (const p of allPages) {
      if (p.id === targetId) continue;
      let matched = false;
      let snippet = '';

      for (const b of p.blocks || []) {
        const text = b.text || b.code || '';
        if (b.type === 'link_to_page' && b.targetPageId === targetId) {
          matched = true;
          snippet = `Linked via Link-to-Page block`;
          break;
        }
        if (
          text.includes(`[[page:${targetId}|`) ||
          text.includes(`[[page:${targetId}`) ||
          text.includes(`[[${targetId}`) ||
          text.includes(`@${targetId}`) ||
          (targetTitle && targetTitle.length > 1 && text.toLowerCase().includes(`[[${targetTitle.toLowerCase()}`))
        ) {
          matched = true;
          // Clean snippet of markdown mention syntax for beautiful display
          const cleanSnippet = text
            .replace(/\[\[page:[^|]+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[([^\]]+)\]\]/g, '$1')
            .slice(0, 70);
          snippet = cleanSnippet;
          break;
        }
      }

      if (matched) {
        results.push({
          id: p.id,
          title: p.title || 'Untitled',
          icon: p.icon || '📄',
          snippet: snippet || 'Referenced in page blocks'
        });
      }
    }
    return results;
  }, [page, allPages]);

  // Sync external isAIOpen with internal aiContext
  useEffect(() => {
    if (isAIOpen) {
      setAiContext({ active: true, targetBlockId: null, targetText: '' });
    }
  }, [isAIOpen]);

  // Monitor text selection to trigger Notion-style BubbleMenu & Inline AI
  useEffect(() => {
    const handleSelectionChange = () => {
      if (page.isLocked) {
        setBubblePos(null);
        setSelectedRange(null);
        return;
      }

      // On mobile screens, text formatting is handled cleanly by the docked MobileEditorToolbar
      // Suppress floating BubbleMenu to prevent double menus and colliding with native selection handles
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setBubblePos(null);
        setSelectedRange(null);
        return;
      }

      // Preserve active inline AI toolbar while user interacts with it
      if (inlineAIState.active) {
        return;
      }

      // 1. Check if user selected text inside an active textarea or input (editing mode)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        if (typeof start === 'number' && typeof end === 'number' && start !== end) {
          const selectedText = activeEl.value.substring(start, end).trim();
          if (selectedText) {
            const rect = activeEl.getBoundingClientRect();
            const blockId = activeEl.closest('[data-block-id]')?.getAttribute('data-block-id') || null;
            const pos = {
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left + rect.width / 2,
              rectLeft: rect.left,
              rectRight: rect.right,
              width: rect.width,
              height: rect.height
            };
            setBubblePos(pos);
            lastSelectionInfoRef.current = {
              text: selectedText,
              blockId,
              pos,
              isTextarea: true,
              textareaEl: activeEl,
              start,
              end
            };
            return;
          }
        }
      }

      // 2. Standard DOM Selection (rendered blocks, non-editing, or multi-block)
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setBubblePos(null);
        setSelectedRange(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setBubblePos(null);
        setSelectedRange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const blockId = getBlockIdFromNode(range.startContainer);
        const pos = {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left + rect.width / 2,
          rectLeft: rect.left,
          rectRight: rect.right,
          width: rect.width,
          height: rect.height
        };
        setBubblePos(pos);
        setSelectedRange(range);
        lastSelectionInfoRef.current = {
          text,
          blockId,
          pos,
          range: range.cloneRange(),
          isTextarea: false
        };
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [page.isLocked, inlineAIState.active]);

  // Mobile REA Keyboard Coordination: Keep focused or selected element above keyboard and toolbar
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollActiveIntoView = () => {
      if (window.innerWidth > 768) return;

      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

      // 1. Check if there is an active text selection
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && rect.top > 0) {
            const maxVisibleBottom = viewportHeight - 75;
            if (rect.bottom > maxVisibleBottom || rect.top < 60) {
              const targetNode = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
              const blockEl = targetNode?.closest('.block-item-container, .block-rich-text, input, textarea');
              if (blockEl) {
                blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
            return;
          }
        } catch {}
      }

      // 2. Otherwise check document.activeElement
      const active = document.activeElement;
      if (
        active &&
        (active.classList?.contains('block-rich-text') ||
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.closest?.('.block-item-container'))
      ) {
        const rect = active.getBoundingClientRect();
        const maxVisibleBottom = viewportHeight - 75;
        if (rect.bottom > maxVisibleBottom || rect.top < 60) {
          active.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    const handleViewportResize = () => {
      setTimeout(scrollActiveIntoView, 120);
    };

    const handleFocusIn = () => {
      setTimeout(scrollActiveIntoView, 220);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }
    window.addEventListener('resize', handleViewportResize);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      window.removeEventListener('resize', handleViewportResize);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  const handleFormatText = (formatType, colorVal) => {
    if (page.isLocked) return;

    // Helper to format/toggle text chunk
    const formatChunk = (text) => {
      if (!text) return '';
      if (formatType === 'color') {
        return applyColorToText(text, text, colorVal);
      }
      return applyMarkdownFormat(text, text, formatType);
    };

    // 1. Check textarea formatting first (editing active block)
    const info = lastSelectionInfoRef.current;
    if (info?.isTextarea && info.textareaEl) {
      const el = info.textareaEl;
      const val = el.value || '';
      let start = typeof info.start === 'number' ? info.start : el.selectionStart;
      let end = typeof info.end === 'number' ? info.end : el.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        let chunk = val.substring(start, end);
        let newVal = '';
        if (formatType === 'color') {
          newVal = applyColorToText(val, chunk, colorVal);
        } else {
          newVal = applyMarkdownFormat(val, chunk, formatType);
        }
        newVal = cleanFormattedText(newVal);
        if (info.blockId) {
          const isSubtext = el.classList?.contains('block-toggle-subtext');
          if (isSubtext) {
            handleUpdateBlock(info.blockId, { subtext: newVal });
          } else {
            handleUpdateBlock(info.blockId, { text: newVal });
          }
        }
        setBubblePos(null);
        return;
      }
    }

    // 2. Determine selected text either from selectedRange or active window selection
    const selection = window.getSelection();
    const effectiveRange = selectedRange || info?.range || (selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null);
    if (!effectiveRange) return;

    const selectedText = (info?.text || effectiveRange.toString()).trim();
    if (!selectedText) return;

    const startBlockId = info?.blockId || getBlockIdFromNode(effectiveRange.startContainer);
    const endBlockId = getBlockIdFromNode(effectiveRange.endContainer);

    if (startBlockId && (!endBlockId || startBlockId === endBlockId)) {
      // Single block formatting
      const targetBlock = page.blocks.find((b) => b.id === startBlockId);
      if (targetBlock) {
        const curText = targetBlock.text || '';
        let newText = '';

        if (formatType === 'color') {
          newText = applyColorToText(curText, selectedText, colorVal);
        } else {
          newText = applyMarkdownFormat(curText, selectedText, formatType);
        }

        newText = cleanFormattedText(newText);
        if (newText !== curText) {
          handleUpdateBlock(startBlockId, { text: newText });
        }
      }
    } else if (startBlockId && endBlockId) {
      // Multi-block formatting
      const startIdx = page.blocks.findIndex((b) => b.id === startBlockId);
      const endIdx = page.blocks.findIndex((b) => b.id === endBlockId);
      if (startIdx !== -1 && endIdx !== -1) {
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);
        const newBlocks = page.blocks.map((b, idx) => {
          if (idx >= minIdx && idx <= maxIdx && b.text) {
            return { ...b, text: cleanFormattedText(formatChunk(b.text)) };
          }
          return b;
        });
        onUpdatePage({ blocks: newBlocks });
      }
    }

    setBubblePos(null);
  };


  // Block management
  const handleUpdateBlock = (blockId, changes) => {
    if (page.isLocked) return;
    const newBlocks = page.blocks.map((b) =>
      b.id === blockId ? { ...b, ...changes } : b
    );
    onUpdatePage({ blocks: newBlocks });
  };

  const handleAddBlockBelow = (afterIndex, preferredType = 'paragraph') => {
    if (page.isLocked) return;
    
    // Normalize aliases
    let normType = preferredType;
    if (normType === 'todo') normType = 'to_do';
    else if (normType === 'h1') normType = 'heading_1';
    else if (normType === 'h2') normType = 'heading_2';
    else if (normType === 'h3') normType = 'heading_3';
    else if (normType === 'bullet') normType = 'bulleted_list_item';
    else if (normType === 'number') normType = 'numbered_list_item';

    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: normType,
      text: ''
    };

    if (normType === 'to_do') {
      newBlock.checked = false;
    } else if (normType === 'toggle') {
      newBlock.isOpen = false;
      newBlock.subtext = '';
    } else if (normType === 'code') {
      newBlock.language = 'javascript';
    } else if (normType === 'callout') {
      newBlock.icon = '💡';
      newBlock.color = 'blue';
    } else if (normType === 'table') {
      newBlock.viewType = 'table';
      newBlock.tableData = [
        ['Item', 'Status', 'Notes'],
        ['', '', ''],
        ['', '', '']
      ];
    } else if (normType === 'math') {
      newBlock.content = 'E = mc^2';
    } else if (normType === 'bookmark') {
      newBlock.url = '';
      newBlock.title = '';
      newBlock.description = '';
    } else if (normType === 'image') {
      newBlock.url = '';
      newBlock.caption = '';
    } else if (normType === 'video') {
      newBlock.url = '';
      newBlock.caption = '';
    }

    const newBlocks = [...page.blocks];
    const targetIdx = (typeof afterIndex === 'number' && afterIndex >= 0 && afterIndex < newBlocks.length)
      ? afterIndex
      : newBlocks.length - 1;
    newBlocks.splice(targetIdx + 1, 0, newBlock);
    onUpdatePage({ blocks: newBlocks });
    setFocusIndex(targetIdx + 1);
  };

  // Smart Insert / Morph block helper for Mobile toolbar and Slash Menu
  const handleInsertOrMorphBlock = (preferredType, { forceInsert = false } = {}) => {
    if (page.isLocked) return;
    const idx = focusIndex !== null ? focusIndex : (page.blocks?.length || 1) - 1;
    const currentBlock = page.blocks?.[idx];

    let normType = preferredType;
    if (normType === 'todo') normType = 'to_do';
    else if (normType === 'h1') normType = 'heading_1';
    else if (normType === 'h2') normType = 'heading_2';
    else if (normType === 'h3') normType = 'heading_3';
    else if (normType === 'bullet') normType = 'bulleted_list_item';
    else if (normType === 'number') normType = 'numbered_list_item';

    const textCompatibleTypes = [
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'to_do',
      'bulleted_list_item',
      'numbered_list_item',
      'toggle',
      'quote',
      'callout',
      'code'
    ];

    const isCurrentEmpty = !currentBlock || !currentBlock.text || !currentBlock.text.trim();

    // 1. If current block is an empty paragraph, always morph directly in-place (Notion standard)
    if (currentBlock && isCurrentEmpty && currentBlock.type === 'paragraph') {
      const updates = { type: normType };
      if (normType === 'to_do') updates.checked = false;
      else if (normType === 'toggle') { updates.isOpen = false; updates.subtext = ''; }
      else if (normType === 'code') updates.language = 'javascript';
      else if (normType === 'callout') { updates.icon = '💡'; updates.color = 'blue'; }
      else if (normType === 'table') {
        updates.viewType = 'table';
        updates.tableData = [['Item', 'Status', 'Notes'], ['', '', ''], ['', '', '']];
      }
      else if (normType === 'math') updates.content = 'E = mc^2';
      else if (normType === 'bookmark') { updates.url = ''; updates.title = ''; updates.description = ''; }
      else if (normType === 'image') { updates.url = ''; updates.caption = ''; }
      else if (normType === 'video') { updates.url = ''; updates.caption = ''; }
      handleUpdateBlock(currentBlock.id, updates);
      setFocusIndex(idx);
      return;
    }

    // 2. If tapping toolbar block button (not forceInsert) on an existing text block, toggle/morph type keeping text
    if (!forceInsert && currentBlock && textCompatibleTypes.includes(normType) && textCompatibleTypes.includes(currentBlock.type)) {
      const targetType = currentBlock.type === normType ? 'paragraph' : normType;
      const updates = { type: targetType };
      if (targetType === 'to_do' && typeof currentBlock.checked !== 'boolean') {
        updates.checked = false;
      } else if (targetType === 'toggle' && typeof currentBlock.isOpen !== 'boolean') {
        updates.isOpen = false;
        updates.subtext = currentBlock.subtext || '';
      } else if (targetType === 'code' && !currentBlock.language) {
        updates.language = 'javascript';
      } else if (targetType === 'callout') {
        if (!currentBlock.icon) updates.icon = '💡';
        if (!currentBlock.color) updates.color = 'blue';
      }
      handleUpdateBlock(currentBlock.id, updates);
      setFocusIndex(idx);
      return;
    }

    // 3. Otherwise add new block below
    handleAddBlockBelow(idx, normType);
  };

  // Atomic block morphing to divider (prevents race condition / stale closure between update & insert)
  const handleMorphToDivider = (blockId, afterIndex) => {
    if (page.isLocked) return;
    const currentBlocks = [...page.blocks];
    const idx = (typeof afterIndex === 'number' && afterIndex >= 0)
      ? afterIndex
      : currentBlocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;

    const updatedDivider = {
      ...currentBlocks[idx],
      type: 'divider',
      text: ''
    };

    const newBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: 'paragraph',
      text: ''
    };

    currentBlocks.splice(idx, 1, updatedDivider, newBlock);
    onUpdatePage({ blocks: currentBlocks });
    setFocusIndex(idx + 1);
  };

  const handleDeleteBlock = (blockId) => {
    if (page.isLocked) return;
    if (page.blocks.length <= 1) {
      // Keep at least one empty block
      onUpdatePage({
        blocks: [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }]
      });
      return;
    }
    const newBlocks = page.blocks.filter((b) => b.id !== blockId);
    onUpdatePage({ blocks: newBlocks });
  };

  const handleDuplicateBlock = (blockId) => {
    if (page.isLocked) return;
    const idx = page.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const target = page.blocks[idx];
    const duplicated = {
      ...JSON.parse(JSON.stringify(target)),
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    };
    const newBlocks = [...page.blocks];
    newBlocks.splice(idx + 1, 0, duplicated);
    onUpdatePage({ blocks: newBlocks });
  };

  const handleMoveBlock = (fromIndex, toIndex) => {
    if (page.isLocked) return;
    if (toIndex < 0 || toIndex >= page.blocks.length) return;
    const newBlocks = [...page.blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    onUpdatePage({ blocks: newBlocks });
  };

  const [draggedBlockIndex, setDraggedBlockIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'top' | 'bottom'

  const handleDragStart = (e, index) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragEnd = () => {
    setDraggedBlockIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedBlockIndex === null || draggedBlockIndex === index) {
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const isTop = e.clientY - rect.top < rect.height / 2;
    setDragOverIndex(index);
    setDropPosition(isTop ? 'top' : 'bottom');
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (page.isLocked) return;
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newBlocks = [...page.blocks];
    const [movedBlock] = newBlocks.splice(draggedBlockIndex, 1);

    let insertIndex = targetIndex;
    if (draggedBlockIndex < targetIndex) {
      insertIndex = dropPosition === 'top' ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = dropPosition === 'top' ? targetIndex : targetIndex + 1;
    }

    insertIndex = Math.max(0, Math.min(newBlocks.length, insertIndex));
    newBlocks.splice(insertIndex, 0, movedBlock);

    onUpdatePage({ blocks: newBlocks });
    handleDragEnd();
  };

  const handleAddBlockAtEnd = () => {
    if (page.isLocked) return;
    handleAddBlockBelow(page.blocks.length - 1);
  };

  // Multi-block selection handlers
  const handleSelectBlock = (blockId, isShift = false, isToggle = false) => {
    if (isShift && lastSelectedBlockId) {
      const blockList = page.blocks || [];
      const fromIndex = blockList.findIndex((b) => b.id === lastSelectedBlockId);
      const toIndex = blockList.findIndex((b) => b.id === blockId);
      if (fromIndex !== -1 && toIndex !== -1) {
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        const newSet = new Set(selectedBlockIds);
        for (let i = start; i <= end; i++) {
          newSet.add(blockList[i].id);
        }
        setSelectedBlockIds(newSet);
        return;
      }
    }

    if (isToggle) {
      setSelectedBlockIds((prev) => {
        const next = new Set(prev);
        if (next.has(blockId)) {
          next.delete(blockId);
        } else {
          next.add(blockId);
        }
        return next;
      });
      setLastSelectedBlockId(blockId);
    } else {
      setSelectedBlockIds(new Set([blockId]));
      setLastSelectedBlockId(blockId);
    }
  };

  const handleDeleteSelectedBlocks = () => {
    if (page.isLocked || selectedBlockIds.size === 0) return;
    let remaining = page.blocks.filter((b) => !selectedBlockIds.has(b.id));
    if (remaining.length === 0) {
      remaining = [{ id: `block-${Date.now()}`, type: 'paragraph', text: '' }];
    }
    onUpdatePage({ blocks: remaining });
    setSelectedBlockIds(new Set());
    setLastSelectedBlockId(null);
  };

  const handleDuplicateSelectedBlocks = () => {
    if (page.isLocked || selectedBlockIds.size === 0) return;
    const newBlocks = [];
    for (const b of page.blocks) {
      newBlocks.push(b);
      if (selectedBlockIds.has(b.id)) {
        newBlocks.push({
          ...JSON.parse(JSON.stringify(b)),
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
        });
      }
    }
    onUpdatePage({ blocks: newBlocks });
    setSelectedBlockIds(new Set());
    setLastSelectedBlockId(null);
  };

  // Keyboard shortcut listener for multi-block deletion & selection
  useEffect(() => {
    const handleGlobalEditorKeys = (e) => {
      if (page.isLocked) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          return;
        }
        if (e.key === 'Escape') {
          setSelectedBlockIds(new Set());
          setLastSelectedBlockId(null);
        }
        return;
      }

      if (selectedBlockIds.size > 0) {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          const activeEl = document.activeElement;
          const isInsideInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
          if (!isInsideInput || activeEl.selectionStart === activeEl.selectionEnd) {
            e.preventDefault();
            handleDeleteSelectedBlocks();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedBlockIds(new Set());
          setLastSelectedBlockId(null);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        const activeEl = document.activeElement;
        const isInsideInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInsideInput) {
          e.preventDefault();
          setSelectedBlockIds(new Set(page.blocks.map((b) => b.id)));
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        // Notion Desktop shortcut: Cmd+J triggers Inline AI on selected text
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          e.preventDefault();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const blockId = getBlockIdFromNode(range.startContainer);
          setInlineAIState({
            active: true,
            position: {
              top: rect.top + window.scrollY,
              left: rect.left + rect.width / 2 + window.scrollX
            },
            selectedText: selection.toString().trim(),
            targetBlockId: blockId,
            range: range.cloneRange()
          });
          setBubblePos(null);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalEditorKeys);
    return () => window.removeEventListener('keydown', handleGlobalEditorKeys);
  }, [selectedBlockIds, page.blocks, page.isLocked]);

  // Hudbird AI handlers
  const handleOpenAIAssistant = (blockId = null, text = '') => {
    if (page.isLocked) return;

    // If blockId or text is given, anchor modern InlineAIToolbar directly to that block
    if (blockId) {
      const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
      if (blockEl) {
        const rect = blockEl.getBoundingClientRect();
        const pos = {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left + rect.width / 2,
          width: rect.width,
          height: rect.height
        };
        const targetBlock = page.blocks.find((b) => b.id === blockId);
        setInlineAIState({
          active: true,
          position: pos,
          selectedText: text || targetBlock?.text || '',
          targetBlockId: blockId,
          range: null
        });
        setBubblePos(null);
        return;
      }
    }

    setAiContext({
      active: true,
      targetBlockId: blockId,
      targetText: text
    });
  };

  const handleCloseAIAssistant = () => {
    setAiContext({ active: false, targetBlockId: null, targetText: '' });
    if (onCloseAI) onCloseAI();
  };

  const handleInsertAIBlocks = (newBlocks, targetBlockId, replace = false) => {
    if (page.isLocked || !newBlocks || newBlocks.length === 0) return;
    const currentBlocks = [...page.blocks];

    if (targetBlockId) {
      const idx = currentBlocks.findIndex((b) => b.id === targetBlockId);
      if (idx !== -1) {
        if (replace) {
          currentBlocks.splice(idx, 1, ...newBlocks);
        } else {
          currentBlocks.splice(idx + 1, 0, ...newBlocks);
        }
      } else {
        currentBlocks.push(...newBlocks);
      }
    } else {
      // Prepend or insert at start of document
      currentBlocks.unshift(...newBlocks);
    }

    onUpdatePage({ blocks: currentBlocks });
    handleCloseAIAssistant();
  };

  const handleReplaceAIText = (newText) => {
    if (page.isLocked) return;
    if (selectedRange) {
      document.execCommand('insertText', false, newText);
    } else if (aiContext.targetBlockId) {
      handleUpdateBlock(aiContext.targetBlockId, { text: newText });
    }
    handleCloseAIAssistant();
  };

  // Inline AI Toolbar handlers (Notion 7.39.0 Desktop parity)
  const handleReplaceInlineAI = (newText) => {
    if (page.isLocked || !newText) return;
    const { selectedText, targetBlockId } = inlineAIState;
    const info = lastSelectionInfoRef.current;

    // 1. Textarea inline replacement
    if (info?.isTextarea && info.blockId && info.textareaEl) {
      const el = info.textareaEl;
      const isSubtext = el.classList?.contains('block-toggle-subtext');
      const val = el.value || '';
      if (info.start !== undefined && info.end !== undefined) {
        const newVal = val.substring(0, info.start) + newText + val.substring(info.end);
        if (isSubtext) {
          handleUpdateBlock(info.blockId, { subtext: newVal });
        } else {
          handleUpdateBlock(info.blockId, { text: newVal });
        }
        handleCloseInlineAI();
        return;
      }
    }

    // 2. Check if newText contains multi-line markdown or structured blocks (lists, headings, tables, etc.)
    const hasMultipleLines = newText.includes('\n');
    const hasBlockSyntax = /(^|\n)\s*(#{1,6}\s+|[-*•+]\s+|[-*]\s*\[[ xX]\]|\d+[.)]\s+|>\s+|```|\|.*\|.*\||:::|---|___)/.test(newText);

    if (hasMultipleLines || hasBlockSyntax) {
      const parsedBlocks = parseMarkdownToBlocks(newText);
      if (parsedBlocks.length > 0) {
        const targetId = targetBlockId || info?.blockId || (selectedText ? page.blocks.find(b => b.text && b.text.includes(selectedText))?.id : null);
        if (targetId) {
          const idx = page.blocks.findIndex(b => b.id === targetId);
          if (idx !== -1) {
            const targetBlock = page.blocks[idx];
            const curText = targetBlock.text || '';
            const selIdx = selectedText ? curText.indexOf(selectedText) : -1;
            if (selIdx > 0) {
              const prefix = curText.substring(0, selIdx).trim();
              if (prefix) {
                parsedBlocks[0].text = `${prefix} ${parsedBlocks[0].text || ''}`.trim();
              }
            }
            const newBlocks = [...page.blocks];
            newBlocks.splice(idx, 1, ...parsedBlocks);
            onUpdatePage({ blocks: newBlocks });
            handleCloseInlineAI();
            return;
          }
        }
      }
    }

    // 3. Target block simple text replacement
    if (targetBlockId) {
      const targetBlock = page.blocks.find((b) => b.id === targetBlockId);
      if (targetBlock) {
        let curText = targetBlock.text || '';
        if (selectedText && curText.includes(selectedText)) {
          curText = curText.replace(selectedText, newText);
        } else {
          curText = newText;
        }
        handleUpdateBlock(targetBlockId, { text: cleanFormattedText(curText) });
        handleCloseInlineAI();
        return;
      }
    }

    // 4. Fallback: search for block containing selectedText
    if (selectedText) {
      const foundBlock = page.blocks.find((b) => b.text && b.text.includes(selectedText));
      if (foundBlock) {
        const curText = foundBlock.text.replace(selectedText, newText);
        handleUpdateBlock(foundBlock.id, { text: cleanFormattedText(curText) });
        handleCloseInlineAI();
        return;
      }
    }

    // 4. Fallback: execCommand insertText
    try {
      document.execCommand('insertText', false, newText);
    } catch (e) {
      if (page.blocks.length > 0) {
        handleUpdateBlock(page.blocks[0].id, { text: newText });
      }
    }
    handleCloseInlineAI();
  };

  const handleInsertBelowInlineAI = (newBlocks, targetBlockId) => {
    if (page.isLocked) return;
    const effBlockId = targetBlockId || inlineAIState.targetBlockId;
    let blocksToInsert = [];
    if (Array.isArray(newBlocks)) {
      blocksToInsert = newBlocks;
    } else if (typeof newBlocks === 'string') {
      blocksToInsert = [{
        id: `block-${Date.now()}`,
        type: 'paragraph',
        text: newBlocks
      }];
    }
    handleInsertAIBlocks(blocksToInsert, effBlockId, false);
    handleCloseInlineAI();
  };

  const handleCloseInlineAI = () => {
    setInlineAIState({
      active: false,
      position: null,
      selectedText: '',
      targetBlockId: null,
      range: null
    });
  };

  // Check if page is blank/empty to show Notion starter templates
  const isPageEmpty =
    page.blocks.length === 1 &&
    page.blocks[0].type === 'paragraph' &&
    (!page.blocks[0].text || page.blocks[0].text.trim() === '');

  const handleApplyStarterTemplate = (tpl) => {
    if (page.isLocked) return;
    onUpdatePage({
      icon: page.icon === '📄' || !page.icon ? tpl.icon : page.icon,
      blocks: JSON.parse(JSON.stringify(tpl.blocks))
    });
  };

  const fontClass = `font-${page.fontFamily || 'sans'}`;
  const widthClass = page.fullWidth ? 'page-full-width' : 'page-standard-width';
  const smallTextClass = page.smallText ? 'page-small-text' : '';
  const lockedClass = page.isLocked ? 'page-is-locked' : '';

  return (
    <div
      className={`noted-editor-container ${fontClass} ${smallTextClass} ${lockedClass}`}
      ref={editorBodyRef}
      onClick={(e) => {
        if (
          selectedBlockIds.size > 0 &&
          !e.target.closest('.block-item-container') &&
          !e.target.closest('.multi-select-floating-bar')
        ) {
          setSelectedBlockIds(new Set());
          setLastSelectedBlockId(null);
        }
      }}
    >
      {/* Cover and Page Header with Backlinks */}
      <PageHeader
        page={page}
        onUpdatePage={onUpdatePage}
        fullWidth={page.fullWidth}
        backlinks={backlinks}
        onNavigatePage={onNavigatePage}
        onOpenCommentsDrawer={onOpenComments}
      />

      {/* Page Body Wrapper */}
      <div className={`editor-content-area ${widthClass} ${hasActiveComments ? 'has-margin-comments' : ''}`}>
        {/* Page Locked Notice */}
        {page.isLocked && (
          <div className="page-locked-banner animate-fade-in" role="status" aria-live="polite">
            <div className="locked-banner-left">
              <Lock size={14} className="locked-banner-icon" />
              <span>Halaman ini sedang dikunci (Read-Only) untuk mencegah perubahan atau penghapusan tidak disengaja.</span>
            </div>
            <button
              className="unlock-banner-btn"
              onClick={() => onUpdatePage({ isLocked: false })}
              title="Buka kunci halaman ini"
            >
              <Unlock size={12} />
              <span>Buka Kunci</span>
            </button>
          </div>
        )}

        {/* Page-level AI Assistant Bar */}
        {aiContext.active && !aiContext.targetBlockId && (
          <AIAssistantBar
            page={page}
            targetText={aiContext.targetText}
            targetBlockId={null}
            onInsertBlocks={handleInsertAIBlocks}
            onReplaceText={handleReplaceAIText}
            onClose={handleCloseAIAssistant}
          />
        )}

        {/* Starter Templates on Empty Page */}
        {isPageEmpty && !page.isLocked && (
          <div className="starter-templates-container animate-fade-in">
            <div className="starter-templates-header">
              <Sparkles size={14} className="text-ai-purple" />
              <span>Gunakan Template Cepat atau Mulai Menulis:</span>
            </div>
            <div className="starter-templates-grid">
              {STARTER_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  className="starter-template-card"
                  onClick={() => handleApplyStarterTemplate(tpl)}
                  title={tpl.description}
                >
                  <span className="starter-template-icon">{tpl.icon}</span>
                  <div className="starter-template-info">
                    <span className="starter-template-title">{tpl.title}</span>
                    <span className="starter-template-desc">{tpl.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="blocks-list">
          {page.blocks.map((block, idx) => (
            <React.Fragment key={block.id}>
              <BlockItem
                block={block}
                index={idx}
                totalBlocks={page.blocks.length}
                currentPage={page}
                allPages={allPages}
                allBlocks={page.blocks}
                isLocked={page.isLocked}
                onNavigatePage={onNavigatePage}
                onUpdateBlock={handleUpdateBlock}
                onAddBlockBelow={handleAddBlockBelow}
                onMorphToDivider={handleMorphToDivider}
                onDeleteBlock={handleDeleteBlock}
                onDuplicateBlock={handleDuplicateBlock}
                onMoveBlock={handleMoveBlock}
                focusOnMount={focusIndex === idx}
                onFocusPrevious={(currIdx) => setFocusIndex(currIdx - 1)}
                onFocusNext={(currIdx) => setFocusIndex(currIdx + 1)}
                isDragging={draggedBlockIndex === idx}
                isDragOver={dragOverIndex === idx}
                dropPosition={dragOverIndex === idx ? dropPosition : null}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onTriggerAI={handleOpenAIAssistant}
                onInsertBlocks={handleInsertAIBlocks}
                isSelected={selectedBlockIds.has(block.id)}
                onSelectBlock={handleSelectBlock}
              />
              {/* Contextual Block-level AI Assistant Bar */}
              {aiContext.active && aiContext.targetBlockId === block.id && (
                <AIAssistantBar
                  page={page}
                  targetText={aiContext.targetText}
                  targetBlockId={block.id}
                  onInsertBlocks={handleInsertAIBlocks}
                  onReplaceText={handleReplaceAIText}
                  onClose={handleCloseAIAssistant}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Click to add block at bottom */}
        {!page.isLocked && (
          <div className="editor-bottom-click-area" onClick={handleAddBlockAtEnd}>
            <div className="bottom-add-hint">
              <Plus size={14} />
              <span>Click to add a block or write</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Multi-Block Selection Action Bar */}
      {!page.isLocked && selectedBlockIds.size > 0 && (
        <div className="multi-select-floating-bar animate-popover">
          <span className="multi-select-count">
            <span className="multi-select-badge">{selectedBlockIds.size}</span>
            <span>blok dipilih</span>
          </span>
          <button
            className="multi-select-action-btn delete-btn"
            onClick={handleDeleteSelectedBlocks}
            title="Hapus semua blok terpilih (Backspace / Delete)"
          >
            <Trash2 size={13} />
            <span>Hapus ({selectedBlockIds.size})</span>
            <kbd className="multi-select-kbd">⌫</kbd>
          </button>
          <button
            className="multi-select-action-btn"
            onClick={handleDuplicateSelectedBlocks}
            title="Duplikat blok terpilih"
          >
            <Copy size={13} />
            <span>Duplikat</span>
          </button>
          <button
            className="multi-select-action-btn"
            onClick={() => {
              setSelectedBlockIds(new Set());
              setLastSelectedBlockId(null);
            }}
            title="Batal pilih (Esc)"
          >
            <X size={13} />
            <span>Batal</span>
          </button>
        </div>
      )}

      {/* Floating text selection toolbar */}
      {!inlineAIState.active && (
        <BubbleMenu
          position={bubblePos}
          onFormat={handleFormatText}
          onTriggerAI={() => {
            const info = lastSelectionInfoRef.current;
            const effRange = selectedRange || info?.range;
            const text = (info?.text || (effRange ? effRange.toString().trim() : '')).trim();
            const blockId = info?.blockId || (effRange ? getBlockIdFromNode(effRange.startContainer) : null);
            const pos = bubblePos || info?.pos;
            if (pos) {
              setInlineAIState({
                active: true,
                position: pos,
                selectedText: text,
                targetBlockId: blockId,
                range: effRange ? effRange.cloneRange() : null
              });
              setBubblePos(null);
            }
          }}
          onClose={() => setBubblePos(null)}
        />
      )}

      {/* Notion Desktop Floating Inline AI Rewrite & Actions Toolbar */}
      {inlineAIState.active && (
        <InlineAIToolbar
          position={inlineAIState.position}
          selectedText={inlineAIState.selectedText}
          targetBlockId={inlineAIState.targetBlockId}
          page={page}
          onReplace={handleReplaceInlineAI}
          onInsertBelow={handleInsertBelowInlineAI}
          onClose={handleCloseInlineAI}
          isLocked={page.isLocked}
        />
      )}

      {/* Notion Mobile Accessory Bar (Bottom Editing Toolbar) */}
      <MobileEditorToolbar
        onInsertBlock={(type, options) => {
          handleInsertOrMorphBlock(type, options);
        }}
        onFormatText={(formatType, colorVal) => handleFormatText(formatType, colorVal)}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenAI={() => setAiContext({ active: true, targetBlockId: null, targetText: '' })}
        onOpenComments={onOpenComments}
        isLocked={page.isLocked}
        onDuplicateBlock={() => {
          if (page.blocks && page.blocks.length > 0) {
            const idx = focusIndex !== null ? Math.min(focusIndex, page.blocks.length - 1) : page.blocks.length - 1;
            const target = page.blocks[idx];
            if (target) handleDuplicateBlock(target.id);
          }
        }}
        onDeleteBlock={() => {
          if (page.blocks && page.blocks.length > 0) {
            const idx = focusIndex !== null ? Math.min(focusIndex, page.blocks.length - 1) : page.blocks.length - 1;
            const target = page.blocks[idx];
            if (target) handleDeleteBlock(target.id);
          }
        }}
        onMoveBlock={(direction) => {
          if (page.blocks && page.blocks.length > 0) {
            const idx = focusIndex !== null ? Math.min(focusIndex, page.blocks.length - 1) : 0;
            const newIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (newIdx >= 0 && newIdx < page.blocks.length) {
              handleMoveBlock(idx, newIdx);
              setFocusIndex(newIdx);
            }
          }
        }}
      />
    </div>
  );
};
