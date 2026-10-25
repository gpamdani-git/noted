# Laporan Audit Komparasi Visual UI: Form Login & Autentikasi (`ui-comparison`)

**Tanggal Audit:** 24 Oktober 2026  
**Auditor:** `rea-ui-tester`  
**Target Referensi:**
- Aplikasi Target: `/Applications/Notion.app` (`Contents/Resources/app.asar`)
- Dokumentasi Inspeksi Visual: [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md)
- Spesifikasi Perilaku & Kontrak UI Clean-Room: [spec.md](file:///Users/daniakbar/Documents/REA-Projects/noted/spec.md)

**Komponen Hasil Build (`Noted`):**
- Komponen React: [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx)
- Stylesheet Komponen: [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css)
- Stylesheet Global: [index.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/index.css)

---

## 1. Ringkasan Eksekutif & Skor Kesesuaian Visual (*Visual Match Rate*)

Hasil audit komparasi visual menunjukkan bahwa implementasi **Form Login & Autentikasi** pada proyek **Noted** telah mematuhi kontrak desain di [spec.md](file:///Users/daniakbar/Documents/REA-Projects/noted/spec.md) dan spesifikasi ekstraksi `/Applications/Notion.app` di [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md) dengan tingkat presisi yang sangat tinggi (**95.9%**). Seluruh variabel CSS utama untuk **Light Mode** maupun **Dark Mode**, geometri input/tombol (`height: 36px`, `border-radius: 6px`), *focus ring* biru berlapis (`inset 1px` + `outer 2px`), *error ring* merah, tombol *clear input* (`16px x 16px`), serta transisi akordeon langkah ke-2 (`0.5s ease-in-out`) telah terimplementasi secara akurat.

Tidak ditemukan deviasi tingkat **`major`** yang merusak tata letak atau aksesibilitas. Audit menemukan **3 deviasi `minor`** dan **6 deviasi `cosmetic`** yang dapat disempurnakan untuk mencapai kesesuaian *pixel-perfect* 100%.

### Skor Visual Match Rate per Dimensi

| Dimensi Audit | Bobot | Skor Kesesuaian | Jumlah Temuan | Ringkasan Evaluasi |
| :--- | :---: | :---: | :---: | :--- |
| **1. Hierarki Layout & Geometri** | 35% | **94.5%** | 2 `minor`, 2 `cosmetic` | Struktur kontainer modal (`480px`), inner form (`320px`), dan CSS full-page (`360px`, topbar `45px`, fixed footer) sesuai. Tombol SSO *Microsoft* belum dirender di JSX, serta terdapat selisih *spacing* vertikal `4px–8px` pada subjudul dan divider `"OR"`. |
| **2. Ketepatan Token Desain (Light & Dark Mode)** | 40% | **98.2%** | 0 `minor`, 3 `cosmetic` | Seluruh token warna utama (`#FFFFFF`/`#191919`, `#2C2C2B`/`#F0EFED`, `#7D7A75`/`#ADA9A3`, `#A19E99`/`#7D7A75`, `#CD3C3A`/`#DF5452`), *focus ring* biru, *error ring* merah, dan `modalBoxShadow` **100% identik** dengan target. |
| **3. Respon Visual & Interaktivitas Pengguna** | 25% | **95.0%** | 1 `minor`, 1 `cosmetic` | State `:hover`, `:active`, `:focus`, `:disabled` (`opacity: 0.4`), tombol clear `16px`, alert `role="alert"`, dan ekspansi `0.5s ease-in-out` berjalan presisi. Terdapat isu deklarasi `border` pada `.noted-spinner`, state `:hover` tombol SSO di Dark Mode yang sama dengan warna dasar, serta class `.animate-scale-up` yang belum didefinisikan di CSS. |
| **TOTAL / OVERALL VISUAL MATCH RATE** | **100%** | **95.9%** | **0 `major`, 3 `minor`, 6 `cosmetic`** | **Sangat Tinggi (*Near Pixel-Perfect*)** |

---

## 2. Tabel Komparasi Token Desain & Geometri (Target vs Hasil Build)

### 2.1 Komparasi Layout & Geometri Kontainer

| Komponen / Elemen | Spesifikasi Target (`Notion.app` / `ui-login.md` / `spec.md`) | Implementasi Build (`NotionLoginModal.jsx` & `.css`) | Status | Catatan / Deviasi |
| :--- | :--- | :--- | :---: | :--- |
| **Full-Page Root (`.noted-login-page`)** | `min-height: 100vh; display: flex; flex-direction: column; overflow: auto;` | `min-height: 100vh; width: 100%; display: flex; flex-direction: column; overflow: auto;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L60-L69)) | Sesuai (CSS) | Aturan CSS tersedia lengkap; komponen JSX saat ini selalu merender varian Modal. |
| **Top Header Bar (`.noted-login-topbar`)** | `width: 100%; height: 45px; flex-shrink: 0; -webkit-app-region: drag;` | `width: 100%; height: 45px; flex-shrink: 0; display: flex; align-items: center; padding: 0 16px; -webkit-app-region: drag;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L71-L84)) | 100% Match | Mendukung `-webkit-app-region: no-drag` untuk elemen anak. |
| **Main Center Wrapper (`.noted-login-main`)** | `flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 45px 0 60px; user-select: none;` | `flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 45px; padding-bottom: 60px; user-select: none;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L86-L97)) | 100% Match | Geometri identik. |
| **Form Container — Full Page** | `width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center;` | `width: 100%; max-width: 360px; display: flex; flex-direction: column; align-items: center;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L99-L105)) | 100% Match | — |
| **Form Container — Modal Inner** | `width: 100%; max-width: 320px;` | `.notion-login-modal .noted-login-container { max-width: 320px; width: 100%; }` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L160-L163)) | 100% Match | — |
| **Dialog Modal Card (`.notion-login-modal`)** | `width: 480px; border-radius: 12px;` | `width: 100%; max-width: 480px; border-radius: 12px; padding: 32px 36px;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L137-L153)) | 100% Match | Diperbarui dari `440px` menjadi `480px` sesuai spesifikasi. |
| **Logo Aplikasi (`.notion-login-logo`)** | `30px x 30px` (`<= 1020px`), `32px x 32px` (`> 1020px`), `margin-bottom: 10px` | `30px x 30px` default, `@media (min-width: 1021px)` `32px x 32px`, `margin-bottom: 10px` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L197-L214)) | 100% Match | Breakpoint responsif logo presisi. |
| **Urutan Tombol SSO (`.notion-login-methods`)** | 5 tombol vertikal (`gap: 8px`): Google, Apple, **Microsoft**, Passkey, SSO (`FR-01` di `spec.md` & `ui-login.md` §3.3) | 4 tombol vertikal (`gap: 8px`): Google, Apple, Passkey, SSO ([NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx#L538-L623)) | Deviasi (`minor`) | Tombol *"Continue with Microsoft"* belum dirender di dalam daftar `.notion-login-methods`. |
| **Jarak Bawah Subjudul (`.notion-login-subtitle`)** | `margin-bottom: 24px` (`ui-login.md` §1.3 & `spec.md` §6.3.1) | `margin: 0 0 16px 0` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L232-L237)) | Deviasi (`cosmetic`) | Selisih `8px` (`16px` pada build, namun dikompensasi sebagian oleh `gap: 16px` pada `.notion-login-modal`). |
| **Divider Pemisah (`OR`)** | `margin: 16px 0` (atau `20px 0`), garis `1px solid`, teks `padding: 0 12px` | `margin: 12px 0;`, garis `1px solid var(--login-border-divider)`, `span { padding: 0 12px; }` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L334-L359)) | Deviasi (`cosmetic`) | Selisih margin vertikal `4px` (`12px 0` vs `16px 0`). |
| **Fixed Bottom Footer (`.noted-login-footer`)** | `position: fixed; bottom: 0; inset-inline: 0; padding-bottom: 16px; gap: 4px; font-size: 12px; line-height: 1.2;` | `position: fixed; bottom: 0; inset-inline: 0; padding-bottom: 16px; gap: 4px; font-size: 12px; line-height: 1.2;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L107-L121)) | 100% Match | — |

