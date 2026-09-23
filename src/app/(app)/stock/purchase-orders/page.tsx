import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerIngredients,
  getServerUnits,
} from '@/lib/server-api';
import { PurchaseOrdersClientView } from './PurchaseOrdersClientView';

export const metadata = {
  title: 'รายการสั่งซื้อ & นำเข้าสต็อก (PO) | SmartStock Pro',
  description: 'ออกใบสั่งซื้อ สแกนสลิปใบเสร็จ AI ตรวจรับวัตถุดิบ และบันทึกเข้าสต็อกอัตโนมัติ',
};

export default async function PurchaseOrdersPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [ingredients, units] = await Promise.all([
    getServerIngredients(),
    getServerUnits(),
  ]);

  return (
    <PurchaseOrdersClientView
      initialIngredients={ingredients}
      initialUnits={units}
    />
  );
}
