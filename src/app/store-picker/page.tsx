import { redirect } from 'next/navigation';
import { getServerSession, getServerStores } from '@/lib/server-api';
import { StorePickerClientView } from './StorePickerClientView';

export const metadata = {
  title: 'เลือกร้านค้าเพื่อเริ่มใช้งาน | SmartStock Pro',
  description: 'เลือกร้านค้าหรือสาขาที่คุณต้องการจัดการข้อมูลและระบบขาย',
};

export default async function StorePickerPage() {
  const { token, storeId } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  // If already selected a store, redirect to dashboard
  if (storeId) {
    redirect('/dashboard');
  }

  const stores = await getServerStores();

  return <StorePickerClientView initialStores={stores} />;
}
