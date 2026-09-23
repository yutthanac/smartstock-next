import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerDashboard,
  getServerOrders,
  getServerWasteStats,
} from '@/lib/server-api';
import { SalesReportClientView } from './SalesReportClientView';

export const metadata = {
  title: 'รายงานยอดขายและวิเคราะห์ต้นทุน | SmartStock Pro',
  description: 'กราฟวิเคราะห์ยอดขาย ยอดคืนเงิน สินค้าขายดี และสถิติของเสียในร้าน',
};

export default async function SalesReportPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [dashboard, orders, wasteStats] = await Promise.all([
    getServerDashboard(),
    getServerOrders(),
    getServerWasteStats(),
  ]);

  return (
    <SalesReportClientView
      initialDashboard={dashboard}
      initialOrders={orders}
      initialWasteStats={wasteStats}
    />
  );
}
