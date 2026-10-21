import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  Plus,
  GripVertical,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  Smile,
  PlusCircle,
  Table as TableIcon,
  Sparkles,
  Link2,
  ArrowUpRight,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { SlashMenu } from './SlashMenu';
import { EmojiPicker } from './EmojiPicker';
import { DatabaseBlock } from './DatabaseBlock';
import { ColumnListBlock } from './ColumnListBlock';
import { MentionMenu } from './MentionMenu';
import { parseMarkdownToBlocks } from '../../utils/aiAssistant';
import { renderInlineMarkdown } from '../../utils/markdownRenderer';
import {
  markdownToRichHtml,
  richHtmlToMarkdown,
  cleanFormattedText,
  flattenDoubleSpans,
  setCaretPosition,
  getCaretOffset,
  getSelectionOffsets,
  setSelectionOffsets
} from '../../utils/formattingUtils';
import { normalizeMediaUrl } from '../../utils/mediaUrl';
import { TableOfContentsBlock } from './TableOfContentsBlock';
import { WebBookmarkBlock } from './WebBookmarkBlock';
import { VideoEmbedBlock } from './VideoEmbedBlock';
import { MathEquationBlock } from './MathEquationBlock';
import { BreadcrumbBlock } from './BreadcrumbBlock';
import { BlockCommentPopover } from '../Comments/BlockCommentPopover';
import { NotionInlineCommentPill } from '../Comments/NotionInlineCommentPill';
import { NotionMarginCommentCard } from '../Comments/NotionMarginCommentCard';
import {
  getBlockComments,
  addComment,
  addReply,
  toggleResolveComment,
  deleteComment,
  getCurrentUser
} from '../../utils/comments';
import './BlockItem.css';

const CODE_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'sql',
  'json',
  'bash',
];

/**
 * BlockRichText
 * Notion-style WYSIWYG ContentEditable block component.
 * Allows live rich-text typing and editing without exposing raw HTML tags or markdown coding.
 */
