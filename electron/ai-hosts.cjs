// Central AI request policy for the desktop bridge.
//
// The renderer runs without CORS restrictions when it asks the main process to
// perform a request, so every privileged AI request must be validated against
// an explicit host allowlist. Without this check the IPC channel could be
// abused as a general purpose proxy (SSRF) to reach internal services such as
// cloud metadata endpoints or admin panels.
//
// The allowlist is intentionally shared by every privileged AI channel
// (`ai:fetch` and `ai:fetch-stream`) so the policy cannot drift between them.

const DEFAULT_AI_ALLOWED_HOSTS = [
  // Local LLM runtimes (Ollama, LM Studio)
  'localhost',
  '127.0.0.1',
  '::1',
  // Cloud model providers
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.groq.com',
  'api.mistral.ai',
  'openrouter.ai',
  'api.deepseek.com',
  'api.together.xyz',
  'api.fireworks.dev'
];

const getAiAllowedHosts = () => {
  const configured = (process.env.AI_ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_AI_ALLOWED_HOSTS, ...configured]);
};

// URL.hostname keeps the brackets around IPv6 literals ("[::1]"), so the
// hostname is normalized before it is compared against the allowlist.
const normalizeHostname = (hostname) =>
  String(hostname || '').toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

/**
 * Validates a URL against the AI request policy.
 * @returns {{ok: true, url: URL} | {ok: false, error: string}}
 */
const isAllowedAiUrl = (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: 'Invalid request URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: `Unsupported protocol: ${parsed.protocol}` };
  }

  if (!getAiAllowedHosts().has(normalizeHostname(parsed.hostname))) {
    return {
      ok: false,
      error: `Host is not allowed by the AI request policy: ${parsed.hostname}`
    };
  }

  return { ok: true, url: parsed };
};

module.exports = {
  DEFAULT_AI_ALLOWED_HOSTS,
  getAiAllowedHosts,
  normalizeHostname,
  isAllowedAiUrl
};
