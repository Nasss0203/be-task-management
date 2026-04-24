import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import {
  WorkspaceInviteStatus,
  WorkspaceInviteType,
} from '../entities/workspace_invite.entity';

export class WorkspaceInviteModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string | null,
    public readonly email: string | null,
    public readonly type: WorkspaceInviteType,
    public readonly role_name: RoleName,
    public readonly invited_by: string,
    public readonly token: string,
    public readonly status: WorkspaceInviteStatus,
    public readonly accepted_at: Date | null,
    public readonly expires_at: Date,
    public readonly max_uses: number | null,
    public readonly used_count: number,
    public readonly created_at: Date,
    public readonly updated_at: Date,
  ) {}
}
