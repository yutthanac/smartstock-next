import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-api';
import { LoginClientView } from './LoginClientView';

export const metadata = {
  title: 'เข้าสู่ระบบ | SmartStock Pro',
  description: 'เข้าสู่ระบบจัดการสต็อกและขายหน้าร้าน SmartStock',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const { token } = await getServerSession();

  if (token) {
    const params = await searchParams;
    const dest =
      params?.redirect &&
      params.redirect.startsWith('/') &&
      !params.redirect.startsWith('//') &&
      params.redirect !== '/login'
        ? params.redirect
        : '/dashboard';
    redirect(dest);
  }

  return <LoginClientView />;
}
