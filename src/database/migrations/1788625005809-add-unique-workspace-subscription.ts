import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueWorkspaceSubscription1788625005809 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_workspace_subscriptions_workspace_id"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_workspace_subscriptions_workspace_id"
       ON "workspace_subscriptions" ("workspace_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_workspace_subscriptions_workspace_id"`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_workspace_subscriptions_workspace_id"
       ON "workspace_subscriptions" ("workspace_id")`,
    );
  }
}
