# SmartStock — GitHub Secrets & Branch Protection Setup

Dokumen ini menjelaskan semua GitHub Secrets yang harus dikonfigurasi
agar CI/CD pipeline berjalan dengan benar.

## 📌 GitHub Secrets yang Diperlukan

Tambahkan secrets di: **GitHub Repo → Settings → Secrets and variables → Actions**

### 🔑 Vercel Deployment

| Secret | Cara mendapatkan | Keterangan |
|---|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) | Personal access token Vercel |
| `VERCEL_ORG_ID` | `vercel env pull` → lihat `.vercel/project.json` | Organization/Team ID |
| `VERCEL_PROJECT_ID` | `vercel env pull` → lihat `.vercel/project.json` | Project ID di Vercel |

#### Cara setup Vercel:
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project ke Vercel (jalankan di root project)
vercel link

# 3. Ambil org & project ID
cat .vercel/project.json
# Output: { "orgId": "xxx", "projectId": "yyy" }

# 4. Tambahkan ke GitHub Secrets:
#    VERCEL_ORG_ID = orgId
#    VERCEL_PROJECT_ID = projectId
```

---

### 🗄️ Database

| Secret | Contoh format | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/smartstock?sslmode=require` | Connection string utama (via PgBouncer jika ada) |
| `DIRECT_URL` | `postgresql://user:pass@host:5432/smartstock?sslmode=require` | Direct connection untuk Prisma Migrate |

#### Cara mendapatkan dari Supabase:
1. Buka [supabase.com](https://supabase.com) → Project → Settings → Database
2. Copy "Connection string" (mode: Transaction → untuk `DATABASE_URL`)
3. Copy "Connection string" (mode: Direct → untuk `DIRECT_URL`)

#### Cara mendapatkan dari Neon:
1. Buka [neon.tech](https://neon.tech) → Project → Connection Details
2. Copy connection string
3. Tambahkan `?sslmode=require` di akhir

---

### 🔐 Auth

| Secret | Keterangan |
|---|---|
| `NEXTAUTH_SECRET` | Minimal 32 karakter random. Generate: `openssl rand -base64 32` |

---

### 🌐 App Configuration (Public)

Tambahkan di: **GitHub Repo → Settings → Secrets → Environment variables** (bukan secrets)

| Variable | Contoh nilai |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://smartstock.vercel.app` |

---

## 🛡️ Branch Protection Rules

Aktifkan di: **GitHub Repo → Settings → Branches → Add branch protection rule**

### Untuk branch `main`:

```
Branch name pattern: main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   Required status checks:
   - CI / 🔍 Type-check & Lint
   - CI / 🏗️ Build

✅ Require branches to be up to date before merging

✅ Do not allow bypassing the above settings
```

---

## 🚀 Cara Setup Cepat (First Time)

```bash
# 1. Clone repository
git clone https://github.com/rifqiArdiansyah1/smart-stock.git
cd smart-stock

# 2. Install dependencies
npm install

# 3. Link ke Vercel
vercel link

# 4. Tambahkan semua secrets di GitHub (lihat tabel di atas)

# 5. Setup branch protection (manual via GitHub UI)

# 6. Test CI dengan membuat PR dari branch baru
git checkout -b test/ci-check
git commit --allow-empty -m "test: trigger CI"
git push origin test/ci-check
# Buat PR → lihat CI berjalan otomatis
```

---

## 📊 Workflow Summary

| Workflow | Trigger | Yang dilakukan |
|---|---|---|
| `ci.yml` | Push ke semua branch + PR ke main | Type-check → Lint → Build |
| `deploy.yml` | Push/merge ke `main` | Deploy ke Vercel Production |
| `pr-preview.yml` | PR dibuka/diupdate ke `main` | Deploy ke Vercel Preview + komentar URL di PR |
| `db-migrate.yml` | Setelah deploy production / manual | `prisma migrate deploy` |