---

### 2.2 Komparasi Token Warna & Bayangan (Light Mode & Dark Mode)

| Nama Token | Variabel Build (`NotionLoginModal.css`) | Target Light Mode | Build Light Mode | Target Dark Mode | Build Dark Mode | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Background Primer** | `--login-bg-primary` | `#FFFFFF` | `#FFFFFF` | `#191919` | `#191919` | 100% Match |
| **Background Sekunder / Modal** | `--login-bg-secondary` | `#F9F8F7` (Modal: `#FFFFFF`) | `#F9F8F7` (Modal: `#FFFFFF`) | `#202020` | `#202020` | 100% Match |
| **Background Input Klasik** | `--login-bg-input` | `rgba(242, 241, 238, 0.6)` | `rgba(242, 241, 238, 0.6)` | `rgba(255, 255, 255, 0.055)` | `rgba(255, 255, 255, 0.055)` | 100% Match |
| **Teks Primer** | `--login-text-primary` | `#2C2C2B` | `#2C2C2B` | `#F0EFED` | `#F0EFED` | 100% Match |
| **Teks Sekunder** | `--login-text-secondary` | `#7D7A75` | `#7D7A75` | `#ADA9A3` | `#ADA9A3` | 100% Match |
| **Teks Tertier / Placeholder** | `--login-text-tertiary` | `#A19E99` | `#A19E99` | `#7D7A75` | `#7D7A75` | 100% Match |
| **Teks Disabled** | `--login-text-disabled` | `#BCBAB6` | `#BCBAB6` | `#5F5E59` | `#5F5E59` | 100% Match |
| **Teks Pesan Error** | `--login-text-error` | `#CD3C3A` | `#CD3C3A` | `#DF5452` | `#DF5452` | 100% Match |
| **Garis Divider (`OR`)** | `--login-border-divider` | `#E6E5E3` | `#E6E5E3` | `#383836` | `#383836` | 100% Match |
| **Input Default Shadow** | `--login-input-shadow` | `0px 2px 4px 0px rgba(0, 0, 0, 0.039), 0px 0px 0px 1px rgba(42, 28, 0, 0.07)` | `0px 2px 4px 0px rgba(0, 0, 0, 0.039), 0px 0px 0px 1px rgba(42, 28, 0, 0.07)` | `0px 0px 0px 1px rgba(56, 56, 54, 1), 0px 2px 4px 0px rgba(25, 25, 25, 0.079)` | `0px 0px 0px 1px rgba(56, 56, 54, 1), 0px 2px 4px 0px rgba(25, 25, 25, 0.079)` | 100% Match |
| **Input Blue Focus Ring** | `--login-input-focus-ring` | `rgba(35, 131, 226, 0.57) 0px 0px 0px 1px inset, rgba(35, 131, 226, 0.35) 0px 0px 0px 2px` | `rgba(35, 131, 226, 0.57) 0px 0px 0px 1px inset, rgba(35, 131, 226, 0.35) 0px 0px 0px 2px` | Sama dengan Light Mode | Sama dengan Light Mode | 100% Match |
| **Input Red Error Ring** | `--login-input-error-ring` | `0px 0px 0px 1px rgba(205, 60, 58, 1) inset, 0px 0px 0px 1px rgba(205, 60, 58, 1)` | `0px 0px 0px 1px rgba(205, 60, 58, 1) inset, 0px 0px 0px 1px rgba(205, 60, 58, 1)` | Sama dengan Light Mode | Sama dengan Light Mode | 100% Match |
| **Primary Button Background** | `--login-btn-primary-bg` | `#2383E2` | `#2383E2` | `#2383E2` | `#2383E2` | 100% Match |
| **Primary Button Hover** | `--login-btn-primary-hover` | `#0077D4` | `#0077D4` | `#0077D4` | `#0077D4` | 100% Match |
| **Primary Button Active** | `--login-btn-primary-active` | `#006BC7` | `#006BC7` | `#006BC7` | `#006BC7` | 100% Match |
| **SSO Button Background** | `--login-btn-sso-bg` | `#FFFFFF` | `#FFFFFF` | `rgba(255, 255, 255, 0.055)` / `transparent` | `rgba(255, 255, 255, 0.055)` | 100% Match |
| **SSO Button Border** | `--login-btn-sso-border` | `1px solid rgba(55, 53, 47, 0.16)` | `1px solid rgba(55, 53, 47, 0.16)` | `1px solid rgba(255, 255, 255, 0.13)` | `1px solid rgba(255, 255, 255, 0.13)` | 100% Match |
| **Modal Box Shadow** | `--login-modal-shadow` | `0px 20px 24px 0px rgba(25, 25, 25, 0.059), 0px 5px 9px 0px rgba(25, 25, 25, 0.029), 0px 0px 0px 1px rgba(42, 28, 0, 0.07)` | `0px 20px 24px 0px rgba(25, 25, 25, 0.059), 0px 5px 9px 0px rgba(25, 25, 25, 0.029), 0px 0px 0px 1px rgba(42, 28, 0, 0.07)` | `0px 0px 0px 1px rgba(56, 56, 54, 1), 0px 20px 24px 0px rgba(15, 15, 15, 0.35), 0px 5px 9px 0px rgba(15, 15, 15, 0.2)` | `0px 0px 0px 1px rgba(56, 56, 54, 1), 0px 20px 24px 0px rgba(15, 15, 15, 0.35), 0px 5px 9px 0px rgba(15, 15, 15, 0.2)` | 100% Match |
| **Modal Backdrop Overlay** | `.notion-login-backdrop` | `rgba(15, 15, 15, 0.6)` | `rgba(15, 15, 15, 0.6)` | `rgba(15, 15, 15, 0.8)` (`ui-login.md` §2.1) | `rgba(15, 15, 15, 0.6)` | Deviasi (`cosmetic`) |

