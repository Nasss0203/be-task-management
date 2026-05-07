import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../../domain/entities/workspace_invite.entity';

export class WorkspaceInviteResponseDto {
  id: string;
  workspace_id: string;
  user_id: string | null;
  email: string | null;
  type: WorkspaceInviteType;
  role_name: RoleName;
  invited_by: string;
  status: WorkspaceInviteStatus;
  accepted_at: Date | null;
  expires_at: Date;
  max_uses: number | null;
  used_count: number;
  created_at: Date;
  updated_at: Date;
}
