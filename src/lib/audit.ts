/**
 * SmartStock — Audit Trail Utility
 *
 * Fungsi helper untuk menulis ke tabel audit_logs.
 * Dipanggil dari service layer setiap ada create/update/delete.
 *
 * PENTING: Audit trail TIDAK menggunakan DB trigger,
 * karena trigger tidak punya konteks "siapa user yang login".
 * Semua penulisan audit dilakukan di level aplikasi.
 */

import { db } from '@/lib/db';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'STOCK_ADJUSTMENT';

export type AuditEntityType =
  | 'User'
  | 'Product'
  | 'Location'
  | 'StockMovement'
  | 'StockOpnameSession'
  | 'StockOpnameItem';

/**
 * Menulis satu entri ke audit_logs.
 * Tabel audit_logs bersifat APPEND-ONLY — tidak ada UPDATE/DELETE.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValue: entry.oldValue ? (entry.oldValue as object) : undefined,
      newValue: entry.newValue ? (entry.newValue as object) : undefined,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    },
  });
}

/**
 * Higher-order function: membungkus service method dengan audit trail.
 * Gunakan ini untuk setiap operasi CUD (create/update/delete).
 *
 * @example
 * const updateProduct = withAudit(
 *   async (id, data) => db.product.update(...),
 *   { action: 'UPDATE', entityType: 'Product', actorId: userId }
 * );
 */
export function withAudit<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  auditMeta: {
    action: AuditAction;
    entityType: AuditEntityType;
    actorId: string;
    getEntityId: (...args: TArgs) => string;
    getOldValue?: (...args: TArgs) => Promise<Record<string, unknown> | undefined>;
    ipAddress?: string;
    userAgent?: string;
  },
) {
  return async (...args: TArgs): Promise<TResult> => {
    const oldValue = auditMeta.getOldValue ? await auditMeta.getOldValue(...args) : undefined;
    const result = await fn(...args);
    const entityId = auditMeta.getEntityId(...args);

    await writeAuditLog({
      actorId: auditMeta.actorId,
      action: auditMeta.action,
      entityType: auditMeta.entityType,
      entityId,
      oldValue,
      newValue: result as Record<string, unknown>,
      ipAddress: auditMeta.ipAddress,
      userAgent: auditMeta.userAgent,
    });

    return result;
  };
}
