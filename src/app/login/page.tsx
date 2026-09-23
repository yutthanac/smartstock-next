import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-api';
import { LoginClientView } from './LoginClientView';

export const metadata = {
  title: 'เข้าสู่ระบบ | SmartStock Pro',
  description: 'เข้าสู่ระบบจัดการสต็อกและขายหน้าร้าน SmartStock',
};

export default async function LoginPage() {
  const { token } = await getServerSession();

  if (token) {
    redirect('/dashboard');
  }

  return <LoginClientView />;
}
