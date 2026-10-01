import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropLegacyTemplatesAndPageIsTemplate1790900000000 implements MigrationInterface {
  name = 'DropLegacyTemplatesAndPageIsTemplate1790900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop page_template_blocks
    await queryRunner.query('DROP TABLE IF EXISTS "page_template_blocks"');

    // 2. Drop page_templates
    await queryRunner.query('DROP TABLE IF EXISTS "page_templates"');

    // 3. Drop is_template from pages
    await queryRunner.query(
      'ALTER TABLE "pages" DROP COLUMN IF EXISTS "is_template"',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Recreate is_template column on pages
    await queryRunner.query(
      'ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "is_template" boolean NOT NULL DEFAULT false',
    );

    // 2. Recreate page_templates table and indexes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "page_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid,
        "name" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(100),
        "cover_url" text,
        "category" character varying(100),
        "is_system" boolean NOT NULL DEFAULT false,
        "created_by" uuid,
        "status" character varying NOT NULL DEFAULT 'DRAFT',
        "visibility" character varying NOT NULL DEFAULT 'PRIVATE',
        "use_count" integer NOT NULL DEFAULT 0,
        "likes_count" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_page_templates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_templates_workspace_id" ON "page_templates" ("workspace_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_templates_workspace_id_name" ON "page_templates" ("workspace_id", "name")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_templates_created_by" ON "page_templates" ("created_by")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_templates_is_system" ON "page_templates" ("is_system")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_templates_status_visibility" ON "page_templates" ("status", "visibility")',
    );

    // 3. Recreate page_template_blocks table and indexes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "page_template_blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "parent_block_id" uuid,
        "type" character varying(100) NOT NULL,
        "content" jsonb,
        "order_index" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_page_template_blocks" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_template_blocks_template_id" ON "page_template_blocks" ("template_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_template_blocks_template_id_order_index" ON "page_template_blocks" ("template_id", "order_index")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_page_template_blocks_parent_block_id" ON "page_template_blocks" ("parent_block_id")',
    );
  }
}
