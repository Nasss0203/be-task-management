import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1784500000000
  implements MigrationInterface
{
  name = 'AddPerformanceIndexes1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_PROJECT_ROOT_CREATED"
      ON "tasks" ("workspace_id", "project_id", "created_at" DESC)
      WHERE "deleted_at" IS NULL
        AND "parent_task_id" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_PROJECT_BACKLOG"
      ON "tasks" ("workspace_id", "project_id", "created_at" DESC)
      WHERE "deleted_at" IS NULL
        AND "parent_task_id" IS NULL
        AND "sprint_id" IS NULL
        AND "completed_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_WORKSPACE_STATUS"
      ON "tasks" ("workspace_id", "status_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_WORKSPACE_PROJECT"
      ON "tasks" ("workspace_id", "project_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_WORKSPACE_DUE"
      ON "tasks" ("workspace_id", "due_at", "project_id", "status_id")
      WHERE "deleted_at" IS NULL
        AND "due_at" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASKS_ACTIVE_SPRINT"
      ON "tasks" ("workspace_id", "project_id", "sprint_id")
      WHERE "deleted_at" IS NULL
        AND "sprint_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_TASK_ASSIGNEES_USER_TASK"
      ON "task_assignees" ("user_id", "task_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_USER_WORKSPACES_USER_RECENT"
      ON "user_workspaces" ("user_id", "last_opened_at" DESC NULLS LAST)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PROJECTS_ACTIVE_WORKSPACE_UPDATED"
      ON "projects" ("workspace_id", "updated_at" DESC)
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SPRINTS_ACTIVE_WORKSPACE_DEADLINE"
      ON "sprints" ("workspace_id", "end_at")
      WHERE "deleted_at" IS NULL
        AND "end_at" IS NOT NULL
    `);

    await queryRunner.query(`ANALYZE "tasks"`);
    await queryRunner.query(`ANALYZE "task_positions"`);
    await queryRunner.query(`ANALYZE "task_assignees"`);
    await queryRunner.query(`ANALYZE "projects"`);
    await queryRunner.query(`ANALYZE "sprints"`);
    await queryRunner.query(`ANALYZE "activities"`);
    await queryRunner.query(`ANALYZE "user_workspaces"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_SPRINTS_ACTIVE_WORKSPACE_DEADLINE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_PROJECTS_ACTIVE_WORKSPACE_UPDATED"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_USER_WORKSPACES_USER_RECENT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASK_ASSIGNEES_USER_TASK"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_SPRINT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_WORKSPACE_DUE"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_WORKSPACE_PROJECT"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_WORKSPACE_STATUS"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_PROJECT_BACKLOG"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_TASKS_ACTIVE_PROJECT_ROOT_CREATED"`,
    );
  }
}
