import { EntityManager } from 'typeorm';
import { CreateRolePermissionInput } from '../repositories/create-role_permission.repository.interface';

export interface CreateRolePermissionService {
  createMany(
    data: CreateRolePermissionInput[],
    manager?: EntityManager,
  ): Promise<void>;
}
