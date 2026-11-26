import { Injectable } from '@nestjs/common';
import type { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { DataSource, EntityManager } from 'typeorm';
import type {
  AdminUserWriter,
  UpdateAdminUserRoleInput,
  UpdateAdminUserRoleResult,
  UpdateAdminUserStatusInput,
  UpdateAdminUserStatusResult,
} from '../../../../application/ports/admin-user-writer.port';
import { insertAdminAction } from './typeorm-admin-action.recorder';

interface LockedUserRow {
  isActive: boolean;
  systemRole: SystemRole;
}

@Injectable()
export class TypeOrmAdminUserWriter implements AdminUserWriter {
  constructor(private readonly dataSource: DataSource) {}

  async updateUserStatus(
    input: UpdateAdminUserStatusInput,
  ): Promise<UpdateAdminUserStatusResult | null> {
    return this.dataSource.transaction(async (manager) => {
      const previous = await this.lockUser(manager, input.userId);

      if (!previous) {
        return null;
      }

      const [rows] = await manager.query<
        [UpdateAdminUserStatusResult[], number]
      >(
        `
          UPDATE users
          SET
            is_active = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING
            id,
            is_active AS "isActive",
            updated_at AS "updatedAt"
        `,
        [input.isActive, input.userId],
      );

      const row = rows[0];

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'USER_STATUS_CHANGED',
        targetType: 'USER',
        targetId: row.id,
        changes: { isActive: { from: previous.isActive, to: row.isActive } },
      });

      return {
        id: row.id,
        isActive: row.isActive,
        updatedAt: new Date(row.updatedAt),
      };
    });
  }

  async updateUserRole(
    input: UpdateAdminUserRoleInput,
  ): Promise<UpdateAdminUserRoleResult | null> {
    return this.dataSource.transaction(async (manager) => {
      const previous = await this.lockUser(manager, input.userId);

      if (!previous) {
        return null;
      }

      const [rows] = await manager.query<[UpdateAdminUserRoleResult[], number]>(
        `
          UPDATE users
          SET
            system_role = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING
            id,
            system_role AS "systemRole",
            updated_at AS "updatedAt"
        `,
        [input.systemRole, input.userId],
      );

      const row = rows[0];

      await insertAdminAction(manager, {
        actor: input.actor,
        action: 'USER_ROLE_CHANGED',
        targetType: 'USER',
        targetId: row.id,
        changes: {
          systemRole: { from: previous.systemRole, to: row.systemRole },
        },
      });

      return {
        id: row.id,
        systemRole: row.systemRole,
        updatedAt: new Date(row.updatedAt),
      };
    });
  }

  private async lockUser(
    manager: EntityManager,
    userId: string,
  ): Promise<LockedUserRow | null> {
    const rows = await manager.query<LockedUserRow[]>(
      `
        SELECT
          is_active AS "isActive",
          system_role AS "systemRole"
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
        FOR UPDATE
      `,
      [userId],
    );

    return rows[0] ?? null;
  }
}
