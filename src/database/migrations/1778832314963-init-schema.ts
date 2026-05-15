import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778832314963 implements MigrationInterface {
    name = 'InitSchema1778832314963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_SPRINTS_PROJECT_ACTIVE"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_SPRINTS_PROJECT_ACTIVE" ON "sprints" ("project_id") WHERE ((status = 'ACTIVE'::sprints_status_enum) AND (deleted_at IS NULL))`);
    }

}
