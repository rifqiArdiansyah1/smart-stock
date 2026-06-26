import Link from 'next/link';
import { auth } from '@/auth';
import LogoutButton from './components/LogoutButton';

/**
 * SmartStock — Landing / Dashboard Page
 */
export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto animate-fade-in">
        {/* Logo / Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 mb-8 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-white"
            aria-hidden="true"
          >
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        {/* Welcome Message */}
        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Selamat Datang, <span className="text-indigo-400">{session?.user?.name || 'Guest'}</span>!
        </h1>
        
        {/* User Info Pill */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-slate-200 mb-10 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          <span className="font-medium text-sm">Role: {session?.user?.role || 'UNKNOWN'}</span>
        </div>

        <p className="text-slate-400 mb-10 leading-relaxed max-w-lg mx-auto">
          Anda berhasil login ke sistem. Akses menu dan fitur telah disesuaikan dengan role Anda di SmartStock.
        </p>

        {/* Actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/inventory"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 text-sm shadow-lg shadow-indigo-600/30"
          >
            📦 Buka Inventaris
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-600 text-sm">
        SmartStock v0.1.0 · Shenzen Studio · 2026
      </p>
    </main>
  );
}
