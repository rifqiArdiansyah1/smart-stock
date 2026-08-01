import Link from 'next/link';
import { auth } from '@/auth';
import LogoutButton from './components/LogoutButton';
import { Role } from '@/lib/rbac';

/**
 * SmartStock — Landing / Dashboard Page (Redesigned)
 */
export default async function HomePage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  // Modul Navigasi sesuai Role
  const modules = [
    {
      title: 'Dashboard Admin',
      desc: 'Analitik, manajemen produk, & laporan',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      color: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/20',
      allowedRoles: ['OWNER', 'ADMIN'],
    },
    {
      title: 'POS Kasir',
      desc: 'Transaksi penjualan & pencarian produk',
      href: '/kasir',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
      allowedRoles: ['OWNER', 'ADMIN', 'KASIR'],
    },
    {
      title: 'Manajemen Gudang',
      desc: 'Inventarisasi fisik & logistik',
      href: '/staff',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-400',
      shadow: 'shadow-indigo-500/20',
      allowedRoles: ['OWNER', 'ADMIN', 'STAFF_GUDANG'],
    },
    {
      title: 'Stock Opname',
      desc: 'Audit jumlah fisik vs sistem',
      href: '/opname',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'from-fuchsia-500 to-pink-400',
      shadow: 'shadow-fuchsia-500/20',
      allowedRoles: ['OWNER', 'ADMIN', 'STAFF_GUDANG'],
    },
  ];

  const allowedModules = modules.filter(m => role && m.allowedRoles.includes(role));

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Dynamic Background Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-4xl px-6 py-12 animate-in fade-in zoom-in duration-700 ease-out flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-[0_0_40px_rgba(99,102,241,0.4)] ring-1 ring-white/20 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{session?.user?.name || 'Guest'}</span>
          </h1>
          
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/50 backdrop-blur-md border border-slate-700 shadow-xl mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-slate-300 tracking-wide">
              {role || 'UNKNOWN'}
            </span>
          </div>

          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Pilih modul operasi di bawah ini untuk memulai aktivitas Anda di ekosistem <strong className="text-slate-200">SmartStock</strong>.
          </p>
        </div>

        {/* Bento Grid Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto mb-12">
          {allowedModules.map((module) => (
            <Link 
              key={module.href} 
              href={module.href}
              className={`group relative overflow-hidden rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-slate-600 ${module.shadow}`}
            >
              {/* Card Hover Gradient Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full`} />
              
              <div className="relative z-10 flex items-start gap-4">
                <div className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} text-white shadow-lg`}>
                  {module.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-snug group-hover:text-slate-300 transition-colors">
                    {module.desc}
                  </p>
                </div>
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Logout Section */}
        <div className="flex justify-center w-full relative z-20">
          <div className="opacity-70 hover:opacity-100 transition-opacity">
            <LogoutButton />
          </div>
        </div>

      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-slate-500 text-xs tracking-wider z-10 font-medium">
        SMARTSTOCK V0.1.0 &copy; 2026 SHENZEN STUDIO
      </p>
    </main>
  );
}
