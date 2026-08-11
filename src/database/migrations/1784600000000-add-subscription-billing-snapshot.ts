import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionBillingSnapshot1784600000000
  implements MigrationInterface
{
  name = 'AddSubscriptionBillingSnapshot1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "amount" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "currency" character varying(10) NOT NULL DEFAULT 'VND'
    `);

    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "billing_interval" "public"."plans_billing_interval_enum" NOT NULL DEFAULT 'MONTH'
    `);

    await queryRunner.query(`
      UPDATE "subscriptions" AS sub
      SET
        "amount" = COALESCE(
          (
            SELECT payment."amount"
            FROM "payments" payment
            WHERE payment."subscription_id" = sub."id"
              AND payment."status" = 'SUCCEEDED'
            ORDER BY payment."paid_at" DESC NULLS LAST, payment."created_at" DESC
            LIMIT 1
          ),
          plan."price_amount",
          0
        ),
        "currency" = COALESCE(
          (
            SELECT payment."currency"
            FROM "payments" payment
            WHERE payment."subscription_id" = sub."id"
              AND payment."status" = 'SUCCEEDED'
            ORDER BY payment."paid_at" DESC NULLS LAST, payment."created_at" DESC
            LIMIT 1
          ),
          plan."currency",
          'VND'
        ),
        "billing_interval" = COALESCE(
          plan."billing_interval",
          'MONTH'
        )
      FROM "plans" plan
      WHERE plan."id" = sub."plan_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "billing_interval"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "currency"
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "amount"
    `);
  }
}
