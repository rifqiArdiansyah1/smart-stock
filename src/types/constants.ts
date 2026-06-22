/**
 * SmartStock — Constants & Configuration
 *
 * Konstanta global yang dipakai di seluruh aplikasi.
 */

// ── App Metadata ─────────────────────────────────────
export const APP_NAME = 'SmartStock';
export const APP_DESCRIPTION = 'Sistem manajemen stok cerdas — anti-selisih, penuh audit trail';
export const APP_VERSION = '0.1.0';

// ── Pagination ────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Stock Thresholds ──────────────────────────────────
/** Persentase dari min_stock untuk status CRITICAL */
export const CRITICAL_STOCK_THRESHOLD = 0.5;

// ── Expiry Alert Windows (days) ───────────────────────
export const EXPIRY_ALERT_DAYS = [30, 14, 7] as const;

// ── Low-stock alert dedup window ─────────────────────
/** Jangan kirim ulang notifikasi low-stock dalam 24 jam */
export const LOW_STOCK_ALERT_TTL_HOURS = 24;

// ── Roles ─────────────────────────────────────────────
export const ROLES = {
  OWNER:        'OWNER',
  ADMIN:        'ADMIN',
  STAFF_GUDANG: 'STAFF_GUDANG',
  KASIR:        'KASIR',
} as const;

/** Role yang bisa approve opname */
export const APPROVAL_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const;

/** Role yang bisa input fisik opname */
export const OPNAME_INPUT_ROLES = [ROLES.OWNER, ROLES.ADMIN, ROLES.STAFF_GUDANG] as const;

/** Role yang bisa lihat analytics */
export const ANALYTICS_ROLES = [ROLES.OWNER, ROLES.ADMIN] as const;

// ── Opname Status ─────────────────────────────────────
export const OPNAME_STATUS = {
  IN_PROGRESS:       'IN_PROGRESS',
  PENDING_APPROVAL:  'PENDING_APPROVAL',
  APPROVED:          'APPROVED',
  REJECTED:          'REJECTED',
} as const;

// ── Stock Movement Types ──────────────────────────────
export const MOVEMENT_TYPES = {
  SALE:       'SALE',
  RESTOCK:    'RESTOCK',
  ADJUSTMENT: 'ADJUSTMENT',
  RETURN:     'RETURN',
  LOSS:       'LOSS',
} as const;

// ── API Route Prefixes ────────────────────────────────
export const API_PREFIX = '/api/v1';

export const API_ROUTES = {
  AUTH:         `${API_PREFIX}/auth`,
  USERS:        `${API_PREFIX}/users`,
  PRODUCTS:     `${API_PREFIX}/products`,
  LOCATIONS:    `${API_PREFIX}/locations`,
  STOCK:        `${API_PREFIX}/stock`,
  OPNAME:       `${API_PREFIX}/opname`,
  AUDIT:        `${API_PREFIX}/audit`,
  ANALYTICS:    `${API_PREFIX}/analytics`,
  NOTIFICATIONS:`${API_PREFIX}/notifications`,
} as const;

// ── Redis Key Prefixes ────────────────────────────────
export const REDIS_KEYS = {
  STOCK_LEVEL:        (productId: string, locationId: string) => `stock:${productId}:${locationId}`,
  LOW_STOCK_ALERT:    (productId: string) => `alert:low-stock:${productId}`,
  OPNAME_LOCK:        (locationId: string) => `opname:lock:${locationId}`,
  USER_SESSION:       (userId: string) => `session:${userId}`,
} as const;
