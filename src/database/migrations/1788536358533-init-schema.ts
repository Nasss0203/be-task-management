import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1788536358533 implements MigrationInterface {
    name = 'InitSchema1788536358533'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "page_share_links" ("id" uuid NOT NULL, "page_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "access_level" "public"."resource_access_level_enum" NOT NULL, "created_by" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7b7818fc2a5042b4547701a271e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_page_share_links_created_by" ON "page_share_links" ("created_by") `);
        await queryRunner.query(`CREATE INDEX "IDX_page_share_links_page_id" ON "page_share_links" ("page_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_page_share_links_token_hash" ON "page_share_links" ("token_hash") `);
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
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_members_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`);
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
        await queryRunner.query(`CREATE TYPE "public"."teamspace_members_role_name_enum_old" AS ENUM('MEMBER', 'OWNER')`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" TYPE "public"."teamspace_members_role_name_enum_old" USING "role_name"::"text"::"public"."teamspace_members_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "teamspace_members" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."teamspace_members_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."teamspace_members_role_name_enum_old" RENAME TO "teamspace_members_role_name_enum"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_page_share_links_token_hash"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_page_share_links_page_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_page_share_links_created_by"`);
        await queryRunner.query(`DROP TABLE "page_share_links"`);
    }

}
