// docsData.js - Comprehensive Documentation Knowledge Base for Noted
// Strictly aligned with actual Noted app features in both Indonesian and English

export const DOCS_DATA = {
  id: {
    meta: {
      siteTitle: 'Dokumentasi & Pusat Bantuan Noted',
      heroTitle: 'Pusat Bantuan & Panduan Noted',
      heroSubtitle: 'Pelajari cara memaksimalkan workspace Noted Anda: penulisan markdown, database fleksibel, vault offline, hingga sinkronisasi cloud real-time.',
      searchPlaceholder: 'Cari panduan, pintasan keyboard, atau fitur...',
      categoriesTitle: 'Topik Panduan',
      popularTopicsTitle: 'Topik Populer',
      backToHome: 'Kembali ke Beranda',
      launchApp: 'Buka Web App',
      readingTime: 'menit baca',
      lastUpdated: 'Diperbarui',
      helpfulPrompt: 'Apakah artikel ini membantu?',
      helpfulYes: 'Ya, membantu',
      helpfulNo: 'Belum membantu',
      helpfulFeedback: 'Terima kasih atas masukan Anda!',
      tableOfContents: 'Daftar Isi',
      nextArticle: 'Artikel Selanjutnya',
      prevArticle: 'Artikel Sebelumnya',
      noResultsFound: 'Tidak ada artikel yang cocok dengan kata kunci pencarian.',
      clearSearch: 'Bersihkan pencarian'
    },
    popularSearches: [
      'Pintasan Slash (/)',
      'Database Kanban & Tabel',
      'Vault Offline (IndexedDB)',
      'Sinkronisasi Cloud Neon',
      'Ekspor Markdown (.md)'
    ],
    categories: [
      {
        id: 'getting-started',
        name: 'Memulai Noted',
        icon: 'BookOpen',
        description: 'Dasar-dasar navigasi, mode offline, dan pengaturan workspace pertama Anda.',
        articles: [
          {
            id: 'intro-to-noted',
            title: 'Pengenalan Noted & Arsitektur Sistem',
            summary: 'Pahami bagaimana Noted menggabungkan kecepatan vault lokal dengan keamanan cloud database.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Apa itu Noted?
**Noted** adalah workspace pencatatan dan manajemen pengetahuan modern yang dirancang dengan filosofi **Local-First**. Setiap ketikan Anda tersimpan seketika di komputer atau ponsel Anda tanpa jeda loading, dan secara mulus disinkronkan ke cloud saat perangkat online.

### Tiga Pilar Arsitektur Noted
1. **Kecepatan Instan (0ms Latency)**: Mengetik, membuka tab, dan berpindah halaman terjadi seketika berkat penyimpanan lokal di **IndexedDB** (browser) dan **SQLite** (desktop).
2. **Sinkronisasi Cloud Otomatis (Dual-Engine Sync)**: Saat terhubung ke internet, Noted menghubungkan workspace Anda ke database **PostgreSQL di Neon Cloud** secara background.
3. **Kedaulatan Data Penuh**: Semua catatan Anda dapat diekspor menjadi format Markdown murni (\`.md\`) kapan saja tanpa format kepemilikan yang mengunci (*zero vendor lock-in*).

> [!NOTE]
> Noted dapat digunakan 100% tanpa internet. Saat koneksi terputus, semua perubahan tetap tersimpan di vault lokal Anda.
            `
          },
          {
            id: 'navigation-and-workspace',
            title: 'Navigasi Sidebar, Tab, dan Command Palette',
            summary: 'Cara mengorganisasi dokumen, membuka multi-tab, dan mencari kilat dengan Command Palette.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Mengelola Halaman di Sidebar
Sidebar di sisi kiri layar adalah pusat organisasi dokumen Anda:
- **Buat Halaman Baru**: Klik tombol **+ Halaman Baru** di bagian atas sidebar atau klik ikon tambah di samping grup halaman.
- **Resize Sidebar**: Arahkan kursor ke garis tepi kanan sidebar, lalu geser ke kiri atau kanan untuk menyesuaikan lebarnya sesuai kenyamanan Anda.
- **Favorit**: Tandai halaman penting dengan bintang agar muncul di daftar paling atas.
- **Arsip & Sampah**: Halaman yang sudah selesai dapat diarsipkan atau dibuang ke tempat sampah (*Trash*) dengan opsi pemulihan (*restore*).

### Multi-Tab Navigation
Noted mendukung navigasi multi-tab seperti di browser modern:
- Klik tab mana saja di bilah atas untuk beralih konteks tanpa reload.
- Tutup tab yang tidak terpakai dengan mengeklik tanda silang (\`×\`).

### Command Palette (\`⌘K\` atau \`Ctrl+K\`)
Tekan shortcut keyboard **⌘K** (Mac) atau **Ctrl+K** (Windows/Linux) kapan saja untuk:
- Melompat ke halaman mana pun secara instan berdasarkan judul.
- Mengganti tema Gelap (*Dark Mode*) atau Terang (*Light Mode*).
- Menjalankan perintah ekspor Markdown atau sinkronisasi cloud.
            `
          },
          {
            id: 'accounts-and-privacy',
            title: 'Mode Tamu vs Akun Google & Keamanan Data',
            summary: 'Pilihan mode offline tanpa login dan sinkronisasi akun Google yang aman.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Mode Tamu (Offline Mode)
Anda dapat langsung menggunakan Noted seketika tanpa perlu mendaftar atau memasukkan data apa pun. Dalam Mode Tamu:
- Semua dokumen disimpan di vault lokal komputer Anda.
- Data Anda tidak pernah dikirim ke server pihak ketiga.
- Sangat cocok untuk jurnal pribadi yang rahasia atau catatan harian.

### Masuk dengan Akun Google
Jika Anda ingin mengakses catatan yang sama dari laptop lain atau perangkat mobile:
1. Klik tombol **Log in** di pojok kanan atas atau di menu Pengaturan.
2. Pilih **Lanjutkan dengan Google**.
3. Setelah berhasil, data lokal Anda akan otomatis tersinkronisasi ke ruang cloud aman pribadi Anda di Neon PostgreSQL.
4. Anda dapat berganti akun kapan saja dengan toast notifikasi status login/logout yang jelas.
            `
          }
        ]
      },
      {
        id: 'editor-and-formatting',
        name: 'Editor & Format Penulisan',
        icon: 'Edit3',
        description: 'Panduan lengkap penulisan blok, shortcut markdown, formula matematika, dan media.',
        articles: [
          {
            id: 'slash-commands-guide',
            title: 'Daftar Lengkap Slash Commands (/)',
            summary: 'Daftar lengkap perintah blok yang dapat dipanggil hanya dengan mengetik garis miring (/).',
            readTime: '5',
            updated: 'Oktober 2026',
            content: `
### Cara Menggunakan Slash Commands
Ketik karakter \`/\` pada baris baru di editor untuk memunculkan menu perintah instan. Anda bisa mengetik nama perintah untuk menyaring pilihan, lalu tekan **Enter**.

| Perintah | Fungsi | Shortcut Markdown |
| :--- | :--- | :--- |
| \`/text\` atau \`/p\` | Paragraf teks biasa | Teks standar |
| \`/h1\` | Judul Utama (Heading 1) | \`# \` + spasi |
| \`/h2\` | Sub-judul (Heading 2) | \`## \` + spasi |
| \`/h3\` | Sub-judul kecil (Heading 3) | \`### \` + spasi |
| \`/todo\` | Daftar tugas interaktif | \`[]\` + spasi |
| \`/bullet\` | Daftar poin tak berurutan | \`- \` atau \`* \` + spasi |
| \`/number\` | Daftar berurutan numerik | \`1. \` + spasi |
| \`/quote\` | Kutipan inspiratif / catatan | \`> \` + spasi |
| \`/divider\` | Garis pemisah horizontal | \`---\` |
| \`/callout\` | Kotak sorot dengan ikon emoji | \`/callout\` |
| \`/code\` | Blok kode dengan syntax highlighting | \`\`\`\` |
| \`/math\` | Persamaan matematika KaTeX | \`$$\` |
| \`/table\` | Database tabel fleksibel | \`/table\` |
| \`/kanban\` | Papan kartu status (Board) | \`/kanban\` |
| \`/columns\` | Tata letak multi-kolom berdampingan | \`/columns\` |
            `
          },
          {
            id: 'markdown-and-bubble-menu',
            title: 'Format Inline, Bubble Menu, dan Markdown Shortcuts',
            summary: 'Percepat penulisan dengan pemformatan instan dan pintasan keyboard.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Format Cepat dengan Bubble Menu
Sorot (*highlight*) teks mana pun di editor untuk memunculkan bilah **Bubble Menu**:
- **Tebal (Bold)**: \`⌘B\` atau bungkus dengan \`**teks**\`.
- **Miring (Italic)**: \`⌘I\` atau bungkus dengan \`*teks*\`.
- **Coret (Strikethrough)**: Bungkus dengan \`~~teks~~\`.
- **Kode Inline (Inline Code)**: \`⌘E\` atau bungkus dengan \`\`teks\`\`.
- **Warna Teks & Highlight**: Pilih warna aksen latar belakang untuk memberi penekanan.
- **Tautan (Hyperlink)**: Sematkan tautan web dengan cepat.

### Formula Matematika (KaTeX)
Noted memiliki dukungan render matematika berkualitas tinggi via KaTeX:
- Untuk formula dalam baris kalimat (*inline*), gunakan simbol dollar \`$\\\\sqrt{x^2 + y^2}$\`.
- Untuk blok persamaan mandiri (*display equation*), gunakan perintah \`/math\` atau blok \`$$\`.
            `
          },
          {
            id: 'advanced-blocks',
            title: 'Blok Khusus: Callout, Code Block, dan Kolom Berdampingan',
            summary: 'Tingkatkan struktur dokumen dengan blok tata letak visual.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Callout Blocks
Gunakan blok Callout untuk menyajikan informasi penting, tips, atau peringatan. Anda dapat mengubah emoji ikon dan warna latar belakang blok callout.

### Code Blocks dengan Syntax Highlighting
Noted mendukung penyorotan kode untuk puluhan bahasa pemrograman populer: JavaScript, TypeScript, Python, HTML, CSS, SQL, Go, Rust, JSON, dan Bash. Tersedia tombol salin satu-klik di sudut kanan atas blok kode.

### Column Lists (Tata Letak Kolom)
Bagi catatan Anda menjadi 2 kolom vertikal berdampingan:
1. Ketik \`/columns\` pada baris baru.
2. Noted akan membuat dua wadah kolom fleksibel.
3. Anda dapat menulis catatan rapat di kolom kiri dan poin tindakan di kolom kanan secara rapi.
            `
          }
        ]
      },
      {
        id: 'databases-and-views',
        name: 'Database & Manajemen Data',
        icon: 'Database',
        description: 'Kelola informasi dengan Tabel, Kanban Board, penyaringan, dan pengurutan data.',
        articles: [
          {
            id: 'database-views-overview',
            title: 'Memahami Tampilan Database: Table, Board, dan List',
            summary: 'Satu data yang sama dapat ditampilkan dalam bentuk Tabel terstruktur atau Papan Kanban visual.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Konsep Database di Noted
Database di Noted bukan sekadar tabel statis, melainkan kumpulan baris yang masing-masing dapat memiliki properti beraneka ragam dan dapat dilihat dalam berbagai sudut pandang (*views*).

### Pilihan Tampilan (Views)
1. **Table View (Tabel)**:
   - Tampilan spreadsheet klasik terbaik untuk meninjau banyak data sekaligus.
   - Kolom dapat diubah ukurannya (*resizable columns*).
   - Baris dapat ditambah secara instan dengan tombol **+ Tambah Baris**.

2. **Board View (Kanban)**:
   - Mengelompokkan item berdasarkan kolom status (misal: *To Do*, *In Progress*, *Done*).
   - Geser kartu dengan drag-and-drop antar kolom status.
   - Ideal untuk manajemen proyek, roadmap sprint, dan pipeline kerja.

3. **List View (Daftar)**:
   - Tampilan minimalis yang ringkas untuk dokumen, arsip referensi, atau log harian.
            `
          },
          {
            id: 'properties-and-filtering',
            title: 'Tipe Properti, Filter, dan Sorting',
            summary: 'Panduan menggunakan kolom teks, angka, tag multi-pilihan, dan tanggal.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Tipe Properti Kolom
Noted mendukung tipe kolom berikut:
- **Teks**: Catatan atau deskripsi umum.
- **Angka**: Nilai numerik untuk estimasi harga, durasi, atau kuantitas.
- **Select / Multi-Select**: Tag warna-warni untuk kategori dan prioritas.
- **Status**: Penanda progres pekerjaan (*Belum Mulai*, *Sedang Dikerjakan*, *Selesai*).
- **Date (Tanggal)**: Tenggat waktu atau jadwal rilis.
- **Checkbox**: Kotak centang ya/tidak.

### Filter & Pengurutan (Sorting)
- Gunakan bilah alat di atas database untuk menyaring baris berdasarkan kondisi (misalnya: hanya tampilkan baris yang memiliki prioritas *High*).
- Urutkan data berdasarkan abjad atau tanggal terbaru ke terlama secara instan.
            `
          }
        ]
      },
      {
        id: 'sync-and-storage',
        name: 'Penyimpanan & Sinkronisasi',
        icon: 'Cloud',
        description: 'Bagaimana Noted menyimpan data offline, sinkronisasi cloud ke Neon, dan multi-tab sync.',
        articles: [
          {
            id: 'offline-vault-explained',
            title: 'Cara Kerja Vault Offline (IndexedDB & SQLite)',
            summary: 'Keamanan data dan persistensi tanpa ketergantungan internet sama sekali.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Mengapa Offline-First?
Banyak aplikasi catatan modern bergantung pada panggilan jaringan setiap kali Anda mengetik satu karakter. Jika koneksi lambat, aplikasi akan mengalami jeda atau *lag*.

Di Noted, alur penyimpanan dirancang sebaliknya:
\`\`\`
Ketikan Pengguna ──> Vault Lokal (IndexedDB / SQLite) ──> UI Terupdate Seketika
                             │
                  (Bila terhubung internet)
                             ▼
              Neon Cloud PostgreSQL Sync
\`\`\`

### Keuntungan Utama
- **Kecepatan Buka 0ms**: Halaman dan dokumen langsung siap dibaca dan diedit tanpa menunggu respon server.
- **Aman saat Offline**: Anda dapat bekerja di pesawat, kereta, atau lokasi tanpa sinyal tanpa rasa khawatir.
            `
          },
          {
            id: 'dual-engine-neon-sync',
            title: 'Sinkronisasi Dual-Engine ke Neon Cloud PostgreSQL',
            summary: 'Mekanisme sinkronisasi data yang tenang, otomatis, dan tahan konflik.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Arsitektur Sinkronisasi
Noted menggunakan sinkronisasi dual-engine yang menghubungkan penyimpanan lokal Anda dengan **PostgreSQL di Neon Cloud**:
- **Automatic Pulse**: Saat mendeteksi koneksi online, Noted menyinkronkan snapshot dokumen secara berkala.
- **Multi-Tab Sync**: Jika Anda membuka Noted di beberapa tab browser sekaligus, \`BroadcastChannel\` akan memastikan perubahan di satu tab seketika terefleksi di tab lain tanpa reload.
- **Indikator Status**: Anda dapat memantau status sinkronisasi melalui chip status di bilah navigasi:
  - 🟢 **Tersinkronisasi**: Semua data lokal telah cocok dengan server cloud.
  - 🟡 **Menyinkronkan...**: Sedang mengirimkan perubahan terbaru.
  - ⚪ **Mode Offline**: Bekerja dalam vault lokal aman.
            `
          }
        ]
      },
      {
        id: 'collaboration-and-history',
        name: 'Kolaborasi & Riwayat Dokumen',
        icon: 'Users',
        description: 'Bekerja bersama secara realtime, komentar blok, dan pemulihan snapshot riwayat versi.',
        articles: [
          {
            id: 'realtime-collaboration-yjs',
            title: 'Kolaborasi Real-Time & Kursor Rekan Tim',
            summary: 'Menulis dokumen bersama rekan kerja dengan kursor live dan indikator pengetikan.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Mesin Kolaborasi Real-Time
Noted mengintegrasikan pustaka **Yjs** untuk kolaborasi multi-pengguna yang bebas konflik (*Conflict-Free Replicated Data Types*).

### Fitur Kolaborasi
- **Remote Cursors**: Lihat kursor rekan kerja Anda bergerak secara realtime lengkap dengan nama pengguna mereka.
- **Typing Indicator**: Tahu siapa saja yang sedang aktif mengetik di dokumen yang sama.
- **Presence List**: Daftar avatar anggota aktif yang sedang melihat halaman tersebut.
            `
          },
          {
            id: 'version-history-and-restore',
            title: 'Version History Drawer & Pemulihan Versi',
            summary: 'Lacak riwayat perubahan catatan dan kembalikan versi sebelumnya kapan pun dibutuhkan.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Membuka Version History
Salah hapus kalimat penting atau ingin membandingkan draf dokumen?
1. Buka menu opsi dokumen di pojok kanan atas editor.
2. Pilih **Version History** (atau gunakan shortcut ⌘K).
3. Laci riwayat versi akan terbuka di sisi kanan layar.

### Fitur Snapshot
- Setiap perubahan signifikan disimpan secara otomatis sebagai snapshot bertanggal dan bertanda waktu.
- Anda dapat meninjau isi catatan di masa lalu.
- Klik **Kembalikan Versi Ini (*Restore*)** untuk mengembalikan dokumen ke kondisi snapshot tersebut secara instan.
            `
          },
          {
            id: 'comments-and-discussions',
            title: 'Komentar dan Diskusi pada Blok Dokumen',
            summary: 'Beri umpan balik pada paragraf spesifik dan tandai tugas yang sudah selesai.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Menyematkan Komentar
Anda dapat menyematkan catatan atau pertanyaan pada blok teks mana saja:
- Klik ikon balon komentar di samping blok atau sorot teks lalu pilih komentar.
- Ketik masukan Anda dan kirimkan.
- Blok yang memiliki diskusi aktif akan diberi indikator visual.
- Setelah diskusi tuntas, klik tombol centang untuk menandai komentar telah diselesaikan (*Resolved*).
            `
          }
        ]
      },
      {
        id: 'export-and-security',
        name: 'Ekspor, Impor & Keamanan',
        icon: 'Shield',
        description: 'Ekspor ke Markdown murni, impor catatan eksternal, dan keamanan platform desktop.',
        articles: [
          {
            id: 'markdown-export-import',
            title: 'Ekspor & Impor Markdown (.md) Tanpa Vendor Lock-in',
            summary: 'Miliki 100% data Anda dan pindahkan ke aplikasi lain kapan saja.',
            readTime: '3',
            updated: 'Oktober 2026',
            content: `
### Ekspor ke File Markdown Murni
Noted menghargai kebebasan data Anda. Kapan saja Anda ingin memindahkan catatan:
1. Buka menu halaman atau tekan \`⌘K\`.
2. Pilih **Ekspor Halaman ke Markdown (.md)**.
3. Noted akan mengonversi semua blok dokumen, heading, daftar centang, dan tabel menjadi sintaks Markdown murni standar dan mengunduhnya ke komputer Anda.

### Impor Dokumen dari Luar
Anda dapat menarik file \`.md\` yang sudah ada atau menyalin teks hasil generasi AI (Claude, ChatGPT, Gemini) langsung ke Noted. Semua format heading dan list akan dikenali dan diubah menjadi blok interaktif secara rapi.
            `
          },
          {
            id: 'desktop-security-hardening',
            title: 'Keamanan Aplikasi Desktop Electron',
            summary: 'Isolasi proses, pembatasan IPC, dan proteksi memori pada versi Desktop Noted.',
            readTime: '4',
            updated: 'Oktober 2026',
            content: `
### Standar Keamanan Desktop
Versi desktop Noted (macOS & Windows) dibangun dengan prinsip keamanan mendalam (*Defense-in-Depth*):
- **Whitelisted IPC Handlers**: Komunikasi antar proses (Renderer dan Main Process) dibatasi ketat hanya untuk saluran aman yang terverifikasi.
- **Context Isolation & Sandbox Aktif**: Kode web tidak memiliki akses langsung ke sistem operasi atau sistem berkas di luar vault yang diizinkan.
- **Hardened Runtime**: Aplikasi ditandatangani secara resmi (*code-signed*) dengan verifikasi integritas SHA-256.
            `
          }
        ]
      }
    ]
  },
  en: {
    meta: {
      siteTitle: 'Noted Documentation & Help Center',
      heroTitle: 'Help Center & Documentation',
      heroSubtitle: 'Master your Noted workspace: block-based writing, flexible databases, offline-first vaulting, and real-time PostgreSQL cloud sync.',
      searchPlaceholder: 'Search guides, keyboard shortcuts, or features...',
      categoriesTitle: 'Guide Topics',
      popularTopicsTitle: 'Popular Topics',
      backToHome: 'Back to Home',
      launchApp: 'Launch Web App',
      readingTime: 'min read',
      lastUpdated: 'Updated',
      helpfulPrompt: 'Was this article helpful?',
      helpfulYes: 'Yes, it helped',
      helpfulNo: 'Not really',
      helpfulFeedback: 'Thank you for your feedback!',
      tableOfContents: 'On this page',
      nextArticle: 'Next Article',
      prevArticle: 'Previous Article',
      noResultsFound: 'No articles matched your search query.',
      clearSearch: 'Clear search'
    },
    popularSearches: [
      'Slash (/) Commands',
      'Kanban & Table Databases',
      'Offline Vault (IndexedDB)',
      'Neon Cloud Sync',
      'Markdown (.md) Export'
    ],
    categories: [
      {
        id: 'getting-started',
        name: 'Getting Started',
        icon: 'BookOpen',
        description: 'Fundamentals of navigation, offline mode, and setting up your first workspace.',
        articles: [
          {
            id: 'intro-to-noted',
            title: 'Introduction to Noted & Architecture',
            summary: 'Learn how Noted combines local-first vault speed with cloud database security.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### What is Noted?
**Noted** is a modern knowledge workspace and markdown editor engineered on a **Local-First** philosophy. Everything you write is committed immediately to your local device without network roundtrips, and silently synchronized to the cloud when connected.

### Three Pillars of Noted Architecture
1. **0ms Instant Latency**: Typing, opening tabs, and navigating pages happen with zero lag using local **IndexedDB** (browser) and **SQLite** (desktop).
2. **Silent Cloud Synchronization**: When connected to the internet, Noted syncs your workspace to a **PostgreSQL database on Neon Cloud**.
3. **Complete Data Sovereignty**: All your documents can be exported to standard Markdown (\`.md\`) with zero proprietary lock-in.

> [!NOTE]
> Noted is fully functional offline. When your connection drops, all edits remain intact in your local vault.
            `
          },
          {
            id: 'navigation-and-workspace',
            title: 'Sidebar Navigation, Tabs, and Command Palette',
            summary: 'Organize documents, navigate multiple tabs, and search rapidly with Command Palette.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### Sidebar Management
The left sidebar is your document organization hub:
- **Create New Pages**: Click the **+ New Page** button at the top of the sidebar.
- **Resizable Sidebar**: Hover over the right edge and drag left or right to customize your width.
- **Favorites & Archive**: Pin vital documents to Favorites or move completed projects to the Archive drawer.

### Multi-Tab Navigation
Work across multiple documents seamlessly without reloading:
- Click any tab in the top tab-bar to switch context instantly.
- Close tabs with the close cross (\`×\`).

### Command Palette (\`⌘K\` or \`Ctrl+K\`)
Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) anytime to:
- Jump to any page instantly by title.
- Toggle between Dark and Light mode.
- Trigger cloud synchronization or export documents to Markdown.
            `
          },
          {
            id: 'accounts-and-privacy',
            title: 'Guest Mode vs Google Account & Privacy',
            summary: 'Zero-login offline mode versus seamless Google cloud synchronization.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Guest Mode (Offline Mode)
Start writing immediately without sign-up or credentials:
- Documents stay strictly on your local device.
- No personal data is sent to external servers.
- Perfect for confidential notes and private journals.

### Google Account Sign-In
To access your documents across laptops and mobile devices:
1. Click **Log in** in the top navigation or settings drawer.
2. Select **Continue with Google**.
3. Your local documents will automatically sync to your personal cloud vault on Neon PostgreSQL.
            `
          }
        ]
      },
      {
        id: 'editor-and-formatting',
        name: 'Editor & Formatting',
        icon: 'Edit3',
        description: 'Complete guide to block commands, markdown shortcuts, math equations, and media.',
        articles: [
          {
            id: 'slash-commands-guide',
            title: 'Master Guide to Slash Commands (/)',
            summary: 'Comprehensive list of block commands activated with a simple forward slash (/).',
            readTime: '5',
            updated: 'October 2026',
            content: `
### Using Slash Commands
Type \`/\` on an empty line in the editor to summon the command popup. Type to filter commands, and press **Enter** to insert.

| Command | Action | Markdown Equivalent |
| :--- | :--- | :--- |
| \`/text\` | Standard body paragraph | Plain text |
| \`/h1\` | Large Heading 1 | \`# \` + space |
| \`/h2\` | Medium Heading 2 | \`## \` + space |
| \`/h3\` | Small Heading 3 | \`### \` + space |
| \`/todo\` | Interactive checklist item | \`[]\` + space |
| \`/bullet\` | Bulleted list item | \`- \` or \`* \` + space |
| \`/number\` | Numbered list item | \`1. \` + space |
| \`/quote\` | Blockquote container | \`> \` + space |
| \`/divider\` | Horizontal rule | \`---\` |
| \`/callout\` | Callout box with emoji icon | \`/callout\` |
| \`/code\` | Syntax-highlighted code block | \`\`\`\` |
| \`/math\` | KaTeX mathematical equation | \`$$\` |
| \`/table\` | Structured database table | \`/table\` |
| \`/kanban\` | Visual status board | \`/kanban\` |
| \`/columns\` | Side-by-side two-column layout | \`/columns\` |
            `
          },
          {
            id: 'markdown-and-bubble-menu',
            title: 'Inline Formatting, Bubble Menu & Shortcuts',
            summary: 'Accelerate writing with selection menus and standard markdown shortcuts.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### Floating Bubble Menu
Select any text to reveal the **Bubble Menu**:
- **Bold**: \`⌘B\` or wrap with \`**bold**\`.
- **Italic**: \`⌘I\` or wrap with \`*italic*\`.
- **Strikethrough**: Wrap with \`~~strikethrough~~\`.
- **Inline Code**: \`⌘E\` or wrap with \`\`code\`\`.
- **Color & Highlights**: Choose custom text and background highlight shades.

### KaTeX Mathematical Notation
Render publication-quality math formulas:
- Inline expressions: \`$\\frac{a}{b} = c$\`.
- Display formulas: Use the \`/math\` command or \`$$\` block delimiters.
            `
          },
          {
            id: 'advanced-blocks',
            title: 'Advanced Blocks: Callouts, Code, and Side-by-Side Columns',
            summary: 'Structure complex notes with rich layout blocks.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Callout Blocks
Highlight essential notes or tips. Customize the leading emoji and background tint.

### Syntax-Highlighted Code Blocks
Enjoy syntax highlighting across JavaScript, Python, TypeScript, SQL, HTML, CSS, Rust, Go, Bash, and JSON. Includes a 1-click clipboard copy button.

### Multi-Column Layouts
Type \`/columns\` to place two content blocks side-by-side—perfect for meeting notes on one side and action items on the other.
            `
          }
        ]
      },
      {
        id: 'databases-and-views',
        name: 'Databases & Views',
        icon: 'Database',
        description: 'Organize items with Table views, Kanban boards, property filters, and sorting.',
        articles: [
          {
            id: 'database-views-overview',
            title: 'Database Views: Table, Board, and List',
            summary: 'Switch seamlessly between tabular data and visual Kanban card workflows.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### The Noted Database Model
Databases in Noted are collections of rich items that can be viewed through different perspectives (*views*) without altering underlying records.

### Supported Views
1. **Table View**: Classic grid with resizable columns and fast row creation.
2. **Board View (Kanban)**: Drag-and-drop cards between status columns (*To Do*, *In Progress*, *Done*).
3. **List View**: Clean, compact listing ideal for quick reading.
            `
          },
          {
            id: 'properties-and-filtering',
            title: 'Column Types, Filter Rules, and Sorting',
            summary: 'Guide to text, number, select badges, status markers, and date properties.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### Available Properties
- **Text**: Notes and freeform descriptions.
- **Number**: Numerical values with formatting.
- **Select / Multi-Select**: Color-coded badges for tags and categories.
- **Status**: Progress states.
- **Date**: Due dates and milestones.
- **Checkbox**: Boolean toggles.

### Querying & Sorting
Filter records by multiple criteria and sort chronologically or alphabetically in real-time.
            `
          }
        ]
      },
      {
        id: 'sync-and-storage',
        name: 'Storage & Cloud Sync',
        icon: 'Cloud',
        description: 'How Noted stores data locally, syncs to Neon Cloud, and handles multi-tab updates.',
        articles: [
          {
            id: 'offline-vault-explained',
            title: 'How the Offline-First Vault Works',
            summary: 'Instant persistence without network dependency.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Zero Latency Writing
Unlike web apps that stall on network requests, Noted commits keystrokes to your local disk first via **IndexedDB** or **SQLite**.

### Key Advantages
- **Instant 0ms Startup**: Pages load immediately.
- **Offline Reliability**: Full read-write capability on planes, trains, or poor Wi-Fi.
            `
          },
          {
            id: 'dual-engine-neon-sync',
            title: 'Dual-Engine Cloud Sync to Neon PostgreSQL',
            summary: 'Automatic background synchronization and multi-tab broadcasting.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### Synchronization Architecture
Noted links local storage to **Neon PostgreSQL**:
- **Automatic Pulse**: Syncs snapshots quietly when an active internet connection is detected.
- **Multi-Tab Sync**: \`BroadcastChannel\` broadcasts changes between browser tabs instantly.
- **Status Chip**: Displays live sync indicators (🟢 Synced, 🟡 Syncing, ⚪ Offline).
            `
          }
        ]
      },
      {
        id: 'collaboration-and-history',
        name: 'Collaboration & History',
        icon: 'Users',
        description: 'Real-time multi-user editing, version snapshots, and block-level discussions.',
        articles: [
          {
            id: 'realtime-collaboration-yjs',
            title: 'Real-Time Collaboration with Yjs',
            summary: 'Live peer awareness, remote cursors, and typing indicators.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Conflict-Free Editing
Noted employs **Yjs** CRDT technology so multiple teammates can edit without overwriting each other.

### Features
- **Remote Cursors**: See where collaborators are editing with color-coded name tags.
- **Typing Indicators**: Live indication of active writers.
- **Active Presence List**: See who has the document open.
            `
          },
          {
            id: 'version-history-and-restore',
            title: 'Version History & Snapshot Restoration',
            summary: 'Inspect past versions and roll back documents with a single click.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Version History Drawer
1. Open the document options menu or press \`⌘K\`.
2. Select **Version History**.
3. Browse timestamped snapshots and restore any previous version instantly.
            `
          },
          {
            id: 'comments-and-discussions',
            title: 'Block-Level Comments and Discussions',
            summary: 'Leave contextual feedback on paragraphs and resolve discussions.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Inline Feedback
Attach comments directly to specific blocks. Discuss edits in threaded replies and mark items as **Resolved** once completed.
            `
          }
        ]
      },
      {
        id: 'export-and-security',
        name: 'Export, Import & Security',
        icon: 'Shield',
        description: 'Pure Markdown export, external document import, and hardened desktop security.',
        articles: [
          {
            id: 'markdown-export-import',
            title: 'Markdown (.md) Export & Import (No Lock-in)',
            summary: 'Retain 100% data ownership and migrate notes anytime.',
            readTime: '3',
            updated: 'October 2026',
            content: `
### Standard Markdown Export
Export any page to clean, standard Markdown (\`.md\`) anytime. No vendor lock-in.

### Markdown Import
Drag in existing \`.md\` files or paste AI-generated outlines directly into Noted.
            `
          },
          {
            id: 'desktop-security-hardening',
            title: 'Electron Desktop Security & Hardening',
            summary: 'Process isolation, IPC whitelisting, and memory protection.',
            readTime: '4',
            updated: 'October 2026',
            content: `
### Desktop Hardening
Noted Desktop enforces strict security boundaries:
- **Whitelisted IPC Handlers**: Only safe, verified commands cross between Renderer and Main processes.
- **Context Isolation & Sandbox**: Keeps your machine protected.
- **Code-Signed Builds**: SHA-256 verified installers for macOS and Windows.
            `
          }
        ]
      }
    ]
  }
};

