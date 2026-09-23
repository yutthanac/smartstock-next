import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerIngredients,
  getServerUnits,
  getServerStockMovements,
} from '@/lib/server-api';
import { StockClientView } from './StockClientView';

export const metadata = {
  title: 'จัดการสต็อกวัตถุดิบ | SmartStock Pro',
  description: 'ตรวจสอบปริมาณคงเหลือ ปรับยอดสต็อก วัตถุดิบใกล้หมด และประวัติการใช้วัตถุดิบ',
};

export default async function StockPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [ingredients, units, movements] = await Promise.all([
    getServerIngredients(),
    getServerUnits(),
    getServerStockMovements(),
  ]);

  return (
    <StockClientView
      initialIngredients={ingredients}
      initialUnits={units}
      initialMovements={movements}
    />
  );
}