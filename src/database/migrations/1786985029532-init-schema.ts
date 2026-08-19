import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1786985029532 implements MigrationInterface {
  name = 'InitSchema1786985029532';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "database_view_properties" ("id" uuid NOT NULL, "view_id" uuid NOT NULL, "property_id" uuid NOT NULL, "position" character varying NOT NULL, "visible" boolean NOT NULL DEFAULT true, "width" integer, CONSTRAINT "UQ_database_view_property_view_property" UNIQUE ("view_id", "property_id"), CONSTRAINT "PK_69606f35f29931b5ec0e07aea19" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "database_view_properties" ADD CONSTRAINT "FK_2ba1e95c23a8e3c0ce594cd1d1c" FOREIGN KEY ("view_id") REFERENCES "database_views"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "database_view_properties" ADD CONSTRAINT "FK_8759eb89fcb1d459d206ab0c1b4" FOREIGN KEY ("property_id") REFERENCES "database_properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "database_view_properties" DROP CONSTRAINT "FK_8759eb89fcb1d459d206ab0c1b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "database_view_properties" DROP CONSTRAINT "FK_2ba1e95c23a8e3c0ce594cd1d1c"`,
    );
    await queryRunner.query(`DROP TABLE "database_view_properties"`);
  }
}
