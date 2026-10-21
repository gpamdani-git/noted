#!/usr/bin/env node
// Generates qa-report.html from the real test runs.
//
// The report used to be written by hand, which meant the numbers in it could
// drift away from the code. This script runs the unit suite and the browser
// suite, reads their reports and writes the page, so the numbers are always
// the numbers of the current code.
//
// Usage: node scripts/generate-qa-report.mjs [--skip-e2e]

import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skipE2e = process.argv.includes('--skip-e2e');

const run = (command, args, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      ...options
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });

// --- Unit tests ---------------------------------------------------------
console.log('Running the unit suite...');
const vitestJsonPath = path.join(rootDir, 'node_modules', '.vitest-qa-report.json');
const vitest = await run('npx', [
  'vitest', 'run', '--reporter=json', `--outputFile=${vitestJsonPath}`
]);

let unit = { files: 0, tests: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0, suites: [] };

if (existsSync(vitestJsonPath)) {
  const raw = JSON.parse(await readFile(vitestJsonPath, 'utf-8'));
  const results = raw.testResults || [];
  unit.durationMs = raw.startTime && raw.testFileResults
    ? Math.max(0, Date.now() - raw.startTime)
    : 0;

  for (const file of results) {
    const assertions = file.assertionResults || [];
    const filePassed = assertions.filter((a) => a.status === 'passed').length;
    const fileFailed = assertions.filter((a) => a.status === 'failed').length;
    const fileSkipped = assertions.filter((a) => a.status === 'pending' || a.status === 'skipped').length;

    unit.files += 1;
    unit.tests += assertions.length;
    unit.passed += filePassed;
    unit.failed += fileFailed;
    unit.skipped += fileSkipped;

    unit.suites.push({
      file: path.relative(rootDir, file.name || file.testFilePath || 'unknown'),
      total: assertions.length,
      passed: filePassed,
      failed: fileFailed,
      skipped: fileSkipped
    });
  }
} else {
  console.error('The unit report could not be read.');
}

// --- Browser tests ------------------------------------------------------
let e2e = { files: 0, tests: 0, passed: 0, failed: 0, skipped: 0, durationMs: 0, suites: [], ran: false };

if (!skipE2e) {
  console.log('Running the browser suite...');
  const playwrightJsonPath = path.join(rootDir, 'node_modules', '.playwright-qa-report.json');
  const playwright = await run('npx', [
    'playwright', 'test', '--reporter=json'
  ], { env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: playwrightJsonPath } });

  if (existsSync(playwrightJsonPath)) {
    const raw = JSON.parse(await readFile(playwrightJsonPath, 'utf-8'));
    e2e.ran = true;
    e2e.durationMs = raw.stats?.duration || 0;

    const walk = (suite, file) => {
      const specs = suite.specs || [];
      for (const spec of specs) {
        const expected = (spec.ok === true) ? 1 : 0;
        const failed = spec.ok === false ? 1 : 0;
        const skipped = spec.ok === undefined || spec.tests?.every((t) => t.status === 'skipped') ? 1 : 0;
        e2e.tests += 1;
        e2e.passed += expected;
        e2e.failed += failed;
        e2e.skipped += skipped;
        e2e.suites.push({
          file: file || 'e2e',
          title: spec.title,
          status: skipped ? 'skipped' : failed ? 'failed' : 'passed'
        });
      }
      for (const child of suite.suites || []) {
        walk(child, child.file ? path.relative(rootDir, child.file) : file);
      }
    };

    const seenFiles = new Set();
    for (const suite of raw.suites || []) {
      const file = suite.file ? path.relative(rootDir, suite.file) : 'e2e';
      if (!seenFiles.has(file)) {
        seenFiles.add(file);
        e2e.files += 1;
      }
      walk(suite, file);
    }
  } else {
    console.error('The browser report could not be read.');
  }
} else {
  console.log('Skipping the browser suite.');
}

// --- Which modules have a test ------------------------------------------
const sourceRoots = ['src', 'api', 'electron'];
const sourceFiles = [];

const walkDir = async (dir) => {
  if (!existsSync(dir)) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'test' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(full);
    } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name) && !/\.config\./.test(entry.name)) {
      sourceFiles.push(full);
    }
  }
};

