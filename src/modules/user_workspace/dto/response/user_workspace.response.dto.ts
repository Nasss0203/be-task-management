import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class UserWorkspaceResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  joinedAt: Date;
  lastOpenedAt?: Date;
}

export class MemberWorkspaceResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role_name: RoleName;
  lastOpenedAt: Date | null;
  joinedAt: Date | null;
  taskCount?: number;
}
