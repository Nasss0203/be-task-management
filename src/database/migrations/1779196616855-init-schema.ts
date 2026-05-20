import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1779196616855 implements MigrationInterface {
    name = 'InitSchema1779196616855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5ace4f24abe554acb1a919656"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8385e7e4b0c91cfa308cba3f13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_91fa0aebab77f3ac7568a364da"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "entity_type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_entity_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "entity_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "receiver_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_sender_type_enum" AS ENUM('SYSTEM', 'USER')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "sender_type" "public"."notifications_sender_type_enum" NOT NULL DEFAULT 'SYSTEM'`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_source_type_enum" AS ENUM('SYSTEM', 'ACCOUNT', 'WORKSPACE', 'PROJECT', 'TASK', 'SPRINT', 'COMMENT')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "source_type" "public"."notifications_source_type_enum" NOT NULL DEFAULT 'SYSTEM'`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "project_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "task_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "sprint_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "comment_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "action_url" text`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "archived_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM_ANNOUNCEMENT', 'SYSTEM_MAINTENANCE', 'ACCOUNT_SECURITY', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED', 'WORKSPACE_INVITE', 'WORKSPACE_INVITE_ACCEPTED', 'WORKSPACE_MEMBER_JOINED', 'WORKSPACE_MEMBER_REMOVED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_DUE_SOON', 'TASK_OVERDUE', 'SPRINT_STARTED', 'SPRINT_COMPLETED', 'COMMENT_MENTION', 'COMMENT_REPLY')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_task_id" ON "notifications" ("task_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_project_id" ON "notifications" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_workspace_id" ON "notifications" ("workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_receiver_read_at" ON "notifications" ("receiver_id", "read_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_receiver_created_at" ON "notifications" ("receiver_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_343c8ee2cd2f4036f2a3423989e" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_20f8b51fd9655c0b69feed5efc6"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_343c8ee2cd2f4036f2a3423989e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_receiver_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_receiver_read_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_workspace_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_project_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_task_id"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_COMMENTED', 'TASK_MENTIONED', 'TASK_DUE_SOON', 'WORKSPACE_INVITED', 'WORKSPACE_MEMBER_JOINED', 'SPRINT_STARTED', 'SPRINT_COMPLETED', 'PAGE_MENTIONED', 'PAGE_SHARED', 'SYSTEM')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "archived_at"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "action_url"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "comment_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "sprint_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "task_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "project_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "source_type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_source_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "sender_type"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_sender_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "receiver_id"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "entity_id" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_entity_type_enum" AS ENUM('TASK', 'SPRINT', 'COMMENT', 'PAGE', 'WORKSPACE', 'PROJECT', 'INVITE')`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "entity_type" "public"."notifications_entity_type_enum"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_91fa0aebab77f3ac7568a364da" ON "notifications" ("user_id", "workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8385e7e4b0c91cfa308cba3f13" ON "notifications" ("read_at", "user_id", "workspace_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5ace4f24abe554acb1a919656" ON "notifications" ("entity_id", "entity_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `);
    }

}
