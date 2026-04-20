import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1776489561927 implements MigrationInterface {
    name = 'InitSchema1776489561927'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page_blocks" ADD "is_open" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "page_blocks" DROP COLUMN "is_open"`);
    }

}