export const BlockRichText = React.forwardRef(({
  blockId,
  type,
  text,
  placeholder,
  className = '',
  isLocked = false,
  onUpdateText,
  onKeyDown,
  onPaste,
  onFocus,
  onBlur,
  allPages = [],
  onNavigatePage
}, forwardedRef) => {
  const elRef = useRef(null);
  const isComposingRef = useRef(false);
  const lastHtmlRef = useRef('');
  const lastMarkdownFromInputRef = useRef(text || '');

  // Synchronous ref assignment
  const handleRef = (node) => {
    elRef.current = node;
    if (forwardedRef) {
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else {
        forwardedRef.current = node;
      }
    }
  };

  // Synchronously set initial HTML before first paint so DOM text nodes exist immediately
  useLayoutEffect(() => {
    if (elRef.current) {
      const richHtml = markdownToRichHtml(text || '', { allPages });
      if (elRef.current.innerHTML !== richHtml) {
        elRef.current.innerHTML = richHtml;
        lastHtmlRef.current = richHtml;
      }
    }
  }, []);

  // Synchronize DOM content when text changes externally or formatting is applied
  useEffect(() => {
    if (!elRef.current) return;

    const richHtml = markdownToRichHtml(text || '', { allPages });

    if (elRef.current.innerHTML === richHtml) {
      lastHtmlRef.current = richHtml;
      return;
    }

    const activeEl = document.activeElement;
    const isFocused = activeEl === elRef.current || elRef.current.contains(activeEl);

    // If update came directly from user typing the exact same text in this element, skip recreating innerHTML
    if (
      isFocused &&
      text === lastMarkdownFromInputRef.current &&
      elRef.current.innerHTML === lastHtmlRef.current
    ) {
      return;
    }

    // Text changed externally (e.g. from BubbleMenu bold/italic/color, Cmd+B/I, AI assistant):
    // Apply innerHTML immediately so user sees formatting right away without needing a page refresh!
    if (isFocused) {
      const { start, end } = getSelectionOffsets(elRef.current);
      elRef.current.innerHTML = richHtml;
      lastHtmlRef.current = richHtml;
      lastMarkdownFromInputRef.current = text || '';
      setSelectionOffsets(elRef.current, start, end);
    } else {
      elRef.current.innerHTML = richHtml;
      lastHtmlRef.current = richHtml;
      lastMarkdownFromInputRef.current = text || '';
    }
  }, [text, blockId, allPages]);

  const updateEmptyState = () => {
    const el = elRef.current;
    if (!el) return;
    const hasContent = Boolean(el.textContent && el.textContent.trim().length > 0);
    if (hasContent) {
      el.classList.remove('is-empty');
      el.setAttribute('data-empty', 'false');
    } else {
      el.classList.add('is-empty');
      el.setAttribute('data-empty', 'true');
    }
  };

  const handleInput = () => {
    updateEmptyState();
    if (isComposingRef.current) return;
    const el = elRef.current;
    if (!el) return;
    const currentHtml = el.innerHTML;
    lastHtmlRef.current = currentHtml;
    const plainText = el.innerText || el.textContent || '';
    const newMarkdown = richHtmlToMarkdown(currentHtml);
    lastMarkdownFromInputRef.current = newMarkdown;
    if (onUpdateText) {
      onUpdateText(newMarkdown, plainText);
    }
  };

  const handleBeforeInput = (e) => {
    // Ensure placeholder is cleared synchronously before DOM paint on mobile keystrokes
    if (e.data && e.data.trim().length > 0) {
      const el = elRef.current;
      if (el) {
        el.classList.remove('is-empty');
        el.setAttribute('data-empty', 'false');
      }
    }

    // Intercept Enter / newline on mobile soft keyboards (e.g. Gboard) before browser inserts <br>
    if (e.inputType === 'insertParagraph' || (e.inputType === 'insertLineBreak' && !e.shiftKey)) {
      e.preventDefault();
      isComposingRef.current = false;
      handleInput();
      if (onKeyDown) {
        const syntheticEvent = {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          shiftKey: false,
          metaKey: false,
          ctrlKey: false,
          altKey: false,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        onKeyDown(syntheticEvent);
      }
    }
  };

  const handleKeyDownInternal = (e) => {
    const modKey = e.metaKey || e.ctrlKey;
    if (modKey && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        handleInput();
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        handleInput();
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        handleInput();
        return;
      }
    }

    // Live inline markdown auto-formatting on Space:
    // e.g. typing **bold** followed by Space converts into bold immediately
    if (e.key === ' ' && !e.shiftKey) {
      const el = elRef.current;
      if (el) {
        const offset = getCaretOffset(el);
        const fullPlainText = el.innerText || '';
        const textBeforeCaret = fullPlainText.slice(0, offset);

        const inlineMdMatch = textBeforeCaret.match(
          /(\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|`([^`]+)`)$/
        );

        if (inlineMdMatch) {
          e.preventDefault();
          const matchedSyntax = inlineMdMatch[1];
          const innerText = inlineMdMatch[2] || inlineMdMatch[3] || inlineMdMatch[4] || inlineMdMatch[5];
          const beforeMatch = textBeforeCaret.slice(0, -matchedSyntax.length);
          const afterCaret = fullPlainText.slice(offset);

          const newMarkdown = `${beforeMatch}${matchedSyntax} ${afterCaret}`;
          const richHtml = markdownToRichHtml(newMarkdown, { allPages });

          el.innerHTML = richHtml;
          lastHtmlRef.current = richHtml;
          lastMarkdownFromInputRef.current = newMarkdown;

          if (onUpdateText) {
            onUpdateText(newMarkdown);
          }

          const newCaretOffset = beforeMatch.length + innerText.length + 1;
          setCaretPosition(el, newCaretOffset);
          return;
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  };

  const handleLinkOrMentionClick = (e) => {
    const mention = e.target.closest('.notion-inline-mention');
    if (mention) {
      e.preventDefault();
      e.stopPropagation();
      const pageId = mention.getAttribute('data-mention-id');
      if (pageId && onNavigatePage) {
        onNavigatePage(pageId);
      }
      return;
    }
    const link = e.target.closest('.notion-inline-link');
    if (link && isLocked) {
      return;
    }
  };

  const isEmpty = !text || !text.trim();

  return (
    <div
      ref={handleRef}
      contentEditable={!isLocked}
      suppressContentEditableWarning={true}
      className={`block-rich-text ${className} ${isEmpty ? 'is-empty' : ''}`}
      data-placeholder={placeholder}
      data-block-id={blockId}
      data-empty={isEmpty ? 'true' : 'false'}
      onInput={handleInput}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDownInternal}
      onPaste={onPaste}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={handleLinkOrMentionClick}
      onCompositionStart={() => {
        isComposingRef.current = true;
        updateEmptyState();
      }}
      onCompositionUpdate={() => {
        updateEmptyState();
      }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
    />
  );
});

export const BlockItem = ({
  block,
  index,
  totalBlocks,
  onUpdateBlock,
  onAddBlockBelow,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  focusOnMount,
  onFocusPrevious,
  onFocusNext,
  isDragging,
  isDragOver,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTriggerAI,
  allPages = [],
  onNavigatePage,
  onInsertBlocks,
  isSelected = false,
  onSelectBlock,
  allBlocks = [],
  isLocked = false,
  currentPage = null,
  onMorphToDivider
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCalloutEmojiPicker, setShowCalloutEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(!isLocked && (focusOnMount || !block.text));
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showCommentPopover, setShowCommentPopover] = useState(false);
  const [showInlineCommentPill, setShowInlineCommentPill] = useState(false);
  const [activeBlockComments, setActiveBlockComments] = useState(() => {
    if (!currentPage?.id || !block.id) return [];
    return getBlockComments(currentPage.id, block.id).filter((c) => !c.resolved);
  });
  const blockCommentsCount = activeBlockComments.length;

  // Calculate relative continuous list number for numbered list items (Notion-style)
  const listNumber = useMemo(() => {
    if (block.type !== 'numbered_list_item') return 1;
    let count = 1;
    if (Array.isArray(allBlocks) && allBlocks.length > 0) {
      const currIdx =
        index >= 0 && index < allBlocks.length && allBlocks[index]?.id === block.id
          ? index
          : allBlocks.findIndex((b) => b.id === block.id);

      if (currIdx > 0) {
        for (let i = currIdx - 1; i >= 0; i--) {
          if (allBlocks[i]?.type === 'numbered_list_item') {
            count++;
          } else {
            break;
          }
        }
      }
    }
    return count;
  }, [block.type, block.id, index, allBlocks]);

  const refreshBlockComments = () => {
    if (!currentPage?.id || !block.id) {
      setActiveBlockComments([]);
      return;
    }
    const list = getBlockComments(currentPage.id, block.id).filter((c) => !c.resolved);
    setActiveBlockComments([...list]);
  };

  const handlePostInlineComment = (commentText) => {
    if (!currentPage?.id || !block.id || !commentText) return;
    addComment({
      pageId: currentPage.id,
      blockId: block.id,
      text: commentText,
      author: getCurrentUser()
    });
    refreshBlockComments();
    setShowInlineCommentPill(false);
  };

  const handleResolveComment = (commentId) => {
    toggleResolveComment(commentId);
    refreshBlockComments();
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(commentId);
    refreshBlockComments();
  };

  const handleAddReply = (commentId, replyText) => {
    addReply({
      commentId,
      text: replyText,
      author: getCurrentUser()
    });
    refreshBlockComments();
  };

  useEffect(() => {
    refreshBlockComments();
    const handleUpdate = () => refreshBlockComments();
    window.addEventListener('noted_comments_updated', handleUpdate);
    return () => window.removeEventListener('noted_comments_updated', handleUpdate);
  }, [currentPage?.id, block.id]);

  const canEdit = !isLocked && isEditing;

  const inputRef = useRef(null);
  const subtextRef = useRef(null);
  const menuRef = useRef(null);
  const prevTypeRef = useRef(block.type);
  const pendingFocusRef = useRef(null);

  // Auto-resize textarea to fit content perfectly without scrollbars (REA Notion Desktop spec)
  const adjustHeight = (el) => {
    const target = el || inputRef.current;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const adjustSubtextHeight = (el) => {
    const target = el || subtextRef.current;
    if (!target) return;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const triggerMorphToDivider = () => {
    if (inputRef.current) {
      inputRef.current.innerHTML = '';
    }
    if (onMorphToDivider) {
      onMorphToDivider(block.id, index);
    } else {
      onUpdateBlock(block.id, {
        type: 'divider',
        text: ''
      });
      if (onAddBlockBelow) {
        onAddBlockBelow(index, 'paragraph');
      }
    }
  };

  // Notion-fidelity caret and focus preservation on block morphing
  useLayoutEffect(() => {
    if (prevTypeRef.current !== block.type) {
      const wasEditing = isEditing;
      prevTypeRef.current = block.type;
      if (wasEditing || pendingFocusRef.current || focusOnMount) {
        setIsEditing(true);
        const targetOffset = pendingFocusRef.current?.offset ?? 0;
        pendingFocusRef.current = null;

        // The text the block carries after the morph. The caret is only moved
        // while the field still holds exactly this text, so a character that
        // arrives between the morph and this effect is not relocated.
        const expectedLength = (block.text || '').replace(/[\u200B\u00A0]/g, '').length;

        const place = () => {
          const el = inputRef.current;
          if (!el) return;
          const currentLength = (el.textContent || '').replace(/[\u200B\u00A0]/g, '').length;
          if (currentLength <= expectedLength) {
            setCaretPosition(el, targetOffset);
          }
          adjustHeight(el);
        };
        place();
        requestAnimationFrame(place);
      }
    }
  }, [block.type, isEditing, focusOnMount]);

  // Adjust immediately before paint whenever editing starts or text changes
  useLayoutEffect(() => {
    if (canEdit && inputRef.current) {
      adjustHeight(inputRef.current);
    }
  }, [canEdit, block.text, block.type]);

  useLayoutEffect(() => {
    if (block.isOpen && subtextRef.current) {
      adjustSubtextHeight(subtextRef.current);
    }
  }, [block.isOpen, block.subtext]);

  // Adjust on window resize (since wrapping changes with container width)
  useEffect(() => {
    const handleResize = () => {
      if (inputRef.current) adjustHeight(inputRef.current);
      if (subtextRef.current) adjustSubtextHeight(subtextRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setImageLoadError(false);
  }, [block.url]);

  useEffect(() => {
    if (focusOnMount && !isLocked) {
      setIsEditing(true);
      if (inputRef.current) {
        setCaretPosition(inputRef.current, 0);
        adjustHeight(inputRef.current);
      }
    }
  }, [focusOnMount, isLocked]);

  // When entering edit mode via click, focus cursor at end and auto-fit height
  useEffect(() => {
    if (isEditing && inputRef.current) {
      if (typeof inputRef.current.setSelectionRange === 'function') {
        const len = (inputRef.current.value || '').length;
        inputRef.current.setSelectionRange(len, len);
      } else {
        const len = (inputRef.current.textContent || '').length;
        setCaretPosition(inputRef.current, len);
      }
      adjustHeight(inputRef.current);
    }
  }, [isEditing]);

  const handleClickToEdit = (e) => {
    if (isLocked) return;
    if (e.shiftKey && onSelectBlock) {
      e.preventDefault();
      onSelectBlock(block.id, true);
      return;
    }
    setIsEditing(true);
  };

  const handleBlur = (e) => {
    if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.block-handle-zone')) {
      return;
    }
    if (block.text && block.text.trim()) {
      setIsEditing(false);
    }
  };

  // Close popup menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Auto-morph blocks that only contain a page link or start with checklist syntax ([] / [ ]) into proper block types
  useEffect(() => {
    if (block.type === 'paragraph' && block.text) {
      const trimmed = block.text.trim();
      const soleMatch = trimmed.match(/^\[\[(?:page:([^|]+)\|)?([^\]]+)\]\]$/);
      if (soleMatch) {
        const pageId = soleMatch[1];
        const pageTitle = soleMatch[2];
        const matchedPage = allPages.find(
          (p) =>
            (pageId && p.id === pageId) ||
            (p.title && p.title.toLowerCase() === pageTitle.toLowerCase()) ||
            p.id === pageTitle
        );
        if (matchedPage) {
          onUpdateBlock(block.id, {
            type: 'link_to_page',
            targetPageId: matchedPage.id,
            targetTitle: matchedPage.title,
            targetIcon: matchedPage.icon || '📄',
            text: matchedPage.title
          });
          return;
        }
      }

      // Auto-morph checklist: [] or [ ] or [x] or - [ ] or * [ ]
      const todoMatch = trimmed.match(/^([-*•+]?\s*)?\[([ xX]?)\]\s*(.*)/);
      if (todoMatch) {
        onUpdateBlock(block.id, {
          type: 'to_do',
          checked: (todoMatch[2] || '').toLowerCase() === 'x',
          text: todoMatch[3]
        });
        return;
      }

      // Auto-morph divider line: ---, ***, ___, —
      if (/^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(trimmed)) {
        triggerMorphToDivider();
        return;
      }
    }
  }, [block.type, block.text, allPages]);

  const handleTextChange = (newVal, plainText = newVal) => {
    const checkText = plainText || newVal || '';
    // Only check markdown syntax triggers on paragraphs (at start of line)
    if (block.type === 'paragraph') {
      const trimmed = checkText.replace(/[\u200B\u00A0]/g, ' ').trim();

      // Divider Line: --- or *** or ___ or — (macOS smart dash)
      if (/^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(trimmed)) {
        triggerMorphToDivider();
        return;
      }

      // Heading 1: # 
      if (checkText === '# ' || checkText.startsWith('# ')) {
        const preserved = checkText.replace(/^#\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, { type: 'heading_1', text: preserved });
        return;
      }
      // Heading 2: ## 
      if (checkText === '## ' || checkText.startsWith('## ')) {
        const preserved = checkText.replace(/^##\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, { type: 'heading_2', text: preserved });
        return;
      }
      // Heading 3: ### 
      if (checkText === '### ' || checkText.startsWith('### ')) {
        const preserved = checkText.replace(/^###\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, { type: 'heading_3', text: preserved });
        return;
      }
      // Heading 4-6 (Sub-headings): ####, #####, ###### -> heading_3
      if (
        checkText === '#### ' ||
        checkText.startsWith('#### ') ||
        checkText === '##### ' ||
        checkText.startsWith('##### ') ||
        checkText === '###### ' ||
        checkText.startsWith('###### ')
      ) {
        const preserved = checkText.replace(/^#{4,6}\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, { type: 'heading_3', text: preserved });
        return;
      }

      // Table of Contents trigger: /toc or [toc]
      if (checkText === '/toc' || checkText === '/tableofcontents' || checkText === '[toc]' || checkText === '/toc ') {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'table_of_contents', text: '' });
        return;
      }

      // Kategori D Advanced Block Triggers
      if (checkText === '/bookmark' || checkText === '/bookmark ') {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'bookmark', url: '', title: '', description: '', caption: '', text: '' });
        return;
      }
      if (checkText === '/video' || checkText === '/video ' || checkText === '/embed' || checkText === '/embed ') {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'video', url: '', caption: '', text: '' });
        return;
      }
      if (checkText === '/math' || checkText === '/math ' || checkText === '/equation' || checkText === '/equation ' || checkText === '$$' || checkText === '$$ ') {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'math', content: '', text: '' });
        return;
      }
      if (checkText === '/breadcrumb' || checkText === '/breadcrumb ') {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'breadcrumb', text: '' });
        return;
      }

      // Kategori F Discussion Triggers
      if (checkText === '/comment' || checkText === '/comment ' || checkText === '/diskusi' || checkText === '/diskusi ') {
        onUpdateBlock(block.id, { text: '' });
        setShowCommentPopover(true);
        return;
      }

      // To-Do Checklist: [] or [ ]
      if (checkText.startsWith('[] ') || checkText.startsWith('[ ] ')) {
        const preserved = checkText.replace(/^\[\s*\]\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'to_do',
          text: preserved,
          checked: false
        });
        return;
      }
      // To-Do Checked: [x] or [X]
      if (checkText.startsWith('[x] ') || checkText.startsWith('[X] ')) {
        const preserved = checkText.replace(/^\[[xX]\]\s*/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'to_do',
          text: preserved,
          checked: true
        });
        return;
      }

      // Bulleted List: - or * or +
      if (checkText.startsWith('- ') || checkText.startsWith('* ') || checkText.startsWith('+ ')) {
        const preserved = checkText.replace(/^[-*+]\s+/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'bulleted_list_item',
          text: preserved
        });
        return;
      }

      // Numbered List: 1. or 1)
      if (/^\d+[.)]\s+/.test(checkText)) {
        const preserved = checkText.replace(/^\d+[.)]\s+/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'numbered_list_item',
          text: preserved
        });
        return;
      }

      // Quote Block: > 
      if (checkText.startsWith('> ') || checkText.startsWith('" ')) {
        const preserved = checkText.replace(/^(>|")\s+/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'quote',
          text: preserved
        });
        return;
      }

      // Toggle Accordion: >> or >!
      if (checkText.startsWith('>> ') || checkText.startsWith('>! ')) {
        const preserved = checkText.replace(/^(>>|>!)\s+/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'toggle',
          text: preserved,
          isOpen: false,
          subtext: ''
        });
        return;
      }

      // Callout Box: ::: or |!
      if (checkText.startsWith('::: ') || checkText.startsWith('|! ')) {
        const preserved = checkText.replace(/^::: ?|^\|! ?/, '');
        pendingFocusRef.current = { offset: preserved.length };
        onUpdateBlock(block.id, {
          type: 'callout',
          text: preserved,
          icon: '💡',
          color: 'blue'
        });
        return;
      }

      // Code Block: ```lang or ```
      if (checkText.startsWith('```')) {
        const match = checkText.match(/^```([a-zA-Z0-9_-]*)\s*/);
        if (match && (checkText.endsWith(' ') || checkText.endsWith('\n') || checkText.length > 3)) {
          const lang = match[1].toLowerCase() || 'javascript';
          pendingFocusRef.current = { offset: 0 };
          onUpdateBlock(block.id, {
            type: 'code',
            language: CODE_LANGUAGES.includes(lang) ? lang : 'javascript',
            code: '',
            text: ''
          });
          return;
        }
      }
    }

    // Check mention trigger ([[ or @)
    if (newVal.includes('[[') || newVal.includes('@')) {
      const lastDoubleBracket = newVal.lastIndexOf('[[');
      const lastAt = newVal.lastIndexOf('@');
      if (lastDoubleBracket !== -1 && lastDoubleBracket >= lastAt) {
        const query = newVal.slice(lastDoubleBracket + 2);
        if (!query.includes(']')) {
          setShowMentionMenu(true);
          setMentionQuery(query);
        } else {
          setShowMentionMenu(false);
        }
      } else if (lastAt !== -1 && (lastAt === 0 || newVal[lastAt - 1] === ' ')) {
        const query = newVal.slice(lastAt + 1);
        if (!query.includes(' ')) {
          setShowMentionMenu(true);
          setMentionQuery(query);
        } else {
          setShowMentionMenu(false);
        }
      }
    } else if (showMentionMenu) {
      setShowMentionMenu(false);
    }

    // Auto-morph sole markdown wiki title link [[Page Title]] or [[page:id|title]] into link_to_page
    const soleWikiMatch = newVal.trim().match(/^\[\[(?:page:([^|]+)\|)?([^\]]+)\]\]$/);
    if (soleWikiMatch && block.type === 'paragraph') {
      const pageId = soleWikiMatch[1];
      const pageTitle = soleWikiMatch[2];
      const matchedPage = allPages.find(
        (p) =>
          (pageId && p.id === pageId) ||
          (p.title && p.title.toLowerCase() === pageTitle.toLowerCase()) ||
          p.id === pageTitle
      );
      if (matchedPage) {
        onUpdateBlock(block.id, {
          type: 'link_to_page',
          targetPageId: matchedPage.id,
          targetTitle: matchedPage.title,
          targetIcon: matchedPage.icon || '📄',
          text: matchedPage.title
        });
        return;
      }
    }

    onUpdateBlock(block.id, { text: newVal });
  };

  const handleSelectMentionPage = (targetPage) => {
    setShowMentionMenu(false);
    if (!targetPage) return;

    // If block is already link_to_page
    if (block.type === 'link_to_page') {
      onUpdateBlock(block.id, {
        targetPageId: targetPage.id,
        targetTitle: targetPage.title,
        targetIcon: targetPage.icon || '📄',
        text: targetPage.title
      });
      return;
    }

    let currentText = block.text || '';
    const lastDoubleBracket = currentText.lastIndexOf('[[');
    const lastAt = currentText.lastIndexOf('@');

    const prefix =
      lastDoubleBracket !== -1 && lastDoubleBracket >= lastAt
        ? currentText.slice(0, lastDoubleBracket)
        : lastAt !== -1
        ? currentText.slice(0, lastAt)
        : '';

    // If there is no preceding text on this line, morph into a dedicated Notion Page Link block!
    if (prefix.trim() === '') {
      onUpdateBlock(block.id, {
        type: 'link_to_page',
        targetPageId: targetPage.id,
        targetTitle: targetPage.title,
        targetIcon: targetPage.icon || '📄',
        text: targetPage.title
      });
      return;
    }

    // Otherwise, inline mention inside a paragraph with clean markdown title syntax: [[Page Title]]
    const newText = `${prefix}[[${targetPage.title}]] `;
    onUpdateBlock(block.id, { text: newText });
  };

  /**
   * Smart Paste for AI Chat Responses & Markdown
   * Automatically parses multi-line or markdown clipboard content into native Notion blocks
   */
  const handlePaste = (e) => {
    // If inside a code block, allow normal pasting of code
    if (block.type === 'code') return;

    // 1. Direct Image Paste from Clipboard (Screenshot, copied image from browser/Finder)
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              const base64Url = loadEvent.target.result;
              const newImageBlock = {
                id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                type: 'image',
                url: base64Url,
                caption: file.name && file.name !== 'image.png' ? file.name : 'Pasted image'
              };
              const isEmpty = !(block.text || '').trim();
              if (onInsertBlocks) {
                onInsertBlocks([newImageBlock], block.id, isEmpty);
              } else {
                onUpdateBlock(block.id, newImageBlock);
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }

    const clipboardText = e.clipboardData?.getData('text/plain');
    if (!clipboardText) return;

    // 2. Direct Image URL paste on an empty block (e.g. https://.../photo.png or data:image/...)
    const isDirectImageUrl = /^(https?:\/\/.*\.(?:png|jpg|jpeg|webp|gif|svg)(\?.*)?|data:image\/[a-zA-Z]+;base64,.*)$/i.test(
      clipboardText.trim()
    );
    if (isDirectImageUrl && (!(block.text || '').trim() || block.type === 'image')) {
      e.preventDefault();
      onUpdateBlock(block.id, {
        type: 'image',
        url: normalizeMediaUrl(clipboardText.trim()),
        caption: ''
      });
      return;
    }

    // 3. Multi-line or Markdown paste (including headings H1-H6, tables, checklists, images ![alt](url))
    const hasMultipleLines = clipboardText.includes('\n');
    const hasMarkdownSyntax =
      /(^|\n)\s*(#{1,6}\s+|[-*•+]\s+|[-*]\s*\[[ xX]\]|\d+[.)]\s+|>\s+|```|\|.*\|.*\||!?\[.*?\]\(.*?\)|:::|---|___)/.test(
        clipboardText
      );

    if (hasMultipleLines || hasMarkdownSyntax) {
      const parsed = parseMarkdownToBlocks(clipboardText);
      if (parsed.length > 0 && onInsertBlocks) {
        e.preventDefault();
        const currentText = (block.text || '').trim();
        const isEmpty = currentText === '';
        onInsertBlocks(parsed, block.id, isEmpty);
      }
    }
  };

  const handleKeyDown = (e) => {
    // Notion Space markdown trigger shortcuts on paragraph blocks
    if (e.key === ' ' && block.type === 'paragraph' && !e.shiftKey) {
      const domLive = inputRef.current ? (inputRef.current.innerText || inputRef.current.textContent || '') : '';
      const rawText = domLive.trim() ? domLive : (block.text || '');
      const val = rawText.replace(/[\u200B\u00A0]/g, ' ').trim();

      // Divider Line: ---, ***, ___, —
      if (/^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(val)) {
        e.preventDefault();
        triggerMorphToDivider();
        return;
      }

      // Hudbird AI trigger when pressing Space on an empty block
      if (val === '') {
        e.preventDefault();
        if (onTriggerAI) {
          onTriggerAI(block.id, '');
        }
        return;
      }

      // To-Do Checklist: [] or [ ]
      if (val === '[]' || val === '[ ]') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'to_do',
          text: '',
          checked: false
        });
        return;
      }

      // To-Do Checked: [x] or [X]
      if (val === '[x]' || val === '[X]') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'to_do',
          text: '',
          checked: true
        });
        return;
      }

      // Bulleted List: - or * or +
      if (val === '-' || val === '*' || val === '+') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'bulleted_list_item',
          text: ''
        });
        return;
      }

      // Numbered List: 1. or 1)
      if (/^\d+[.)]$/.test(val)) {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'numbered_list_item',
          text: ''
        });
        return;
      }

      // Heading 1: #
      if (val === '#') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'heading_1',
          text: ''
        });
        return;
      }

      // Heading 2: ##
      if (val === '##') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'heading_2',
          text: ''
        });
        return;
      }

      // Heading 3: ###
      if (val === '###') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'heading_3',
          text: ''
        });
        return;
      }

      // Sub-headings: ####, #####, ######
      if (/^#{4,6}$/.test(val)) {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'heading_3',
          text: ''
        });
        return;
      }

      // Quote: > or "
      if (val === '>' || val === '"') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'quote',
          text: ''
        });
        return;
      }

      // Toggle: >> or >!
      if (val === '>>' || val === '>!') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'toggle',
          text: '',
          isOpen: false,
          subtext: ''
        });
        return;
      }

      // Callout: ::: or |!
      if (val === ':::' || val === '|!') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, {
          type: 'callout',
          text: '',
          icon: '💡',
          color: 'blue'
        });
        return;
      }
    }

    // Notion Desktop shortcut: Cmd+J triggers Inline AI on selected text or block
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      const selection = window.getSelection();
      const selText = selection ? selection.toString().trim() : '';
      const start = e.target?.selectionStart;
      const end = e.target?.selectionEnd;
      const textareaSel = (typeof start === 'number' && typeof end === 'number' && start !== end)
        ? e.target.value.substring(start, end).trim()
        : '';
      const chosenText = selText || textareaSel || (block.text || '');
      if (onTriggerAI) {
        onTriggerAI(block.id, chosenText);
      }
      return;
    }

    // Slash command trigger
    if (e.key === '/') {
      // The live DOM text is used because the React state can lag behind the
      // caret while the user is typing.
      const domLive = inputRef.current ? (inputRef.current.innerText || inputRef.current.textContent || '') : '';
      const rawText = domLive.trim() ? domLive : (block.text || '');
      const val = rawText.replace(/[\u200B\u00A0]/g, ' ').trim();
      if (val === '' || val.endsWith(' ')) {
        setShowSlashMenu(true);
        setSlashFilter('');
      }
    }

    if (showSlashMenu) {
      if (e.key === 'Backspace' && (!slashFilter || slashFilter.length === 0)) {
        setShowSlashMenu(false);
      } else if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && e.key !== 'Escape') {
        // filter text
        setSlashFilter((prev) => (e.key.length === 1 ? prev + e.key : prev));
      }
      return;
    }

    if (e.key === 'Enter' && e.shiftKey) {
      // Soft break in multiline block: adjust height immediately after newline
      requestAnimationFrame(() => {
        if (inputRef.current) adjustHeight(inputRef.current);
      });
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'code') {
        // Allow enter in code blocks
        return;
      }
      e.preventDefault();
      const domText = inputRef.current ? (inputRef.current.innerText || inputRef.current.textContent || '') : '';
      const rawText = domText.trim() ? domText : (block.text || '');
      const val = rawText.replace(/[\u200B\u00A0]/g, ' ').trim();

      // Divider Line on Enter: ---, ***, ___, —
      if (block.type === 'paragraph' && /^(?:-{3,}|\*{3,}|_{3,}|—)$/.test(val)) {
        triggerMorphToDivider();
        return;
      }

      // If pressing enter on an empty list item, todo, or quote, morph back to paragraph
      if (
        val === '' &&
        (block.type === 'bulleted_list_item' ||
          block.type === 'numbered_list_item' ||
          block.type === 'to_do' ||
          block.type === 'quote')
      ) {
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'paragraph', text: '' });
        return;
      }

      // Automatically continue list or todo
      let nextType = 'paragraph';
      if (
        block.type === 'bulleted_list_item' ||
        block.type === 'numbered_list_item' ||
        block.type === 'to_do'
      ) {
        nextType = block.type;
      }

      // Sync current block text if changed before creating the next block
      if (domText && domText !== block.text) {
        onUpdateBlock(block.id, { text: domText.replace(/\n$/, '') });
      }

      onAddBlockBelow(index, nextType);
    } else if (e.key === 'Backspace') {
      const val = block.text || '';
      const cursor = getCaretOffset(inputRef.current);

      // If cursor is at start of a non-paragraph block with text, convert to paragraph
      if (cursor === 0 && block.type !== 'paragraph' && block.type !== 'divider') {
        e.preventDefault();
        pendingFocusRef.current = { offset: 0 };
        onUpdateBlock(block.id, { type: 'paragraph' });
        return;
      }

      if (val === '') {
        // Notion UX: If on an empty non-paragraph block, convert back to paragraph
        if (block.type !== 'paragraph' && block.type !== 'divider') {
          e.preventDefault();
          pendingFocusRef.current = { offset: 0 };
          onUpdateBlock(block.id, { type: 'paragraph', text: '' });
          return;
        }
        if (totalBlocks > 1) {
          e.preventDefault();
          onDeleteBlock(block.id);
          if (onFocusPrevious) onFocusPrevious(index);
        }
      }
    } else if (e.key === 'ArrowUp') {
      // If at start of block (position 0), focus previous block
      if (inputRef.current && onFocusPrevious) {
        const cursor = getCaretOffset(inputRef.current);
        if (cursor === 0) {
          onFocusPrevious(index);
        }
      }
    } else if (e.key === 'ArrowDown') {
      // If at end of block, focus next block
      if (inputRef.current && onFocusNext) {
        const cursor = getCaretOffset(inputRef.current);
        const totalLen = (block.text || '').length;
        if (cursor >= totalLen) {
          onFocusNext(index);
        }
      }
    }
  };

  const handleSlashSelect = (newType) => {
    setShowSlashMenu(false);
    // Remove the trailing slash or slash filter
    let newText = block.text || '';
    if (newText.endsWith('/' + slashFilter)) {
      newText = newText.slice(0, -(slashFilter.length + 1));
    } else if (newText.endsWith('/')) {
      newText = newText.slice(0, -1);
    }

    pendingFocusRef.current = { offset: (newText || '').length };

    if (newType === 'ai_assistant') {
      if (onTriggerAI) {
        onTriggerAI(block.id, newText);
      }
      return;
    }

    if (newType === 'comment') {
      onUpdateBlock(block.id, { text: newText });
      setShowCommentPopover(true);
      return;
    }

    if (newType === 'table' || newType === 'board' || newType === 'gallery') {
      onUpdateBlock(block.id, {
        type: 'table',
        viewType: newType === 'table' ? 'table' : newType,
        groupByCol: 1,
        text: '',
        headers: ['Name', 'Status', 'Priority'],
        // An empty table, not a filled in sample: the rows belong to the user
        rows: [['', '', '']]
      });
    } else if (newType === 'code') {
      onUpdateBlock(block.id, {
        type: 'code',
        language: 'javascript',
        code: newText || '// Type code here...',
        text: ''
      });
    } else if (newType === 'callout') {
      onUpdateBlock(block.id, {
        type: 'callout',
        text: newText,
        icon: '💡',
        color: 'blue'
      });
    } else if (newType === 'to_do') {
      onUpdateBlock(block.id, {
        type: 'to_do',
        text: newText,
        checked: false
      });
    } else if (newType === 'column_list_2' || newType === 'column_list_3' || newType === 'column_list') {
      const count = newType === 'column_list_3' ? 3 : 2;
      const cols = [];
      for (let c = 1; c <= count; c++) {
        cols.push({
          id: `col-${Date.now()}-${c}`,
          title: `Column ${c}`,
          blocks: [
            {
              id: `col-b-${Date.now()}-${c}`,
              type: 'paragraph',
              text: c === 1 && newText ? newText : ''
            }
          ]
        });
      }
      onUpdateBlock(block.id, {
        type: 'column_list',
        columnCount: count,
        columns: cols
      });
    } else if (newType === 'link_to_page') {
      onUpdateBlock(block.id, {
        type: 'link_to_page',
        targetPageId: null,
        targetTitle: '',
        targetIcon: '📄',
        text: ''
      });
      setShowMentionMenu(true);
      setMentionQuery('');
    } else if (newType === 'table_of_contents') {
      onUpdateBlock(block.id, {
        type: 'table_of_contents',
        text: ''
      });
    } else if (newType === 'image') {
      onUpdateBlock(block.id, {
        type: 'image',
        url: '',
        caption: '',
        text: ''
      });
    } else if (newType === 'bookmark') {
      onUpdateBlock(block.id, {
        type: 'bookmark',
        url: newText?.startsWith('http') ? newText : '',
        title: '',
        description: '',
        caption: '',
        text: ''
      });
    } else if (newType === 'video') {
      onUpdateBlock(block.id, {
        type: 'video',
        url: newText?.startsWith('http') ? newText : '',
        caption: '',
        text: ''
      });
    } else if (newType === 'math') {
      onUpdateBlock(block.id, {
        type: 'math',
        content: newText || '',
        text: ''
      });
    } else if (newType === 'breadcrumb') {
      onUpdateBlock(block.id, {
        type: 'breadcrumb',
        text: ''
      });
    } else if (newType === 'divider') {
      triggerMorphToDivider();
      return;
    } else {
      onUpdateBlock(block.id, {
        type: newType,
        text: newText
      });
    }
  };

  const handleCopyCode = () => {
    const textToCopy = block.code || block.text || '';
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const extractMentionChips = (rawText) => {
    if (!rawText) return [];
    const chips = [];
    const seenIds = new Set();

    // 1. Explicit syntax: [[page:id|title]]
    const explicitRegex = /\[\[page:([^|]+)\|([^\]]+)\]\]/g;
    let match;
    while ((match = explicitRegex.exec(rawText)) !== null) {
      const pageId = match[1];
      const pageTitle = match[2];
      const pageObj = allPages.find(
        (p) => p.id === pageId || (p.title && p.title.toLowerCase() === pageTitle.toLowerCase())
      );
      const resId = pageObj ? pageObj.id : pageId;
      const resTitle = pageObj ? pageObj.title : pageTitle;
      const resIcon = pageObj ? pageObj.icon : '📄';
      if (!seenIds.has(resId)) {
        seenIds.add(resId);
        chips.push({ id: resId, title: resTitle, icon: resIcon });
      }
    }

    // 2. Standard markdown wiki title link: [[Page Title]] or [[page-id]]
    const wikiRegex = /\[\[([^\]|]+)\]\]/g;
    while ((match = wikiRegex.exec(rawText)) !== null) {
      const term = match[1].trim();
      if (term.startsWith('page:')) continue;

      const pageObj = allPages.find(
        (p) =>
          (p.title && p.title.toLowerCase() === term.toLowerCase()) ||
          p.id === term
      );

      if (pageObj && !seenIds.has(pageObj.id)) {
        seenIds.add(pageObj.id);
        chips.push({ id: pageObj.id, title: pageObj.title, icon: pageObj.icon || '📄' });
      } else if (!pageObj) {
        // Partial matching
        const partial = allPages.find(
          (p) => p.title && p.title.toLowerCase().includes(term.toLowerCase())
        );
        if (partial && !seenIds.has(partial.id)) {
          seenIds.add(partial.id);
          chips.push({ id: partial.id, title: partial.title, icon: partial.icon || '📄' });
        }
      }
    }

    // 3. Standard markdown link: [Title](page-id)
    const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = mdRegex.exec(rawText)) !== null) {
      const label = match[1].trim();
      const target = match[2].trim().replace(/^#/, '');
      const pageObj = allPages.find(
        (p) =>
          p.id === target ||
          (p.title && p.title.toLowerCase() === label.toLowerCase()) ||
          (p.title && p.title.toLowerCase() === target.toLowerCase())
      );
      if (pageObj && !seenIds.has(pageObj.id)) {
        seenIds.add(pageObj.id);
        chips.push({ id: pageObj.id, title: pageObj.title, icon: pageObj.icon || '📄' });
      }
    }

    return chips;
  };

  return (
    <div
      id={`block-${block.id}`}
      data-block-id={block.id}
      className={`block-item-container block-type-${block.type} ${
        isDragging ? 'is-dragging' : ''
      } ${isDragOver ? `drag-over-${dropPosition}` : ''} ${
        isSelected ? 'is-block-selected' : ''
      } ${blockCommentsCount > 0 ? 'has-active-comment' : ''}`}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDragLeave={(e) => onDragLeave && onDragLeave(e, index)}
      onDrop={(e) => !isLocked && onDrop && onDrop(e, index)}
      onContextMenu={(e) => {
        if (isLocked) return;
        // On mobile touch viewports, long-press/text selection natively fires contextmenu.
        // Suppress opening the desktop floating context menu to avoid double-menu clutter.
        if (typeof window !== 'undefined' && (window.innerWidth <= 768 || window.matchMedia('(hover: none)').matches)) {
          return;
        }
        e.preventDefault();
        setShowMenu(true);
      }}
      onClick={(e) => {
        if (isLocked) return;
        if (e.shiftKey && onSelectBlock) {
          e.preventDefault();
          onSelectBlock(block.id, true);
        }
      }}
    >
      {/* Notion Drop Indicator Line */}
      {!isLocked && isDragOver && dropPosition === 'top' && <div className="block-drop-line top" />}
      {!isLocked && isDragOver && dropPosition === 'bottom' && <div className="block-drop-line bottom" />}

      {/* Left Hover Handle (Canonical Notion REA 2-button layout) */}
      {!isLocked && (
        <div className="block-handle-zone">
          <button
            className="block-handle-btn plus-btn"
            title="Add block below"
            onClick={() => onAddBlockBelow(index)}
          >
            <Plus size={14} />
          </button>
          <button
            className="block-handle-btn grip-btn"
            title="Click to select / Shift+Click for range / Drag to move"
            draggable={true}
            onDragStart={(e) => onDragStart && onDragStart(e, index)}
            onDragEnd={onDragEnd}
            onClick={(e) => {
              if (e.shiftKey && onSelectBlock) {
                onSelectBlock(block.id, true);
              } else if (onSelectBlock) {
                onSelectBlock(block.id, false, true);
              } else {
                setShowMenu(!showMenu);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowMenu(true);
            }}
          >
            {isSelected ? <Check size={12} className="text-ai-purple" /> : <GripVertical size={14} />}
          </button>
        </div>
      )}

        {/* Block Context Menu */}
        {!isLocked && showMenu && (
          <div className="block-context-menu animate-popover" ref={menuRef}>
            <button
              className="menu-action-item ai-menu-action"
              onClick={() => {
                onTriggerAI && onTriggerAI(block.id, block.text || '');
                setShowMenu(false);
              }}
            >
              <Sparkles size={14} className="text-ai-purple" />
              <span>Ask Hudbird AI</span>
            </button>
            <button
              className="menu-action-item"
              onClick={() => {
                setShowCommentPopover(true);
                setShowMenu(false);
              }}
            >
              <MessageSquare size={14} className="text-accent" />
              <span>Comment (/comment)</span>
            </button>
            <div className="menu-divider" />
            <div className="menu-group-label">Actions</div>
            <button
              className="menu-action-item"
              onClick={() => {
                onDuplicateBlock(block.id);
                setShowMenu(false);
              }}
            >
              <CopyPlus size={14} />
              <span>Duplicate</span>
            </button>
            {index > 0 && (
              <button
                className="menu-action-item"
                onClick={() => {
                  onMoveBlock(index, index - 1);
                  setShowMenu(false);
                }}
              >
                <ArrowUp size={14} />
                <span>Move Up</span>
              </button>
            )}
            {index < totalBlocks - 1 && (
              <button
                className="menu-action-item"
                onClick={() => {
                  onMoveBlock(index, index + 1);
                  setShowMenu(false);
                }}
              >
                <ArrowDown size={14} />
                <span>Move Down</span>
              </button>
            )}
            <button
              className="menu-action-item delete-item"
              onClick={() => {
                onDeleteBlock(block.id);
                setShowMenu(false);
              }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
            <div className="menu-divider" />
            <div className="menu-group-label">Turn Into</div>
            <button className="menu-action-item" onClick={() => handleSlashSelect('paragraph')}>
              <span>Text</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('heading_1')}>
              <span>Heading 1</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('heading_2')}>
              <span>Heading 2</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('heading_3')}>
              <span>Heading 3</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('to_do')}>
              <span>To-do List</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('bulleted_list_item')}>
              <span>Bulleted List</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('numbered_list_item')}>
              <span>Numbered List</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('code')}>
              <span>Code Block</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('callout')}>
              <span>Callout</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('quote')}>
              <span>Quote</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('table')}>
              <span>Table</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('board')}>
              <span>Board (Kanban)</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('gallery')}>
              <span>Gallery</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('column_list_2')}>
              <span>2 Columns</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('column_list_3')}>
              <span>3 Columns</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('link_to_page')}>
              <span>Link to Page</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('table_of_contents')}>
              <span>Table of Contents</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('bookmark')}>
              <span>Web Bookmark</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('video')}>
              <span>Video</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('math')}>
              <span>Math Equation</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('breadcrumb')}>
              <span>Breadcrumb</span>
            </button>
            <button className="menu-action-item" onClick={() => handleSlashSelect('divider')}>
              <span>Divider</span>
            </button>
          </div>
        )}

      {/* Main Block Content */}
      <div className="block-content-wrapper">
        {/* Paragraph */}
        {block.type === 'paragraph' && (
          <BlockRichText
            ref={inputRef}
            blockId={block.id}
            type="paragraph"
            text={block.text || ''}
            placeholder="Type '/' for commands, '[[ ' or '@' to link, or '#', '-', '[]' for markdown..."
            className="block-paragraph"
            isLocked={isLocked}
            onUpdateText={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            allPages={allPages}
            onNavigatePage={onNavigatePage}
          />
        )}

        {/* Inline Mention Chips */}
        {block.text &&
          (block.text.includes('[[') || block.text.includes('@') || block.text.includes('](')) &&
          extractMentionChips(block.text).length > 0 && (
            <div className="inline-mentions-pills">
              {extractMentionChips(block.text).map((chip) => (
                <button
                  key={chip.id}
                  className="mention-chip-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigatePage && onNavigatePage(chip.id);
                  }}
                  title={`Jump to ${chip.title}`}
                >
                  <span className="chip-emoji">{chip.icon || '📄'}</span>
                  <span className="chip-title">{chip.title}</span>
                  <ArrowUpRight size={10} className="chip-arrow" />
                </button>
              ))}
            </div>
          )}

        {/* Headings */}
        {block.type === 'heading_1' && (
          <BlockRichText
            ref={inputRef}
            blockId={block.id}
            type="heading_1"
            text={block.text || ''}
            placeholder="Heading 1"
            className="block-heading block-h1"
            isLocked={isLocked}
            onUpdateText={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            allPages={allPages}
            onNavigatePage={onNavigatePage}
          />
        )}
        {block.type === 'heading_2' && (
          <BlockRichText
            ref={inputRef}
            blockId={block.id}
            type="heading_2"
            text={block.text || ''}
            placeholder="Heading 2"
            className="block-heading block-h2"
            isLocked={isLocked}
            onUpdateText={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            allPages={allPages}
            onNavigatePage={onNavigatePage}
          />
        )}
        {block.type === 'heading_3' && (
          <BlockRichText
            ref={inputRef}
            blockId={block.id}
            type="heading_3"
            text={block.text || ''}
            placeholder="Heading 3"
            className="block-heading block-h3"
            isLocked={isLocked}
            onUpdateText={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            allPages={allPages}
            onNavigatePage={onNavigatePage}
          />
        )}

        {/* To-Do Checklist */}
        {block.type === 'to_do' && (
          <div className="block-todo-wrapper">
            <input
              type="checkbox"
              id={`todo-${block.id}`}
              className="block-checkbox"
              checked={!!block.checked}
              disabled={isLocked}
              onChange={(e) => !isLocked && onUpdateBlock(block.id, { checked: e.target.checked })}
            />
            <label htmlFor={`todo-${block.id}`} className="block-checkbox-custom" style={isLocked ? { cursor: 'default' } : {}}>
              {block.checked && <Check size={12} className="check-svg" />}
            </label>
            <BlockRichText
              ref={inputRef}
              blockId={block.id}
              type="to_do"
              text={block.text || ''}
              placeholder="To-do task..."
              className={`block-todo-input ${block.checked ? 'completed' : ''}`}
              isLocked={isLocked}
              onUpdateText={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              allPages={allPages}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )}

        {/* Bulleted List */}
        {block.type === 'bulleted_list_item' && (
          <div className="block-list-wrapper">
            <div className="block-bullet-point" />
            <BlockRichText
              ref={inputRef}
              blockId={block.id}
              type="bulleted_list_item"
              text={block.text || ''}
              placeholder="List item..."
              className="block-list-input"
              isLocked={isLocked}
              onUpdateText={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              allPages={allPages}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )}

        {/* Numbered List */}
        {block.type === 'numbered_list_item' && (
          <div className="block-list-wrapper">
            <span className="block-number-label">{listNumber}.</span>
            <BlockRichText
              ref={inputRef}
              blockId={block.id}
              type="numbered_list_item"
              text={block.text || ''}
              placeholder="Numbered item..."
              className="block-list-input"
              isLocked={isLocked}
              onUpdateText={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              allPages={allPages}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )}

        {/* Toggle Accordion */}
        {block.type === 'toggle' && (
          <div className="block-toggle-container">
            <div className="block-toggle-header">
              <button
                className="block-toggle-caret"
                onClick={() => onUpdateBlock(block.id, { isOpen: !block.isOpen })}
              >
                {block.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <BlockRichText
                ref={inputRef}
                blockId={block.id}
                type="toggle"
                text={block.text || ''}
                placeholder="Toggle title..."
                className="block-toggle-title"
                isLocked={isLocked}
                onUpdateText={handleTextChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setIsEditing(true)}
                onBlur={handleBlur}
                allPages={allPages}
                onNavigatePage={onNavigatePage}
              />
            </div>
            {block.isOpen && (
              <div className="block-toggle-body">
                <textarea
                  ref={subtextRef}
                  className="block-input block-toggle-subtext"
                  rows={1}
                  value={block.subtext || ''}
                  readOnly={isLocked}
                  placeholder="Toggle content... write detailed notes here."
                  onInput={(e) => adjustSubtextHeight(e.target)}
                  onChange={(e) => {
                    if (!isLocked) {
                      onUpdateBlock(block.id, { subtext: e.target.value });
                      adjustSubtextHeight(e.target);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Quote Block */}
        {block.type === 'quote' && (
          <div className="block-quote-container">
            <BlockRichText
              ref={inputRef}
              blockId={block.id}
              type="quote"
              text={block.text || ''}
              placeholder="Empty quote..."
              className="block-quote-input"
              isLocked={isLocked}
              onUpdateText={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              allPages={allPages}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )}

        {/* Callout Box */}
        {block.type === 'callout' && (
          <div className={`block-callout-container color-${block.color || 'blue'}`}>
            <div className="callout-icon-area">
              <button
                className="callout-emoji-btn"
                onClick={() => !isLocked && setShowCalloutEmojiPicker(!showCalloutEmojiPicker)}
                title={isLocked ? 'Callout icon' : 'Change callout icon'}
                style={isLocked ? { cursor: 'default' } : {}}
              >
                {block.icon || '💡'}
              </button>
              {!isLocked && showCalloutEmojiPicker && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    onUpdateBlock(block.id, { icon: emoji });
                    setShowCalloutEmojiPicker(false);
                  }}
                  onClose={() => setShowCalloutEmojiPicker(false)}
                />
              )}
            </div>
            <BlockRichText
              ref={inputRef}
              blockId={block.id}
              type="callout"
              text={block.text || ''}
              placeholder="Callout text..."
              className="block-callout-input"
              isLocked={isLocked}
              onUpdateText={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsEditing(true)}
              onBlur={handleBlur}
              allPages={allPages}
              onNavigatePage={onNavigatePage}
            />
          </div>
        )}


        {/* Code Snippet Block */}
        {block.type === 'code' && (
          <div className="block-code-card">
            <div className="block-code-topbar">
              <select
                className="code-lang-select"
                value={block.language || 'javascript'}
                disabled={isLocked}
                onChange={(e) => !isLocked && onUpdateBlock(block.id, { language: e.target.value })}
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
              <button className="code-copy-btn" onClick={handleCopyCode} title="Copy code">
                {copiedCode ? (
                  <>
                    <Check size={13} className="text-green" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              ref={inputRef}
              className="block-code-editor"
              rows={Math.max(3, (block.code || '').split('\n').length)}
              value={block.code || ''}
              readOnly={isLocked}
              placeholder="// Write code here..."
              onChange={(e) => !isLocked && onUpdateBlock(block.id, { code: e.target.value })}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          </div>
        )}

        {/* Divider */}
        {block.type === 'divider' && <hr className="block-divider-line" />}

        {/* Database (Table, Kanban Board, Gallery Views) */}
        {block.type === 'table' && (
          <DatabaseBlock block={block} onUpdateBlock={onUpdateBlock} isLocked={isLocked} />
        )}

        {/* Multi-Column Layout (2 or 3 Columns) */}
        {block.type === 'column_list' && (
          <ColumnListBlock
            block={block}
            onUpdateBlock={(patch) => onUpdateBlock(block.id, patch)}
            onTriggerAI={onTriggerAI}
            isLocked={isLocked}
          />
        )}

        {/* Link to Page Block */}
        {block.type === 'link_to_page' && (
          <div
            className="block-link-page-card"
            onClick={() => {
              if (block.targetPageId && onNavigatePage) {
                onNavigatePage(block.targetPageId);
              } else if (!isLocked) {
                setShowMentionMenu(true);
              }
            }}
          >
            <span className="link-page-icon">{block.targetIcon || '📄'}</span>
            <div className="link-page-info">
              <span className="link-page-title">
                {block.targetTitle || block.text || 'Select a page to link...'}
              </span>
              <span className="link-page-subtitle">Page link</span>
            </div>
            <ArrowUpRight size={14} className="link-page-arrow" />
          </div>
        )}

        {/* Image / WebP Media Block */}
        {block.type === 'image' && (
          <div className="block-image-container">
            {block.url && !imageLoadError ? (
              <div className="block-image-wrapper">
                <img
                  src={normalizeMediaUrl(block.url)}
                  alt={block.caption || block.text || 'Embedded media'}
                  className="block-image-element"
                  loading="lazy"
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
                <input
                  type="text"
                  className="block-image-caption-input"
                  value={block.caption || ''}
                  readOnly={isLocked}
                  disabled={isLocked}
                  placeholder="Tulis keterangan (caption)..."
                  onChange={(e) => !isLocked && onUpdateBlock(block.id, { caption: e.target.value })}
                />
              </div>
            ) : (
              <div className="image-fallback-card">
                <ImageIcon size={32} className="image-fallback-icon" />
                <div className="image-fallback-title">
                  {block.caption || 'Gambar / Media Animasi WebP'}
                </div>
                {block.url && (
                  <div className="image-fallback-url" title={block.url}>
                    {block.url}
                  </div>
                )}
                {!isLocked && (
                  <div className="image-fallback-actions">
                    <label className="image-fallback-btn primary">
                      <Plus size={13} />
                      <span>Pilih Gambar dari Komputer</span>
                      <input
                        type="file"
                        accept="image/*,video/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (le) => {
                              onUpdateBlock(block.id, {
                                url: le.target.result,
                                caption: block.caption || file.name
                              });
                              setImageLoadError(false);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      className="image-fallback-btn"
                      onClick={() => {
                        const newUrl = window.prompt('Masukkan URL atau path gambar baru:', block.url || '');
                        if (newUrl && newUrl.trim()) {
                          onUpdateBlock(block.id, { url: normalizeMediaUrl(newUrl.trim()) });
                          setImageLoadError(false);
                        }
                      }}
                    >
                      <span>Ganti URL</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Table of Contents Block */}
        {block.type === 'table_of_contents' && (
          <TableOfContentsBlock allBlocks={allBlocks} />
        )}

        {/* Web Bookmark Block */}
        {block.type === 'bookmark' && (
          <WebBookmarkBlock
            block={block}
            isLocked={isLocked}
            onUpdateBlock={(updates) => onUpdateBlock(block.id, updates)}
          />
        )}

        {/* Video & Responsive Embed Block */}
        {block.type === 'video' && (
          <VideoEmbedBlock
            block={block}
            isLocked={isLocked}
            onUpdateBlock={(updates) => onUpdateBlock(block.id, updates)}
          />
        )}

        {/* Math Equation Block */}
        {block.type === 'math' && (
          <MathEquationBlock
            block={block}
            isLocked={isLocked}
            onUpdateBlock={(updates) => onUpdateBlock(block.id, updates)}
          />
        )}

        {/* Breadcrumb Block */}
        {block.type === 'breadcrumb' && (
          <BreadcrumbBlock
            currentPage={currentPage}
            allPages={allPages}
            onNavigatePage={onNavigatePage}
          />
        )}

        {/* Slash Command Popover */}
        {!isLocked && showSlashMenu && (
          <SlashMenu
            filterText={slashFilter}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlashMenu(false)}
          />
        )}

        {/* Mention / Page Autocomplete Popover */}
        {showMentionMenu && (
          <MentionMenu
            filterText={mentionQuery}
            pages={allPages}
            currentPageId={currentPage?.id}
            onSelectPage={handleSelectMentionPage}
            onClose={() => setShowMentionMenu(false)}
          />
        )}

        {/* Inline Comment Creation Pill matching Screenshot 3 */}
        {showInlineCommentPill && (
          <NotionInlineCommentPill
            placeholder="comment on"
            onSubmit={handlePostInlineComment}
            onCancel={() => setShowInlineCommentPill(false)}
          />
        )}

        {/* Right Margin Floating Comment Card matching Screenshot 4 */}
        {activeBlockComments.length > 0 && currentPage?.id && (
          <NotionMarginCommentCard
            comment={activeBlockComments[0]}
            onResolve={handleResolveComment}
            onDelete={handleDeleteComment}
            onAddReply={handleAddReply}
            currentUser={getCurrentUser()}
          />
        )}

        {/* Right side hover actions & comments badge (Notion REA layout) */}
        <div className={`block-right-actions ${blockCommentsCount > 0 ? 'has-comments' : ''}`}>
          {blockCommentsCount > 0 ? (
            <button
              className="block-comments-badge"
              onClick={() => setShowCommentPopover(true)}
              title={`${blockCommentsCount} komentar pada blok ini`}
            >
              <MessageSquare size={11} className="text-accent" />
              <span>{blockCommentsCount}</span>
            </button>
          ) : (
            !isLocked && (
              <button
                className="block-hover-comment-btn"
                onClick={() => setShowInlineCommentPill(!showInlineCommentPill)}
                title="Add comment on this block"
              >
                <MessageSquare size={12} />
              </button>
            )
          )}
        </div>

        {/* Full Block Comment Popover Modal */}
        {showCommentPopover && (
          <BlockCommentPopover
            pageId={currentPage?.id}
            blockId={block.id}
            blockText={block.text || block.code || block.caption || block.content || ''}
            isOpen={showCommentPopover}
            onClose={() => setShowCommentPopover(false)}
            onCommentChange={refreshBlockComments}
          />
        )}
      </div>
    </div>
  );
};
