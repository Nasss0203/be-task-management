import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type {
  AdminUserDetail,
  AdminUserReader,
  AdminUserSummary,
  ListAdminUsersInput,
  ListAdminUsersResult,
} from '../../../../application/ports/admin-user-reader.port';

@Injectable()
export class TypeOrmAdminUserReader implements AdminUserReader {
  constructor(private readonly dataSource: DataSource) {}

  async listUsers(input: ListAdminUsersInput): Promise<ListAdminUsersResult> {
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(input.page))
      : 1;

    const limit = Number.isFinite(input.limit)
      ? Math.min(100, Math.max(1, Math.floor(input.limit)))
      : 20;

    const search = input.search?.trim();

    const baseQuery = this.dataSource
      .createQueryBuilder()
      .from('users', 'u')
      .where('u.deleted_at IS NULL');

    if (search) {
      baseQuery.andWhere(
        '(u.email ILIKE :search OR u.username ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const rowsQuery = baseQuery
      .clone()
      .select([
        'u.id AS "id"',
        'u.email AS "email"',
        'u.username AS "username"',
        'u.system_role AS "systemRole"',
        'u.is_active AS "isActive"',
        'u.is_email_verified AS "isEmailVerified"',
        'u.created_at AS "createdAt"',
      ])
      .orderBy('u.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    const countQuery = baseQuery.clone().select('COUNT(*)', 'total');

    const [rows, countRow] = await Promise.all([
      rowsQuery.getRawMany<AdminUserSummary>(),
      countQuery.getRawOne<{ total: string }>(),
    ]);

    return {
      items: rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
      })),
      total: Number(countRow?.total ?? 0),
      page,
      limit,
    };
  }
  async findUserById(userId: string): Promise<AdminUserDetail | null> {
    const row = await this.dataSource
      .createQueryBuilder()
      .from('users', 'u')
      .select([
        'u.id AS "id"',
        'u.email AS "email"',
        'u.username AS "username"',
        'u.avatar_url AS "avatarUrl"',
        'u.system_role AS "systemRole"',
        'u.is_active AS "isActive"',
        'u.is_email_verified AS "isEmailVerified"',
        'u.created_at AS "createdAt"',
        'u.updated_at AS "updatedAt"',
      ])
      .where('u.id = :userId', { userId })
      .andWhere('u.deleted_at IS NULL')
      .getRawOne<AdminUserDetail>();

    if (!row) {
      return null;
    }

    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
