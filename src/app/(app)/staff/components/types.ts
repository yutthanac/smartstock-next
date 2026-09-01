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

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  roles: { id: string; name: string; display_name: string }[];
  permissions: string[];
  created_at: string;
}
