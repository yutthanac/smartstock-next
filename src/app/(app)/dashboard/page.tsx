import { redirect } from 'next/navigation';
import { getServerSession, getServerDashboard } from '@/lib/server-api';
import { DashboardClientView } from './DashboardClientView';

export const metadata = {
  title: 'ภาพรวมร้านค้า | SmartStock Pro',
  description: 'แดชบอร์ดสรุปยอดขาย กำไร และสถานะสต็อกสินค้า',
};

export default async function DashboardPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const dashboard = await getServerDashboard();

  return <DashboardClientView initialDashboard={dashboard} />;
}
