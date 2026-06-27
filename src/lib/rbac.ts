/**
 * SmartStock — RBAC (Role-Based Access Control)
 *
 * Mendefinisikan semua Role, Permission, dan matriks akses
 * yang digunakan di seluruh sistem SmartStock.
 *
 * ⚠️  Permission ditegakkan di BACKEND (API Route), bukan di UI.
 *    UI hanya boleh menyembunyikan elemen sebagai UX improvement.
 *
 * Referensi: Arsitektur §8 - Keamanan & Matriks Peran
 */

// ══════════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════════

/**
 * Daftar Role yang ada di SmartStock.
 * Harus sinkron dengan enum `Role` di schema.prisma.
 */
export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  STAFF_GUDANG: 'STAFF_GUDANG',
  KASIR: 'KASIR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ══════════════════════════════════════════════════════════════
// PERMISSIONS (Aksi-aksi yang bisa dilakukan)
// ══════════════════════════════════════════════════════════════

export const PERMISSIONS = {
  // Inventaris & Produk
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS', // Tambah / Edit / Hapus produk

  // Stock Opname
  INPUT_OPNAME: 'INPUT_OPNAME',     // Input fisik opname
  APPROVE_OPNAME: 'APPROVE_OPNAME', // Approve / Tolak hasil opname

  // Penjualan (POS)
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',

  // Laporan & Analitik
  VIEW_REPORTS: 'VIEW_REPORTS',

  // Audit Log
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ══════════════════════════════════════════════════════════════
// PERMISSION MATRIX
// Memetakan setiap Permission ke daftar Role yang diizinkan.
//
// | Aksi                      | Owner | Admin | Staff Gudang | Kasir |
// |---------------------------|:-----:|:-----:|:------------:|:-----:|
// | Lihat produk              |  ✓   |  ✓   |     ✓        |  ✓   |
// | Tambah/edit produk        |  ✓   |  ✓   |     –        |  –   |
// | Input fisik opname        |  ✓   |  ✓   |     ✓        |  –   |
// | Approve hasil opname      |  ✓   |  ✓   |     –        |  –   |
// | Transaksi penjualan (POS) |  ✓   |  ✓   |     –        |  ✓   |
// | Lihat laporan & analitik  |  ✓   |  ✓   |     –        |  –   |
// | Lihat audit log           |  ✓   |  –   |     –        |  –   |
// ══════════════════════════════════════════════════════════════

export const PERMISSION_MATRIX: Record<Permission, Role[]> = {
  [PERMISSIONS.VIEW_PRODUCTS]: [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.STAFF_GUDANG,
    ROLES.KASIR,
  ],
  [PERMISSIONS.MANAGE_PRODUCTS]: [
    ROLES.OWNER,
    ROLES.ADMIN,
  ],
  [PERMISSIONS.INPUT_OPNAME]: [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.STAFF_GUDANG,
  ],
  [PERMISSIONS.APPROVE_OPNAME]: [
    ROLES.OWNER,
    ROLES.ADMIN,
  ],
  [PERMISSIONS.CREATE_TRANSACTION]: [
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.KASIR,
  ],
  [PERMISSIONS.VIEW_REPORTS]: [
    ROLES.OWNER,
    ROLES.ADMIN,
  ],
  [PERMISSIONS.VIEW_AUDIT_LOG]: [
    ROLES.OWNER,
  ],
};

// ══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════

/**
 * Cek apakah sebuah role memiliki izin untuk melakukan suatu aksi.
 *
 * @example
 * hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'KASIR') // false
 * hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'ADMIN') // true
 */
export function hasPermission(permission: Permission, role: Role): boolean {
  return PERMISSION_MATRIX[permission].includes(role);
}

/**
 * Cek apakah sebuah role ada dalam daftar role yang diizinkan.
 *
 * @example
 * isAllowedRole('KASIR', [ROLES.OWNER, ROLES.ADMIN]) // false
 * isAllowedRole('ADMIN', [ROLES.OWNER, ROLES.ADMIN]) // true
 */
export function isAllowedRole(role: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role as Role);
}
