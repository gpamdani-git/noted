// Server-side security helpers for Noted API functions
// - Origin allowlist (no wildcard CORS)
// - HMAC-signed session tokens (server-issued, server-verified)
// - Request payload validation
//
// IMPORTANT: never hardcode secrets in this file. All values come from the
// environment (Vercel dashboard / .env / process manager).

import crypto from 'node:crypto';

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const loadEnvOnce = () => {
  try {
    process.loadEnvFile?.();
  } catch {
    // Already loaded or unsupported - ignore
  }
};

/**
 * Returns the list of origins allowed to call the API.
 * Configure with ALLOWED_ORIGINS (comma separated). Falls back to local dev origins.
 */
export const getAllowedOrigins = () => {
  loadEnvOnce();
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (configured.length > 0) return configured;
  return DEFAULT_DEV_ORIGINS;
};

/**
 * Checks whether a request comes from the same host that serves the API.
 * A same-origin request is never blocked: the browser sends an Origin header
 * for POST requests, and the hosted app has to be able to call its own API.
 */
const isSameOrigin = (origin, req) => {
  if (!origin || !req) return false;
  try {
    const originUrl = new URL(origin);
    const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
    return Boolean(host) && originUrl.host === host;
  } catch {
    return false;
  }
};

/**
 * Applies CORS headers for a whitelisted origin.
 * Returns false when the request origin is not allowed (browser will block it).
 */
export const applyCors = (req, res) => {
  const origin = (req.headers?.origin || '').replace(/\/$/, '');
  const allowed = getAllowedOrigins();
  const sameOrigin = isSameOrigin(origin, req);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');

  if (origin && (allowed.includes(origin) || sameOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  }

  // No Origin header (server-to-server / curl) is allowed to reach the handler,
  // but the response must not carry a wildcard CORS header.
  return !origin;
};

/**
 * Returns the HMAC secret used to sign session tokens.
 * Returns null when not configured - the API then fails closed.
 */
export const getSessionSecret = () => {
  loadEnvOnce();
  const secret = (process.env.SESSION_SECRET || '').trim();
  return secret.length >= 16 ? secret : null;
};

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (payloadB64, secret) =>
  base64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());

/**
 * Issues a signed session token.
 * @param {{sub: string, email: string, name?: string, picture?: string}} identity
 * @param {number} ttlSeconds
 */
export const signSession = (identity, ttlSeconds = 60 * 60 * 24 * 30) => {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured on the server');
  }
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: identity.sub,
    email: String(identity.email || '').toLowerCase(),
    name: identity.name || '',
    picture: identity.picture || '',
    iat: now,
    exp: now + ttlSeconds
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
};

/**
 * Verifies a session token and returns its payload, or null when invalid/expired.
 */
export const verifySession = (token) => {
  const secret = getSessionSecret();
  if (!secret || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64, secret);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, signatureBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    if (!payload?.sub || !payload?.email) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

/**
 * Extracts and verifies the session from an incoming request.
 * @returns {{sub: string, email: string, name: string, picture: string} | null}
 */
export const getSessionFromRequest = (req) => {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const token = bearer || req.headers?.['x-noted-session'] || '';
  if (!token) return null;
  return verifySession(token);
};

const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isSafeIdentifier = (value) =>
  typeof value === 'string' && SAFE_ID.test(value);

export const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);

export const MAX_PAGES_PER_PUSH = 2000;
export const MAX_TRASH_PER_PUSH = 2000;
export const MAX_BLOCKS_BYTES = 1024 * 1024;

/**
 * Validates and normalizes a sync push payload.
 * Returns { ok: true, payload } or { ok: false, error }.
 */
