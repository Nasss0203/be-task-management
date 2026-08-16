import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1786791565431 implements MigrationInterface {
    name = 'InitSchema1786791565431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "database_row_values" ("id" uuid NOT NULL, "row_id" uuid NOT NULL, "property_id" uuid NOT NULL, "value" jsonb, CONSTRAINT "PK_fa36f0e9461a83049ff281c204a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "database_rows" ("id" uuid NOT NULL, "database_id" uuid NOT NULL, CONSTRAINT "PK_3e384659a989d40f847e13ce8c1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "database_row_values" ADD CONSTRAINT "FK_c44680d86391e4b06c34b611764" FOREIGN KEY ("row_id") REFERENCES "database_rows"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "database_row_values" ADD CONSTRAINT "FK_09b539c9049fd4dc3fa1655a17b" FOREIGN KEY ("property_id") REFERENCES "database_properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "database_rows" ADD CONSTRAINT "FK_3a87f5ae2bd2c8ed9c8a570f313" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database_rows" DROP CONSTRAINT "FK_3a87f5ae2bd2c8ed9c8a570f313"`);
        await queryRunner.query(`ALTER TABLE "database_row_values" DROP CONSTRAINT "FK_09b539c9049fd4dc3fa1655a17b"`);
        await queryRunner.query(`ALTER TABLE "database_row_values" DROP CONSTRAINT "FK_c44680d86391e4b06c34b611764"`);
        await queryRunner.query(`DROP TABLE "database_rows"`);
        await queryRunner.query(`DROP TABLE "database_row_values"`);
    }

}
