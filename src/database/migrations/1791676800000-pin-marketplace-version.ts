import { MigrationInterface, QueryRunner } from 'typeorm';

export class PinMarketplaceVersion1791676800000 implements MigrationInterface {
  name = 'PinMarketplaceVersion1791676800000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE "template_listings" ADD "published_version_id" uuid',
    );
    await q.query(
      'ALTER TABLE "page_template_versions" ADD CONSTRAINT "UQ_template_version_id_template" UNIQUE ("id", "template_id")',
    );
    await q.query(`UPDATE "template_listings" l SET "published_version_id" = (
      SELECT v.id FROM "page_template_versions" v WHERE v.template_id = l.template_id AND v.status = 'PUBLISHED'
      ORDER BY v.version_number DESC, v.id DESC LIMIT 1
    ) WHERE l.status = 'PUBLISHED'`);
    await q.query(
      'ALTER TABLE "template_listings" ADD CONSTRAINT "FK_listing_published_version_template" FOREIGN KEY ("published_version_id", "template_id") REFERENCES "page_template_versions" ("id", "template_id") ON DELETE NO ACTION',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE "template_listings" DROP CONSTRAINT "FK_listing_published_version_template"',
    );
    await q.query(
      'ALTER TABLE "template_listings" DROP COLUMN "published_version_id"',
    );
    await q.query(
      'ALTER TABLE "page_template_versions" DROP CONSTRAINT "UQ_template_version_id_template"',
    );
  }
}
