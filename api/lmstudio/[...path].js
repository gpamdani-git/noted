// Vercel Serverless Function: proxy for a self-hosted LM Studio runtime.
// Handles /api/lmstudio/* (for example /api/lmstudio/v1/chat/completions).
//
// The upstream host must be allowlisted, so this route cannot be used as an
// open proxy. See api/_lib/llmProxy.js for the full policy.

import { createLlmProxyHandler } from '../_lib/llmProxy.js';

const handler = createLlmProxyHandler('lmstudio');

export default async function reqHandler(req, res) {
  return handler(req, res);
}
