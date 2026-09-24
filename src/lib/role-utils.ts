/**
 * Centralized Role utilities for dynamic store-type naming and clean Thai labels.
 */

export function getRoleDisplayName(
  roleName?: string,
  displayName?: string,
  storeType?: string
): string {
  if (!roleName) return 'พนักงานทั่วไป';

  const cleanName = roleName.toLowerCase().trim();

  if (cleanName === 'owner' || cleanName === 'manager') {
    return 'เจ้าของร้าน';
  }

  if (cleanName === 'chef' || cleanName === 'barista' || cleanName === 'baker') {
    if (storeType === 'bakery') return 'เชฟเบเกอรี่';
    if (storeType === 'restaurant') return 'หัวหน้าครัว';
    return 'บาริสต้า';
  }

  const thaiMap: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    owner: 'เจ้าของร้าน',
    manager: 'เจ้าของร้าน',
    cashier: 'พนักงานแคชเชียร์',
    staff: 'พนักงานทั่วไป',
  };

  if (thaiMap[cleanName]) return thaiMap[cleanName];

  if (displayName) {
    return displayName.replace(/\s*\([^)]*\)/g, '').trim();
  }

  return cleanName;
}

export function getUserRoleBadge(
  roles?: string[] | null,
  singleRole?: string | null,
  storeType?: string
): string {
  const roleList = roles && roles.length > 0 ? roles : singleRole ? [singleRole] : [];
  if (roleList.length === 0) return 'พนักงานทั่วไป';

  // Check in order of priority:
  if (roleList.includes('admin')) return 'ผู้ดูแลระบบ';
  if (roleList.includes('owner') || roleList.includes('manager')) return 'เจ้าของร้าน';
  if (roleList.includes('chef') || roleList.includes('barista')) {
    if (storeType === 'bakery') return 'เชฟเบเกอรี่';
    if (storeType === 'restaurant') return 'หัวหน้าครัว';
    return 'บาริสต้า';
  }
  if (roleList.includes('cashier')) return 'พนักงานแคชเชียร์';
  if (roleList.includes('staff')) return 'พนักงานทั่วไป';

  return roleList.map((r) => getRoleDisplayName(r, undefined, storeType)).join(', ');
}
