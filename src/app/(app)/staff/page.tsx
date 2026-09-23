import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerUsers,
  getServerRoles,
} from '@/lib/server-api';
import { StaffClientView } from './StaffClientView';

export const metadata = {
  title: 'จัดการพนักงาน & สิทธิ์การใช้งาน | SmartStock Pro',
  description: 'จัดการข้อมูลผู้ใช้งาน กำหนดบทบาท และสาขาที่เข้าถึงได้',
};

export default async function StaffPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [users, roles] = await Promise.all([
    getServerUsers(),
    getServerRoles(),
  ]);

  return (
    <StaffClientView
      initialUsers={users as any}
      initialRoles={roles as any}
    />
  );
}
