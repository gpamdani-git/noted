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
        password_hash TEXT,
        password_salt TEXT,
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
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        page_id TEXT,
        payload TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS deleted_comments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
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
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
    `);

    // Migrations for databases that were created before these columns existed
    const migrate = (statement) => {
      try {
        sqlite.exec(statement);
      } catch {
        // The column already exists
      }
    };
    migrate('ALTER TABLE pages ADD COLUMN is_archived INTEGER DEFAULT 0');
    migrate('ALTER TABLE users ADD COLUMN password_hash TEXT');
    migrate('ALTER TABLE users ADD COLUMN password_salt TEXT');

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
      password_hash TEXT,
      password_salt TEXT,
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

    -- Comments Table (Block and Page Discussions)
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      page_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at BIGINT,
      updated_at BIGINT
    );

    -- Deleted Comments (tombstones so a deletion is not resurrected)
    CREATE TABLE IF NOT EXISTS deleted_comments (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
  `;

  await client.query(ddl);

  // Migrations for databases that were created before these columns existed
  await client.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
  await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT');
};

/**
 * Finds user record by email from PostgreSQL or SQLite.
 */
export const findUserByEmail = async (email) => {
  if (!email || typeof email !== 'string') return null;
  const cleanEmail = email.trim().toLowerCase();

  const p = getPool();
  if (p) {
    try {
      const res = await p.query(
        `SELECT id, email, name, picture, avatar, color,
                password_hash AS "passwordHash", password_salt AS "passwordSalt"
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [cleanEmail]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.warn('[db:findUserByEmail] Postgres query error:', err.message);
    }
  }

  const sqliteInst = await getSqliteDb();
  if (sqliteInst) {
    try {
      const row = sqliteInst.sqlite.prepare(
        `SELECT id, email, name, picture, avatar, color,
                password_hash AS passwordHash, password_salt AS passwordSalt
         FROM users
         WHERE LOWER(email) = LOWER(?)
         LIMIT 1`
      ).get(cleanEmail);
      return row || null;
    } catch (err) {
      console.warn('[db:findUserByEmail] SQLite query error:', err.message);
    }
  }

  return null;
};

/**
 * Upserts a user in PostgreSQL or SQLite.
 */
export const saveUser = async (user) => {
  if (!user || !user.email) return null;
  const cleanEmail = user.email.trim().toLowerCase();
  const userId = user.id || `email_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const name = user.name || cleanEmail.split('@')[0];
  const picture = user.picture || null;
  const avatar = user.avatar || name.charAt(0).toUpperCase();
  const color = user.color || '#2383e2';
  const passwordHash = user.passwordHash || null;
  const passwordSalt = user.passwordSalt || null;
  const now = Date.now();

  const p = getPool();
  if (p) {
    try {
      await p.query(
        `INSERT INTO users (id, email, name, picture, avatar, color, password_hash, password_salt, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           name = EXCLUDED.name,
           picture = COALESCE(EXCLUDED.picture, users.picture),
           avatar = EXCLUDED.avatar,
           color = EXCLUDED.color,
           password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
           password_salt = COALESCE(EXCLUDED.password_salt, users.password_salt),
           updated_at = EXCLUDED.updated_at`,
        [userId, cleanEmail, name, picture, avatar, color, passwordHash, passwordSalt, now, now]
      );
      return { id: userId, email: cleanEmail, name, picture, avatar, color };
    } catch (err) {
      console.warn('[db:saveUser] Postgres insert error:', err.message);
    }
  }

  const sqliteInst = await getSqliteDb();
  if (sqliteInst) {
    try {
      sqliteInst.sqlite.prepare(
        `INSERT INTO users (id, email, name, picture, avatar, color, password_hash, password_salt, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           email = excluded.email,
           name = excluded.name,
           picture = COALESCE(excluded.picture, users.picture),
           avatar = excluded.avatar,
           color = excluded.color,
           password_hash = COALESCE(excluded.password_hash, users.password_hash),
           password_salt = COALESCE(excluded.password_salt, users.password_salt),
           updated_at = excluded.updated_at`
      ).run(userId, cleanEmail, name, picture, avatar, color, passwordHash, passwordSalt, now, now);
      return { id: userId, email: cleanEmail, name, picture, avatar, color };
    } catch (err) {
      console.warn('[db:saveUser] SQLite insert error:', err.message);
    }
  }

  return { id: userId, email: cleanEmail, name, picture, avatar, color };
};
