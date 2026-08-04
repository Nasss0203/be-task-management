import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskPositions1784383200000 implements MigrationInterface {
  name = 'AddTaskPositions1784383200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "task_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "context" character varying(20) NOT NULL, "context_id" uuid NOT NULL, "position" numeric(30,15) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_task_positions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_TASK_POSITION" ON "task_positions" ("task_id", "context", "context_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TASK_POSITION_LOOKUP" ON "task_positions" ("context", "context_id", "position") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_TASK_POSITION_TASK" ON "task_positions" ("task_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "task_positions" ADD CONSTRAINT "FK_TASK_POSITION_TASK" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
            INSERT INTO "task_positions" ("task_id", "context", "context_id", "position")
            SELECT
                t."id",
                CASE
                    WHEN t."sprint_id" IS NOT NULL THEN 'sprint'
                    ELSE 'backlog'
                END AS "context",
                COALESCE(t."sprint_id", t."project_id") AS "context_id",
                ROW_NUMBER() OVER (
                    PARTITION BY
                        CASE
                            WHEN t."sprint_id" IS NOT NULL THEN 'sprint'
                            ELSE 'backlog'
                        END,
                        COALESCE(t."sprint_id", t."project_id")
                    ORDER BY
                        t."created_at" ASC,
                        t."id" ASC
                )::numeric
            FROM "tasks" t
            WHERE NOT EXISTS (
                SELECT 1
                FROM "task_positions" tp
                WHERE tp."task_id" = t."id"
                  AND tp."context" = CASE
                    WHEN t."sprint_id" IS NOT NULL THEN 'sprint'
                    ELSE 'backlog'
                  END
                  AND tp."context_id" = COALESCE(t."sprint_id", t."project_id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_positions" DROP CONSTRAINT "FK_TASK_POSITION_TASK"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_POSITION_TASK"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_TASK_POSITION_LOOKUP"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_TASK_POSITION"`);
    await queryRunner.query(`DROP TABLE "task_positions"`);
  }
}
