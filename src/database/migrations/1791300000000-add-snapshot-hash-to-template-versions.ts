import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSnapshotHashToTemplateVersions1791300000000 implements MigrationInterface {
  name = 'AddSnapshotHashToTemplateVersions1791300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "page_template_versions"
      ADD COLUMN "snapshot_hash" character varying(64) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "page_template_versions"
      DROP COLUMN "snapshot_hash"
    `);
  }
}
