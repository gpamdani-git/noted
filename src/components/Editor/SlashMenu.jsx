import React, { useEffect, useState, useRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  CheckSquare,
  List,
  ListOrdered,
  ChevronRight,
  Code,
  Quote,
  Info,
  Minus,
  Table,
  Kanban,
  LayoutGrid,
  Sparkles,
  Columns2,
  Columns3,
  Link2,
  Image as ImageIcon,
  Bookmark,
  Video,
  Sigma,
  Navigation,
  MessageSquare
} from 'lucide-react';
import './SlashMenu.css';

const ICON_MAP = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  CheckSquare,
  List,
  ListOrdered,
  ChevronRight,
  Code,
  Quote,
  Info,
  Minus,
  Table,
  Kanban,
  LayoutGrid,
  Sparkles,
  Columns2,
  Columns3,
  Link2,
  Image: ImageIcon,
  Bookmark,
  Video,
  Sigma,
  Navigation,
  MessageSquare
};

// Extended commands list with shortcuts, categories, and preview data
const EXTENDED_COMMANDS = [
  {
    id: 'ai',
    type: 'ai_assistant',
    title: 'Ask AI Assistant',
    description: 'Draft, summarize, brainstorm, or improve writing.',
    category: 'suggested',
    icon: 'Sparkles',
    shortcut: 'Space',
    preview: {
      title: 'AI Connected Assistant',
      bullets: ['Summarize long documents', 'Fix spelling & grammar', 'Translate to English'],
      caption: 'Brainstorm and refine content with AI'
    },
    keywords: ['ai', 'ask', 'assistant', 'generate', 'write', 'summarize']
  },
  {
    id: 'text',
    type: 'paragraph',
    title: 'Text',
    description: 'Just start writing with plain text.',
    category: 'basic',
    icon: 'Type',
    shortcut: '',
    preview: {
      title: '',
      sampleText: 'Notion is a single space where you can think, write, and plan. Capture thoughts and manage projects effortlessly.',
      caption: 'Plain paragraph text'
    },
    keywords: ['text', 'paragraph', 'plain']
  },
  {
    id: 'h1',
    type: 'heading_1',
    title: 'Heading 1',
    description: 'Large section heading.',
    category: 'basic',
    icon: 'Heading1',
    shortcut: '#',
    preview: {
      title: 'Engineering Roadmap',
      bullets: ['Core Platform Architecture', 'Global Database Latency SLA'],
      caption: 'Large section heading'
    },
    keywords: ['h1', 'header', 'heading', 'title', 'big']
  },
  {
    id: 'h2',
    type: 'heading_2',
    title: 'Heading 2',
    description: 'Medium section heading.',
    category: 'basic',
    icon: 'Heading2',
    shortcut: '##',
    preview: {
      title: 'Our Values',
      bullets: ['Ownership', 'Altruism'],
      caption: 'Medium section heading'
    },
    keywords: ['h2', 'header', 'heading', 'subtitle', 'medium']
  },
  {
    id: 'h3',
    type: 'heading_3',
    title: 'Heading 3',
    description: 'Small section heading.',
    category: 'basic',
    icon: 'Heading3',
    shortcut: '###',
    preview: {
      title: 'Feature Breakdown',
      bullets: ['Data Persistence', 'Realtime Sync'],
      caption: 'Small section heading'
    },
    keywords: ['h3', 'header', 'heading', 'small']
  },
  {
    id: 'todo',
    type: 'to_do',
    title: 'To-do list',
    description: 'Track tasks with a to-do list.',
    category: 'basic',
    icon: 'CheckSquare',
    shortcut: '[]',
    preview: {
      isTodo: true,
      todos: [
        { checked: true, text: 'Review UI specs' },
        { checked: false, text: 'Validate dark mode fidelity' }
      ],
      caption: 'Track tasks with checkboxes'
    },
    keywords: ['todo', 'task', 'check', 'checkbox', 'list']
  },
  {
    id: 'bullet',
    type: 'bulleted_list_item',
    title: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    category: 'basic',
    icon: 'List',
    shortcut: '-',
    preview: {
      bullets: ['First bullet point', 'Second bullet point', 'Third key takeaway'],
      caption: 'Simple bulleted list'
    },
    keywords: ['bullet', 'list', 'unordered']
  },
  {
    id: 'numbered',
    type: 'numbered_list_item',
    title: 'Numbered list',
    description: 'Create a list with numbering.',
    category: 'basic',
    icon: 'ListOrdered',
    shortcut: '1.',
    preview: {
      numbers: ['Discovery & Requirements', 'Design & Prototyping', 'Production Delivery'],
      caption: 'Ordered list with numbering'
    },
    keywords: ['number', 'ordered', 'list', '123']
  },
  {
    id: 'toggle',
    type: 'toggle',
    title: 'Toggle list',
    description: 'Toggles can hide and show content inside.',
    category: 'basic',
    icon: 'ChevronRight',
    shortcut: '>',
    preview: {
      isToggle: true,
      title: 'More project details',
      caption: 'Expandable toggle section'
    },
    keywords: ['toggle', 'collapse', 'hide', 'show', 'expand']
  },
  {
    id: 'code',
    type: 'code',
    title: 'Code',
    description: 'Capture a code snippet.',
    category: 'basic',
    icon: 'Code',
    shortcut: '```',
    preview: {
      isCode: true,
      code: 'function renderApp() {\n  return <NotionCanvas />;\n}',
      caption: 'Code block with syntax highlighting'
    },
    keywords: ['code', 'snippet', 'javascript', 'python', 'html']
  },
  {
    id: 'quote',
    type: 'quote',
    title: 'Quote',
    description: 'Capture a quote.',
    category: 'basic',
    icon: 'Quote',
    shortcut: '|',
    preview: {
      isQuote: true,
      text: 'Simplicity is about subtracting the obvious and adding the meaningful.',
      caption: 'Stylized quote callout'
    },
    keywords: ['quote', 'cite', 'blockquote']
  },
  {
    id: 'callout',
    type: 'callout',
    title: 'Callout',
    description: 'Make writing stand out.',
    category: 'basic',
    icon: 'Info',
    shortcut: ':::',
    preview: {
      isCallout: true,
      emoji: '💡',
      text: 'Pro-tip: Type / to search all commands and blocks instantly.',
      caption: 'Highlighted callout box'
    },
    keywords: ['callout', 'box', 'highlight', 'info', 'note']
  },
  {
    id: 'table',
    type: 'table',
    title: 'Table',
    description: 'Add a simple tabular data grid.',
    category: 'basic',
    icon: 'Table',
    shortcut: '',
    preview: {
      isTable: true,
      headers: ['Task', 'Owner', 'Status'],
      rows: [
        ['Release candidate', 'Dani', 'Done'],
        ['Browser test suite', 'Team', 'In progress']
      ],
      caption: 'Tabular database grid'
    },
    keywords: ['table', 'grid', 'spreadsheet', 'data']
  },
  {
    id: 'divider',
    type: 'divider',
    title: 'Divider',
    description: 'Visually divide blocks with a horizontal line.',
    category: 'basic',
    icon: 'Minus',
    shortcut: '---',
    preview: {
      isDivider: true,
      caption: 'Horizontal divider line'
    },
    keywords: ['divider', 'line', 'hr', 'separator', 'border']
  },
  {
    id: 'board',
    type: 'board',
    title: 'Board',
    description: 'Group the rows by a column and move them as cards.',
    category: 'advanced',
    icon: 'Kanban',
    shortcut: '',
    preview: {
      title: 'Sprint board',
      bullets: ['Design system — In progress', 'Sync engine — Done'],
      caption: 'Kanban board grouped by a column'
    },
    keywords: ['board', 'kanban', 'card', 'group', 'sprint']
  },
  {
    id: 'gallery',
    type: 'gallery',
    title: 'Gallery',
    description: 'Show the rows as a grid of cards.',
    category: 'advanced',
    icon: 'LayoutGrid',
    shortcut: '',
    preview: {
      title: 'Gallery view',
      bullets: ['One card per row', 'Cover preview on top'],
      caption: 'Card grid layout'
    },
    keywords: ['gallery', 'grid', 'cards', 'cover']
  },
  {
    id: 'columns2',
    type: 'column_list_2',
    title: '2 columns',
    description: 'Place the blocks side by side in two columns.',
    category: 'advanced',
    icon: 'Columns2',
    shortcut: '',
    preview: {
      title: 'Two columns',
      bullets: ['Left column', 'Right column'],
      caption: 'Side by side columns'
    },
    keywords: ['column', 'columns', 'side', 'by side', 'layout']
  },
  {
    id: 'columns3',
    type: 'column_list_3',
    title: '3 columns',
    description: 'Place the blocks side by side in three columns.',
    category: 'advanced',
    icon: 'Columns3',
    shortcut: '',
    preview: {
      title: 'Three columns',
      bullets: ['First', 'Second', 'Third'],
      caption: 'Three equal columns'
    },
    keywords: ['column', 'columns', 'layout', 'three']
  },
  {
    id: 'link_to_page',
    type: 'link_to_page',
    title: 'Link to page',
    description: 'Reference another page in this workspace.',
    category: 'advanced',
    icon: 'Link2',
    shortcut: '[[',
    preview: {
      title: 'Link to a page',
      sampleText: 'Pick a page from the workspace to insert a link.',
      caption: 'Reference to another page'
    },
    keywords: ['link', 'page', 'reference', 'link to page']
  },
  {
    id: 'table_of_contents',
    type: 'table_of_contents',
    title: 'Table of contents',
    description: 'List the headings of this page.',
    category: 'advanced',
    icon: 'List',
    shortcut: '/toc',
    preview: {
      title: 'Table of contents',
      bullets: ['Overview', 'Architecture', 'Roadmap'],
      caption: 'Outline of the page headings'
    },
    keywords: ['toc', 'table of contents', 'outline', 'index']
  },
  {
    id: 'breadcrumb',
    type: 'breadcrumb',
    title: 'Breadcrumb',
    description: 'Show the position of this page in the hierarchy.',
    category: 'advanced',
    icon: 'Navigation',
    shortcut: '/breadcrumb',
    preview: {
      title: 'Workspace / Section / Page',
      caption: 'Position in the page tree'
    },
    keywords: ['breadcrumb', 'navigation', 'path', 'hierarchy']
  },
  {
    id: 'math',
    type: 'math',
    title: 'Equation',
    description: 'Write a formula that is rendered with KaTeX.',
    category: 'advanced',
    icon: 'Sigma',
    shortcut: '/math',
    preview: {
      title: 'E = mc²',
      sampleText: 'Block formulas are rendered with KaTeX.',
      caption: 'Rendered equation'
    },
    keywords: ['math', 'equation', 'formula', 'katex', 'latex']
  },
  {
    id: 'image',
    type: 'image',
    title: 'Image',
    description: 'Add a picture to the page.',
    category: 'media',
    icon: 'Image',
    shortcut: '',
    preview: {
      title: 'Image block',
      sampleText: 'Pick a file to embed it into the page.',
      caption: 'Embedded picture'
    },
    keywords: ['image', 'picture', 'photo', 'media', 'upload']
  },
  {
    id: 'bookmark',
    type: 'bookmark',
    title: 'Bookmark',
    description: 'Save a link with a preview of the page.',
    category: 'media',
    icon: 'Bookmark',
    shortcut: '/bookmark',
    preview: {
      title: 'Bookmark',
      sampleText: 'Paste a URL to preview the linked page.',
      caption: 'Link preview'
    },
    keywords: ['bookmark', 'link', 'url', 'preview', 'embed']
  },
  {
    id: 'video',
    type: 'video',
    title: 'Video',
    description: 'Embed a video from a URL.',
    category: 'media',
    icon: 'Video',
    shortcut: '/video',
    preview: {
      title: 'Video',
      sampleText: 'Paste a video URL to embed the player.',
      caption: 'Embedded video'
    },
    keywords: ['video', 'embed', 'youtube', 'player', 'media']
  },
  {
    id: 'comment',
    type: 'comment',
    title: 'Comment',
    description: 'Start a discussion on this block.',
    category: 'media',
    icon: 'MessageSquare',
    shortcut: '/comment',
    preview: {
      title: 'Discussion',
      sampleText: 'Comments are attached to the block and listed in the drawer.',
      caption: 'Block discussion'
    },
    keywords: ['comment', 'discussion', 'note', 'feedback']
  }
];

