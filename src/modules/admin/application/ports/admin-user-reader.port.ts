import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

export interface ListAdminUsersInput {
  page: number;
  limit: number;
  search?: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  username: string;
  systemRole: SystemRole;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserSummary {
  avatarUrl: string | null;
  updatedAt: Date;
}

export interface ListAdminUsersResult {
  items: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserReader {
  listUsers(input: ListAdminUsersInput): Promise<ListAdminUsersResult>;

  findUserById(userId: string): Promise<AdminUserDetail | null>;
}
