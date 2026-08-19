import { Injectable } from '@nestjs/common';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import { DataSource, EntityManager } from 'typeorm';
import {
  AccessWorkspaceRepository,
  WorkspaceAccessModel,
} from '../interfaces/repositories/access-workspace.repository.interface';

type RoleRow = {
  roleName: WorkspaceRole;
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

    const roleRows = await entityManager.query<RoleRow[]>(
      `
      SELECT role_name AS "roleName"
      FROM workspace_members
      WHERE user_id = $1
        AND workspace_id = $2
      LIMIT 1
      `,
      [userId, workspaceId],
    );

    if (!roleRows.length) {
      return null;
    }

    const roles: string[] = Array.from(
      new Set(roleRows.map((role) => role.roleName)),
    );

    const permissions: string[] = Array.from(
      new Set(roleRows.flatMap((role) => ROLE_PERMISSION_MAP[role.roleName])),
    );

    return {
      user_id: userId,
      workspace_id: workspaceId,
      roles,
      permissions,
    };
  }
}
