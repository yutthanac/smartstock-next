import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerDashboard,
  getServerIngredients,
} from '@/lib/server-api';
import { ProfitReportClientView } from './ProfitReportClientView';

export const metadata = {
  title: 'รายงานต้นทุน & กำไร | SmartStock Pro',
  description: 'รายงานวิเคราะห์กำไรขั้นต้น สัดส่วนต้นทุนวัตถุดิบ และมูลค่าสินค้าคงคลัง',
};

export default async function ProfitReportPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [dashboard, ingredients] = await Promise.all([
    getServerDashboard(),
    getServerIngredients(),
  ]);

  return (
    <ProfitReportClientView
      initialDashboard={dashboard}
      initialIngredients={ingredients}
    />
  );
}
