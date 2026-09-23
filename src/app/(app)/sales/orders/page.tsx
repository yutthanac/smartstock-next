import { redirect } from 'next/navigation';
import { getServerSession, getServerOrders } from '@/lib/server-api';
import { OrdersClientView } from './OrdersClientView';

export const metadata = {
  title: 'ประวัติออเดอร์และการขาย | SmartStock Pro',
  description: 'ตรวจสอบรายการขาย ค้นหาบิล พิมพ์ใบเสร็จ และจัดการยกเลิกหรือคืนเงินออเดอร์',
};

export default async function OrdersHistoryPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const orders = await getServerOrders();

  return <OrdersClientView initialOrders={orders} />;
}
