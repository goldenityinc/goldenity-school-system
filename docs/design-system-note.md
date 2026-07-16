# Goldenity School System - Design System Note

Dokumen ini menjadi acuan tunggal antara desain (Figma) dan implementasi (Next.js + Tailwind) agar UI konsisten, scalable, dan mudah dirawat.

## 1. Tujuan

- Menjamin konsistensi visual lintas modul: Dashboard, Students, Academics, Billing, Settings.
- Mempercepat handoff Figma ke kode.
- Menjadi baseline sebelum pengembangan komponen baru.

## 2. Prinsip Visual

- Gaya utama: modern admin dashboard, clean, high readability.
- Nuansa warna: slate/navy untuk struktur, amber untuk aksen utama.
- Bentuk: rounded medium-large, shadow halus, kontras cukup.
- Kepadatan: data-dense tapi tetap rapi dengan hierarki tipografi jelas.

## 3. Core Design Tokens (Implementasi Saat Ini)

Sumber implementasi:
- tailwind.config.ts
- app/globals.css

### 3.1 Color Tokens

- Primary: #0F172A
- Accent: #EAB308
- Background: #F8FAFC
- Surface: #FFFFFF

Status dan semantic colors (pemakaian komponen):
- Active: hijau (success)
- Pending: amber (warning)
- Suspended: merah (danger)
- Inactive: slate (neutral)
- Trial/Pro/Enterprise: biru/violet sesuai konteks badge

Catatan:
- Warna semantic di atas saat ini diturunkan dari utility Tailwind langsung pada komponen (belum semua dibakukan sebagai CSS variable).

### 3.2 Typography

- Font utama UI: Plus Jakarta Sans
- Fallback: Segoe UI, sans-serif
- Heading: bobot tebal untuk section title dan page title
- Body: ukuran kecil-menengah untuk dashboard data density

Rekomendasi scale operasional:
- Display/Page Title: 30-36px, bold
- Section Title: 18-24px, semibold
- Body: 14px
- Meta/Caption/Table helper: 12px

### 3.3 Radius, Border, Shadow

- Radius global: dominan rounded-xl sampai rounded-2xl pada panel/card.
- Border: slate-200 untuk pembatas utama.
- Shadow utama: soft shadow (kombinasi low elevation + large blur halus).

## 4. Layout Rules

- Background halaman: slate sangat terang (#F8FAFC).
- Surface panel: putih dengan border tipis.
- Grid ringkas untuk kartu metrik dan blok konten data.
- Spacing antar section konsisten (vertikal) untuk ritme baca.

## 5. Komponen Inti dan Kontrak UI

## 5.1 Button

Variants:
- primary: aksi utama
- secondary: aksi pendukung
- outline: aksi netral
- danger: aksi destruktif
- ghost: aksi minim visual

Sizes:
- sm, md, lg

Aturan:
- Hanya satu primary action dominan per area/fold.
- Gunakan danger hanya untuk aksi irreversible/sensitif.

## 5.2 Badge

Variants aktif:
- active, pending, suspended, inactive, trial, pro, enterprise

Aturan:
- Badge harus semantic, bukan sekadar dekorasi.
- Label status harus singkat dan konsisten lintas modul.

## 5.3 Modal

Struktur:
- Overlay gelap semi-transparan
- Panel centered, max width medium
- Header + body terpisah dengan border

Aturan:
- Wajib memiliki judul jelas.
- Untuk aksi destruktif, tampilkan konsekuensi secara eksplisit.

## 5.4 Data Table

Karakteristik:
- Search + filter + action bar
- Status badge per row
- Pagination
- Alignment data penting (nominal, tanggal, status) harus konsisten

Aturan:
- Numeric values rata kanan bila memungkinkan.
- Aksi row-level jangan melebihi 2-3 aksi primer.

## 5.5 Form Inputs

Komponen:
- text, select, search, currency/prefix field
- valid, error, disabled state harus selalu tersedia

Aturan:
- Error message harus actionable.
- Label tetap ditampilkan (jangan hanya placeholder).

## 5.6 Feature Flags / Toggle

Aturan:
- Nama fitur jelas + deskripsi singkat value/impact.
- Tampilkan status enable/disable secara eksplisit.
- Jika terkait plan (Starter/Pro/Enterprise), tampilkan matrix akses.

## 6. State System (Wajib Ada di Figma)

Untuk tiap komponen, minimal state berikut harus tersedia:
- default
- hover
- focus
- active/pressed
- disabled
- error (untuk form)

Interaksi:
- Focus ring wajib terlihat (akses keyboard).
- Kontras text terhadap background minimal memenuhi standar aksesibilitas.

## 7. Aksesibilitas (Minimum Standard)

- Kontras teks normal minimal 4.5:1.
- Semua input punya label.
- Semua tombol icon-only punya aria-label saat implementasi.
- Modal mendukung keyboard escape dan focus trap (target implementasi).

## 8. Mapping Figma ke Kode

Naming yang disarankan:
- Figma color styles: color.primary, color.accent, color.surface, color.bg
- Figma text styles: text.display, text.h1, text.h2, text.body, text.caption
- Figma components: button/*, badge/*, input/*, modal/*, table/*

Mapping praktis:
- Figma variant -> prop variant pada komponen React
- Figma size -> prop size
- Figma token -> Tailwind theme extension atau CSS variable

## 9. Governance

- Perubahan token wajib tercatat di dokumen ini sebelum implementasi massal.
- Komponen baru harus melewati review visual (Figma) + review teknis (kode).
- Hindari hardcoded color/style baru di page-level tanpa tokenisasi.

## 10. Checklist Handoff Figma -> Dev

- Semua token warna final sudah dipublish.
- Semua text style final sudah dipublish.
- Komponen inti sudah punya variants dan states lengkap.
- Spacing scale dan grid dijelaskan.
- Contoh screen per modul tersedia (Dashboard, Students, Academics, Billing, Settings).
- Edge cases tersedia (empty state, error state, long text, loading).

## 11. Data Figma yang Perlu Dicopy Agar Sinkron 100%

Silakan copy dari Figma (atau export) item berikut agar dokumen ini bisa dibuat final dan presisi:

- Daftar color styles lengkap beserta nama token dan hex.
- Daftar text styles lengkap (font family, size, line-height, letter spacing, weight).
- Spacing scale (4/8/12/16 dst) + radius scale.
- Effect styles (shadow, blur) lengkap.
- Komponen utama + semua varian/state (Button, Input, Select, Badge, Modal, Table, Tabs, Sidebar, Toggle).
- Rule interaksi (focus, hover, disabled, validation).
- Rule responsif (breakpoint dan perilaku layout).
- Ikon set dan ukuran standar (16/20/24).

Jika kamu kirim data di atas, saya bisa lanjutkan versi v1.1 yang fully quantified (token-by-token) dan siap dijadikan acuan engineering + QA visual.
