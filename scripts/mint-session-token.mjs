// Prints a session token that the local Noted server accepts.
// The signature is created with the same secret the server uses, so the
// token is valid for the running server.
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync('.env', 'utf-8').split('\n')) {
  const i = line.indexOf('=');
  if (i < 1) continue;
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  env[line.slice(0, i).trim()] = v;
}

const secret = env.SESSION_SECRET;
if (!secret) {
  console.error('SESSION_SECRET is missing');
  process.exit(1);
}

const base64url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: 'google_test_desktop',
  email: 'desktop.test@gmail.com',
  name: 'Desktop Test',
  picture: null,
  iat: now,
  exp: now + 60 * 60 * 24 * 30
};

const payloadB64 = base64url(JSON.stringify(payload));
const signature = base64url(crypto.createHmac('sha256', secret).update(payloadB64).digest());

console.log(`${payloadB64}.${signature}`);
