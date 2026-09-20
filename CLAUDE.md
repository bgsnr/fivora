@AGENTS.md

# CLAUDE.md

Panduan ini dibaca otomatis oleh Claude Code di repo ini.

> Konvensi, struktur folder, role, dan aturan bisnis project ada di **AGENTS.md** — baca file itu dulu sebelum mulai kerja. File ini hanya berisi catatan tambahan khusus untuk Claude Code.

## Cara Kerja di Repo Ini

- Ikuti struktur folder & pemisahan tanggung jawab (DB / tampilan / logika) persis seperti di `AGENTS.md`.
- Setiap fitur baru yang menyentuh data (reservasi, laporan, fasilitas) **wajib** ada validasi server-side, meski sudah ada validasi client-side.
- Saat membuat/mengubah tabel Supabase, sertakan juga RLS policy yang sesuai role (`pengguna`, `petugas`, `admin`) — jangan hanya rely pada pengecekan di frontend.
- Saat menulis Server Action baru, pastikan letaknya di `/lib/actions`, bukan inline di komponen.

## Perintah yang Sering Dipakai

Sesuaikan dengan package manager yang dipakai tim (npm/pnpm/yarn) — isi setelah project di-scaffold, contoh:

```bash
npm run dev        # jalankan dev server
npm run lint        # cek linting
npm run build        # build production
```

## Hal yang Perlu Dikonfirmasi ke Claude Sebelum Eksekusi Besar

- Perubahan skema database (migration) — tampilkan dulu SQL-nya sebelum apply.
- Perubahan RLS policy — jelaskan dampaknya ke tiap role sebelum diterapkan.
- Jangan commit kredensial Supabase (`.env` harus di-gitignore).

## Referensi

- Detail lengkap project, tech stack, aktor, dan aturan bisnis: lihat `AGENTS.md`.