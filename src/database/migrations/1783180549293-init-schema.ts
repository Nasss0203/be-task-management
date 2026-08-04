import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1783180549293 implements MigrationInterface {
  name = 'InitSchema1783180549293';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_type_enum" RENAME TO "ai_generation_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_type_enum" AS ENUM('WORKSPACE_DRAFT', 'PROJECT_DRAFT', 'TASK_DRAFT', 'WORKSPACE_TREE_DRAFT', 'SPRINT_PLAN', 'SPRINT_SUMMARY', 'DASHBOARD_INSIGHT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "generation_type" TYPE "public"."ai_generation_type_enum" USING "generation_type"::"text"::"public"."ai_generation_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_status_enum" RENAME TO "ai_generation_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_status_enum" AS ENUM('PROCESSING', 'GENERATED', 'APPLIED', 'DISCARDED', 'FAILED', 'APPLY_BLOCKED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" TYPE "public"."ai_generation_status_enum" USING "status"::"text"::"public"."ai_generation_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" SET DEFAULT 'PROCESSING'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."ai_generation_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_status_enum_old" AS ENUM('APPLIED', 'DISCARDED', 'FAILED', 'GENERATED', 'PROCESSING')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" TYPE "public"."ai_generation_status_enum_old" USING "status"::"text"::"public"."ai_generation_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "status" SET DEFAULT 'PROCESSING'`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generation_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_status_enum_old" RENAME TO "ai_generation_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ai_generation_type_enum_old" AS ENUM('DASHBOARD_INSIGHT', 'PROJECT_DRAFT', 'SPRINT_PLAN', 'SPRINT_SUMMARY', 'TASK_DRAFT', 'WORKSPACE_DRAFT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "ai_generations" ALTER COLUMN "generation_type" TYPE "public"."ai_generation_type_enum_old" USING "generation_type"::"text"::"public"."ai_generation_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."ai_generation_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."ai_generation_type_enum_old" RENAME TO "ai_generation_type_enum"`,
    );
  }
}
