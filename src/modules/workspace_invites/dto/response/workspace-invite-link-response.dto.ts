import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class WorkspaceInviteLinkResponseDto {
  id: string;
  workspace_id: string;
  role_name: RoleName;
  token: string;
  invite_url: string;
  expires_at: Date;
  max_uses: number | null;
  used_count: number;
}
