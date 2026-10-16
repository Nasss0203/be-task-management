import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTemplateListingPreviewMode1792050000000 implements MigrationInterface {
  name = 'AddTemplateListingPreviewMode1792050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."template_listings_preview_mode_enum" AS ENUM('IMAGE', 'INTERACTIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_listings" ADD "preview_mode" "public"."template_listings_preview_mode_enum" NOT NULL DEFAULT 'IMAGE'`,
    );
    await queryRunner.query(
      `UPDATE "template_listings" SET "preview_mode" = 'INTERACTIVE' WHERE "offer_type" = 'FREE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template_listings" DROP COLUMN "preview_mode"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."template_listings_preview_mode_enum"`,
    );
  }
}