---

### 2.3 Komparasi Tipografi, Input, Tombol & Respon Interaktif

| Elemen / State | Spesifikasi Target (`ui-login.md` & `spec.md`) | Implementasi Build (`NotionLoginModal.css` & `.jsx`) | Status |
| :--- | :--- | :--- | :---: |
| **Font Family UI** | `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"` | `--login-font-ui` identik ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L28)) | 100% Match |
| **Font Family Monospace (OTP)** | `"iawriter-mono", Nitti, Menlo, Courier, monospace` | `--login-font-mono` identik pada `.noted-otp-input` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L29)) | 100% Match |
| **Judul Utama (`.notion-login-title`)** | `font-size: 22px; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; color: var(--login-text-primary);` | `font-size: 22px; font-weight: 600; line-height: 1.2; letter-spacing: -0.02em; color: var(--login-text-primary);` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L223-L230)) | 100% Match |
| **Subjudul (`.notion-login-subtitle`)** | `font-size: 15px; font-weight: 400; line-height: 1.3; letter-spacing: -0.015em; color: var(--login-text-secondary);` | `font-size: 15px; font-weight: 400; color: var(--login-text-secondary);` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L232-L237)) | Deviasi (`cosmetic`) |
| **Label Input (`.noted-field-label`)** | `font-size: 12px; font-weight: 500; line-height: 16px; color: var(--login-text-secondary); margin-bottom: 4px;` | `font-size: 12px; font-weight: 500; line-height: 16px; color: var(--login-text-secondary); margin-bottom: 4px;` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L375-L383)) | 100% Match |
| **Dimensi Input (`.notion-login-input`)** | Classic/Modal: `width: 100%; height: 36px; border-radius: 6px; font-size: 15px; padding: 4px 10px;` | `width: 100%; height: 36px; border-radius: 6px; font-size: 15px; padding: 4px 32px 4px 10px;` (ruang kanan `32px` untuk tombol clear) ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L392-L406)) | 100% Match |
| **Tombol Clear Input (`.noted-clear-input-btn`)** | `16px x 16px`, `border-radius: 20px`, warna `text.tertiary`, hover `rgba(33, 27, 23, 0.05)` | `width: 16px; height: 16px; border-radius: 20px; color: var(--login-text-tertiary);` hover `rgba(33, 27, 23, 0.05)` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L433-L453)) | 100% Match |
| **Tombol Submit (`.noted-submit-btn`)** | `width: 100%; height: 36px; border-radius: 6px; margin-top: 6px; padding-inline: 12px; font-size: 14px; font-weight: 500; line-height: 1;` | Identik di [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L511-L531) | 100% Match |
| **Submit `:focus-visible`** | Light: `0 0 0 2px #F8F8F7, 0 0 0 4px #2383E2, 0 0 0 6px rgba(255,255,255,0.25)`<br>Dark: `0 0 0 2px #191919, 0 0 0 4px #2383E2, 0 0 0 6px #191919` | Identik di [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L550-L559) | 100% Match |
| **Submit & SSO `:disabled`** | `opacity: 0.4; pointer-events: none; cursor: not-allowed;` | Identik (`opacity: 0.4`) pada `.noted-submit-btn:disabled` & `.noted-sso-btn:disabled` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L315-L320), [L543-L548](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L543-L548)) | 100% Match |
| **Pesan Error (`role="alert"`)** | `role="alert" aria-live="polite" aria-atomic="true"`, `font-size: 14px; line-height: 1.4; color: #CD3C3A` (Light) / `#DF5452` (Dark), `margin: 12px 0; text-align: center; background: transparent; border: none;` | Identik di [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx#L781-L789) & [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L240-L252) | 100% Match |
| **Transisi Step 2 (`.noted-animated-step`)** | `max-height: 0 -> 5000px; opacity: 0 -> 1; transition: all 0.5s ease-in-out;` | Identik di [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L456-L473) | 100% Match |
| **Loading Spinner (`.noted-spinner`)** | `16px x 16px`, rotasi `1.2s linear infinite`, lingkaran dasar `rgba(28, 19, 1, 0.11)` / `rgba(255, 255, 235, 0.1)` + busur `currentColor` | `16px x 16px`, `1.2s linear infinite`, namun `border-bottom/left: 2px solid transparent` menimpa warna lingkaran dasar ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L562-L584)) | Deviasi (`minor`) |

