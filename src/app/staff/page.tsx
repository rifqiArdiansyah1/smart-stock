/**
 * Staff Home — Warehouse Signal (Mobile)
 * Placeholder untuk Hari 3 (ISSUE-029-D3)
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Halaman utama staf gudang',
};

export default function StaffHomePage() {
  return (
    <div style={{ padding: 'var(--space-margin-mobile)' }}>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
        Halaman Home Staf — akan diimplementasi di Hari 3 (ISSUE-029-D3)
      </p>
    </div>
  );
}
