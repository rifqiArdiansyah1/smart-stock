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
  OWNER: 'bg-purple-100 text-purple-700 ring-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 ring-blue-200',
  STAFF_GUDANG: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  KASIR: 'bg-amber-100 text-amber-700 ring-amber-200',
};

function RoleBadge({ role }: { role: string }) {
  const colors = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${colors}`}>
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
    <tr className={`transition-colors ${!user.isActive ? 'opacity-50' : 'hover:bg-slate-50/80'}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">{user.name[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {user.name}
              {isSelf && <span className="ml-1.5 text-xs text-primary-600 font-normal">(Anda)</span>}
            </p>
            <p className="text-slate-400 text-xs">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {editingRole ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              {Object.entries(ROLE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleRoleSave}
              disabled={isPending}
              className="text-xs px-2.5 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              {isPending ? '...' : 'Simpan'}
            </button>
            <button
              onClick={() => { setEditingRole(false); setSelectedRole(user.role); }}
              className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => !isSelf && setEditingRole(true)}
            disabled={isSelf}
            title={isSelf ? 'Tidak bisa mengubah role sendiri' : 'Klik untuk edit role'}
            className="group flex items-center gap-1.5 disabled:cursor-default"
          >
            <RoleBadge role={user.role} />
            {!isSelf && (
              <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </button>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${user.isActive ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
          {user.isActive ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-400">{createdAt}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {feedback && <span className="text-xs text-red-500">{feedback}</span>}
          {!isSelf && (
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
                user.isActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200'
                  : 'bg-green-50 text-green-600 hover:bg-green-100 ring-1 ring-green-200'
              }`}
            >
              {isPending ? '...' : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UserTable({ users, currentUserId }: { users: User[]; currentUserId?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bergabung</th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={currentUserId} />
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <p className="text-lg font-medium">Belum ada pengguna</p>
          <p className="text-sm mt-1">Tambah pengguna baru menggunakan tombol di atas.</p>
        </div>
      )}
    </div>
  );
}
