import type { Metadata, Viewport } from 'next';
import { Sora, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// ── Warehouse Signal Fonts ────────────────────────────────────────────────────
const sora = Sora({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
  display: 'swap',
});

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'SmartStock — Manajemen Stok Cerdas',
    template: '%s | SmartStock',
  },
  description:
    'SmartStock adalah sistem manajemen inventaris yang berfokus pada kecepatan input dan integritas data stok — anti-fraud, anti-selisih misterius, dengan audit trail penuh.',
  keywords: [
    'manajemen stok',
    'inventory management',
    'stock opname',
    'audit trail',
    'gudang',
    'SmartStock',
  ],
  authors: [{ name: 'Shenzen Studio' }],
  creator: 'Shenzen Studio',
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#071639' },
    { media: '(prefers-color-scheme: dark)', color: '#071639' },
  ],
};

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${sora.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
