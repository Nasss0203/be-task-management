import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1795532344342 implements MigrationInterface {
  name = 'UpdateSchema1795532344342';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"published_sites\" ADD \"seo_title\" character varying(70)");
    await runner.query("ALTER TABLE \"published_sites\" ADD \"seo_description\" character varying(200)");
    await runner.query("ALTER TABLE \"published_sites\" ADD \"search_indexing\" boolean NOT NULL DEFAULT false");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"search_indexing\"");
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"seo_description\"");
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"seo_title\"");
  }
}
