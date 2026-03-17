import { EntityManager } from 'typeorm';
import { RoleModel } from '../../domain/model/role.model';

export type SaveRoleInput = Pick<RoleModel, 'name' | 'workspace_id'> &
  Partial<Pick<RoleModel, 'id' | 'created_at'>>;

export interface RoleRepository {
  save(
    workspace: RoleModel | SaveRoleInput,
    manager?: EntityManager,
  ): Promise<RoleModel>;
}
