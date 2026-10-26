import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792874952503 implements MigrationInterface {
  name = 'UpdateSchema1792874952503';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"workspaces\" ADD \"icon\" character varying(100)");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"workspaces\" DROP COLUMN \"icon\"");
  }
}
