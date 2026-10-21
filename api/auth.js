// Vercel Serverless Function: Google OAuth credential verification & session issuance
// POST /api/auth  { idToken }
//
// The Google Identity Services credential is verified server-side against
// Google's tokeninfo endpoint, then exchanged for a Noted session token that is
// required by /api/sync. No credential or database secret ever ships to the client.

import { applyCors, getSessionSecret, signSession } from './_lib/security.js';

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

const getAllowedClientIds = () => {
  try {
    process.loadEnvFile?.();
  } catch {
    // ignore
  }
  return (process.env.GOOGLE_CLIENT_ID || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!getSessionSecret()) {
    return res.status(503).json({
      error: 'Server is not configured for authenticated sessions (SESSION_SECRET missing)'
    });
  }

  const clientIds = getAllowedClientIds();
  if (clientIds.length === 0) {
    return res.status(503).json({ error: 'GOOGLE_CLIENT_ID is not configured on the server' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google credential token' });
  }

  try {
    const verifyRes = await fetch(`${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Google credential could not be verified' });
    }

    const payload = await verifyRes.json();

    // The credential must be issued for one of our configured OAuth clients.
    if (!clientIds.includes(payload.aud)) {
      return res.status(401).json({ error: 'Google credential was issued for a different application' });
    }

    if (!payload.email || payload.email_verified === 'false') {
      return res.status(401).json({ error: 'Google account email is not verified' });
    }

    const identity = {
      sub: `google_${payload.sub}`,
      email: String(payload.email).toLowerCase(),
      name: payload.name || String(payload.email).split('@')[0],
      picture: payload.picture || ''
    };

    const session = signSession(identity);

    return res.status(200).json({
      success: true,
      session,
      user: {
        id: identity.sub,
        email: identity.email,
        name: identity.name,
        picture: identity.picture,
        avatar: identity.name.charAt(0).toUpperCase(),
        color: '#2383e2',
        isLoggedIn: true,
        loginProvider: 'google',
        loggedInAt: Date.now()
      }
    });
  } catch (err) {
    console.error('[/api/auth] Verification error:', err.message);
    return res.status(500).json({ error: 'Failed to verify Google credential' });
  }
}
