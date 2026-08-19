import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleNameToUserWorkspaces1787040000000 implements MigrationInterface {
  name = 'AddRoleNameToUserWorkspaces1787040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        CREATE TYPE "public"."user_workspaces_role_name_enum"
          AS ENUM('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_workspaces"
      ADD COLUMN IF NOT EXISTS "role_name" "public"."user_workspaces_role_name_enum"
      NOT NULL DEFAULT 'MEMBER'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.user_roles') IS NOT NULL
          AND to_regclass('public.roles') IS NOT NULL
        THEN
          WITH ranked_roles AS (
            SELECT DISTINCT ON (ur.workspace_id, ur.user_id)
              ur.workspace_id,
              ur.user_id,
              r.name
            FROM user_roles ur
            INNER JOIN roles r ON r.id = ur.role_id
            WHERE r.name IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')
            ORDER BY
              ur.workspace_id,
              ur.user_id,
              CASE r.name
                WHEN 'OWNER' THEN 1
                WHEN 'ADMIN' THEN 2
                WHEN 'MEMBER' THEN 3
                ELSE 4
              END
          )
          UPDATE user_workspaces uw
          SET role_name = ranked_roles.name::"public"."user_workspaces_role_name_enum"
          FROM ranked_roles
          WHERE ranked_roles.workspace_id = uw.workspace_id
            AND ranked_roles.user_id = uw.user_id;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_workspaces"
      DROP COLUMN IF EXISTS "role_name"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."user_workspaces_role_name_enum"
    `);
  }
}
