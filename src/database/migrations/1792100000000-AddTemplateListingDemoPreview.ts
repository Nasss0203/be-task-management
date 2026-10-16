import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateListingDemoPreview1792100000000 implements MigrationInterface {
  name = 'AddTemplateListingDemoPreview1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template_listings" ADD "demo_version_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_listings" ADD "demo_config" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template_listings" DROP COLUMN "demo_config"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_listings" DROP COLUMN "demo_version_id"`,
    );
  }
}
