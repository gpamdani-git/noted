// Vercel Serverless Function: PostgreSQL Schema Definition Exporter for Noted

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const sql = `-- Noted PostgreSQL Production Schema (Notion REA Engine)
-- Run this in Supabase, Neon, or any PostgreSQL client if you want to inspect or seed tables manually.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  picture TEXT,
  avatar TEXT,
  color TEXT,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  icon TEXT,
  cover TEXT,
  parent_id TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  full_width BOOLEAN DEFAULT FALSE,
  font_family TEXT DEFAULT 'sans',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT DEFAULT 1,
  created_at BIGINT,
  updated_at BIGINT,
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  icon TEXT,
  blocks JSONB,
  deleted_at BIGINT
);

CREATE TABLE IF NOT EXISTS workspace_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  open_tabs JSONB DEFAULT '[]'::jsonb,
  active_page_id TEXT,
  theme TEXT DEFAULT 'light',
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);
`;

  return res.status(200).send(sql);
}
