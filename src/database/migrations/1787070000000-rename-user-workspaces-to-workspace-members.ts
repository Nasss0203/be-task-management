import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserWorkspacesToWorkspaceMembers1787070000000 implements MigrationInterface {
  name = 'RenameUserWorkspacesToWorkspaceMembers1787070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.user_workspaces') IS NOT NULL
          AND to_regclass('public.workspace_members') IS NULL
        THEN
          UPDATE "user_workspaces"
          SET "role_name" = 'MEMBER'
          WHERE "role_name"::text = 'VIEWER';

          DROP TYPE IF EXISTS "public"."workspace_members_role_name_enum";

          CREATE TYPE "public"."workspace_members_role_name_enum"
            AS ENUM('OWNER', 'ADMIN', 'MEMBER');

          ALTER TABLE "user_workspaces"
          ALTER COLUMN "role_name" DROP DEFAULT;

          ALTER TABLE "user_workspaces"
          ALTER COLUMN "role_name"
          TYPE "public"."workspace_members_role_name_enum"
          USING "role_name"::text::"public"."workspace_members_role_name_enum";

          ALTER TABLE "user_workspaces"
          ALTER COLUMN "role_name" SET DEFAULT 'MEMBER';

          DROP TYPE IF EXISTS "public"."user_workspaces_role_name_enum";

          ALTER TABLE "user_workspaces" RENAME TO "workspace_members";

          ALTER INDEX IF EXISTS "UQ_user_workspaces_workspace_user"
            RENAME TO "UQ_workspace_members_workspace_user";
          ALTER INDEX IF EXISTS "IDX_user_workspaces_user_id"
            RENAME TO "IDX_workspace_members_user_id";
          ALTER INDEX IF EXISTS "IDX_user_workspaces_workspace_id"
            RENAME TO "IDX_workspace_members_workspace_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.workspace_invites') IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typname = 'workspace_invites_role_name_enum'
          )
        THEN
          UPDATE "workspace_invites"
          SET "role_name" = 'MEMBER'
          WHERE "role_name"::text = 'VIEWER';

          DROP TYPE IF EXISTS "public"."workspace_invites_role_name_enum_new";

          CREATE TYPE "public"."workspace_invites_role_name_enum_new"
            AS ENUM('OWNER', 'ADMIN', 'MEMBER');

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name" DROP DEFAULT;

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name"
          TYPE "public"."workspace_invites_role_name_enum_new"
          USING "role_name"::text::"public"."workspace_invites_role_name_enum_new";

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name" SET DEFAULT 'MEMBER';

          DROP TYPE "public"."workspace_invites_role_name_enum";

          ALTER TYPE "public"."workspace_invites_role_name_enum_new"
            RENAME TO "workspace_invites_role_name_enum";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.workspace_members') IS NOT NULL
          AND to_regclass('public.user_workspaces') IS NULL
        THEN
          DROP TYPE IF EXISTS "public"."user_workspaces_role_name_enum";

          CREATE TYPE "public"."user_workspaces_role_name_enum"
            AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

          ALTER TABLE "workspace_members"
          ALTER COLUMN "role_name" DROP DEFAULT;

          ALTER TABLE "workspace_members"
          ALTER COLUMN "role_name"
          TYPE "public"."user_workspaces_role_name_enum"
          USING "role_name"::text::"public"."user_workspaces_role_name_enum";

          ALTER TABLE "workspace_members"
          ALTER COLUMN "role_name" SET DEFAULT 'MEMBER';

          DROP TYPE IF EXISTS "public"."workspace_members_role_name_enum";

          ALTER TABLE "workspace_members" RENAME TO "user_workspaces";

          ALTER INDEX IF EXISTS "UQ_workspace_members_workspace_user"
            RENAME TO "UQ_user_workspaces_workspace_user";
          ALTER INDEX IF EXISTS "IDX_workspace_members_user_id"
            RENAME TO "IDX_user_workspaces_user_id";
          ALTER INDEX IF EXISTS "IDX_workspace_members_workspace_id"
            RENAME TO "IDX_user_workspaces_workspace_id";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.workspace_invites') IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typname = 'workspace_invites_role_name_enum'
          )
        THEN
          DROP TYPE IF EXISTS "public"."workspace_invites_role_name_enum_old";

          CREATE TYPE "public"."workspace_invites_role_name_enum_old"
            AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name" DROP DEFAULT;

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name"
          TYPE "public"."workspace_invites_role_name_enum_old"
          USING "role_name"::text::"public"."workspace_invites_role_name_enum_old";

          ALTER TABLE "workspace_invites"
          ALTER COLUMN "role_name" SET DEFAULT 'MEMBER';

          DROP TYPE "public"."workspace_invites_role_name_enum";

          ALTER TYPE "public"."workspace_invites_role_name_enum_old"
            RENAME TO "workspace_invites_role_name_enum";
        END IF;
      END $$;
    `);
  }
}
