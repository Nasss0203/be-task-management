import { MigrationInterface, QueryRunner } from 'typeorm';

export const TEMPLATE_PRICING_CHECK = `"currency" = 'VND' AND "price_amount" BETWEEN 0 AND 9007199254740991 AND (("offer_type" = 'FREE' AND "price_amount" = 0) OR ("offer_type" = 'PAID' AND "price_amount" > 0))`;

export class AddTemplateListingPricing1791810001000 implements MigrationInterface {
  name = 'AddTemplateListingPricing1791810001000';

  async up(runner: QueryRunner): Promise<void> {
    // This also rejects --transaction all when PAID was added in this transaction.
    await runner.query(
      `SELECT 'PAID'::"public"."template_listings_offer_type_enum"`,
    );
    await runner.query(
      `LOCK TABLE "public"."template_listings" IN ACCESS EXCLUSIVE MODE`,
    );
    await runner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "public"."template_listings" WHERE "offer_type"::text <> 'FREE') THEN
        RAISE EXCEPTION 'Pricing backfill requires FREE-only listings; audit existing PAID data first';
      END IF;
    END $$`);
    await runner.query(`ALTER TABLE "public"."template_listings"
      ADD COLUMN "price_amount" bigint NOT NULL DEFAULT 0,
      ADD COLUMN "currency" varchar(3) NOT NULL DEFAULT 'VND'`);
    // Constant defaults backfill existing FREE rows without rewriting other data.
    await runner.query(
      `ALTER TABLE "public"."template_listings" ADD CONSTRAINT "CHK_template_listings_pricing" CHECK (${TEMPLATE_PRICING_CHECK})`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `LOCK TABLE "public"."template_listings" IN ACCESS EXCLUSIVE MODE`,
    );
    await runner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "public"."template_listings" WHERE "offer_type"::text <> 'FREE' OR "price_amount" <> 0 OR "currency" <> 'VND') THEN
        RAISE EXCEPTION 'Cannot revert pricing while paid/non-default pricing data exists';
      END IF;
    END $$`);
    await runner.query(`ALTER TABLE "public"."template_listings"
      DROP CONSTRAINT "CHK_template_listings_pricing",
      DROP COLUMN "currency", DROP COLUMN "price_amount"`);
  }
}
