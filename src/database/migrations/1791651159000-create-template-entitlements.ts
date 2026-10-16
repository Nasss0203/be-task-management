import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplateEntitlements1791651159000 implements MigrationInterface {
  name = 'CreateTemplateEntitlements1791651159000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."template_entitlements_source_enum" AS ENUM('FREE_CLAIM')`,
    );
    await queryRunner.query(`
      CREATE TABLE "template_entitlements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "template_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "source" "public"."template_entitlements_source_enum" NOT NULL DEFAULT 'FREE_CLAIM',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_template_entitlements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_template_entitlements_template_user" UNIQUE ("template_id", "user_id"),
        CONSTRAINT "FK_template_entitlements_template" FOREIGN KEY ("template_id") REFERENCES "page_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_template_entitlements_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "template_entitlements"`);
    await queryRunner.query(
      `DROP TYPE "public"."template_entitlements_source_enum"`,
    );
  }
}
