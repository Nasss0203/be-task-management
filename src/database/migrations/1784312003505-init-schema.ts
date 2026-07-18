import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1784312003505 implements MigrationInterface {
    name = 'InitSchema1784312003505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE', 'ACCOUNT_SECURITY', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'WORKSPACE_INVITE', 'WORKSPACE_INVITE_ACCEPTED', 'WORKSPACE_MEMBER_JOINED', 'WORKSPACE_MEMBER_REMOVED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'SPRINT_STARTED', 'SPRINT_COMPLETED', 'SPRINT_DUE_SOON', 'SPRINT_OVERDUE', 'COMMENT_MENTION', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('ACCOUNT_SECURITY', 'COMMENT_MENTION', 'COMMENT_REPLY', 'EMAIL_VERIFIED', 'PASSWORD_CHANGED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'SPRINT_COMPLETED', 'SPRINT_STARTED', 'SYSTEM_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE', 'TASK_ASSIGNED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'TASK_UPDATED', 'WORKSPACE_INVITE', 'WORKSPACE_INVITE_ACCEPTED', 'WORKSPACE_MEMBER_JOINED', 'WORKSPACE_MEMBER_REMOVED')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
    }

}
