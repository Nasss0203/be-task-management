import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export class UserWorkspaceModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string,
    public readonly joinedAt?: Date,
    public readonly lastOpenedAt?: Date,
  ) {}
}

export class MemberWorkspaceModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly user_id: string,
    public readonly full_name: string,
    public readonly email: string,
    public readonly role_name: RoleName,
    public readonly avatar_url?: string | null,
    public readonly lastOpenedAt: Date | null = null,
    public readonly joinedAt?: Date,
    public readonly taskCount?: number,
  ) {}
}
