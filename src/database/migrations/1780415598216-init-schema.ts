import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1780415598216 implements MigrationInterface {
    name = 'InitSchema1780415598216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pages" ADD "icon" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "pages" ADD "cover_url" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "cover_url"`);
        await queryRunner.query(`ALTER TABLE "pages" DROP COLUMN "icon"`);
    }

}
