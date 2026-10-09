import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateListings1791500000000 implements MigrationInterface {
  name = 'CreateTemplateListings1791500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."template_listings_offer_type_enum" AS ENUM('FREE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."template_listings_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "template_listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "offer_type" "public"."template_listings_offer_type_enum" NOT NULL DEFAULT 'FREE',
        "status" "public"."template_listings_status_enum" NOT NULL DEFAULT 'DRAFT',
        "created_by" uuid NOT NULL,
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_listings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_listings_template_id" UNIQUE ("template_id"),
        CONSTRAINT "FK_template_listings_template" FOREIGN KEY ("template_id") REFERENCES "page_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_template_listings_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_template_listings_template_id" ON "template_listings" ("template_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_template_listings_created_by" ON "template_listings" ("created_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_template_listings_status" ON "template_listings" ("status")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "template_listings"`);
    await queryRunner.query(
      `DROP TYPE "public"."template_listings_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."template_listings_offer_type_enum"`,
    );
  }
}
