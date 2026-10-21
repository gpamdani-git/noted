// Vercel Serverless Function: PostgreSQL & Local SQLite Health & Telemetry Check

import { getPool, ensureSchema, getConnectionString, getSqliteDb } from './_lib/db.js';
import { applyCors } from './_lib/security.js';

export default async function handler(req, res) {
  // CORS is restricted to the configured origin allowlist (never wildcard).
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const rawConnString = getConnectionString();
  const pool = getPool();

  if (!pool || !rawConnString) {
    const sqliteInstance = await getSqliteDb();
    if (sqliteInstance) {
      try {
        const { sqlite } = sqliteInstance;
        const pagesCount = sqlite.prepare('SELECT COUNT(*) as count FROM pages WHERE is_deleted = 0').get()?.count || 0;
        const usersCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
        return res.status(200).json({
          connected: true,
          configured: false,
          engine: 'SQLite + Drizzle ORM (Local File)',
          latencyMs: 1,
          database: 'data/local.db',
          mode: 'local_drizzle_sqlite',
          stats: {
            pages: pagesCount,
            users: usersCount
          },
          message: 'Connected to Local SQLite database with Drizzle ORM (data/local.db). Siap dideploy ke Vercel!'
        });
      } catch (err) {
        console.warn('SQLite telemetry check error:', err.message);
      }
    }

    return res.status(200).json({
      connected: false,
      configured: false,
      engine: 'PostgreSQL (Vercel / Supabase / Neon)',
      message: 'POSTGRES_URL environment variable is not configured yet. Running in offline Local IndexedDB Vault mode.',
      mode: 'offline_vault'
    });
  }

  let client = null;
  const startTime = Date.now();
  try {
    client = await pool.connect();
    await ensureSchema(client);
    const latency = Date.now() - startTime;

    // Get basic stats
    const pagesCountRes = await client.query('SELECT COUNT(*) FROM pages WHERE is_deleted = FALSE');
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    const dbNameRes = await client.query('SELECT current_database()');

    return res.status(200).json({
      connected: true,
      configured: true,
      engine: 'PostgreSQL + Drizzle ORM',
      latencyMs: latency,
      database: dbNameRes.rows[0]?.current_database || 'postgres',
      stats: {
        pages: parseInt(pagesCountRes.rows[0]?.count || '0', 10),
        users: parseInt(usersCountRes.rows[0]?.count || '0', 10)
      },
      message: 'Connected to remote PostgreSQL database!'
    });
  } catch (err) {
    return res.status(200).json({
      connected: false,
      configured: true,
      engine: 'PostgreSQL',
      error: err.message,
      message: `Failed to connect to PostgreSQL: ${err.message}`
    });
  } finally {
    if (client) client.release();
  }
}