export const sanitizeSyncPayload = (body) => {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const pages = Array.isArray(body.pages) ? body.pages : [];
  const trash = Array.isArray(body.trash) ? body.trash : [];

  if (pages.length > MAX_PAGES_PER_PUSH) {
    return { ok: false, error: 'Too many pages in a single push' };
  }
  if (trash.length > MAX_TRASH_PER_PUSH) {
    return { ok: false, error: 'Too many trash entries in a single push' };
  }

  const cleanPages = [];
  for (const page of pages) {
    if (!page || !isSafeIdentifier(page.id)) {
      return { ok: false, error: 'Invalid page identifier' };
    }
    let blocks = page.blocks;
    if (typeof blocks === 'string') {
      if (Buffer.byteLength(blocks, 'utf-8') > MAX_BLOCKS_BYTES) {
        return { ok: false, error: 'Page payload too large' };
      }
      try {
        blocks = JSON.parse(blocks);
      } catch {
        return { ok: false, error: 'Invalid page blocks payload' };
      }
    }
    if (!Array.isArray(blocks)) blocks = [];
    const serialized = JSON.stringify(blocks);
    if (Buffer.byteLength(serialized, 'utf-8') > MAX_BLOCKS_BYTES) {
      return { ok: false, error: 'Page payload too large' };
    }
    cleanPages.push({
      id: page.id,
      title: String(page.title || 'Untitled').slice(0, 512),
      icon: page.icon ? String(page.icon).slice(0, 64) : null,
      cover: page.cover ? String(page.cover).slice(0, 2048) : null,
      parentId: isSafeIdentifier(page.parentId) ? page.parentId : null,
      isFavorite: Boolean(page.isFavorite),
      isLocked: Boolean(page.isLocked),
      isArchived: Boolean(page.isArchived),
      fullWidth: Boolean(page.fullWidth),
      fontFamily: String(page.fontFamily || 'sans').slice(0, 32),
      blocks,
      version: Number.isFinite(Number(page.version)) ? Number(page.version) : 1,
      createdAt: Number(page.createdAt) || Date.now(),
      updatedAt: Number(page.updatedAt) || Date.now()
    });
  }

  const cleanTrash = [];
  for (const item of trash) {
    if (!item || !isSafeIdentifier(item.id)) {
      return { ok: false, error: 'Invalid trash identifier' };
    }
    let blocks = item.blocks;
    if (typeof blocks === 'string') {
      try {
        blocks = JSON.parse(blocks);
      } catch {
        blocks = [];
      }
    }
    if (!Array.isArray(blocks)) blocks = [];
    cleanTrash.push({
      id: item.id,
      title: String(item.title || 'Deleted Page').slice(0, 512),
      icon: item.icon ? String(item.icon).slice(0, 64) : null,
      blocks,
      deletedAt: Number(item.deletedAt) || Date.now()
    });
  }

  const settings = body.workspaceSettings && typeof body.workspaceSettings === 'object'
    ? {
        openTabs: Array.isArray(body.workspaceSettings.openTabs)
          ? body.workspaceSettings.openTabs.filter((id) => isSafeIdentifier(id)).slice(0, 100)
          : [],
        activePageId: isSafeIdentifier(body.workspaceSettings.activePageId)
          ? body.workspaceSettings.activePageId
          : null,
        theme: String(body.workspaceSettings.theme || 'light').slice(0, 16)
      }
    : null;

  // Comments are stored as a whole document, so the payload is kept as JSON
  // with the fields the client needs.
  const cleanComments = [];
  const rawComments = Array.isArray(body.comments) ? body.comments : [];
  for (const comment of rawComments.slice(0, 5000)) {
    if (!comment || !isSafeIdentifier(comment.id)) continue;
    if (!isSafeIdentifier(comment.pageId)) continue;

    const author = comment.author && typeof comment.author === 'object'
      ? {
          id: String(comment.author.id || 'user').slice(0, 128),
          name: String(comment.author.name || 'User').slice(0, 128),
          email: isValidEmail(comment.author.email) ? comment.author.email : null,
          avatar: comment.author.avatar ? String(comment.author.avatar).slice(0, 8) : 'U',
          color: /^#[0-9a-fA-F]{3,8}$/.test(String(comment.author.color || '')) ? comment.author.color : '#2383e2'
        }
      : null;

    const replies = Array.isArray(comment.replies)
      ? comment.replies.slice(0, 200).map((reply) => ({
          id: String(reply?.id || `reply_${Math.random().toString(36).slice(2, 8)}`).slice(0, 128),
          author: reply?.author && typeof reply.author === 'object'
            ? {
                id: String(reply.author.id || 'user').slice(0, 128),
                name: String(reply.author.name || 'User').slice(0, 128),
                email: isValidEmail(reply.author.email) ? reply.author.email : null,
                avatar: reply.author.avatar ? String(reply.author.avatar).slice(0, 8) : 'U',
                color: /^#[0-9a-fA-F]{3,8}$/.test(String(reply.author.color || '')) ? reply.author.color : '#2383e2'
              }
            : null,
          text: String(reply?.text || '').slice(0, 8000),
          createdAt: Number(reply?.createdAt) || Date.now()
        }))
      : [];

    cleanComments.push({
      id: String(comment.id).slice(0, 128),
      pageId: String(comment.pageId).slice(0, 128),
      blockId: isSafeIdentifier(comment.blockId) ? comment.blockId : null,
      author,
      text: String(comment.text || '').slice(0, 8000),
      createdAt: Number(comment.createdAt) || Date.now(),
      resolved: Boolean(comment.resolved),
      replies
    });
  }

  const user = body.user && typeof body.user === 'object'
    ? {
        name: String(body.user.name || 'User').slice(0, 128),
        email: isValidEmail(body.user.email) ? body.user.email : null,
        picture: body.user.picture ? String(body.user.picture).slice(0, 2048) : null,
        avatar: body.user.avatar ? String(body.user.avatar).slice(0, 8) : 'U',
        color: /^#[0-9a-fA-F]{3,8}$/.test(String(body.user.color || '')) ? body.user.color : '#2383e2'
      }
    : null;

  // Tombstones of the comments that were deleted on another device
  const cleanDeletedCommentIds = Array.isArray(body.deletedCommentIds)
    ? body.deletedCommentIds.filter((id) => isSafeIdentifier(id)).slice(0, 2000)
    : [];

  return {
    ok: true,
    payload: {
      pages: cleanPages,
      trash: cleanTrash,
      comments: cleanComments,
      deletedCommentIds: cleanDeletedCommentIds,
      workspaceSettings: settings,
      user
    }
  };
};
