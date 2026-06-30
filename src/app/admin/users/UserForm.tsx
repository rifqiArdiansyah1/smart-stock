'use client';

import { useActionState, useState } from 'react';
import { createUser } from './actions';

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF_GUDANG', label: 'Staff Gudang' },
  { value: 'KASIR', label: 'Kasir' },
  { value: 'OWNER', label: 'Owner' },
];

export default function UserForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createUser, undefined);

  // Auto-close modal on success
  if (state?.success && isOpen) setIsOpen(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-primary-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30 active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Tambah User
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Tambah User Baru</h2>
                <p className="text-sm text-slate-500 mt-0.5">Isi data pengguna baru di bawah ini.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  required
                  placeholder="budi@smartstock.app"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="user-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password Sementara
                </label>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                />
                <p className="mt-1 text-xs text-slate-400">Minta karyawan untuk menggantinya setelah login pertama.</p>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Role
                </label>
                <select
                  id="user-role"
                  name="role"
                  required
                  defaultValue="STAFF_GUDANG"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm text-slate-800 bg-white"
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {state?.error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {state.error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm shadow-primary-500/20"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
