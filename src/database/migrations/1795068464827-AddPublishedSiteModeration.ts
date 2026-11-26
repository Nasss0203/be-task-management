import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublishedSiteModeration1795068464827 implements MigrationInterface {
  name = 'AddPublishedSiteModeration1795068464827';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"published_sites\" ADD \"moderation_disabled_at\" TIMESTAMP WITH TIME ZONE");
    await runner.query("ALTER TABLE \"published_sites\" ADD \"moderation_disabled_by\" uuid");
    await runner.query("ALTER TABLE \"published_sites\" ADD \"moderation_reason\" character varying(500)");
    await runner.query("ALTER TABLE \"published_sites\" ADD CONSTRAINT \"FK_published_sites_moderation_disabled_by\" FOREIGN KEY (\"moderation_disabled_by\") REFERENCES \"users\"(\"id\") ON DELETE SET NULL ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"published_sites\" DROP CONSTRAINT \"FK_published_sites_moderation_disabled_by\"");
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"moderation_reason\"");
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"moderation_disabled_by\"");
    await runner.query("ALTER TABLE \"published_sites\" DROP COLUMN \"moderation_disabled_at\"");
  }
}
