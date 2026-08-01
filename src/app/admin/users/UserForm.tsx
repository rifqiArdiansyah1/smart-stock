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
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Tambah User Baru</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Isi data pengguna baru di bawah ini.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form action={formAction} className="px-6 py-6 space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="user-name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="user-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  required
                  placeholder="budi@smartstock.app"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="user-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password Sementara
                </label>
                <input
                  id="user-password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                />
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Minta karyawan untuk menggantinya setelah login pertama.</p>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="user-role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <select
                    id="user-role"
                    name="role"
                    required
                    defaultValue="STAFF_GUDANG"
                    className="w-full appearance-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-sm text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer"
                  >
                    {ROLE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {state?.error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {state.error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
