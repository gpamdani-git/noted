/**
 * Notion-inspired Starter Templates for Blank Pages
 */
export const STARTER_TEMPLATES = [
  {
    id: 'meeting_notes',
    title: 'Meeting Notes',
    icon: '📋',
    description: 'Agenda, catatan diskusi, dan daftar tindakan (action items)',
    blocks: [
      {
        id: `tpl-co-${Date.now()}-1`,
        type: 'callout',
        icon: '🎯',
        color: 'purple',
        text: 'Tujuan Rapat: Sinkronisasi progres mingguan, tinjauan hambatan teknis, dan penetapan prioritas sprint.'
      },
      {
        id: `tpl-h2-${Date.now()}-2`,
        type: 'heading_2',
        text: '👥 Peserta & Waktu'
      },
      {
        id: `tpl-b-${Date.now()}-3`,
        type: 'bulleted_list_item',
        text: 'Waktu: Senin, 10:00 - 11:00 WIB'
      },
      {
        id: `tpl-b-${Date.now()}-4`,
        type: 'bulleted_list_item',
        text: 'Peserta: Tim Engineering, Product Manager, Designer'
      },
      {
        id: `tpl-h2-${Date.now()}-5`,
        type: 'heading_2',
        text: '📌 Agenda Pembahasan'
      },
      {
        id: `tpl-num-${Date.now()}-6`,
        type: 'numbered_list_item',
        text: 'Tinjauan performa rilis versi terbaru'
      },
      {
        id: `tpl-num-${Date.now()}-7`,
        type: 'numbered_list_item',
        text: 'Penyelarasan arsitektur database dan caching'
      },
      {
        id: `tpl-num-${Date.now()}-8`,
        type: 'numbered_list_item',
        text: 'Prioritas fitur sprint berikutnya'
      },
      {
        id: `tpl-h2-${Date.now()}-9`,
        type: 'heading_2',
        text: '💡 Catatan Diskusi'
      },
      {
        id: `tpl-p-${Date.now()}-10`,
        type: 'paragraph',
        text: 'Diskusi berjalan lancar. Seluruh modul utama telah selesai diuji dan siap untuk demonstrasi ke stakeholders.'
      },
      {
        id: `tpl-h2-${Date.now()}-11`,
        type: 'heading_2',
        text: '✅ Action Items'
      },
      {
        id: `tpl-td-${Date.now()}-12`,
        type: 'to_do',
        checked: false,
        text: 'Finalisasi dokumentasi API dan deployment checklist'
      },
      {
        id: `tpl-td-${Date.now()}-13`,
        type: 'to_do',
        checked: false,
        text: 'Lakukan benchmarking performa sebelum perilisan produksi'
      },
      {
        id: `tpl-td-${Date.now()}-14`,
        type: 'to_do',
        checked: false,
        text: 'Jadwalkan review arsitektur mingguan berikutnya'
      }
    ]
  },
  {
    id: 'project_board',
    title: 'Project Roadmap & Kanban',
    icon: '🚀',
    description: 'Papan alur kerja visual dengan status Not Started, In Progress, dan Done',
    blocks: [
      {
        id: `tpl-co-${Date.now()}-1`,
        type: 'callout',
        icon: '🚀',
        color: 'blue',
        text: 'Papan manajemen sprint dan pelacakan fitur utama proyek.'
      },
      {
        id: `tpl-board-${Date.now()}-2`,
        type: 'table',
        viewType: 'board',
        groupByCol: 1,
        headers: ['Task', 'Status', 'Assignee', 'Priority'],
        rows: [
          ['Desain Arsitektur Sistem', 'Done', 'Tech Lead', 'High'],
          ['Implementasi Rich Text Editor', 'Done', 'Frontend', 'High'],
          ['Integrasi Local AI & Ollama', 'In Progress', 'AI Specialist', 'Medium'],
          ['Benchmarking Kecepatan Offline Cache', 'Not Started', 'QA Team', 'Low']
        ]
      }
    ]
  },
  {
    id: 'reading_list',
    title: 'Reading List & Research',
    icon: '📚',
    description: 'Koleksi bacaan, artikel riset, dan knowledge base terstruktur',
    blocks: [
      {
        id: `tpl-co-${Date.now()}-1`,
        type: 'callout',
        icon: '📚',
        color: 'green',
        text: 'Pusat pustaka dan catatan riset teknologi.'
      },
      {
        id: `tpl-tbl-${Date.now()}-2`,
        type: 'table',
        viewType: 'table',
        headers: ['Judul Dokumen / Buku', 'Kategori', 'Status', 'Rating'],
        rows: [
          ['Designing Data-Intensive Applications', 'Architecture', 'Reading', '⭐⭐⭐⭐⭐'],
          ['Building Progressive Web Apps with Vite', 'Frontend', 'Completed', '⭐⭐⭐⭐'],
          ['Local LLM Deployment Guide', 'AI & ML', 'To Read', '⭐⭐⭐⭐⭐']
        ]
      }
    ]
  }
];
