import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export class WorkspaceInviteLinkResponseDto {
  id: string;
  workspace_id: string;
  role_name: WorkspaceRole;
  token: string;
  invite_url: string;
  expires_at: Date;
  max_uses: number | null;
  used_count: number;
}
