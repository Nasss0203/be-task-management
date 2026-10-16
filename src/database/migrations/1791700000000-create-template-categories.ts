import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateCategories1791700000000
  implements MigrationInterface
{
  name = 'CreateTemplateCategories1791700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "template_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_categories_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_template_categories_is_active_sort_order"
      ON "template_categories" ("is_active", "sort_order")
    `);

    await queryRunner.query(`
      CREATE TABLE "template_listing_categories" (
        "listing_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_template_listing_categories" PRIMARY KEY ("listing_id", "category_id"),
        CONSTRAINT "FK_template_listing_categories_listing"
          FOREIGN KEY ("listing_id")
          REFERENCES "template_listings"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_template_listing_categories_category"
          FOREIGN KEY ("category_id")
          REFERENCES "template_categories"("id")
          ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_template_listing_categories_category_id"
      ON "template_listing_categories" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_template_listing_categories_listing_id"
      ON "template_listing_categories" ("listing_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "template_listing_categories"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "template_categories"`);
  }
}
