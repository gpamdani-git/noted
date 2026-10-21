#!/usr/bin/env node
// Memecah hasil REA yang besar menjadi berkas-berkas kecil yang bisa di-grep.
//
// Hasil analyze_javascript-application Notion 7.39.0 berukuran 170 MB dalam satu
// JSON, jadi setiap pemeriksaan harus memuat ulang semuanya. Skrip ini membuat
// indeks simbol, daftar ekspor, ringkasan IPC dan fakta storage supaya
// pekerjaan berikutnya cepat.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'docs', 'rea');
mkdirSync(outDir, { recursive: true });

const raw = JSON.parse(readFileSync(path.join(outDir, 'notion-7.39.0.rea.jsonl'), 'utf-8'));
const data = raw.data.normalized_result;

// 1. Indeks simbol: module | kind | nama
const symbolLines = [];
const seen = new Set();

for (const node of data.semantic_graph?.nodes || []) {
  const id = node.identity || {};
  const name = id.namespace || id.role_key || '';
  const file = id.module_path || '';
  const key = `${file}|${node.kind}|${name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  symbolLines.push(`${file}\t${node.kind}\t${name}`);
}

for (const node of data.graph?.nodes || []) {
  const id = node.identity || {};
  const name = id.namespace || '';
  const file = id.module_path || id.relative_path || '';
  const key = `${file}|${node.kind}|${name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  symbolLines.push(`${file}\t${node.kind}\t${name}`);
}

symbolLines.sort();
writeFileSync(path.join(outDir, 'symbols.tsv'), symbolLines.join('\n'), 'utf-8');

// 2. Nama-nama yangdiekspor, unik
const exports = new Set();
for (const line of symbolLines) {
  const [file, kind, name] = line.split('\t');
  if (!name) continue;
  if (kind === 'javascript-export' || kind === 'export' || /export/i.test(kind)) {
    exports.add(name);
  }
}
writeFileSync(path.join(outDir, 'exports.txt'), [...exports].sort().join('\n'), 'utf-8');

// 3. Ringkasan IPC, bridge, window
writeFileSync(
  path.join(outDir, 'electron-surface.json'),
  JSON.stringify(
    {
      summary: data.summary,
      statistics: data.statistics,
      integrity_contradictions: data.integrity_contradictions,
      coverage: data.graph?.coverage,
      semantic_coverage: data.semantic_graph?.coverage
    },
    null,
    2
  ),
  'utf-8'
);

// 4. Fakta storage dan require edge per berkas
const storage = [];
const modules = [];
for (const node of data.graph?.nodes || []) {
  const sa = node.static_analysis;
  if (!sa) continue;
  const file = node.identity?.module_path || node.identity?.relative_path || 'unknown';
  modules.push(file);
  for (const entry of sa.storage || []) {
    storage.push(
      `${file}\t${entry.kind || ''}\t${entry.name || ''}\t${entry.mechanism || ''}`
    );
  }
}
writeFileSync(path.join(outDir, 'storage.tsv'), storage.join('\n'), 'utf-8');
writeFileSync(path.join(outDir, 'modules.txt'), [...new Set(modules)].sort().join('\n'), 'utf-8');

// 5. Daftar berkas yang teranalisis dan yang terpotong
const limits = (data.graph?.limitations || []).map((l) => String(l));
writeFileSync(path.join(outDir, 'limitations.txt'), limits.join('\n'), 'utf-8');

console.log('symbols.tsv      :', symbolLines.length, 'baris');
console.log('exports.txt      :', exports.size, 'nama');
console.log('storage.tsv      :', storage.length, 'fakta');
console.log('modules.txt      :', new Set(modules).size, 'berkas');
console.log('limitations.txt  :', limits.length);
