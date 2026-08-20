import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PermissionModel } from '../../domain/models/permission.model';

export interface FindPermissionRepository {
  findAll(context?: PersistenceContext): Promise<PermissionModel[]>;
  findPermissionsByUserAndWorkspace(
    userId: string,
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<string[]>;
}