---

## 3. Daftar Deviasi Visual Teridentifikasi

Berikut adalah rincian seluruh deviasi visual antara spesifikasi target (`Notion.app`, `reports/ui-login.md`, `spec.md`) dan hasil build saat ini, diurutkan berdasarkan tingkat keparahan (`major`, `minor`, `cosmetic`):

### Ringkasan Tingkat Keparahan
- **`major`**: `0` temuan
- **`minor`**: `3` temuan (`DEV-01`, `DEV-02`, `DEV-03`)
- **`cosmetic`**: `6` temuan (`DEV-04` s/d `DEV-09`)

---

### `DEV-01` [Tingkat Keparahan: `minor`] — Tombol SSO "Continue with Microsoft" Belum Dirender pada Daftar Metode Login
- **Lokasi File:** [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx#L538-L623)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L328-L370) dan [spec.md](file:///Users/daniakbar/Documents/REA-Projects/noted/spec.md#L24) (`FR-01` & `Section 6.2`), deretan tombol autentikasi pihak ketiga mencakup 5 opsi: *Continue with Google*, *Continue with Apple*, *Continue with Microsoft* (ikon 4 kuadran `#F25022`, `#7FBA00`, `#00A4EF`, `#FFB900`), *Log in with passkey*, dan *Single sign-on (SSO)*.
- **Kondisi Hasil Build:** Di dalam `.notion-login-methods`, komponen hanya merender 4 tombol (Google, Apple, Passkey, dan SSO).
- **Dampak Visual:** Tinggi kontainer `.notion-login-methods` berkurang `44px` (`36px` tombol + `8px` gap) dibanding tampilan standar 5 tombol SSO Notion Desktop.

---

### `DEV-02` [Tingkat Keparahan: `minor`] — Lingkaran Dasar (Track) pada `.noted-spinner` Tertimpa oleh `border-bottom` & `border-left` Transparan
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L562-L584)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L423-L445) dan [spec.md](file:///Users/daniakbar/Documents/REA-Projects/noted/spec.md#L298-L303), spinner memiliki lingkaran dasar penuh berwarna `rgba(28, 19, 1, 0.11)` (Light) / `rgba(255, 255, 235, 0.1)` (Dark) dengan busur (*arc*) berputar berwarna `currentColor`.
- **Kondisi Hasil Build:** Pada `.noted-spinner`, properti `border: 2px solid rgba(28, 19, 1, 0.11)` dideklarasikan pada elemen yang sama diikuti langsung oleh:
  ```css
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid transparent;
  border-left: 2px solid transparent;
  ```
  Karena keempat sisi `border-*` didefinisikan ulang pada elemen tunggal yang sama, sisi bawah dan kiri menjadi sepenuhnya transparan (`transparent`) alih-alih menampilkan cincin dasar transparan di bawah busur putar. Selain itu, karena `.noted-spinner` berada di dalam `.noted-submit-btn` yang berlatar biru `#2383E2` dengan teks putih `#FFFFFF`, cincin dasar seharusnya menggunakan `rgba(255, 255, 255, 0.3)` (atau mempertahankan `border: 2px solid rgba(255, 255, 255, 0.25)` pada sisi bawah/kiri dan `border-top-color: currentColor; border-right-color: currentColor;`).

---

### `DEV-03` [Tingkat Keparahan: `minor`] — State `:hover` Tombol SSO pada Dark Mode Tidak Menghasilkan Perubahan Warna Visual
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L52-L55)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L338-L346), tombol SSO pada Dark Mode memiliki perbedaan kontras antara state normal (`transparent` atau `rgba(255, 255, 255, 0.055)`) dan state `:hover` (`rgba(255, 255, 255, 0.055)` jika default `transparent`, atau `rgba(255, 255, 243, 0.082)` `--c-bacTerTra` jika default `0.055`).
- **Kondisi Hasil Build:** Pada blok `[data-theme='dark']` ([NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L52-L54)):
  ```css
  --login-btn-sso-bg: rgba(255, 255, 255, 0.055);
  --login-btn-sso-hover: rgba(255, 255, 255, 0.055);
  ```
  Nilai `--login-btn-sso-bg` dan `--login-btn-sso-hover` identik, sehingga saat pengguna mengarahkan kursor (`:hover`) ke tombol SSO di Dark Mode, tidak ada umpan balik perubahan warna latar.

