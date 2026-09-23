import { redirect } from 'next/navigation';
import { getServerSession, getServerStores } from '@/lib/server-api';
import { StoresSettingsClientView } from './StoresSettingsClientView';

export const metadata = {
  title: 'จัดการข้อมูลร้านค้าและสาขา | SmartStock Pro',
  description: 'จัดการข้อมูลร้านค้า ปรับแต่งธีม เลือกเมนูที่ใช้งาน และจัดการสมาชิกในร้าน',
};

export default async function StoresSettingsPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const stores = await getServerStores();

  return <StoresSettingsClientView initialStores={stores} />;
}
