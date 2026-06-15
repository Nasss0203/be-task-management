import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1781454398591 implements MigrationInterface {
    name = 'InitSchema1781454398591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_comments" DROP COLUMN "deleted_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_comments" ADD "deleted_at" TIMESTAMP`);
    }

}
