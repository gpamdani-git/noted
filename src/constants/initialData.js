// Initial seed workspace data for noted

export const INITIAL_PAGES = [
  {
    id: 'page-welcome',
    title: 'Welcome to noted',
    icon: '👋',
    cover: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    parentId: null,
    isFavorite: true,
    isLocked: false,
    fullWidth: false,
    fontFamily: 'sans', // 'sans' | 'serif' | 'mono'
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    blocks: [
      {
        id: 'b-bc-welcome',
        type: 'breadcrumb'
      },
      {
        id: 'b-callout-1',
        type: 'callout',
        text: 'Welcome to noted — a modern, elegant, offline-capable workspace inspired by Notion. Write notes, manage tasks, organize knowledge, and run your projects seamlessly.',
        icon: '💡',
        color: 'blue'
      },
      {
        id: 'b-h1-1',
        type: 'heading_1',
        text: 'Quick Start Guide'
      },
      {
        id: 'b-p-1',
        type: 'paragraph',
        text: 'This editor works just like your favorite block editor. Every paragraph, heading, list item, or code snippet is an interactive block.'
      },
      {
        id: 'b-todo-1',
        type: 'to_do',
        text: 'Press "/" anywhere to open the command palette and convert or insert blocks',
        checked: true
      },
      {
        id: 'b-todo-2',
        type: 'to_do',
        text: 'Click the "+" button or press Enter to add a new block',
        checked: true
      },
      {
        id: 'b-todo-3',
        type: 'to_do',
        text: 'Highlight any text to format it with bold, italic, code, or colors',
        checked: false
      },
      {
        id: 'b-todo-4',
        type: 'to_do',
        text: 'Press Cmd+K (or Ctrl+K) to quick search across all your workspace notes',
        checked: false
      },
      {
        id: 'b-divider-1',
        type: 'divider',
        text: ''
      },
      {
        id: 'b-h2-1',
        type: 'heading_2',
        text: 'Supported Block Types'
      },
      {
        id: 'b-bullet-1',
        type: 'bulleted_list_item',
        text: 'Headings (H1, H2, H3) for clean hierarchical structure'
      },
      {
        id: 'b-bullet-2',
        type: 'bulleted_list_item',
        text: 'Checklists (To-do) with instant completion strike-through'
      },
      {
        id: 'b-bullet-3',
        type: 'bulleted_list_item',
        text: 'Numbered lists for sequential step-by-step guides'
      },
      {
        id: 'b-bullet-4',
        type: 'bulleted_list_item',
        text: 'Collapsible toggle lists to keep large notes tidy'
      },
      {
        id: 'b-bullet-5',
        type: 'bulleted_list_item',
        text: 'Syntax-highlighted code blocks with one-click copy'
      },
      {
        id: 'b-bullet-6',
        type: 'bulleted_list_item',
        text: 'Data tables with customizable columns and dynamic rows'
      },
      {
        id: 'b-toggle-1',
        type: 'toggle',
        text: 'Click here to expand tips and keyboard shortcuts',
        isOpen: false,
        subtext: '• Cmd+K / Ctrl+K: Quick Search\n• "/" in an empty line: Slash Command Menu\n• Enter: New line or block\n• Backspace on empty block: Delete block or turn to paragraph'
      },
      {
        id: 'b-quote-1',
        type: 'quote',
        text: 'Simplicity is the ultimate sophistication. Organize your mind, one block at a time.'
      },
      {
        id: 'b-code-1',
        type: 'code',
        language: 'javascript',
        code: '// Example: Custom note processor in noted\nconst page = {\n  title: "Welcome to noted",\n  offlineSync: true,\n  blocks: ["heading", "todo", "code", "table"]\n};\n\nconsole.log(`Loaded ${page.title} with local persistence.`);'
      },
      {
        id: 'b-h2-links',
        type: 'heading_2',
        text: 'Connected Notes & Bidirectional Backlinks'
      },
      {
        id: 'b-p-links',
        type: 'paragraph',
        text: 'Link any page with [[ or @ to establish a bidirectional network: [[page:page-roadmap|Product Roadmap 2026]]'
      },
      {
        id: 'b-link-page-1',
        type: 'link_to_page',
        targetPageId: 'page-roadmap',
        targetTitle: 'Product Roadmap 2026',
        targetIcon: '🚀',
        text: 'Product Roadmap 2026'
      },
      {
        id: 'b-h2-advanced',
        type: 'heading_2',
        text: 'Advanced Media & Mathematical Blocks'
      },
      {
        id: 'b-bm-1',
        type: 'bookmark',
        url: 'https://github.com',
        title: 'GitHub: Where the world builds software',
        description: 'GitHub is where over 100 million developers shape the future of software, together.',
        domain: 'github.com',
        caption: 'Interactive bookmark with auto-extracted metadata and favicon'
      },
      {
        id: 'b-math-1',
        type: 'math',
        content: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}'
      },
      {
        id: 'b-vid-1',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'Responsive 16:9 YouTube video player with floating actions'
      }
    ]
  },
  {
    id: 'page-projects',
    title: 'Projects',
    icon: '🔍',
    subtitle: 'Manage and execute projects from start to finish.',
    cover: null,
    parentId: null,
    isFavorite: false,
    isLocked: false,
    fullWidth: true,
    fontFamily: 'sans',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now(),
    blocks: [
      {
        id: 'proj-desc-1',
        type: 'paragraph',
        text: 'Manage and execute projects from start to finish.'
      },
      {
        id: 'proj-db-1',
        type: 'table',
        viewType: 'table',
        headers: ['Project name', 'Assignee', 'Status', 'Start date', 'End date'],
        columnTypes: ['text', 'text', 'status', 'date', 'date'],
        rows: [
          ['Quarterly sales planning', '', 'Not started', '2025-03-24', '2025-03-28'],
          ['Revamp new hire onboarding', '', 'Done', '2025-01-20', '2025-02-04'],
          ['Public launch of iOS app', '', 'In progress', '2025-04-09', '2025-04-30']
        ]
      }
    ]
  },
  {
    id: 'page-notes',
    title: 'Notes',
    icon: '📁',
    cover: null,
    parentId: null,
    isFavorite: false,
    isLocked: false,
    fullWidth: false,
    fontFamily: 'sans',
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now(),
    blocks: [
      {
        id: 'notes-p-1',
        type: 'paragraph',
        text: 'Quick notes, meeting reminders, and bookmarks.'
      }
    ]
  },
  {
    id: 'page-meetings',
    title: 'Meetings | All meetings',
    icon: '📅',
    cover: null,
    parentId: null,
    isFavorite: false,
    isLocked: false,
    fullWidth: false,
    fontFamily: 'sans',
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now(),
    blocks: [
      {
        id: 'meet-p-1',
        type: 'paragraph',
        text: 'Weekly sprint planning, team retrospectives, and 1:1 check-ins.'
      }
    ]
  },
  {
    id: 'page-roadmap',
    title: 'Product Roadmap 2026',
    icon: '🚀',
    cover: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    parentId: null,
    isFavorite: true,
    isLocked: false,
    fullWidth: true,
    fontFamily: 'sans',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 7200000,
    blocks: [
      {
        id: 'b-rm-callout',
        type: 'callout',
        text: 'This quarterly roadmap tracks high-priority features, milestones, and architectural initiatives for the year.',
        icon: '🎯',
        color: 'orange'
      },
      {
        id: 'b-rm-h2-1',
        type: 'heading_2',
        text: 'Q1 - Q2 Key Deliverables'
      },
      {
        id: 'b-rm-table-1',
        type: 'table',
        viewType: 'board',
        groupByCol: 3,
        headers: ['Feature', 'Category', 'Owner', 'Status', 'Quarter'],
        rows: [
          ['Block-based Editor Core', 'Editor', 'Dani', 'Completed', 'Q1'],
          ['Slash Commands & Bubble Menu', 'UX', 'Dani', 'Completed', 'Q1'],
          ['Offline Cache & Auto-save', 'Infrastructure', 'Platform', 'Completed', 'Q1'],
          ['Markdown Export & Import', 'Interoperability', 'Platform', 'Completed', 'Q1'],
          ['Realtime Collaborative Sync', 'Network', 'Team', 'In Progress', 'Q2'],
          ['Database Board & Kanban Views', 'Database', 'Design', 'Planned', 'Q2'],
          ['End-to-End Encryption', 'Security', 'Security', 'Planned', 'Q3']
        ]
      },
      {
        id: 'b-rm-h2-2',
        type: 'heading_2',
        text: 'Sprint Priorities'
      },
      {
        id: 'b-rm-todo-1',
        type: 'to_do',
        text: 'Finalize keyboard navigation for slash command popup',
        checked: true
      },
      {
        id: 'b-rm-todo-2',
        type: 'to_do',
        text: 'Support custom table column additions and cell editing',
        checked: true
      },
      {
        id: 'b-rm-todo-3',
        type: 'to_do',
        text: 'Conduct performance benchmarks with 1,000+ blocks',
        checked: false
      }
    ]
  },
  {
    id: 'page-meeting',
    title: 'Weekly Engineering Sync',
    icon: '☕',
    cover: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    parentId: null,
    isFavorite: false,
    isLocked: false,
    fullWidth: false,
    fontFamily: 'mono',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 14400000,
    blocks: [
      {
        id: 'b-ms-callout',
        type: 'callout',
        text: 'Weekly architecture alignment meeting. Focus: Electron bundle optimization, reverse-engineered patterns, and offline database caching.',
        icon: '📌',
        color: 'green'
      },
      {
        id: 'b-ms-h1',
        type: 'heading_1',
        text: 'Agenda & Discussion'
      },
      {
        id: 'b-ms-num-1',
        type: 'numbered_list_item',
        text: 'Review Notion 7.39.0 package findings (Electron architecture, SQLite tables, MCP worker)'
      },
      {
        id: 'b-ms-num-2',
        type: 'numbered_list_item',
        text: 'Refactor local block tree store to guarantee sub-millisecond input latency'
      },
      {
        id: 'b-ms-num-3',
        type: 'numbered_list_item',
        text: 'Demonstrate responsive sidebar and dark/light color palette'
      },
      {
        id: 'b-ms-h2',
        type: 'heading_2',
        text: 'Action Items'
      },
      {
        id: 'b-ms-todo-1',
        type: 'to_do',
        text: 'Document REA findings and DMG analysis in report',
        checked: true
      },
      {
        id: 'b-ms-todo-2',
        type: 'to_do',
        text: 'Deploy noted local preview and verify all block interactions',
        checked: false
      }
    ]
  },
  {
    id: 'page-reading',
    title: 'Reading & Knowledge Base',
    icon: '📚',
    cover: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    parentId: null,
    isFavorite: false,
    isLocked: false,
    fullWidth: false,
    fontFamily: 'serif',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
    blocks: [
      {
        id: 'b-read-callout',
        type: 'callout',
        text: 'Books, essays, and technical literature currently being read or cataloged for reference.',
        icon: '📖',
        color: 'purple'
      },
      {
        id: 'b-read-table',
        type: 'table',
        headers: ['Title', 'Author', 'Topic', 'Rating', 'Status'],
        rows: [
          ['Designing Data-Intensive Applications', 'Martin Kleppmann', 'Distributed Systems', '⭐⭐⭐⭐⭐', 'Finished'],
          ['Building Micro-Frontends', 'Luca Mezzalira', 'Architecture', '⭐⭐⭐⭐', 'Reading'],
          ['Refactoring UI', 'Adam Wathan & Steve Schoger', 'Product Design', '⭐⭐⭐⭐⭐', 'Finished'],
          ['Structure and Interpretation of Computer Programs', 'Abelson & Sussman', 'Computer Science', '⭐⭐⭐⭐⭐', 'Reference']
        ]
      },
      {
        id: 'b-read-quote',
        type: 'quote',
        text: 'Reading furnish the mind only with materials of knowledge; it is thinking that makes what we read ours. — John Locke'
      }
    ]
  }
];

