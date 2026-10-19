import React, { useState, useMemo } from 'react';
import {
  Plus,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ChevronRight,
  Quote,
  Lightbulb,
  Minus,
  Table,
  Sigma,
  Bookmark,
  Image,
  Video,
  Code,
  Code2,
  Palette,
  Type,
  MoreHorizontal,
  MessageSquare,
  Undo2,
  Redo2,
  Sparkles,
  X,
  Search,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import './MobileEditorToolbar.css';

const BLOCK_PICKER_ITEMS = [
  {
    type: 'paragraph',
    label: 'Text',
    desc: 'Just start writing with plain text.',
    icon: Type,
    keywords: 'text plain paragraph p tulisan teks biasa'
  },
  {
    type: 'heading_1',
    label: 'Heading 1',
    desc: 'Big section heading.',
    icon: Heading1,
    keywords: 'heading1 h1 title big large header judul besar'
  },
  {
    type: 'heading_2',
    label: 'Heading 2',
    desc: 'Medium section heading.',
    icon: Heading2,
    keywords: 'heading2 h2 subheader medium judul sedang'
  },
  {
    type: 'heading_3',
    label: 'Heading 3',
    desc: 'Small section heading.',
    icon: Heading3,
    keywords: 'heading3 h3 subheader small judul kecil'
  },
  {
    type: 'to_do',
    label: 'To-do list',
    desc: 'Track tasks with a to-do list.',
    icon: CheckSquare,
    keywords: 'todo to-do task check checkbox daftar centang'
  },
  {
    type: 'bulleted_list_item',
    label: 'Bulleted list',
    desc: 'Create a simple bulleted list.',
    icon: List,
    keywords: 'bullet bulleted unordered list poin daftar'
  },
  {
    type: 'numbered_list_item',
    label: 'Numbered list',
    desc: 'Create a list with numbering.',
    icon: ListOrdered,
    keywords: 'number numbered ordered list urutan angka 123'
  },
  {
    type: 'toggle',
    label: 'Toggle list',
    desc: 'Toggles can hide and show content.',
    icon: ChevronRight,
    keywords: 'toggle accordion collapsible lipat sembunyi'
  },
  {
    type: 'code',
    label: 'Code',
    desc: 'Capture a code snippet.',
    icon: Code2,
    keywords: 'code pre snippet syntax program koding'
  },
  {
    type: 'quote',
    label: 'Quote',
    desc: 'Capture a quote.',
    icon: Quote,
    keywords: 'quote kutipan blockquote'
  },
  {
    type: 'callout',
    label: 'Callout',
    desc: 'Make writing stand out.',
    icon: Lightbulb,
    keywords: 'callout alert note tip info catatan'
  },
  {
    type: 'divider',
    label: 'Divider',
    desc: 'Visually divide blocks.',
    icon: Minus,
    keywords: 'divider line separator garis pemisah hr rule'
  },
  {
    type: 'table',
    label: 'Table',
    desc: 'Simple tabular data & grid.',
    icon: Table,
    keywords: 'table grid columns rows tabel data'
  },
  {
    type: 'math',
    label: 'Math equation',
    desc: 'Display mathematical TeX equation.',
    icon: Sigma,
    keywords: 'math latex tex equation formula rumus matematika'
  },
  {
    type: 'bookmark',
    label: 'Web bookmark',
    desc: 'Save a link with visual preview card.',
    icon: Bookmark,
    keywords: 'bookmark web link url tautan kartu pratinjau'
  },
  {
    type: 'image',
    label: 'Image',
    desc: 'Upload or embed with a link.',
    icon: Image,
    keywords: 'image picture photo foto gambar upload'
  },
  {
    type: 'video',
    label: 'Video',
    desc: 'Embed YouTube or HTML5 video.',
    icon: Video,
    keywords: 'video youtube media klip player'
  }
];

const TEXT_COLORS = [
  { name: 'Default', value: 'default', color: 'inherit' },
  { name: 'Gray', value: '#787774', color: '#787774' },
  { name: 'Brown', value: '#9f6b53', color: '#9f6b53' },
  { name: 'Orange', value: '#d9730d', color: '#d9730d' },
  { name: 'Yellow', value: '#cb912f', color: '#cb912f' },
  { name: 'Green', value: '#448361', color: '#448361' },
  { name: 'Blue', value: '#337ea9', color: '#337ea9' },
  { name: 'Purple', value: '#9065b0', color: '#9065b0' },
  { name: 'Pink', value: '#c14c8a', color: '#c14c8a' },
  { name: 'Red', value: '#d44c47', color: '#d44c47' }
];

const BG_COLORS = [
  { name: 'Default', value: 'default', bg: 'transparent' },
  { name: 'Gray', value: '#f1f1ef', bg: '#f1f1ef' },
  { name: 'Brown', value: '#f4eeee', bg: '#f4eeee' },
  { name: 'Orange', value: '#faebdd', bg: '#faebdd' },
  { name: 'Yellow', value: '#fbf3db', bg: '#fbf3db' },
  { name: 'Green', value: '#edf3ec', bg: '#edf3ec' },
  { name: 'Blue', value: '#e7f3f8', bg: '#e7f3f8' },
  { name: 'Purple', value: '#f4f0f7', bg: '#f4f0f7' },
  { name: 'Pink', value: '#faf1f5', bg: '#faf1f5' },
  { name: 'Red', value: '#fdebec', bg: '#fdebec' }
];

export const MobileEditorToolbar = ({
  onInsertBlock,
  onFormatText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenAI,
  onOpenComments,
  isLocked,
  onDuplicateBlock,
  onDeleteBlock,
  onMoveBlock
}) => {
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showBlockOptions, setShowBlockOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLocked) return null;

  // Open Block Picker sheet: blur active inputs to dismiss soft keyboard smoothly
  const handleOpenBlockPicker = () => {
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    setSearchQuery('');
    setShowColorPicker(false);
    setShowBlockPicker(true);
  };

  const handleSelectBlock = (type) => {
    if (onInsertBlock) {
      onInsertBlock(type, { forceInsert: false });
    }
    setShowBlockPicker(false);
    setSearchQuery('');
  };

  const handleSelectColor = (colorVal) => {
    if (onFormatText) {
      onFormatText('color', colorVal);
    }
    setShowColorPicker(false);
  };

  // Filter blocks by search query
  const filteredBlocks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BLOCK_PICKER_ITEMS;
    return BLOCK_PICKER_ITEMS.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <>
      {/* Mobile Block Picker Bottom Sheet */}
      {showBlockPicker && (
        <>
          <div
            className="mobile-block-picker-backdrop"
            onClick={() => {
              setShowBlockPicker(false);
              setSearchQuery('');
            }}
          />
          <div className="mobile-block-picker-sheet animate-popover">
            <div className="mobile-sheet-drag-pill" />
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">Insert Block</span>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={() => {
                  setShowBlockPicker(false);
                  setSearchQuery('');
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div className="mobile-sheet-search-wrap">
              <Search size={15} className="mobile-sheet-search-icon" />
              <input
                type="text"
                className="mobile-sheet-search-input"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-sheet-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Block Items List */}
            <div className="mobile-block-picker-list">
              {filteredBlocks.length > 0 ? (
                filteredBlocks.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.type}
                      className="mobile-block-picker-row"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectBlock(item.type)}
                    >
                      <div className="mobile-block-picker-icon">
                        <IconComponent size={18} />
                      </div>
                      <div className="mobile-block-picker-info">
                        <div className="mobile-block-picker-label">{item.label}</div>
                        <div className="mobile-block-picker-desc">{item.desc}</div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="mobile-block-picker-empty">
                  No matching blocks found for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Block Options Bottom Sheet */}
      {showBlockOptions && (
        <>
          <div
            className="mobile-block-picker-backdrop"
            onClick={() => setShowBlockOptions(false)}
          />
          <div className="mobile-block-picker-sheet animate-popover">
            <div className="mobile-sheet-drag-pill" />
            <div className="mobile-sheet-header">
              <span className="mobile-sheet-title">Block Options</span>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={() => setShowBlockOptions(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mobile-block-actions-list">
              {onDuplicateBlock && (
                <button
                  type="button"
                  className="mobile-block-action-btn"
                  onClick={() => {
                    onDuplicateBlock();
                    setShowBlockOptions(false);
                  }}
                >
                  <CopyPlus size={16} />
                  <span>Duplicate Block</span>
                </button>
              )}
              {onMoveBlock && (
                <>
                  <button
                    type="button"
                    className="mobile-block-action-btn"
                    onClick={() => {
                      onMoveBlock('up');
                      setShowBlockOptions(false);
                    }}
                  >
                    <ArrowUp size={16} />
                    <span>Move Up</span>
                  </button>
                  <button
                    type="button"
                    className="mobile-block-action-btn"
                    onClick={() => {
                      onMoveBlock('down');
                      setShowBlockOptions(false);
                    }}
                  >
                    <ArrowDown size={16} />
                    <span>Move Down</span>
                  </button>
                </>
              )}
              {onDeleteBlock && (
                <button
                  type="button"
                  className="mobile-block-action-btn delete-action"
                  onClick={() => {
                    onDeleteBlock();
                    setShowBlockOptions(false);
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Block</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Text / Highlight Color Picker Popover */}
      {showColorPicker && (
        <>
          <div
            className="mobile-color-popover-backdrop"
            onClick={() => setShowColorPicker(false)}
          />
          <div className="mobile-color-popover animate-popover">
            <div className="mobile-color-section-title">Text Color</div>
            <div className="mobile-color-grid">
              {TEXT_COLORS.map((c) => (
                <button
                  type="button"
                  key={`text-${c.name}`}
                  className="mobile-color-swatch-btn"
                  title={c.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectColor(c.value)}
                >
                  <span className="mobile-color-swatch-letter" style={{ color: c.color }}>
                    A
                  </span>
                </button>
              ))}
            </div>
            <div className="mobile-color-section-title" style={{ marginTop: '8px' }}>
              Highlight
            </div>
            <div className="mobile-color-grid">
              {BG_COLORS.map((c) => (
                <button
                  type="button"
                  key={`bg-${c.name}`}
                  className="mobile-color-swatch-btn"
                  title={`${c.name} background`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectColor(c.value)}
                >
                  <span
                    className="mobile-color-swatch-bg"
                    style={{
                      backgroundColor: c.bg,
                      border: c.value === 'default' ? '1px dashed var(--border-color, #ccc)' : 'none'
                    }}
                  >
                    A
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Persistent Accessory Bar */}
      <div className="mobile-editor-toolbar" onMouseDown={(e) => e.preventDefault()}>
        <div className="mobile-toolbar-scroll">
          {/* 1. Insert Block Trigger (Opens Sheet) */}
          <button
            type="button"
            className="mobile-tool-btn tool-primary"
            onClick={handleOpenBlockPicker}
            title="Insert Block"
          >
            <Plus size={18} />
          </button>

          {/* 2. Block Options Trigger */}
          {(onDuplicateBlock || onDeleteBlock) && (
            <button
              type="button"
              className="mobile-tool-btn"
              onClick={() => {
                setShowColorPicker(false);
                setShowBlockOptions(true);
              }}
              title="Block Options"
            >
              <MoreHorizontal size={17} />
            </button>
          )}

          <div className="mobile-tool-divider" />

          {/* 3. Text Formatting Group */}
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onFormatText && onFormatText('bold')}
            title="Bold (**text**)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onFormatText && onFormatText('italic')}
            title="Italic (*text*)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onFormatText && onFormatText('underline')}
            title="Underline (<u>text</u>)"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onFormatText && onFormatText('strikethrough')}
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onFormatText && onFormatText('code')}
            title="Inline Code (`code`)"
          >
            <Code size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => {
              setShowBlockPicker(false);
              setShowBlockOptions(false);
              setShowColorPicker((prev) => !prev);
            }}
            title="Color / Highlight"
          >
            <Palette size={16} />
          </button>

          <div className="mobile-tool-divider" />

          {/* 4. Complete Markdown Blocks (Notion REA Fidelity) */}
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('heading_1')}
            title="Heading 1 (#)"
          >
            <Heading1 size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('heading_2')}
            title="Heading 2 (##)"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('heading_3')}
            title="Heading 3 (###)"
          >
            <Heading3 size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('to_do')}
            title="To-do list ([ ])"
          >
            <CheckSquare size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('bulleted_list_item')}
            title="Bulleted list (*)"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('numbered_list_item')}
            title="Numbered list (1.)"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('toggle')}
            title="Toggle list (>)"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('quote')}
            title="Quote (>)"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('code')}
            title="Code Block (```)"
          >
            <Code2 size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('callout')}
            title="Callout (💡)"
          >
            <Lightbulb size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('divider')}
            title="Divider (---)"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('table')}
            title="Table"
          >
            <Table size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('math')}
            title="Math equation ($$)"
          >
            <Sigma size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('bookmark')}
            title="Web Bookmark"
          >
            <Bookmark size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('image')}
            title="Image"
          >
            <Image size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={() => onInsertBlock && onInsertBlock('video')}
            title="Video"
          >
            <Video size={16} />
          </button>

          <div className="mobile-tool-divider" />

          {/* 5. Comments, History & AI Assistant */}
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={onOpenComments}
            title="Comments"
          >
            <MessageSquare size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            className="mobile-tool-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>

          <div className="mobile-tool-divider" />

          <button
            type="button"
            className="mobile-tool-btn tool-ai"
            onClick={onOpenAI}
            title="Ask AI"
          >
            <Sparkles size={16} className="text-ai-purple" />
          </button>
        </div>
      </div>
    </>
  );
};
