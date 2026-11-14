import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionBillingContactAndExpiryNotice1794200000000 implements MigrationInterface {
  name = 'AddSubscriptionBillingContactAndExpiryNotice1794200000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "workspace_subscriptions" ADD COLUMN IF NOT EXISTS "billing_contact_user_id" uuid`,
    );
    await runner.query(
      `ALTER TABLE "workspace_subscriptions" ADD COLUMN IF NOT EXISTS "expiry_notice_sent_on" date`,
    );
    await runner.query(`
      UPDATE "workspace_subscriptions" s
      SET "billing_contact_user_id" = latest."created_by"
      FROM (
        SELECT DISTINCT ON (o."subscription_id") o."subscription_id", o."created_by"
        FROM "payment_orders" o
        WHERE o."status" = 'PAID' AND o."subscription_id" IS NOT NULL
        ORDER BY o."subscription_id", o."paid_at" DESC NULLS LAST, o."created_at" DESC
      ) latest
      WHERE latest."subscription_id" = s."id"
        AND s."plan_price_id" IS NOT NULL
        AND s."billing_contact_user_id" IS NULL
    `);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "workspace_subscriptions" DROP COLUMN IF EXISTS "expiry_notice_sent_on"`,
    );
    await runner.query(
      `ALTER TABLE "workspace_subscriptions" DROP COLUMN IF EXISTS "billing_contact_user_id"`,
    );
  }
}
