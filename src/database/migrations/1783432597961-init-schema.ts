import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1783432597961 implements MigrationInterface {
    name = 'InitSchema1783432597961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" ADD "parent_task_id" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."ai_generation_type_enum" RENAME TO "ai_generation_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."ai_generation_type_enum" AS ENUM('WORKSPACE_DRAFT', 'PROJECT_DRAFT', 'TASK_DRAFT', 'WORKSPACE_TREE_DRAFT', 'DASHBOARD_INSIGHT')`);
        await queryRunner.query(`ALTER TABLE "ai_generations" ALTER COLUMN "generation_type" TYPE "public"."ai_generation_type_enum" USING "generation_type"::"text"::"public"."ai_generation_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_TASKS_PARENT_TASK_ID" ON "tasks" ("parent_task_id") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_54fc42a253a8338488ec1f960ad" FOREIGN KEY ("parent_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_54fc42a253a8338488ec1f960ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TASKS_PARENT_TASK_ID"`);
        await queryRunner.query(`CREATE TYPE "public"."ai_generation_type_enum_old" AS ENUM('DASHBOARD_INSIGHT', 'PROJECT_DRAFT', 'SPRINT_PLAN', 'SPRINT_SUMMARY', 'TASK_DRAFT', 'WORKSPACE_DRAFT', 'WORKSPACE_TREE_DRAFT')`);
        await queryRunner.query(`ALTER TABLE "ai_generations" ALTER COLUMN "generation_type" TYPE "public"."ai_generation_type_enum_old" USING "generation_type"::"text"::"public"."ai_generation_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."ai_generation_type_enum_old" RENAME TO "ai_generation_type_enum"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "parent_task_id"`);
    }

}
