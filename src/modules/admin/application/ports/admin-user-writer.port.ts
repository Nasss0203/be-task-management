import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export interface UpdateAdminUserStatusInput {
  userId: string;
  isActive: boolean;
}

export interface UpdateAdminUserStatusResult {
  id: string;
  isActive: boolean;
  updatedAt: Date;
}

export interface UpdateAdminUserRoleInput {
  userId: string;
  systemRole: SystemRole;
}

export interface UpdateAdminUserRoleResult {
  id: string;
  systemRole: SystemRole;
  updatedAt: Date;
}

export interface AdminUserWriter {
  updateUserStatus(
    input: UpdateAdminUserStatusInput,
  ): Promise<UpdateAdminUserStatusResult | null>;

  updateUserRole(
    input: UpdateAdminUserRoleInput,
  ): Promise<UpdateAdminUserRoleResult | null>;
}
