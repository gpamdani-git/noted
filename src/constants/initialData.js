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
        text: 'Code blocks with a language selector and one-click copy'
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
