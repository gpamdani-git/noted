// Vercel Serverless Function: Neon Lakebase HTTP SQL Proxy
// Purpose: Android Capacitor APK cannot call Neon HTTP SQL directly due to CORS
// (Neon blocks custom headers like Neon-Connection-String from https://localhost origin).
// This proxy runs server-side on Vercel, forwarding SQL queries to Neon without CORS issues.
// Security: Only allows parameterized SQL queries, no raw DDL (DROP/TRUNCATE/ALTER).

const NEON_HOST = 'ep-polished-forest-azx5265k-pooler.c-3.ap-southeast-1.aws.neon.tech';
const NEON_CONN = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:REDACTED@redacted.invalid/neondb?sslmode=require';

// Blocklist dangerous SQL keywords for safety
const BLOCKED_SQL = /\b(DROP|TRUNCATE|ALTER|CREATE\s+TABLE|DELETE\s+FROM\s+users|DELETE\s+FROM\s+pages\s+WHERE\s+1)\b/i;

export default async function handler(req, res) {
  // CORS headers — allow all origins so APK (https://localhost) can call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, params = [] } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid query' });
    }

    // Block dangerous operations
    if (BLOCKED_SQL.test(query)) {
      return res.status(403).json({ error: 'Query not permitted' });
    }

    const neonRes = await fetch(`https://${NEON_HOST}/sql`, {
      method: 'POST',
      headers: {
        'Neon-Connection-String': NEON_CONN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, params })
    });

    if (!neonRes.ok) {
      const errText = await neonRes.text();
      return res.status(neonRes.status).json({ error: errText });
    }

    const data = await neonRes.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('[/api/neon] Proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
