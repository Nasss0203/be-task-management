import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminPerformanceIndexes1784500100000
  implements MigrationInterface
{
  name = 'AddAdminPerformanceIndexes1784500100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USERS_ADMIN_ACTIVE_CREATED"
      ON "users" ("created_at" DESC)
      WHERE "deleted_at" IS NULL
        AND "system_role" <> 'SUPER_ADMIN'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USERS_ADMIN_ROLE_STATUS_CREATED"
      ON "users" ("system_role", "is_active", "created_at" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WORKSPACES_ADMIN_CREATED"
      ON "workspaces" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_WORKSPACES_ADMIN_ACTIVE_PLAN_CREATED"
      ON "workspaces" ("plan_type", "created_at" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USER_ACTIVITIES_USER_CREATED"
      ON "user_activities" ("user_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USER_ACTIVITIES_CREATED_USER"
      ON "user_activities" ("created_at" DESC, "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USER_ROLES_WORKSPACE_ROLE_USER"
      ON "user_roles" ("workspace_id", "role_id", "user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_ACTIVE_USER_PLAN"
      ON "subscriptions" ("user_id", "status", "plan_id")
      WHERE "status" IN ('ACTIVE', 'TRIALING')
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_EXPIRED_PERIOD_END"
      ON "subscriptions" ("status", "current_period_end")
      WHERE "status" = 'EXPIRED'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_CANCELLED_AT"
      ON "subscriptions" ("status", "cancelled_at")
      WHERE "status" = 'CANCELLED'
    `);

    await queryRunner.query(`ANALYZE "users"`);
    await queryRunner.query(`ANALYZE "user_profiles"`);
    await queryRunner.query(`ANALYZE "workspaces"`);
    await queryRunner.query(`ANALYZE "user_workspaces"`);
    await queryRunner.query(`ANALYZE "user_roles"`);
    await queryRunner.query(`ANALYZE "roles"`);
    await queryRunner.query(`ANALYZE "user_activities"`);
    await queryRunner.query(`ANALYZE "subscriptions"`);
    await queryRunner.query(`ANALYZE "subscription_workspaces"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUBSCRIPTIONS_CANCELLED_AT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUBSCRIPTIONS_EXPIRED_PERIOD_END"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SUBSCRIPTIONS_ACTIVE_USER_PLAN"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USER_ROLES_WORKSPACE_ROLE_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USER_ACTIVITIES_CREATED_USER"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USER_ACTIVITIES_USER_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_WORKSPACES_ADMIN_ACTIVE_PLAN_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_WORKSPACES_ADMIN_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USERS_ADMIN_ROLE_STATUS_CREATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USERS_ADMIN_ACTIVE_CREATED"`,
    );
  }
}
