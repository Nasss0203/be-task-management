import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1789915646859 implements MigrationInterface {
    name = 'InitSchema1789915646859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_task_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_project_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "project_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "task_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "sprint_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "comment_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "source_id" uuid`);
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
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "source_type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_source_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "source_type" character varying(64) NOT NULL DEFAULT 'system'`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum" RENAME TO "workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_source" ON "notifications" ("source_type", "source_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_source"`);
        await queryRunner.query(`CREATE TYPE "public"."workspace_invites_role_name_enum_old" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" TYPE "public"."workspace_invites_role_name_enum_old" USING "role_name"::"text"::"public"."workspace_invites_role_name_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workspace_invites" ALTER COLUMN "role_name" SET DEFAULT 'MEMBER'`);
        await queryRunner.query(`DROP TYPE "public"."workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workspace_invites_role_name_enum_old" RENAME TO "workspace_invites_role_name_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE', 'ACCOUNT_SECURITY', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'WORKSPACE_INVITE', 'WORKSPACE_INVITE_ACCEPTED', 'WORKSPACE_MEMBER_JOINED', 'WORKSPACE_MEMBER_REMOVED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'SPRINT_STARTED', 'SPRINT_COMPLETED', 'SPRINT_DUE_SOON', 'SPRINT_OVERDUE', 'COMMENT_MENTION', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "type" "public"."notifications_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "source_type"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_source_type_enum" AS ENUM('SYSTEM', 'ACCOUNT', 'WORKSPACE', 'PROJECT', 'TASK', 'SPRINT', 'COMMENT')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "source_type" "public"."notifications_source_type_enum" NOT NULL DEFAULT 'SYSTEM'`);
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
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "source_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "comment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "sprint_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "task_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "project_id" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_project_id" ON "notifications" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_task_id" ON "notifications" ("task_id") `);
    }

}
