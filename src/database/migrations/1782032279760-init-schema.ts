import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1782032279760 implements MigrationInterface {
    name = 'InitSchema1782032279760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" ADD "created_by" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "created_by"`);
    }

}
