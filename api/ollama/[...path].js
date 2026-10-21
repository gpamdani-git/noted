// Vercel Serverless Function: proxy for a self-hosted Ollama runtime.
// Handles /api/ollama/* (for example /api/ollama/v1/chat/completions).
//
// The upstream host must be allowlisted, so this route cannot be used as an
// open proxy. See api/_lib/llmProxy.js for the full policy.

import { createLlmProxyHandler } from '../_lib/llmProxy.js';

const handler = createLlmProxyHandler('ollama');

export default async function reqHandler(req, res) {
  return handler(req, res);
}
