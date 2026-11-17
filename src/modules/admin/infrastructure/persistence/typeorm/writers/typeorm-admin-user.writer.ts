import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  AdminUserWriter,
  UpdateAdminUserRoleInput,
  UpdateAdminUserRoleResult,
  UpdateAdminUserStatusInput,
  UpdateAdminUserStatusResult,
} from '../../../../application/ports/admin-user-writer.port';
import { readReturningRows } from '../read-returning-rows';

@Injectable()
export class TypeOrmAdminUserWriter implements AdminUserWriter {
  constructor(private readonly dataSource: DataSource) {}

  async updateUserStatus(
    input: UpdateAdminUserStatusInput,
  ): Promise<UpdateAdminUserStatusResult | null> {
    const result: unknown = await this.dataSource.query(
      `
        UPDATE users
        SET
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING
          id,
          is_active AS "isActive",
          updated_at AS "updatedAt"
      `,
      [input.isActive, input.userId],
    );

    const row = readReturningRows<UpdateAdminUserStatusResult>(result)[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      isActive: row.isActive,
      updatedAt: new Date(row.updatedAt),
    };
  }

  async updateUserRole(
    input: UpdateAdminUserRoleInput,
  ): Promise<UpdateAdminUserRoleResult | null> {
    const result: unknown = await this.dataSource.query(
      `
        UPDATE users
        SET
          system_role = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING
          id,
          system_role AS "systemRole",
          updated_at AS "updatedAt"
      `,
      [input.systemRole, input.userId],
    );

    const row = readReturningRows<UpdateAdminUserRoleResult>(result)[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      systemRole: row.systemRole,
      updatedAt: new Date(row.updatedAt),
    };
  }
}
