import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1795449790001 implements MigrationInterface {
  name = 'UpdateSchema1795449790001';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"payment_orders\" ADD \"credit_amount\" bigint NOT NULL DEFAULT '0'");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"payment_orders\" DROP COLUMN \"credit_amount\"");
  }
}
