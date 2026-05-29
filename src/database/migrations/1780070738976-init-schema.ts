import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1780070738976 implements MigrationInterface {
    name = 'InitSchema1780070738976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_role_workspace_name"`);
        await queryRunner.query(`ALTER TYPE "public"."roles_name_enum" RENAME TO "roles_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum" USING "name"::"text"::"public"."roles_name_enum"`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_role_workspace_name" ON "roles" ("workspace_id", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_role_workspace_name"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('ADMIN', 'MEMBER', 'OWNER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."roles_name_enum_old" AS ENUM('ADMIN', 'MEMBER', 'OWNER')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "name" TYPE "public"."roles_name_enum_old" USING "name"::"text"::"public"."roles_name_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."roles_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."roles_name_enum_old" RENAME TO "roles_name_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_role_workspace_name" ON "roles" ("name", "workspace_id") `);
    }

}
