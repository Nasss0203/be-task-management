import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceWebhookEvents1791986191301 implements MigrationInterface {
  name = 'CreateMarketplaceWebhookEvents1791986191301';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"marketplace_webhook_events\" (\"id\" uuid NOT NULL, \"provider\" character varying(16) NOT NULL, \"provider_event_id\" character varying(255) NOT NULL, \"event_type\" character varying(255) NOT NULL, \"payload\" jsonb NOT NULL, \"status\" character varying(32) NOT NULL DEFAULT 'PENDING', \"processed_at\" TIMESTAMP WITH TIME ZONE, \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"UQ_marketplace_webhook_events_provider_event\" UNIQUE (\"provider\", \"provider_event_id\"), CONSTRAINT \"PK_2890ec2318346047b40dd469d85\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE INDEX \"IDX_marketplace_webhook_events_status\" ON \"marketplace_webhook_events\" (\"status\") ");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"IDX_marketplace_webhook_events_status\"");
    await runner.query("DROP TABLE \"marketplace_webhook_events\"");
  }
}
