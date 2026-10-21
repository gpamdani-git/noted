# Bukti REA — Notion Desktop 7.39.0

Dokumen ini Holds bukti analisis reverse engineering terhadap **Notion Desktop
7.39.0 (macOS, arm64)**, aplikasi sasaran yang diclone oleh Noted.

## Isi

| Berkas | Isi |
| --- | --- |
| `notion-7.39.0.rea.jsonl` | Hasil mentah `rea analyze-javascript-application` (170 MB, **tidak** masuk git) |
| `symbols.tsv` | Indeks 87.193 simbol semantik: `module_path`, `kind`, `nama` |
| `bridge-apis.json` | 20 context-bridge API beserta anggota yang diekspos ke renderer |
| `bridge-members.txt` | 263 nama anggota bridge unik |
| `ipc-channels.json` | Node channel IPC dan handler main |
| `windows.json` | Jendela browser, webPreferences, preloads |
| `storage-facts.json` | Kunci localStorage / sessionStorage / cookie |
| `electron-surface.json` | Ringkasan dan statistik analisis |
| `limitations.txt` | Bagian yang **tidak** berhasil dianalisis REA (batas bukti) |

## Regenerasi

```bash
npx -y rea-agents@6.5.0 analyze-javascript-application \
  /Applications/Notion.app/Contents/Resources/app.asar \
  --format jsonl --max-semantic-nodes 250000 \
  --max-semantic-nodes-per-file 60000 --analysis-timeout-ms 900000 \
  --integrity-policy record-and-continue --full-output \
  > docs/rea/notion-7.39.0.rea.jsonl

node scripts/rea-extract-index.mjs    # symbols.tsv + indeks
node scripts/rea-extract-surface.mjs  # bridge, ipc, windows, storage
```

`--integrity-policy record-and-continue` diperlukan karena beberapa addon
native di dalam asar Notion ditandatangani ulang setelah arsip dibuat, jadi
hash yang tertulis tidak cocok dengan byte yang ada. Bukti ditandai untrusted.

## Batasan yang perlu diketahui

`limitations.txt` mencatat berkas yang tidak bisa dianalisis karena batas
memori. Jangan mengklaim paritas untuk area yang tidak ada buktinya di sini.
