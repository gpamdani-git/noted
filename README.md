# Noted 📝

A fast, modern block-based workspace and document editor. Built with React, Vite, Drizzle ORM, and Neon Serverless PostgreSQL.

![Noted App Preview](public/vite.svg)

---

## ✨ Features

- **Block-Based Editor**: Smooth and versatile document editor supporting text paragraphs, headings, to-do checklists, toggle lists, code blocks, quote callouts, interactive tables, and mathematical expressions with KaTeX.
- **Block & Database Editing**: 20+ block types reachable from the slash menu, and database tables with select, status, multi-select, people, email, phone, date, number, checkbox, URL and text properties across table, board, gallery, list and calendar views.
- **Dual-Database Architecture**:
  - **Local Layer**: Offline-first IndexedDB Vault with 0ms optimistic reads/writes, backed by a local SQLite database for local development.
  - **Cloud Layer**: PostgreSQL synchronization powered by Neon Serverless and Drizzle ORM.
- **Bi-Directional Cloud Sync**: Debounced synchronization queue that pushes pages, trash and comments, and merges remote changes back into the workspace. Concurrent edits are resolved last-writer-wins, there is no CRDT.
- **Authentication**: Google OAuth 2.0 sign-in, verified server-side against Google before a signed session is issued, plus a private offline guest workspace.
- **Workspace Organisation**: Multi-tab navigation, page archive, trash, favourites, version history, page analytics, comments with discussions, and a command palette that also runs the actions of the app.
- **Theme & Personalization**: Light and dark mode, customizable page icons and covers, full-width layouts, and responsive sidebar navigation.
- **Export & Import**: Markdown export and import, and a JSON workspace backup. There is no HTML, CSV or PDF export.

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
   npm run env:check
   ```
   `npm run env:check` reports which variables are still missing.

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

### Server environment

The deployed server verifies the Google credential and signs the session token,
so it needs its own copy of the configuration. These variables have to be set
on the deployment (Vercel), not only in the local `.env`:

| Variable | Why it is needed |
| --- | --- |
| `SESSION_SECRET` | Signs the session token that authorizes `/api/sync`. Without it the server answers `503` and no sign-in succeeds. |
| `GOOGLE_CLIENT_ID` | The client id the credential is verified against. It has to match `VITE_GOOGLE_CLIENT_ID`. |
| `DATABASE_URL` | PostgreSQL connection string. Without it the server runs in local vault mode. |
| `ALLOWED_ORIGINS` | Origins allowed to call the API. The origin of the app itself is always allowed. |
| `AI_ALLOWED_HOSTS` | Extra hosts the Electron AI bridge may reach. |

To copy the local values to Vercel:

```bash
npx vercel link
export VERCEL_TOKEN=...            # from the Vercel account settings
node scripts/check-env.mjs --push
npx vercel --prod
```

---

## 📦 Database & Drizzle CLI

- `npm run db:push` — Push Drizzle schema to cloud PostgreSQL
- `npm run db:studio` — Open visual Drizzle Studio web inspector
- `npm run db:sqlite:studio` — Open Drizzle Studio for local SQLite
- `npm test` — Run the unit test suite (Vitest)
- `npm run test:e2e` — Run the browser test suite (Playwright)
- `npm run env:check` — Report the state of the environment
- `npm run qa:report` — Regenerate `qa-report.html` from the real test runs

---

## 📄 License

MIT
