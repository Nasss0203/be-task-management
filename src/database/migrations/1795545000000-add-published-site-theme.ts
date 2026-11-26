import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublishedSiteTheme1795545000000 implements MigrationInterface {
  name = 'AddPublishedSiteTheme1795545000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "published_sites" ADD "logo_attachment_id" uuid`,
    );
    await runner.query(
      `ALTER TABLE "published_sites" ADD "favicon_attachment_id" uuid`,
    );
    await runner.query(
      `ALTER TABLE "published_sites" ADD "accent_color" character varying(7)`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "published_sites" DROP COLUMN "accent_color"`,
    );
    await runner.query(
      `ALTER TABLE "published_sites" DROP COLUMN "favicon_attachment_id"`,
    );
    await runner.query(
      `ALTER TABLE "published_sites" DROP COLUMN "logo_attachment_id"`,
    );
  }
}
