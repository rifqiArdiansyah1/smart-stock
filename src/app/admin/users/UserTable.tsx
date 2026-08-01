'use client';

import { useState, useTransition } from 'react';
import { updateUserRole, toggleUserStatus } from './actions';
import { ROLES, type Role } from '@/lib/rbac';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string | Date;
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  STAFF_GUDANG: 'Staff Gudang',
  KASIR: 'Kasir',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/20',
  ADMIN: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
  STAFF_GUDANG: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  KASIR: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
};

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ${colors}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function UserRow({ user, currentUserId }: { user: User; currentUserId?: string }) {
  const [isPending, startTransition] = useTransition();
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;

  const handleRoleSave = () => {
    startTransition(async () => {
      const result = await updateUserRole(user.id, selectedRole as Role);
      if (result?.error) {
        setFeedback(result.error);
      } else {
        setEditingRole(false);
        setFeedback(null);
      }
    });
  };

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id, user.isActive);
      if (result?.error) setFeedback(result.error);
    });
  };

  const createdAt = new Date(user.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <tr className={`group transition-colors ${!user.isActive ? 'opacity-60 grayscale-[50%]' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800">
            <span className="text-white font-bold text-sm tracking-wider">{user.name[0]?.toUpperCase()}{user.name[1]?.toLowerCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
              {user.name}
              {isSelf && <span className="inline-flex text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Anda</span>}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {editingRole ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm cursor-pointer"
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleRoleSave}
              disabled={isPending}
              className="text-xs px-2.5 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1"
            >
              {isPending && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Simpan
            </button>
            <button
              onClick={() => { setEditingRole(false); setSelectedRole(user.role); }}
              className="text-xs px-2.5 py-1.5 font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => !isSelf && setEditingRole(true)}
            disabled={isSelf}
            title={isSelf ? 'Tidak bisa mengubah role sendiri' : 'Klik untuk edit role'}
            className="flex items-center gap-2 disabled:cursor-default"
          >
            <RoleBadge role={user.role} />
            {!isSelf && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </span>
            )}
          </button>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          {user.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{createdAt}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs font-medium text-red-500 dark:text-red-400">{feedback}</span>}
          {!isSelf && (
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 flex items-center gap-1.5 ${
                user.isActive
                  ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 focus:ring-red-500'
                  : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:ring-emerald-500'
              }`}
            >
              {isPending ? (
                <>
                  <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${user.isActive ? 'border-red-600 dark:border-red-400' : 'border-emerald-600 dark:border-emerald-400'}`} />
                  Proses...
                </>
              ) : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UserTable({ users, currentUserId }: { users: User[]; currentUserId?: string }) {
  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Daftar Pengguna</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Semua staf terdaftar beserta perannya.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold">Pengguna</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Bergabung</th>
              <th className="px-6 py-4 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {users.map((user) => (
              <UserRow key={user.id} user={user} currentUserId={currentUserId} />
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Belum ada pengguna</p>
          <p className="text-sm mt-1">Tambah pengguna baru menggunakan tombol di atas.</p>
        </div>
      )}
    </div>
  );
}
