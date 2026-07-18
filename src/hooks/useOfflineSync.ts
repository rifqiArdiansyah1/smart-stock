'use client';

/**
 * SmartStock — useOfflineSync Hook
 *
 * React hook yang:
 * 1. Mendeteksi perubahan status koneksi (online/offline)
 * 2. Otomatis flush opname_queue ke server saat kembali online
 * 3. Otomatis sync products_cache dari server saat pertama online
 * 4. Expose status sinkronisasi ke komponen yang menggunakannya
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { flushOpnameQueue, syncProductsCache, SyncResult } from '@/lib/sync';

export type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  syncState: SyncState;
  lastSyncResult: SyncResult | null;
  lastSyncAt: Date | null;
  triggerSync: () => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const isSyncing = useRef(false);

  const triggerSync = useCallback(async () => {
    if (isSyncing.current || !navigator.onLine) return;

    isSyncing.current = true;
    setSyncState('syncing');

    try {
      // Flush pending opname items
      const result = await flushOpnameQueue();
      setLastSyncResult(result);
      setLastSyncAt(new Date());
      setSyncState('success');

      if (result.synced > 0) {
        console.log(`[useOfflineSync] Synced ${result.synced} opname items`);
      }
    } catch (err) {
      setSyncState('error');
      console.error('[useOfflineSync] Sync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('[useOfflineSync] Back online — triggering sync');

      // Sync products cache saat baru online
      await syncProductsCache();
      // Flush queue
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('idle');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync products cache saat pertama load (jika online)
    if (navigator.onLine) {
      syncProductsCache().catch(console.error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  return { isOnline, syncState, lastSyncResult, lastSyncAt, triggerSync };
}
