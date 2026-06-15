import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeBillingProvider1781450000000
  implements MigrationInterface
{
  name = 'AddStripeBillingProvider1781450000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."subscriptions_provider_enum" ADD VALUE IF NOT EXISTS 'STRIPE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payments_provider_enum" ADD VALUE IF NOT EXISTS 'STRIPE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."billing_webhooks_provider_enum" ADD VALUE IF NOT EXISTS 'STRIPE'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL enum values are intentionally not removed automatically.
  }
}
