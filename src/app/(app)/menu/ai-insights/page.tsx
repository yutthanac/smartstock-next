import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerDashboard,
  getServerMenuItems,
  getServerIngredients,
} from '@/lib/server-api';
import { AIInsightsClientView } from './AIInsightsClientView';

export const metadata = {
  title: 'AI วิเคราะห์ตลาดและไอเดียเมนู | SmartStock Pro',
  description: 'AI Market Intelligence วิเคราะห์คู่แข่ง ทำเล แนวโน้มเมนู และข้อเสนอแนะลดต้นทุน',
};

export default async function AIInsightsPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [dashboard, menuItems, ingredients] = await Promise.all([
    getServerDashboard(),
    getServerMenuItems(),
    getServerIngredients(),
  ]);

  return (
    <AIInsightsClientView
      initialDashboard={dashboard}
      initialMenuItems={menuItems}
      initialIngredients={ingredients}
    />
  );
}
