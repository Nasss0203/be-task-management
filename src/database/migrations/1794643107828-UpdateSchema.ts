import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSchema1794643107828 implements MigrationInterface {
  name = 'UpdateSchema1794643107828';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_244c5f17089416157f6dc9190f\"");
    await runner.query("ALTER TABLE \"attachments\" DROP COLUMN \"task_id\"");
    await runner.query("ALTER TABLE \"slack_connections\" ADD \"last_delivered_at\" TIMESTAMP WITH TIME ZONE");
    await runner.query("ALTER TABLE \"slack_connections\" ADD \"last_delivery_failed_at\" TIMESTAMP WITH TIME ZONE");
    await runner.query("ALTER TABLE \"slack_connections\" ADD \"last_delivery_error\" character varying(32)");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"slack_connections\" DROP COLUMN \"last_delivery_error\"");
    await runner.query("ALTER TABLE \"slack_connections\" DROP COLUMN \"last_delivery_failed_at\"");
    await runner.query("ALTER TABLE \"slack_connections\" DROP COLUMN \"last_delivered_at\"");
    await runner.query("ALTER TABLE \"attachments\" ADD \"task_id\" uuid");
    await runner.query("CREATE INDEX \"IDX_244c5f17089416157f6dc9190f\" ON \"attachments\" (\"task_id\", \"workspace_id\") ");
  }
}
