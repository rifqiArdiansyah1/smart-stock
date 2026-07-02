import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import LocationsClient from './LocationsClient';

export const metadata: Metadata = {
  title: 'Manajemen Lokasi — SmartStock',
  description: 'Kelola lokasi penyimpanan barang di SmartStock',
};

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role as string;
  const canManage = role === ROLES.OWNER || role === ROLES.ADMIN;

  const locations = await db.location.findMany({
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      type: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { stockLevels: true, opnameSessions: true },
      },
    },
  });

  const activeCount = locations.filter((l) => l.isActive).length;
  const typeCount = new Set(locations.map((l) => l.type)).size;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
            <span>/</span>
            <span className="text-slate-600 font-medium">Lokasi</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Lokasi</h1>
          <p className="text-slate-500 text-sm mt-1">
            Definisikan gudang, rak, dan area untuk opname inventaris.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Lokasi', value: locations.length, icon: '📍', color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60' },
            { label: 'Aktif', value: activeCount, icon: '✅', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200/60' },
            { label: 'Nonaktif', value: locations.length - activeCount, icon: '🚫', color: 'from-slate-400/10 to-slate-500/10 border-slate-200' },
            { label: 'Tipe', value: typeCount, icon: '🗂️', color: 'from-purple-500/10 to-violet-500/10 border-purple-200/60' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl px-5 py-4`}>
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Client Component */}
        <LocationsClient
          initialLocations={locations.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
          }))}
          canManage={canManage}
        />

        <p className="text-center text-xs text-slate-400 pb-4">
          Lokasi yang dinonaktifkan tidak bisa dipilih saat membuat sesi opname baru.
        </p>
      </div>
    </main>
  );
}
