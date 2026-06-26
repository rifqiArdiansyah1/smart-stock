import { db as prisma } from '../src/lib/db';
import * as bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding SmartStock database...\n');

  // ── Tenant ID (hardcoded untuk MVP single-tenant) ─────────
  const TENANT_ID = '00000000-0000-0000-0000-000000000001';

  // ══════════════════════════════════════════════════════════
  // 1. USERS
  // ══════════════════════════════════════════════════════════
  console.log('👤 Creating users...');

  const passwordHash = await bcrypt.hash('smartstock123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@smartstock.app' },
    update: {},
    create: {
      name: 'Owner SmartStock',
      email: 'owner@smartstock.app',
      password: passwordHash,
      role: 'OWNER',
      tenantId: TENANT_ID,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartstock.app' },
    update: {},
    create: {
      name: 'Admin Gudang',
      email: 'admin@smartstock.app',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: TENANT_ID,
    },
  });

  const staffGudang = await prisma.user.upsert({
    where: { email: 'staff@smartstock.app' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'staff@smartstock.app',
      password: passwordHash,
      role: 'STAFF_GUDANG',
      tenantId: TENANT_ID,
    },
  });

  const kasir = await prisma.user.upsert({
    where: { email: 'kasir@smartstock.app' },
    update: {},
    create: {
      name: 'Siti Rahayu',
      email: 'kasir@smartstock.app',
      password: passwordHash,
      role: 'KASIR',
      tenantId: TENANT_ID,
    },
  });

  console.log(`  ✓ Owner:       ${owner.email}`);
  console.log(`  ✓ Admin:       ${admin.email}`);
  console.log(`  ✓ Staff:       ${staffGudang.email}`);
  console.log(`  ✓ Kasir:       ${kasir.email}`);

  // ══════════════════════════════════════════════════════════
  // 2. LOCATIONS
  // ══════════════════════════════════════════════════════════
  console.log('\n📍 Creating locations...');

  const gudangUtama = await prisma.location.upsert({
    where: { id: '00000000-0000-0000-0001-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000001',
      name: 'Gudang Utama',
      type: 'GUDANG',
      description: 'Gudang penyimpanan utama',
    },
  });

  const rakA = await prisma.location.upsert({
    where: { id: '00000000-0000-0000-0001-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000002',
      name: 'Rak A — Minuman',
      type: 'RAK',
      description: 'Rak khusus produk minuman',
    },
  });

  const rakB = await prisma.location.upsert({
    where: { id: '00000000-0000-0000-0001-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000003',
      name: 'Rak B — Makanan',
      type: 'RAK',
      description: 'Rak khusus produk makanan & snack',
    },
  });

  const areaToko = await prisma.location.upsert({
    where: { id: '00000000-0000-0000-0001-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0001-000000000004',
      name: 'Area Toko',
      type: 'TOKO',
      description: 'Display produk di area kasir',
    },
  });

  console.log(`  ✓ ${gudangUtama.name}`);
  console.log(`  ✓ ${rakA.name}`);
  console.log(`  ✓ ${rakB.name}`);
  console.log(`  ✓ ${areaToko.name}`);

  // ══════════════════════════════════════════════════════════
  // 3. PRODUCTS
  // ══════════════════════════════════════════════════════════
  console.log('\n📦 Creating products...');

  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: 'AQU-600ML' },
      update: {},
      create: {
        sku: 'AQU-600ML',
        barcode: '8995566778800',
        name: 'Aqua Botol 600ml',
        category: 'Minuman',
        unit: 'botol',
        minStock: 24,
        price: 4000,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'AQU-1500ML' },
      update: {},
      create: {
        sku: 'AQU-1500ML',
        barcode: '8995566778801',
        name: 'Aqua Botol 1500ml',
        category: 'Minuman',
        unit: 'botol',
        minStock: 12,
        price: 6500,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'TEH-BOTOL-350' },
      update: {},
      create: {
        sku: 'TEH-BOTOL-350',
        barcode: '8991101114491',
        name: 'Teh Botol Sosro 350ml',
        category: 'Minuman',
        unit: 'botol',
        minStock: 24,
        price: 5000,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'INDOMIE-GRG' },
      update: {},
      create: {
        sku: 'INDOMIE-GRG',
        barcode: '8991204100002',
        name: 'Indomie Goreng',
        category: 'Makanan',
        unit: 'pcs',
        minStock: 50,
        price: 3500,
        expiryDate: new Date('2026-12-31'),
      },
    }),
    prisma.product.upsert({
      where: { sku: 'INDOMIE-AYM' },
      update: {},
      create: {
        sku: 'INDOMIE-AYM',
        barcode: '8991204100003',
        name: 'Indomie Ayam Bawang',
        category: 'Makanan',
        unit: 'pcs',
        minStock: 50,
        price: 3500,
        expiryDate: new Date('2026-12-31'),
      },
    }),
    prisma.product.upsert({
      where: { sku: 'CHITATO-75G' },
      update: {},
      create: {
        sku: 'CHITATO-75G',
        barcode: '8998866800001',
        name: 'Chitato Sapi Panggang 75g',
        category: 'Snack',
        unit: 'pcs',
        minStock: 20,
        price: 12000,
        expiryDate: new Date('2026-09-30'),
      },
    }),
    prisma.product.upsert({
      where: { sku: 'GULA-1KG' },
      update: {},
      create: {
        sku: 'GULA-1KG',
        barcode: '8991010000011',
        name: 'Gula Pasir 1 Kg',
        category: 'Sembako',
        unit: 'kg',
        minStock: 10,
        price: 15000,
      },
    }),
    prisma.product.upsert({
      where: { sku: 'BERAS-5KG' },
      update: {},
      create: {
        sku: 'BERAS-5KG',
        barcode: '8991010000012',
        name: 'Beras Premium 5 Kg',
        category: 'Sembako',
        unit: 'karung',
        minStock: 5,
        price: 72000,
      },
    }),
    // Produk mendekati expired (untuk test alert)
    prisma.product.upsert({
      where: { sku: 'ROTI-TAWAR' },
      update: {},
      create: {
        sku: 'ROTI-TAWAR',
        barcode: '8885000000001',
        name: 'Roti Tawar Sari Roti',
        category: 'Roti & Kue',
        unit: 'pcs',
        minStock: 10,
        price: 18500,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari dari sekarang
      },
    }),
    // Produk stok rendah (untuk test alert)
    prisma.product.upsert({
      where: { sku: 'MINYAK-1L' },
      update: {},
      create: {
        sku: 'MINYAK-1L',
        barcode: '8991010000013',
        name: 'Minyak Goreng Bimoli 1L',
        category: 'Sembako',
        unit: 'liter',
        minStock: 15,
        price: 19000,
      },
    }),
  ]);

  console.log(`  ✓ ${products.length} produk berhasil dibuat`);

  // ══════════════════════════════════════════════════════════
  // 4. STOCK LEVELS (initial stock via stock_movements)
  // Catatan: Di production, stock_levels diupdate via trigger.
  // Untuk seed, kita insert langsung ke stock_levels.
  // ══════════════════════════════════════════════════════════
  console.log('\n📊 Setting initial stock levels...');

  const stockData = [
    // Gudang Utama
    { productSku: 'AQU-600ML',    locationId: gudangUtama.id, qty: 120 },
    { productSku: 'AQU-1500ML',   locationId: gudangUtama.id, qty: 60 },
    { productSku: 'TEH-BOTOL-350', locationId: gudangUtama.id, qty: 96 },
    { productSku: 'INDOMIE-GRG',  locationId: gudangUtama.id, qty: 200 },
    { productSku: 'INDOMIE-AYM',  locationId: gudangUtama.id, qty: 180 },
    { productSku: 'CHITATO-75G',  locationId: gudangUtama.id, qty: 48 },
    { productSku: 'GULA-1KG',     locationId: gudangUtama.id, qty: 30 },
    { productSku: 'BERAS-5KG',    locationId: gudangUtama.id, qty: 20 },
    { productSku: 'ROTI-TAWAR',   locationId: gudangUtama.id, qty: 15 },
    { productSku: 'MINYAK-1L',    locationId: gudangUtama.id, qty: 5 },  // LOW STOCK — untuk test alert

    // Rak A (display minuman)
    { productSku: 'AQU-600ML',    locationId: rakA.id, qty: 24 },
    { productSku: 'AQU-1500ML',   locationId: rakA.id, qty: 12 },
    { productSku: 'TEH-BOTOL-350', locationId: rakA.id, qty: 24 },

    // Rak B (display makanan)
    { productSku: 'INDOMIE-GRG',  locationId: rakB.id, qty: 30 },
    { productSku: 'INDOMIE-AYM',  locationId: rakB.id, qty: 30 },
    { productSku: 'CHITATO-75G',  locationId: rakB.id, qty: 20 },
    { productSku: 'ROTI-TAWAR',   locationId: rakB.id, qty: 8 },
  ];

  for (const item of stockData) {
    const product = products.find((p) => p.sku === item.productSku);
    if (!product) continue;

    await prisma.stockLevel.upsert({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: item.locationId,
        },
      },
      update: { quantity: item.qty },
      create: {
        productId: product.id,
        locationId: item.locationId,
        quantity: item.qty,
      },
    });
  }

  console.log(`  ✓ ${stockData.length} stock level records seeded`);

  // ══════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════
  console.log('\n✅ Seeding selesai!\n');
  console.log('📝 Development credentials:');
  console.log('   Owner:       owner@smartstock.app / smartstock123');
  console.log('   Admin:       admin@smartstock.app / smartstock123');
  console.log('   Staff:       staff@smartstock.app / smartstock123');
  console.log('   Kasir:       kasir@smartstock.app / smartstock123');
  console.log('\n⚠️  JANGAN gunakan password ini di production!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
