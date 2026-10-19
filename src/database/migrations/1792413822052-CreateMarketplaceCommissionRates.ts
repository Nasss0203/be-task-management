import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceCommissionRates1792413822052 implements MigrationInterface {
  name = 'CreateMarketplaceCommissionRates1792413822052';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"marketplace_commission_rates\" (\"id\" uuid NOT NULL DEFAULT uuid_generate_v4(), \"rate_bps\" integer NOT NULL, \"created_by\" uuid NOT NULL, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"CHK_marketplace_commission_rates_rate_bps\" CHECK (\"rate_bps\" >= 0 AND \"rate_bps\" <= 10000), CONSTRAINT \"PK_marketplace_commission_rates\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_marketplace_commission_rates_created_at\" ON \"marketplace_commission_rates\" (\"created_at\") ");
    await runner.query("ALTER TABLE \"template_purchases\" ADD \"commission_rate_bps\" integer NOT NULL DEFAULT '0'");
    await runner.query("ALTER TABLE \"template_purchases\" ADD \"platform_fee_amount\" bigint NOT NULL DEFAULT '0'");
    await runner.query("ALTER TABLE \"template_purchases\" ADD CONSTRAINT \"CHK_template_purchases_platform_fee_amount\" CHECK (\"platform_fee_amount\" >= 0 AND \"platform_fee_amount\" <= \"amount\")");
    await runner.query("ALTER TABLE \"template_purchases\" ADD CONSTRAINT \"CHK_template_purchases_commission_rate_bps\" CHECK (\"commission_rate_bps\" >= 0 AND \"commission_rate_bps\" <= 10000)");
    await runner.query("ALTER TABLE \"marketplace_commission_rates\" ADD CONSTRAINT \"FK_marketplace_commission_rates_created_by\" FOREIGN KEY (\"created_by\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"marketplace_commission_rates\" DROP CONSTRAINT \"FK_marketplace_commission_rates_created_by\"");
    await runner.query("ALTER TABLE \"template_purchases\" DROP CONSTRAINT \"CHK_template_purchases_commission_rate_bps\"");
    await runner.query("ALTER TABLE \"template_purchases\" DROP CONSTRAINT \"CHK_template_purchases_platform_fee_amount\"");
    await runner.query("ALTER TABLE \"template_purchases\" DROP COLUMN \"platform_fee_amount\"");
    await runner.query("ALTER TABLE \"template_purchases\" DROP COLUMN \"commission_rate_bps\"");
    await runner.query("DROP INDEX \"public\".\"IDX_marketplace_commission_rates_created_at\"");
    await runner.query("DROP TABLE \"marketplace_commission_rates\"");
  }
}
