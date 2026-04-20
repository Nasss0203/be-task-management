import { EntityManager } from 'typeorm';
import { RoleName } from '../../domain/entities/role.entity';
import { RoleModel } from '../../domain/model/role.model';

export interface FindRoleService {
  findByNameAndWorkspace(
    roleName: RoleName,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<RoleModel | null>;
}
