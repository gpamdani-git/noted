// Vercel Serverless Function: Neon HTTP SQL Proxy (RETIRED)
//
// This endpoint used to forward arbitrary SQL from the client to Neon using a
// database credential that was shipped inside the client bundle. That made the
// production database writable by anyone who loaded the app.
//
// It is disabled on purpose. All cloud access now goes through /api/sync,
// which requires a server-issued session token and derives the workspace owner
// from that token. See api/_lib/security.js and api/auth.js.

import { applyCors } from './_lib/security.js';

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(410).json({
    error: 'This SQL proxy has been retired for security reasons.',
    hint: 'Use /api/sync with a valid session token instead.'
  });
}
