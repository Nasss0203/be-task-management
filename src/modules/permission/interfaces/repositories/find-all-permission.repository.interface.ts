import { EntityManager } from 'typeorm';
import { PermissionModel } from '../../domain/models/permission.model';

export interface FindPermissionRepository {
  findAll(manager?: EntityManager): Promise<PermissionModel[]>;
}
