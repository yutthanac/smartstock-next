import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerMenuItems,
  getServerIngredients,
  getServerMenuOptions,
} from '@/lib/server-api';
import { POSClientView } from './POSClientView';

export const metadata = {
  title: 'ระบบขายหน้าร้าน (POS) | SmartStock Pro',
  description: 'ระบบแคชเชียร์ POS บันทึกการขาย ตัดสต็อกวัตถุดิบและคำนวณส่วนผสมอัตโนมัติ',
};

export default async function POSPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [menuItems, ingredients, menuOptions] = await Promise.all([
    getServerMenuItems(),
    getServerIngredients(),
    getServerMenuOptions(),
  ]);

  return (
    <POSClientView
      initialMenuItems={menuItems}
      initialIngredients={ingredients}
      initialOptions={menuOptions}
    />
  );
}