for (const root of sourceRoots) {
  await walkDir(path.join(rootDir, root));
}

const testFiles = existsSync(path.join(rootDir, 'src/test'))
  ? (await readdir(path.join(rootDir, 'src/test'))).filter((f) => /\.test\.[jt]sx?$/.test(f))
  : [];

const testedModules = new Set();
for (const testFile of testFiles) {
  const content = await readFile(path.join(rootDir, 'src/test', testFile), 'utf-8');
  const matches = content.matchAll(/from\s+'([^']+)'/g);
  for (const match of matches) {
    const target = match[1];
    if (target.startsWith('.') || target.startsWith('..')) {
      const resolved = path.resolve(path.join(rootDir, 'src/test'), target);
      testedModules.add(resolved);
    }
  }
}

const untested = sourceFiles
  .map((f) => path.relative(rootDir, f))
  .filter((f) => {
    const full = path.join(rootDir, f);
    if (testedModules.has(full)) return false;
    // A file counts as covered when another file of the same folder imports it
    return ![...testedModules].some((t) => path.dirname(t) === path.dirname(full));
  })
  .sort();

const moduleCoverage = sourceFiles.length === 0
  ? 0
  : Math.round(((sourceFiles.length - untested.length) / sourceFiles.length) * 100);

// --- Report --------------------------------------------------------------
const totalTests = unit.tests + e2e.tests;
const totalPassed = unit.passed + e2e.passed;
const totalFailed = unit.failed + e2e.failed;
const totalSkipped = unit.skipped + e2e.skipped;
const allGreen = totalFailed === 0;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const statusPill = (status) => {
  if (status === 'passed') return '<span class="qa-pill qa-pass">PASS</span>';
  if (status === 'failed') return '<span class="qa-pill qa-fail">FAIL</span>';
  return '<span class="qa-pill qa-skip">SKIP</span>';
};

const suiteRows = unit.suites
  .map((s) => `
        <tr>
          <td class="qa-file">${escapeHtml(s.file)}</td>
          <td>${s.total}</td>
          <td class="qa-ok">${s.passed}</td>
          <td class="${s.failed ? 'qa-bad' : ''}">${s.failed}</td>
          <td class="${s.skipped ? 'qa-warn' : ''}">${s.skipped}</td>
          <td>${statusPill(s.failed ? 'failed' : 'passed')}</td>
        </tr>`)
  .join('');

const e2eRows = e2e.suites
  .map((s) => `
        <tr>
          <td class="qa-file">${escapeHtml(s.file)}</td>
          <td colspan="4">${escapeHtml(s.title)}</td>
          <td>${statusPill(s.status)}</td>
        </tr>`)
  .join('');

const untestedRows = untested
  .map((f) => `<li><code>${escapeHtml(f)}</code></li>`)
  .join('');

