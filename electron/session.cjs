// Session token verification for the Noted Electron main process (CommonJS)
// Mirrors the server implementation in api/lib/security.js: HMAC-SHA256 signed
// payload with an expiry timestamp. The signing secret is never bundled into
// the app - it is read from the environment or the local user configuration.

const crypto = require('node:crypto');

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const sign = (payloadB64, secret) =>
  base64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());

/**
 * Verifies a Noted session token.
 * @returns {{sub: string, email: string, name: string, picture: string} | null}
 */
const verifySessionToken = (token, secret) => {
  if (!secret || typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const expectedBuf = Buffer.from(sign(payloadB64, secret));
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

module.exports = { verifySessionToken };
