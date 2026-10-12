import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaidTemplateOffer1791810000000 implements MigrationInterface {
  name = 'AddPaidTemplateOffer1791810000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
        WHERE n.nspname='public' AND t.typname='template_listings_offer_type_enum' AND t.typtype='e'
      ) OR EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace
        WHERE n.nspname='public' AND t.typname='template_listings_offer_type_enum' AND e.enumlabel NOT IN ('FREE','PAID')
      ) THEN RAISE EXCEPTION 'Template offer enum does not match the FREE/PAID baseline'; END IF;
    END $$`);
    await runner.query(
      `ALTER TYPE "public"."template_listings_offer_type_enum" ADD VALUE IF NOT EXISTS 'PAID'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL cannot remove an enum label without replacing its type.
    // Retain PAID; revert pricing first. An unused extra label is compatible
    // with the old application. Removing it requires a separate dependency audit.
  }
}
