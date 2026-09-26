import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Noto_Sans_Thai, Noto_Sans, Sarabun } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { TopProgressBar } from '@/components/TopProgressBar';
import { DynamicBranding } from '@/components/DynamicBranding';

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

import { cookies } from 'next/headers';
import { ACTIVE_STORE_COOKIE_NAME, AUTH_COOKIE_NAME } from '@/lib/cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const activeStoreId = cookieStore.get(ACTIVE_STORE_COOKIE_NAME)?.value;
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  let storeName = 'Welcome to Brrcafe';
  let faviconUrl = '/favicon.ico';
  let ogImageUrl = '/images/Brrlogo.png';

  if (activeStoreId) {
    try {
      const res = await fetch(`${API_BASE_URL}/stores/${activeStoreId}`, {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const store = await res.json();
        if (store.name) storeName = store.name;
        if (store.favicon_url) faviconUrl = store.favicon_url;
        if (store.og_image_url) ogImageUrl = store.og_image_url;
        else if (store.logo_url) ogImageUrl = store.logo_url;
      }
    } catch {
      // Fallback to defaults
    }
  }

  return {
    title: `${storeName} - ระบบจัดการสต็อกและขายหน้าร้าน`,
    description: 'Smart POS & Inventory Recipe BOM Management System',
    icons: {
      icon: [{ url: faviconUrl }],
      shortcut: [{ url: faviconUrl }],
      apple: [{ url: faviconUrl }],
    },
    openGraph: {
      title: `${storeName} - SmartStock`,
      description: 'ระบบจัดการสต็อกและขายหน้าร้าน Smart POS & Inventory Management System',
      siteName: storeName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: storeName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${storeName} - SmartStock`,
      description: 'ระบบจัดการสต็อกและขายหน้าร้าน Smart POS & Inventory Management System',
      images: [ogImageUrl],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSans.variable} ${sarabun.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-[#4fb0a5]/20 selection:text-[#12312d]">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <AuthProvider>
          <DynamicBranding />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
