'use client';

import { useActionState } from 'react';
import { authenticate } from './actions';

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Email Input */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="admin@smartstock.app"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white/50 
                     focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 
                     transition-all duration-200 outline-none text-surface-900 placeholder-surface-400"
        />
      </div>

      {/* Password Input */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-white/50 
                     focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 
                     transition-all duration-200 outline-none text-surface-900 placeholder-surface-400"
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-danger-50 border border-danger-100 text-danger-600 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-md shadow-primary-500/20 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
      >
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
        
        {isPending ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Memverifikasi...</span>
          </div>
        ) : (
          <span>Masuk ke Sistem</span>
        )}
      </button>
    </form>
  );
}
