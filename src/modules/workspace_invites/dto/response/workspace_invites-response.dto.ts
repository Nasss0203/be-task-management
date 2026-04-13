import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { WorkspaceInviteStatus } from '../../domain/entities/workspace_invite.entity';

export class WorkspaceInviteResponseDto {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string;
  role_name: RoleName;
  invited_by: string;
  status: WorkspaceInviteStatus;
  accepted_at: Date | null;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}
