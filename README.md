# SmartStock 📦

> Sistem manajemen inventaris yang berfokus pada **kecepatan input** dan **integritas data stok** — anti-fraud, anti-selisih misterius, dengan audit trail penuh.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Private-red)](./LICENSE)

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/rifqiArdiansyah1/smart-stock.git
cd smart-stock

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan kredensial yang sesuai

# 4. Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🏗️ Arsitektur

SmartStock menggunakan **modular monolith** berbasis Next.js App Router.

```
/src
  /app                    ← Next.js App Router (pages & API routes)
  /modules
    /auth                 ← Login, session, JWT
    /inventory            ← Produk, lokasi, stock levels
    /stock-opname         ← Sesi opname, scan, approval flow
    /audit                ← Audit trail interceptor & log viewer
    /notifications        ← Low-stock & expiry alerts
    /analytics            ← Dashboard & laporan selisih
  /components
    /ui                   ← Reusable UI components (Button, Card, Badge, dll)
    /layout               ← Layout components (Sidebar, Header, dll)
    /shared               ← Shared feature components
  /lib
    ├── db.ts             ← Prisma client (Database)
    ├── redis.ts          ← Upstash Redis client
    ├── utils.ts          ← Utility functions
    └── permissions.ts    ← RBAC permission helpers
  /hooks                  ← Custom React hooks
  /types                  ← Global TypeScript types & constants
```

---

## 🔑 Prinsip Arsitektur Utama

| Prinsip | Implementasi |
|---|---|
| **Sumber kebenaran stok** | `stock_movements` ledger *append-only* — tidak ada yang langsung update angka |
| **Otorisasi opname** | Karyawan hanya input fisik; perubahan stok wajib approval admin |
| **Offline-first** | PWA + IndexedDB + Background Sync untuk gudang sinyal lemah |
| **Audit trail** | Interceptor di level aplikasi — bukan DB trigger — agar ada konteks user |
| **RBAC** | Ditegakkan di API middleware, bukan hanya disembunyikan di UI |

---

## 👥 Role & Permission

| Aksi | Owner | Admin | Staff Gudang | Kasir |
|---|:---:|:---:|:---:|:---:|
| Input fisik opname | ✓ | ✓ | ✓ | – |
| Approve hasil opname | ✓ | ✓ | – | – |
| Lihat laporan & analitik | ✓ | ✓ | – | – |
| Transaksi penjualan (POS) | ✓ | ✓ | – | ✓ |
| Tambah/edit produk | ✓ | ✓ | – | – |
| Lihat audit log | ✓ | – | – | – |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16 + TypeScript + Tailwind CSS v4 |
| **Backend** | Next.js API Routes (Modular Monolith) |
| **Database** | PostgreSQL via Prisma (Supabase/Neon) |
| **Cache & Queue** | Redis (Upstash) + BullMQ |
| **File Storage** | Cloudflare R2 |
| **Auth** | NextAuth.js + bcrypt |
| **Hosting** | Vercel (App) + Railway/Fly.io (WebSocket) |
| **CI/CD** | GitHub Actions |

---

## 📋 Development Progress

Lihat [Issue Board](https://github.com/rifqiArdiansyah1/smart-stock/issues) untuk progress development.

| Sprint | Phase | Status |
|---|---|---|
| 1–2 | Foundation & Setup | 🟡 In Progress |
| 3–4 | Inventory Core | 🔴 Todo |
| 5–6 | Stock Opname | 🔴 Todo |
| 7 | Audit & Security | 🔴 Todo |
| 8 | Notifikasi | 🔴 Todo |
| 9–10 | Analytics & PWA | 🔴 Todo |

---

## 📜 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run format:check # Prettier check
npm run type-check   # TypeScript check
npm run validate     # type-check + lint + format:check
```

---

## 📖 Dokumentasi

- [Arsitektur Design](./smartstock-architecture-design.md) _(di root workspace)_
- [Issue Planning](./issue.md) _(di root workspace)_
- [Module READMEs](./src/modules/) — lihat README di setiap module

---

*SmartStock — Shenzen Studio · 2026*
