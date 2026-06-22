import Link from 'next/link';

/**
 * SmartStock — Landing / Coming Soon Page
 *
 * Halaman sementara saat development.
 * Akan diganti dengan dashboard setelah ISSUE-020.
 */
export default function HomePage() {
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

        {/* App Name */}
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          Smart<span className="text-indigo-400">Stock</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl text-slate-300 mb-2 font-medium">
          Sistem Manajemen Inventaris Cerdas
        </p>
        <p className="text-slate-400 mb-10 leading-relaxed">
          Anti-selisih misterius. Penuh audit trail. <br />
          Dirancang untuk kecepatan input & integritas data stok.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[
            '⚡ Stock Opname Cepat',
            '🔍 Audit Trail Penuh',
            '📱 PWA Offline-First',
            '🔐 RBAC Multi-Role',
            '📊 Analytics Real-time',
          ].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1.5 rounded-full bg-white/10 text-slate-200 text-sm font-medium border border-white/10"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-badge" />
          <span>Development in progress — Sprint 1</span>
        </div>

        {/* Development Links */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="https://github.com/rifqiArdiansyah1/smart-stock/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors duration-200 text-sm"
            id="github-issues-link"
          >
            📋 Lihat Issue Board
          </Link>
          <Link
            href="https://github.com/rifqiArdiansyah1/smart-stock"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors duration-200 text-sm border border-white/10"
            id="github-repo-link"
          >
            ⭐ GitHub Repository
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-600 text-sm">
        SmartStock v0.1.0 · Shenzen Studio · 2026
      </p>
    </main>
  );
}
