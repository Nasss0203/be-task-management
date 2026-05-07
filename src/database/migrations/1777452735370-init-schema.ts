import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1777452735370 implements MigrationInterface {
    name = 'InitSchema1777452735370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."sprints_status_enum" AS ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "status" "public"."sprints_status_enum" NOT NULL DEFAULT 'PLANNED'`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "completed_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "created_by" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "sprints" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."boards_view_type_enum" RENAME TO "boards_view_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."boards_view_type_enum" AS ENUM('BOARD', 'TABLE', 'LIST', 'CALENDAR', 'TIMELINE', 'GALLERY', 'CHART', 'DASHBOARD', 'FORM', 'MAP', 'FEED', 'BACKLOG')`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" TYPE "public"."boards_view_type_enum" USING "view_type"::"text"::"public"."boards_view_type_enum"`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" SET DEFAULT 'BOARD'`);
        await queryRunner.query(`DROP TYPE "public"."boards_view_type_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINTS_PROJECT_ACTIVE" ON "sprints" ("project_id") WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINTS_PROJECT_NAME" ON "sprints" ("project_id", "name") `);
        await queryRunner.query(`CREATE INDEX "IDX_507d36b62bcb05326a1afb3e88" ON "sprints" ("workspace_id", "project_id") `);
        await queryRunner.query(`ALTER TABLE "sprints" ADD CONSTRAINT "FK_7f57ff76f3ed56db4147ff03498" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sprints" DROP CONSTRAINT "FK_7f57ff76f3ed56db4147ff03498"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_507d36b62bcb05326a1afb3e88"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINTS_PROJECT_NAME"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINTS_PROJECT_ACTIVE"`);
        await queryRunner.query(`CREATE TYPE "public"."boards_view_type_enum_old" AS ENUM('BOARD', 'TABLE', 'LIST', 'CALENDAR', 'TIMELINE', 'GALLERY', 'CHART', 'DASHBOARD', 'FORM', 'MAP', 'FEED')`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" TYPE "public"."boards_view_type_enum_old" USING "view_type"::"text"::"public"."boards_view_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "boards" ALTER COLUMN "view_type" SET DEFAULT 'BOARD'`);
        await queryRunner.query(`DROP TYPE "public"."boards_view_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."boards_view_type_enum_old" RENAME TO "boards_view_type_enum"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "completed_at"`);
        await queryRunner.query(`ALTER TABLE "sprints" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."sprints_status_enum"`);
    }

}
