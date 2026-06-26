import LoginForm from './LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login ke SmartStock',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-50 relative overflow-hidden selection:bg-primary-500/30">
      
      {/* --- Background Decorations --- */}
      {/* Top Right Blob */}
      <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-primary-400/20 blur-[100px] pointer-events-none mix-blend-multiply" />
      {/* Bottom Left Blob */}
      <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[60%] rounded-full bg-secondary-400/20 blur-[100px] pointer-events-none mix-blend-multiply" />
      
      {/* --- Main Content Container --- */}
      <div className="w-full max-w-md px-6 z-10">
        
        {/* Card Component */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-surface-900/5 border border-white p-8 sm:p-10 relative overflow-hidden">
          
          {/* Subtle Inner Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[20%] bg-white/50 blur-2xl rounded-full pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center mb-8 relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-lg shadow-primary-500/30 mb-4 ring-4 ring-white">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">SmartStock</h1>
            <p className="text-surface-500 text-sm mt-1">Masuk untuk melanjutkan ke sistem</p>
          </div>

          {/* Login Form Client Component */}
          <LoginForm />

        </div>

        {/* Footer info */}
        <p className="text-center text-sm text-surface-400 mt-8">
          Sistem Manajemen Inventaris &copy; {new Date().getFullYear()}
        </p>

      </div>
    </main>
  );
}
