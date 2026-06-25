import { RoleName } from 'src/modules/role/domain/entities/role.entity';

export interface UpdateMemberWorkspaceApplication {
  updateRole(
    workspaceId: string,
    userId: string,
    roleName: RoleName,
    actorId: string,
  ): Promise<void>;
}