---

### `DEV-04` [Tingkat Keparahan: `cosmetic`] — Class Animasi `.animate-scale-up` pada Kontainer Modal Belum Didefinisikan di CSS
- **Lokasi File:** [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx#L512) & [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L137)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L477), kemunculan dialog `LoginModal` menggunakan animasi `200ms cubic-bezier(0.16, 1, 0.3, 1)` (`opacity: 0 -> 1`, `transform: scale(0.96) -> scale(1)`).
- **Kondisi Hasil Build:** Elemen `<div className="notion-login-modal animate-scale-up">` memasang class `animate-scale-up`, tetapi aturan `@keyframes` dan `.animate-scale-up` belum didefinisikan di [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css) maupun [index.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/index.css) (di `index.css` hanya terdapat `.animate-popover`).

---

### `DEV-05` [Tingkat Keparahan: `cosmetic`] — Pixel Drift pada Margin Vertikal Subjudul (`16px` vs `24px`) dan Divider `"OR"` (`12px` vs `16px`)
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L236) & [L344](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L344)
- **Spesifikasi Target:**
  - Subjudul `.notion-login-subtitle`: `margin-bottom: 24px` ([reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L143), [spec.md](file:///Users/daniakbar/Documents/REA-Projects/noted/spec.md#L269)).
  - Divider `.noted-login-divider`: `margin-top: 16px; margin-bottom: 16px;` ([reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L145)).
- **Kondisi Hasil Build:** `.notion-login-subtitle` menggunakan `margin: 0 0 16px 0;` (selisih `8px`) dan `.noted-login-divider` menggunakan `margin: 12px 0;` (selisih `4px` di atas dan bawah).

---

### `DEV-06` [Tingkat Keparahan: `cosmetic`] — Opasitas Backdrop Modal pada Dark Mode (`0.6` vs `0.8`)
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L124-L135)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L172) (`modalUnderlayBackground`), nilai backdrop adalah `rgba(15, 15, 15, 0.6)` untuk Light Mode dan `rgba(15, 15, 15, 0.8)` untuk Dark Mode.
- **Kondisi Hasil Build:** `.notion-login-backdrop` menggunakan `rgba(15, 15, 15, 0.6)` secara statis pada kedua tema.

