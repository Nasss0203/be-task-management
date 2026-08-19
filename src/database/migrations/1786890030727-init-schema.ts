import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1786890030727 implements MigrationInterface {
    name = 'InitSchema1786890030727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."database_view_type_enum" AS ENUM('TABLE', 'BOARD', 'CALENDAR', 'LIST')`);
        await queryRunner.query(`CREATE TABLE "database_views" ("id" uuid NOT NULL, "database_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "type" "public"."database_view_type_enum" NOT NULL, "position" character varying(255) NOT NULL, CONSTRAINT "PK_5cb8297e534ee0d9cca1e606326" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "database_views" ADD CONSTRAINT "FK_ae2d6dd666ad2258ef7db5b38b9" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database_views" DROP CONSTRAINT "FK_ae2d6dd666ad2258ef7db5b38b9"`);
        await queryRunner.query(`DROP TABLE "database_views"`);
        await queryRunner.query(`DROP TYPE "public"."database_view_type_enum"`);
    }

}
