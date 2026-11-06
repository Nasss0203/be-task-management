import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSlackConnectionsSlackUserUnique1793969608044 implements MigrationInterface {
  name = 'AddSlackConnectionsSlackUserUnique1793969608044';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE UNIQUE INDEX \"UQ_slack_connections_slack_user\" ON \"slack_connections\" (\"slack_team_id\", \"slack_user_id\") ");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("DROP INDEX \"public\".\"UQ_slack_connections_slack_user\"");
  }
}
