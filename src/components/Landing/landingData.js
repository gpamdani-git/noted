/**
 * Complete Bilingual Content Dictionary for NotionLandingPage
 * Fully supports Bahasa Indonesia ('id') and English ('en')
 */

export const LANDING_CONTENT = {
  id: {
    nav: {
      product: 'Produk',
      download: 'Unduh',
      docs: 'Bantuan',
      login: 'Log in',
      startFree: 'Mulai Gratis',
      downloadApps: 'Unduh Aplikasi',
      getStartedFree: 'Mulai Gratis →',
      coreSystem: 'SISTEM UTAMA',
      docsWikisTitle: 'Dokumen & Wiki',
      docsWikisDesc: 'Edit teks hierarkis dengan markdown',
      databasesTitle: 'Database Terhubung',
      databasesDesc: 'Tabel, board, list, dan multi-properti',
      aiAgentsTitle: 'Asisten AI Otonom',
      aiAgentsDesc: 'Konteks cerdas dan alur kerja otomatis',
      downloads: 'UNDUHAN',
      desktopTitle: 'Aplikasi Desktop (Mac / Windows)',
      mobileTitle: 'Aplikasi Android & Mobile'
    },
    hero: {
      badge: 'Vault Offline Lokal + Sinkronisasi Cloud Real-time',
      rotatingWords: ['Menulis', 'Berpikir', 'Mengatur', 'Membangun'],
      titlePrefix: 'Ruang tenang untuk',
      titleSuffix: 'tanpa batas.',
      subtitle:
        'Noted adalah ruang kerja markdown bebas distraksi dengan vault offline instan, sinkronisasi cloud real-time ke PostgreSQL di Neon, dan asisten cerdas. Cepat, privat, dan selalu milik Anda.',
      startFree: 'Mulai Gratis',
      downloadApp: 'Unduh Aplikasi'
    },
    mockup: {
      tabTitle: 'Peta Jalan Produk & Arsitektur',
      vaultStatus: 'Vault IndexedDB · Tersinkron ke Neon',
      workspaceName: 'Workspace Noted',
      favoritesLabel: 'FAVORIT',
      roadmap: 'Peta Jalan Produk',
      architecture: 'Arsitektur Sistem',
      ideaSandbox: 'Ruang Eksplorasi Ide',
      knowledgeWiki: 'Wiki Pengetahuan',
      settingsCloud: 'Pengaturan & Cloud',
      tagVault: 'Vault: Lokal-Dulu',
      tagSync: 'Sync: PostgreSQL (Neon)',
      tagFormat: 'Format: Markdown Murni',
      calloutHeading: 'Arsitektur Lokal-Dulu:',
      calloutText:
        'Semua catatan tersimpan instan di perangkat Anda via IndexedDB dengan latensi 0ms. Saat terhubung internet, Noted otomatis menyinkronkan data ke PostgreSQL di Neon.',
      checklistTitle: 'Daftar Fitur Inti',
      checkedCount: 'Tercentang',
      tasks: [
        { id: 1, text: 'Tulis dengan slash commands (/) & pintasan markdown', completed: true },
        { id: 2, text: 'Simpan catatan aman di vault IndexedDB lokal', completed: true },
        { id: 3, text: 'Sinkronkan perubahan otomatis ke cloud Neon PostgreSQL', completed: true },
        { id: 4, text: 'Ekspor catatan ke format Markdown (.md) tanpa lock-in', completed: false }
      ],
      aiPrefix: 'Noted AI:',
      aiDrafting: 'Menyusun ringkasan rapi dari blok terpilih...',
      aiReady: 'Siap'
    },
    socialProof: {
      label: 'Tersedia di semua platform yang Anda gunakan',
      desktopTitle: 'Desktop App',
      desktopSub: 'macOS & Windows',
      mobileTitle: 'Mobile App',
      mobileSub: 'Android (APK)',
      webTitle: 'Web App',
      webSub: 'PWA & Browser',
      vaultTitle: 'Offline Vault',
      vaultSub: 'IndexedDB & SQLite'
    },
    bento: {
      badge: 'FITUR UNGGULAN',
      title: 'Dibangun untuk kecepatan, privasi, dan fokus.',
      desc: 'Semua yang Anda butuhkan untuk mencatat, berpikir, dan menyusun ide tanpa gangguan.',
      tabs: {
        sync: '1. Lokal-Dulu & Dual Sync',
        editor: '2. Editor Berbasis Blok',
        privacy: '3. Bebas Vendor Lock-in'
      },
      sync: {
        badge: 'Dual-Database Sync',
        title: 'Akses 0ms offline, sinkronisasi otomatis ke cloud.',
        text: 'Bekerja tanpa koneksi internet di mana saja. Semua catatan disimpan di IndexedDB lokal dengan kecepatan instan, dan disinkronkan secara aman ke database Neon PostgreSQL saat Anda kembali online.',
        bullets: [
          'Kecepatan baca dan tulis 0ms tanpa loading spinner',
          'Sinkronisasi cloud otomatis multi-device via Neon',
          'Penanganan konflik cerdas dengan stempel waktu revisi'
        ],
        cta: 'Coba Workspace Sekarang',
        previewTag: '⚡ Arsitektur Dual-DB',
        previewStatus: 'Status: Aktif',
        previewTitle: 'Sinkronisasi Cerdas Tanpa Hambatan',
        previewDesc: 'Data tersimpan di perangkat lokal Anda dan otomatis direplikasi ke cloud saat terhubung.'
      },
      editor: {
        badge: 'Rich Block Canvas',
        title: 'Ketik cepat dengan slash commands & markdown.',
        text: "Format ide Anda semudah mengetik biasa. Cukup tekan '/' untuk memasukkan heading, todo checklist, tabel database, blok kode dengan syntax highlighting, atau rumus matematika KaTeX.",
        bullets: [
          'Menu slash command (/) interaktif dan cepat',
          'Dukungan KaTeX untuk rumus matematika dan sains',
          'Struktur halaman bersarang (nested sub-pages) tanpa batas'
        ],
        cta: 'Eksplorasi Editor',
        previewBar: '/heading, /todo, /code, /math...',
        previewChip: 'Perintah Editor',
        previewText: 'Gunakan pintasan keyboard untuk mempercepat penulisan dokumen dan ide tanpa perlu menyentuh mouse.',
        previewCitation: 'Markdown & Rumus Matematika Native'
      },
      privacy: {
        badge: 'Total Data Ownership',
        title: 'Catatan adalah milik Anda sepenuhnya.',
        text: 'Tidak ada format terkunci. Ekspor catatan Anda ke format Markdown (.md) standar atau cetak ke PDF dengan satu klik. Simpan salinan lokal Anda kapan saja.',
        bullets: [
          'Ekspor dan impor file Markdown (.md) instan',
          'Riwayat revisi (Version History) dengan pemulihan snapshot',
          'Privasi terjaga dengan penyimpanan lokal pada browser'
        ],
        cta: 'Buka Noted Gratis',
        previewTitle: 'Ekspor & Riwayat Versi',
        previewBadge: 'Portabel',
        log1: '→ Snapshot otomatis tersimpan setiap pengeditan',
        log2: '→ Ekspor dokumen ke dokumen.md standar',
        log3: '→ 100% bebas lock-in vendor'
      }
    },
    capabilities: {
      badge: 'KEMAMPUAN NOTED',
      title: 'Fitur lengkap untuk produktivitas maksimal.',
      desc: 'Dirancang untuk kebutuhan menulis, meriset, dan mengorganisasi ide.',
      items: [
        {
          illustKey: 'cmdPalette',
          title: 'Command Palette (⌘K)',
          desc: 'Beralih antar halaman, ganti tema, dan jalankan perintah workspace dalam hitungan milidetik.'
        },
        {
          illustKey: 'versionHistory',
          title: 'Version History Drawer',
          desc: 'Lihat riwayat snapshot perubahan dokumen Anda dan kembalikan versi sebelumnya kapan saja.'
        },
        {
          illustKey: 'comments',
          title: 'Komentar & Diskusi',
          desc: 'Beri catatan pada blok tertentu, diskusikan masukan, dan tandai komentar yang selesai.'
        },
        {
          illustKey: 'themeMode',
          title: 'Tema Gelap & Terang',
          desc: 'Palet warna elegan yang nyaman di mata untuk kenyamanan membaca dan menulis sepanjang hari.'
        },
        {
          illustKey: 'markdownExport',
          title: 'Impor & Ekspor Fleksibel',
          desc: 'Tarik teks dari catatan lain atau simpan ke file Markdown murni tanpa kehilangan format.'
        },
        {
          illustKey: 'databaseKanban',
          title: 'Database & Papan Kanban',
          desc: 'Kelola proyek dengan tampilan tabel, papan status, kalender, dan kalkulasi formula instan.'
        }
      ]
    },
    heroFlow: {
      engineBadge: 'MESIN 3D INTERAKTIF · CARA KERJA NOTED',
      stages: [
        {
          id: 'write',
          step: '01',
          title: 'Ketik & Slash (/)',
          desc: 'Tulis markdown, /table, atau /math secepat pikiran Anda',
          metric: '60 FPS Block Editor',
          liveSnippet: '/kanban → Proyek Q4 dibuat instan'
        },
        {
          id: 'ai',
          step: '02',
          title: 'Asisten AI Kontekstual',
          desc: 'Rangkum dokumen & rapikan struktur blok secara otomatis',
          metric: 'Konteks Lokal Penuh',
          liveSnippet: '✨ AI merangkum 4 poin aksi utama'
        },
        {
          id: 'vault',
          step: '03',
          title: 'Vault Lokal 0ms',
          desc: 'Tersimpan otomatis di IndexedDB & SQLite tanpa internet',
          metric: '0ms Offline Latency',
          liveSnippet: '⚡ Blok dikunci ke SQLite/IndexedDB'
        },
        {
          id: 'sync',
          step: '04',
          title: 'Cloud Sync Neon',
          desc: 'Replikasi terenkripsi ke PostgreSQL di semua perangkat',
          metric: 'Dual-Engine Sync',
          liveSnippet: '☁️ Tersinkron ke Neon Lakebase (TLS 1.3)'
        }
      ]
    },
    philosophy: {
      badge: 'PRINSIP DESAIN',
      title: 'Filosofi di balik Noted.',
      items: [
        {
          quote: '"Kecepatan adalah fitur utama. Noted dirancang agar terbuka seketika dan mencatat tanpa jeda loading sedikit pun."',
          iconType: 'zap',
          author: 'Cepat & Ringan',
          desc: '0ms latency lokal dengan IndexedDB'
        },
        {
          quote: '"Data Anda adalah milik Anda. Format catatan menggunakan standar Markdown murni yang dapat dipindahkan kapan saja."',
          iconType: 'shield',
          author: 'Privasi & Kebebasan',
          desc: 'Bebas lock-in vendor dengan ekspor .md'
        },
        {
          quote: '"Bekerja di mana saja, terhubung saat siap. Sinkronisasi dual-engine memastikan catatan Anda selalu aman."',
          iconType: 'cloud',
          author: 'Dual-Engine Sync',
          desc: 'Replikasi aman ke PostgreSQL di Neon'
        }
      ]
    },
    cta: {
      heading: 'Mulai gunakan Noted sekarang.',
      subheading: 'Nikmati workspace pencatatan yang tenang, cepat, dan siap menemani alur berpikir Anda.',
      startFree: 'Mulai Gratis',
      loginGoogle: 'Masuk dengan Google'
    }
  },
  en: {
    nav: {
      product: 'Product',
      download: 'Download',
      docs: 'Docs',
      login: 'Log in',
      startFree: 'Get Started',
      downloadApps: 'Download Apps',
      getStartedFree: 'Get Started Free →',
      coreSystem: 'CORE SYSTEM',
      docsWikisTitle: 'Docs & Wikis',
      docsWikisDesc: 'Rich hierarchical text editing with markdown',
      databasesTitle: 'Connected Databases',
      databasesDesc: 'Tables, boards, lists, and multi-property views',
      aiAgentsTitle: 'Autonomous AI Agents',
      aiAgentsDesc: 'Context-aware reasoning and automated workflows',
      downloads: 'DOWNLOADS',
      desktopTitle: 'Desktop App (Mac / Windows)',
      mobileTitle: 'Android & Mobile App'
    },
    hero: {
      badge: 'Local-First Offline Vault + Real-time Cloud Sync',
      rotatingWords: ['Write', 'Think', 'Organize', 'Build'],
      titlePrefix: 'A calm space to',
      titleSuffix: 'without limits.',
      subtitle:
        'Noted is a distraction-free markdown workspace with an instant offline vault, real-time PostgreSQL cloud sync, and AI assistance. Fast, private, and always yours.',
      startFree: 'Get Started Free',
      downloadApp: 'Download Apps'
    },
    mockup: {
      tabTitle: 'Product Roadmap & Architecture',
      vaultStatus: 'IndexedDB Vault · Neon Synced',
      workspaceName: 'Noted Workspace',
      favoritesLabel: 'FAVORITES',
      roadmap: 'Product Roadmap',
      architecture: 'System Architecture',
      ideaSandbox: 'Idea Sandbox',
      knowledgeWiki: 'Knowledge Wiki',
      settingsCloud: 'Settings & Cloud',
      tagVault: 'Vault: Local-First',
      tagSync: 'Sync: PostgreSQL (Neon)',
      tagFormat: 'Format: Pure Markdown',
      calloutHeading: 'Local-First Architecture:',
      calloutText:
        'All notes are stored instantly on your device via IndexedDB with 0ms latency. When connected to the internet, Noted synchronizes automatically with PostgreSQL on Neon.',
      checklistTitle: 'Core Features Checklist',
      checkedCount: 'Checked',
      tasks: [
        { id: 1, text: 'Write with slash commands (/) & markdown shortcuts', completed: true },
        { id: 2, text: 'Store notes securely in local IndexedDB vault', completed: true },
        { id: 3, text: 'Replicate changes quietly to Neon PostgreSQL cloud', completed: true },
        { id: 4, text: 'Export note to pure Markdown (.md) with zero lock-in', completed: false }
      ],
      aiPrefix: 'Noted AI:',
      aiDrafting: 'Drafting clean summary from selected blocks...',
      aiReady: 'Ready'
    },
    socialProof: {
      label: 'Available across all the devices you use',
      desktopTitle: 'Desktop App',
      desktopSub: 'macOS & Windows',
      mobileTitle: 'Mobile App',
      mobileSub: 'Android (APK)',
      webTitle: 'Web App',
      webSub: 'PWA & Browser',
      vaultTitle: 'Offline Vault',
      vaultSub: 'IndexedDB & SQLite'
    },
    bento: {
      badge: 'FEATURE HIGHLIGHTS',
      title: 'Built for speed, privacy, and focus.',
      desc: 'Everything you need to write, think, and organize ideas without interruptions.',
      tabs: {
        sync: '1. Local-First & Dual Sync',
        editor: '2. Block-Based Editor',
        privacy: '3. Zero Vendor Lock-in'
      },
      sync: {
        badge: 'Dual-Database Sync',
        title: '0ms offline access with automatic cloud sync.',
        text: 'Work anywhere without an internet connection. All notes are saved instantly to local IndexedDB and securely synced to Neon PostgreSQL once reconnected.',
        bullets: [
          '0ms read and write speed without any loading spinners',
          'Automatic multi-device cloud synchronization via Neon',
          'Smart conflict resolution with revision timestamps'
        ],
        cta: 'Try Workspace Now',
        previewTag: '⚡ Dual-DB Architecture',
        previewStatus: 'Status: Active',
        previewTitle: 'Seamless Intelligent Sync',
        previewDesc: 'Data lives on your local device and is automatically replicated to the cloud when connected.'
      },
      editor: {
        badge: 'Rich Block Canvas',
        title: 'Type fast with slash commands & markdown.',
        text: "Format your ideas effortlessly. Just type '/' to insert headings, todo checklists, database tables, syntax-highlighted code blocks, or KaTeX math formulas.",
        bullets: [
          'Fast, interactive slash command (/) menu',
          'KaTeX support for mathematical and scientific equations',
          'Unlimited nested sub-pages and hierarchical trees'
        ],
        cta: 'Explore the Editor',
        previewBar: '/heading, /todo, /code, /math...',
        previewChip: 'Editor Commands',
        previewText: 'Use keyboard shortcuts to accelerate drafting documents and ideas without touching the mouse.',
        previewCitation: 'Markdown & Math Formula Native'
      },
      privacy: {
        badge: 'Total Data Ownership',
        title: 'Your notes belong to you 100%.',
        text: 'No proprietary format lock-in. Export your notes to standard Markdown (.md) or print to PDF with a single click. Keep full local backups at all times.',
        bullets: [
          'Instant Markdown (.md) export and import',
          'Version History with point-in-time snapshot recovery',
          'Guaranteed privacy with local storage on your device'
        ],
        cta: 'Open Noted Free',
        previewTitle: 'Export & Version History',
        previewBadge: 'Portable',
        log1: '→ Automatic snapshot saved on every edit',
        log2: '→ Export documents to standard document.md',
        log3: '→ 100% free of vendor lock-in'
      }
    },
    capabilities: {
      badge: 'NOTED CAPABILITIES',
      title: 'Full-featured for maximum productivity.',
      desc: 'Engineered for drafting, researching, and organizing your thoughts.',
      items: [
        {
          illustKey: 'cmdPalette',
          title: 'Command Palette (⌘K)',
          desc: 'Switch pages, toggle themes, and trigger workspace actions in milliseconds.'
        },
        {
          illustKey: 'versionHistory',
          title: 'Version History Drawer',
          desc: 'Inspect snapshot history of document changes and restore earlier revisions anytime.'
        },
        {
          illustKey: 'comments',
          title: 'Comments & Discussions',
          desc: 'Leave notes on specific blocks, discuss feedback, and resolve threads.'
        },
        {
          illustKey: 'themeMode',
          title: 'Dark & Light Mode',
          desc: 'Refined color schemes easy on the eyes for comfortable reading and writing day and night.'
        },
        {
          illustKey: 'markdownExport',
          title: 'Flexible Import & Export',
          desc: 'Bring in notes from other tools or save to pure Markdown without losing formatting.'
        },
        {
          illustKey: 'databaseKanban',
          title: 'Databases & Kanban Boards',
          desc: 'Manage projects with relational tables, status boards, calendars, and instant formulas.'
        }
      ]
    },
    heroFlow: {
      engineBadge: 'INTERACTIVE 3D ENGINE · HOW NOTED WORKS',
      stages: [
        {
          id: 'write',
          step: '01',
          title: 'Write & Slash (/)',
          desc: 'Type markdown, /table, or /math at the speed of thought',
          metric: '60 FPS Block Editor',
          liveSnippet: '/kanban → Q4 Roadmap created instantly'
        },
        {
          id: 'ai',
          step: '02',
          title: 'Context AI Agent',
          desc: 'Summarize docs & structure blocks automatically',
          metric: 'Full Local Context',
          liveSnippet: '✨ AI synthesized 4 key action items'
        },
        {
          id: 'vault',
          step: '03',
          title: '0ms Local Vault',
          desc: 'Auto-saved to IndexedDB & SQLite with zero internet',
          metric: '0ms Offline Latency',
          liveSnippet: '⚡ Blocks committed to SQLite/IndexedDB'
        },
        {
          id: 'sync',
          step: '04',
          title: 'Neon Cloud Sync',
          desc: 'Encrypted replication to PostgreSQL across all devices',
          metric: 'Dual-Engine Sync',
          liveSnippet: '☁️ Synced to Neon Lakebase (TLS 1.3)'
        }
      ]
    },
    philosophy: {
      badge: 'DESIGN PRINCIPLES',
      title: 'The philosophy behind Noted.',
      items: [
        {
          quote: '"Speed is the primary feature. Noted is built to open instantaneously and capture thoughts without loading spinners."',
          iconType: 'zap',
          author: 'Fast & Lightweight',
          desc: '0ms local latency with IndexedDB'
        },
        {
          quote: '"Your data is yours. Notes are formatted in standard pure Markdown and can be moved anytime."',
          iconType: 'shield',
          author: 'Privacy & Freedom',
          desc: 'No vendor lock-in with .md export'
        },
        {
          quote: '"Work anywhere, connect when ready. Dual-engine synchronization keeps your notes safe and accessible."',
          iconType: 'cloud',
          author: 'Dual-Engine Sync',
          desc: 'Secure replication to PostgreSQL on Neon'
        }
      ]
    },
    cta: {
      heading: 'Start using Noted today.',
      subheading: 'Experience a calm, fast workspace built to stay in sync with your thinking.',
      startFree: 'Get Started Free',
      loginGoogle: 'Continue with Google'
    }
  }
};
