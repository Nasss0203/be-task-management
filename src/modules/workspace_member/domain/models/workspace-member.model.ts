import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';

export class WorkspaceMemberModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string,
    public readonly role_name: WorkspaceRole = WorkspaceRole.MEMBER,
    public readonly joinedAt?: Date,
    public readonly lastOpenedAt?: Date,
  ) {}
}

export class WorkspaceMemberDetailModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string,
    public readonly full_name: string,
    public readonly email: string,
    public readonly role_name: WorkspaceRole,
    public readonly avatar_url?: string | null,
    public readonly lastOpenedAt: Date | null = null,
    public readonly joinedAt?: Date,
    public readonly taskCount?: number,
  ) {}
}
