#!/usr/bin/env node
// Checks that the environment is complete.
//
// The login broke once because the deployed server had no SESSION_SECRET, and
// nothing in the app said which variable was missing. This script reports the
// state of the local environment and prints the exact commands for the server.
//
// Usage:
//   node scripts/check-env.mjs            report the local environment
//   node scripts/check-env.mjs --push     also set the variables on Vercel
//
// --push needs VERCEL_TOKEN and either a linked project (.vercel/project.json)
// or VERCEL_PROJECT_ID and VERCEL_ORG_ID.

import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shouldPush = process.argv.includes('--push');

const readLocalEnv = () => {
  const envPath = path.join(rootDir, '.env');
  if (!existsSync(envPath)) return {};
  const values = {};
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
};

const localEnv = readLocalEnv();

const SERVER_VARS = [
  {
    key: 'SESSION_SECRET',
    required: true,
    server: true,
    hint: 'Menandatangani token sesi. Minimal 16 karakter. Buat dengan: openssl rand -hex 32'
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    required: true,
    server: true,
    hint: 'Client id OAuth Google. Harus sama dengan VITE_GOOGLE_CLIENT_ID.'
  },
  {
    key: 'DATABASE_URL',
    required: false,
    server: true,
    hint: 'Koneksi PostgreSQL. Tanpa ini server berjalan dalam mode vault lokal.'
  },
  {
    key: 'ALLOWED_ORIGINS',
    required: false,
    server: true,
    hint: 'Origin yang boleh memanggil API, dipisah koma. Sertakan URL aplikasi itu sendiri.'
  },
  {
    key: 'AI_ALLOWED_HOSTS',
    required: false,
    server: true,
    hint: 'Host tambahan yang boleh dijangkau bridge AI di Electron.'
  },
  {
    key: 'VITE_GOOGLE_CLIENT_ID',
    required: true,
    server: false,
    hint: 'Client id OAuth Google untuk sisi browser.'
  },
  {
    key: 'VITE_APP_URL',
    required: false,
    server: false,
    hint: 'URL publik server Noted, dipakai app desktop dan build mobile.'
  }
];

const localIssues = [];
const serverIssues = [];

console.log('\nEnvironment lokal (.env)\n');
for (const item of SERVER_VARS) {
  const value = localEnv[item.key] || '';
  const filled = value.length > 0;
  const target = item.server ? serverIssues : localIssues;
  if (item.required && !filled) target.push(item);

  const mark = filled ? 'terisi' : 'kosong';
  const scope = item.server ? 'server' : 'klien';
  console.log(`  ${filled ? 'OK  ' : 'KOSONG'}  ${item.key.padEnd(24)} ${mark}  (${scope})`);
}

const printIssue = (item) => {
  console.log(`  - ${item.key}: ${item.hint}`);
};

if (localIssues.length > 0) {
  console.log('\nVariable lokal yang wajib diisi:');
  localIssues.forEach(printIssue);
}

if (serverIssues.length > 0) {
  console.log('\nVariable server yang wajib diisi (Vercel / deployment):');
  serverIssues.forEach(printIssue);
}

if (localIssues.length === 0 && serverIssues.length === 0) {
  console.log('\nLokal lengkap. Pastikan server deployment punya variabel yang sama.');
}

// --- Push to Vercel ------------------------------------------------------
if (shouldPush) {
  const token = process.env.VERCEL_TOKEN;
  const projectFile = path.join(rootDir, '.vercel', 'project.json');
  const repoFile = path.join(rootDir, '.vercel', 'repo.json');
  // A linked project has either project.json (single project) or repo.json
  // (repo based linking).
  const linked = existsSync(projectFile)
    ? JSON.parse(readFileSync(projectFile, 'utf-8'))
    : existsSync(repoFile)
      ? JSON.parse(readFileSync(repoFile, 'utf-8'))
      : null;
  const projectId =
    process.env.VERCEL_PROJECT_ID ||
    linked?.projectId ||
    linked?.projects?.[0]?.id ||
    null;
  const orgId = process.env.VERCEL_ORG_ID || linked?.orgId || linked?.projects?.[0]?.orgId || null;

  // The CLI can be used without a personal token when it is already signed in.
  // The token is only needed for an unattended run, for example in CI.
  const whoAmI = spawnSync('vercel', ['whoami'], { cwd: rootDir, encoding: 'utf-8' });
  const cliUser = whoAmI.status === 0 ? String(whoAmI.stdout || '').trim().split('\n').pop() : '';
  const authenticated = Boolean(token) || Boolean(cliUser);

  if (!authenticated) {
    console.log('\nCLI Vercel belum terautentikasi dan VERCEL_TOKEN tidak ada.');
    console.log('Jalankan "vercel login" sekali, atau set VERCEL_TOKEN untuk penggunaan tanpa interaksi.');
  } else if (!projectId) {
    console.log('\nProject Vercel belum terhubung. Jalankan "npx vercel link" lebih dulu, atau set VERCEL_PROJECT_ID.');
  } else {
    console.log(`\nMengirim variabel ke Vercel sebagai ${token ? 'token' : cliUser}...`);
    for (const item of SERVER_VARS) {
      const value = localEnv[item.key];
      if (!value) continue;
      // A VITE_ variable is exposed to the browser, so Vercel refuses to
      // store it as a secret. Those are stored as a plain config value.
      const isPublic = item.key.startsWith('VITE_');

      const args = [
        'env', 'add', item.key,
        '--value', value,
        '--environment', 'production,preview',
        '--force', '--yes'
      ];
      if (isPublic) args.push('--type', 'config');
      else args.push('--sensitive');
      if (orgId) args.push('--scope', orgId);
      const result = spawnSync('vercel', args, {
        cwd: rootDir,
        encoding: 'utf-8',
        env: {
          ...process.env,
          ...(token ? { VERCEL_TOKEN: token } : {}),
          // The CLI refuses to run when only one of the two is given.
          ...(projectId ? { VERCEL_PROJECT_ID: projectId } : {}),
          ...(orgId ? { VERCEL_ORG_ID: orgId } : {})
        }
      });

      // The CLI can exit with 0 and still report a failure in its output, so
      // the result is read from the response as well.
      const output = String(result.stdout || '') + String(result.stderr || '');
      const reportedError = /"status"\s*:\s*"error"/.test(output) || /A variable with the name/.test(output);
      const ok = result.status === 0 && !reportedError;

      console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${item.key}`);
      if (!ok) {
        const detail = output
          .split('\n')
          .filter((line) => line.trim() && !line.includes('Vercel CLI'))
          .slice(0, 3)
          .join('\n');
        if (detail) console.log(`        ${detail}`);
      }
    }
    console.log('\nSelesai. Variabel baru dipakai setelah deploy ulang:  npx vercel --prod');
  }
} else {
  console.log('\nUntuk mengirim variabel yang sama ke server:  node scripts/check-env.mjs --push');
}
