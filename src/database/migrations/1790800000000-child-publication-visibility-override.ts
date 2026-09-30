import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChildPublicationVisibilityOverride1790800000000 implements MigrationInterface {
  name = 'ChildPublicationVisibilityOverride1790800000000';

  async up(runner: QueryRunner): Promise<void> {
    // Existing rows were governed by the root setting. NULL keeps that policy.
    await runner.query(`ALTER TABLE "page_publications"
      ADD "visibility_override" varchar(11)`);
    await runner.query(`ALTER TABLE "page_publications"
      ADD CONSTRAINT "CK_page_publications_visibility_override" CHECK (
        (publication_type = 'INHERITED' OR visibility_override IS NULL)
        AND (visibility_override IS NULL OR visibility_override IN ('PUBLISHED', 'UNPUBLISHED'))
      )`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`ALTER TABLE "page_publications"
      DROP CONSTRAINT "CK_page_publications_visibility_override",
      DROP COLUMN "visibility_override"`);
  }
}