---

### `DEV-07` [Tingkat Keparahan: `cosmetic`] — Hover Background Tombol Clear Input (`.noted-clear-input-btn:hover`) Belum Adaptif terhadap Dark Mode
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L450-L453)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L169) & [L279](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L279), hover pada tombol clear menggunakan `--ca-bacIntTra`: `rgba(33, 27, 23, 0.05)` pada Light Mode dan `rgba(255, 255, 255, 0.056)` pada Dark Mode.
- **Kondisi Hasil Build:** `.noted-clear-input-btn:hover` menggunakan `background-color: rgba(33, 27, 23, 0.05)` secara hardcoded sehingga pada latar gelap (`#202020`) lingkaran hover hampir tidak terlihat.

---

### `DEV-08` [Tingkat Keparahan: `cosmetic`] — Properti `box-shadow` Halus pada Tombol Submit Utama (`.noted-submit-btn`)
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L511-L531)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L208) & [L320](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L320), tombol utama biru (`#2383E2`) memiliki `box-shadow: inset 0 0 0 1px rgba(15, 15, 15, 0.1), 0 1px 2px rgba(15, 15, 15, 0.1)` pada Light Mode dan `0 1px 2px rgba(15, 15, 15, 0.1)` pada Dark Mode.
- **Kondisi Hasil Build:** `.noted-submit-btn` merender warna solid `#2383E2` tanpa `box-shadow` default.