export const SlashMenu = ({ filterText, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const cleanFilter = (filterText || '').toLowerCase().trim();

  const filteredCommands = EXTENDED_COMMANDS.filter((cmd) => {
    if (!cleanFilter) return true;
    return (
      cmd.title.toLowerCase().includes(cleanFilter) ||
      cmd.description.toLowerCase().includes(cleanFilter) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(cleanFilter)) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(cleanFilter))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanFilter]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (menuRef.current) {
      const activeItem = menuRef.current.querySelector('.slash-item.active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const activeCommand = filteredCommands[selectedIndex];

  // Group items by category if not filtering, otherwise show flat list
  const suggestedCommands = filteredCommands.filter((c) => c.category === 'suggested');
  const basicCommands = filteredCommands.filter((c) => c.category === 'basic');
  const advancedCommands = filteredCommands.filter((c) => c.category === 'advanced');
  const mediaCommands = filteredCommands.filter((c) => c.category === 'media');

  const renderCommandItem = (cmd) => {
    const globalIdx = filteredCommands.findIndex((c) => c.id === cmd.id);
    const isSelected = globalIdx === selectedIndex;
    const IconComponent = ICON_MAP[cmd.icon] || Type;

    return (
      <div
        key={cmd.id}
        className={`slash-item ${isSelected ? 'active' : ''}`}
        onMouseEnter={() => setSelectedIndex(globalIdx)}
        onClick={() => onSelect(cmd.type)}
      >
        <div className="slash-item-icon-box">
          <IconComponent size={16} />
        </div>
        <div className="slash-item-text">
          <div className="slash-item-title-row">
            <span className="slash-item-title">{cmd.title}</span>
            {cmd.badge && <span className="slash-item-badge">{cmd.badge}</span>}
          </div>
          <div className="slash-item-desc">{cmd.description}</div>
        </div>
        {cmd.shortcut && (
          <span className="slash-item-shortcut">{cmd.shortcut}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="slash-menu-mobile-backdrop" onClick={onClose} />
      <div className="slash-menu-container" onClick={(e) => e.stopPropagation()}>
        {/* Main Slash Menu Popover */}
        <div className="slash-menu-popover animate-popover" ref={menuRef}>
        <div className="slash-menu-list">
          {!cleanFilter ? (
            <>
              {suggestedCommands.length > 0 && (
                <div className="slash-menu-section">
                  <div className="slash-menu-section-header">Suggested</div>
                  {suggestedCommands.map(renderCommandItem)}
                </div>
              )}
              {basicCommands.length > 0 && (
                <div className="slash-menu-section">
                  <div className="slash-menu-section-header">Basic blocks</div>
                  {basicCommands.map(renderCommandItem)}
                </div>
              )}
              {advancedCommands.length > 0 && (
                <div className="slash-menu-section">
                  <div className="slash-menu-section-header">Advanced</div>
                  {advancedCommands.map(renderCommandItem)}
                </div>
              )}
              {mediaCommands.length > 0 && (
                <div className="slash-menu-section">
                  <div className="slash-menu-section-header">Media and embeds</div>
                  {mediaCommands.map(renderCommandItem)}
                </div>
              )}
            </>
          ) : (
            filteredCommands.map(renderCommandItem)
          )}

          {filteredCommands.length === 0 && (
            <div className="slash-empty-state">No matching blocks found</div>
          )}
        </div>

        {/* Footer matching Notion Screenshot 2: Close menu esc */}
        <div className="slash-menu-footer">
          <span className="slash-footer-label">Close menu</span>
          <kbd className="slash-footer-kbd">esc</kbd>
        </div>
      </div>

      {/* Floating Hover Preview Card matching Notion Desktop Screenshot 2 */}
      {activeCommand && activeCommand.preview && (
        <div className="slash-hover-preview-card animate-fade-in">
          <div className="preview-canvas-sheet">
            {activeCommand.preview.isTodo ? (
              <div className="preview-todo-list">
                {activeCommand.preview.todos.map((t, i) => (
                  <div key={i} className="preview-todo-item">
                    <span className={`preview-checkbox ${t.checked ? 'checked' : ''}`}>
                      {t.checked ? '✓' : ''}
                    </span>
                    <span className={`preview-todo-text ${t.checked ? 'completed' : ''}`}>
                      {t.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : activeCommand.preview.isCode ? (
              <pre className="preview-code-block">
                <code>{activeCommand.preview.code}</code>
              </pre>
            ) : activeCommand.preview.isCallout ? (
              <div className="preview-callout-box">
                <span className="preview-callout-icon">{activeCommand.preview.emoji}</span>
                <span className="preview-callout-text">{activeCommand.preview.text}</span>
              </div>
            ) : activeCommand.preview.isQuote ? (
              <div className="preview-quote-box">
                <span className="preview-quote-bar" />
                <span className="preview-quote-text">{activeCommand.preview.text}</span>
              </div>
            ) : activeCommand.preview.isDivider ? (
              <div className="preview-divider-box" style={{ padding: '24px 0' }}>
                <hr style={{ border: 'none', borderTop: '1.5px solid var(--border-color, #e0e0e0)', margin: 0 }} />
              </div>
            ) : (
              <div className="preview-doc-sample">
                {activeCommand.preview.title && (
                  <div className={`preview-sample-title ${activeCommand.type}`}>
                    {activeCommand.preview.title}
                  </div>
                )}
                {activeCommand.preview.sampleText && (
                  <div className="preview-sample-paragraph">
                    {activeCommand.preview.sampleText}
                  </div>
                )}
                {activeCommand.preview.bullets && (
                  <ul className="preview-sample-bullets">
                    {activeCommand.preview.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {activeCommand.preview.numbers && (
                  <ol className="preview-sample-numbers">
                    {activeCommand.preview.numbers.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
          <div className="preview-caption">
            {activeCommand.preview.caption || activeCommand.description}
          </div>
        </div>
      )}
      </div>
    </>
  );
};
