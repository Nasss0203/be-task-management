import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSprintReport1781359428213 implements MigrationInterface {
    name = 'AddSprintReport1781359428213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sprint_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "project_id" uuid NOT NULL, "sprint_id" uuid NOT NULL, "sprint_name" character varying(255) NOT NULL, "sprint_goal" character varying(500), "total_tasks" integer NOT NULL DEFAULT '0', "completed_tasks" integer NOT NULL DEFAULT '0', "incomplete_tasks" integer NOT NULL DEFAULT '0', "total_estimate" integer NOT NULL DEFAULT '0', "completed_estimate" integer NOT NULL DEFAULT '0', "completed_task_ids" jsonb NOT NULL DEFAULT '[]', "incomplete_task_ids" jsonb NOT NULL DEFAULT '[]', "member_performance" jsonb NOT NULL DEFAULT '[]', "completed_task_details" jsonb NOT NULL DEFAULT '[]', "incomplete_task_details" jsonb NOT NULL DEFAULT '[]', "start_at" TIMESTAMP, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_48a4ff998c0d4fdea1e98455327" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINT_REPORTS_SPRINT_ID" ON "sprint_reports" ("sprint_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2f46a5de0e574de2142dd321f" ON "sprint_reports" ("sprint_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_90b28d1da4a183ac50b0bd3c67" ON "sprint_reports" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_cef552ef14cbb2a3ed1d7ba584" ON "sprint_reports" ("workspace_id") `);
        await queryRunner.query(`ALTER TABLE "sprint_reports" ADD CONSTRAINT "FK_cef552ef14cbb2a3ed1d7ba5849" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sprint_reports" ADD CONSTRAINT "FK_90b28d1da4a183ac50b0bd3c67f" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sprint_reports" ADD CONSTRAINT "FK_f2f46a5de0e574de2142dd321f0" FOREIGN KEY ("sprint_id") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sprint_reports" DROP CONSTRAINT "FK_f2f46a5de0e574de2142dd321f0"`);
        await queryRunner.query(`ALTER TABLE "sprint_reports" DROP CONSTRAINT "FK_90b28d1da4a183ac50b0bd3c67f"`);
        await queryRunner.query(`ALTER TABLE "sprint_reports" DROP CONSTRAINT "FK_cef552ef14cbb2a3ed1d7ba5849"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cef552ef14cbb2a3ed1d7ba584"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90b28d1da4a183ac50b0bd3c67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2f46a5de0e574de2142dd321f"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINT_REPORTS_SPRINT_ID"`);
        await queryRunner.query(`DROP TABLE "sprint_reports"`);
    }

}
