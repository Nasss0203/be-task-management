import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateVersionAssets1791400000000 implements MigrationInterface {
  name = 'CreateTemplateVersionAssets1791400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."template_version_assets_asset_type_enum" AS ENUM('THUMBNAIL', 'OPEN_GRAPH', 'PREVIEW_IMAGE', 'EXPORT_IMAGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."template_version_assets_provider_enum" AS ENUM('S3', 'CLOUDINARY', 'R2')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."template_version_assets_status_enum" AS ENUM('PENDING', 'READY', 'FAILED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "template_version_assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_version_id" uuid NOT NULL,
        "asset_type" "public"."template_version_assets_asset_type_enum" NOT NULL,
        "provider" "public"."template_version_assets_provider_enum" NOT NULL,
        "storage_key" text NOT NULL,
        "mime_type" character varying(150),
        "file_size" bigint,
        "width" integer,
        "height" integer,
        "status" "public"."template_version_assets_status_enum" NOT NULL DEFAULT 'PENDING',
        "generated_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_version_assets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_version_assets_version_id_asset_type" UNIQUE ("template_version_id", "asset_type"),
        CONSTRAINT "FK_template_version_assets_template_version" FOREIGN KEY ("template_version_id") REFERENCES "page_template_versions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_template_version_assets_template_version_id" ON "template_version_assets" ("template_version_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "template_version_assets"`);
    await queryRunner.query(
      `DROP TYPE "public"."template_version_assets_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."template_version_assets_provider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."template_version_assets_asset_type_enum"`,
    );
  }
}
