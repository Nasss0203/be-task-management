import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSprintDeadlineNotificationTypes1783500000000 implements MigrationInterface {
    name = 'AddSprintDeadlineNotificationTypes1783500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'SPRINT_DUE_SOON'`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'SPRINT_OVERDUE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Removing enum values in Postgres is not trivial.
        // It requires recreating the enum type, which is generally avoided in migration down scripts.
    }
}
