import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROLES } from '@/lib/rbac';
import { db } from '@/lib/db';
import UserTable from './UserTable';
import UserForm from './UserForm';

export const metadata: Metadata = {
  title: 'Manajemen User — SmartStock',
  description: 'Kelola akun pengguna dan role di SmartStock',
};

export default async function UsersPage() {
  // Guard: hanya OWNER yang bisa mengakses halaman ini
  const session = await auth();
  if (!session?.user) redirect('/login');
  if ((session.user as any).role !== ROLES.OWNER) {
    redirect('/');
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.length - activeCount;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <a href="/" className="hover:text-slate-600 transition-colors">Dashboard</a>
              <span>/</span>
              <span className="text-slate-600 font-medium">Manajemen User</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen User</h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola akun karyawan, role, dan status akses di SmartStock.
            </p>
          </div>
          <UserForm />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Pengguna', value: users.length, icon: '👥', color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60' },
            { label: 'Aktif', value: activeCount, icon: '✅', color: 'from-emerald-500/10 to-green-500/10 border-emerald-200/60' },
            { label: 'Nonaktif', value: inactiveCount, icon: '🚫', color: 'from-slate-400/10 to-slate-500/10 border-slate-200' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl px-5 py-4`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* User Table */}
        <UserTable
          users={users.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
          }))}
          currentUserId={session.user.id}
        />

        {/* Note */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Menonaktifkan user tidak menghapus data mereka — riwayat audit tetap tersimpan.
        </p>
      </div>
    </main>
  );
}
