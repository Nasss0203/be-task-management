import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { UserActivity } from 'src/modules/user_activity/domain/entities/user_activity.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { Repository } from 'typeorm';
import {
  AdminFindAllUserQueryDto,
  AdminUserStatus,
} from '../../dto/query/user/admin-user-query.dto';
import {
  AdminUserActivityResponseDto,
  AdminUserPlan,
  AdminUserResponseDto,
  AdminUserWorkspaceResponseDto,
} from '../../dto/response/user/admin-user.response.dto';
import { AdminUserRepository } from '../../interfaces/repositories/user/admin-user.repository.interface';

type UserRaw = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  plan: AdminUserPlan;
  systemRole: SystemRole;
  createdAt: Date;
  lastActive: Date | null;
};

type UserWorkspaceRaw = {
  userId: string;
  id: string;
  name: string;
  role: RoleName;
};

type UserActivityRaw = {
  userId: string;
  id: string;
  action: string;
  createdAt: Date;
};

@Injectable()
export class AdminUserRepositoryImpl implements AdminUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
  ) {}

  async findAll(
    query: AdminFindAllUserQueryDto,
  ): Promise<AdminUserResponseDto[]> {
    const users = await this.getUsers(query);

    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((user) => user.id);

    const [workspaceMap, activityMap] = await Promise.all([
      this.getWorkspaceMap(userIds),
      this.getActivityMap(userIds),
    ]);

    return users.map((user) => ({
      id: user.id,
      fullName: user.fullName ?? user.email,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.isActive ? 'ACTIVE' : 'LOCKED',
      plan: user.plan,
      systemRole: user.systemRole,
      createdAt: user.createdAt.toISOString(),
      lastActive: user.lastActive ? user.lastActive.toISOString() : null,
      workspaces: workspaceMap.get(user.id) ?? [],
      activities: activityMap.get(user.id) ?? [],
    }));
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ email }, { username }],
    });
  }

  async createSystemAdmin(input: {
    email: string;
    username: string;
    passwordHash: string | null;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
  }): Promise<User> {
    const user = this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      systemRole: SystemRole.SYSTEM_ADMIN,
      isActive: false,
      isEmailVerified: false,
      emailVerificationToken: input.emailVerificationToken ?? null,
      emailVerificationExpires: input.emailVerificationExpires ?? null,
      googleId: null,
      avatarUrl: null,
    });

    return this.userRepository.save(user);
  }

  async deleteById(userId: string): Promise<void> {
    await this.userRepository.delete({ id: userId });
  }

  async lockAndRevokeSessions(userId: string): Promise<void> {
    await this.userRepository.manager.transaction(async (manager) => {
      await manager.update(User, { id: userId }, { isActive: false });

      await manager
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ revoked_at: new Date() })
        .where('user_id = :userId', { userId })
        .andWhere('revoked_at IS NULL')
        .execute();
    });
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await this.userRepository.update(
      {
        id: userId,
      },
      {
        isActive,
      },
    );
  }

  async updateSystemRole(userId: string, role: SystemRole): Promise<void> {
    await this.userRepository.update(
      {
        id: userId,
      },
      {
        systemRole: role,
      },
    );
  }

  private async getUsers(query: AdminFindAllUserQueryDto): Promise<UserRaw[]> {
    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoin('user_profiles', 'profile', '"profile"."user_id" = "u"."id"')
      .select('"u"."id"', 'id')
      .addSelect(
        'COALESCE("profile"."full_name", "profile"."display_name", "u"."username", "u"."email")',
        'fullName',
      )
      .addSelect('"u"."email"', 'email')
      .addSelect('"u"."avatar_url"', 'avatarUrl')
      .addSelect('"u"."is_active"', 'isActive')
      .addSelect(
        `CASE
          WHEN EXISTS (
            SELECT 1
            FROM "subscriptions" subscription
            INNER JOIN "plans" plan ON plan."id" = subscription."plan_id"
            WHERE subscription."user_id" = "u"."id"
              AND subscription."status" = 'ACTIVE'
              AND plan."slug" <> 'free'
          )
          THEN 'pro'
          ELSE 'free'
        END`,
        'plan',
      )
      .addSelect('"u"."system_role"', 'systemRole')
      .addSelect('"u"."created_at"', 'createdAt')
      .addSelect((subQuery) => {
        return subQuery
          .select('MAX("activity"."created_at")')
          .from(UserActivity, 'activity')
          .where('"activity"."user_id" = "u"."id"');
      }, 'lastActive')
      .where('"u"."deleted_at" IS NULL')
      .andWhere('"u"."system_role" <> :superAdminRole', {
        superAdminRole: SystemRole.SUPER_ADMIN,
      })
      .orderBy('"u"."created_at"', 'DESC');

    if (query.search?.trim()) {
      qb.andWhere(
        `(
          LOWER("u"."email") LIKE :search
          OR LOWER("u"."username") LIKE :search
          OR LOWER("profile"."full_name") LIKE :search
          OR LOWER("profile"."display_name") LIKE :search
        )`,
        {
          search: `%${query.search.trim().toLowerCase()}%`,
        },
      );
    }

    if (query.status === AdminUserStatus.ACTIVE) {
      qb.andWhere('"u"."is_active" = true');
    }

    if (query.status === AdminUserStatus.LOCKED) {
      qb.andWhere('"u"."is_active" = false');
    }

    if (query.role) {
      qb.andWhere('"u"."system_role" = :role', {
        role: query.role,
      });
    }

    if (query.createdAt) {
      const start = new Date(query.createdAt);
      start.setHours(0, 0, 0, 0);

      const end = new Date(query.createdAt);
      end.setHours(23, 59, 59, 999);

      qb.andWhere('"u"."created_at" BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    return qb.getRawMany<UserRaw>();
  }

  private async getWorkspaceMap(
    userIds: string[],
  ): Promise<Map<string, AdminUserWorkspaceResponseDto[]>> {
    const rows = await this.userRepository.manager.query<UserWorkspaceRaw[]>(
      `
        SELECT
          uw."user_id" AS "userId",
          w."id" AS "id",
          w."name" AS "name",
          CASE
            WHEN BOOL_OR(r."name"::text = 'OWNER') THEN 'OWNER'
            WHEN BOOL_OR(r."name"::text = 'ADMIN') THEN 'ADMIN'
            ELSE 'MEMBER'
          END AS "role"
        FROM "user_workspaces" uw
        INNER JOIN "workspaces" w
          ON w."id" = uw."workspace_id"
        LEFT JOIN "user_roles" ur
          ON ur."user_id" = uw."user_id"
          AND ur."workspace_id" = uw."workspace_id"
        LEFT JOIN "roles" r
          ON r."id" = ur."role_id"
        WHERE uw."user_id" = ANY($1)
          AND w."deleted_at" IS NULL
        GROUP BY uw."user_id", w."id", w."name"
        ORDER BY w."name" ASC
      `,
      [userIds],
    );

    const map = new Map<string, AdminUserWorkspaceResponseDto[]>();

    rows.forEach((row) => {
      const current = map.get(row.userId) ?? [];

      current.push({
        id: row.id,
        name: row.name,
        role: row.role,
      });

      map.set(row.userId, current);
    });

    return map;
  }

  private async getActivityMap(
    userIds: string[],
  ): Promise<Map<string, AdminUserActivityResponseDto[]>> {
    const rows = await this.userActivityRepository.manager.query<
      UserActivityRaw[]
    >(
      `
        SELECT *
        FROM (
          SELECT
            ua."user_id" AS "userId",
            ua."id" AS "id",
            ua."type" AS "action",
            ua."created_at" AS "createdAt",
            ROW_NUMBER() OVER (
              PARTITION BY ua."user_id"
              ORDER BY ua."created_at" DESC
            ) AS rn
          FROM "user_activities" ua
          WHERE ua."user_id" = ANY($1)
        ) ranked
        WHERE ranked.rn <= 5
        ORDER BY ranked."createdAt" DESC
      `,
      [userIds],
    );

    const map = new Map<string, AdminUserActivityResponseDto[]>();

    rows.forEach((row) => {
      const current = map.get(row.userId) ?? [];

      current.push({
        id: row.id,
        action: row.action,
        time: row.createdAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      });

      map.set(row.userId, current);
    });

    return map;
  }
}
