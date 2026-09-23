import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerMenuItems,
  getServerIngredients,
} from '@/lib/server-api';
import { MenuClientView } from './MenuClientView';

export const metadata = {
  title: 'เมนูและสูตรเครื่องดื่ม | SmartStock Pro',
  description: 'จัดการเมนู ค้นหา คำนวณต้นทุนต่อแก้ว และตัดสต็อกวัตถุดิบอัตโนมัติ',
};

export default async function RecipeMenuPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [menuItems, ingredients] = await Promise.all([
    getServerMenuItems(),
    getServerIngredients(),
  ]);

  return (
    <MenuClientView
      initialMenuItems={menuItems}
      initialIngredients={ingredients}
    />
  );
}
