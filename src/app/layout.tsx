import type { Metadata } from 'next';
import { Noto_Sans_Thai, Noto_Sans, Sarabun } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';

const notoSansThai = Noto_Sans_Thai({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  variable: '--font-noto-thai',
  display: 'swap',
});

const notoSans = Noto_Sans({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SmartStock Pro - ระบบจัดการสต็อกและขายหน้าร้าน',
  description: 'Smart POS & Inventory Recipe BOM Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSans.variable} ${sarabun.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-[#4fb0a5]/20 selection:text-[#12312d]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
