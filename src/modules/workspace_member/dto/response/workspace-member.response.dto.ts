import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export class WorkspaceMemberResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  role_name: WorkspaceRole;
  joinedAt: Date;
  lastOpenedAt?: Date;
}

export class WorkspaceMemberDetailResponseDto {
  id: string;
  workspace_id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role_name: WorkspaceRole;
  lastOpenedAt: Date | null;
  joinedAt: Date | null;
  taskCount?: number;
}
