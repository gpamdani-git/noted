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
  const linked = existsSync(projectFile) ? JSON.parse(readFileSync(projectFile, 'utf-8')) : null;
  const projectId = process.env.VERCEL_PROJECT_ID || linked?.projectId;
  const orgId = process.env.VERCEL_ORG_ID || linked?.orgId;

  if (!token) {
    console.log('\nVERCEL_TOKEN belum ada, jadi variabel server tidak bisa dikirim.');
  } else if (!projectId) {
    console.log('\nProject Vercel belum terhubung. Jalankan "npx vercel link" lebih dulu, atau set VERCEL_PROJECT_ID.');
  } else {
    console.log('\nMengirim variabel server ke Vercel...');
    for (const item of SERVER_VARS) {
      if (!item.server) continue;
      const value = localEnv[item.key];
      if (!value) continue;
      const args = ['vercel', 'env', 'add', item.key, 'production'];
      if (orgId) args.push('--scope', orgId);
      const result = spawnSync('npx', args, {
        cwd: rootDir,
        input: `${value}\n`,
        env: { ...process.env, VERCEL_TOKEN: token, VERCEL_PROJECT_ID: projectId }
      });
      const ok = result.status === 0;
      console.log(`  ${ok ? 'OK   ' : 'GAGAL'} ${item.key}`);
      if (!ok) console.log(String(result.stderr || '').split('\n').slice(0, 3).join('\n'));
    }
    console.log('\nSelesai. Deploy ulang agar variabel baru dipakai:  npx vercel --prod');
  }
} else {
  console.log('\nUntuk mengirim variabel yang sama ke server:  node scripts/check-env.mjs --push');
}
