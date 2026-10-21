#!/usr/bin/env node
// Mengekstrak permukaan Electron dari hasil REA: bridge API, channel IPC,
// jendela browser, preferensi web dan fakta storage.
//
// Hasil analyze_javascript-application Notion 7.39.0.
//
// Bridge API  : api_key + anggota yang diekspos ke renderer
// IPC         : channel literal, handler main dan transmisi renderer
// Jendela     : BrowserWindow + webPreferences tiap jendela
// Storage     : kunci localStorage / sessionStorage / cookie yang dibaca

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'docs', 'rea');

const raw = JSON.parse(readFileSync(path.join(outDir, 'notion-7.39.0.rea.jsonl'), 'utf-8'));
const g = raw.data.normalized_result.graph;

const bridges = [];
const ipc = [];
const windows = [];
const storage = [];

for (const node of g.nodes || []) {
  const kind = node.kind;
  const ident = node.identity || {};

  if (kind === 'context-bridge-api') {
    for (const obs of node.observations || []) {
      const props = obs.properties || {};
      bridges.push({
        api_key: obs.api_key || props.api_key || obs.label,
        label: obs.label,
        world: obs.world || props.world,
        api_status: obs.api_status || props.api_status,
        resolution_basis: obs.resolution_basis || props.resolution_basis,
        members: props.members || obs.members || []
      });
    }
  }

  if (kind === 'ipc-channel' || kind === 'ipc-handler') {
    ipc.push({
      kind,
      name: ident.namespace || ident.channel || ident.name || '',
      module: ident.module_path || '',
      observations: node.observations || []
    });
  }

  if (kind === 'electron-renderer' || kind === 'endpoint') {
    windows.push({
      kind,
      name: ident.namespace || ident.name || '',
      module: ident.module_path || '',
      observations: node.observations || []
    });
  }

  if (kind === 'storage') {
    for (const obs of node.observations || []) {
      storage.push({
        name: obs.name || obs.label || '',
        mechanism: obs.mechanism || '',
        module: ident.module_path || '',
        observations: node.observations || []
      });
    }
  }
}

// Ringkasan per bridge
const bridgeSummary = bridges.map((b) => ({
  api_key: b.api_key,
  world: b.world,
  members: b.members.length,
  member_names: b.members
}));

writeFileSync(
  path.join(outDir, 'bridge-apis.json'),
  JSON.stringify(bridgeSummary, null, 2),
  'utf-8'
);

writeFileSync(
  path.join(outDir, 'ipc-channels.json'),
  JSON.stringify(ipc, null, 2),
  'utf-8'
);

writeFileSync(
  path.join(outDir, 'windows.json'),
  JSON.stringify(windows, null, 2),
  'utf-8'
);

writeFileSync(
  path.join(outDir, 'storage-facts.json'),
  JSON.stringify(storage, null, 2),
  'utf-8'
);

// Daftar anggota bridge yang bisa diedit
const allMembers = [...new Set(bridges.flatMap((b) => b.members))].sort();
writeFileSync(path.join(outDir, 'bridge-members.txt'), allMembers.join('\n'), 'utf-8');

console.log('bridge API        :', bridges.length, 'api_key,', allMembers.length, 'anggota unik');
console.log('node IPC          :', ipc.length);
console.log('node window       :', windows.length);
console.log('node storage      :', storage.length);
for (const b of bridgeSummary) {
  console.log(`  - ${b.api_key} (${b.world}) ${b.members} anggota`);
}
