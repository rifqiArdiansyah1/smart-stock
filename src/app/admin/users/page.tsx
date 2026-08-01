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
    <div className="flex flex-col gap-6 w-full animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
            Manajemen User
          </h2>
          <p className="font-sans text-slate-500 dark:text-slate-400 text-sm mt-1">
            Kelola akun karyawan, role, dan status akses di SmartStock.
          </p>
        </div>
        <UserForm />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{users.length}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Total Pengguna</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{activeCount}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Akun Aktif</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex items-center gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{inactiveCount}</p>
            <p className="font-sans text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Nonaktif</p>
          </div>
        </div>
      </div>

      {/* ── Client Component (Table) ── */}
      <UserTable
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={session.user.id}
      />
      
      {/* Note */}
      <p className="text-center text-xs text-slate-400 pb-4 mt-2">
        Menonaktifkan user tidak menghapus data mereka — riwayat aktivitas dan audit tetap tersimpan di database.
      </p>
    </div>
  );
}
