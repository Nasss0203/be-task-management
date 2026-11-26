import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSlackDeliveries1795550000000 implements MigrationInterface {
  name = 'CreateSlackDeliveries1795550000000';

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      `CREATE TABLE "slack_deliveries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "notification_id" uuid NOT NULL, "notification_type" character varying(64) NOT NULL, "title" character varying(200) NOT NULL, "status" character varying(16) NOT NULL, "error" character varying(32), "attempts" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_slack_deliveries" PRIMARY KEY ("id"))`,
    );
    await runner.query(
      `CREATE UNIQUE INDEX "UQ_slack_deliveries_user_notification" ON "slack_deliveries" ("user_id", "notification_id")`,
    );
    await runner.query(
      `CREATE INDEX "IDX_slack_deliveries_user_created_at" ON "slack_deliveries" ("user_id", "created_at")`,
    );
    await runner.query(
      `ALTER TABLE "slack_deliveries" ADD CONSTRAINT "FK_slack_deliveries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      `ALTER TABLE "slack_deliveries" DROP CONSTRAINT "FK_slack_deliveries_user"`,
    );
    await runner.query(
      `DROP INDEX "public"."IDX_slack_deliveries_user_created_at"`,
    );
    await runner.query(
      `DROP INDEX "public"."UQ_slack_deliveries_user_notification"`,
    );
    await runner.query(`DROP TABLE "slack_deliveries"`);
  }
}
