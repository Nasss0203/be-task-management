import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1792871101859 implements MigrationInterface {
  name = 'UpdateSchema1792871101859';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_rows\" ADD \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()");
    await runner.query("ALTER TABLE \"database_views\" ADD \"sorts\" jsonb NOT NULL DEFAULT '[]'");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"database_views\" DROP COLUMN \"sorts\"");
    await runner.query("ALTER TABLE \"database_rows\" DROP COLUMN \"created_at\"");
  }
}