const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>noted - QA Report</title>
<style>
  :root {
    --bg: #ffffff;
    --fg: #37352f;
    --muted: #787774;
    --border: #e9e9e7;
    --card: #ffffff;
    --code-bg: #f7f6f3;
    --pass: #0f7b6c;
    --fail: #c0392b;
    --warn: #b8860b;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #191919; --fg: #e9e9e7; --muted: #9b9b9b; --border: #2f2f2f; --card: #202020; --code-bg: #252525; }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 24px 80px;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    line-height: 1.6;
  }
  .wrap { max-width: 940px; margin: 0 auto; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 36px 0 12px; }
  .sub { color: var(--muted); font-size: 13px; margin: 0 0 28px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .card { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; background: var(--card); }
  .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
  .card-value { font-size: 24px; font-weight: 600; margin-top: 2px; }
  .card-note { font-size: 11.5px; color: var(--muted); }
  .banner { margin: 20px 0 0; padding: 12px 16px; border-radius: 8px; font-size: 13.5px; border: 1px solid var(--border); }
  .banner.ok { background: rgba(15, 123, 108, 0.08); border-color: rgba(15, 123, 108, 0.3); }
  .banner.bad { background: rgba(192, 57, 43, 0.08); border-color: rgba(192, 57, 43, 0.3); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
  .qa-file { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .qa-ok { color: var(--pass); }
  .qa-bad { color: var(--fail); font-weight: 600; }
  .qa-warn { color: var(--warn); }
  .qa-pill { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
  .qa-pass { background: rgba(15, 123, 108, 0.12); color: var(--pass); }
  .qa-fail { background: rgba(192, 57, 43, 0.12); color: var(--fail); }
  .qa-skip { background: rgba(184, 134, 11, 0.14); color: var(--warn); }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; background: var(--code-bg); padding: 1px 5px; border-radius: 4px; }
  ul.qa-list { font-size: 12.5px; color: var(--muted); columns: 2; padding-left: 18px; }
  footer { margin-top: 40px; font-size: 12px; color: var(--muted); }
</style>
</head>
<body>
<div class="wrap">
  <h1>noted &mdash; QA Report</h1>
  <p class="sub">
    Dihasilkan otomatis oleh <code>node scripts/generate-qa-report.mjs</code> pada ${generatedAt}.
    Angka di halaman ini berasal dari eksekusi test sungguhan, bukan dari penulisan manual.
  </p>

  <div class="cards">
    <div class="card">
      <div class="card-label">Total skenario</div>
      <div class="card-value">${totalTests}</div>
      <div class="card-note">${unit.tests} unit + ${e2e.tests} browser</div>
    </div>
    <div class="card">
      <div class="card-label">Lulus</div>
      <div class="card-value" style="color: var(--pass)">${totalPassed}</div>
      <div class="card-note">${totalFailed} gagal &middot; ${totalSkipped} dilewati</div>
    </div>
    <div class="card">
      <div class="card-label">Test file</div>
      <div class="card-value">${unit.files + e2e.files}</div>
      <div class="card-note">${unit.files} Vitest + ${e2e.files} Playwright</div>
    </div>
    <div class="card">
      <div class="card-label">Cakupan modul</div>
      <div class="card-value">${moduleCoverage}%</div>
      <div class="card-note">${sourceFiles.length - untested.length} dari ${sourceFiles.length} file punya test</div>
    </div>
    <div class="card">
      <div class="card-label">Durasi</div>
      <div class="card-value">${((unit.durationMs + e2e.durationMs) / 1000).toFixed(1)}s</div>
      <div class="card-note">unit + browser</div>
    </div>
  </div>

  <div class="banner ${allGreen ? 'ok' : 'bad'}">
    ${allGreen
      ? `Semua ${totalPassed} skenario lulus. ${totalSkipped} skenario dilewati.`
      : `${totalFailed} skenario gagal dari ${totalTests}.`}
  </div>

  <h2>Unit &amp; integrasi (Vitest)</h2>
  <table>
    <thead>
      <tr><th>File</th><th>Test</th><th>Lulus</th><th>Gagal</th><th>Dilewati</th><th>Status</th></tr>
    </thead>
    <tbody>${suiteRows}</tbody>
  </table>

  <h2>Browser end-to-end (Playwright)</h2>
  ${e2e.ran
    ? `<table>
    <thead>
      <tr><th>File</th><th colspan="4">Skenario</th><th>Status</th></tr>
    </thead>
    <tbody>${e2eRows}</tbody>
  </table>`
    : '<p class="sub">Skenario browser tidak dijalankan pada pembuatan laporan ini.</p>'}

  <h2>Cakupan modul</h2>
  <p class="sub">
    ${moduleCoverage}% dari ${sourceFiles.length} file sumber punya test yang mengimpornya.
    Modul di bawah ini belum punya test: ${untested.length} file.
  </p>
  ${untested.length
    ? `<ul class="qa-list">${untestedRows}</ul>`
    : '<p class="sub">Semua modul sumber sudah punya test.</p>'}

  <footer>
    Jalankan ulang laporan ini dengan <code>npm run qa:report</code>.
    Suite unit dijalankan dengan <code>npm test</code>, suite browser dengan <code>npm run test:e2e</code>.
  </footer>
</div>
</body>
</html>
`;

await writeFile(path.join(rootDir, 'qa-report.html'), html, 'utf-8');

console.log('');
console.log(`Unit   : ${unit.passed}/${unit.tests} lulus di ${unit.files} file`);
console.log(`Browser: ${e2e.passed}/${e2e.tests} lulus di ${e2e.files} file`);
console.log(`Cakupan modul: ${moduleCoverage}% (${untested.length} file tanpa test)`);
console.log('qa-report.html ditulis');
