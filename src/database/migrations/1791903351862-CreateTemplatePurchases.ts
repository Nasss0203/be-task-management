import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTemplatePurchases1791903351862 implements MigrationInterface {
  name = 'CreateTemplatePurchases1791903351862';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"template_purchases\" (\"id\" uuid NOT NULL, \"order_code\" character varying(34) NOT NULL, \"template_id\" uuid NOT NULL, \"listing_id\" uuid NOT NULL, \"buyer_id\" uuid NOT NULL, \"published_version_id\" uuid NOT NULL, \"amount\" bigint NOT NULL, \"currency\" character varying(3) NOT NULL, \"idempotency_key\" character varying(255) NOT NULL, \"status\" character varying(32) NOT NULL, \"provider\" character varying(16), \"entitlement_id\" uuid, \"expires_at\" TIMESTAMP WITH TIME ZONE NOT NULL, \"paid_at\" TIMESTAMP WITH TIME ZONE, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL, \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT \"CHK_template_purchases_currency\" CHECK (\"currency\" = 'VND'), CONSTRAINT \"CHK_template_purchases_amount\" CHECK (\"amount\" > 0 AND \"amount\" <= 9007199254740991), CONSTRAINT \"PK_36c766dd2149cbf8580fe3f32d7\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_template_purchases_template_id\" ON \"template_purchases\" (\"template_id\") ");
    await runner.query("CREATE UNIQUE INDEX \"UQ_template_purchases_buyer_id_idempotency_key\" ON \"template_purchases\" (\"buyer_id\", \"idempotency_key\") ");
    await runner.query("CREATE UNIQUE INDEX \"UQ_template_purchases_order_code\" ON \"template_purchases\" (\"order_code\") ");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_template_purchases_template_id\"");
    await runner.query("DROP INDEX \"public\".\"UQ_template_purchases_buyer_id_idempotency_key\"");
    await runner.query("DROP INDEX \"public\".\"UQ_template_purchases_order_code\"");
    await runner.query("DROP TABLE \"template_purchases\"");
  }
}
