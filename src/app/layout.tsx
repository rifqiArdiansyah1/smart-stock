import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
  robots: {
    index: false, // Private app — jangan di-index search engine
    follow: false,
  },
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
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
