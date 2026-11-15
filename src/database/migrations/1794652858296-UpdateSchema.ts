import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1794652858296 implements MigrationInterface {
  name = 'UpdateSchema1794652858296';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"slack_connections\" ADD \"granted_scopes\" text");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"slack_connections\" DROP COLUMN \"granted_scopes\"");
  }
}
