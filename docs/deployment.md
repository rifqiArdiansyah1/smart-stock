# SmartStock — Deployment Guide

Panduan lengkap untuk men-deploy SmartStock ke Vercel (frontend + API routes).

---

## Prasyarat

- Akun [Vercel](https://vercel.com) (free tier cukup untuk development)
- Akun [Neon](https://neon.tech) atau [Supabase](https://supabase.com) untuk PostgreSQL
- Akun [Upstash](https://upstash.com) untuk Redis (BullMQ + cache)
- Repository sudah di-push ke GitHub

---

## Langkah Deploy

### 1. Hubungkan Repository ke Vercel

1. Login ke [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klik **"Add New Project"**
3. Pilih repository `smart-stock` dari GitHub
4. Framework: **Next.js** (auto-detected)
5. Root Directory: `./` (biarkan default)
6. Klik **Deploy** — biarkan gagal dulu, environment variables belum diisi

---

### 2. Set Environment Variables di Vercel

Pergi ke **Project Settings → Environment Variables**, lalu tambahkan semua variabel berikut:

#### Wajib (App akan error tanpa ini)

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `NEXTAUTH_URL` | `https://smartstock.vercel.app` | URL produksi aplikasi |
| `NEXTAUTH_SECRET` | `$(openssl rand -hex 32)` | Secret key untuk NextAuth |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Connection string PostgreSQL (pooled) |
| `DIRECT_URL` | `postgresql://user:pass@host/db?sslmode=require` | Direct URL untuk Prisma migrations |
| `UPSTASH_REDIS_REST_URL` | `https://xxx.upstash.io` | REST URL dari Upstash dashboard |
| `UPSTASH_REDIS_REST_TOKEN` | `AXxx...` | Token dari Upstash dashboard |
| `UPSTASH_REDIS_URL` | `rediss://default:TOKEN@HOST:6379` | ioredis URL untuk BullMQ |

#### Cron Security

| Variable | Contoh | Keterangan |
|----------|--------|------------|
| `CRON_SECRET` | `$(openssl rand -hex 32)` | Secret untuk mengamankan cron endpoints |

#### Opsional (File Upload & Notifications)

| Variable | Keterangan |
|----------|------------|
| `R2_ACCOUNT_ID` | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Key |
| `R2_BUCKET_NAME` | Nama bucket R2 (contoh: `smartstock-assets`) |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | URL publik CDN R2 |
| `NEXT_PUBLIC_WS_URL` | URL WebSocket server (Railway/Fly.io) |
| `SMTP_HOST` | SMTP server untuk email notifikasi |
| `SMTP_PORT` | Port SMTP (587 untuk TLS) |
| `SMTP_USER` | Email pengirim |
| `SMTP_PASS` | App password email |

---

### 3. Database Migration

Setelah deploy pertama berhasil, jalankan migrasi dari lokal:

```bash
# Pastikan DATABASE_URL sudah mengarah ke production DB
npx prisma migrate deploy
```

> **Catatan:** Gunakan `migrate deploy` (bukan `migrate dev`) di production.

---

### 4. Vercel Cron Jobs

`vercel.json` sudah mengkonfigurasi dua cron job otomatis:

| Cron | Jadwal | Fungsi |
|------|--------|--------|
| `GET /api/cron/check-low-stock` | Setiap jam | Cek stok di bawah minimum |
| `GET /api/cron/check-expiry` | Pukul 02:00 UTC | Cek produk hampir kadaluarsa |

Cron hanya berjalan di Vercel Hobby+ plan. Pastikan `CRON_SECRET` sudah diset di environment variables.

---

### 5. Deploy Worker (BullMQ)

Worker BullMQ **tidak bisa** dijalankan di Vercel (serverless). Deploy ke layanan yang mendukung long-running process:

**Opsi A — Railway (Direkomendasikan):**
```bash
# Di Railway, buat service baru dengan start command:
npx tsx src/workers/notification.worker.ts
```

**Opsi B — Fly.io:**
```toml
# fly.toml
[processes]
  worker = "npx tsx src/workers/notification.worker.ts"
```

Worker membutuhkan env vars yang sama dengan Vercel (terutama `DATABASE_URL` dan `UPSTASH_REDIS_URL`).

---

### 6. Custom Domain (Opsional)

1. Di Vercel dashboard → **Domains**
2. Tambahkan domain kustom
3. Update DNS sesuai instruksi Vercel
4. Update `NEXTAUTH_URL` dan `NEXT_PUBLIC_APP_URL` ke domain baru
5. Redeploy

---

## Checklist Sebelum Go-Live

- [ ] Semua environment variables production sudah diset
- [ ] `npx prisma migrate deploy` sudah dijalankan
- [ ] Test login, checkout POS, dan submit opname di staging URL
- [ ] Worker BullMQ berjalan di Railway/Fly.io
- [ ] Cron jobs terverifikasi di Vercel dashboard → Cron tab
- [ ] `NEXTAUTH_URL` sesuai dengan domain production (bukan `localhost`)
- [ ] `CRON_SECRET` sudah diset dan berbeda dari development

---

## Troubleshooting

### Error: `NEXTAUTH_URL` tidak sesuai
Pastikan nilai `NEXTAUTH_URL` di Vercel **persis sama** dengan URL produksi yang diakses browser (termasuk `https://`).

### Error: Database connection refused
Gunakan connection string yang sudah mengaktifkan pooling (Neon: `?pgbouncer=true`, Supabase: gunakan Supabase pooler URL).

### Cron tidak berjalan
- Pastikan plan Vercel mendukung Cron (Hobby tier = 1 cron gratis)
- Cek tab **Cron** di Vercel dashboard untuk melihat log eksekusi
- Pastikan `CRON_SECRET` sudah diset dan cron endpoint merespons dengan `200 OK`
