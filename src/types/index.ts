/**
 * SmartStock — Global TypeScript Types
 *
 * File ini berisi type definitions yang dipakai
 * di seluruh aplikasi SmartStock.
 */

// ── User & Auth ──────────────────────────────────────
export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF_GUDANG' | 'KASIR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
}

// ── Product ──────────────────────────────────────────
export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category?: string;
  minStock: number;
  expiryDate?: Date;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Location ─────────────────────────────────────────
export type LocationType = 'GUDANG' | 'RAK' | 'AREA' | 'TOKO';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description?: string;
}

// ── Stock ─────────────────────────────────────────────
export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
  product?: Product;
  location?: Location;
}

export type StockMovementType = 'SALE' | 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'LOSS';

export interface StockMovement {
  id: string;
  productId: string;
  actorId: string;
  locationId?: string;
  type: StockMovementType;
  quantityChange: number;
  notes?: string;
  createdAt: Date;
  product?: Product;
  actor?: User;
}

// ── Stock Opname ──────────────────────────────────────
export type OpnameStatus = 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface StockOpnameSession {
  id: string;
  locationId: string;
  startedBy: string;
  status: OpnameStatus;
  startedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
  reviewNotes?: string;
  location?: Location;
  startedByUser?: User;
  items?: StockOpnameItem[];
}

export interface StockOpnameItem {
  id: string;
  sessionId: string;
  productId: string;
  systemQty: number;
  physicalQty: number;
  difference: number; // systemQty - physicalQty
  notes?: string;
  product?: Product;
}

// ── Audit ─────────────────────────────────────────────
export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  createdAt: Date;
  actor?: User;
}

// ── Notification ──────────────────────────────────────
export type NotificationType = 'LOW_STOCK' | 'EXPIRY' | 'OPNAME_SUBMITTED' | 'OPNAME_APPROVED' | 'OPNAME_REJECTED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

// ── Stock Status Helper ───────────────────────────────
export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export function getStockStatus(quantity: number, minStock: number): StockStatus {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity <= minStock * 0.5) return 'CRITICAL';
  if (quantity <= minStock) return 'LOW';
  return 'NORMAL';
}

// ── API Response Wrapper ──────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Common Query Params ───────────────────────────────
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
