import { redirect } from 'next/navigation';
import {
  getServerSession,
  getServerUnits,
  getServerStores,
} from '@/lib/server-api';
import { SettingsClientView } from './SettingsClientView';

export const metadata = {
  title: 'ตั้งค่าระบบ & ปรับแต่งเมนู | SmartStock Pro',
  description: 'จัดการเมนู Sidebar ร้านค้า และหน่วยนับวัตถุดิบทั้งหมด',
};

export default async function SettingsPage() {
  const { token } = await getServerSession();

  if (!token) {
    redirect('/login');
  }

  const [units, stores] = await Promise.all([
    getServerUnits(),
    getServerStores(),
  ]);

  return (
    <SettingsClientView
      initialUnits={units}
      initialStores={stores}
    />
  );
}
