import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSourcePageToPageTemplates1791100000000 implements MigrationInterface {
  name = 'AddSourcePageToPageTemplates1791100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "page_templates" ADD "source_page_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_templates" ADD CONSTRAINT "FK_page_templates_source_page" FOREIGN KEY ("source_page_id") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_templates_source_page_id" ON "page_templates" ("source_page_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_page_templates_source_page_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_templates" DROP CONSTRAINT "FK_page_templates_source_page"`,
    );
    await queryRunner.query(
      `ALTER TABLE "page_templates" DROP COLUMN "source_page_id"`,
    );
  }
}
