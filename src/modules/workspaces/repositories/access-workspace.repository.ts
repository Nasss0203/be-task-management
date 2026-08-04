import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccessWorkspaceRepository,
  WorkspaceAccessModel,
} from '../interfaces/repositories/access-workspace.repository.interface';

type RoleRow = {
  id: string;
  name: string;
};

type PermissionRow = {
  name: string;
};

@Injectable()
export class AccessWorkspaceRepositoryImpl implements AccessWorkspaceRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findWorkspaceAccess(
    userId: string,
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceAccessModel | null> {
    const entityManager = manager ?? this.dataSource.manager;

    const roleRows = await entityManager.query(
      `
      SELECT DISTINCT r.id, r.name
      FROM user_roles ur
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND ur.workspace_id = $2
      `,
      [userId, workspaceId],
    );

    if (!roleRows.length) {
      return null;
    }

    const roleIds: string[] = (roleRows as any[]).map((role) => role.id as string);

    const roles: string[] = Array.from(new Set((roleRows as any[]).map((role) => role.name as string)));

    const permissionRows = await entityManager.query(
      `
  SELECT DISTINCT p.code
  FROM role_permissions rp
  INNER JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role_id = ANY($1)
  `,
      [roleIds],
    );

    const permissions: string[] = Array.from(
      new Set((permissionRows as any[]).map((permission) => permission.code as string)),
    );
    return {
      user_id: userId,
      workspace_id: workspaceId,
      roles,
      permissions,
    };
  }
}
