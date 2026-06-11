import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplateManagementFields1781150858848 implements MigrationInterface {
    name = 'TemplateManagementFields1781150858848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."page_templates_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "page_templates" ADD "status" "public"."page_templates_status_enum" NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`CREATE TYPE "public"."page_templates_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`);
        await queryRunner.query(`ALTER TABLE "page_templates" ADD "visibility" "public"."page_templates_visibility_enum" NOT NULL DEFAULT 'PRIVATE'`);
        await queryRunner.query(`ALTER TABLE "page_templates" ADD "use_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "page_templates" ADD "likes_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_templates_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "status" "public"."workspace_templates_status_enum" NOT NULL DEFAULT 'DRAFT'`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_templates_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "visibility" "public"."workspace_templates_visibility_enum" NOT NULL DEFAULT 'PRIVATE'`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "workspace_id" uuid`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "use_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ADD "likes_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_1db58ca29e8f9cfb09276e14db" ON "page_templates" ("status", "visibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d4a5e3435cc5d5d62ce12aaba" ON "workspace_templates" ("status", "visibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_9ce729d826830a0df18a04ac98" ON "workspace_templates" ("is_system") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5d1197b4d500cba051a5f4722" ON "workspace_templates" ("created_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7609d8e69a95ff97432ebe349" ON "workspace_templates" ("workspace_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_d7609d8e69a95ff97432ebe349"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5d1197b4d500cba051a5f4722"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ce729d826830a0df18a04ac98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d4a5e3435cc5d5d62ce12aaba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1db58ca29e8f9cfb09276e14db"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "likes_count"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "use_count"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "workspace_id"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."workspace_templates_status_enum"`);
        await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN "likes_count"`);
        await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN "use_count"`);
        await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "public"."page_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "page_templates" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."page_templates_status_enum"`);
    }

}
