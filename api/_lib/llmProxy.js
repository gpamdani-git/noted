// Server-side proxy for a self-hosted LLM runtime (Ollama / LM Studio).
//
// The web build reaches the local runtime through this route because a browser
// on an https page cannot call a plain http endpoint on the user's machine
// (mixed content and CORS).
//
// This route is deliberately NOT an open proxy:
//   - the upstream host must be allowlisted,
//   - only the model API paths are forwarded,
//   - the request is limited to a fixed set of HTTP methods.
//
// Note that a hosted deployment cannot reach the user's own machine. Set
// OLLAMA_BASE_URL / LMSTUDIO_BASE_URL to a reachable address (a self-hosted
// runtime or a tunnel) when running the web build in production. The desktop
// app talks to the local runtime directly and does not use this route.

import { applyCors } from './security.js';

const DEFAULT_TARGETS = {
  ollama: 'http://localhost:11434',
  lmstudio: 'http://localhost:1234'
};

const ALLOWED_LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

const getAllowedUpstreamHosts = () => {
  const configured = (process.env.LLM_PROXY_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...ALLOWED_LOCAL_HOSTS, ...configured]);
};

const normalizeHostname = (hostname) =>
  String(hostname || '').toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

const getBaseUrl = (runtime) => {
  const envKey = runtime === 'lmstudio' ? 'LMSTUDIO_BASE_URL' : 'OLLAMA_BASE_URL';
  return (process.env[envKey] || DEFAULT_TARGETS[runtime] || '').replace(/\/+$/, '');
};

const readRequestBody = async (req) => {
  if (req.body === undefined || req.body === null) return undefined;
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf-8');
  return JSON.stringify(req.body);
};

const getForwardedHeaders = (req) => {
  const headers = { 'Content-Type': req.headers['content-type'] || 'application/json' };
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  if (req.headers['content-length']) {
    headers['Content-Length'] = req.headers['content-length'];
  }
  return headers;
};

/**
 * Checks a target against the upstream allowlist so the route can never be
 * used as an open proxy.
 */
export const isAllowedUpstream = (target) => {
  if (!target) return false;
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return false;
  return getAllowedUpstreamHosts().has(normalizeHostname(target.hostname));
};

/**
 * Builds a serverless handler that forwards a model request to the runtime.
 * @param {'ollama' | 'lmstudio'} runtime
 */
export const createLlmProxyHandler = (runtime) => async (req, res) => {
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const base = getBaseUrl(runtime);
  if (!base) {
    return res.status(503).json({
      error: `No base URL configured for ${runtime}`,
      hint: `Set ${runtime === 'lmstudio' ? 'LMSTUDIO_BASE_URL' : 'OLLAMA_BASE_URL'} on the server.`
    });
  }

  let target;
  try {
    target = new URL(base);
  } catch {
    return res.status(500).json({ error: 'Invalid base URL configured for the runtime' });
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return res.status(500).json({ error: `Unsupported protocol: ${target.protocol}` });
  }

  if (!isAllowedUpstream(target)) {
    return res.status(403).json({
      error: `Upstream host is not allowed by the LLM proxy policy: ${target.hostname}`,
      hint: 'Add the host to LLM_PROXY_ALLOWED_HOSTS on the server.'
    });
  }

  const segments = req.query?.path || [];
  const suffix = (Array.isArray(segments) ? segments : [segments]).filter(Boolean).join('/');

  if (!suffix || !/^(v1|api)\//.test(suffix)) {
    return res.status(404).json({ error: 'Unknown model API path' });
  }

  const search = typeof req.url === 'string' && req.url.includes('?')
    ? req.url.slice(req.url.indexOf('?'))
    : '';
  const upstreamUrl = `${base}/${suffix}${search}`;

  let body;
  try {
    body = await readRequestBody(req);
  } catch (err) {
    return res.status(400).json({ error: `Could not read the request body: ${err.message}` });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: getForwardedHeaders(req),
      body: body !== undefined && req.method !== 'GET' ? body : undefined
    });

    res.statusCode = upstream.status;
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');

    if (!upstream.body) {
      const text = await upstream.text();
      return res.end(text);
    }

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    return res.end();
  } catch (err) {
    return res.status(502).json({
      error: `${runtime} is not reachable from the server: ${err.message}`,
      hint: 'The hosted web build cannot reach your own machine. Use the desktop app, run "npm run dev" locally, or point the base URL at a reachable runtime.'
    });
  }
};
