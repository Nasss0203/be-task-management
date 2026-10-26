import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792910799027 implements MigrationInterface {
  name = 'UpdateSchema1792910799027';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_views\" ADD \"filters\" jsonb NOT NULL DEFAULT '[]'");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_views\" DROP COLUMN \"filters\"");
  }
}
