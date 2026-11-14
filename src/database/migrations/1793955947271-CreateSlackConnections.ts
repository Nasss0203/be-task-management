import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSlackConnections1793955947271 implements MigrationInterface {
  name = 'CreateSlackConnections1793955947271';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query("CREATE TABLE \"slack_connections\" (\"id\" uuid NOT NULL, \"user_id\" uuid NOT NULL, \"slack_team_id\" character varying(32) NOT NULL, \"slack_team_name\" character varying(255) NOT NULL, \"slack_user_id\" character varying(32) NOT NULL, \"bot_token_encrypted\" text NOT NULL, \"last_error\" character varying(64), \"created_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), \"updated_at\" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT \"PK_ab1d5525b5931e1f077e1fbbec6\" PRIMARY KEY (\"id\"))");
    await runner.query("CREATE UNIQUE INDEX \"UQ_slack_connections_user\" ON \"slack_connections\" (\"user_id\") ");
    await runner.query("ALTER TABLE \"slack_connections\" ADD CONSTRAINT \"FK_2fcd9289524c23b1dc0c4ed43d0\" FOREIGN KEY (\"user_id\") REFERENCES \"users\"(\"id\") ON DELETE CASCADE ON UPDATE NO ACTION");
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query("ALTER TABLE \"slack_connections\" DROP CONSTRAINT \"FK_2fcd9289524c23b1dc0c4ed43d0\"");
    await runner.query("DROP INDEX \"public\".\"UQ_slack_connections_user\"");
    await runner.query("DROP TABLE \"slack_connections\"");
  }
}