export const SLASH_COMMANDS = [
  {
    id: 'ai',
    type: 'ai_assistant',
    title: 'Ask Hudbird AI',
    description: 'Draft, summarize, brainstorm, or extract tasks.',
    icon: 'Sparkles',
    keywords: ['ai', 'hudbird', 'ask', 'generate', 'write', 'summarize', 'mcp', 'assistant']
  },
  {
    id: 'text',
    type: 'paragraph',
    title: 'Text',
    description: 'Just start writing with plain text.',
    icon: 'Type',
    keywords: ['text', 'paragraph', 'plain']
  },
  {
    id: 'h1',
    type: 'heading_1',
    title: 'Heading 1',
    description: 'Big section heading.',
    icon: 'Heading1',
    keywords: ['h1', 'header', 'heading', 'title', 'big']
  },
  {
    id: 'h2',
    type: 'heading_2',
    title: 'Heading 2',
    description: 'Medium section heading.',
    icon: 'Heading2',
    keywords: ['h2', 'header', 'heading', 'subtitle', 'medium']
  },
  {
    id: 'h3',
    type: 'heading_3',
    title: 'Heading 3',
    description: 'Small section heading.',
    icon: 'Heading3',
    keywords: ['h3', 'header', 'heading', 'small']
  },
  {
    id: 'todo',
    type: 'to_do',
    title: 'To-do list',
    description: 'Track tasks with a to-do list.',
    icon: 'CheckSquare',
    keywords: ['todo', 'task', 'check', 'checkbox', 'list']
  },
  {
    id: 'bullet',
    type: 'bulleted_list_item',
    title: 'Bulleted list',
    description: 'Create a simple bulleted list.',
    icon: 'List',
    keywords: ['bullet', 'list', 'unordered']
  },
  {
    id: 'numbered',
    type: 'numbered_list_item',
    title: 'Numbered list',
    description: 'Create a list with numbering.',
    icon: 'ListOrdered',
    keywords: ['number', 'ordered', 'list', '123']
  },
  {
    id: 'toggle',
    type: 'toggle',
    title: 'Toggle list',
    description: 'Toggles hide and show content inside.',
    icon: 'ChevronRight',
    keywords: ['toggle', 'accordion', 'collapse', 'details']
  },
  {
    id: 'code',
    type: 'code',
    title: 'Code',
    description: 'Capture a code snippet with syntax highlighting.',
    icon: 'Code',
    keywords: ['code', 'snippet', 'javascript', 'python', 'pre']
  },
  {
    id: 'quote',
    type: 'quote',
    title: 'Quote',
    description: 'Capture a quote or highlight phrase.',
    icon: 'Quote',
    keywords: ['quote', 'cite', 'blockquote']
  },
  {
    id: 'callout',
    type: 'callout',
    title: 'Callout',
    description: 'Make writing stand out with an icon & colored box.',
    icon: 'Info',
    keywords: ['callout', 'box', 'alert', 'info', 'highlight']
  },
  {
    id: 'divider',
    type: 'divider',
    title: 'Divider',
    description: 'Visually divide blocks with a line.',
    icon: 'Minus',
    keywords: ['divider', 'hr', 'line', 'separator']
  },
  {
    id: 'table',
    type: 'table',
    title: 'Table',
    description: 'Simple data table with rows and columns.',
    icon: 'Table',
    keywords: ['table', 'database', 'grid', 'spreadsheet']
  },
  {
    id: 'board',
    type: 'board',
    title: 'Board',
    description: 'Kanban board grouped by status or property.',
    icon: 'Kanban',
    keywords: ['board', 'kanban', 'card', 'status', 'project']
  },
  {
    id: 'gallery',
    type: 'gallery',
    title: 'Gallery',
    description: 'Visual grid of cards with cover gradients.',
    icon: 'LayoutGrid',
    keywords: ['gallery', 'grid', 'cards', 'visual']
  },
  {
    id: 'column_2',
    type: 'column_list_2',
    title: '2 Columns',
    description: 'Create 2 side-by-side columns.',
    icon: 'Columns2',
    keywords: ['2col', '2columns', 'column', 'columns', 'split', 'grid', 'side']
  },
  {
    id: 'column_3',
    type: 'column_list_3',
    title: '3 Columns',
    description: 'Create 3 side-by-side columns.',
    icon: 'Columns3',
    keywords: ['3col', '3columns', 'column', 'columns', 'split', 'grid', 'side']
  },
  {
    id: 'link_to_page',
    type: 'link_to_page',
    title: 'Link to page',
    description: 'Link to an existing internal page or note.',
    icon: 'Link2',
    keywords: ['link', 'page', 'mention', 'internal', 'backlink', 'connect', '[[', '@']
  },
  {
    id: 'image',
    type: 'image',
    title: 'Image',
    description: 'Embed image, GIF, or WebP animation.',
    icon: 'Image',
    keywords: ['image', 'photo', 'picture', 'media', 'gif', 'webp', 'animation', 'embed']
  },
  {
    id: 'table_of_contents',
    type: 'table_of_contents',
    title: 'Table of contents',
    description: 'Daftar isi otomatis dari semua heading (H1, H2, H3).',
    icon: 'ListOrdered',
    keywords: ['toc', 'table of contents', 'daftar isi', 'index', 'heading', 'outline']
  },
  {
    id: 'bookmark',
    type: 'bookmark',
    title: 'Web Bookmark',
    description: 'Save a link as a visual Notion-style bookmark card.',
    icon: 'Bookmark',
    keywords: ['bookmark', 'link', 'url', 'web', 'card', 'preview', 'site']
  },
  {
    id: 'video',
    type: 'video',
    title: 'Video',
    description: 'Embed YouTube, Vimeo, or upload a video.',
    icon: 'Video',
    keywords: ['video', 'youtube', 'vimeo', 'embed', 'player', 'media', 'movie', 'mp4']
  },
  {
    id: 'math',
    type: 'math',
    title: 'Math equation',
    description: 'Display mathematical formulas and equations with LaTeX.',
    icon: 'Sigma',
    keywords: ['math', 'equation', 'latex', 'formula', 'algebra', 'calculus', '$$', 'sigma']
  },
  {
    id: 'breadcrumb',
    type: 'breadcrumb',
    title: 'Breadcrumb',
    description: 'Display hierarchical document path to current page.',
    icon: 'Navigation',
    keywords: ['breadcrumb', 'hierarchy', 'path', 'ancestor', 'parent', 'navigate', 'location']
  },
  {
    id: 'comment',
    type: 'comment',
    title: 'Comment / Discussion',
    description: 'Add a comment or start a discussion thread on this block.',
    icon: 'MessageSquare',
    keywords: ['comment', 'discuss', 'discussion', 'note', 'feedback', 'review', 'thread']
  }
];

