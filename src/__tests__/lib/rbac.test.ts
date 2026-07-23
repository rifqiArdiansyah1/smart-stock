/**
 * Unit Tests: RBAC — hasPermission, PERMISSION_MATRIX
 *
 * Menguji bahwa guard RBAC memblokir user tanpa permission
 * dan mengizinkan user dengan permission yang sesuai.
 */

import {
  PERMISSIONS,
  PERMISSION_MATRIX,
  hasPermission,
  isAllowedRole,
  ROLES,
} from '@/lib/rbac';

// ── hasPermission ─────────────────────────────────────────────────────────────
describe('hasPermission', () => {
  describe('OWNER', () => {
    it('OWNER dapat melihat produk', () => {
      expect(hasPermission(PERMISSIONS.VIEW_PRODUCTS, 'OWNER')).toBe(true);
    });

    it('OWNER dapat mengelola produk', () => {
      expect(hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'OWNER')).toBe(true);
    });

    it('OWNER dapat approve opname', () => {
      expect(hasPermission(PERMISSIONS.APPROVE_OPNAME, 'OWNER')).toBe(true);
    });

    it('OWNER dapat melihat audit log', () => {
      expect(hasPermission(PERMISSIONS.VIEW_AUDIT_LOG, 'OWNER')).toBe(true);
    });
  });

  describe('ADMIN', () => {
    it('ADMIN dapat mengelola produk', () => {
      expect(hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'ADMIN')).toBe(true);
    });

    it('ADMIN dapat input opname', () => {
      expect(hasPermission(PERMISSIONS.INPUT_OPNAME, 'ADMIN')).toBe(true);
    });

    it('ADMIN dapat approve opname (sesuai matriks)', () => {
      // Berdasarkan PERMISSION_MATRIX: APPROVE_OPNAME → [OWNER, ADMIN]
      expect(hasPermission(PERMISSIONS.APPROVE_OPNAME, 'ADMIN')).toBe(true);
    });

    it('ADMIN TIDAK dapat melihat audit log (hanya OWNER)', () => {
      expect(hasPermission(PERMISSIONS.VIEW_AUDIT_LOG, 'ADMIN')).toBe(false);
    });
  });

  describe('KASIR', () => {
    it('KASIR dapat melihat produk', () => {
      expect(hasPermission(PERMISSIONS.VIEW_PRODUCTS, 'KASIR')).toBe(true);
    });

    it('KASIR dapat melakukan transaksi penjualan', () => {
      expect(hasPermission(PERMISSIONS.CREATE_TRANSACTION, 'KASIR')).toBe(true);
    });

    it('KASIR TIDAK bisa mengelola produk', () => {
      expect(hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'KASIR')).toBe(false);
    });

    it('KASIR TIDAK bisa input opname', () => {
      expect(hasPermission(PERMISSIONS.INPUT_OPNAME, 'KASIR')).toBe(false);
    });

    it('KASIR TIDAK bisa approve opname', () => {
      expect(hasPermission(PERMISSIONS.APPROVE_OPNAME, 'KASIR')).toBe(false);
    });

    it('KASIR TIDAK bisa melihat audit log', () => {
      expect(hasPermission(PERMISSIONS.VIEW_AUDIT_LOG, 'KASIR')).toBe(false);
    });

    it('KASIR TIDAK bisa melihat laporan', () => {
      expect(hasPermission(PERMISSIONS.VIEW_REPORTS, 'KASIR')).toBe(false);
    });
  });

  describe('STAFF_GUDANG', () => {
    it('STAFF_GUDANG dapat melihat produk', () => {
      expect(hasPermission(PERMISSIONS.VIEW_PRODUCTS, 'STAFF_GUDANG')).toBe(true);
    });

    it('STAFF_GUDANG dapat input opname', () => {
      expect(hasPermission(PERMISSIONS.INPUT_OPNAME, 'STAFF_GUDANG')).toBe(true);
    });

    it('STAFF_GUDANG TIDAK bisa approve opname', () => {
      expect(hasPermission(PERMISSIONS.APPROVE_OPNAME, 'STAFF_GUDANG')).toBe(false);
    });

    it('STAFF_GUDANG TIDAK bisa mengelola produk', () => {
      expect(hasPermission(PERMISSIONS.MANAGE_PRODUCTS, 'STAFF_GUDANG')).toBe(false);
    });
  });
});

// ── isAllowedRole ─────────────────────────────────────────────────────────────
describe('isAllowedRole', () => {
  it('mengembalikan true jika role ada dalam daftar', () => {
    expect(isAllowedRole('ADMIN', [ROLES.OWNER, ROLES.ADMIN])).toBe(true);
  });

  it('mengembalikan false jika role tidak ada dalam daftar', () => {
    expect(isAllowedRole('KASIR', [ROLES.OWNER, ROLES.ADMIN])).toBe(false);
  });

  it('mengembalikan false untuk role tidak dikenal', () => {
    expect(isAllowedRole('SUPERUSER', [ROLES.OWNER])).toBe(false);
  });
});

// ── PERMISSION_MATRIX integritas ─────────────────────────────────────────────
describe('PERMISSION_MATRIX integrity', () => {
  it('setiap permission memiliki setidaknya satu role', () => {
    for (const [perm, roles] of Object.entries(PERMISSION_MATRIX)) {
      expect(roles.length).toBeGreaterThan(0);
    }
  });

  it('OWNER selalu ada di setiap permission', () => {
    for (const [perm, roles] of Object.entries(PERMISSION_MATRIX)) {
      expect(roles).toContain(ROLES.OWNER);
    }
  });

  it('tidak ada duplikasi role dalam satu permission', () => {
    for (const [perm, roles] of Object.entries(PERMISSION_MATRIX)) {
      const unique = new Set(roles);
      expect(unique.size).toBe(roles.length);
    }
  });
});