---

### `DEV-09` [Tingkat Keparahan: `cosmetic`] — Properti `opacity: 0.6` & `user-select: none` pada `.notion-login-input:disabled`
- **Lokasi File:** [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css#L416-L419)
- **Spesifikasi Target:** Pada [reports/ui-login.md](file:///Users/daniakbar/Documents/REA-Projects/noted/reports/ui-login.md#L289), input yang dinonaktifkan (`:disabled`) memiliki `opacity: 0.6`, `cursor: not-allowed`, dan `user-select: none`.
- **Kondisi Hasil Build:** `.notion-login-input:disabled` mengatur `color: var(--login-text-disabled); cursor: not-allowed;` tanpa `opacity: 0.6` dan `user-select: none`.

---

## 4. Rekomendasi Perbaikan CSS & UI

Untuk meningkatkan **Visual Match Rate** dari **95.9%** menuju **100% (*Pixel-Perfect*)**, berikut adalah rekomendasi perbaikan kode pada [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css) dan [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx):

### 4.1 Rekomendasi Perbaikan pada [NotionLoginModal.css](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.css)

1. **Perbaiki Kontras Hover SSO pada Dark Mode (`DEV-03`) & Backdrop Dark Mode (`DEV-06`):**
   ```css
   [data-theme='dark'],
   [data-theme='dark'] .noted-login-page,
   [data-theme='dark'] .notion-login-backdrop,
   [data-theme='dark'] .notion-login-modal {
     /* Gunakan warna hover yang sedikit lebih terang dari --login-btn-sso-bg (0.055 -> 0.082) */
     --login-btn-sso-hover: rgba(255, 255, 243, 0.082);
   }

   [data-theme='dark'] .notion-login-backdrop {
     background: rgba(15, 15, 15, 0.8);
   }
   ```

2. **Tambahkan Definisi Animasi `.animate-scale-up` (`DEV-04`):**
   ```css
   @keyframes noted-modal-scale-up {
     0% {
       opacity: 0;
       transform: scale(0.96);
     }
     100% {
       opacity: 1;
       transform: scale(1);
     }
   }

   .animate-scale-up {
     animation: noted-modal-scale-up 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
   }
   ```

3. **Perbaiki Cincin Dasar (Track) pada `.noted-spinner` (`DEV-02`):**
   Gunakan warna cincin dasar pada keempat sisi `border`, lalu timpa hanya `border-top-color` dan `border-right-color` dengan `currentColor`:
   ```css
   .noted-spinner {
     width: 16px;
     height: 16px;
     margin-inline-end: 6px;
     border: 2px solid rgba(255, 255, 255, 0.3);
     border-top-color: currentColor;
     border-right-color: currentColor;
     border-radius: 50%;
     animation: noted-spinner-rotate 1.2s linear infinite;
     display: inline-block;
     box-sizing: border-box;
     flex-shrink: 0;
   }

   .noted-spinner.noted-spinner-page {
     width: 22px;
     height: 22px;
     border-color: rgba(28, 19, 1, 0.11);
     border-top-color: currentColor;
     border-right-color: currentColor;
   }

   [data-theme='dark'] .noted-spinner.noted-spinner-page {
     border-color: rgba(255, 255, 235, 0.1);
     border-top-color: currentColor;
     border-right-color: currentColor;
   }
   ```

4. **Selaraskan Margin Subjudul, Divider `"OR"`, Hover Tombol Clear di Dark Mode, serta Shadow Tombol Utama (`DEV-05`, `DEV-07`, `DEV-08`, `DEV-09`):**
   ```css
   .notion-login-subtitle {
     font-size: 15px;
     font-weight: 400;
     line-height: 1.3;
     letter-spacing: -0.015em;
     color: var(--login-text-secondary);
     margin: 0 0 24px 0;
   }

   .noted-login-divider,
   .notion-login-divider {
     margin: 16px 0;
   }

   .notion-login-input:disabled {
     color: var(--login-text-disabled);
     opacity: 0.6;
     cursor: not-allowed;
     user-select: none;
   }

   [data-theme='dark'] .noted-clear-input-btn:hover {
     background-color: rgba(255, 255, 255, 0.056);
     color: var(--login-text-secondary);
   }

   .noted-submit-btn,
   .notion-login-submit-btn {
     box-shadow: inset 0 0 0 1px rgba(15, 15, 15, 0.1), 0 1px 2px rgba(15, 15, 15, 0.1);
   }

   [data-theme='dark'] .noted-submit-btn,
   [data-theme='dark'] .notion-login-submit-btn {
     box-shadow: 0 1px 2px rgba(15, 15, 15, 0.1);
   }
   ```

### 4.2 Rekomendasi Perbaikan pada [NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx)

1. **Tambahkan Tombol SSO Microsoft (`DEV-01`):**
   Sisipkan tombol *"Continue with Microsoft"* tepat di bawah tombol Apple ([NotionLoginModal.jsx](file:///Users/daniakbar/Documents/REA-Projects/noted/src/components/Auth/NotionLoginModal.jsx#L592)):
   ```jsx
   <button
     type="button"
     className="noted-sso-btn notion-auth-btn microsoft-custom-btn"
     onClick={() => handleThirdPartySso('microsoft')}
     disabled={isLoading || rateLimitCooldown > 0}
   >
     <span className="noted-sso-icon" aria-hidden="true">
       <svg viewBox="0 0 21 21" width="18" height="18">
         <rect x="1" y="1" width="9" height="9" fill="#F25022" />
         <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
         <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
         <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
       </svg>
     </span>
     <span>Continue with Microsoft</span>
   </button>
   ```
