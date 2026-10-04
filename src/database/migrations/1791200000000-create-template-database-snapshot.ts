import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateDatabaseSnapshot1791200000000 implements MigrationInterface {
  name = 'CreateTemplateDatabaseSnapshot1791200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_template_database_properties_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."page_template_database_views_type_enum"`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."page_template_database_properties_type_enum" AS ENUM('TITLE', 'TEXT', 'NUMBER', 'SELECT', 'MULTI_SELECT', 'STATUS', 'DATE', 'CHECKBOX', 'PERSON', 'URL', 'EMAIL', 'PHONE', 'FILE', 'CREATED_TIME', 'UPDATED_TIME', 'CREATED_BY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."page_template_database_views_type_enum" AS ENUM('TABLE', 'BOARD', 'CALENDAR', 'LIST')`,
    );

    await queryRunner.query(`
      CREATE TABLE "page_template_databases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "version_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        CONSTRAINT "PK_page_template_databases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_databases_version" FOREIGN KEY ("version_id") REFERENCES "page_template_versions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_properties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_database_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "type" "public"."page_template_database_properties_type_enum" NOT NULL,
        "is_default" boolean NOT NULL DEFAULT false,
        "is_hideable" boolean NOT NULL DEFAULT true,
        "position" character varying(255) NOT NULL,
        CONSTRAINT "PK_page_template_database_properties" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_database_properties_database" FOREIGN KEY ("template_database_id") REFERENCES "page_template_databases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_property_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_property_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "color" character varying(50),
        "position" character varying(255) NOT NULL,
        CONSTRAINT "PK_page_template_database_property_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_database_property_options_property" FOREIGN KEY ("template_property_id") REFERENCES "page_template_database_properties"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_rows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_database_id" uuid NOT NULL,
        CONSTRAINT "PK_page_template_database_rows" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_database_rows_database" FOREIGN KEY ("template_database_id") REFERENCES "page_template_databases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_row_values" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_row_id" uuid NOT NULL,
        "template_property_id" uuid NOT NULL,
        "value" jsonb,
        CONSTRAINT "PK_page_template_database_row_values" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_database_row_values_row" FOREIGN KEY ("template_row_id") REFERENCES "page_template_database_rows"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_template_database_row_values_property" FOREIGN KEY ("template_property_id") REFERENCES "page_template_database_properties"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_views" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_database_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "type" "public"."page_template_database_views_type_enum" NOT NULL,
        "position" character varying(255) NOT NULL,
        CONSTRAINT "PK_page_template_database_views" PRIMARY KEY ("id"),
        CONSTRAINT "FK_page_template_database_views_database" FOREIGN KEY ("template_database_id") REFERENCES "page_template_databases"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "page_template_database_view_properties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_view_id" uuid NOT NULL,
        "template_property_id" uuid NOT NULL,
        "position" character varying(255) NOT NULL,
        "visible" boolean NOT NULL DEFAULT true,
        "width" integer,
        CONSTRAINT "PK_page_template_database_view_properties" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_page_template_database_view_properties_view_property" UNIQUE ("template_view_id", "template_property_id"),
        CONSTRAINT "FK_page_template_database_view_properties_view" FOREIGN KEY ("template_view_id") REFERENCES "page_template_database_views"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_page_template_database_view_properties_property" FOREIGN KEY ("template_property_id") REFERENCES "page_template_database_properties"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_databases_version_id" ON "page_template_databases" ("version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_properties_template_database_id" ON "page_template_database_properties" ("template_database_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_property_options_template_prop_id" ON "page_template_database_property_options" ("template_property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_rows_template_database_id" ON "page_template_database_rows" ("template_database_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_row_values_template_row_id" ON "page_template_database_row_values" ("template_row_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_row_values_template_property_id" ON "page_template_database_row_values" ("template_property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_views_template_database_id" ON "page_template_database_views" ("template_database_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_view_properties_template_view_id" ON "page_template_database_view_properties" ("template_view_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_page_template_database_view_properties_template_prop_id" ON "page_template_database_view_properties" ("template_property_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE "page_template_database_view_properties"`,
    );
    await queryRunner.query(`DROP TABLE "page_template_database_views"`);
    await queryRunner.query(`DROP TABLE "page_template_database_row_values"`);
    await queryRunner.query(`DROP TABLE "page_template_database_rows"`);
    await queryRunner.query(
      `DROP TABLE "page_template_database_property_options"`,
    );
    await queryRunner.query(`DROP TABLE "page_template_database_properties"`);
    await queryRunner.query(`DROP TABLE "page_template_databases"`);
    await queryRunner.query(
      `DROP TYPE "public"."page_template_database_views_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."page_template_database_properties_type_enum"`,
    );
  }
}
