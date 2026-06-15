import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export type AdminUserStatus = 'ACTIVE' | 'LOCKED';
export type AdminUserPlan = 'free' | 'pro';

export class AdminUserWorkspaceResponseDto {
  id: string;
  name: string;
  role: RoleName;
}

export class AdminUserActivityResponseDto {
  id: string;
  action: string;
  time: string;
  createdAt: string;
}

export class AdminUserResponseDto {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: AdminUserStatus;
  plan: AdminUserPlan;
  systemRole: SystemRole;
  workspaces: AdminUserWorkspaceResponseDto[];
  createdAt: string;
  lastActive: string | null;
  activities: AdminUserActivityResponseDto[];
}
