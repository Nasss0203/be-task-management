import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPlanTypeFromWorkspaces1787149406002 implements MigrationInterface {
  name = 'DropPlanTypeFromWorkspaces1787149406002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "plan_type"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."workspaces_plan_type_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workspaces_plan_type_enum" AS ENUM('free', 'pro')`,
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "plan_type" "public"."workspaces_plan_type_enum" NOT NULL DEFAULT 'free'`,
    );
  }
}
