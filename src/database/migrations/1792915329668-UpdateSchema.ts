import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792915329668 implements MigrationInterface {
  name = 'UpdateSchema1792915329668';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_rows\" ADD \"position\" double precision NOT NULL DEFAULT '0'");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_rows\" DROP COLUMN \"position\"");
  }
}
