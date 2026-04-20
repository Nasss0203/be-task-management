import { EntityManager } from 'typeorm';
export type CreateRolePermissionInput = {
  role_id: string;
  permission_id: string;
};

export interface CreateRolePermissionRepository {
  saveMany(
    data: CreateRolePermissionInput[],
    manager?: EntityManager,
  ): Promise<void>;
}
