# [Issue/Task Plan] Enhancement UI/UX & Bug Fix Endpoint `/kasir` (Point of Sale)

> **Untuk:** Junior Programmer  
> **Status:** Open / Ready for Implementation  
> **Priority:** High  
> **Target Endpoint:** `/kasir` & `/api/pos/*`

---

## 📌 Deskripsi & Latar Belakang

Endpoint `/kasir` (Point of Sale) merupakan salah satu modul utama aplikasi **SmartStock** yang digunakan oleh staf kasir maupun admin/owner untuk melakukan transaksi penjualan barang secara cepat.

Saat ini terdapat beberapa batasan dan bug teknis yang perlu diperbaiki serta ditingkatkan dari segi pengalaman pengguna (UI/UX), di antaranya:
1. **Aksesibilitas Role**: Saat ini hanya user ber-role `KASIR` yang bisa mengakses `/kasir`. `OWNER` dan `ADMIN` ter-redirect keluar padahal mereka perlu menguji/menggunakan modul POS.
2. **Pencarian Produk Terbatas**: API lookup (`/api/pos/lookup`) hanya menerima match exact pada SKU/Barcode. Kasir tidak bisa mencari barang berdasarkan **nama produk** (misal: "Kawat Tembaga").
3. **Kalkulator Pembayaran Tunai (Cash & Change)**: Belum ada input nominal uang tunai yang diterima (misal: Rp 100.000) dan kalkulasi otomatis uang kembalian (Change) sebelum checkout.
4. **Visual Catalog Picker**: Kasir tanpa alat barcode scanner kesulitan memasukkan produk karena tidak ada katalog visual/daftar produk yang bisa diklik langsung.
5. **Format Struk Thermal (Print)**: Tampilan cetak struk belum dioptimalkan untuk ukuran printer thermal 58mm/80mm dan masih menggunakan styling print inline yang berisiko merusak layout cetak.
6. **Validasi Input Checkout**: Backend checkout belum memvalidasi jumlah quantity negatif atau desimal yang tidak valid.

---

## 🎯 Daftar Tugas & Langkah Implementasi (Step-by-Step)

### 1. Fix Authorization Role pada Layout Kasir
* **File Target:** [`src/app/kasir/layout.tsx`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/kasir/layout.tsx)
* **Permasalahan:** Kode saat ini: `if (role !== 'KASIR') redirect('/')`.
* **Solusi:** Izinkan role `OWNER`, `ADMIN`, dan `KASIR` untuk mengakses modul kasir.
* **Petunjuk Kode:**
  ```typescript
  import { ROLES } from '@/lib/rbac';

  // Ganti kondisi pengecekan role:
  const allowedRoles = [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR];
  if (!allowedRoles.includes(role as any)) {
    redirect('/');
  }
  ```

---

### 2. Enhancement API Lookup (Pencarian Nama Produk & Case Insensitive)
* **File Target:** [`src/app/api/pos/lookup/route.ts`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/api/pos/lookup/route.ts)
* **Permasalahan:** Query pencarian hanya mencocokkan `barcode` atau `sku` secara eksak (`OR: [{ barcode: query }, { sku: query }]`).
* **Solusi:**
  - Lakukan `.trim()` pada input query.
  - Tambahkan fitur pencarian berdasarkan nama produk (case-insensitive `contains` / `mode: 'insensitive'`).
  - Kembalikan daftar produk jika hasil pencarian nama menghasilkan lebih dari 1 item.
* **Petunjuk Kode:**
  ```typescript
  const cleanQuery = query.trim();

  // Cari produk berdasarkan SKU (exact), Barcode (exact), atau Nama (partial match)
  const products = await db.product.findMany({
    where: {
      OR: [
        { barcode: { equals: cleanQuery, mode: 'insensitive' } },
        { sku: { equals: cleanQuery, mode: 'insensitive' } },
        { name: { contains: cleanQuery, mode: 'insensitive' } },
      ],
      isActive: true,
    },
    take: 10, // batasi maksimal 10 produk
  });
  ```

---

### 3. Fitur Katalog Visual & Quick Add Product di Interface Kasir
* **File Target:** [`src/app/kasir/POSInterface.tsx`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/kasir/POSInterface.tsx)
* **Permasalahan:** Tampilan kiri saat keranjang kosong hanya menampilkan placeholder icon tanpa opsi memilih barang secara manual.
* **Solusi UI/UX:**
  - Tambahkan tombol **"Tampilkan Katalog Produk"** atau Quick Grid produk populer di panel kiri di bawah form pencarian.
  - Ketika kasir mengetik nama produk di search bar, tampilkan dropdown/list hasil pencarian sehingga kasir bisa langsung mengeklik produk yang diinginkan.
* **Panduan UI:**
  - Gunakan badge stok untuk mengindikasi apakah produk tersedia atau habis di lokasi yang dipilih.
  - Klik pada kartu produk langsung menambahkan 1 qty ke keranjang belanja.

---

### 4. Tambahkan Kalkulator Uang Dibayar & Kembalian
* **File Target:** 
  - [`src/app/kasir/POSInterface.tsx`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/kasir/POSInterface.tsx)
  - [`src/styles/audit-pos.css`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/styles/audit-pos.css)
* **Permasalahan:** Tombol "Bayar Sekarang" langsung melakukan submit tanpa konfirmasi berapa nominal uang tunai yang diberikan pembeli.
* **Solusi UI/UX:**
  - Di Panel Ringkasan (Panel Kanan), tambahkan field **"Uang Dibayar (Cash Given)"**.
  - Sediakan shortcut tombol uang pas & pecahan umum: `[Uang Pas]`, `[50rb]`, `[100rb]`, `[200rb]`.
  - Tampilkan secara otomatis **"Kembalian (Change)"** secara langsung: `Kembalian = Uang Dibayar - Total Bayar`.
  - Nonaktifkan tombol bayar jika `Uang Dibayar < Total Bayar` dan berikan pesan helper warna merah: *"Uang kurang Rp X.XXX"*.
