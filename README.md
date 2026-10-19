# Noted 📝

A fast, modern block-based workspace and document editor. Built with React, Vite, Drizzle ORM, and Neon Serverless PostgreSQL.

![Noted App Preview](public/vite.svg)

---

## ✨ Features

- **Block-Based Editor**: Smooth and versatile document editor supporting text paragraphs, headings, to-do checklists, toggle lists, code blocks, quote callouts, interactive tables, and mathematical expressions with KaTeX.
- **Dual-Database Architecture**:
  - **Local Layer**: Offline-first IndexedDB Vault with 0ms optimistic reads/writes, backed by a local SQLite database for local development.
  - **Cloud Layer**: PostgreSQL synchronization powered by Neon Serverless and Drizzle ORM.
- **Bi-Directional Cloud Sync**: Automatic debounced synchronization queue with transaction conflict resolution.
- **Authentication**: Google OAuth 2.0 Web Sign-In and private Guest Workspace.
- **Theme & Personalization**: Light and dark mode, customizable page icons and covers, full-width layouts, and responsive sidebar navigation.
- **Export & Import**: Full Markdown export and import capabilities.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide React, KaTeX
- **Database & ORM**: Drizzle ORM, PostgreSQL (Neon Serverless), SQLite (better-sqlite3)
- **Deployment**: Vercel Serverless Functions (`/api/sync`, `/api/status`)
- **Testing**: Vitest, React Testing Library, Playwright

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/noted.git
   cd noted
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Database & Drizzle CLI

- `npm run db:push` — Push Drizzle schema to cloud PostgreSQL
- `npm run db:studio` — Open visual Drizzle Studio web inspector
- `npm run db:sqlite:studio` — Open Drizzle Studio for local SQLite
- `npm run test` — Run full test suite

---

## 📄 License

MIT
