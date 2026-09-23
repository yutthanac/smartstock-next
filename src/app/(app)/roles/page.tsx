import { redirect } from 'next/navigation';
import { getServerSession, getServerRoles } from '@/lib/server-api';
import { RolesClientView } from './RolesClientView';

export const metadata = {
  title: 'กำหนดบทบาทและสิทธิ์การใช้งาน (RBAC) | SmartStock Pro',
  description: 'จัดการสิทธิ์การเข้าถึงเมนู ฟังชันก์ และรายงานของแต่ละบทบาทในระบบ',
};

export default async function RolesPermissionPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const rolesData = await getServerRoles();

  return <RolesClientView initialRolesData={rolesData} />;
}
