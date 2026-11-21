export type RoleUser = {
  id?: number;
  name?: string;
  email?: string;
  [key: string]: unknown;
};

export type DashboardRole = {
  id: string;
  name: string;
  description: string;
  assigned_users: RoleUser[];
  current_permission_group_slugs: string[];
  is_superuser: boolean;
  created_by: string;
  invited_users: RoleUser[];
};

export const isSuperAdminRole = (
  role?: { is_superuser?: boolean } | null
) => Boolean(role?.is_superuser);

export const getRoleDisplayName = (
  role?: { name?: string; is_superuser?: boolean } | null
) => (isSuperAdminRole(role) ? "Super Admin" : role?.name || "");