* **Petunjuk State:**
  ```typescript
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const changeAmount = typeof cashAmount === 'number' ? cashAmount - totalAmount : 0;
  const isPaymentValid = typeof cashAmount === 'number' && cashAmount >= totalAmount;
  ```

---

### 5. Optimasi & Formatting Struk Thermal (Print Layout)
* **File Target:** [`src/app/kasir/ReceiptModal.tsx`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/kasir/ReceiptModal.tsx)
* **Permasalahan:** Layout modal cetak struk belum memuat rincian uang dibayar dan kembalian, serta styling cetak dapat menyebabkan halaman kosong saat dicetak di printer kasir (58mm/80mm thermal paper).
* **Solusi UI/UX & Print:**
  - Tambahkan rincian **Tunai** dan **Kembalian** pada struk.
  - Rapikan CSS `@media print` agar khusus diformat untuk lebar thermal printer (`width: 58mm` atau `80mm`).
  - Tambahkan nama Kasir / Operator yang melayani di bagian header struk.
* **Petunjuk CSS Print:**
  ```css
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      background: white;
      color: black;
      font-family: 'JetBrains Mono', monospace;
    }
    .print-receipt-container {
      width: 100%;
      padding: 8px;
    }
  }
  ```

---

### 6. Backend Validation & Transaction Safety
* **File Target:** [`src/app/api/pos/checkout/route.ts`](file:///d:/shenzen/magang/SmartStock/smart-stock-repo/src/app/api/pos/checkout/route.ts)
* **Permasalahan:** Kurang validasi pada quantity (mencegah `quantity <= 0` atau pecahan desimal tidak valid).
* **Solusi Backend:**
  - Pastikan setiap item di `items` memiliki `quantity > 0` dan merupakan bilangan bulat integer (`Number.isInteger(item.quantity)`).
  - Sertakan informasi `cashGiven` dan `changeGiven` dalam catatan / notes `StockMovement` atau response checkout untuk auditability yang lebih baik.

---

## 🎨 Panduan Desain & Token Warna (Warehouse Signal System)

Pastikan semua komponen UI baru menggunakan CSS Custom Properties yang telah terdefinisi di `src/styles/design-system.css`:

| Elemen UI | CSS Variable | Contoh Nilai |
|---|---|---|
| Background Utama | `var(--color-surface)` | `#F8F9FB` |
| Card / Panel | `var(--color-card)` | `#FFFFFF` |
| Primary Text & Brand | `var(--color-brand)` | `#071639` |
| CTA Main Accent (Bayar) | `var(--color-accent)` | `#FEA619` |
| Status Stok Safe (Hijau) | `var(--color-ok)` | `#10B981` |
| Status Stok Empty (Merah) | `var(--color-critical)` | `#EF4444` |
| Font Mono (Nominal & SKU) | `var(--font-mono)` | `'JetBrains Mono', monospace` |
| Touch Target Minimum | `var(--touch-target)` | `48px` |

---

## ✅ Criteria of Acceptance (Definition of Done)

Sebelum mengajukan Pull Request (PR), pastikan seluruh poin kriteria penerimaan ini telah terpenuhi:

1. [ ] **Role Access**: User dengan role `OWNER`, `ADMIN`, maupun `KASIR` dapat membuka `/kasir` tanpa ter-redirect.
2. [ ] **Search Experience**: Kasir dapat mengetik nama produk (misal: "baut") dan muncul saran produk yang bisa diklik untuk langsung masuk keranjang.
3. [ ] **Kalkulasi Kembalian**: Field "Uang Dibayar" berfungsi dengan kalkulasi kembalian real-time. Tombol "Bayar Sekarang" tidak bisa diklik jika uang tunai kurang.
4. [ ] **Button Shortcut Nominal**: Tersedia tombol shortcut nominal pecahan uang (Pas, 20k, 50k, 100k) untuk mempercepat transaksi kasir.
5. [ ] **Struk Cetak**: Struk menampilkan Rincian Item, Total, Uang Tunai, Kembalian, dan Nama Lokasi dengan tampilan rapi saat ditekan "Cetak Struk".
6. [ ] **TypeScript Check**: Jalankan `npm run type-check` dan pastikan **0 errors**.
7. [ ] **Unit Tests**: Jalankan `npm test` dan pastikan seluruh test suite **PASS**.

---

## 🧪 Langkah Pengujian Manual (QA Checklist)

1. Buka browser dan login sebagai `ADMIN` atau `OWNER`.
2. Akses halaman `/kasir`.
3. Pilih salah satu Lokasi Toko / Gudang.
4. Uji coba scan/pencarian:
   - Ketik SKU exact (misal `SKU-1102`) -> Produk otomatis masuk ke keranjang.
   - Ketik nama produk partial (misal `Baut`) -> Muncul daftar saran produk.
5. Masukkan nominal uang dibayar yang kurang dari total -> Pastikan tombol "Bayar Sekarang" ter-disabled dan muncul warning.
6. Klik tombol nominal shortcut (misal `100.000`) -> Pastikan nominal terisi dan kembalian terhitung dengan benar.
7. Klik **Bayar Sekarang** -> Modal Struk muncul dengan data referensi transaksi.
8. Klik **Cetak Struk** -> Pastikan preview cetak tidak berantakan.

---
*Dokumen ini dibuat sebagai panduan resmi pengembangan untuk modul Kasir (POS) SmartStock.*
