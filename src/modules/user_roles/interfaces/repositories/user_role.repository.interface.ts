import { EntityManager } from 'typeorm';
import { UserRoleModel } from '../../domain/model/user_role.model';

export type SaveUserRoleInput = Pick<
  UserRoleModel,
  'role_id' | 'user_id' | 'workspace_id'
> &
  Partial<Pick<UserRoleModel, 'assigned_at' | 'assigned_by'>>;

export interface UserRoleRepository {
  save(
    userRole: UserRoleModel | SaveUserRoleInput,
    manager?: EntityManager,
  ): Promise<UserRoleModel>;

  deleteByUserId(
    workspaceId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<void>;
}
