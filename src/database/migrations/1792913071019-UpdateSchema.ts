import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792913071019 implements MigrationInterface {
  name = 'UpdateSchema1792913071019';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_views\" ADD \"group_by\" uuid");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_views\" DROP COLUMN \"group_by\"");
  }
}
