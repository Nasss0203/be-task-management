import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxDeliveries1792500000002 implements MigrationInterface {
  name = 'CreateOutboxDeliveries1792500000002';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE "outbox_deliveries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "delivery_key" varchar(100) NOT NULL,
        "event_type" varchar(100) NOT NULL,
        "event_version" integer NOT NULL,
        "aggregate_id" uuid NOT NULL,
        "channel" varchar(32) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'PENDING',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "next_attempt_at" timestamptz NOT NULL DEFAULT now(),
        "locked_until" timestamptz,
        "locked_by" uuid,
        "processed_at" timestamptz,
        "last_error" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbox_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_outbox_deliveries_status" CHECK ("status" IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED')),
        CONSTRAINT "CHK_outbox_deliveries_channel" CHECK ("channel" IN ('IN_APP_NOTIFICATION', 'EMAIL')),
        CONSTRAINT "CHK_outbox_deliveries_attempt_count" CHECK ("attempt_count" >= 0)
      )
    `);
    await runner.query(`CREATE UNIQUE INDEX "UQ_outbox_deliveries_delivery_key" ON "outbox_deliveries" ("delivery_key")`);
    await runner.query(`CREATE INDEX "IDX_outbox_deliveries_due" ON "outbox_deliveries" ("status", "next_attempt_at")`);
    await runner.query(`CREATE INDEX "IDX_outbox_deliveries_lease" ON "outbox_deliveries" ("status", "locked_until")`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP INDEX "IDX_outbox_deliveries_lease"`);
    await runner.query(`DROP INDEX "IDX_outbox_deliveries_due"`);
    await runner.query(`DROP INDEX "UQ_outbox_deliveries_delivery_key"`);
    await runner.query(`DROP TABLE "outbox_deliveries"`);
  }
}

