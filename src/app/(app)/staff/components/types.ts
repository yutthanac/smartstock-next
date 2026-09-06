export interface RoleOption {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions?: { id: string; name: string; display_name: string; category: string }[];
}

export interface PermissionOption {
  id: string;
  name: string;
  display_name: string;
  category: string;
  description?: string;
}

export interface StaffStoreOption {
  id: number;
  name: string;
  type: string;
  logo_url?: string | null;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  roles: { id: string; name: string; display_name: string }[];
  stores?: { id: number; name: string; type: string; role?: string; logo_url?: string | null }[];
  permissions: string[];
  created_at: string;
}
