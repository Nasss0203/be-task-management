import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTemplateV21791000000000 implements MigrationInterface {
  name = 'CreateCoreTemplateV21791000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // The legacy-template removal migration dropped its tables but retained
    // these orphaned enum types. Recreate them from the V2 domain definition.
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_template_blocks_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_template_versions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_templates_visibility_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_templates_status_enum"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."page_templates_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."page_templates_visibility_enum" AS ENUM('PRIVATE', 'WORKSPACE', 'PUBLIC')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."page_template_versions_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."page_template_blocks_type_enum" AS ENUM('TEXT', 'HEADER', 'QUOTE', 'DIVIDER', 'CODE', 'TODO', 'IMAGE', 'VIDEO', 'FILE', 'BOOKMARK', 'EMBED', 'FIGMA', 'GITHUB_GIST', 'GOOGLE_MAPS', 'TWEET', 'DATABASE_VIEW', 'TABLE_SIMPLE', 'MERMAID', 'BUTTON', 'TOGGLE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "page_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(255),
        "cover_url" text,
        "created_by" uuid NOT NULL,
        "status" "public"."page_templates_status_enum" NOT NULL DEFAULT 'DRAFT',
        "visibility" "public"."page_templates_visibility_enum" NOT NULL DEFAULT 'PRIVATE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_page_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_templates_workspace" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "version_number" integer NOT NULL,
        "status" "public"."page_template_versions_status_enum" NOT NULL DEFAULT 'DRAFT',
        "created_by" uuid NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_page_template_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_page_template_versions_template_id_version_number" UNIQUE ("template_id", "version_number"),
        CONSTRAINT "FK_page_template_versions_template" FOREIGN KEY ("template_id") REFERENCES "page_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_template_versions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version_id" uuid NOT NULL,
        "parent_block_id" uuid,
        "type" "public"."page_template_blocks_type_enum" NOT NULL,
        "title" character varying(255),
        "position_x" integer,
        "position_y" integer,
        "width" integer,
        "height" integer,
        "order_index" integer NOT NULL DEFAULT 0,
        "content" jsonb,
        "style_config" jsonb,
        "data_config" jsonb,
        "created_by" uuid NOT NULL,
        "is_open" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_page_template_blocks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_blocks_version" FOREIGN KEY ("version_id") REFERENCES "page_template_versions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_template_blocks_parent" FOREIGN KEY ("parent_block_id") REFERENCES "page_template_blocks"("id") ON DELETE NO ACTION,
        CONSTRAINT "FK_page_template_blocks_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_page_templates_workspace_id" ON "page_templates" ("workspace_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_templates_created_by" ON "page_templates" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_templates_status_visibility" ON "page_templates" ("status", "visibility")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_versions_template_id" ON "page_template_versions" ("template_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_versions_template_id_status" ON "page_template_versions" ("template_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_blocks_version_id" ON "page_template_blocks" ("version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_blocks_version_id_order_index" ON "page_template_blocks" ("version_id", "order_index")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_blocks_parent_block_id" ON "page_template_blocks" ("parent_block_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "page_template_blocks"`);
    await queryRunner.query(`DROP TABLE "page_template_versions"`);
    await queryRunner.query(`DROP TABLE "page_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."page_template_blocks_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."page_template_versions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."page_templates_visibility_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."page_templates_status_enum"`);
  }
}
