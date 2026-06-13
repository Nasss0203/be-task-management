import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1781354943350 implements MigrationInterface {
    name = 'InitSchema1781354943350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1db58ca29e8f9cfb09276e14db"`);
        await queryRunner.query(`ALTER TYPE "public"."page_templates_visibility_enum" RENAME TO "page_templates_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."page_templates_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC', 'PUBLIC_PENDING')`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" TYPE "public"."page_templates_visibility_enum" USING "visibility"::"text"::"public"."page_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`);
        await queryRunner.query(`DROP TYPE "public"."page_templates_visibility_enum_old"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d4a5e3435cc5d5d62ce12aaba"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_templates_visibility_enum" RENAME TO "workspace_templates_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_templates_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC', 'PUBLIC_PENDING')`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" TYPE "public"."workspace_templates_visibility_enum" USING "visibility"::"text"::"public"."workspace_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_templates_visibility_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_1db58ca29e8f9cfb09276e14db" ON "page_templates" ("status", "visibility") `);
        await queryRunner.query(`CREATE INDEX "IDX_1d4a5e3435cc5d5d62ce12aaba" ON "workspace_templates" ("status", "visibility") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1d4a5e3435cc5d5d62ce12aaba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1db58ca29e8f9cfb09276e14db"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_templates_visibility_enum_old" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" TYPE "public"."workspace_templates_visibility_enum_old" USING "visibility"::"text"::"public"."workspace_templates_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_templates" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_templates_visibility_enum_old" RENAME TO "workspace_templates_visibility_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_1d4a5e3435cc5d5d62ce12aaba" ON "workspace_templates" ("status", "visibility") `);
        await queryRunner.query(`CREATE TYPE "public"."page_templates_visibility_enum_old" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" TYPE "public"."page_templates_visibility_enum_old" USING "visibility"::"text"::"public"."page_templates_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "page_templates" ALTER COLUMN "visibility" SET DEFAULT 'PRIVATE'`);
        await queryRunner.query(`DROP TYPE "public"."page_templates_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."page_templates_visibility_enum_old" RENAME TO "page_templates_visibility_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_1db58ca29e8f9cfb09276e14db" ON "page_templates" ("status", "visibility") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified_at" TIMESTAMP WITH TIME ZONE`);
    }

}
