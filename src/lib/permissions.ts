/**
 * SmartStock — RBAC Permission Utilities
 *
 * Helper untuk cek permission berdasarkan role user.
 * Dipakai di server-side (API routes) dan client-side (UI guard).
 */

import { UserRole } from '@/types';
import {
  APPROVAL_ROLES,
  OPNAME_INPUT_ROLES,
  ANALYTICS_ROLES,
  ROLES,
} from '@/types/constants';

/**
 * Cek apakah role tertentu bisa melakukan approval opname.
 */
export function canApproveOpname(role: UserRole): boolean {
  return (APPROVAL_ROLES as readonly string[]).includes(role);
}

/**
 * Cek apakah role tertentu bisa input fisik opname.
 */
export function canInputOpname(role: UserRole): boolean {
  return (OPNAME_INPUT_ROLES as readonly string[]).includes(role);
}

/**
 * Cek apakah role tertentu bisa melihat analytics & laporan.
 */
export function canViewAnalytics(role: UserRole): boolean {
  return (ANALYTICS_ROLES as readonly string[]).includes(role);
}

/**
 * Cek apakah role tertentu bisa melihat audit log.
 */
export function canViewAuditLog(role: UserRole): boolean {
  return role === ROLES.OWNER;
}

/**
 * Cek apakah role tertentu bisa mengelola produk.
 */
export function canManageProducts(role: UserRole): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

/**
 * Cek apakah role tertentu bisa mengelola user.
 */
export function canManageUsers(role: UserRole): boolean {
  return role === ROLES.OWNER;
}

/**
 * Cek apakah role tertentu bisa melakukan transaksi POS.
 */
export function canDoTransaction(role: UserRole): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.KASIR;
}

/**
 * Permission matrix — lengkap.
 * Digunakan untuk generate UI navigation dan API guard.
 */
export const PERMISSION_MATRIX = {
  inputOpname:    [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF_GUDANG],
  approveOpname:  [ROLES.OWNER, ROLES.ADMIN],
  viewAnalytics:  [ROLES.OWNER, ROLES.ADMIN],
  doTransaction:  [ROLES.OWNER, ROLES.ADMIN, ROLES.KASIR],
  manageProducts: [ROLES.OWNER, ROLES.ADMIN],
  manageUsers:    [ROLES.OWNER],
  viewAuditLog:   [ROLES.OWNER],
  viewStock:      [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF_GUDANG],
} as const satisfies Record<string, UserRole[]>;

/**
 * Check apakah user punya permission tertentu.
 */
export function hasPermission(
  role: UserRole,
  permission: keyof typeof PERMISSION_MATRIX,
): boolean {
  return (PERMISSION_MATRIX[permission] as readonly string[]).includes(role);
}
