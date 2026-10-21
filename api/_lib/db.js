// Dual-Database Engine for Noted (Drizzle ORM + PostgreSQL + Local SQLite)
// - Cloud: PostgreSQL (Vercel Postgres, Neon, Supabase, Railway, Render)
// - Local: SQLite (data/local.db via better-sqlite3) & IndexedDB Vault (browser)

import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as pgSchema from '../../src/db/schema.js';

const { Pool } = pg;

let pool = null;
let drizzlePgInstance = null;
let sqliteDbInstance = null;

export const getConnectionString = () => {
  try {
    process.loadEnvFile?.();
  } catch {
    // Ignore if already loaded or not supported
  }
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
};

export const getPool = () => {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return pool;
};

/**
 * Returns Drizzle ORM instance for PostgreSQL
 */
export const getDrizzlePg = () => {
  const p = getPool();
  if (!p) return null;
  if (!drizzlePgInstance) {
    drizzlePgInstance = drizzlePg(p, { schema: pgSchema });
  }
  return { db: drizzlePgInstance, pool: p, schema: pgSchema };
};

/**
 * Dynamically loads and returns Local SQLite Database via Drizzle ORM
 * Used for zero-config offline local development without external Postgres.
 */
export const getSqliteDb = async () => {
  if (sqliteDbInstance) return sqliteDbInstance;

  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const Database = (await import('better-sqlite3')).default;
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const sqliteSchema = await import('../../src/db/schema.sqlite.js');

    const dbDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'local.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');

    // Create tables if not exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        picture TEXT,
        avatar TEXT,
        color TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        icon TEXT,
        cover TEXT,
        parent_id TEXT,
        is_favorite INTEGER DEFAULT 0,
        is_locked INTEGER DEFAULT 0,
        full_width INTEGER DEFAULT 0,
        font_family TEXT DEFAULT 'sans',
        blocks TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER,
        is_deleted INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS trash (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        icon TEXT,
        blocks TEXT,
        deleted_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS workspace_settings (
        user_id TEXT PRIMARY KEY,
        open_tabs TEXT,
        active_page_id TEXT,
        theme TEXT DEFAULT 'light',
        updated_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
    `);

    const db = drizzle(sqlite, { schema: sqliteSchema });
    sqliteDbInstance = { db, sqlite, schema: sqliteSchema, path: dbPath };
    return sqliteDbInstance;
  } catch (err) {
    console.warn('Local SQLite initialization notice:', err.message);
    return null;
  }
};

/**
 * Initializes and verifies PostgreSQL tables matching Notion REA models
 */
export const ensureSchema = async (client) => {
  const ddl = `
    -- Users Table (Notion Workspace Identity)
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

    -- Pages Table (Notion Document Blocks & Hierarchy)
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

    -- Trash Table (Notion Soft Deleted Pages)
    CREATE TABLE IF NOT EXISTS trash (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      icon TEXT,
      blocks JSONB,
      deleted_at BIGINT
    );

    -- Workspace Settings (Active Tab, Navigation State)
    CREATE TABLE IF NOT EXISTS workspace_settings (
      user_id TEXT PRIMARY KEY,
      open_tabs JSONB DEFAULT '[]'::jsonb,
      active_page_id TEXT,
      theme TEXT DEFAULT 'light',
      updated_at BIGINT
    );

    -- Index for rapid per-user queries
    CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
    CREATE INDEX IF NOT EXISTS idx_trash_user_id ON trash(user_id);
  `;

  await client.query(ddl);
};
