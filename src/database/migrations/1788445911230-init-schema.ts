import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1788445911230 implements MigrationInterface {
    name = 'InitSchema1788445911230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "page_favorites" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "page_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_page_favorites_user_page" UNIQUE ("user_id", "page_id"), CONSTRAINT "PK_cf022ded67eda3abe9a5c20a14f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_page_favorites_page_id" ON "page_favorites" ("page_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_page_favorites_user_id" ON "page_favorites" ("user_id") `);
        await queryRunner.query(`ALTER TYPE "public"."teamspace_members_role_name_enum" RENAME TO "teamspace_members_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."teamspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" TYPE "public"."teamspace_members_role_name_enum" USING "role_name"::"text"::"public"."teamspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."teamspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."teamspaces_visibility_enum" RENAME TO "teamspaces_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."teamspaces_visibility_enum" AS ENUM('OPEN', 'PRIVATE')`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" TYPE "public"."teamspaces_visibility_enum" USING "visibility"::"text"::"public"."teamspaces_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" SET DEFAULT 'OPEN'`);
        await queryRunner.query(`DROP TYPE "public"."teamspaces_visibility_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum" RENAME TO "workspace_members_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum" USING "role_name"::"text"::"public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum_old" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" TYPE "public"."workspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_members_role_name_enum_old" RENAME TO "workspace_members_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."teamspaces_visibility_enum_old" AS ENUM('OPEN', 'PRIVATE')`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" TYPE "public"."teamspaces_visibility_enum_old" USING "visibility"::"text"::"public"."teamspaces_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "teamspaces" ALTER COLUMN "visibility" SET DEFAULT 'OPEN'`);
        await queryRunner.query(`DROP TYPE "public"."teamspaces_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."teamspaces_visibility_enum_old" RENAME TO "teamspaces_visibility_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."teamspace_members_role_name_enum_old" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" TYPE "public"."teamspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."teamspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."teamspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."teamspace_members_role_name_enum_old" RENAME TO "teamspace_members_role_name_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_page_favorites_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_page_favorites_page_id"`);
        await queryRunner.query(`DROP TABLE "page_favorites"`);
    }

}
